import { createHmac, randomUUID } from "node:crypto";

export async function createUserAndCookie() {
  const { db } = await import("../../src/db");
  const schema = await import("../../src/db/schema");

  const now = new Date();
  const userId = randomUUID();
  const token = randomUUID().replaceAll("-", "");

  await db.insert(schema.user).values({
    id: userId,
    name: "Vitest User",
    email: `${userId}@example.test`,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.session).values({
    id: randomUUID(),
    userId,
    token,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    ipAddress: null,
    userAgent: "vitest",
    createdAt: now,
    updatedAt: now,
  });

  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest("base64");

  return {
    userId,
    cookie: `better-auth.session_token=${token}.${signature}`,
  };
}

export async function seedSystemCategories(userId: string) {
  const { db } = await import("../../src/db");
  const schema = await import("../../src/db/schema");

  const rows = await db
    .insert(schema.category)
    .values([
      { userId, name: "収入", signMode: "income", isSystem: true, sortOrder: 1 },
      { userId, name: "支出", signMode: "expense", isSystem: true, sortOrder: 2 },
    ])
    .returning();

  return {
    incomeCategory: rows[0],
    expenseCategory: rows[1],
  };
}

