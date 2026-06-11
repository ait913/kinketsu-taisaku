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
export type GroupCategoryTotal = { categoryId: number; all: number; paidOnly: number };
export type GroupTagTotal = { tagId: number; all: number; paidOnly: number };
export type MonthData = {
  yearMonth: string;
  currentBalance: number | null;
  endingBalanceConfirmed: number;
  endingBalanceForecast: number;
  totals: { incomeConfirmed: number; incomeForecast: number; expenseConfirmed: number; expenseForecast: number };
  byCategory: GroupCategoryTotal[];
  byTag: GroupTagTotal[];
  records: RecordDTO[];
  bundles: BundleDTO[];
};
export type YearData = {
  year: number;
  months: {
    yearMonth: string;
    endingBalanceForecast: number;
    endingBalanceConfirmed: number;
    incomeForecast: number;
    expenseForecast: number;
  }[];
  byCategory: GroupCategoryTotal[];
  byTag: GroupTagTotal[];
};
export type TrendData = { yearMonth: string; points: { date: string; confirmed: number | null; forecast: number }[] };
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
