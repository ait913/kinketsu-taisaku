import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { anchor, settings } from "../db/schema.js";
import { todayJST } from "../lib/date.js";
import type { AppVariables } from "../middleware/auth.js";
import { rematerializeFutureForUser } from "../services/materialize.js";
import { jsonValidator } from "./validators.js";

export const settingsRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const [row] = await db.select().from(settings).where(eq(settings.userId, c.var.user!.id)).limit(1);
    return c.json({ materializeMonths: row?.materializeMonths ?? 12 });
  })
  .patch("/", jsonValidator(z.object({ materializeMonths: z.number().int().min(1).max(36) })), async (c) => {
    const userId = c.var.user!.id;
    const { materializeMonths } = c.req.valid("json");
    await db.insert(settings).values({ userId, materializeMonths }).onConflictDoUpdate({
      target: settings.userId,
      set: { materializeMonths },
    });
    await rematerializeFutureForUser(userId);
    return c.json({ materializeMonths });
  });

export const anchorRouter = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const [row] = await db.select().from(anchor).where(eq(anchor.userId, c.var.user!.id)).limit(1);
    return c.json({ balance: row?.balance ?? 0, asOf: row?.asOf ?? todayJST() });
  })
  .put("/", jsonValidator(z.object({
    balance: z.number().int(),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })), async (c) => {
    const userId = c.var.user!.id;
    const input = c.req.valid("json");
    await db.insert(anchor).values({ userId, ...input }).onConflictDoUpdate({
      target: anchor.userId,
      set: input,
    });
    return c.json(input);
  });
