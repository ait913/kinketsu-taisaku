import { useEffect, useState } from "react";
import type { CategoryDTO, TagDTO, TagInput } from "../api/types";
import { SegmentedControl } from "./SegmentedControl";
import { Sheet } from "./Sheet";

const palette = [
  "var(--color-income)",
  "var(--color-move)",
  "var(--color-expense)",
  "var(--color-text-muted)",
  "var(--blob-from)",
  "var(--blob-to)",
];

type TagSheetProps = {
  open: boolean;
  tag: TagDTO | null;
  categories: CategoryDTO[];
  saving: boolean;
  deleting: boolean;
  onDismiss: () => void;
  onSave: (input: TagInput) => void;
  onDelete: (tagId: number) => void;
};

export function TagSheet({ open, tag, categories, saving, deleting, onDismiss, onSave, onDelete }: TagSheetProps) {
  const firstCategoryId = categories[0]?.id ?? 0;
  const [categoryId, setCategoryId] = useState(firstCategoryId);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategoryId(tag?.categoryId ?? firstCategoryId);
    setName(tag?.name ?? "");
    setColor(tag?.color ?? null);
  }, [firstCategoryId, open, tag]);

  return (
    <Sheet open={open} onDismiss={onDismiss} title={tag ? "タグを編集" : "タグを追加"} rightAction={{ label: saving ? "保存中" : "保存", onClick: () => onSave({ categoryId, name, color }) }}>
      <div className="sheet-body">
        <div className="field">
          <span className="field-label">カテゴリ</span>
          <SegmentedControl
            field="category"
            value={categoryId}
            options={categories.map((category) => ({ value: category.id, label: category.name, testId: `segment-category-${category.id}` }))}
            onChange={setCategoryId}
          />
        </div>
        <label className="field"><span className="field-label">名前</span><input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} /></label>
        <div className="field"><span className="field-label">色</span><div className="palette">
          <button type="button" className={color === null ? "swatch active" : "swatch"} onClick={() => setColor(null)}>なし</button>
          {palette.map((swatch) => <button key={swatch} type="button" aria-label={swatch} className={color === swatch ? "swatch active" : "swatch"} style={{ backgroundColor: swatch }} onClick={() => setColor(swatch)} />)}
        </div></div>
        {tag && <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(tag.id)}>{deleting ? "削除中" : "削除"}</button>}
      </div>
    </Sheet>
  );
}
