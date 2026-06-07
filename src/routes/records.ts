import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { record } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import { yearMonthOf } from "../lib/date.js";
import type { AppVariables } from "../middleware/auth.js";
import { toRecordDTO } from "../services/dto.js";
import { proofAmount } from "../services/proof.js";
import { parseId, requireCategory, validateTag } from "./helpers.js";
import { jsonValidator, queryValidator } from "./validators.js";

const recordInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().int(),
  categoryId: z.number().int(),
  tagId: z.number().int().nullable().optional(),
  description: z.string().max(200).default(""),
  paid: z.boolean().default(true),
});

const recordPatchInput = recordInput.partial();

export const recordsRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", queryValidator(z.object({ yearMonth: z.string().regex(/^\d{4}-\d{2}$/) })), async (c) => {
    const userId = c.var.user!.id;
    const { yearMonth } = c.req.valid("query");
    const rows = await db.select().from(record).where(and(eq(record.userId, userId), eq(record.yearMonth, yearMonth))).orderBy(asc(record.date), asc(record.id));
    return c.json(rows.map(toRecordDTO));
  })
  .post("/", jsonValidator(recordInput), async (c) => {
    const userId = c.var.user!.id;
    const input = c.req.valid("json");
    const cat = await requireCategory(userId, input.categoryId);
    const tagId = await validateTag(userId, input.categoryId, input.tagId);
    const [created] = await db.insert(record).values({
      userId,
      date: input.date,
      yearMonth: yearMonthOf(input.date),
      signedAmount: proofAmount(input.amount, cat),
      categoryId: input.categoryId,
      tagId,
      description: input.description,
      paid: input.paid,
      sourceRuleId: null,
      isManuallyEdited: false,
    }).returning();
    return c.json(toRecordDTO(created), 201);
  })
  .patch("/:id", jsonValidator(recordPatchInput), async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(record).where(and(eq(record.id, id), eq(record.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "record not found");
    const input = c.req.valid("json");
    const nextCategoryId = input.categoryId ?? existing.categoryId;
    const cat = await requireCategory(userId, nextCategoryId);
    const nextTagId = "tagId" in input ? input.tagId : existing.tagId;
    const tagId = await validateTag(userId, nextCategoryId, nextTagId);
    const signedAmount = input.amount == null ? existing.signedAmount : proofAmount(input.amount, cat);
    const nextDate = input.date ?? existing.date;
    const [updated] = await db.update(record).set({
      date: nextDate,
      yearMonth: yearMonthOf(nextDate),
      signedAmount,
      categoryId: nextCategoryId,
      tagId,
      description: input.description ?? existing.description,
      paid: input.paid ?? existing.paid,
      isManuallyEdited: existing.sourceRuleId != null ? true : existing.isManuallyEdited,
    }).where(and(eq(record.id, id), eq(record.userId, userId))).returning();
    return c.json(toRecordDTO(updated));
  })
  .delete("/:id", async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const deleted = await db.delete(record).where(and(eq(record.id, id), eq(record.userId, userId))).returning();
    if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "record not found");
    return c.json({ deleted: true });
  });
