import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppShell } from "./routes/AppShell";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { SettingsView } from "./routes/SettingsView";

const rootRoute = createRootRoute({ component: AppShell });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: Login });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsView });

export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, loginRoute, settingsRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
