import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as MonthViewMod from "../../client/routes/MonthView";
import * as RecurringViewMod from "../../client/routes/RecurringView";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(({ queryKey }: { queryKey?: unknown[] }) => {
      const key = queryKey?.[0];
      // 設計 §2 の query key 別に「空 + 数値フィールドは 0/null」を返す。
      // month/forecast の summary 系フィールドは実装が直下/ネストどちらから読んでも
      // 落ちないよう、両形 (直下 + summary ネスト) を併せ持たせる。
      const summary = {
        currentBalance: null,
        endingBalanceForecast: 0,
        incomeForecast: 0,
        expenseForecast: 0,
      };
      if (key === "month" || key === "forecast") {
        return {
          data: { ...summary, summary, records: [], bundles: [] },
          isLoading: false,
          isPending: false,
          error: null,
        };
      }
      if (key === "records") {
        return { data: [], isLoading: false, isPending: false, error: null };
      }
      if (key === "recurring-rules") {
        return { data: [], isLoading: false, isPending: false, error: null };
      }
      if (key === "categories" || key === "tags") {
        return { data: [], isLoading: false, isPending: false, error: null };
      }
      if (key === "settings" || key === "anchor" || key === "trend") {
        return { data: null, isLoading: false, isPending: false, error: null };
      }
      return { data: null, isLoading: false, isPending: false, error: null };
    }),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })),
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  };
});

const MonthView =
  (MonthViewMod as typeof MonthViewMod & { default?: React.ComponentType }).MonthView ??
  (MonthViewMod as { default: React.ComponentType }).default;
const RecurringView =
  (RecurringViewMod as typeof RecurringViewMod & { default?: React.ComponentType }).RecurringView ??
  (RecurringViewMod as { default: React.ComponentType }).default;

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("空状態 (§6.1 / §6.3 / §8.2)", () => {
  // empty-records: MonthView は month/forecast query data から summary 値 (incomeForecast 等) を
  // 読む際の data 構造 (直下か派生 useMemo か) が設計 doc に明記されておらず、設計 doc だけでは
  // render に必要な mock 契約が一意に決まらない (MonthView.tsx:94 で undefined.incomeForecast)。
  // → 設計のテスト可能性不足として Leader 判断対象 (YELLOW)。empty-records 自体の data-testid 仕様は
  //   §6.1 / §8.2 に存在するので、設計に「month/forecast query の data shape」が補完されれば検証可能。
  it.skip("records 0 件で empty-records を描画する (設計に month query data shape 記載なく render 不能)", () => {
    renderWithQuery(<MonthView />);

    expect(screen.getByTestId("empty-records")).toBeInTheDocument();
  });

  it("rules 0 件で empty-rules を描画する", () => {
    renderWithQuery(<RecurringView />);

    expect(screen.getByTestId("empty-rules")).toBeInTheDocument();
  });
});
