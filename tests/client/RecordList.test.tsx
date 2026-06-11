import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecordList } from "../../client/components/RecordList";
import { yen } from "../../client/components/format";
import type { BundleDTO, CategoryDTO, RecordDTO, TagDTO } from "../../client/api/types";

const categories: CategoryDTO[] = [
  { id: 1, name: "食費", signMode: "expense", isSystem: false, sortOrder: 1 },
  { id: 2, name: "給料", signMode: "income", isSystem: false, sortOrder: 2 },
];
const tags: TagDTO[] = [
  { id: 1, categoryId: 1, name: "ランチ", color: "#00ffaa", sortOrder: 1 },
  { id: 2, categoryId: 2, name: "給与", color: "#ffaa00", sortOrder: 2 },
];
const records: RecordDTO[] = [
  {
    id: 1,
    date: "2026-06-27",
    yearMonth: "2026-06",
    signedAmount: -1490,
    type: "expense",
    categoryId: 1,
    tagId: 1,
    description: "Netflix",
    paid: false,
    sourceRuleId: null,
    isManuallyEdited: false,
  },
  {
    id: 2,
    date: "2026-06-25",
    yearMonth: "2026-06",
    signedAmount: 250000,
    type: "income",
    categoryId: 2,
    tagId: 2,
    description: "給料",
    paid: true,
    sourceRuleId: null,
    isManuallyEdited: false,
  },
  {
    id: 3,
    date: "2026-06-10",
    yearMonth: "2026-06",
    signedAmount: -800,
    type: "expense",
    categoryId: 1,
    tagId: 1,
    description: "Coffee",
    paid: true,
    sourceRuleId: null,
    isManuallyEdited: false,
  },
  {
    id: 4,
    date: "2026-06-11",
    yearMonth: "2026-06",
    signedAmount: -700,
    type: "expense",
    categoryId: 1,
    tagId: 1,
    description: "Coffee",
    paid: false,
    sourceRuleId: null,
    isManuallyEdited: false,
  },
];
const bundles: BundleDTO[] = [{ description: "Coffee", count: 2, total: -1500, recordIds: [3, 4] }];

function renderList(overrides: Partial<React.ComponentProps<typeof RecordList>> = {}) {
  render(
    <RecordList
      records={records}
      bundles={bundles}
      tags={tags}
      categories={categories}
      bundleOn={false}
      expandedBundle={null}
      onToggleBundle={vi.fn()}
      onEditRecord={vi.fn()}
      {...overrides}
    />,
  );
}

function recordRowsBeforeBundle(list: HTMLElement) {
  const children = Array.from(list.children);
  const bundleIndex = children.findIndex((child) => child.querySelector("[data-testid='bundle-row']"));
  return children.slice(0, bundleIndex).flatMap((child) => {
    if (child.matches("[data-testid='record-row']")) return [child];
    return Array.from(child.querySelectorAll("[data-testid='record-row']"));
  });
}

describe("RecordList (§9.6, §11.6)", () => {
  it("未確定→確定→bundle の順に表示し、未確定行だけ record-unpaid-mark を持つ", () => {
    renderList({ bundleOn: true });
    const list = screen.getByTestId("record-list");

    expect(list.textContent).toMatch(/予定[\s\S]*Netflix[\s\S]*確定[\s\S]*給料[\s\S]*bundle[\s\S]*Coffee \(2\)/);

    const rowsBeforeBundle = recordRowsBeforeBundle(list);
    expect(rowsBeforeBundle).toHaveLength(2);
    expect(rowsBeforeBundle[0]).toHaveTextContent("Netflix");
    expect(within(rowsBeforeBundle[0] as HTMLElement).getByTestId("record-unpaid-mark")).toBeInTheDocument();
    expect(rowsBeforeBundle[1]).toHaveTextContent("給料");
    expect(within(rowsBeforeBundle[1] as HTMLElement).queryByTestId("record-unpaid-mark")).not.toBeInTheDocument();
  });

  it("bundleOn=true で bundle-row を表示し、含まれる record は通常リストから除外する", () => {
    renderList({ bundleOn: true });

    expect(screen.getByTestId("bundle-row")).toHaveTextContent("Coffee (2)");
    expect(screen.getByTestId("bundle-row")).toHaveTextContent(yen(-1500));
    const list = screen.getByTestId("record-list");
    const rowsBeforeBundle = recordRowsBeforeBundle(list);
    expect(rowsBeforeBundle.map((row) => row.textContent)).not.toContain(expect.stringContaining("Coffee"));
  });

  it("bundleOn=false では bundle-row を出さず、record-row として表示する", () => {
    renderList({ bundleOn: false });

    expect(screen.queryByTestId("bundle-row")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("record-row")).toHaveLength(4);
    expect(screen.getAllByText("Coffee")).toHaveLength(2);
  });

  it("records 0件かつ bundle も無しで empty-records を表示する", () => {
    renderList({ records: [], bundles: [], bundleOn: true });

    expect(screen.getByTestId("empty-records")).toHaveTextContent("この月の記録はまだありません");
  });
});
