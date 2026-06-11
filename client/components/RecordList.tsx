import type { BundleDTO, CategoryDTO, RecordDTO, TagDTO } from "../api/types";
import { BundleRow } from "./BundleRow";
import { RecordRow } from "./RecordRow";

export type RecordGroupKey = "unpaid" | "paid" | "bundle";

export type RecordListProps = {
  records: RecordDTO[];
  bundles: BundleDTO[];
  tags: TagDTO[];
  categories: CategoryDTO[];
  bundleOn: boolean;
  expandedBundle: string | null;
  onToggleBundle: (description: string) => void;
  onEditRecord: (recordId: number) => void;
};

const fallbackCategory: CategoryDTO = { id: 0, name: "", signMode: "free", isSystem: false, sortOrder: 0 };

export function RecordList({ records, bundles, tags, categories, bundleOn, expandedBundle, onToggleBundle, onEditRecord }: RecordListProps) {
  const bundledIds = new Set(bundleOn ? bundles.flatMap((bundle) => bundle.recordIds) : []);
  const visibleRecords = records.filter((record) => !bundledIds.has(record.id));
  const unpaid = visibleRecords.filter((record) => !record.paid);
  const paid = visibleRecords.filter((record) => record.paid);
  const activeBundles = bundleOn ? bundles.filter((bundle) => bundle.recordIds.length > 1) : [];
  const isEmpty = records.length === 0 && activeBundles.length === 0;

  function row(record: RecordDTO) {
    return (
      <RecordRow
        key={record.id}
        record={record}
        tag={tags.find((tag) => tag.id === record.tagId) ?? null}
        category={categories.find((category) => category.id === record.categoryId) ?? { ...fallbackCategory, id: record.categoryId }}
        onClick={onEditRecord}
      />
    );
  }

  return (
    <section data-testid="record-list" className="card record-list">
      {unpaid.length > 0 && <div className="group-label">予定</div>}
      {unpaid.map(row)}
      {paid.length > 0 && <div className="group-label">確定</div>}
      {paid.map(row)}
      {activeBundles.length > 0 && <div className="group-label">bundle</div>}
      {activeBundles.map((bundle) => (
        <BundleRow key={bundle.description} bundle={bundle} expanded={expandedBundle === bundle.description} onToggle={onToggleBundle}>
          {records.filter((record) => bundle.recordIds.includes(record.id)).map(row)}
        </BundleRow>
      ))}
      {isEmpty && <div data-testid="empty-records" className="empty-state">この月の記録はまだありません</div>}
    </section>
  );
}
