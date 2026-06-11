import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrendLineChart } from "../../client/components/TrendLineChart";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: unknown[] }) => useQueryMock(options),
}));

describe("TrendLineChart (§9.3, §11.4)", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it('useQuery(["trend", ym]) の points を confirmed/forecast 2 series で LineChart に渡し、null 点で polyline を分割する', () => {
    useQueryMock.mockImplementation(({ queryKey }) => {
      expect(queryKey).toEqual(["trend", "2026-06"]);
      return {
        data: {
          yearMonth: "2026-06",
          points: [
            { date: "2026-06-01", confirmed: 1000, forecast: 1000 },
            { date: "2026-06-02", confirmed: 1100, forecast: 1100 },
            { date: "2026-06-03", confirmed: null, forecast: 1200 },
            { date: "2026-06-04", confirmed: 1300, forecast: 1300 },
          ],
        },
      };
    });

    render(<TrendLineChart yearMonth="2026-06" />);

    expect(screen.getByTestId("chart-legend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(document.querySelectorAll('polyline[data-series-id="confirmed"]')).toHaveLength(2);
    expect(document.querySelectorAll('polyline[data-series-id="forecast"]')).toHaveLength(1);
  });

  it("points 空でプレースホルダを表示する", () => {
    useQueryMock.mockReturnValue({ data: { yearMonth: "2026-06", points: [] } });

    render(<TrendLineChart yearMonth="2026-06" />);

    expect(screen.getByTestId("chart-legend")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    expect(screen.getByText("推移データを読み込み中")).toBeInTheDocument();
  });
});
