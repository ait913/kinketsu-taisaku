export type FabProps = { onClick: () => void };

export function Fab({ onClick }: FabProps) {
  return <button data-testid="fab" className="fab press press--lg" onClick={onClick} aria-label="記録を追加">✎</button>;
}
