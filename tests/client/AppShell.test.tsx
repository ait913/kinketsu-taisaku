import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as AppShellMod from "../../client/routes/AppShell";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) =>
      React.createElement("a", { href: to ?? "#", ...props }, children),
    Outlet: () => React.createElement("div", { "data-testid": "outlet" }),
    useNavigate: () => vi.fn(),
    useRouter: () => ({ navigate: vi.fn() }),
    // active nav 判定用 (設計 §5.3)。現在 location を最小スタブで返す。
    useRouterState: (opts?: { select?: (s: unknown) => unknown }) => {
      const state = { location: { pathname: "/", href: "/" }, matches: [] };
      return opts?.select ? opts.select(state) : state;
    },
    useMatchRoute: () => () => false,
    useLocation: () => ({ pathname: "/", href: "/" }),
  };
});

vi.mock("../../client/api/auth", () => ({
  authClient: {
    useSession: () => ({
      data: { user: { email: "reviewer@example.com" } },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));

// jsdom (この Vitest 環境) は localStorage / matchMedia を提供しないため最小実装を注入。
beforeAll(() => {
  let store: Record<string, string> = {};
  const ls = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: ls });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: ls });
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

const AppShell =
  (AppShellMod as typeof AppShellMod & { default?: React.ComponentType }).AppShell ??
  (AppShellMod as { default: React.ComponentType }).default;

function renderAppShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AppShell (§5.3 / §8.2)", () => {
  it("sidebar と bottom-tabs を両方 DOM に描画する", () => {
    renderAppShell();

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-tabs")).toBeInTheDocument();
  });

  it("4 つの nav link data-testid を描画する", () => {
    renderAppShell();

    expect(screen.getAllByTestId("nav-month")).not.toHaveLength(0);
    expect(screen.getAllByTestId("nav-trend")).not.toHaveLength(0);
    expect(screen.getAllByTestId("nav-recurring")).not.toHaveLength(0);
    expect(screen.getAllByTestId("nav-settings")).not.toHaveLength(0);
  });
});
