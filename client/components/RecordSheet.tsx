import { useEffect, useMemo, useState } from "react";
import type { CategoryDTO, RecordDTO, RecordInput, TagDTO } from "../api/types";
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
        <label className="field">日付<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field">金額<input inputMode="numeric" type="number" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="field">カテゴリ<select value={categoryId} onChange={(event) => { setCategoryId(Number(event.target.value)); setTagId(""); }}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label className="field">タグ<select value={tagId} onChange={(event) => setTagId(event.target.value)}>
          <option value="">未指定</option>
          {selectableTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select></label>
        <label className="field">説明<input value={description} maxLength={200} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="check-field"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} />確定</label>
        {record && <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(record.id)}>{deleting ? "削除中" : "削除"}</button>}
      </div>
    </Sheet>
  );
}
