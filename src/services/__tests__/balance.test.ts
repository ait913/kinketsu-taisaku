import { describe, expect, it, test } from "vitest";
import { buildTrend } from "../balance";

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

const record = (id: number, date: string, signedAmount: number, paid: boolean): RecordDTO => ({
  id,
  date,
  yearMonth: date.slice(0, 7),
  signedAmount,
  type: signedAmount >= 0 ? "income" : "expense",
  categoryId: 1,
  tagId: null,
  description: "",
  paid,
  sourceRuleId: null,
  isManuallyEdited: false,
});

describe("buildTrend (§5.7)", () => {
  it("forecast は paid 問わず月末まで non-null、confirmed は今日以降 null にする", () => {
    const trend = buildTrend(
      "2026-06",
      [record(1, "2026-06-01", 100, true), record(2, "2026-06-10", -30, false), record(3, "2026-06-20", -10, true)],
      1000,
      2000,
      "2026-06-15",
    );

    expect(trend.yearMonth).toBe("2026-06");
    expect(trend.points).toHaveLength(30);
    expect(trend.points[0]).toMatchObject({ date: "2026-06-01", confirmed: 1100, forecast: 2100 });
    expect(trend.points[9]).toMatchObject({ date: "2026-06-10", confirmed: 1100, forecast: 2070 });
    expect(trend.points[14]).toMatchObject({ date: "2026-06-15", confirmed: 1100, forecast: 2070 });
    expect(trend.points[15]).toMatchObject({ date: "2026-06-16", confirmed: null, forecast: 2070 });
    expect(trend.points[19]).toMatchObject({ date: "2026-06-20", confirmed: null, forecast: 2060 });
    expect(trend.points[29]).toMatchObject({ date: "2026-06-30", confirmed: null, forecast: 2060 });
  });

  it("過去月は全日の confirmed を non-null にする", () => {
    const trend = buildTrend("2026-05", [record(1, "2026-05-31", -500, true)], 1000, 1000, "2026-06-15");

    expect(trend.points).toHaveLength(31);
    expect(trend.points.every((point) => point.confirmed !== null)).toBe(true);
    expect(trend.points.at(-1)).toMatchObject({ date: "2026-05-31", confirmed: 500, forecast: 500 });
  });
});


import { currentBalance, buildForecastSeries } from "../balance";

describe("繰り越し累積 (§1.1) — forecast/confirmed 2系列の独立累積", () => {
  // anchor 起点。anchorMonth=2026-06。設計 §1.1 の式で期待値を手計算。
  const anchor = { balance: 10000, asOf: "2026-06-01" };
  const recs = [
    record(1, "2026-06-25", 5000, true), // 6月 給料 確定
    record(2, "2026-06-27", -1490, false), // 6月 サブスク 未確定
    record(3, "2026-07-15", 5000, false), // 7月 未確定収入
    record(4, "2026-07-20", -2000, true), // 7月 確定支出
  ];

  it("currentBalance は anchor.balance + (asOf<=date<=today の paid=true 分)", () => {
    // today=2026-06-30 → 6/25 の +5000 のみ確定加算 (6/27 は paid=false で除外)
    expect(currentBalance(anchor, recs, "2026-06-30")).toBe(15000);
    // today=2026-06-26 → 6/25 まで → 15000
    expect(currentBalance(anchor, recs, "2026-06-26")).toBe(15000);
    // today=2026-06-20 → まだ何も確定していない → 10000
    expect(currentBalance(anchor, recs, "2026-06-20")).toBe(10000);
  });

  it("forecast/confirmed の月末残高が前月末 + 月収支で累積する", () => {
    const series = buildForecastSeries(anchor, ["2026-06", "2026-07"], recs);
    expect(series).toHaveLength(2);

    const jun = series[0];
    expect(jun.yearMonth).toBe("2026-06");
    expect(jun.startingBalanceForecast).toBe(10000);
    expect(jun.startingBalanceConfirmed).toBe(10000);
    expect(jun.endingBalanceForecast).toBe(13510); // 10000 + 5000 - 1490
    expect(jun.endingBalanceConfirmed).toBe(15000); // 10000 + 5000

    const jul = series[1];
    expect(jul.yearMonth).toBe("2026-07");
    expect(jul.startingBalanceForecast).toBe(13510); // = jun.endingForecast
    expect(jul.startingBalanceConfirmed).toBe(15000); // = jun.endingConfirmed
    expect(jul.endingBalanceForecast).toBe(16510); // 13510 + 5000 - 2000
    expect(jul.endingBalanceConfirmed).toBe(13000); // 15000 - 2000
  });
});
