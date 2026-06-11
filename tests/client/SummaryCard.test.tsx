import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { yen } from "../../client/components/format";
import { SummaryCard } from "../../client/components/SummaryCard";

describe("SummaryCard (§6.1 / §8.1)", () => {
  it("currentBalance===null のとき summary-current を非表示にする", () => {
    render(
      <SummaryCard
        currentBalance={null}
        endingBalanceForecast={98200}
        incomeForecast={250000}
        expenseForecast={-151800}
      />,
    );

    expect(screen.queryByTestId("summary-current")).not.toBeInTheDocument();
  });

  it("currentBalance!==null のとき summary-current を表示する", () => {
    render(
      <SummaryCard
        currentBalance={123456}
        endingBalanceForecast={98200}
        incomeForecast={250000}
        expenseForecast={-151800}
      />,
    );

    expect(screen.getByTestId("summary-current")).toBeInTheDocument();
    expect(screen.getByText(yen(123456))).toBeInTheDocument();
  });

  it("summary-forecast は常に存在し endingBalanceForecast の yen 表示を含む", () => {
    const { rerender } = render(
      <SummaryCard
        currentBalance={null}
        endingBalanceForecast={98200}
        incomeForecast={250000}
        expenseForecast={-151800}
      />,
    );

    expect(screen.getByTestId("summary-forecast")).toBeInTheDocument();
    expect(screen.getByText(yen(98200))).toBeInTheDocument();

    rerender(
      <SummaryCard
        currentBalance={123456}
        endingBalanceForecast={98200}
        incomeForecast={250000}
        expenseForecast={-151800}
      />,
    );

    expect(screen.getByTestId("summary-forecast")).toBeInTheDocument();
    expect(screen.getByText(yen(98200))).toBeInTheDocument();
  });
});
