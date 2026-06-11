import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../api/client";
import type { ApiErrorBody, BundleDTO, CategoryDTO, MonthData, RecordDTO, RecordInput, TagDTO, YearData } from "../api/types";
import { CategoryTagChips, type ChipFilterTarget } from "../components/CategoryTagChips";
import { ControlBar } from "../components/ControlBar";
import { Fab } from "../components/Fab";
import { HeroCard } from "../components/HeroCard";
import { RecordList } from "../components/RecordList";
import { RecordSheet } from "../components/RecordSheet";
import { TrendLineChart } from "../components/TrendLineChart";
import { YearBarChart } from "../components/YearBarChart";
import { yen } from "../components/format";

function currentYearMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date());
}

function addMonths(yearMonth: string, delta: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  return `${year}年${Number(month)}月`;
}

function errorMessage(error: unknown) {
  const body = error as ApiErrorBody;
  return body.error?.message ?? "保存できませんでした";
}

function filteredBundles(bundles: BundleDTO[], records: RecordDTO[]) {
  const ids = new Set(records.map((record) => record.id));
  return bundles.flatMap((bundle) => {
    const memberIds = bundle.recordIds.filter((id) => ids.has(id));
    if (memberIds.length < 2) return [];
    const total = records.filter((record) => memberIds.includes(record.id)).reduce((sum, record) => sum + record.signedAmount, 0);
    return [{ ...bundle, recordIds: memberIds, count: memberIds.length, total }];
  });
}

export function Home() {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [bundleOn, setBundleOn] = useState(false);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChipFilterTarget>(null);
  const [editingRecord, setEditingRecord] = useState<RecordDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const year = Number(yearMonth.slice(0, 4));

  const month = useQuery({ queryKey: ["month", yearMonth], queryFn: () => api<MonthData>(`/api/months/${yearMonth}`) });
  const years = useQuery({ queryKey: ["years", year], queryFn: () => api<YearData>(`/api/years/${year}`), enabled: mode === "year" });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<CategoryDTO[]>("/api/categories") });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api<TagDTO[]>("/api/tags") });

  function invalidateRecordData() {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["month"] });
    void queryClient.invalidateQueries({ queryKey: ["trend"] });
    void queryClient.invalidateQueries({ queryKey: ["forecast"] });
    void queryClient.invalidateQueries({ queryKey: ["years"] });
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
    setEditingRecord(month.data?.records.find((record) => record.id === recordId) ?? null);
    setMessage("");
    setSheetOpen(true);
  }

  const filteredRecords = useMemo(() => {
    const records = month.data?.records ?? [];
    if (!selected) return records;
    return selected.kind === "tag"
      ? records.filter((record) => record.tagId === selected.tagId)
      : records.filter((record) => record.categoryId === selected.categoryId);
  }, [month.data?.records, selected]);

  const moveTotal = useMemo(() => {
    const freeCategoryIds = new Set((categories.data ?? []).filter((category) => category.signMode === "free").map((category) => category.id));
    return (month.data?.byCategory ?? []).filter((item) => freeCategoryIds.has(item.categoryId)).reduce((sum, item) => sum + item.all, 0);
  }, [categories.data, month.data?.byCategory]);

  function prev() {
    if (mode === "month") setYearMonth((current) => addMonths(current, -1));
    else setYearMonth((current) => `${Number(current.slice(0, 4)) - 1}-${current.slice(5)}`);
  }

  function next() {
    if (mode === "month") setYearMonth((current) => addMonths(current, 1));
    else setYearMonth((current) => `${Number(current.slice(0, 4)) + 1}-${current.slice(5)}`);
  }

  return (
    <section className="home-stack">
      <ControlBar
        variant={mode}
        label={mode === "month" ? monthLabel(yearMonth) : `${year}年`}
        onPrev={prev}
        onNext={next}
        onToggleMode={() => setMode((current) => current === "month" ? "year" : "month")}
        onSettings={() => void navigate({ to: "/settings" })}
      />
      {message && <p className="notice error" data-testid="toast">{message}</p>}
      {mode === "month" && month.data && (
        <>
          <HeroCard
            endingBalanceForecast={month.data.endingBalanceForecast}
            currentBalance={month.data.currentBalance}
            netForecast={month.data.totals.incomeForecast + month.data.totals.expenseForecast}
            onAddRecord={openNew}
          />
          <section className="card total-card">
            <div><span>収入</span><strong className="amount income">{yen(month.data.totals.incomeForecast)}</strong></div>
            <div><span>支出</span><strong className="amount expense">{yen(month.data.totals.expenseForecast)}</strong></div>
            <div><span>移動</span><strong className={moveTotal >= 0 ? "amount move" : "amount expense"}>{moveTotal === 0 ? "±¥0" : yen(moveTotal)}</strong></div>
          </section>
          <TrendLineChart yearMonth={yearMonth} />
          <CategoryTagChips
            byTag={month.data.byTag}
            byCategory={month.data.byCategory}
            tags={tags.data ?? []}
            categories={categories.data ?? []}
            selected={selected}
            onSelect={setSelected}
          />
          <label className="toggle bundle-toggle"><input type="checkbox" checked={bundleOn} onChange={(event) => setBundleOn(event.target.checked)} />bundle で表示</label>
          <RecordList
            records={filteredRecords}
            bundles={filteredBundles(month.data.bundles, filteredRecords)}
            tags={tags.data ?? []}
            categories={categories.data ?? []}
            bundleOn={bundleOn}
            expandedBundle={expandedBundle}
            onToggleBundle={(description) => setExpandedBundle(expandedBundle === description ? null : description)}
            onEditRecord={openEdit}
          />
          <Fab onClick={openNew} />
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
        </>
      )}
      {mode === "year" && years.data && (
        <>
          <section className="card year-summary">
            <span>総収支</span>
            <strong className={years.data.months.reduce((sum, item) => sum + item.incomeForecast + item.expenseForecast, 0) >= 0 ? "amount income" : "amount expense"}>
              {yen(years.data.months.reduce((sum, item) => sum + item.incomeForecast + item.expenseForecast, 0))}
            </strong>
          </section>
          <section className="card chart-card">
            <header className="chart-header"><strong>月別</strong></header>
            <YearBarChart months={years.data.months} />
          </section>
          <section className="card year-tags">
            <h2>タグ別集計</h2>
            {years.data.byTag.map((item) => {
              const tag = tags.data?.find((candidate) => candidate.id === item.tagId);
              return <div className="soft-row" key={item.tagId}><span><span className="tag-pill" style={{ backgroundColor: tag?.color ?? "var(--color-move)" }} />{tag?.name ?? `タグ ${item.tagId}`}</span><strong className={item.all >= 0 ? "amount income" : "amount expense"}>{yen(item.all)}</strong></div>;
            })}
          </section>
        </>
      )}
    </section>
  );
}
