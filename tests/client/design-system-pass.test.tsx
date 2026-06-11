import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlBar } from "../../client/components/ControlBar";
import { SettingsView } from "../../client/routes/SettingsView";
import type { CategoryDTO, RuleDTO, TagDTO } from "../../client/api/types";

let nextMutationError: unknown = null;

const { navigateMock, useQueryMock, invalidateQueriesMock, signOutMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useQueryMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useRouterState: vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: unknown[] }) => useQueryMock(options),
  useMutation: (options: { onError?: (error: unknown) => void; onSuccess?: () => void }) => ({
    mutate: vi.fn(() => {
      if (nextMutationError) {
        const error = nextMutationError;
        nextMutationError = null;
        options.onError?.(error);
      } else {
        options.onSuccess?.();
      }
    }),
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("../../client/api/auth", () => ({
  authClient: {
    useSession: () => ({ data: { user: { email: "touri@example.com" } }, isPending: false }),
    signOut: signOutMock,
  },
}));

const categories: CategoryDTO[] = [
  { id: 1, name: "食費", signMode: "expense", isSystem: false, sortOrder: 1 },
  { id: 2, name: "給料", signMode: "income", isSystem: false, sortOrder: 2 },
];
const tags: TagDTO[] = [{ id: 1, categoryId: 1, name: "ランチ", color: "#00ffaa", sortOrder: 1 }];
const rules: RuleDTO[] = [
  {
    id: 1,
    label: "Netflix",
    dayOfMonth: 27,
    signedAmount: -1490,
    type: "expense",
    categoryId: 1,
    tagId: 1,
    description: "Netflix",
    startMonth: "2026-06",
    endMonth: null,
    active: true,
  },
];

function installQueryMock(ruleData: RuleDTO[] = rules) {
  useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const [key] = queryKey;
    if (key === "recurring-rules") return { data: ruleData };
    if (key === "categories") return { data: categories };
    if (key === "tags") return { data: tags };
    if (key === "settings") return { data: { materializeMonths: 12 } };
    if (key === "anchor") return { data: { balance: 1000, asOf: "2026-06-01" } };
    return { data: undefined };
  });
}

function expectNoSelectControls(root: HTMLElement) {
  expect(root.querySelector("select")).toBeNull();
  expect(within(root).queryByRole("combobox")).not.toBeInTheDocument();
}

function expectSegmentSwitches(root: HTMLElement, testId: string, fromTestId: string, toTestId: string) {
  expect(within(root).getByTestId(testId)).toBeInTheDocument();
  const from = within(root).getByTestId(fromTestId);
  const to = within(root).getByTestId(toTestId);

  expect(from).toHaveAttribute("aria-pressed", "true");
  expect(to).toHaveAttribute("aria-pressed", "false");

  return { from, to };
}

describe("Design system pass (§1, §2, §3, §6, §7)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useQueryMock.mockReset();
    invalidateQueriesMock.mockReset();
    signOutMock.mockReset();
    nextMutationError = null;
    installQueryMock();
  });

  it("token 正規化値を styles.css に持つ", () => {
    const css = readFileSync(resolve(__dirname, "../../client/styles.css"), "utf8");

    expect(css).toMatch(/--radius-xs:\s*8px/);
    expect(css).toMatch(/--radius-sm:\s*12px/);
    expect(css).toMatch(/--radius-md:\s*16px/);
    expect(css).toMatch(/--radius-card:\s*24px/);
    expect(css).toMatch(/--space-0_5:\s*2px/);
    expect(css).toMatch(/--space-12:\s*48px/);
  });

  it("focus-visible は color-move の 2px outline を持つ", () => {
    const css = readFileSync(resolve(__dirname, "../../client/styles.css"), "utf8");

    expect(css).toMatch(/:focus-visible\s*\{/);
    expect(css).toMatch(/outline:\s*2px\s+solid\s+var\(--color-move\)/);
  });

  it("描画 DOM textContent に絵文字・記号アイコンを含めない", () => {
    const { container, rerender } = render(<ControlBar variant="settings" onBack={vi.fn()} />);
    const textContents = [container.textContent ?? ""];

    rerender(
      <ControlBar
        variant="month"
        label="2026年6月"
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onToggleMode={vi.fn()}
        onSettings={vi.fn()}
      />,
    );
    textContents.push(container.textContent ?? "");

    expect(textContents.join("")).not.toMatch(/[✎⚙‹›×●▾▸＋]/);
  });

  it("RuleSheet は select を使わず、有効状態 segmented の aria-pressed が入れ替わる", async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsView />);

    const ruleSection = screen.getByText("定期ルール").closest("section") as HTMLElement;
    await user.click(within(ruleSection).getByText("追加"));

    const sheet = screen.getByTestId("sheet");
    expectNoSelectControls(sheet);
    expectNoSelectControls(container);

    const segmentActive = within(sheet).getByTestId("segment-active");
    const enabled = within(segmentActive).getByText("有効");
    const stopped = within(segmentActive).getByText("停止");

    // 設計 §3.1: 初期選択(有効)が aria-pressed=true、別 option(停止)tap で選択が移動
    expect(enabled).toHaveAttribute("aria-pressed", "true");
    expect(stopped).toHaveAttribute("aria-pressed", "false");
    await user.click(stopped);
    expect(enabled).toHaveAttribute("aria-pressed", "false");
    expect(stopped).toHaveAttribute("aria-pressed", "true");
  });

  it("CategorySheet は select を使わず、符号 segmented の aria-pressed が入れ替わる", async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsView />);

    const categorySection = screen.getByText("カテゴリ管理").closest("section") as HTMLElement;
    await user.click(within(categorySection).getByText("食費"));

    const sheet = screen.getByTestId("sheet");
    expectNoSelectControls(sheet);
    expectNoSelectControls(container);

    const { from, to } = expectSegmentSwitches(sheet, "segment-sign", "segment-sign-expense", "segment-sign-income");
    await user.click(to);
    expect(from).toHaveAttribute("aria-pressed", "false");
    expect(to).toHaveAttribute("aria-pressed", "true");
  });
});
