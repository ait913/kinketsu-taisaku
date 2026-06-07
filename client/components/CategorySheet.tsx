import { useEffect, useState } from "react";
import type { CategoryDTO, CategoryInput } from "../api/types";
import { Sheet } from "./Sheet";

type CategorySheetProps = {
  open: boolean;
  category: CategoryDTO | null;
  saving: boolean;
  deleting: boolean;
  onDismiss: () => void;
  onSave: (input: CategoryInput) => void;
  onDelete: (categoryId: number) => void;
};

export function CategorySheet({ open, category, saving, deleting, onDismiss, onSave, onDelete }: CategorySheetProps) {
  const [name, setName] = useState("");
  const [signMode, setSignMode] = useState<CategoryInput["signMode"]>("free");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setSignMode(category?.signMode ?? "free");
  }, [category, open]);

  return (
    <Sheet open={open} onDismiss={onDismiss} title={category ? "カテゴリを編集" : "カテゴリを追加"} rightAction={{ label: saving ? "保存中" : "保存", onClick: () => onSave({ name, signMode }) }}>
      <div className="sheet-body">
        <label className="field">名前<input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field">符号<select value={signMode} disabled={category?.isSystem} onChange={(event) => setSignMode(event.target.value as CategoryInput["signMode"])}>
          <option value="income">収入</option>
          <option value="expense">支出</option>
          <option value="free">自由</option>
        </select></label>
        {category?.isSystem && <p className="notice">システムカテゴリは削除できません。</p>}
        {category && !category.isSystem && <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(category.id)}>{deleting ? "削除中" : "削除"}</button>}
      </div>
    </Sheet>
  );
}
