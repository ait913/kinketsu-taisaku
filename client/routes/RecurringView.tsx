import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";
import type { ApiErrorBody, CategoryDTO, RuleDTO, RuleInput, TagDTO } from "../api/types";
import { RuleSheet } from "../components/RuleSheet";
import { yen } from "../components/format";

function currentYearMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date());
}

function errorMessage(error: unknown) {
  const body = error as ApiErrorBody;
  return body.error?.message ?? "保存できませんでした";
}

export function RecurringView() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleDTO | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: ["recurring-rules"], queryFn: () => api<RuleDTO[]>("/api/recurring-rules") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<CategoryDTO[]>("/api/categories") });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api<TagDTO[]>("/api/tags") });

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
      setSheetOpen(false);
      setEditingRule(null);
      setMessage("");
      invalidateRuleData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const deleteRule = useMutation({
    mutationFn: ({ id, keepRecords }: { id: number; keepRecords: boolean }) => api<{ deleted: true; removedRecords: number }>(`/api/recurring-rules/${id}?keepRecords=${String(keepRecords)}`, { method: "DELETE" }),
    onSuccess: () => {
      setSheetOpen(false);
      setEditingRule(null);
      setMessage("");
      invalidateRuleData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  function openNew() {
    setEditingRule(null);
    setMessage("");
    setSheetOpen(true);
  }

  function openEdit(rule: RuleDTO) {
    setEditingRule(rule);
    setMessage("");
    setSheetOpen(true);
  }

  function confirmDelete(ruleId: number, keepRecords: boolean) {
    const label = keepRecords ? "未確定の予定だけ削除します。" : "この定期由来の全記録を削除します。";
    if (window.confirm(label)) deleteRule.mutate({ id: ruleId, keepRecords });
  }

  function ruleMeta(rule: RuleDTO) {
    const categoryName = categories.data?.find((category) => category.id === rule.categoryId)?.name;
    const tagName = tags.data?.find((tag) => tag.id === rule.tagId)?.name;
    return [`毎月${rule.dayOfMonth}日`, categoryName, tagName, rule.active ? "" : "停止中"].filter(Boolean).join(" ");
  }

  function categoryTag(rule: RuleDTO) {
    const categoryName = categories.data?.find((category) => category.id === rule.categoryId)?.name;
    const tagName = tags.data?.find((tag) => tag.id === rule.tagId)?.name;
    return [categoryName, tagName].filter(Boolean).join(" / ");
  }

  return (
    <section className="view-stack">
      <header className="toolbar"><h1>定期ルール</h1><button className="primary" onClick={openNew}>＋ 定期を追加</button></header>
      {message && <p className="notice error" data-testid="toast">{message}</p>}
      <div className="rule-list data-grid">
        <div className="rule-head" aria-hidden="true"><span>ラベル</span><span>毎月</span><span>カテゴリ / タグ</span><span>金額</span><span>状態</span></div>
        {rules.data?.map((rule) => (
          <button key={rule.id} className={`row-button rule-row ${rule.active ? "" : "muted"}`} onClick={() => openEdit(rule)}>
            <span className="row-main"><span className="row-title">{rule.label}</span><span className="row-meta">{ruleMeta(rule)}</span></span>
            <span className="rule-day">毎月{rule.dayOfMonth}日</span>
            <span className="rule-category">{categoryTag(rule)}</span>
            <span className={rule.signedAmount >= 0 ? "amount income" : "amount expense"}>{yen(rule.signedAmount)}</span>
            <span className={rule.active ? "status-pill status-confirmed" : "status-pill status-muted"}>{rule.active ? "有効" : "停止中"}</span>
          </button>
        ))}
        {rules.data && rules.data.length === 0 && <div data-testid="empty-rules" className="empty-state">定期ルールがまだありません</div>}
      </div>
      <RuleSheet
        open={sheetOpen}
        rule={editingRule}
        currentMonth={currentYearMonth()}
        categories={categories.data ?? []}
        tags={tags.data ?? []}
        saving={saveRule.isPending}
        deleting={deleteRule.isPending}
        onDismiss={() => setSheetOpen(false)}
        onSave={(input) => saveRule.mutate(input)}
        onDelete={confirmDelete}
      />
    </section>
  );
}
