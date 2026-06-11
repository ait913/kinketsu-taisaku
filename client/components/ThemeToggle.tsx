import type { ThemeMode } from "../lib/useTheme";
import { useTheme } from "../lib/useTheme";

const modes: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "auto", label: "Auto" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-toggle" data-testid="theme-toggle" role="group" aria-label={`テーマ: ${mode}`}>
      {modes.map((item) => (
        <button
          key={item.mode}
          type="button"
          className={mode === item.mode ? "active" : ""}
          aria-pressed={mode === item.mode}
          onClick={() => setMode(item.mode)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
