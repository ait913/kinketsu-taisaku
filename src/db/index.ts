import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "./data/kinketsu.db";
if (!url.startsWith("file:") && url !== ":memory:" && !url.startsWith(":memory:")) {
  mkdirSync(dirname(url), { recursive: true });
}

const sqlite = new Database(url);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
