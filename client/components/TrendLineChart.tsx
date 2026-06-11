import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { TrendData } from "../api/types";
import { LineChart } from "./LineChart";

export type TrendLineChartProps = { yearMonth: string };

export function TrendLineChart({ yearMonth }: TrendLineChartProps) {
  const trend = useQuery({ queryKey: ["trend", yearMonth], queryFn: () => api<TrendData>(`/api/trend/${yearMonth}`) });
  const points = trend.data?.points ?? [];
  const nullIndex = points.findIndex((point) => point.confirmed === null);
  const todayIndex = nullIndex > 0 ? nullIndex - 1 : undefined;

  return (
    <section className="card chart-card">
      <header className="chart-header">
        <strong>残高推移</strong>
        <div data-testid="chart-legend" className="chart-legend">
          <span><i className="legend-confirmed" />確定</span>
          <span><i className="legend-forecast" />着地予測</span>
        </div>
      </header>
      {points.length > 0 ? (
        <LineChart
          height={220}
          todayIndex={todayIndex}
          xLabels={points.map((point) => point.date.slice(8))}
          series={[
            { id: "confirmed", color: "var(--color-text)", points: points.map((point, x) => ({ x, y: point.confirmed })) },
            { id: "forecast", color: "var(--color-move)", dashed: true, points: points.map((point, x) => ({ x, y: point.forecast })) },
          ]}
        />
      ) : <p className="empty-state compact">推移データを読み込み中</p>}
    </section>
  );
}
