import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YearBarChart } from "../../client/components/YearBarChart";

const months = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  return {
    yearMonth: `2026-${String(month).padStart(2, "0")}`,
    endingBalanceForecast: 10000 + index * 1000,
    endingBalanceConfirmed: month <= 6 ? 10000 + index * 1000 : 999,
    incomeForecast: month % 2 === 0 ? 3000 : 1000,
    expenseForecast: month % 2 === 0 ? -1000 : -3000,
  };
});

describe("YearBarChart (§9.4, §11.4)", () => {
  it("year-bar-chart 内に rect data-month を 12 本描画する", () => {
    render(<YearBarChart months={months} />);

    expect(screen.getByTestId("year-bar-chart")).toBeInTheDocument();
    expect(document.querySelectorAll("rect[data-month]")).toHaveLength(12);
    for (const month of months) {
      expect(document.querySelector(`rect[data-month="${month.yearMonth}"]`)).toBeInTheDocument();
    }
  });

  it("棒色は incomeForecast+expenseForecast の符号で income/expense 色、確定月は実塗り・予測月は半透明", () => {
    render(<YearBarChart months={months} />);

    const negative = document.querySelector('rect[data-month="2026-01"]');
    const positive = document.querySelector('rect[data-month="2026-02"]');
    const settled = document.querySelector('rect[data-month="2026-06"]');
    const forecast = document.querySelector('rect[data-month="2026-07"]');

    expect(negative).toHaveAttribute("fill", "var(--color-expense)");
    expect(positive).toHaveAttribute("fill", "var(--color-income)");
    expect(settled).toHaveAttribute("opacity", "1");
    expect(forecast).toHaveAttribute("opacity", "0.6");
  });
});
