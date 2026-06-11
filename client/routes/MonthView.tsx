import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";
import type { ApiErrorBody, BundleDTO, CategoryDTO, RecordDTO, RecordInput, TagDTO } from "../api/types";
import { BundleRow } from "../components/BundleRow";
import { RecordSheet } from "../components/RecordSheet";
import { RecordRow } from "../components/RecordRow";
import { SummaryCard } from "../components/SummaryCard";
import { ThemeToggle } from "../components/ThemeToggle";

type MonthData = {
  yearMonth: string;
  currentBalance: number | null;
  endingBalanceForecast: number;
  totals: { incomeForecast: number; expenseForecast: number };
  records: RecordDTO[];
  bundles: BundleDTO[];
};

function currentYearMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date());
}

function errorMessage(error: unknown) {
  const body = error as ApiErrorBody;
  return body.error?.message ?? "保存できませんでした";
}

export function MonthView() {
  const [yearMonth] = useState(currentYearMonth());
  const [bundleOn, setBundleOn] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<RecordDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const month = useQuery({ queryKey: ["month", yearMonth], queryFn: () => api<MonthData>(`/api/months/${yearMonth}`) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<CategoryDTO[]>("/api/categories") });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api<TagDTO[]>("/api/tags") });

  function invalidateRecordData() {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["month"] });
    void queryClient.invalidateQueries({ queryKey: ["trend"] });
    void queryClient.invalidateQueries({ queryKey: ["forecast"] });
  }

  const saveRecord = useMutation({
    mutationFn: (input: RecordInput) => editingRecord
      ? api<RecordDTO>(`/api/records/${editingRecord.id}`, { method: "PATCH", body: JSON.stringify(input) })
      : api<RecordDTO>("/api/records", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      setSheetOpen(false);
      setEditingRecord(null);
      setMessage("");
      invalidateRecordData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => api<{ deleted: true }>(`/api/records/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setSheetOpen(false);
      setEditingRecord(null);
      setMessage("");
      invalidateRecordData();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });

  function openNew() {
    setEditingRecord(null);
    setMessage("");
    setSheetOpen(true);
  }

  function openEdit(recordId: number) {
    const record = data?.records.find((item) => item.id === recordId) ?? null;
    setEditingRecord(record);
    setMessage("");
    setSheetOpen(true);
  }

  const data = month.data;
  const visibleRecords = data?.records.filter((record) => !bundleOn || !data.bundles.some((bundle) => bundle.recordIds.includes(record.id))) ?? [];
  return (
    <section className="view-stack month-view">
      <header className="toolbar">
        <div className="month-switcher"><button aria-label="前月">‹</button><strong>{yearMonth}</strong><button aria-label="翌月">›</button></div>
        <div className="toolbar-actions"><ThemeToggle /><button className="primary desktop-action" onClick={openNew}>＋ 記録を追加</button></div>
      </header>
      {message && <p className="notice error" data-testid="toast">{message}</p>}
      {data && <SummaryCard currentBalance={data.currentBalance} endingBalanceForecast={data.endingBalanceForecast} incomeForecast={data.totals.incomeForecast} expenseForecast={data.totals.expenseForecast} />}
      <label className="toggle"><input type="checkbox" checked={bundleOn} onChange={(e) => setBundleOn(e.target.checked)} /> bundle で表示</label>
      <div className="record-list data-grid">
        <div className="record-head" aria-hidden="true"><span /><span>日付</span><span>説明 / カテゴリ</span><span>状態</span><span>金額</span></div>
        {bundleOn && data?.bundles.map((bundle) => (
          <BundleRow key={bundle.description} bundle={bundle} expanded={expanded === bundle.description} onToggle={(d) => setExpanded(expanded === d ? null : d)}>
            {data.records.filter((r) => bundle.recordIds.includes(r.id)).map((record) => (
              <RecordRow key={record.id} record={record} tag={tags.data?.find((t) => t.id === record.tagId) ?? null} category={categories.data?.find((cat) => cat.id === record.categoryId) ?? { id: record.categoryId, name: "", signMode: "free", isSystem: false, sortOrder: 0 }} onClick={openEdit} />
            ))}
          </BundleRow>
        ))}
        {visibleRecords.map((record) => (
          <RecordRow key={record.id} record={record} tag={tags.data?.find((t) => t.id === record.tagId) ?? null} category={categories.data?.find((cat) => cat.id === record.categoryId) ?? { id: record.categoryId, name: "", signMode: "free", isSystem: false, sortOrder: 0 }} onClick={openEdit} />
        ))}
        {data && data.records.length === 0 && <div data-testid="empty-records" className="empty-state">この月の記録はまだありません</div>}
      </div>
      <button className="fab" onClick={openNew}>＋</button>
      <RecordSheet
        open={sheetOpen}
        record={editingRecord}
        yearMonth={yearMonth}
        categories={categories.data ?? []}
        tags={tags.data ?? []}
        saving={saveRecord.isPending}
        deleting={deleteRecord.isPending}
        onDismiss={() => setSheetOpen(false)}
        onSave={(input) => saveRecord.mutate(input)}
        onDelete={(recordId) => deleteRecord.mutate(recordId)}
      />
    </section>
  );
}
