export const errorCodes = [
  "UNAUTHORIZED",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "INVALID_CATEGORY",
  "INVALID_TAG",
  "INVALID_RANGE",
  "FORECAST_BEFORE_ANCHOR",
  "SYSTEM_CATEGORY_LOCKED",
  "STILL_IN_USE",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export class AppError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
