interface LedgerFiltersProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showType: 'all' | 'income' | 'expenses';
  onTypeChange: (type: 'all' | 'income' | 'expenses') => void;
  counts: Record<string, number>;
}

const typeOptions: { value: 'all' | 'income' | 'expenses'; label: string }[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expenses", label: "Expenses" },
];

const categoryOptions = [
  { value: null, label: "All Categories" },
  { value: "mission", label: "Mission" },
  { value: "bounty", label: "Bounty" },
  { value: "cargo", label: "Cargo" },
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "repair", label: "Repair" },
  { value: "fuel", label: "Fuel" },
  { value: "insurance", label: "Insurance" },
  { value: "fine", label: "Fine" },
  { value: "food", label: "Food" },
  { value: "armor", label: "Armor" },
  { value: "weapons", label: "Weapons" },
  { value: "ship_components", label: "Components" },
  { value: "clothing", label: "Clothing" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

export function LedgerFilters({
  activeCategory,
  onCategoryChange,
  showType,
  onTypeChange,
  counts,
}: LedgerFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Type filter (All/Income/Expenses) */}
      <div className="flex gap-1 bg-panel rounded p-1 border-subtle">
        {typeOptions.map((option) => {
          const count = option.value === 'all'
            ? counts.total || 0
            : counts[option.value] || 0;
          const isActive = showType === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className={`
                px-3 py-1.5 rounded text-xs font-display tracking-display uppercase
                transition-all duration-200
                ${
                  isActive
                    ? option.value === 'income'
                      ? "bg-success/20 text-success"
                      : option.value === 'expenses'
                      ? "bg-danger/20 text-danger"
                      : "bg-teal-dark text-teal-bright"
                    : "text-text-muted hover:text-text-primary hover:bg-hull"
                }
              `}
            >
              {option.label}
              <span
                className={`
                  ml-1.5 font-mono text-[10px]
                  ${isActive ? "opacity-70" : "text-text-faint"}
                `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-subtle" />

      {/* Category filter */}
      <div className="flex gap-1 bg-panel rounded p-1 border-subtle overflow-x-auto">
        {categoryOptions.map((option) => {
          const count = option.value ? counts[option.value] || 0 : counts.total || 0;
          const isActive = activeCategory === option.value;

          // Don't show categories with 0 count (except "All Categories")
          if (option.value !== null && count === 0) return null;

          return (
            <button
              key={option.value || "all"}
              onClick={() => onCategoryChange(option.value)}
              className={`
                px-3 py-1.5 rounded text-xs font-display tracking-display uppercase whitespace-nowrap
                transition-all duration-200
                ${
                  isActive
                    ? "bg-amber-dark text-amber-bright"
                    : "text-text-muted hover:text-text-primary hover:bg-hull"
                }
              `}
            >
              {option.label}
              {option.value !== null && (
                <span
                  className={`
                    ml-1.5 font-mono text-[10px]
                    ${isActive ? "text-amber-bright/70" : "text-text-faint"}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
