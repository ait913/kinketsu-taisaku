import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDatabase, clearBusinessTables, setupTestEnv } from "../../../tests/helpers/db";
import { createUserAndCookie, seedSystemCategories } from "../../../tests/helpers/auth";

beforeAll(() => {
  setupTestEnv();
  vi.resetModules();
});

beforeEach(async () => {
  await clearBusinessTables();
});

afterAll(() => {
  cleanupTestDatabase();
});

describe("materializeRule (§5.1/§5.4/§5.5)", () => {
  it("新規生成: paid=false/sourceRuleId/isManuallyEdited=false/date=clampDay/signedAmount=proof済", async () => {
    const { materializeRule } = await import("../materialize");
    const { db } = await import("../../db");
    const schema = await import("../../db/schema");
    const { userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);
    const now = new Date();
    const [rule] = await db
      .insert(schema.recurringRule)
      .values({
        userId,
        label: "Subscription",
        dayOfMonth: 31,
        signedAmount: -1490,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "Netflix",
        startMonth: "2026-02",
        endMonth: "2026-02",
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await expect(materializeRule(rule.id, userId, "2026-02", "2026-02")).resolves.toEqual({ created: 1 });
    const rows = await db.select().from(schema.record);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId,
      date: "2026-02-28",
      yearMonth: "2026-02",
      signedAmount: -1490,
      categoryId: expenseCategory.id,
      description: "Netflix",
      paid: false,
      sourceRuleId: rule.id,
      isManuallyEdited: false,
    });
  });

  it("paid=true と isManuallyEdited=true は re-materialize で保持し、未確定未編集だけ再生成する", async () => {
    const { materializeRule } = await import("../materialize");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("../../db");
    const schema = await import("../../db/schema");
    const { userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);
    const now = new Date();
    const [rule] = await db
      .insert(schema.recurringRule)
      .values({
        userId,
        label: "Rule",
        dayOfMonth: 10,
        signedAmount: -100,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "old",
        startMonth: "2026-06",
        endMonth: "2026-08",
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(schema.record).values([
      {
        userId,
        date: "2026-06-10",
        yearMonth: "2026-06",
        signedAmount: -1,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "paid keep",
        paid: true,
        sourceRuleId: rule.id,
        isManuallyEdited: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        date: "2026-07-10",
        yearMonth: "2026-07",
        signedAmount: -2,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "manual keep",
        paid: false,
        sourceRuleId: rule.id,
        isManuallyEdited: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        date: "2026-08-10",
        yearMonth: "2026-08",
        signedAmount: -3,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "replace",
        paid: false,
        sourceRuleId: rule.id,
        isManuallyEdited: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db
      .update(schema.recurringRule)
      .set({ signedAmount: -999, description: "new" })
      .where(eq(schema.recurringRule.id, rule.id));

    await materializeRule(rule.id, userId, "2026-06", "2026-08");
    const rows = await db.select().from(schema.record).orderBy(schema.record.yearMonth);

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => [row.yearMonth, row.signedAmount, row.description, row.paid, row.isManuallyEdited])).toEqual([
      ["2026-06", -1, "paid keep", true, false],
      ["2026-07", -2, "manual keep", false, true],
      ["2026-08", -999, "new", false, false],
    ]);
  });

  it("冪等で二重生成せず、active=false は未確定未編集の生成 record を削除して生成しない", async () => {
    const { materializeRule } = await import("../materialize");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("../../db");
    const schema = await import("../../db/schema");
    const { userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);
    const now = new Date();
    const [rule] = await db
      .insert(schema.recurringRule)
      .values({
        userId,
        label: "Rule",
        dayOfMonth: 1,
        signedAmount: -100,
        categoryId: expenseCategory.id,
        tagId: null,
        description: "rule",
        startMonth: "2026-06",
        endMonth: "2026-07",
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await materializeRule(rule.id, userId, "2026-06", "2026-07");
    await materializeRule(rule.id, userId, "2026-06", "2026-07");
    expect(await db.select().from(schema.record)).toHaveLength(2);

    await db.update(schema.recurringRule).set({ active: false }).where(eq(schema.recurringRule.id, rule.id));
    await materializeRule(rule.id, userId, "2026-06", "2026-07");
    expect(await db.select().from(schema.record)).toHaveLength(0);
  });
});
