import type { IngredientStatus } from "../../types/database";

interface IngredientRowProps {
  ingredient: IngredientStatus;
}

export function IngredientRow({ ingredient }: IngredientRowProps) {
  const percent = ingredient.required > 0
    ? Math.min(100, (ingredient.available / ingredient.required) * 100)
    : 100;
  const missing = Math.max(0, ingredient.required - ingredient.available);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-primary font-medium truncate">
            {ingredient.materialName}
            {ingredient.minQuality > 0 && (
              <span className="text-text-faint ml-1">(Q{ingredient.minQuality}+)</span>
            )}
          </span>
          <span className={`font-mono text-[11px] ${ingredient.sufficient ? 'text-success' : 'text-danger'}`}>
            {ingredient.available} / {ingredient.required} cSCU
          </span>
        </div>
        <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${ingredient.sufficient ? 'bg-success' : 'bg-danger'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {!ingredient.sufficient && (
          <div className="text-[10px] text-danger mt-0.5">
            Need {missing} more cSCU
          </div>
        )}
      </div>
    </div>
  );
}
