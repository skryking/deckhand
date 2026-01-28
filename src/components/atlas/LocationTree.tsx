import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Globe,
  MapPin,
  Building2,
  Moon,
  Sun,
  Star,
  Orbit,
  Mountain,
  Radio,
  Anchor,
  CircleDot,
  Landmark,
  Factory,
  Skull,
} from "lucide-react";
import type { Location } from "../../types/database";

interface LocationTreeProps {
  locations: Location[];
  onSelect: (location: Location) => void;
  selectedId?: string | null;
}

interface TreeNodeProps {
  location: Location;
  children: Location[];
  allLocations: Location[];
  depth: number;
  onSelect: (location: Location) => void;
  selectedId?: string | null;
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

function TreeNode({
  location,
  children,
  allLocations,
  depth,
  onSelect,
  selectedId,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);

  const TypeIcon = typeIcons[location.type || "poi"] || MapPin;
  const hasChildren = children.length > 0;
  const isSelected = selectedId === location.id;

  const getChildren = (parentId: string) =>
    allLocations.filter((loc) => loc.parentId === parentId);

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer rounded
          transition-colors
          ${isSelected ? "bg-teal-dark/30 text-teal-bright" : "hover:bg-panel text-text-secondary hover:text-text-primary"}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onSelect(location)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`w-4 h-4 flex items-center justify-center ${!hasChildren ? "invisible" : ""}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Icon */}
        <TypeIcon className="w-4 h-4 text-teal-primary" />

        {/* Name */}
        <span className="flex-1 text-sm truncate">{location.name}</span>

        {/* Favorite indicator */}
        {location.isFavorite && (
          <Star className="w-3.5 h-3.5 fill-amber-bright text-amber-bright" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              location={child}
              children={getChildren(child.id)}
              allLocations={allLocations}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationTree({
  locations,
  onSelect,
  selectedId,
}: LocationTreeProps) {
  // Get root locations (no parent)
  const rootLocations = locations.filter((loc) => !loc.parentId);

  const getChildren = (parentId: string) =>
    locations.filter((loc) => loc.parentId === parentId);

  if (locations.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted text-sm">
        No locations added yet
      </div>
    );
  }

  return (
    <div className="py-2">
      {rootLocations.map((location) => (
        <TreeNode
          key={location.id}
          location={location}
          children={getChildren(location.id)}
          allLocations={locations}
          depth={0}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}
