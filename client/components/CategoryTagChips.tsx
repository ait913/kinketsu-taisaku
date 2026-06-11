import type { CategoryDTO, GroupCategoryTotal, GroupTagTotal, TagDTO } from "../api/types";
import { yen } from "./format";

export type ChipFilterTarget = { kind: "tag"; tagId: number } | { kind: "category"; categoryId: number } | null;

export type CategoryTagChipsProps = {
  byTag: GroupTagTotal[];
  byCategory: GroupCategoryTotal[];
  tags: TagDTO[];
  categories: CategoryDTO[];
  selected: ChipFilterTarget;
  onSelect: (target: ChipFilterTarget) => void;
};

function sameTarget(a: ChipFilterTarget, b: ChipFilterTarget) {
  if (!a || !b || a.kind !== b.kind) return false;
  return a.kind === "tag" ? a.tagId === (b as { kind: "tag"; tagId: number }).tagId : a.categoryId === (b as { kind: "category"; categoryId: number }).categoryId;
}

export function CategoryTagChips({ byTag, byCategory, tags, categories, selected, onSelect }: CategoryTagChipsProps) {
  const selectedTag = selected?.kind === "tag" ? tags.find((tag) => tag.id === selected.tagId) : null;
  const selectedCategory = selected?.kind === "category" ? categories.find((category) => category.id === selected.categoryId) : null;
  const selectedTotal = selected?.kind === "tag"
    ? byTag.find((item) => item.tagId === selected.tagId)?.all
    : selected?.kind === "category"
      ? byCategory.find((item) => item.categoryId === selected.categoryId)?.all
      : null;
  const selectedColor = selectedTag?.color ?? (selectedCategory ? "var(--color-move)" : "var(--color-line)");
  const selectedName = selectedTag?.name ?? selectedCategory?.name ?? "";

  function toggle(target: Exclude<ChipFilterTarget, null>) {
    onSelect(sameTarget(selected, target) ? null : target);
  }

  return (
    <section data-testid="category-tag-chips" className="chip-section">
      <div className="chip-wrap">
        {byCategory.map((item) => {
          const category = categories.find((cat) => cat.id === item.categoryId);
          if (!category) return null;
          return (
            <button
              key={`category-${item.categoryId}`}
              data-testid={`chip-category-${item.categoryId}`}
              className={`chip card--chip press ${sameTarget(selected, { kind: "category", categoryId: item.categoryId }) ? "active" : ""}`}
              onClick={() => toggle({ kind: "category", categoryId: item.categoryId })}
            >
              <span className="chip-dot category-dot" />{category.name}
            </button>
          );
        })}
        {byTag.map((item) => {
          const tag = tags.find((candidate) => candidate.id === item.tagId);
          if (!tag) return null;
          return (
            <button
              key={`tag-${item.tagId}`}
              data-testid={`chip-tag-${item.tagId}`}
              className={`chip card--chip press ${sameTarget(selected, { kind: "tag", tagId: item.tagId }) ? "active" : ""}`}
              onClick={() => toggle({ kind: "tag", tagId: item.tagId })}
            >
              <span className="chip-dot" style={{ backgroundColor: tag.color ?? "var(--color-move)" }} />{tag.name}
            </button>
          );
        })}
      </div>
      <div className={selected ? "collapsible active" : "collapsible"}>
        <div>
          <div data-testid="chip-choice" className="chip-choice">
            <span className="choice-bar" style={{ backgroundColor: selectedColor }} />
            <strong>{selectedName}</strong>
            <span className={(selectedTotal ?? 0) >= 0 ? "amount income" : "amount expense"}>{yen(selectedTotal ?? 0)}</span>
            <button data-testid="chip-clear" className="chip-clear press" onClick={() => onSelect(null)} aria-label="解除">×</button>
          </div>
        </div>
      </div>
    </section>
  );
}
