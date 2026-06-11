import { yen } from "./format";

export type HeroCardProps = {
  endingBalanceForecast: number;
  currentBalance: number | null;
  netForecast: number;
  onAddRecord: () => void;
};

export function HeroCard({ endingBalanceForecast, currentBalance, netForecast, onAddRecord }: HeroCardProps) {
  return (
    <section data-testid="hero-card" className="card card--hero hero-card">
      <span className="hero-blob" />
      <div className="hero-label">月末に残っている残高</div>
      <div data-testid="hero-ending" className="hero-ending amount">{yen(endingBalanceForecast)}</div>
      <div className="hero-subline">
        {currentBalance !== null && <span data-testid="hero-current">現在 {yen(currentBalance)}</span>}
        <span data-testid="hero-net" className={netForecast >= 0 ? "income amount" : "expense amount"}>収支 {yen(netForecast)}</span>
      </div>
      <button data-testid="hero-add" className="hero-add press press--lg" onClick={onAddRecord}>✎ 入力する</button>
    </section>
  );
}
