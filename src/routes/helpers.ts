import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { category, tag } from "../db/schema.js";
import { AppError } from "../lib/errors.js";

export async function requireCategory(userId: string, categoryId: number) {
  const [row] = await db.select().from(category).where(and(eq(category.id, categoryId), eq(category.userId, userId))).limit(1);
  if (!row) throw new AppError(400, "INVALID_CATEGORY", "invalid category");
  return row;
}

export async function validateTag(userId: string, categoryId: number, tagId?: number | null): Promise<number | null> {
  if (tagId == null) return null;
  const [row] = await db.select().from(tag).where(and(eq(tag.id, tagId), eq(tag.userId, userId), eq(tag.categoryId, categoryId))).limit(1);
  if (!row) throw new AppError(400, "INVALID_TAG", "invalid tag");
  return tagId;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id)) throw new AppError(400, "VALIDATION_ERROR", "invalid id");
  return id;
}
