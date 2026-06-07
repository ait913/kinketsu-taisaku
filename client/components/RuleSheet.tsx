import { useEffect, useMemo, useState } from "react";
import type { CategoryDTO, RuleDTO, RuleInput, TagDTO } from "../api/types";
import { Sheet } from "./Sheet";

type RuleSheetProps = {
  open: boolean;
  rule: RuleDTO | null;
  currentMonth: string;
  categories: CategoryDTO[];
  tags: TagDTO[];
  saving: boolean;
  deleting: boolean;
  onDismiss: () => void;
  onSave: (input: RuleInput) => void;
  onDelete: (ruleId: number, keepRecords: boolean) => void;
};

export function RuleSheet({ open, rule, currentMonth, categories, tags, saving, deleting, onDismiss, onSave, onDelete }: RuleSheetProps) {
  const firstCategoryId = categories[0]?.id ?? 0;
  const [label, setLabel] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(firstCategoryId);
  const [tagId, setTagId] = useState("");
  const [description, setDescription] = useState("");
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLabel(rule?.label ?? "");
    setDayOfMonth(rule?.dayOfMonth ?? 1);
    setAmount(String(rule?.signedAmount ?? 0));
    setCategoryId(rule?.categoryId ?? firstCategoryId);
    setTagId(rule?.tagId == null ? "" : String(rule.tagId));
    setDescription(rule?.description ?? "");
    setStartMonth(rule?.startMonth ?? currentMonth);
    setEndMonth(rule?.endMonth ?? "");
    setActive(rule?.active ?? true);
  }, [currentMonth, firstCategoryId, open, rule]);

  const selectableTags = useMemo(() => tags.filter((tag) => tag.categoryId === categoryId), [categoryId, tags]);

  function submit() {
    onSave({
      label,
      dayOfMonth,
      amount: Number(amount),
      categoryId,
      tagId: tagId ? Number(tagId) : null,
      description,
      startMonth,
      endMonth: endMonth || null,
      active,
    });
  }

  function deleteRule(keepRecords: boolean) {
    if (rule) onDelete(rule.id, keepRecords);
  }

  return (
    <Sheet open={open} onDismiss={onDismiss} title={rule ? "定期を編集" : "定期を追加"} rightAction={{ label: saving ? "保存中" : "保存", onClick: submit }}>
      <div className="sheet-body">
        <label className="field">ルール名<input value={label} maxLength={60} onChange={(event) => setLabel(event.target.value)} /></label>
        <label className="field">毎月<input type="number" min="1" max="31" step="1" value={dayOfMonth} onChange={(event) => setDayOfMonth(Number(event.target.value))} /></label>
        <label className="field">金額<input inputMode="numeric" type="number" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="field">カテゴリ<select value={categoryId} onChange={(event) => { setCategoryId(Number(event.target.value)); setTagId(""); }}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label className="field">タグ<select value={tagId} onChange={(event) => setTagId(event.target.value)}>
          <option value="">未指定</option>
          {selectableTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select></label>
        <label className="field">説明<input value={description} maxLength={200} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="field">開始月<input type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} /></label>
        <label className="field">終了月<input type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} /></label>
        <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />有効</label>
        {rule && (
          <div className="delete-group">
            <button className="danger-button" type="button" disabled={deleting} onClick={() => deleteRule(true)}>予定だけ消す</button>
            <button className="danger-button" type="button" disabled={deleting} onClick={() => deleteRule(false)}>全削除</button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
