import { describe, expect, it } from "vitest";
import { proofAmount } from "../proof";

// 設計 §1.2 符号強制: income → +abs / expense → -abs / free → 入力符号を維持。
// 実関数シグネチャ: proofAmount(amount, category: { signMode })。
const p = (amount: number, signMode: "income" | "expense" | "free") =>
  proofAmount(amount, { signMode });

describe("proof 符号強制 (§1.2)", () => {
  it("income は +abs に強制", () => {
    expect(p(1000, "income")).toBe(1000);
    expect(p(-1000, "income")).toBe(1000);
    expect(p(0, "income")).toBe(0);
  });
  it("expense は -abs に強制", () => {
    expect(p(1000, "expense")).toBe(-1000);
    expect(p(-1000, "expense")).toBe(-1000);
  });
  it("free は入力符号をそのまま維持", () => {
    expect(p(1000, "free")).toBe(1000);
    expect(p(-1000, "free")).toBe(-1000);
  });
});
