import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-panel border-subtle rounded-md
          ${variant === "elevated" ? "bg-elevated" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  variant?: "teal" | "amber";
}

export function StatCard({
  label,
  value,
  unit,
  variant = "teal",
  className = "",
  ...props
}: StatCardProps) {
  return (
    <div
      className={`
        bg-panel border-subtle rounded-md p-[18px] relative overflow-hidden
        stat-card-stripe ${variant === "amber" ? "amber" : ""}
        ${className}
      `}
      {...props}
    >
      <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
        {label}
      </div>
      <div className="font-mono text-[26px] font-medium text-text-primary">
        {value}
        {unit && (
          <span className="text-xs text-text-secondary ml-1">{unit}</span>
        )}
      </div>
    </div>
  );
}

interface EntryCardProps extends HTMLAttributes<HTMLDivElement> {
  date: string;
  type: string;
  title: string;
  preview: string;
  meta?: Array<{
    icon: React.ReactNode;
    value: string;
    variant?: "default" | "positive" | "negative";
  }>;
}

export function EntryCard({
  date,
  type,
  title,
  preview,
  meta = [],
  className = "",
  ...props
}: EntryCardProps) {
  return (
    <div
      className={`
        bg-panel border-subtle rounded-md p-5 pl-7 mb-3 cursor-pointer
        transition-all duration-200 relative
        entry-card-accent
        hover:border-teal-muted hover:bg-elevated hover:translate-x-1
        ${className}
      `}
      {...props}
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className="font-mono text-[11px] text-teal-primary tracking-wide">
          {date}
        </span>
        <span className="font-display text-[9px] font-semibold tracking-label uppercase px-2 py-0.5 bg-void text-amber-primary rounded-sm">
          {type}
        </span>
      </div>

      <h3 className="font-body text-base font-semibold text-text-primary mb-2">
        {title}
      </h3>

      <p className="text-[13px] text-text-secondary leading-relaxed mb-3.5 line-clamp-2">
        {preview}
      </p>

      {meta.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs">
          {meta.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 text-text-muted">
              <span className="text-xs opacity-70">{item.icon}</span>
              <span
                className={
                  item.variant === "positive"
                    ? "text-success"
                    : item.variant === "negative"
                    ? "text-danger"
                    : "text-text-secondary"
                }
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
