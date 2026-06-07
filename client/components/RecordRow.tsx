import type { CategoryDTO, RecordDTO, TagDTO } from "../api/types";
import { yen } from "./format";

export type RecordRowProps = {
  record: RecordDTO;
  tag: TagDTO | null;
  category: CategoryDTO;
  onClick: (recordId: number) => void;
};

export function RecordRow({ record, tag, category, onClick }: RecordRowProps) {
  return (
    <button data-testid="record-row" className="row-button" onClick={() => onClick(record.id)}>
      <span className="tag-pill" style={{ backgroundColor: tag?.color ?? "#d1fae5" }} />
      <span className="row-main">
        <span className="row-title">{record.description || category.name}</span>
        <span className="row-meta">{record.date.slice(5)} {record.paid ? "確定" : "予定"}</span>
      </span>
      {!record.paid && <span data-testid="record-unpaid-mark" className="unpaid-mark">●</span>}
      <span data-testid="record-amount" className={record.signedAmount >= 0 ? "amount income" : "amount expense"}>{yen(record.signedAmount)}</span>
    </button>
  );
}
