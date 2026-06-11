import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Home } from "../../client/routes/Home";
import type { CategoryDTO, MonthData, TagDTO, TrendData, YearData } from "../../client/api/types";

const navigateMock = vi.fn();
const useQueryMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const mutateSpy = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useRouterState: vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: unknown[] }) => useQueryMock(options),
  useMutation: () => ({ mutate: mutateSpy, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

const categories: CategoryDTO[] = [
  { id: 1, name: "食費", signMode: "expense", isSystem: false, sortOrder: 1 },
  { id: 2, name: "給料", signMode: "income", isSystem: false, sortOrder: 2 },
  { id: 3, name: "移動", signMode: "free", isSystem: false, sortOrder: 3 },
];
const tags: TagDTO[] = [
  { id: 1, categoryId: 1, name: "ランチ", color: "#00ffaa", sortOrder: 1 },
  { id: 2, categoryId: 2, name: "給与", color: "#ffaa00", sortOrder: 2 },
];

function monthData(yearMonth: string): MonthData {
  return {
    yearMonth,
    currentBalance: 123456,
    endingBalanceForecast: 98200,
    endingBalanceConfirmed: 90000,
    totals: { incomeForecast: 250000, expenseForecast: -151800, incomeConfirmed: 250000, expenseConfirmed: -50000 },
    byCategory: [
      { categoryId: 1, all: -151800, paidOnly: -50000 },
      { categoryId: 2, all: 250000, paidOnly: 250000 },
    ],
    byTag: [
      { tagId: 1, all: -1800, paidOnly: -1200 },
      { tagId: 2, all: 250000, paidOnly: 250000 },
    ],
    records: [
      {
        id: 1,
        date: `${yearMonth}-10`,
        yearMonth,
        signedAmount: -1200,
        type: "expense",
        categoryId: 1,
        tagId: 1,
        description: "Lunch",
        paid: true,
        sourceRuleId: null,
        isManuallyEdited: false,
      },
    ],
    bundles: [],
  };
}

function emptyMonth(yearMonth: string): MonthData {
  return {
    yearMonth,
    currentBalance: null,
    endingBalanceForecast: 0,
    totals: { incomeForecast: 0, expenseForecast: 0, incomeConfirmed: 0, expenseConfirmed: 0 },
    byCategory: [],
    byTag: [],
    records: [],
    bundles: [],
    endingBalanceConfirmed: 0,
  };
}

function yearData(year: number): YearData {
  return {
    year,
    months: Array.from({ length: 12 }, (_, index) => ({
      yearMonth: `${year}-${String(index + 1).padStart(2, "0")}`,
      endingBalanceForecast: 10000 + index * 1000,
      endingBalanceConfirmed: index < 6 ? 10000 + index * 1000 : 0,
      incomeForecast: 10000,
      expenseForecast: index % 2 === 0 ? -2000 : -12000,
    })),
    byCategory: [],
    byTag: [{ tagId: 1, all: -12000, paidOnly: -10000 }],
  };
}

function trendData(yearMonth: string): TrendData {
  return {
    yearMonth,
    points: [
      { date: `${yearMonth}-01`, confirmed: 1000, forecast: 1000 },
      { date: `${yearMonth}-02`, confirmed: null, forecast: 1200 },
    ],
  };
}

function installQueryMock(monthFactory: (ym: string) => MonthData = monthData) {
  useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const [key, arg] = queryKey;
    if (key === "month") return { data: monthFactory(String(arg)) };
    if (key === "trend") return { data: trendData(String(arg)) };
    if (key === "years") return { data: yearData(Number(arg)) };
    if (key === "categories") return { data: categories };
    if (key === "tags") return { data: tags };
    return { data: undefined };
  });
}

describe("Home (§11.1, §11.2, §11.5)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useQueryMock.mockReset();
    invalidateQueriesMock.mockReset();
    mutateSpy.mockReset();
    installQueryMock();
  });

  it("初期 month で hero-card/record-list を描画し、year-bar-chart は非描画。mode tap で year/month を切り替える", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年6月");
    expect(screen.getByTestId("hero-card")).toBeInTheDocument();
    expect(screen.getByTestId("record-list")).toBeInTheDocument();
    expect(screen.queryByTestId("year-bar-chart")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("control-mode"));
    expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年");
    expect(screen.getByTestId("year-bar-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-card")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("control-mode"));
    expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年6月");
    expect(screen.getByTestId("hero-card")).toBeInTheDocument();
  });

  it("control-settings tap で /settings 相当へ navigate する", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByTestId("control-settings"));
    expect(navigateMock).toHaveBeenCalledWith({ to: "/settings" });
  });

  it("月モードの next/prev は yearMonth を ±1 し、12月→翌年1月・1月→前年12月にロールオーバーする", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByTestId("control-next"));
    await waitFor(() => expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年7月"));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["month", "2026-07"] }));

    for (let i = 0; i < 6; i += 1) await user.click(screen.getByTestId("control-next"));
    await waitFor(() => expect(screen.getByTestId("control-mode")).toHaveTextContent("2027年1月"));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["month", "2027-01"] }));

    await user.click(screen.getByTestId("control-prev"));
    await waitFor(() => expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年12月"));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["month", "2026-12"] }));
  });

  it("年モードの next/prev は year を ±1 して years query を取得する", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByTestId("control-mode"));
    await user.click(screen.getByTestId("control-next"));
    await waitFor(() => expect(screen.getByTestId("control-mode")).toHaveTextContent("2027年"));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["years", 2027] }));

    await user.click(screen.getByTestId("control-prev"));
    await waitFor(() => expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年"));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["years", 2026] }));
  });

  it("§11.5 の空 month shape で empty-records を描画する", () => {
    installQueryMock(emptyMonth);

    render(<Home />);

    expect(screen.getByTestId("empty-records")).toHaveTextContent("この月の記録はまだありません");
  });
});
