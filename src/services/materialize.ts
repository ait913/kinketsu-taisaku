import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { category, record, recurringRule, settings } from "../db/schema.js";
import { addMonthsToYearMonth, clampDay, currentMonthJST, monthRange } from "../lib/date.js";

export async function materializeRule(ruleId: number, userId: string, fromMonth: string, toMonth: string): Promise<{ created: number }> {
  const [rule] = await db.select().from(recurringRule).where(and(eq(recurringRule.id, ruleId), eq(recurringRule.userId, userId))).limit(1);
  if (!rule) return { created: 0 };

  if (!rule.active) {
    await deleteUnpaidUnedited(rule.id);
    return { created: 0 };
  }

  const start = rule.startMonth > fromMonth ? rule.startMonth : fromMonth;
  const endByRule = rule.endMonth && rule.endMonth < toMonth ? rule.endMonth : toMonth;
  if (endByRule < start) return { created: 0 };

  let created = 0;
  for (const yearMonth of monthRange(start, endByRule)) {
    const [existing] = await db.select().from(record).where(and(eq(record.sourceRuleId, rule.id), eq(record.yearMonth, yearMonth))).limit(1);
    if (existing?.paid || existing?.isManuallyEdited) continue;
    if (existing) {
      await db.delete(record).where(eq(record.id, existing.id));
    }
    await db.insert(record).values({
      userId,
      date: clampDay(yearMonth, rule.dayOfMonth),
      yearMonth,
      signedAmount: rule.signedAmount,
      categoryId: rule.categoryId,
      tagId: rule.tagId,
      description: rule.description,
      paid: false,
      sourceRuleId: rule.id,
      isManuallyEdited: false,
    });
    created += 1;
  }
  return { created };
}

export async function deleteUnpaidUnedited(ruleId: number): Promise<number> {
  const deleted = await db.delete(record).where(and(
    eq(record.sourceRuleId, ruleId),
    eq(record.paid, false),
    eq(record.isManuallyEdited, false),
  ));
  return deleted.changes;
}

export async function ensureMaterialized(userId: string): Promise<void> {
  const [set] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  const currentMonth = currentMonthJST();
  const toMonth = addMonthsToYearMonth(currentMonth, set?.materializeMonths ?? 12);
  const rules = await db.select().from(recurringRule).where(eq(recurringRule.userId, userId));
  for (const rule of rules) {
    await materializeRule(rule.id, userId, currentMonth, toMonth);
  }
}

export async function seedUserIfNeeded(userId: string): Promise<void> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(category).where(eq(category.userId, userId));
  if (Number(count) === 0) {
    await db.insert(category).values([
      { userId, name: "収入", signMode: "income", isSystem: true, sortOrder: 1 },
      { userId, name: "支出", signMode: "expense", isSystem: true, sortOrder: 2 },
    ]);
  }

  await db.insert(settings).values({ userId, materializeMonths: 12 }).onConflictDoNothing({ target: settings.userId });
}

export async function rematerializeFutureForUser(userId: string): Promise<void> {
  const [set] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  const currentMonth = currentMonthJST();
  const toMonth = addMonthsToYearMonth(currentMonth, set?.materializeMonths ?? 12);
  const rules = await db.select().from(recurringRule).where(eq(recurringRule.userId, userId));
  for (const rule of rules) {
    const fromMonth = rule.startMonth > currentMonth ? rule.startMonth : currentMonth;
    await materializeRule(rule.id, userId, fromMonth, toMonth);
  }
}

export async function detachKeptGeneratedRecords(ruleId: number): Promise<void> {
  await db.update(record).set({ sourceRuleId: null }).where(eq(record.sourceRuleId, ruleId));
}
