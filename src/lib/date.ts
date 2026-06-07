import { addMonths, format, getDaysInMonth } from "date-fns";

export function yearMonthOf(date: string): string {
  return date.slice(0, 7);
}

export function todayJST(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonthJST(now = new Date()): string {
  return todayJST(now).slice(0, 7);
}

export function addMonthsToYearMonth(yearMonth: string, amount: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return format(addMonths(new Date(year, month - 1, 1), amount), "yyyy-MM");
}

export function monthRange(fromMonth: string, toMonth: string): string[] {
  const months: string[] = [];
  for (let cursor = fromMonth; cursor <= toMonth; cursor = addMonthsToYearMonth(cursor, 1)) {
    months.push(cursor);
  }
  return months;
}

export function clampDay(yearMonth: string, dayOfMonth: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const dim = getDaysInMonth(new Date(year, month - 1, 1));
  const day = Math.min(dayOfMonth, dim);
  return `${yearMonth}-${String(day).padStart(2, "0")}`;
}

export function daysForMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split("-").map(Number);
  const dim = getDaysInMonth(new Date(year, month - 1, 1));
  return Array.from({ length: dim }, (_, index) => `${yearMonth}-${String(index + 1).padStart(2, "0")}`);
}
