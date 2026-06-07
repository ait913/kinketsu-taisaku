import type { CategoryDTO, DerivedType } from "./types.js";

export function deriveType(signedAmount: number): DerivedType {
  return signedAmount >= 0 ? "income" : "expense";
}

export function proofAmount(amount: number, category: Pick<CategoryDTO, "signMode">): number {
  if (category.signMode === "income") return Math.abs(amount);
  if (category.signMode === "expense") return -Math.abs(amount);
  return amount;
}
