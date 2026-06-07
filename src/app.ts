import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth } from "./auth.js";
import { errorMiddleware } from "./middleware/error.js";
import { loadSession, requireAuth, type AppVariables } from "./middleware/auth.js";
import { recordsRouter } from "./routes/records.js";
import { categoriesRouter } from "./routes/categories.js";
import { tagsRouter } from "./routes/tags.js";
import { recurringRulesRouter } from "./routes/recurring-rules.js";
import { anchorRouter, settingsRouter } from "./routes/settings.js";
import { monthsRouter } from "./routes/months.js";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("/api/*", cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
  credentials: true,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
}));

app.use("/api/*", loadSession);
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use("/api/records/*", requireAuth);
app.use("/api/categories/*", requireAuth);
app.use("/api/tags/*", requireAuth);
app.use("/api/recurring-rules/*", requireAuth);
app.use("/api/settings/*", requireAuth);
app.use("/api/anchor/*", requireAuth);
app.use("/api/months/*", requireAuth);
app.use("/api/years/*", requireAuth);
app.use("/api/trend/*", requireAuth);
app.use("/api/forecast", requireAuth);

app.route("/api/records", recordsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/tags", tagsRouter);
app.route("/api/recurring-rules", recurringRulesRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/anchor", anchorRouter);
app.route("/api", monthsRouter);

if (process.env.SERVE_STATIC === "1") {
  app.use("/*", serveStatic({ root: "./dist/client" }));
  app.get("*", serveStatic({ path: "./dist/client/index.html" }));
}

app.onError(errorMiddleware);
