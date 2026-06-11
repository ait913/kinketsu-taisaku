import { yen } from "./format";

export type SummaryCardProps = {
  currentBalance: number | null;
  endingBalanceForecast: number;
  incomeForecast: number;
  expenseForecast: number;
};

export function SummaryCard({ currentBalance, endingBalanceForecast, incomeForecast, expenseForecast }: SummaryCardProps) {
  return (
    <section className="summary-card metric-grid">
      {currentBalance !== null && (
        <div data-testid="summary-current" className="metric-card">
          <span className="metric-label">現在残高</span>
          <strong className="metric-value">{yen(currentBalance)}</strong>
          <span className="metric-sub">確定</span>
        </div>
      )}
      <div data-testid="summary-forecast" className="metric-card">
        <span className="metric-label">月末着地</span>
        <strong className="metric-value">{yen(endingBalanceForecast)}</strong>
        <span className="metric-sub">予測</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">収入</span>
        <strong className="metric-value income">{yen(incomeForecast)}</strong>
        <span className="metric-sub">当月予測</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">支出</span>
        <strong className="metric-value expense">{yen(expenseForecast)}</strong>
        <span className="metric-sub">当月予測</span>
      </div>
    </section>
  );
}
