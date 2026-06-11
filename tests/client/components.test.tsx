import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as BundleRowMod from "../../client/components/BundleRow";
import * as LineChartMod from "../../client/components/LineChart";
import * as RecordRowMod from "../../client/components/RecordRow";
import * as SheetMod from "../../client/components/Sheet";

const RecordRow = (RecordRowMod as typeof RecordRowMod & { default?: typeof RecordRowMod.RecordRow }).RecordRow ??
  (RecordRowMod as { default: typeof RecordRowMod.RecordRow }).default;
const BundleRow = (BundleRowMod as typeof BundleRowMod & { default?: typeof BundleRowMod.BundleRow }).BundleRow ??
  (BundleRowMod as { default: typeof BundleRowMod.BundleRow }).default;
const LineChart = (LineChartMod as typeof LineChartMod & { default?: typeof LineChartMod.LineChart }).LineChart ??
  (LineChartMod as { default: typeof LineChartMod.LineChart }).default;
const Sheet = (SheetMod as typeof SheetMod & { default?: typeof SheetMod.Sheet }).Sheet ??
  (SheetMod as { default: typeof SheetMod.Sheet }).default;

const category = { id: 1, name: "支出", signMode: "expense", isSystem: true, sortOrder: 1 };
const tag = { id: 1, categoryId: 1, name: "食費", color: "#00ffaa", sortOrder: 1 };
const record = {
  id: 1,
  date: "2026-06-10",
  yearMonth: "2026-06",
  signedAmount: -1200,
  type: "expense" as const,
  categoryId: 1,
  tagId: 1,
  description: "Lunch",
  paid: false,
  sourceRuleId: null,
  isManuallyEdited: false,
};

describe("RecordRow (§7.7)", () => {
  it("record-row/record-amount を描画し、paid=false のとき record-unpaid-mark を出す", () => {
    render(<RecordRow record={record} tag={tag} category={category} onClick={vi.fn()} />);

    expect(screen.getByTestId("record-row")).toBeInTheDocument();
    expect(screen.getByTestId("record-amount")).toBeInTheDocument();
    expect(screen.getByTestId("record-unpaid-mark")).toBeInTheDocument();
  });

  it("paid=true のとき record-unpaid-mark を出さない", () => {
    render(<RecordRow record={{ ...record, paid: true }} tag={tag} category={category} onClick={vi.fn()} />);

    expect(screen.getByTestId("record-row")).toBeInTheDocument();
    expect(screen.queryByTestId("record-unpaid-mark")).not.toBeInTheDocument();
  });
});

describe("BundleRow (§7.7)", () => {
  it("`${description} (${count})` と bundle-row を描画する", () => {
    render(
      <BundleRow
        bundle={{ description: "Lunch", count: 3, total: -3600, recordIds: [1, 2, 3] }}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByTestId("bundle-row")).toBeInTheDocument();
    expect(screen.getByText("Lunch (3)")).toBeInTheDocument();
  });
});

describe("LineChart (§7.7)", () => {
  it("series ごとに polyline data-series-id を描画し、null 点で polyline を分割する", () => {
    render(
      <LineChart
        height={160}
        xLabels={["1", "2", "3", "4"]}
        series={[
          {
            id: "confirmed",
            color: "#111111",
            points: [
              { x: 0, y: 100 },
              { x: 1, y: 110 },
              { x: 2, y: null },
              { x: 3, y: 120 },
            ],
          },
          {
            id: "forecast",
            color: "#00aa88",
            points: [
              { x: 0, y: 100 },
              { x: 1, y: 110 },
              { x: 2, y: 115 },
              { x: 3, y: 120 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(document.querySelectorAll('polyline[data-series-id="confirmed"]')).toHaveLength(2);
    expect(document.querySelectorAll('polyline[data-series-id="forecast"]')).toHaveLength(1);
  });
});

describe("Sheet (§7.7)", () => {
  it("open=true で表示し、overlay/ESC/close button の 3 経路で onDismiss を呼ぶ", () => {
    const onDismiss = vi.fn();
    render(
      <Sheet open={true} onDismiss={onDismiss} title="Edit">
        <div>content</div>
      </Sheet>,
    );

    expect(screen.getByTestId("sheet-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("sheet")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sheet-overlay"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByTestId("sheet-close"));

    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it("open=false で非表示にする", () => {
    render(
      <Sheet open={false} onDismiss={vi.fn()} title="Closed">
        <div>content</div>
      </Sheet>,
    );

    expect(screen.queryByTestId("sheet-overlay")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
  });

  it("rightAction があると sheet-action を描画する", () => {
    const onClick = vi.fn();
    render(
      <Sheet open={true} onDismiss={vi.fn()} title="Action" rightAction={{ label: "Save", onClick }}>
        <div>content</div>
      </Sheet>,
    );

    fireEvent.click(screen.getByTestId("sheet-action"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
