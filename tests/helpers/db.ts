import Database from "better-sqlite3";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dbPath: string | null = null;
let tmpRoot: string | null = null;

export function setupTestEnv() {
  tmpRoot = mkdtempSync(join(tmpdir(), "kinketsu-test-"));
  dbPath = join(tmpRoot, "test.sqlite");

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = dbPath;
  process.env.BETTER_AUTH_SECRET = "vitest-better-auth-secret";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.ALLOWED_ORIGINS = "http://localhost:3000";
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";

  migrateTestDatabase(dbPath);
  return dbPath;
}

export function cleanupTestDatabase() {
  if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  dbPath = null;
  tmpRoot = null;
}

export async function clearBusinessTables() {
  const { db } = await import("../../src/db");
  const tables = [
    "record",
    "recurring_rule",
    "tag",
    "category",
    "settings",
    "anchor",
    "session",
    "account",
    "verification",
    "user",
  ];

  for (const table of tables) {
    db.run(`DELETE FROM ${table}`);
  }
}

function migrateTestDatabase(path: string) {
  const sqlite = new Database(path);
  try {
    sqlite.pragma("foreign_keys = OFF");
    const sql = readFileSync("drizzle/0000_chubby_katie_power.sql", "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      sqlite.exec(statement);
    }
    sqlite.pragma("foreign_keys = ON");
  } finally {
    sqlite.close();
  }
}

