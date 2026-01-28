import { Ship, Calendar, Wallet, MoreVertical, Pencil, Trash2, ExternalLink, MapPin } from "lucide-react";
import { useState } from "react";
import type { Ship as ShipType, ShipCurrentLocation } from "../../types/database";

interface ShipCardProps {
  ship: ShipType;
  currentLocation?: ShipCurrentLocation | null;
  onEdit: (ship: ShipType) => void;
  onDelete: (ship: ShipType) => void;
  onClick?: (ship: ShipType) => void;
}

export function ShipCard({ ship, currentLocation, onEdit, onDelete, onClick }: ShipCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return price.toLocaleString();
  };

  return (
    <div
      className="bg-panel border-subtle rounded-md p-5 relative group hover:border-teal-muted hover:bg-elevated transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(ship)}
    >
      {/* Menu button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-hull rounded opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-32 bg-hull border-subtle rounded shadow-lg z-20">
              <button
                onClick={() => {
                  onEdit(ship);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-panel transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(ship);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-panel transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Ship icon */}
      <div className="w-12 h-12 rounded-lg bg-teal-dark/30 border border-teal-dark flex items-center justify-center mb-4">
        <Ship className="w-6 h-6 text-teal-bright" />
      </div>

      {/* Ship info */}
      <div className="mb-3">
        <div className="font-display text-[10px] font-medium tracking-label uppercase text-teal-primary mb-1">
          {ship.manufacturer}
        </div>
        <h3 className="font-body text-lg font-semibold text-text-primary">
          {ship.model}
        </h3>
        {ship.nickname && (
          <p className="font-body text-sm text-text-secondary italic">
            "{ship.nickname}"
          </p>
        )}
      </div>

      {/* Role badge */}
      {ship.role && (
        <span className="inline-block font-display text-[9px] font-semibold tracking-label uppercase px-2 py-0.5 bg-void text-amber-primary rounded-sm mb-3">
          {ship.role}
        </span>
      )}

      {/* Meta info */}
      <div className="flex flex-col gap-1.5 text-xs text-text-muted">
        {/* Current location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{currentLocation ? currentLocation.locationName : "Unknown"}</span>
        </div>
        {ship.acquiredAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(ship.acquiredAt)}</span>
          </div>
        )}
        {ship.acquiredPrice && (
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>{formatPrice(ship.acquiredPrice)} aUEC</span>
          </div>
        )}
        {ship.wikiUrl && (
          <a
            href={ship.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-teal-primary hover:text-teal-bright transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Wiki</span>
          </a>
        )}
      </div>

      {/* Ownership badge */}
      {ship.isOwned === false && (
        <div className="absolute bottom-3 right-3">
          <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-primary/20 text-amber-bright rounded">
            Wishlist
          </span>
        </div>
      )}
    </div>
  );
}
