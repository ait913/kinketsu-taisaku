import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";
import { LineChart } from "../components/LineChart";
import { yen } from "../components/format";

type ForecastData = { series: { yearMonth: string; endingBalanceConfirmed: number; endingBalanceForecast: number; incomeForecast: number; expenseForecast: number }[] };
type TrendData = { points: { date: string; confirmed: number | null; forecast: number }[] };

function currentYearMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date());
}

export function TrendView() {
  const [mode, setMode] = useState<"month" | "forecast">("month");
  const [months, setMonths] = useState(6);
  const ym = currentYearMonth();
  const trend = useQuery({ queryKey: ["trend", ym], queryFn: () => api<TrendData>(`/api/trend/${ym}`) });
  const forecast = useQuery({ queryKey: ["forecast", ym, months], queryFn: () => api<ForecastData>(`/api/forecast?from=${ym}&months=${months}`) });
  const todayIndex = trend.data?.points.findIndex((p) => p.confirmed === null);

  return (
    <section>
      <div className="segmented"><button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>当月推移</button><button className={mode === "forecast" ? "active" : ""} onClick={() => setMode("forecast")}>多月予測</button></div>
      {mode === "month" && trend.data && (
        <LineChart height={220} todayIndex={todayIndex && todayIndex > 0 ? todayIndex - 1 : undefined} xLabels={trend.data.points.map((p) => p.date.slice(8))} series={[
          { id: "confirmed", color: "#0f766e", points: trend.data.points.map((p, x) => ({ x, y: p.confirmed })) },
          { id: "forecast", color: "#64748b", dashed: true, points: trend.data.points.map((p, x) => ({ x, y: p.forecast })) },
        ]} />
      )}
      {mode === "forecast" && forecast.data && (
        <>
          <LineChart height={220} xLabels={forecast.data.series.map((p) => p.yearMonth)} series={[
            { id: "confirmed", color: "#0f766e", points: forecast.data.series.map((p, x) => ({ x, y: p.endingBalanceConfirmed })) },
            { id: "forecast", color: "#64748b", dashed: true, points: forecast.data.series.map((p, x) => ({ x, y: p.endingBalanceForecast })) },
          ]} />
          <div className="month-count">{[3, 6, 12].map((n) => <button key={n} onClick={() => setMonths(n)} className={months === n ? "active" : ""}>{n}</button>)}</div>
          <div className="list">{forecast.data.series.map((m) => <div className="month-card" key={m.yearMonth}><strong>{m.yearMonth}</strong><span>{yen(m.endingBalanceForecast)}</span><small>収{yen(m.incomeForecast)} 支{yen(m.expenseForecast)}</small></div>)}</div>
        </>
      )}
    </section>
  );
}
