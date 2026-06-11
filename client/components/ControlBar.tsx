import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

export type ControlBarProps = {
  variant: "month" | "year" | "settings";
  label?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleMode?: () => void;
  onSettings?: () => void;
  onBack?: () => void;
};

export function ControlBar({ variant, label, onPrev, onNext, onToggleMode, onSettings, onBack }: ControlBarProps) {
  if (variant === "settings") {
    return (
      <header data-testid="control-bar" className="control-bar">
        <button data-testid="control-back" className="control-button control-back press" onClick={onBack}><ChevronLeft size={20} />戻る</button>
        <h1>設定</h1>
        <span />
      </header>
    );
  }

  return (
    <header data-testid="control-bar" className="control-bar">
      <div className="period-controls">
        <button data-testid="control-prev" className="control-icon press" onClick={onPrev} aria-label="前へ"><ChevronLeft size={20} /></button>
        <button data-testid="control-mode" className="control-mode press" onClick={onToggleMode}>{label}</button>
        <button data-testid="control-next" className="control-icon press" onClick={onNext} aria-label="次へ"><ChevronRight size={20} /></button>
      </div>
      <button data-testid="control-settings" className="control-icon press" onClick={onSettings} aria-label="設定"><Settings size={20} /></button>
    </header>
  );
}
