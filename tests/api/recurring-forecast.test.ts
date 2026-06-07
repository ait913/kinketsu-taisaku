import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDatabase, clearBusinessTables, setupTestEnv } from "../helpers/db";
import { createUserAndCookie, seedSystemCategories } from "../helpers/auth";

let app: { request: (path: string, init?: RequestInit) => Promise<Response> };

beforeAll(async () => {
  setupTestEnv();
  vi.resetModules();
  app = (await import("../../src/app")).app;
});

beforeEach(async () => {
  await clearBusinessTables();
});

afterAll(() => {
  cleanupTestDatabase();
});

const jsonRequest = (method: string, body?: unknown, cookie?: string): RequestInit => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(cookie ? { Cookie: cookie } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const readJson = async <T>(response: Response) => (await response.json()) as T;

describe("recurring-rules API (§4.4)", () => {
  it("POST 201 後 materialize し、endMonth<startMonth は 400 INVALID_RANGE", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);

    const invalid = await app.request(
      "/api/recurring-rules",
      jsonRequest(
        "POST",
        {
          label: "invalid",
          dayOfMonth: 1,
          amount: 100,
          categoryId: expenseCategory.id,
          startMonth: "2026-07",
          endMonth: "2026-06",
        },
        cookie,
      ),
    );
    expect(invalid.status).toBe(400);
    expect((await readJson<{ error: { code: string } }>(invalid)).error.code).toBe("INVALID_RANGE");

    const created = await app.request(
      "/api/recurring-rules",
      jsonRequest(
        "POST",
        {
          label: "Netflix",
          dayOfMonth: 31,
          amount: 1490,
          categoryId: expenseCategory.id,
          description: "Netflix",
          startMonth: "2026-06",
          endMonth: "2026-06",
          active: true,
        },
        cookie,
      ),
    );
    const rule = await readJson<{ id: number; signedAmount: number }>(created);

    expect(created.status).toBe(201);
    expect(rule.signedAmount).toBe(-1490);

    const records = await app.request("/api/records?yearMonth=2026-06", { headers: { Cookie: cookie } });
    const body = await readJson<{ sourceRuleId: number; date: string; paid: boolean }[]>(records);
    expect(records.status).toBe(200);
    expect(body).toEqual([expect.objectContaining({ sourceRuleId: rule.id, date: "2026-06-30", paid: false })]);
  });

  it("DELETE ?keepRecords は removedRecords を返す", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);

    const created = await app.request(
      "/api/recurring-rules",
      jsonRequest(
        "POST",
        {
          label: "Rent",
          dayOfMonth: 1,
          amount: 65000,
          categoryId: expenseCategory.id,
          description: "Rent",
          startMonth: "2026-06",
          endMonth: "2026-06",
        },
        cookie,
      ),
    );
    const rule = await readJson<{ id: number }>(created);
    expect(created.status).toBe(201);

    const deleted = await app.request(`/api/recurring-rules/${rule.id}?keepRecords=true`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    const body = await readJson<{ deleted: boolean; removedRecords: number }>(deleted);

    expect(deleted.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(body.removedRecords).toBeGreaterThanOrEqual(1);
  });
});

describe("forecast/trend/month aggregation APIs (§1.1/§5.7/§5.8)", () => {
  it("anchorMonth より前の forecast は 400 FORECAST_BEFORE_ANCHOR", async () => {
    const { cookie } = await createUserAndCookie();
    const anchor = await app.request("/api/anchor", jsonRequest("PUT", { balance: 1000, asOf: "2026-06-01" }, cookie));
    expect(anchor.status).toBe(200);

    const response = await app.request("/api/forecast?from=2026-05&months=1", { headers: { Cookie: cookie } });
    const body = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("FORECAST_BEFORE_ANCHOR");
  });

  it("months/forecast の収支・繰り越し・byCategory/byTag が設計式に一致する", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { incomeCategory, expenseCategory } = await seedSystemCategories(userId);

    const tagResponse = await app.request(
      "/api/tags",
      jsonRequest("POST", { categoryId: expenseCategory.id, name: "food", color: null }, cookie),
    );
    const tag = await readJson<{ id: number }>(tagResponse);
    expect(tagResponse.status).toBe(201);

    expect(await app.request("/api/anchor", jsonRequest("PUT", { balance: 100000, asOf: "2026-06-01" }, cookie))).toHaveProperty(
      "status",
      200,
    );

    for (const body of [
      { date: "2026-06-10", amount: -5000, categoryId: incomeCategory.id, paid: true, description: "income" },
      { date: "2026-06-11", amount: 20000, categoryId: incomeCategory.id, paid: false, description: "planned income" },
      { date: "2026-06-12", amount: 3000, categoryId: expenseCategory.id, tagId: tag.id, paid: true, description: "paid food" },
      { date: "2026-06-13", amount: 7000, categoryId: expenseCategory.id, tagId: tag.id, paid: false, description: "planned food" },
      { date: "2026-07-01", amount: 10000, categoryId: expenseCategory.id, paid: true, description: "next" },
    ]) {
      const response = await app.request("/api/records", jsonRequest("POST", body, cookie));
      expect(response.status).toBe(201);
    }

    const monthResponse = await app.request("/api/months/2026-06", { headers: { Cookie: cookie } });
    const month = await readJson<{
      endingBalanceConfirmed: number;
      endingBalanceForecast: number;
      totals: { incomeConfirmed: number; incomeForecast: number; expenseConfirmed: number; expenseForecast: number };
      byCategory: { categoryId: number; all: number; paidOnly: number }[];
      byTag: { tagId: number; all: number; paidOnly: number }[];
    }>(monthResponse);
    expect(monthResponse.status).toBe(200);
    expect(month.endingBalanceConfirmed).toBe(102000);
    expect(month.endingBalanceForecast).toBe(115000);
    expect(month.totals).toMatchObject({
      incomeConfirmed: 5000,
      incomeForecast: 25000,
      expenseConfirmed: -3000,
      expenseForecast: -10000,
    });
    expect(month.byCategory).toEqual(
      expect.arrayContaining([
        { categoryId: incomeCategory.id, all: 25000, paidOnly: 5000 },
        { categoryId: expenseCategory.id, all: -10000, paidOnly: -3000 },
      ]),
    );
    expect(month.byTag).toEqual([{ tagId: tag.id, all: -10000, paidOnly: -3000 }]);

    const forecastResponse = await app.request("/api/forecast?from=2026-06&months=2", { headers: { Cookie: cookie } });
    const forecast = await readJson<{
      series: {
        yearMonth: string;
        startingBalanceForecast: number;
        endingBalanceForecast: number;
        startingBalanceConfirmed: number;
        endingBalanceConfirmed: number;
      }[];
    }>(forecastResponse);
    expect(forecastResponse.status).toBe(200);
    expect(forecast.series).toEqual([
      expect.objectContaining({
        yearMonth: "2026-06",
        startingBalanceForecast: 100000,
        endingBalanceForecast: 115000,
        startingBalanceConfirmed: 100000,
        endingBalanceConfirmed: 102000,
      }),
      expect.objectContaining({
        yearMonth: "2026-07",
        startingBalanceForecast: 115000,
        endingBalanceForecast: 105000,
        startingBalanceConfirmed: 102000,
        endingBalanceConfirmed: 92000,
      }),
    ]);
  });
});
