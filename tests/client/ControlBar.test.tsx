import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ControlBar } from "../../client/components/ControlBar";

describe("ControlBar (§9.1, §11.1, §11.2)", () => {
  it("month variant の testid と label を描画し、各 tap で対応 callback を呼ぶ", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToggleMode = vi.fn();
    const onSettings = vi.fn();

    render(
      <ControlBar
        variant="month"
        label="2026年6月"
        onPrev={onPrev}
        onNext={onNext}
        onToggleMode={onToggleMode}
        onSettings={onSettings}
      />,
    );

    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年6月");

    await user.click(screen.getByTestId("control-prev"));
    await user.click(screen.getByTestId("control-next"));
    await user.click(screen.getByTestId("control-mode"));
    await user.click(screen.getByTestId("control-settings"));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onToggleMode).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("year variant の testid と label を描画し、各 tap で対応 callback を呼ぶ", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToggleMode = vi.fn();
    const onSettings = vi.fn();

    render(
      <ControlBar
        variant="year"
        label="2026年"
        onPrev={onPrev}
        onNext={onNext}
        onToggleMode={onToggleMode}
        onSettings={onSettings}
      />,
    );

    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-mode")).toHaveTextContent("2026年");

    await user.click(screen.getByTestId("control-prev"));
    await user.click(screen.getByTestId("control-next"));
    await user.click(screen.getByTestId("control-mode"));
    await user.click(screen.getByTestId("control-settings"));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onToggleMode).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("settings variant は back control と設定見出しを描画し、tap で onBack を呼ぶ", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<ControlBar variant="settings" onBack={onBack} />);

    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-back")).toHaveTextContent("‹ 戻る");
    expect(screen.getByText("設定")).toBeInTheDocument();

    await user.click(screen.getByTestId("control-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
