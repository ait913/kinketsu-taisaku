import { Hono } from "hono";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { anchor, record } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { addMonthsToYearMonth, monthRange, todayJST, yearMonthOf } from "../lib/date.js";
import type { AppVariables } from "../middleware/auth.js";
import { anchorMonth, buildForecastSeries, buildTrend, currentBalance, groupTotals, totals } from "../services/balance.js";
import { bundleRecords } from "../services/bundle.js";
import { toRecordDTO } from "../services/dto.js";
import type { AnchorValue } from "../services/balance.js";
import { queryValidator } from "./validators.js";

async function getAnchor(userId: string): Promise<AnchorValue> {
  const [row] = await db.select().from(anchor).where(eq(anchor.userId, userId)).limit(1);
  return { balance: row?.balance ?? 0, asOf: row?.asOf ?? todayJST() };
}

async function recordsBetween(userId: string, fromMonth: string, toMonth: string) {
  const rows = await db.select().from(record).where(and(
    eq(record.userId, userId),
    gte(record.yearMonth, fromMonth),
    lte(record.yearMonth, toMonth),
  )).orderBy(asc(record.date), asc(record.id));
  return rows.map(toRecordDTO);
}

export const monthsRouter = new Hono<{ Variables: AppVariables }>()
  .get("/months/:yearMonth", async (c) => {
    const userId = c.var.user!.id;
    const yearMonth = c.req.param("yearMonth");
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new AppError(400, "VALIDATION_ERROR", "invalid yearMonth");
    const a = await getAnchor(userId);
    const months = monthRange(anchorMonth(a), yearMonth);
    const allRecords = await recordsBetween(userId, anchorMonth(a), yearMonth);
    const series = buildForecastSeries(a, months, allRecords);
    const fm = series.at(-1)!;
    const monthRecords = allRecords.filter((r) => r.yearMonth === yearMonth);
    const today = todayJST();
    return c.json({
      yearMonth,
      currentBalance: yearMonth === yearMonthOf(today) ? currentBalance(a, allRecords, today) : null,
      endingBalanceConfirmed: fm.endingBalanceConfirmed,
      endingBalanceForecast: fm.endingBalanceForecast,
      totals: totals(monthRecords),
      byCategory: groupTotals(monthRecords, "categoryId"),
      byTag: groupTotals(monthRecords, "tagId"),
      records: monthRecords,
      bundles: bundleRecords(monthRecords),
    });
  })
  .get("/years/:year", async (c) => {
    const userId = c.var.user!.id;
    const year = Number(c.req.param("year"));
    if (!Number.isInteger(year)) throw new AppError(400, "VALIDATION_ERROR", "invalid year");
    const a = await getAnchor(userId);
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    const from = anchorMonth(a) < months[0] ? anchorMonth(a) : months[0];
    const allRecords = await recordsBetween(userId, from, months[11]);
    const series = buildForecastSeries(a, monthRange(anchorMonth(a), months[11]), allRecords);
    const byMonth = new Map(series.map((item) => [item.yearMonth, item]));
    const yearRecords = allRecords.filter((r) => r.yearMonth.startsWith(`${year}-`));
    return c.json({
      year,
      months: months.map((ym) => {
        const item = byMonth.get(ym);
        const monthRecords = yearRecords.filter((r) => r.yearMonth === ym);
        const t = totals(monthRecords);
        return {
          yearMonth: ym,
          endingBalanceForecast: item?.endingBalanceForecast ?? a.balance,
          endingBalanceConfirmed: item?.endingBalanceConfirmed ?? a.balance,
          incomeForecast: t.incomeForecast,
          expenseForecast: t.expenseForecast,
        };
      }),
      byCategory: groupTotals(yearRecords, "categoryId"),
      byTag: groupTotals(yearRecords, "tagId"),
    });
  })
  .get("/trend/:yearMonth", async (c) => {
    const userId = c.var.user!.id;
    const yearMonth = c.req.param("yearMonth");
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new AppError(400, "VALIDATION_ERROR", "invalid yearMonth");
    const a = await getAnchor(userId);
    const months = monthRange(anchorMonth(a), yearMonth);
    const allRecords = await recordsBetween(userId, anchorMonth(a), yearMonth);
    const series = buildForecastSeries(a, months, allRecords);
    const current = series.at(-1)!;
    return c.json(buildTrend(
      yearMonth,
      allRecords.filter((r) => r.yearMonth === yearMonth),
      current.startingBalanceConfirmed,
      current.startingBalanceForecast,
      todayJST(),
    ));
  })
  .get("/forecast", queryValidator(z.object({
    from: z.string().regex(/^\d{4}-\d{2}$/),
    months: z.coerce.number().int().min(1).max(36),
  })), async (c) => {
    const userId = c.var.user!.id;
    const q = c.req.valid("query");
    const a = await getAnchor(userId);
    if (q.from < anchorMonth(a)) throw new AppError(400, "FORECAST_BEFORE_ANCHOR", "forecast from is before anchor");
    const to = addMonthsToYearMonth(q.from, q.months - 1);
    const allRecords = await recordsBetween(userId, anchorMonth(a), to);
    const prelude = monthRange(anchorMonth(a), to);
    const full = buildForecastSeries(a, prelude, allRecords);
    return c.json({ from: q.from, months: q.months, series: full.filter((m) => m.yearMonth >= q.from).slice(0, q.months) });
  });
