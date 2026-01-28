import {
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
  ExternalLink,
  Eye,
  Ship,
  Pencil,
} from "lucide-react";
import { Modal, ModalFooter, Button } from "../ui";
import type { Location, ShipAtLocation } from "../../types/database";

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  location: Location | null;
  parentName?: string;
  shipsAtLocation?: ShipAtLocation[];
}

const typeIcons: Record<string, typeof Globe> = {
  system: Sun,
  star: Sun,
  planet: Globe,
  moon: Moon,
  asteroid: Mountain,
  lagrange: Orbit,
  station: Building2,
  platform: Building2,
  city: Landmark,
  outpost: Factory,
  underground: Mountain,
  asteroid_belt: CircleDot,
  jump_point: Anchor,
  comm_array: Radio,
  wreck: Skull,
  cave: Mountain,
  poi: MapPin,
};

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

export function LocationDetailModal({
  isOpen,
  onClose,
  onEdit,
  location,
  parentName,
  shipsAtLocation,
}: LocationDetailModalProps) {
  if (!location) return null;

  const TypeIcon = typeIcons[location.type || "poi"] || MapPin;
  const hasCoordinates =
    location.coordX !== null ||
    location.coordY !== null ||
    location.coordZ !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Location Details" size="lg">
      {/* Header section */}
      <div className="flex items-start gap-4 mb-6">
        {/* Location icon */}
        <div className="w-16 h-16 rounded-lg bg-teal-dark/30 border border-teal-dark flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-8 h-8 text-teal-bright" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Type label */}
          {location.type && (
            <div className="font-display text-[10px] font-medium tracking-label uppercase text-teal-primary mb-1">
              {typeLabels[location.type] || location.type}
            </div>
          )}

          {/* Name */}
          <h3 className="font-body text-xl font-semibold text-text-primary flex items-center gap-2">
            {location.name}
            {location.isFavorite && (
              <Star className="w-5 h-5 fill-amber-bright text-amber-bright" />
            )}
          </h3>

          {/* Parent location */}
          {parentName && (
            <p className="font-body text-sm text-text-muted mt-0.5">
              {parentName}
            </p>
          )}
        </div>
      </div>

      {/* Services */}
      {location.services && location.services.length > 0 && (
        <div className="mb-6">
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
            Services
          </div>
          <div className="flex flex-wrap gap-2">
            {location.services.map((service, i) => (
              <span
                key={i}
                className="font-mono text-[10px] px-2 py-1 bg-void text-text-secondary rounded"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coordinates */}
      {hasCoordinates && (
        <div className="mb-6">
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
            Coordinates
          </div>
          <div className="bg-panel border-subtle rounded p-3 font-mono text-sm text-text-primary space-y-1">
            {location.coordX !== null && (
              <div>
                X: {location.coordX} {location.coordXUnit || "km"}
              </div>
            )}
            {location.coordY !== null && (
              <div>
                Y: {location.coordY} {location.coordYUnit || "km"}
              </div>
            )}
            {location.coordZ !== null && (
              <div>
                Z: {location.coordZ} {location.coordZUnit || "km"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ships at location */}
      {shipsAtLocation && shipsAtLocation.length > 0 && (
        <div className="mb-6">
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
            Ships at Location
          </div>
          <div className="bg-panel border-subtle rounded p-3 space-y-2">
            {shipsAtLocation.map((ship) => (
              <div
                key={ship.shipId}
                className="flex items-center gap-2 text-sm"
              >
                <Ship className="w-4 h-4 text-teal-primary" />
                <span className="text-text-primary">
                  {ship.manufacturer} {ship.model}
                </span>
                {ship.shipName !== `${ship.manufacturer} ${ship.model}` && (
                  <span className="text-text-muted italic">
                    "{ship.shipName}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Visit count */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Visits
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <Eye className="w-4 h-4 text-teal-primary" />
            <span>
              {location.visitCount && location.visitCount > 0
                ? `${location.visitCount} ${location.visitCount === 1 ? "visit" : "visits"}`
                : "Not yet visited"}
            </span>
          </div>
        </div>

        {/* Wiki link */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Wiki
          </div>
          {location.wikiUrl ? (
            <a
              href={location.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-teal-primary hover:text-teal-bright transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="truncate">View on Wiki</span>
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <ExternalLink className="w-4 h-4" />
              <span>—</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes section */}
      {location.notes && (
        <div className="mb-4">
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
            Notes
          </div>
          <div className="bg-panel border-subtle rounded p-4">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {location.notes}
            </p>
          </div>
        </div>
      )}

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </ModalFooter>
    </Modal>
  );
}
