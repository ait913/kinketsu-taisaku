import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("SettingsView (§11.8)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useQueryMock.mockReset();
    invalidateQueriesMock.mockReset();
    signOutMock.mockReset();
    nextMutationError = null;
    installQueryMock();
  });

  it("control-back tap で / へ navigate する", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await user.click(screen.getByTestId("control-back"));
    expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("定期セクションの追加ボタン tap と rule 行 tap で RuleSheet を開く", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const ruleSection = screen.getByText("定期ルール").closest("section") as HTMLElement;
    await user.click(within(ruleSection).getByText("追加"));
    expect(screen.getByTestId("sheet")).toBeInTheDocument();
    expect(screen.getByText("定期を追加")).toBeInTheDocument();

    await user.click(screen.getByTestId("sheet-close"));
    await user.click(screen.getByText("Netflix"));
    expect(screen.getByTestId("sheet")).toBeInTheDocument();
    expect(screen.getByText("定期を編集")).toBeInTheDocument();
  });

  it("rules 0件で empty-rules を表示する", () => {
    installQueryMock([]);

    render(<SettingsView />);

    expect(screen.getByTestId("empty-rules")).toHaveTextContent("定期ルールがまだありません");
  });

  it("settings-logout tap で authClient.signOut を呼ぶ", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await user.click(screen.getByTestId("settings-logout"));
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("category 削除 STILL_IN_USE で toast 文言を表示する", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    nextMutationError = { error: { code: "STILL_IN_USE", details: { count: 3 } } };
    const categorySection = screen.getByText("カテゴリ管理").closest("section") as HTMLElement;
    await user.click(within(categorySection).getByText("食費"));
    await user.click(screen.getByText("削除"));

    await waitFor(() => expect(screen.getByTestId("toast")).toHaveTextContent("3件で使用中のため削除できません"));
  });
});
