import type { ReactNode } from "react";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  testId: string;
  disabled?: boolean;
  tone?: "income" | "expense" | "move";
};

type SegmentedControlProps<T extends string | number> = {
  field: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string | number>({ field, value, options, onChange, disabled }: SegmentedControlProps<T>) {
  const multiRow = options.length >= 6;

  return (
    <div data-testid={`segment-${field}`} className={multiRow ? "segmented segmented--wrap" : "segmented"} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            data-testid={option.testId}
            className="segmented__option press"
            aria-pressed={selected}
            disabled={disabled || option.disabled}
            data-tone={option.tone}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
