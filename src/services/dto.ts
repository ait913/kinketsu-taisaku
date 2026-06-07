import type { category, record, recurringRule, tag } from "../db/schema.js";
import { deriveType } from "./proof.js";
import type { CategoryDTO, RecordDTO, RuleDTO, TagDTO } from "./types.js";

export function toRecordDTO(row: typeof record.$inferSelect): RecordDTO {
  return {
    id: row.id,
    date: row.date,
    yearMonth: row.yearMonth,
    signedAmount: row.signedAmount,
    type: deriveType(row.signedAmount),
    categoryId: row.categoryId,
    tagId: row.tagId,
    description: row.description,
    paid: row.paid,
    sourceRuleId: row.sourceRuleId,
    isManuallyEdited: row.isManuallyEdited,
  };
}

export function toCategoryDTO(row: typeof category.$inferSelect): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    signMode: row.signMode,
    isSystem: row.isSystem,
    sortOrder: row.sortOrder,
  };
}

export function toTagDTO(row: typeof tag.$inferSelect): TagDTO {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    color: row.color,
    sortOrder: row.sortOrder,
  };
}

export function toRuleDTO(row: typeof recurringRule.$inferSelect): RuleDTO {
  return {
    id: row.id,
    label: row.label,
    dayOfMonth: row.dayOfMonth,
    signedAmount: row.signedAmount,
    type: deriveType(row.signedAmount),
    categoryId: row.categoryId,
    tagId: row.tagId,
    description: row.description,
    startMonth: row.startMonth,
    endMonth: row.endMonth,
    active: row.active,
  };
}
