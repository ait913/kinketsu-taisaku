export type YearBarChartProps = {
  months: {
    yearMonth: string;
    endingBalanceForecast: number;
    endingBalanceConfirmed: number;
    incomeForecast: number;
    expenseForecast: number;
  }[];
};

export function YearBarChart({ months }: YearBarChartProps) {
  const width = 360;
  const height = 180;
  const values = months.map((month) => month.endingBalanceForecast);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const pad = Math.max((max - min) * 0.1, 1);
  const yMin = min - pad;
  const yMax = max + pad;
  const barWidth = 16;
  const gap = (width - barWidth * 12) / 13;
  const scaleY = (value: number) => height - 28 - ((value - yMin) / (yMax - yMin)) * (height - 44);

  return (
    <svg data-testid="year-bar-chart" className="year-bar-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      {months.map((month, index) => {
        const x = gap + index * (barWidth + gap);
        const y = scaleY(month.endingBalanceForecast);
        const net = month.incomeForecast + month.expenseForecast;
        const settled = month.endingBalanceConfirmed === month.endingBalanceForecast;
        return (
          <g key={month.yearMonth}>
            <rect
              data-month={month.yearMonth}
              x={x}
              y={y}
              width={barWidth}
              height={height - 28 - y}
              rx="8"
              fill={net >= 0 ? "var(--color-income)" : "var(--color-expense)"}
              opacity={settled ? 1 : 0.6}
            />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle">{Number(month.yearMonth.slice(5))}</text>
          </g>
        );
      })}
    </svg>
  );
}
