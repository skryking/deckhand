import { Gem, Mountain, Cpu, Recycle, HelpCircle, Globe, Ship, Plus, Minus } from "lucide-react";
import type { InventoryItem } from "../../types/database";

interface InventoryCardProps {
  item: InventoryItem;
  locationName?: string;
  shipName?: string;
  onClick: () => void;
  onAdjust: (delta: number) => void;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  mineral: {
    icon: <Mountain className="w-3.5 h-3.5" />,
    color: "text-amber-bright bg-amber-dark",
  },
  gem: {
    icon: <Gem className="w-3.5 h-3.5" />,
    color: "text-teal-bright bg-teal-dark",
  },
  component: {
    icon: <Cpu className="w-3.5 h-3.5" />,
    color: "text-blue-400 bg-blue-400/20",
  },
  salvage: {
    icon: <Recycle className="w-3.5 h-3.5" />,
    color: "text-orange-400 bg-orange-400/20",
  },
  other: {
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: "text-text-muted bg-panel",
  },
};

function QualityBar({ quality }: { quality: number }) {
  const percent = (quality / 1000) * 100;
  const color =
    quality >= 750 ? "bg-success" :
    quality >= 400 ? "bg-amber-bright" :
    "bg-danger";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-panel rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="font-mono text-[10px] text-text-muted">{quality}</span>
    </div>
  );
}

export function InventoryCard({
  item,
  locationName,
  shipName,
  onClick,
  onAdjust,
}: InventoryCardProps) {
  const cat = categoryConfig[item.category || "other"] || categoryConfig.other;

  return (
    <div
      onClick={onClick}
      className="bg-panel border-subtle rounded-md p-4 pl-5 mb-3 cursor-pointer
        transition-all duration-200 relative
        hover:border-teal-muted hover:bg-elevated hover:translate-x-1
        before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4
        before:w-[3px] before:rounded-r before:bg-teal-primary/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-sm ${cat.color}`}>
              {cat.icon}
              {item.category || "other"}
            </span>
            <span className="font-body text-sm font-semibold text-text-primary">
              {item.materialName}
            </span>
            {item.source && (
              <span className="font-mono text-[10px] text-text-faint">
                ({item.source})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs mb-1.5">
            <span className="text-text-secondary">
              Quality: <QualityBar quality={item.quality} />
            </span>
          </div>

          <div className="flex gap-3 text-xs">
            {locationName && (
              <span className="flex items-center gap-1 text-text-muted">
                <Globe className="w-3 h-3 opacity-70" />
                {locationName}
              </span>
            )}
            {shipName && (
              <span className="flex items-center gap-1 text-text-muted">
                <Ship className="w-3 h-3 opacity-70" />
                {shipName}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <div>
            <div className="font-mono text-lg font-semibold text-teal-bright">
              {item.quantityCscu.toLocaleString()}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wide">
              cSCU
            </div>
          </div>

          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAdjust(-10)}
              className="p-1 rounded bg-panel border border-subtle text-text-muted hover:text-danger hover:border-danger/50 transition-colors"
              title="Remove 10 cSCU"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onAdjust(10)}
              className="p-1 rounded bg-panel border border-subtle text-text-muted hover:text-success hover:border-success/50 transition-colors"
              title="Add 10 cSCU"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
