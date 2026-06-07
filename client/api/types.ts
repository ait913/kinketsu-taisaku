export type RecordDTO = {
  id: number;
  date: string;
  yearMonth: string;
  signedAmount: number;
  type: "income" | "expense";
  categoryId: number;
  tagId: number | null;
  description: string;
  paid: boolean;
  sourceRuleId: number | null;
  isManuallyEdited: boolean;
};

export type CategoryDTO = { id: number; name: string; signMode: "income" | "expense" | "free"; isSystem: boolean; sortOrder: number };
export type TagDTO = { id: number; categoryId: number; name: string; color: string | null; sortOrder: number };
export type BundleDTO = { description: string; count: number; total: number; recordIds: number[] };
export type RuleDTO = {
  id: number; label: string; dayOfMonth: number; signedAmount: number; type: "income" | "expense";
  categoryId: number; tagId: number | null; description: string; startMonth: string; endMonth: string | null; active: boolean;
};

export type RecordInput = {
  date: string;
  amount: number;
  categoryId: number;
  tagId?: number | null;
  description: string;
  paid: boolean;
};

export type RuleInput = {
  label: string;
  dayOfMonth: number;
  amount: number;
  categoryId: number;
  tagId?: number | null;
  description: string;
  startMonth: string;
  endMonth?: string | null;
  active: boolean;
};

export type CategoryInput = { name: string; signMode: "income" | "expense" | "free" };
export type TagInput = { categoryId: number; name: string; color?: string | null };

export type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: unknown; count?: number };
};
