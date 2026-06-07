import { daysForMonth, yearMonthOf } from "../lib/date.js";
import type { BundleDTO, RecordDTO } from "./types.js";

export type AnchorValue = { balance: number; asOf: string };

export type TrendPoint = {
  date: string;
  confirmed: number | null;
  forecast: number;
};

export type TrendData = { yearMonth: string; points: TrendPoint[] };

export type ForecastMonth = {
  yearMonth: string;
  incomeConfirmed: number;
  incomeForecast: number;
  expenseConfirmed: number;
  expenseForecast: number;
  startingBalanceForecast: number;
  endingBalanceForecast: number;
  startingBalanceConfirmed: number;
  endingBalanceConfirmed: number;
};

export function totals(records: RecordDTO[]) {
  return {
    incomeConfirmed: records.filter((r) => r.paid && r.signedAmount > 0).reduce((s, r) => s + r.signedAmount, 0),
    incomeForecast: records.filter((r) => r.signedAmount > 0).reduce((s, r) => s + r.signedAmount, 0),
    expenseConfirmed: records.filter((r) => r.paid && r.signedAmount < 0).reduce((s, r) => s + r.signedAmount, 0),
    expenseForecast: records.filter((r) => r.signedAmount < 0).reduce((s, r) => s + r.signedAmount, 0),
  };
}

export function groupTotals(records: RecordDTO[], key: "categoryId" | "tagId") {
  const map = new Map<number, { all: number; paidOnly: number }>();
  for (const rec of records) {
    const id = rec[key];
    if (id == null) continue;
    const current = map.get(id) ?? { all: 0, paidOnly: 0 };
    current.all += rec.signedAmount;
    if (rec.paid) current.paidOnly += rec.signedAmount;
    map.set(id, current);
  }
  return [...map.entries()].map(([id, value]) => (
    key === "categoryId"
      ? { categoryId: id, ...value }
      : { tagId: id, ...value }
  ));
}

export function currentBalance(anchor: AnchorValue, records: RecordDTO[], today: string): number {
  return anchor.balance + records
    .filter((r) => r.paid && r.date >= anchor.asOf && r.date <= today)
    .reduce((sum, r) => sum + r.signedAmount, 0);
}

export function buildForecastSeries(anchorValue: AnchorValue, months: string[], records: RecordDTO[]): ForecastMonth[] {
  let startingBalanceForecast = anchorValue.balance;
  let startingBalanceConfirmed = anchorValue.balance;

  return months.map((yearMonth) => {
    const monthRecords = records.filter((r) => r.yearMonth === yearMonth && r.date >= anchorValue.asOf);
    const t = totals(monthRecords);
    const endingBalanceForecast = startingBalanceForecast + t.incomeForecast + t.expenseForecast;
    const endingBalanceConfirmed = startingBalanceConfirmed + t.incomeConfirmed + t.expenseConfirmed;
    const row = {
      yearMonth,
      ...t,
      startingBalanceForecast,
      endingBalanceForecast,
      startingBalanceConfirmed,
      endingBalanceConfirmed,
    };
    startingBalanceForecast = endingBalanceForecast;
    startingBalanceConfirmed = endingBalanceConfirmed;
    return row;
  });
}

export function buildTrend(
  yearMonth: string,
  records: RecordDTO[],
  startingConfirmed: number,
  startingForecast: number,
  today: string,
): TrendData {
  const points = daysForMonth(yearMonth).map((date) => {
    const throughDay = records.filter((r) => r.date <= date);
    const forecast = startingForecast + throughDay.reduce((sum, r) => sum + r.signedAmount, 0);
    const confirmed = today >= date
      ? startingConfirmed + throughDay.filter((r) => r.paid).reduce((sum, r) => sum + r.signedAmount, 0)
      : null;
    return { date, confirmed, forecast };
  });
  return { yearMonth, points };
}

export function anchorMonth(anchorValue: AnchorValue): string {
  return yearMonthOf(anchorValue.asOf);
}

export type MonthData = {
  yearMonth: string;
  currentBalance: number | null;
  endingBalanceConfirmed: number;
  endingBalanceForecast: number;
  totals: ReturnType<typeof totals>;
  byCategory: ReturnType<typeof groupTotals>;
  byTag: ReturnType<typeof groupTotals>;
  records: RecordDTO[];
  bundles: BundleDTO[];
};
