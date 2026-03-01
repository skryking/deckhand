import { Package, Globe, Ship, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { CargoRun } from "../../types/database";

interface CargoRunCardProps {
  cargoRun: CargoRun;
  originName?: string;
  destinationName?: string;
  shipName?: string;
  onClick: () => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  in_progress: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "In Progress",
    color: "text-amber-bright bg-amber-dark",
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
};

export function CargoRunCard({
  cargoRun,
  originName,
  destinationName,
  shipName,
  onClick,
}: CargoRunCardProps) {
  const status = statusConfig[cargoRun.status || "in_progress"] || statusConfig.in_progress;
  const hasProfit = cargoRun.profit !== null && cargoRun.profit !== undefined;
  const isPositive = hasProfit && cargoRun.profit! >= 0;

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
        ${cargoRun.status === "completed"
          ? isPositive ? "before:bg-success/50" : "before:bg-danger/50"
          : cargoRun.status === "failed"
          ? "before:bg-danger/50"
          : "before:bg-amber-bright/50"}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header: commodity + date */}
          <div className="flex items-center gap-2 mb-1.5">
            <Package className="w-4 h-4 text-teal-primary" />
            <span className="font-body text-sm font-semibold text-text-primary">
              {cargoRun.commodity}
            </span>
            <span className="font-mono text-[10px] text-text-faint">
              {formatDate(cargoRun.startedAt)}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            {originName && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-text-muted" />
                {originName}
              </span>
            )}
            {originName && destinationName && (
              <ArrowRight className="w-3 h-3 text-text-faint" />
            )}
            {destinationName && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-text-muted" />
                {destinationName}
              </span>
            )}
            {!originName && !destinationName && (
              <span className="text-text-muted italic">No route set</span>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex gap-3 text-xs">
            <span className="text-text-muted">
              {cargoRun.quantity.toLocaleString()} SCU
            </span>
            <span className="text-text-muted">
              Buy: {cargoRun.buyPrice.toLocaleString()} aUEC/SCU
            </span>
            {cargoRun.sellPrice !== null && (
              <span className="text-text-muted">
                Sell: {cargoRun.sellPrice.toLocaleString()} aUEC/SCU
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

        {/* Right side: status + profit */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-sm ${status.color}`}
          >
            {status.icon}
            {status.label}
          </span>
          {hasProfit && (
            <div>
              <div
                className={`font-mono text-lg font-semibold ${
                  isPositive ? "text-success" : "text-danger"
                }`}
              >
                {isPositive ? "+" : ""}
                {cargoRun.profit!.toLocaleString()}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wide">
                aUEC profit
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
