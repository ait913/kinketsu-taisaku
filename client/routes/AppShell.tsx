import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { authClient } from "../api/auth";

const tabs = [
  { to: "/", label: "月" },
  { to: "/trend", label: "推移" },
  { to: "/recurring", label: "定期" },
  { to: "/settings", label: "設定" },
] as const;

export function AppShell() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  useMemo(() => {
    if (!session.isPending && !session.data && !isLogin) void navigate({ to: "/login" });
    if (!session.isPending && session.data && isLogin) void navigate({ to: "/" });
  }, [session.isPending, session.data, isLogin, navigate]);

  if (session.isPending) return <main className="screen"><p>読み込み中</p></main>;
  if (isLogin) return <Outlet />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>金欠対策</strong>
        <nav>{tabs.map((tab) => <Link key={tab.to} to={tab.to} activeProps={{ className: "active" }}>{tab.label}</Link>)}</nav>
      </aside>
      <main className="screen">
        <Outlet />
      </main>
      <nav className="bottom-tabs">
        {tabs.map((tab) => <Link key={tab.to} to={tab.to} activeProps={{ className: "active" }}>{tab.label}</Link>)}
      </nav>
    </div>
  );
}
