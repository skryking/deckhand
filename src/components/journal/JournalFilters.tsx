interface JournalFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  counts: Record<string, number>;
}

const filterOptions = [
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
    <div className="flex gap-1 bg-panel rounded p-1 border-subtle">
      {filterOptions.map((option) => {
        const count = option.value ? counts[option.value] || 0 : counts.total || 0;
        const isActive = activeFilter === option.value;

        return (
          <button
            key={option.value || "all"}
            onClick={() => onFilterChange(option.value)}
            className={`
              px-3 py-1.5 rounded text-xs font-display tracking-display uppercase
              transition-all duration-200
              ${
                isActive
                  ? "bg-teal-dark text-teal-bright"
                  : "text-text-muted hover:text-text-primary hover:bg-hull"
              }
            `}
          >
            {option.label}
            <span
              className={`
                ml-1.5 font-mono text-[10px]
                ${isActive ? "text-teal-bright/70" : "text-text-faint"}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
