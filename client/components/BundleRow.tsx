import type { ReactNode } from "react";
import type { BundleDTO } from "../api/types";
import { yen } from "./format";

export type BundleRowProps = {
  bundle: BundleDTO;
  expanded: boolean;
  onToggle: (description: string) => void;
  children?: ReactNode;
};

export function BundleRow({ bundle, expanded, onToggle, children }: BundleRowProps) {
  return (
    <div>
      <button data-testid="bundle-row" className="row-button" onClick={() => onToggle(bundle.description)}>
        <span className="row-main">
          <span className="row-title">{bundle.description} ({bundle.count})</span>
          <span className="row-meta">bundle</span>
        </span>
        <span className={bundle.total >= 0 ? "amount income" : "amount expense"}>{yen(bundle.total)}</span>
      </button>
      {expanded && children}
    </div>
  );
}
