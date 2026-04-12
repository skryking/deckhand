import { CheckCircle2, XCircle, Hammer } from "lucide-react";
import { IngredientRow } from "./IngredientRow";
import type { BlueprintCraftability } from "../../types/database";

interface BlueprintCardProps {
  craftability: BlueprintCraftability;
  onClick: () => void;
}

export function BlueprintCard({ craftability, onClick }: BlueprintCardProps) {
  const { blueprint, ingredients, canCraft, craftableCount } = craftability;

  return (
    <div
      onClick={onClick}
      className={`
        bg-panel border-subtle rounded-md p-4 pl-5 mb-3 cursor-pointer
        transition-all duration-200 relative
        hover:border-teal-muted hover:bg-elevated hover:translate-x-1
        before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4
        before:w-[3px] before:rounded-r
        ${canCraft ? 'before:bg-success/50' : 'before:bg-danger/50'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Hammer className="w-4 h-4 text-teal-primary" />
            <span className="font-body text-sm font-semibold text-text-primary">
              {blueprint.name}
            </span>
            {blueprint.category && (
              <span className="font-mono text-[10px] text-text-faint">
                ({blueprint.category})
              </span>
            )}
          </div>

          {blueprint.description && (
            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
              {blueprint.description}
            </p>
          )}

          {ingredients.length > 0 && (
            <div className="space-y-0.5 mt-2">
              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">
                Ingredients
              </div>
              {ingredients.map((ing, i) => (
                <IngredientRow key={i} ingredient={ing} />
              ))}
            </div>
          )}

          {ingredients.length === 0 && (
            <p className="text-xs text-text-muted italic mt-1">No ingredients defined</p>
          )}
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-sm ${
              canCraft
                ? 'text-success bg-success/20'
                : 'text-danger bg-danger/20'
            }`}
          >
            {canCraft
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Craftable</>
              : <><XCircle className="w-3.5 h-3.5" /> Missing Items</>
            }
          </span>
          {canCraft && craftableCount > 0 && (
            <div>
              <div className="font-mono text-lg font-semibold text-success">
                {craftableCount}x
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wide">
                can craft
              </div>
            </div>
          )}
          {blueprint.outputQuantity && blueprint.outputQuantity > 1 && (
            <div className="text-[10px] text-text-muted">
              Yields {blueprint.outputQuantity} per craft
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
