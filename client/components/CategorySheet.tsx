import { useEffect, useState } from "react";
import type { CategoryDTO, CategoryInput } from "../api/types";
import { SegmentedControl } from "./SegmentedControl";
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
        <label className="field"><span className="field-label">名前</span><input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} /></label>
        <div className="field">
          <span className="field-label">符号</span>
          <SegmentedControl
            field="sign"
            value={signMode}
            disabled={category?.isSystem}
            options={[
              { value: "income", label: "収入", testId: "segment-sign-income", tone: "income" },
              { value: "expense", label: "支出", testId: "segment-sign-expense", tone: "expense" },
              { value: "free", label: "自由", testId: "segment-sign-free", tone: "move" },
            ]}
            onChange={(nextSignMode) => setSignMode(nextSignMode)}
          />
        </div>
        {category?.isSystem && <p className="notice">システムカテゴリは削除できません。</p>}
        {category && !category.isSystem && <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(category.id)}>{deleting ? "削除中" : "削除"}</button>}
      </div>
    </Sheet>
  );
}
