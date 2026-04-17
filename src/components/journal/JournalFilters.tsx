import { FilterPill, FilterPillRow } from "../ui";

interface JournalFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  counts: Record<string, number>;
}

const filterOptions: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "journal", label: "Journal" },
  { value: "cargo", label: "Cargo Run" },
  { value: "combat", label: "Combat" },
  { value: "acquisition", label: "Acquisition" },
  { value: "mining", label: "Mining" },
  { value: "scavenging", label: "Scavenging" },
];

export function JournalFilters({
  activeFilter,
  onFilterChange,
  counts,
}: JournalFiltersProps) {
  return (
    <FilterPillRow>
      {filterOptions.map((option) => (
        <FilterPill
          key={option.value || "all"}
          label={option.label}
          count={option.value ? counts[option.value] || 0 : counts.total || 0}
          active={activeFilter === option.value}
          onClick={() => onFilterChange(option.value)}
        />
      ))}
    </FilterPillRow>
  );
}
