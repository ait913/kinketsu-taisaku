import { describe, expect, it } from "vitest";
import { bundleRecords } from "../bundle";

type RecordDTO = {
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

const record = (id: number, description: string, signedAmount: number): RecordDTO => ({
  id,
  date: "2026-06-01",
  yearMonth: "2026-06",
  signedAmount,
  type: signedAmount >= 0 ? "income" : "expense",
  categoryId: 1,
  tagId: null,
  description,
  paid: true,
  sourceRuleId: null,
  isManuallyEdited: false,
});

describe("bundleRecords (§5.3)", () => {
  it("2件未満は束ねず、2件以上だけ BundleDTO にする", () => {
    expect(bundleRecords([record(1, "single", -100)])).toEqual([]);
    expect(bundleRecords([record(1, "rent", -100), record(2, "rent", -200)])).toEqual([
      { description: "rent", count: 2, total: -300, recordIds: [1, 2] },
    ]);
  });

  it("count 昇順、同数は description 辞書順で並べ、空文字 description も束ねる", () => {
    const bundles = bundleRecords([
      record(1, "zeta", -100),
      record(2, "zeta", -200),
      record(3, "alpha", -300),
      record(4, "alpha", 100),
      record(5, "", -10),
      record(6, "", -20),
      record(7, "many", -1),
      record(8, "many", -2),
      record(9, "many", -3),
      record(10, "single", -999),
    ]);

    expect(bundles).toEqual([
      { description: "", count: 2, total: -30, recordIds: [5, 6] },
      { description: "alpha", count: 2, total: -200, recordIds: [3, 4] },
      { description: "zeta", count: 2, total: -300, recordIds: [1, 2] },
      { description: "many", count: 3, total: -6, recordIds: [7, 8, 9] },
    ]);
  });
});

