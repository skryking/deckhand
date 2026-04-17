import { FilterPill, FilterPillRow, type FilterPillVariant } from "../ui";

interface LedgerFiltersProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showType: "all" | "income" | "expenses";
  onTypeChange: (type: "all" | "income" | "expenses") => void;
  counts: Record<string, number>;
}

type TypeValue = "all" | "income" | "expenses";

const typeOptions: { value: TypeValue; label: string; variant: FilterPillVariant }[] = [
  { value: "all", label: "All", variant: "teal" },
  { value: "income", label: "Income", variant: "success" },
  { value: "expenses", label: "Expenses", variant: "danger" },
];

const categoryOptions: { value: string | null; label: string }[] = [
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
      <FilterPillRow>
        {typeOptions.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            count={option.value === "all" ? counts.total || 0 : counts[option.value] || 0}
            active={showType === option.value}
            variant={option.variant}
            onClick={() => onTypeChange(option.value)}
          />
        ))}
      </FilterPillRow>

      <div className="h-6 w-px bg-subtle" />

      <FilterPillRow className="overflow-x-auto">
        {categoryOptions.map((option) => {
          const count = option.value ? counts[option.value] || 0 : counts.total || 0;

          // Hide zero-count categories (but always show "All Categories").
          if (option.value !== null && count === 0) return null;

          return (
            <FilterPill
              key={option.value || "all"}
              label={option.label}
              count={option.value !== null ? count : undefined}
              active={activeCategory === option.value}
              variant="amber"
              nowrap
              onClick={() => onCategoryChange(option.value)}
            />
          );
        })}
      </FilterPillRow>
    </div>
  );
}
