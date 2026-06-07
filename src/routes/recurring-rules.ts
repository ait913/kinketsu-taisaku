import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { record, recurringRule, settings } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { addMonthsToYearMonth, currentMonthJST } from "../lib/date.js";
import type { AppVariables } from "../middleware/auth.js";
import { toRuleDTO } from "../services/dto.js";
import { deleteUnpaidUnedited, materializeRule } from "../services/materialize.js";
import { proofAmount } from "../services/proof.js";
import { parseId, requireCategory, validateTag } from "./helpers.js";
import { jsonValidator } from "./validators.js";

const ruleInput = z.object({
  label: z.string().min(1).max(60),
  dayOfMonth: z.number().int().min(1).max(31),
  amount: z.number().int(),
  categoryId: z.number().int(),
  tagId: z.number().int().nullable().optional(),
  description: z.string().max(200).default(""),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  active: z.boolean().default(true),
});

async function materializeWindow(userId: string, ruleId: number, startMonth: string) {
  const [set] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  const currentMonth = currentMonthJST();
  const fromMonth = startMonth > currentMonth ? startMonth : currentMonth;
  await materializeRule(ruleId, userId, fromMonth, addMonthsToYearMonth(currentMonth, set?.materializeMonths ?? 12));
}

export const recurringRulesRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const rows = await db.select().from(recurringRule).where(eq(recurringRule.userId, c.var.user!.id)).orderBy(asc(recurringRule.createdAt), asc(recurringRule.id));
    return c.json(rows.map(toRuleDTO));
  })
  .post("/", jsonValidator(ruleInput), async (c) => {
    const userId = c.var.user!.id;
    const input = c.req.valid("json");
    if (input.endMonth && input.endMonth < input.startMonth) throw new AppError(400, "INVALID_RANGE", "endMonth must be after startMonth");
    const cat = await requireCategory(userId, input.categoryId);
    const tagId = await validateTag(userId, input.categoryId, input.tagId);
    const [created] = await db.insert(recurringRule).values({
      userId,
      label: input.label,
      dayOfMonth: input.dayOfMonth,
      signedAmount: proofAmount(input.amount, cat),
      categoryId: input.categoryId,
      tagId,
      description: input.description,
      startMonth: input.startMonth,
      endMonth: input.endMonth ?? null,
      active: input.active,
    }).returning();
    await materializeWindow(userId, created.id, created.startMonth);
    return c.json(toRuleDTO(created), 201);
  })
  .patch("/:id", jsonValidator(ruleInput.partial()), async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(recurringRule).where(and(eq(recurringRule.id, id), eq(recurringRule.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "rule not found");
    const input = c.req.valid("json");
    const nextStart = input.startMonth ?? existing.startMonth;
    const nextEnd = "endMonth" in input ? input.endMonth ?? null : existing.endMonth;
    if (nextEnd && nextEnd < nextStart) throw new AppError(400, "INVALID_RANGE", "endMonth must be after startMonth");
    const categoryId = input.categoryId ?? existing.categoryId;
    const cat = await requireCategory(userId, categoryId);
    const tagId = await validateTag(userId, categoryId, "tagId" in input ? input.tagId : existing.tagId);
    const [updated] = await db.update(recurringRule).set({
      label: input.label ?? existing.label,
      dayOfMonth: input.dayOfMonth ?? existing.dayOfMonth,
      signedAmount: input.amount == null ? existing.signedAmount : proofAmount(input.amount, cat),
      categoryId,
      tagId,
      description: input.description ?? existing.description,
      startMonth: nextStart,
      endMonth: nextEnd,
      active: input.active ?? existing.active,
    }).where(and(eq(recurringRule.id, id), eq(recurringRule.userId, userId))).returning();
    await materializeWindow(userId, updated.id, updated.startMonth);
    return c.json(toRuleDTO(updated));
  })
  .delete("/:id", async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const keepRecords = c.req.query("keepRecords") !== "false";
    const [existing] = await db.select().from(recurringRule).where(and(eq(recurringRule.id, id), eq(recurringRule.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "rule not found");
    let removedRecords = 0;
    if (keepRecords) {
      removedRecords = await deleteUnpaidUnedited(id);
    } else {
      removedRecords = (await db.delete(record).where(and(eq(record.sourceRuleId, id), eq(record.userId, userId)))).changes;
    }
    await db.delete(recurringRule).where(and(eq(recurringRule.id, id), eq(recurringRule.userId, userId)));
    return c.json({ deleted: true, removedRecords });
  });
