import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { runMigrations } from "./db/index.js";

try {
  runMigrations();
} catch (error) {
  console.error("Failed to run database migrations", error);
  process.exit(1);
}

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 8080),
});
