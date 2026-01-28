import {
  Package,
  Target,
  Crosshair,
  Wrench,
  Fuel,
  ShoppingCart,
  Tag,
  Shield,
  AlertTriangle,
  MoreHorizontal,
  Globe,
  Ship,
  Utensils,
  Shirt,
  Swords,
  Cpu,
  Zap,
} from "lucide-react";
import type { Transaction } from "../../types/database";

interface TransactionCardProps {
  transaction: Transaction;
  shipName?: string;
  locationName?: string;
  onClick: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  cargo: <Package className="w-4 h-4" />,
  mission: <Target className="w-4 h-4" />,
  bounty: <Crosshair className="w-4 h-4" />,
  repair: <Wrench className="w-4 h-4" />,
  fuel: <Fuel className="w-4 h-4" />,
  purchase: <ShoppingCart className="w-4 h-4" />,
  sale: <Tag className="w-4 h-4" />,
  insurance: <Shield className="w-4 h-4" />,
  fine: <AlertTriangle className="w-4 h-4" />,
  food: <Utensils className="w-4 h-4" />,
  armor: <Shield className="w-4 h-4" />,
  weapons: <Swords className="w-4 h-4" />,
  ship_components: <Cpu className="w-4 h-4" />,
  clothing: <Shirt className="w-4 h-4" />,
  utilities: <Zap className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  cargo: "Cargo",
  mission: "Mission",
  bounty: "Bounty",
  repair: "Repair",
  fuel: "Fuel",
  purchase: "Purchase",
  sale: "Sale",
  insurance: "Insurance",
  fine: "Fine",
  food: "Food",
  armor: "Armor",
  weapons: "Weapons",
  ship_components: "Ship Components",
  clothing: "Clothing",
  utilities: "Utilities",
  other: "Other",
};

export function TransactionCard({
  transaction,
  shipName,
  locationName,
  onClick,
}: TransactionCardProps) {
  const isIncome = transaction.amount >= 0;
  const formattedAmount = Math.abs(transaction.amount).toLocaleString();
  const amountDisplay = isIncome ? `+${formattedAmount}` : `-${formattedAmount}`;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-US", {
        year: "numeric",
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

  const categoryIcon = categoryIcons[transaction.category] || categoryIcons.other;
  const categoryLabel = categoryLabels[transaction.category] || "Other";

  return (
    <div
      onClick={onClick}
      className={`
        bg-panel border-subtle rounded-md p-4 pl-5 mb-3 cursor-pointer
        transition-all duration-200 relative
        hover:border-teal-muted hover:bg-elevated hover:translate-x-1
        before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4
        before:w-[3px] before:rounded-r
        ${isIncome ? "before:bg-success/50" : "before:bg-danger/50"}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Category and description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`${isIncome ? "text-success" : "text-danger"}`}>
              {categoryIcon}
            </span>
            <span className="font-display text-[10px] font-semibold tracking-label uppercase text-text-muted">
              {categoryLabel}
            </span>
            <span className="font-mono text-[10px] text-text-faint">
              {formatDate(transaction.timestamp)}
            </span>
          </div>

          {transaction.description ? (
            <p className="text-sm text-text-primary truncate">
              {transaction.description}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic">No description</p>
          )}

          {/* Metadata chips */}
          {(locationName || shipName) && (
            <div className="flex gap-3 mt-2 text-xs">
              {locationName && (
                <div className="flex items-center gap-1 text-text-muted">
                  <Globe className="w-3 h-3 opacity-70" />
                  <span className="text-text-secondary">{locationName}</span>
                </div>
              )}
              {shipName && (
                <div className="flex items-center gap-1 text-text-muted">
                  <Ship className="w-3 h-3 opacity-70" />
                  <span className="text-text-secondary">{shipName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Amount */}
        <div className="text-right shrink-0">
          <div
            className={`font-mono text-lg font-semibold ${
              isIncome ? "text-success" : "text-danger"
            }`}
          >
            {amountDisplay}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">
            aUEC
          </div>
        </div>
      </div>
    </div>
  );
}
