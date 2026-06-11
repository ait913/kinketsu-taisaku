import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, type ThemeMode } from "./lib/useTheme";
import { router } from "./router";
import "./styles.css";

const queryClient = new QueryClient();
const savedMode = window.localStorage.getItem("kt-theme");
applyTheme(savedMode === "light" || savedMode === "dark" ? (savedMode as ThemeMode) : "auto");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
