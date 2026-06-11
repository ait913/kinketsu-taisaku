import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryTagChips, type ChipFilterTarget } from "../../client/components/CategoryTagChips";
import { yen } from "../../client/components/format";
import type { CategoryDTO, GroupCategoryTotal, GroupTagTotal, TagDTO } from "../../client/api/types";

const categories: CategoryDTO[] = [
  { id: 1, name: "食費", signMode: "expense", isSystem: false, sortOrder: 1 },
  { id: 2, name: "給料", signMode: "income", isSystem: false, sortOrder: 2 },
];
const tags: TagDTO[] = [
  { id: 5, categoryId: 1, name: "ランチ", color: "#00ffaa", sortOrder: 1 },
  { id: 6, categoryId: 2, name: "給与", color: "#ffaa00", sortOrder: 2 },
];
const byCategory: GroupCategoryTotal[] = [
  { categoryId: 1, all: -4200, paidOnly: -3000 },
  { categoryId: 2, all: 250000, paidOnly: 250000 },
];
const byTag: GroupTagTotal[] = [
  { tagId: 5, all: -1200, paidOnly: -1200 },
  { tagId: 6, all: 250000, paidOnly: 250000 },
];

function renderChips(selected: ChipFilterTarget = null, onSelect = vi.fn()) {
  render(
    <CategoryTagChips
      byTag={byTag}
      byCategory={byCategory}
      tags={tags}
      categories={categories}
      selected={selected}
      onSelect={onSelect}
    />,
  );
  return onSelect;
}

describe("CategoryTagChips (§9.5, §11.3)", () => {
  it("byTag N件と byCategory 分の chip を描画する", () => {
    renderChips();

    expect(screen.getByTestId("category-tag-chips")).toBeInTheDocument();
    expect(screen.getByTestId("chip-tag-5")).toBeInTheDocument();
    expect(screen.getByTestId("chip-tag-6")).toBeInTheDocument();
    expect(screen.getByTestId("chip-category-1")).toBeInTheDocument();
    expect(screen.getByTestId("chip-category-2")).toBeInTheDocument();
  });

  it("chip tap で onSelect(target) を呼び、同一 chip 再 tap では onSelect(null) を呼ぶ", async () => {
    const user = userEvent.setup();
    const onSelect = renderChips(null);

    await user.click(screen.getByTestId("chip-tag-5"));
    expect(onSelect).toHaveBeenCalledWith({ kind: "tag", tagId: 5 });

    const selectedSelect = vi.fn();
    render(
      <CategoryTagChips
        byTag={byTag}
        byCategory={byCategory}
        tags={tags}
        categories={categories}
        selected={{ kind: "tag", tagId: 5 }}
        onSelect={selectedSelect}
      />,
    );
    await user.click(screen.getAllByTestId("chip-tag-5")[1]);
    expect(selectedSelect).toHaveBeenCalledWith(null);
  });

  it("selected が null でない時 chip-choice は active な親を持ち、合計と chip-clear を含む", async () => {
    const user = userEvent.setup();
    const onSelect = renderChips({ kind: "tag", tagId: 5 });

    const choice = screen.getByTestId("chip-choice");
    expect(choice).toHaveTextContent("ランチ");
    expect(choice).toHaveTextContent(yen(byTag[0].all));
    expect(choice.closest(".collapsible")).toHaveClass("active");

    await user.click(screen.getByTestId("chip-clear"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("selected が null の時 chip-choice は active class を持たない", () => {
    renderChips(null);

    expect(screen.getByTestId("chip-choice").closest(".collapsible")).not.toHaveClass("active");
  });

  it("category chip tap で category target を通知する", async () => {
    const user = userEvent.setup();
    const onSelect = renderChips(null);

    await user.click(screen.getByTestId("chip-category-2"));
    expect(onSelect).toHaveBeenCalledWith({ kind: "category", categoryId: 2 });
  });
});
