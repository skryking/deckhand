import { useState } from "react";
import {
  Globe,
  MapPin,
  Building2,
  Moon,
  Sun,
  Star,
  StarOff,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Orbit,
  Mountain,
  Radio,
  Anchor,
  CircleDot,
  Landmark,
  Factory,
  Skull,
  ExternalLink,
} from "lucide-react";
import type { Location } from "../../types/database";

interface LocationCardProps {
  location: Location;
  parentName?: string;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onToggleFavorite: (location: Location) => void;
}

const typeIcons: Record<string, typeof Globe> = {
  // Celestial bodies
  system: Sun,
  star: Sun,
  planet: Globe,
  moon: Moon,
  asteroid: Mountain,
  // Orbital locations
  lagrange: Orbit,
  station: Building2,
  platform: Building2,
  // Surface locations
  city: Landmark,
  outpost: Factory,
  underground: Mountain,
  // Other
  asteroid_belt: CircleDot,
  jump_point: Anchor,
  comm_array: Radio,
  wreck: Skull,
  cave: Mountain,
  poi: MapPin,
};

// Display labels for location types
const typeLabels: Record<string, string> = {
  system: "Star System",
  star: "Star",
  planet: "Planet",
  moon: "Moon",
  asteroid: "Asteroid",
  lagrange: "Lagrange Point",
  station: "Space Station",
  platform: "Orbital Platform",
  city: "Landing Zone",
  outpost: "Outpost",
  underground: "Underground",
  asteroid_belt: "Asteroid Belt",
  jump_point: "Jump Point",
  comm_array: "Comm Array",
  wreck: "Wreck",
  cave: "Cave",
  poi: "POI",
};

export function LocationCard({
  location,
  parentName,
  onEdit,
  onDelete,
  onToggleFavorite,
}: LocationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const TypeIcon = typeIcons[location.type || "poi"] || MapPin;

  return (
    <div className="bg-panel border-subtle rounded-md p-5 relative group hover:border-teal-muted hover:bg-elevated transition-all duration-200">
      {/* Favorite button */}
      <button
        onClick={() => onToggleFavorite(location)}
        className="absolute top-3 left-3 p-1.5 text-text-muted hover:text-amber-bright transition-colors"
      >
        {location.isFavorite ? (
          <Star className="w-4 h-4 fill-amber-bright text-amber-bright" />
        ) : (
          <StarOff className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Menu button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setShowMenu(!showMenu)}
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
                  onEdit(location);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-panel transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(location);
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

      {/* Location icon */}
      <div className="w-12 h-12 rounded-lg bg-teal-dark/30 border border-teal-dark flex items-center justify-center mb-4 mt-2">
        <TypeIcon className="w-6 h-6 text-teal-bright" />
      </div>

      {/* Location info */}
      <div className="mb-3">
        {location.type && (
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-teal-primary mb-1">
            {typeLabels[location.type] || location.type}
          </div>
        )}
        <h3 className="font-body text-lg font-semibold text-text-primary">
          {location.name}
        </h3>
        {parentName && (
          <p className="font-body text-sm text-text-muted">{parentName}</p>
        )}
      </div>

      {/* Services */}
      {location.services && location.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {location.services.slice(0, 3).map((service, i) => (
            <span
              key={i}
              className="font-mono text-[9px] px-1.5 py-0.5 bg-void text-text-muted rounded"
            >
              {service}
            </span>
          ))}
          {location.services.length > 3 && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-void text-text-muted rounded">
              +{location.services.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Coordinates */}
      {(location.coordX !== null || location.coordY !== null || location.coordZ !== null) && (
        <div className="font-mono text-[10px] text-text-muted mb-3 space-y-0.5">
          {location.coordX !== null && (
            <div>X: {location.coordX} {location.coordXUnit || 'km'}</div>
          )}
          {location.coordY !== null && (
            <div>Y: {location.coordY} {location.coordYUnit || 'km'}</div>
          )}
          {location.coordZ !== null && (
            <div>Z: {location.coordZ} {location.coordZUnit || 'km'}</div>
          )}
        </div>
      )}

      {/* Meta info */}
      <div className="flex flex-col gap-1.5 text-xs text-text-muted">
        {/* Visit count */}
        {location.visitCount && location.visitCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>
              {location.visitCount} {location.visitCount === 1 ? "visit" : "visits"}
            </span>
          </div>
        )}
        {/* Wiki link */}
        {location.wikiUrl && (
          <a
            href={location.wikiUrl}
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
    </div>
  );
}
