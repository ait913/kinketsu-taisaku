import type { ErrorHandler } from "hono";
import { AppError } from "../lib/errors.js";

export const errorMiddleware: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as 400);
  }
  console.error(err);
  return c.json({ error: { code: "INTERNAL", message: "internal error" } }, 500);
};
