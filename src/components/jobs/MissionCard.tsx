import {
  Target,
  Crosshair,
  Truck,
  Pickaxe,
  Wrench,
  Search,
  Shield,
  Globe,
  Ship,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import type { Mission } from "../../types/database";

interface MissionCardProps {
  mission: Mission;
  locationName?: string;
  shipName?: string;
  onClick: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  bounty: <Crosshair className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  mining: <Pickaxe className="w-4 h-4" />,
  salvage: <Wrench className="w-4 h-4" />,
  investigation: <Search className="w-4 h-4" />,
  escort: <Shield className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  bounty: "Bounty",
  delivery: "Delivery",
  mining: "Mining",
  salvage: "Salvage",
  investigation: "Investigation",
  escort: "Escort",
};

const statusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  active: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Active",
    color: "text-teal-bright bg-teal-dark",
  },
  completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Completed",
    color: "text-success bg-success/20",
  },
  failed: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Failed",
    color: "text-danger bg-danger/20",
  },
  abandoned: {
    icon: <Ban className="w-3.5 h-3.5" />,
    label: "Abandoned",
    color: "text-text-muted bg-panel",
  },
};

export function MissionCard({
  mission,
  locationName,
  shipName,
  onClick,
}: MissionCardProps) {
  const missionType = mission.missionType || "bounty";
  const typeIcon = typeIcons[missionType] || <Target className="w-4 h-4" />;
  const typeLabel = typeLabels[missionType] || "Mission";
  const status = statusConfig[mission.status || "active"] || statusConfig.active;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) +
      " · " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-panel border-subtle rounded-md p-4 pl-5 mb-3 cursor-pointer
        transition-all duration-200 relative
        hover:border-teal-muted hover:bg-elevated hover:translate-x-1
        before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4
        before:w-[3px] before:rounded-r
        ${mission.status === "completed"
          ? "before:bg-success/50"
          : mission.status === "failed"
          ? "before:bg-danger/50"
          : mission.status === "abandoned"
          ? "before:bg-text-muted/30"
          : "before:bg-teal-bright/50"}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-teal-primary">{typeIcon}</span>
            <span className="font-display text-[10px] font-semibold tracking-label uppercase text-text-muted">
              {typeLabel}
            </span>
            {mission.acceptedAt && (
              <span className="font-mono text-[10px] text-text-faint">
                {formatDate(mission.acceptedAt)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-body text-sm font-semibold text-text-primary mb-1">
            {mission.title}
          </h3>

          {/* Description preview */}
          {mission.description && (
            <p className="text-[13px] text-text-secondary line-clamp-1 mb-2">
              {mission.description}
            </p>
          )}

          {/* Meta chips */}
          <div className="flex gap-3 text-xs">
            {mission.contractor && (
              <span className="text-text-muted">
                {mission.contractor}
              </span>
            )}
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

        {/* Right side: status + reward */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-sm ${status.color}`}
          >
            {status.icon}
            {status.label}
          </span>
          {mission.reward !== null && mission.reward !== undefined && (
            <div>
              <div className="font-mono text-lg font-semibold text-amber-bright">
                {mission.reward.toLocaleString()}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wide">
                aUEC
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
