export type LineChartProps = {
  series: { id: string; color: string; dashed?: boolean; points: { x: number; y: number | null }[] }[];
  xLabels: string[];
  height: number;
  todayIndex?: number;
};

function segments(points: { x: number; y: number | null }[]) {
  const out: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const point of points) {
    if (point.y == null) {
      if (current.length) out.push(current);
      current = [];
    } else {
      current.push({ x: point.x, y: point.y });
    }
  }
  if (current.length) out.push(current);
  return out;
}

export function LineChart({ series, xLabels, height, todayIndex }: LineChartProps) {
  const values = series.flatMap((s) => s.points.flatMap((p) => p.y == null ? [] : [p.y]));
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const pad = Math.max((max - min) * 0.1, 1);
  const yMin = min - pad;
  const yMax = max + pad;
  const width = Math.max(xLabels.length - 1, 1) * 40;
  const scaleX = (x: number) => (x / Math.max(xLabels.length - 1, 1)) * width;
  const scaleY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  return (
    <svg data-testid="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" className="line-chart">
      {todayIndex != null && <line x1={scaleX(todayIndex)} x2={scaleX(todayIndex)} y1="0" y2={height} stroke="#64748b" strokeDasharray="3 4" />}
      {series.flatMap((s) => segments(s.points).map((segment, index) => (
        <polyline
          key={`${s.id}-${index}`}
          data-series-id={s.id}
          fill="none"
          stroke={s.color}
          strokeWidth="3"
          strokeDasharray={s.dashed ? "6 5" : undefined}
          points={segment.map((p) => `${scaleX(p.x)},${scaleY(p.y)}`).join(" ")}
        />
      )))}
    </svg>
  );
}
