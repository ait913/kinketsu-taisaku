import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodSchema } from "zod";
import { AppError } from "../lib/errors.js";

export function jsonValidator<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result) => {
    if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "validation error", result.error.issues);
  });
}

export function queryValidator<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result) => {
    if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "validation error", result.error.issues);
  });
}

export function paramValidator<T extends ZodSchema>(schema: T) {
  return zValidator("param", schema, (result) => {
    if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "validation error", result.error.issues);
  });
}
