import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HeroCard } from "../../client/components/HeroCard";
import { yen } from "../../client/components/format";

describe("HeroCard (§9.2, §11.5)", () => {
  it("hero-ending を常に yen(endingBalanceForecast) で表示し、currentBalance が null でなければ hero-current を表示する", () => {
    render(<HeroCard endingBalanceForecast={98200} currentBalance={123456} netForecast={1200} onAddRecord={vi.fn()} />);

    expect(screen.getByTestId("hero-card")).toBeInTheDocument();
    expect(screen.getByTestId("hero-ending")).toHaveTextContent(yen(98200));
    expect(screen.getByTestId("hero-current")).toHaveTextContent(yen(123456));
  });

  it("currentBalance が null のとき hero-current を描画しない", () => {
    render(<HeroCard endingBalanceForecast={0} currentBalance={null} netForecast={0} onAddRecord={vi.fn()} />);

    expect(screen.getByTestId("hero-ending")).toHaveTextContent(yen(0));
    expect(screen.queryByTestId("hero-current")).not.toBeInTheDocument();
  });

  it("hero-net は 0 以上で income class、マイナスで expense class を持つ", () => {
    const { rerender } = render(<HeroCard endingBalanceForecast={0} currentBalance={null} netForecast={0} onAddRecord={vi.fn()} />);
    expect(screen.getByTestId("hero-net")).toHaveTextContent(yen(0));
    expect(screen.getByTestId("hero-net")).toHaveClass("income");
    expect(screen.getByTestId("hero-net")).not.toHaveClass("expense");

    rerender(<HeroCard endingBalanceForecast={0} currentBalance={null} netForecast={-1200} onAddRecord={vi.fn()} />);
    expect(screen.getByTestId("hero-net")).toHaveTextContent(yen(-1200));
    expect(screen.getByTestId("hero-net")).toHaveClass("expense");
    expect(screen.getByTestId("hero-net")).not.toHaveClass("income");
  });

  it("hero-add tap で onAddRecord を呼ぶ", async () => {
    const user = userEvent.setup();
    const onAddRecord = vi.fn();

    render(<HeroCard endingBalanceForecast={98200} currentBalance={123456} netForecast={1200} onAddRecord={onAddRecord} />);

    await user.click(screen.getByTestId("hero-add"));
    expect(onAddRecord).toHaveBeenCalledTimes(1);
  });
});
