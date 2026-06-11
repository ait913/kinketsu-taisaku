import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

export type SheetProps = {
  open: boolean;
  onDismiss: () => void;
  title?: string;
  rightAction?: { label: string; onClick: () => void };
  dismissConfirm?: () => boolean | Promise<boolean>;
  children: ReactNode;
};

export function Sheet({ open, onDismiss, title, rightAction, dismissConfirm, children }: SheetProps) {
  async function dismiss() {
    if (!dismissConfirm || await dismissConfirm()) onDismiss();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div data-testid="sheet-overlay" className="sheet-overlay" onClick={() => void dismiss()}>
      <section data-testid="sheet" className="sheet" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-header">
          <button data-testid="sheet-close" className="icon-button" onClick={() => void dismiss()} aria-label="閉じる"><X size={20} /></button>
          <h2>{title}</h2>
          {rightAction ? <button data-testid="sheet-action" onClick={rightAction.onClick}>{rightAction.label}</button> : <span />}
        </header>
        {children}
      </section>
    </div>
  );
}
