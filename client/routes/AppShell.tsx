import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { authClient } from "../api/auth";
import { ThemeToggle } from "../components/ThemeToggle";

const tabs = [
  { to: "/", label: "月", slug: "month" },
  { to: "/trend", label: "推移", slug: "trend" },
  { to: "/recurring", label: "定期", slug: "recurring" },
  { to: "/settings", label: "設定", slug: "settings" },
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
      <aside className="sidebar" data-testid="sidebar">
        <div className="brand"><span className="brand-mark" /><strong>金欠対策</strong></div>
        <nav>{tabs.map((tab) => <Link key={tab.to} to={tab.to} data-testid={`nav-${tab.slug}`} activeProps={{ className: "active" }}>{tab.label}</Link>)}</nav>
        <div className="sidebar-footer">
          <ThemeToggle />
          <p className="account-email">{session.data?.user.email}</p>
          <button className="logout-button" onClick={() => void authClient.signOut()}>ログアウト</button>
        </div>
      </aside>
      <div className="content-col">
        <main className="screen">
          <Outlet />
        </main>
      </div>
      <nav className="bottom-tabs" data-testid="bottom-tabs">
        {tabs.map((tab) => <Link key={tab.to} to={tab.to} data-testid={`nav-${tab.slug}`} activeProps={{ className: "active" }}>{tab.label}</Link>)}
      </nav>
    </div>
  );
}
