import { yen } from "./format";

export type SummaryCardProps = {
  currentBalance: number | null;
  endingBalanceForecast: number;
  incomeForecast: number;
  expenseForecast: number;
};

export function SummaryCard({ currentBalance, endingBalanceForecast, incomeForecast, expenseForecast }: SummaryCardProps) {
  return (
    <section className="summary-card">
      {currentBalance !== null && (
        <div data-testid="summary-current" className="summary-line">
          <span>現在残高</span><strong>{yen(currentBalance)}</strong>
        </div>
      )}
      <div data-testid="summary-forecast" className="summary-line">
        <span>月末着地</span><strong>{yen(endingBalanceForecast)}</strong>
      </div>
      <div className="summary-sub">収入 {yen(incomeForecast)} / 支出 {yen(expenseForecast)}</div>
    </section>
  );
}
