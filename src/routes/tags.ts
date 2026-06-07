import { Hono } from "hono";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { record, recurringRule, tag } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import type { AppVariables } from "../middleware/auth.js";
import { toTagDTO } from "../services/dto.js";
import { parseId, requireCategory } from "./helpers.js";
import { jsonValidator } from "./validators.js";

const tagInput = z.object({
  categoryId: z.number().int(),
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

export const tagsRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const rows = await db.select().from(tag).where(eq(tag.userId, c.var.user!.id)).orderBy(asc(tag.sortOrder), asc(tag.id));
    return c.json(rows.map(toTagDTO));
  })
  .post("/", jsonValidator(tagInput), async (c) => {
    const input = c.req.valid("json");
    await requireCategory(c.var.user!.id, input.categoryId);
    const [created] = await db.insert(tag).values({ userId: c.var.user!.id, ...input, color: input.color ?? null }).returning();
    return c.json(toTagDTO(created), 201);
  })
  .patch("/:id", jsonValidator(tagInput.partial()), async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(tag).where(and(eq(tag.id, id), eq(tag.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "tag not found");
    const input = c.req.valid("json");
    const nextCategoryId = input.categoryId ?? existing.categoryId;
    await requireCategory(userId, nextCategoryId);
    const [updated] = await db.update(tag).set({
      categoryId: nextCategoryId,
      name: input.name ?? existing.name,
      color: "color" in input ? input.color ?? null : existing.color,
    }).where(and(eq(tag.id, id), eq(tag.userId, userId))).returning();
    return c.json(toTagDTO(updated));
  })
  .delete("/:id", async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(tag).where(and(eq(tag.id, id), eq(tag.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "tag not found");
    const refs = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(record).where(and(eq(record.userId, userId), eq(record.tagId, id))),
      db.select({ count: sql<number>`count(*)` }).from(recurringRule).where(and(eq(recurringRule.userId, userId), eq(recurringRule.tagId, id))),
    ]);
    const used = refs.reduce((sum, rows) => sum + Number(rows[0]?.count ?? 0), 0);
    if (used > 0) throw new AppError(409, "STILL_IN_USE", "tag is still in use", { count: used });
    await db.delete(tag).where(and(eq(tag.id, id), eq(tag.userId, userId)));
    return c.json({ deleted: true });
  });
