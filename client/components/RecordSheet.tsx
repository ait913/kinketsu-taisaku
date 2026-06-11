import { useEffect, useMemo, useState } from "react";
import type { CategoryDTO, RecordDTO, RecordInput, TagDTO } from "../api/types";
import { SegmentedControl } from "./SegmentedControl";
import { Sheet } from "./Sheet";

type RecordSheetProps = {
  open: boolean;
  record: RecordDTO | null;
  yearMonth: string;
  categories: CategoryDTO[];
  tags: TagDTO[];
  saving: boolean;
  deleting: boolean;
  onDismiss: () => void;
  onSave: (input: RecordInput) => void;
  onDelete: (recordId: number) => void;
};

function defaultDate(yearMonth: string) {
  return `${yearMonth}-01`;
}

export function RecordSheet({ open, record, yearMonth, categories, tags, saving, deleting, onDismiss, onSave, onDelete }: RecordSheetProps) {
  const firstCategoryId = categories[0]?.id ?? 0;
  const [date, setDate] = useState(defaultDate(yearMonth));
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(firstCategoryId);
  const [tagId, setTagId] = useState("");
  const [description, setDescription] = useState("");
  const [paid, setPaid] = useState(true);

  useEffect(() => {
    if (!open) return;
    setDate(record?.date ?? defaultDate(yearMonth));
    setAmount(String(record?.signedAmount ?? 0));
    setCategoryId(record?.categoryId ?? firstCategoryId);
    setTagId(record?.tagId == null ? "" : String(record.tagId));
    setDescription(record?.description ?? "");
    setPaid(record?.paid ?? true);
  }, [firstCategoryId, open, record, yearMonth]);

  const selectableTags = useMemo(() => tags.filter((tag) => tag.categoryId === categoryId), [categoryId, tags]);
  const tagSegmentValue = tagId || "none";

  function submit() {
    onSave({
      date,
      amount: Number(amount),
      categoryId,
      tagId: tagId ? Number(tagId) : null,
      description,
      paid,
    });
  }

  return (
    <Sheet open={open} onDismiss={onDismiss} title={record ? "記録を編集" : "記録を追加"} rightAction={{ label: saving ? "保存中" : "保存", onClick: submit }}>
      <div className="sheet-body">
        <label className="field"><span className="field-label">日付</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field"><span className="field-label">金額</span><input inputMode="numeric" type="number" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <div className="field">
          <span className="field-label">カテゴリ</span>
          <SegmentedControl
            field="category"
            value={categoryId}
            options={categories.map((category) => ({ value: category.id, label: category.name, testId: `segment-category-${category.id}` }))}
            onChange={(nextCategoryId) => { setCategoryId(nextCategoryId); setTagId(""); }}
          />
        </div>
        <div className="field">
          <span className="field-label">タグ</span>
          <SegmentedControl
            field="tag"
            value={tagSegmentValue}
            options={[
              { value: "none", label: "未指定", testId: "segment-tag-none" },
              ...selectableTags.map((tag) => ({ value: String(tag.id), label: tag.name, testId: `segment-tag-${tag.id}` })),
            ]}
            onChange={(nextTagId) => setTagId(nextTagId === "none" ? "" : nextTagId)}
          />
        </div>
        <label className="field"><span className="field-label">説明</span><input value={description} maxLength={200} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="field">
          <span className="field-label">状態</span>
          <SegmentedControl
            field="paid"
            value={paid ? "paid" : "not"}
            options={[
              { value: "paid", label: "確定", testId: "segment-paid-paid" },
              { value: "not", label: "未確定", testId: "segment-paid-not" },
            ]}
            onChange={(nextPaid) => setPaid(nextPaid === "paid")}
          />
        </div>
        {record && <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(record.id)}>{deleting ? "削除中" : "削除"}</button>}
      </div>
    </Sheet>
  );
}
