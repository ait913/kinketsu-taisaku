import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { authClient } from "../api/auth";

export function AppShell() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  useMemo(() => {
    if (!session.isPending && !session.data && !isLogin) void navigate({ to: "/login" });
    if (!session.isPending && session.data && isLogin) void navigate({ to: "/" });
  }, [session.isPending, session.data, isLogin, navigate]);

  if (session.isPending) return <main className="shell"><p>読み込み中</p></main>;
  if (isLogin) return <Outlet />;

  return (
    <main className="shell">
      <Outlet />
    </main>
  );
}
