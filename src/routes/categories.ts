import { Hono } from "hono";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { category, record, recurringRule, tag } from "../db/schema.js";
import { AppError } from "../lib/errors.js";
import type { AppVariables } from "../middleware/auth.js";
import { toCategoryDTO } from "../services/dto.js";
import { jsonValidator } from "./validators.js";
import { parseId } from "./helpers.js";

const categoryInput = z.object({
  name: z.string().min(1).max(40),
  signMode: z.enum(["income", "expense", "free"]).default("free"),
});

export const categoriesRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const rows = await db.select().from(category).where(eq(category.userId, c.var.user!.id)).orderBy(asc(category.sortOrder), asc(category.id));
    return c.json(rows.map(toCategoryDTO));
  })
  .post("/", jsonValidator(categoryInput), async (c) => {
    const input = c.req.valid("json");
    const [created] = await db.insert(category).values({ userId: c.var.user!.id, ...input, isSystem: false }).returning();
    return c.json(toCategoryDTO(created), 201);
  })
  .patch("/:id", jsonValidator(categoryInput.partial()), async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(category).where(and(eq(category.id, id), eq(category.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "category not found");
    const input = c.req.valid("json");
    if (existing.isSystem && input.signMode && input.signMode !== existing.signMode) {
      throw new AppError(409, "SYSTEM_CATEGORY_LOCKED", "system category signMode is locked");
    }
    const [updated] = await db.update(category).set({
      name: input.name ?? existing.name,
      signMode: existing.isSystem ? existing.signMode : (input.signMode ?? existing.signMode),
    }).where(and(eq(category.id, id), eq(category.userId, userId))).returning();
    return c.json(toCategoryDTO(updated));
  })
  .delete("/:id", async (c) => {
    const userId = c.var.user!.id;
    const id = parseId(c.req.param("id"));
    const [existing] = await db.select().from(category).where(and(eq(category.id, id), eq(category.userId, userId))).limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "category not found");
    if (existing.isSystem) throw new AppError(409, "SYSTEM_CATEGORY_LOCKED", "system category is locked");
    const refs = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(record).where(and(eq(record.userId, userId), eq(record.categoryId, id))),
      db.select({ count: sql<number>`count(*)` }).from(tag).where(and(eq(tag.userId, userId), eq(tag.categoryId, id))),
      db.select({ count: sql<number>`count(*)` }).from(recurringRule).where(and(eq(recurringRule.userId, userId), eq(recurringRule.categoryId, id))),
    ]);
    const used = refs.reduce((sum, rows) => sum + Number(rows[0]?.count ?? 0), 0);
    if (used > 0) throw new AppError(409, "STILL_IN_USE", "category is still in use", { count: used });
    await db.delete(category).where(and(eq(category.id, id), eq(category.userId, userId)));
    return c.json({ deleted: true });
  });
