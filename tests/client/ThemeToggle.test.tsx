import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as ThemeToggleMod from "../../client/components/ThemeToggle";

// jsdom (この Vitest 環境) は localStorage を提供しないため最小実装を注入 (テスト環境の欠落対処)。
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
});

// §2: export 形式 (default / named) は設計に明記が無いため両対応で解決。
const ThemeToggle =
  (ThemeToggleMod as { default?: React.ComponentType }).default ??
  (ThemeToggleMod as { ThemeToggle?: React.ComponentType }).ThemeToggle;

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle (§5.3 / §7 / §8.2)", () => {
  it("ThemeToggle が default もしくは named export で取得できる", () => {
    expect(typeof ThemeToggle).toBe("function");
  });

  it("theme-toggle と light/dark/auto の 3 択を描画する", () => {
    render(<ThemeToggle />);

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/dark/i)).toBeInTheDocument();
    expect(screen.getByText(/auto/i)).toBeInTheDocument();
  });

  it("各選択肢クリックで mode が切り替わり data-theme / localStorage に反映される (§4)", () => {
    render(<ThemeToggle />);

    // dark を選択 → data-theme=dark, localStorage 保存
    fireEvent.click(screen.getByText(/dark/i));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("kt-theme")).toBe("dark");

    // light を選択 → data-theme=light, localStorage 保存
    fireEvent.click(screen.getByText(/light/i));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("kt-theme")).toBe("light");

    // auto を選択 → localStorage から削除 (§4: auto は次回 auto 復元)
    fireEvent.click(screen.getByText(/auto/i));
    expect(localStorage.getItem("kt-theme")).toBeNull();
  });
});
