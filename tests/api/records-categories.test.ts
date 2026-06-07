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

describe("records API (§4.1)", () => {
  it("未認証は 401 UNAUTHORIZED を返し、エラー形式は §4.8 に従う", async () => {
    const response = await app.request("/api/records?yearMonth=2026-06");
    const body = await readJson<{ error: { code: string; message: string } }>(response);

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBeTypeOf("string");
  });

  it("POST は 201 で signMode により signedAmount を強制し、GET は date asc、PATCH/DELETE は 200", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { incomeCategory, expenseCategory } = await seedSystemCategories(userId);

    const incomeResponse = await app.request(
      "/api/records",
      jsonRequest(
        "POST",
        { date: "2026-06-25", amount: -250000, categoryId: incomeCategory.id, description: "salary", paid: true },
        cookie,
      ),
    );
    const income = await readJson<{ id: number; signedAmount: number }>(incomeResponse);

    expect(incomeResponse.status).toBe(201);
    expect(income.signedAmount).toBe(250000);

    const expenseResponse = await app.request(
      "/api/records",
      jsonRequest(
        "POST",
        { date: "2026-06-01", amount: 65000, categoryId: expenseCategory.id, description: "rent", paid: false },
        cookie,
      ),
    );
    const expense = await readJson<{ id: number; signedAmount: number }>(expenseResponse);

    expect(expenseResponse.status).toBe(201);
    expect(expense.signedAmount).toBe(-65000);

    const listResponse = await app.request("/api/records?yearMonth=2026-06", {
      headers: { Cookie: cookie },
    });
    const list = await readJson<{ date: string; paid: boolean }[]>(listResponse);

    expect(listResponse.status).toBe(200);
    expect(list.map((row) => row.date)).toEqual(["2026-06-01", "2026-06-25"]);
    expect(list.map((row) => row.paid)).toEqual([false, true]);

    const patchResponse = await app.request(
      `/api/records/${expense.id}`,
      jsonRequest("PATCH", { description: "updated rent", paid: true }, cookie),
    );
    const patched = await readJson<{ description: string; paid: boolean }>(patchResponse);

    expect(patchResponse.status).toBe(200);
    expect(patched).toMatchObject({ description: "updated rent", paid: true });

    const deleteResponse = await app.request(`/api/records/${income.id}`, jsonRequest("DELETE", undefined, cookie));
    expect(deleteResponse.status).toBe(200);
    expect(await readJson(deleteResponse)).toEqual({ deleted: true });
  });

  it("生成 record を PATCH すると isManuallyEdited=true にする (§5.4)", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(userId);

    // 設計 §4.4/§5.1: rule 作成で materialize が未確定生成 record を作る。
    // 設計 §5.6: API 前段の rolling 補充で未確定&未編集の生成 record は削除→再生成され得るため、
    //   手動 insert の id は使えない。GET で実 id を取得して PATCH する。
    const ruleResponse = await app.request(
      "/api/recurring-rules",
      jsonRequest(
        "POST",
        {
          label: "サブスク",
          dayOfMonth: 1,
          amount: -100,
          categoryId: expenseCategory.id,
          description: "rule",
          startMonth: "2026-06",
          active: true,
        },
        cookie,
      ),
    );
    expect(ruleResponse.status).toBe(201);

    const listResponse = await app.request(
      "/api/records?yearMonth=2026-06",
      jsonRequest("GET", undefined, cookie),
    );
    const list = await readJson<
      { id: number; sourceRuleId: number | null; isManuallyEdited: boolean; paid: boolean }[]
    >(listResponse);
    const generated = list.find((r) => r.sourceRuleId !== null);
    expect(generated, "rule materialize で生成 record が存在するはず (§5.1)").toBeDefined();
    expect(generated!.isManuallyEdited).toBe(false);

    const response = await app.request(
      `/api/records/${generated!.id}`,
      jsonRequest("PATCH", { description: "manual override" }, cookie),
    );
    const body = await readJson<{ isManuallyEdited: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.isManuallyEdited).toBe(true);
  });
});

describe("categories/tags API (§4.2/§4.3/§4.9)", () => {
  it("categories CRUD と system category lock の status/code を検証する", async () => {
    const { cookie, userId } = await createUserAndCookie();
    const { incomeCategory } = await seedSystemCategories(userId);

    const createResponse = await app.request(
      "/api/categories",
      jsonRequest("POST", { name: "移動", signMode: "free" }, cookie),
    );
    const created = await readJson<{ id: number; name: string; signMode: string; isSystem: boolean }>(createResponse);
    expect(createResponse.status).toBe(201);
    expect(created).toMatchObject({ name: "移動", signMode: "free", isSystem: false });

    const patchResponse = await app.request(
      `/api/categories/${created.id}`,
      jsonRequest("PATCH", { name: "振替" }, cookie),
    );
    expect(patchResponse.status).toBe(200);

    const lockedPatch = await app.request(
      `/api/categories/${incomeCategory.id}`,
      jsonRequest("PATCH", { signMode: "expense" }, cookie),
    );
    const lockedPatchBody = await readJson<{ error: { code: string } }>(lockedPatch);
    // 設計矛盾: §4.2 本文は 400 と書くが、正準のエラー表 §4.8 は SYSTEM_CATEGORY_LOCKED=409。
    // §4.8「これ以外は返さない」が正準なので 409 を期待する。
    expect(lockedPatch.status).toBe(409);
    expect(lockedPatchBody.error.code).toBe("SYSTEM_CATEGORY_LOCKED");

    const lockedDelete = await app.request(
      `/api/categories/${incomeCategory.id}`,
      jsonRequest("DELETE", undefined, cookie),
    );
    const lockedDeleteBody = await readJson<{ error: { code: string } }>(lockedDelete);
    expect(lockedDelete.status).toBe(409);
    expect(lockedDeleteBody.error.code).toBe("SYSTEM_CATEGORY_LOCKED");
  });

  it("使用中 category/tag 削除は 409 STILL_IN_USE、無効 categoryId の tag 作成は 400 INVALID_CATEGORY", async () => {
    const { cookie, userId } = await createUserAndCookie();
    await seedSystemCategories(userId);

    const invalidTag = await app.request(
      "/api/tags",
      jsonRequest("POST", { categoryId: 999999, name: "invalid", color: null }, cookie),
    );
    expect(invalidTag.status).toBe(400);
    expect((await readJson<{ error: { code: string } }>(invalidTag)).error.code).toBe("INVALID_CATEGORY");

    const categoryResponse = await app.request(
      "/api/categories",
      jsonRequest("POST", { name: "食費カテゴリ", signMode: "expense" }, cookie),
    );
    const expenseCategory = await readJson<{ id: number }>(categoryResponse);
    expect(categoryResponse.status).toBe(201);

    const tagResponse = await app.request(
      "/api/tags",
      jsonRequest("POST", { categoryId: expenseCategory.id, name: "食費", color: "#00ffaa" }, cookie),
    );
    const tag = await readJson<{ id: number }>(tagResponse);
    expect(tagResponse.status).toBe(201);

    const recordResponse = await app.request(
      "/api/records",
      jsonRequest(
        "POST",
        { date: "2026-06-10", amount: 1200, categoryId: expenseCategory.id, tagId: tag.id, description: "lunch" },
        cookie,
      ),
    );
    expect(recordResponse.status).toBe(201);

    const categoryDelete = await app.request(
      `/api/categories/${expenseCategory.id}`,
      jsonRequest("DELETE", undefined, cookie),
    );
    expect(categoryDelete.status).toBe(409);
    expect((await readJson<{ error: { code: string } }>(categoryDelete)).error.code).toBe("STILL_IN_USE");

    const tagDelete = await app.request(`/api/tags/${tag.id}`, jsonRequest("DELETE", undefined, cookie));
    expect(tagDelete.status).toBe(409);
    expect((await readJson<{ error: { code: string } }>(tagDelete)).error.code).toBe("STILL_IN_USE");
  });
});

describe("API validation and tenant isolation (§4.8/§6.3)", () => {
  it("不正 body は 400 VALIDATION_ERROR", async () => {
    const { cookie } = await createUserAndCookie();
    const response = await app.request("/api/records", jsonRequest("POST", { date: "bad", amount: 1 }, cookie));
    const body = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("他人の id を PATCH/DELETE すると 404 NOT_FOUND", async () => {
    const owner = await createUserAndCookie();
    const other = await createUserAndCookie();
    const { expenseCategory } = await seedSystemCategories(owner.userId);

    const createResponse = await app.request(
      "/api/records",
      jsonRequest(
        "POST",
        { date: "2026-06-01", amount: 1000, categoryId: expenseCategory.id, description: "owned" },
        owner.cookie,
      ),
    );
    const record = await readJson<{ id: number }>(createResponse);
    expect(createResponse.status).toBe(201);

    const patchResponse = await app.request(
      `/api/records/${record.id}`,
      jsonRequest("PATCH", { description: "cross tenant" }, other.cookie),
    );
    expect(patchResponse.status).toBe(404);
    expect((await readJson<{ error: { code: string } }>(patchResponse)).error.code).toBe("NOT_FOUND");

    const deleteResponse = await app.request(`/api/records/${record.id}`, jsonRequest("DELETE", undefined, other.cookie));
    expect(deleteResponse.status).toBe(404);
    expect((await readJson<{ error: { code: string } }>(deleteResponse)).error.code).toBe("NOT_FOUND");
  });
});
