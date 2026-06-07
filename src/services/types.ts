export type DerivedType = "income" | "expense";

export type RecordDTO = {
  id: number;
  date: string;
  yearMonth: string;
  signedAmount: number;
  type: DerivedType;
  categoryId: number;
  tagId: number | null;
  description: string;
  paid: boolean;
  sourceRuleId: number | null;
  isManuallyEdited: boolean;
};

export type CategoryDTO = {
  id: number;
  name: string;
  signMode: "income" | "expense" | "free";
  isSystem: boolean;
  sortOrder: number;
};

export type TagDTO = {
  id: number;
  categoryId: number;
  name: string;
  color: string | null;
  sortOrder: number;
};

export type RuleDTO = {
  id: number;
  label: string;
  dayOfMonth: number;
  signedAmount: number;
  type: DerivedType;
  categoryId: number;
  tagId: number | null;
  description: string;
  startMonth: string;
  endMonth: string | null;
  active: boolean;
};

export type BundleDTO = {
  description: string;
  count: number;
  total: number;
  recordIds: number[];
};
