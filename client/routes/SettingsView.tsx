import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authClient } from "../api/auth";
import { api } from "../api/client";
import type { ApiErrorBody, CategoryDTO, CategoryInput, RuleDTO, RuleInput, TagDTO, TagInput } from "../api/types";
import { CategorySheet } from "../components/CategorySheet";
import { ControlBar } from "../components/ControlBar";
import { RuleSheet } from "../components/RuleSheet";
import { TagSheet } from "../components/TagSheet";
import { yen } from "../components/format";
import { Plus } from "lucide-react";

function currentYearMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date());
}

function errorMessage(error: unknown) {
  const body = error as ApiErrorBody;
  if (body.error?.code === "STILL_IN_USE") {
    const details = body.error.details as { count?: number } | undefined;
    return `${details?.count ?? "複数"}件で使用中のため削除できません`;
  }
  return body.error?.message ?? "保存できませんでした";
}

export function SettingsView() {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [ruleSheetOpen, setRuleSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleDTO | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [editingTag, setEditingTag] = useState<TagDTO | null>(null);
  const [anchorBalance, setAnchorBalance] = useState("0");
  const [anchorAsOf, setAnchorAsOf] = useState("");
  const [materializeMonths, setMaterializeMonths] = useState(12);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: ["recurring-rules"], queryFn: () => api<RuleDTO[]>("/api/recurring-rules") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<CategoryDTO[]>("/api/categories") });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api<TagDTO[]>("/api/tags") });
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => api<{ materializeMonths: number }>("/api/settings") });
  const anchor = useQuery({ queryKey: ["anchor"], queryFn: () => api<{ balance: number; asOf: string }>("/api/anchor") });

  useEffect(() => {
    if (anchor.data) {
      setAnchorBalance(String(anchor.data.balance));
      setAnchorAsOf(anchor.data.asOf);
    }
  }, [anchor.data]);

  useEffect(() => {
    if (settings.data) setMaterializeMonths(settings.data.materializeMonths);
  }, [settings.data]);

  function invalidateCategoryTagData() {
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    void queryClient.invalidateQueries({ queryKey: ["tags"] });
    void queryClient.invalidateQueries({ queryKey: ["month"] });
    void queryClient.invalidateQueries({ queryKey: ["trend"] });
    void queryClient.invalidateQueries({ queryKey: ["forecast"] });
    void queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
  }

  function invalidateRuleData() {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["month"] });
    void queryClient.invalidateQueries({ queryKey: ["trend"] });
    void queryClient.invalidateQueries({ queryKey: ["forecast"] });
    void queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
  }

  const saveRule = useMutation({
    mutationFn: (input: RuleInput) => editingRule
      ? api<RuleDTO>(`/api/recurring-rules/${editingRule.id}`, { method: "PATCH", body: JSON.stringify(input) })
      : api<RuleDTO>("/api/recurring-rules", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      setRuleSheetOpen(false);
      setEditingRule(null);
      setMessage("");
      invalidateRuleData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const deleteRule = useMutation({
    mutationFn: ({ id, keepRecords }: { id: number; keepRecords: boolean }) => api<{ deleted: true; removedRecords: number }>(`/api/recurring-rules/${id}?keepRecords=${String(keepRecords)}`, { method: "DELETE" }),
    onSuccess: () => {
      setRuleSheetOpen(false);
      setEditingRule(null);
      setMessage("");
      invalidateRuleData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const saveCategory = useMutation({
    mutationFn: (input: CategoryInput) => editingCategory
      ? api<CategoryDTO>(`/api/categories/${editingCategory.id}`, { method: "PATCH", body: JSON.stringify(input) })
      : api<CategoryDTO>("/api/categories", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      setCategorySheetOpen(false);
      setEditingCategory(null);
      setMessage("");
      invalidateCategoryTagData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => api<{ deleted: true }>(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setCategorySheetOpen(false);
      setEditingCategory(null);
      setMessage("");
      invalidateCategoryTagData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const saveTag = useMutation({
    mutationFn: (input: TagInput) => editingTag
      ? api<TagDTO>(`/api/tags/${editingTag.id}`, { method: "PATCH", body: JSON.stringify(input) })
      : api<TagDTO>("/api/tags", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      setTagSheetOpen(false);
      setEditingTag(null);
      setMessage("");
      invalidateCategoryTagData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const deleteTag = useMutation({
    mutationFn: (id: number) => api<{ deleted: true }>(`/api/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setTagSheetOpen(false);
      setEditingTag(null);
      setMessage("");
      invalidateCategoryTagData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const saveAnchor = useMutation({
    mutationFn: () => api<{ balance: number; asOf: string }>("/api/anchor", { method: "PUT", body: JSON.stringify({ balance: Number(anchorBalance), asOf: anchorAsOf }) }),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["anchor"] });
      void queryClient.invalidateQueries({ queryKey: ["month"] });
      void queryClient.invalidateQueries({ queryKey: ["trend"] });
      void queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const saveSettings = useMutation({
    mutationFn: (nextMonths: number) => api<{ materializeMonths: number }>("/api/settings", { method: "PATCH", body: JSON.stringify({ materializeMonths: nextMonths }) }),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["records"] });
      void queryClient.invalidateQueries({ queryKey: ["month"] });
      void queryClient.invalidateQueries({ queryKey: ["trend"] });
      void queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  function openCategory(category: CategoryDTO | null) {
    setEditingCategory(category);
    setMessage("");
    setCategorySheetOpen(true);
  }

  function openTag(tag: TagDTO | null) {
    setEditingTag(tag);
    setMessage("");
    setTagSheetOpen(true);
  }

  function openRule(rule: RuleDTO | null) {
    setEditingRule(rule);
    setMessage("");
    setRuleSheetOpen(true);
  }

  function confirmDeleteRule(ruleId: number, keepRecords: boolean) {
    const label = keepRecords ? "未確定の予定だけ削除します。" : "この定期由来の全記録を削除します。";
    if (window.confirm(label)) deleteRule.mutate({ id: ruleId, keepRecords });
  }

  function categoryTag(categoryId: number, tagId: number | null) {
    const categoryName = categories.data?.find((category) => category.id === categoryId)?.name;
    const tagName = tags.data?.find((tag) => tag.id === tagId)?.name;
    return [categoryName, tagName].filter(Boolean).join(" / ");
  }

  return (
    <section className="settings home-stack">
      <ControlBar variant="settings" onBack={() => void navigate({ to: "/" })} />
      {message && <p className="notice error" data-testid="toast">{message}</p>}
      <section className="card">
        <header className="section-header"><h2>定期ルール</h2><button className="soft-button press" onClick={() => openRule(null)}><Plus size={16} />追加</button></header>
        <div className="soft-list">
          {rules.data?.map((rule) => (
            <button key={rule.id} className={`soft-row row-link ${rule.active ? "" : "is-unpaid"}`} onClick={() => openRule(rule)}>
              <span className="row-main">
                <span className="row-title">{rule.label}</span>
                <span className="row-meta">毎月{rule.dayOfMonth}日 {categoryTag(rule.categoryId, rule.tagId)}</span>
              </span>
              <span className={rule.signedAmount >= 0 ? "amount income" : "amount expense"}>{yen(rule.signedAmount)}</span>
              {!rule.active && <span className="status-pill status-muted">停止中</span>}
            </button>
          ))}
          {rules.data && rules.data.length === 0 && <div data-testid="empty-rules" className="empty-state">定期ルールがまだありません</div>}
        </div>
      </section>
      <section className="card">
        <header className="section-header"><h2>カテゴリ管理</h2><button onClick={() => openCategory(null)}><Plus size={16} />追加</button></header>
        {categories.data?.map((cat) => <button className="setting-row row-link" key={cat.id} onClick={() => openCategory(cat)}><span>{cat.name}</span>{cat.isSystem && <span className="badge">システム</span>}</button>)}
      </section>
      <section className="card">
        <header className="section-header"><h2>タグ管理</h2><button onClick={() => openTag(null)}><Plus size={16} />追加</button></header>
        {categories.data?.map((category) => {
          const group = tags.data?.filter((tag) => tag.categoryId === category.id) ?? [];
          if (group.length === 0) return null;
          return <div className="tag-group" key={category.id}><strong>{category.name}</strong>{group.map((tag) => <button className="setting-row row-link" key={tag.id} onClick={() => openTag(tag)}><span><span className="tag-pill" style={{ backgroundColor: tag.color ?? "var(--color-move)" }} />{tag.name}</span></button>)}</div>;
        })}
      </section>
      <section className="card">
        <h2>初期残高アンカー</h2>
        <div className="inline-form">
          <label className="field"><span className="field-label">残高</span><input inputMode="numeric" type="number" step="1" value={anchorBalance} onChange={(event) => setAnchorBalance(event.target.value)} /></label>
          <label className="field"><span className="field-label">基準日</span><input type="date" value={anchorAsOf} onChange={(event) => setAnchorAsOf(event.target.value)} /></label>
          <button onClick={() => saveAnchor.mutate()}>{saveAnchor.isPending ? "保存中" : "保存"}</button>
        </div>
      </section>
      <section className="card">
        <h2>予測期間</h2>
        <div className="inline-form">
          <label className="field"><span className="field-label">表示月数 {materializeMonths}ヶ月</span><input type="range" min="1" max="36" value={materializeMonths} onChange={(event) => setMaterializeMonths(Number(event.target.value))} /></label>
          <button onClick={() => saveSettings.mutate(materializeMonths)}>{saveSettings.isPending ? "保存中" : "保存"}</button>
        </div>
      </section>
      <section className="card">
        <h2>アカウント</h2>
        <div className="soft-row account-row">
          <span>{session.data?.user.email}</span>
          <button data-testid="settings-logout" className="danger-button" onClick={() => void authClient.signOut()}>ログアウト</button>
        </div>
      </section>
      <RuleSheet
        open={ruleSheetOpen}
        rule={editingRule}
        currentMonth={currentYearMonth()}
        categories={categories.data ?? []}
        tags={tags.data ?? []}
        saving={saveRule.isPending}
        deleting={deleteRule.isPending}
        onDismiss={() => setRuleSheetOpen(false)}
        onSave={(input) => saveRule.mutate(input)}
        onDelete={confirmDeleteRule}
      />
      <CategorySheet
        open={categorySheetOpen}
        category={editingCategory}
        saving={saveCategory.isPending}
        deleting={deleteCategory.isPending}
        onDismiss={() => setCategorySheetOpen(false)}
        onSave={(input) => saveCategory.mutate(input)}
        onDelete={(categoryId) => deleteCategory.mutate(categoryId)}
      />
      <TagSheet
        open={tagSheetOpen}
        tag={editingTag}
        categories={categories.data ?? []}
        saving={saveTag.isPending}
        deleting={deleteTag.isPending}
        onDismiss={() => setTagSheetOpen(false)}
        onSave={(input) => saveTag.mutate(input)}
        onDelete={(tagId) => deleteTag.mutate(tagId)}
      />
    </section>
  );
}
