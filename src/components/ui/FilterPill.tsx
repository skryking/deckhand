import type { ReactNode } from "react";

export type FilterPillVariant = "teal" | "amber" | "success" | "danger";

const activeStyles: Record<FilterPillVariant, { pill: string; count: string }> = {
  teal: { pill: "bg-teal-dark text-teal-bright", count: "text-teal-bright/70" },
  amber: { pill: "bg-amber-dark text-amber-bright", count: "text-amber-bright/70" },
  success: { pill: "bg-success/20 text-success", count: "opacity-70" },
  danger: { pill: "bg-danger/20 text-danger", count: "opacity-70" },
};

interface FilterPillProps {
  label: string;
  count?: number;
  active: boolean;
  variant?: FilterPillVariant;
  nowrap?: boolean;
  onClick: () => void;
}

export function FilterPill({
  label,
  count,
  active,
  variant = "teal",
  nowrap = false,
  onClick,
}: FilterPillProps) {
  const styles = activeStyles[variant];
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded text-xs font-display tracking-display uppercase
        transition-all duration-200
        ${nowrap ? "whitespace-nowrap" : ""}
        ${active ? styles.pill : "text-text-muted hover:text-text-primary hover:bg-hull"}
      `}
    >
      {label}
      {count !== undefined && (
        <span
          className={`ml-1.5 font-mono text-[10px] ${
            active ? styles.count : "text-text-faint"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface FilterPillRowProps {
  children: ReactNode;
  className?: string;
}

export function FilterPillRow({ children, className = "" }: FilterPillRowProps) {
  return (
    <div className={`flex gap-1 bg-panel rounded p-1 border-subtle ${className}`}>
      {children}
    </div>
  );
}
