import { useEffect, useMemo, useState } from "react";
import type { CategoryDTO, RuleDTO, RuleInput, TagDTO } from "../api/types";
import { SegmentedControl } from "./SegmentedControl";
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
  const tagSegmentValue = tagId || "none";

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
        <label className="field"><span className="field-label">ルール名</span><input value={label} maxLength={60} onChange={(event) => setLabel(event.target.value)} /></label>
        <label className="field"><span className="field-label">毎月</span><input type="number" min="1" max="31" step="1" value={dayOfMonth} onChange={(event) => setDayOfMonth(Number(event.target.value))} /></label>
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
        <label className="field"><span className="field-label">開始月</span><input type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} /></label>
        <label className="field"><span className="field-label">終了月</span><input type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} /></label>
        <div className="field">
          <span className="field-label">状態</span>
          <SegmentedControl
            field="active"
            value={active ? "active" : "inactive"}
            options={[
              { value: "active", label: "有効", testId: "segment-active-active" },
              { value: "inactive", label: "停止", testId: "segment-active-inactive" },
            ]}
            onChange={(nextActive) => setActive(nextActive === "active")}
          />
        </div>
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
