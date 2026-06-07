import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppShell } from "./routes/AppShell";
import { Login } from "./routes/Login";
import { MonthView } from "./routes/MonthView";
import { RecurringView } from "./routes/RecurringView";
import { SettingsView } from "./routes/SettingsView";
import { TrendView } from "./routes/TrendView";

const rootRoute = createRootRoute({ component: AppShell });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: MonthView });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: Login });
const trendRoute = createRoute({ getParentRoute: () => rootRoute, path: "/trend", component: TrendView });
const recurringRoute = createRoute({ getParentRoute: () => rootRoute, path: "/recurring", component: RecurringView });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsView });

export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, loginRoute, trendRoute, recurringRoute, settingsRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
