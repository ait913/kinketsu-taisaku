import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, resolveTheme, useTheme } from "../../client/lib/useTheme";

import { beforeAll } from "vitest";

// jsdom (この Vitest 環境) は localStorage を提供しないため、テスト内で最小実装を注入する。
// 実装でも設計でもなくテスト環境の欠落への対処 (config 変更禁止のため in-file polyfill)。
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

type MatchMediaStub = MediaQueryList & {
  dispatch: (matches: boolean) => void;
  removeSpy: ReturnType<typeof vi.fn>;
};

const originalMatchMedia = window.matchMedia;

function installMatchMediaStub(initialMatches: boolean): MatchMediaStub {
  let currentMatches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const removeSpy = vi.fn((event: string, callback: EventListenerOrEventListenerObject) => {
    if (event === "change" && typeof callback === "function") {
      listeners.delete(callback as (event: MediaQueryListEvent) => void);
    }
  });

  const stub = {
    get matches() {
      return currentMatches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((event: string, callback: EventListenerOrEventListenerObject) => {
      if (event === "change" && typeof callback === "function") {
        listeners.add(callback as (event: MediaQueryListEvent) => void);
      }
    }),
    removeEventListener: removeSpy,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    dispatch(nextMatches: boolean) {
      currentMatches = nextMatches;
      const event = { matches: nextMatches, media: this.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  } as MatchMediaStub;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(() => stub),
  });

  return stub;
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
  vi.restoreAllMocks();
});

describe("useTheme (§4 / §4.1)", () => {
  it("resolveTheme は light/dark をそのまま返す", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("resolveTheme('auto') は matchMedia.matches=true で dark、false で light を返す", () => {
    installMatchMediaStub(true);
    expect(resolveTheme("auto")).toBe("dark");

    installMatchMediaStub(false);
    expect(resolveTheme("auto")).toBe("light");
  });

  it("matchMedia 未定義では resolveTheme('auto') が既定 light を返す", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(resolveTheme("auto")).toBe("light");
  });

  it("applyTheme は解決済み theme を documentElement の data-theme に設定する", () => {
    installMatchMediaStub(false);

    applyTheme("dark");

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("localStorage 無しの初期 mode は auto で、setMode('dark') 後に data-theme が dark になる", () => {
    installMatchMediaStub(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.mode).toBe("auto");

    act(() => result.current.setMode("dark"));

    expect(result.current.mode).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("kt-theme")).toBe("dark");
  });

  it("mode==='auto' のとき matchMedia change で data-theme がライブ更新される", () => {
    const media = installMatchMediaStub(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.mode).toBe("auto");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => media.dispatch(true));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("mode!=='auto' のとき matchMedia change では data-theme が変わらない", () => {
    const media = installMatchMediaStub(false);
    localStorage.setItem("kt-theme", "light");
    const { result } = renderHook(() => useTheme());

    expect(result.current.mode).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => media.dispatch(true));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("unmount で auto 監視の removeEventListener が呼ばれる", () => {
    const media = installMatchMediaStub(false);
    const { unmount } = renderHook(() => useTheme());

    unmount();

    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
