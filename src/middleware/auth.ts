import type { MiddlewareHandler } from "hono";
import { auth, type AuthSession, type AuthUser } from "../auth.js";
import { AppError } from "../lib/errors.js";
import { ensureMaterialized, seedUserIfNeeded } from "../services/materialize.js";

export type AppVariables = {
  user: AuthUser | null;
  session: AuthSession | null;
};

export const loadSession: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
};

export const requireAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const user = c.var.user;
  if (!user) throw new AppError(401, "UNAUTHORIZED", "authentication required");
  await seedUserIfNeeded(user.id);
  await ensureMaterialized(user.id);
  await next();
};
