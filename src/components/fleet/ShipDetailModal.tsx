import {
  Ship,
  Calendar,
  Wallet,
  ExternalLink,
  MapPin,
  Pencil,
  Tag,
} from "lucide-react";
import { Modal, ModalFooter, Button } from "../ui";
import type { Ship as ShipType, ShipCurrentLocation } from "../../types/database";

interface ShipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  ship: ShipType | null;
  currentLocation?: ShipCurrentLocation | null;
}

export function ShipDetailModal({
  isOpen,
  onClose,
  onEdit,
  ship,
  currentLocation,
}: ShipDetailModalProps) {
  if (!ship) return null;

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
    <Modal isOpen={isOpen} onClose={onClose} title="Ship Details" size="lg">
      {/* Header section */}
      <div className="flex items-start gap-4 mb-6">
        {/* Ship icon */}
        <div className="w-16 h-16 rounded-lg bg-teal-dark/30 border border-teal-dark flex items-center justify-center flex-shrink-0">
          <Ship className="w-8 h-8 text-teal-bright" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Manufacturer */}
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-teal-primary mb-1">
            {ship.manufacturer}
          </div>

          {/* Model */}
          <h3 className="font-body text-xl font-semibold text-text-primary">
            {ship.model}
          </h3>

          {/* Nickname */}
          {ship.nickname && (
            <p className="font-body text-sm text-text-secondary italic mt-0.5">
              "{ship.nickname}"
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {ship.variant && (
              <span className="inline-flex items-center gap-1 font-display text-[9px] font-semibold tracking-label uppercase px-2 py-0.5 bg-void text-teal-primary rounded-sm">
                <Tag className="w-3 h-3" />
                {ship.variant}
              </span>
            )}
            {ship.role && (
              <span className="inline-block font-display text-[9px] font-semibold tracking-label uppercase px-2 py-0.5 bg-void text-amber-primary rounded-sm">
                {ship.role}
              </span>
            )}
            {ship.isOwned === false && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-primary/20 text-amber-bright rounded">
                Wishlist
              </span>
            )}
            {ship.isOwned === true && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-teal-dark text-teal-bright rounded">
                Owned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current location */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Current Location
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <MapPin className="w-4 h-4 text-teal-primary" />
            <span>{currentLocation ? currentLocation.locationName : "Unknown"}</span>
          </div>
        </div>

        {/* Acquired date */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Acquired
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <Calendar className="w-4 h-4 text-teal-primary" />
            <span>{ship.acquiredAt ? formatDate(ship.acquiredAt) : "—"}</span>
          </div>
        </div>

        {/* Acquired price */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Purchase Price
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <Wallet className="w-4 h-4 text-teal-primary" />
            <span>
              {ship.acquiredPrice ? `${formatPrice(ship.acquiredPrice)} aUEC` : "—"}
            </span>
          </div>
        </div>

        {/* Wiki link */}
        <div className="bg-panel border-subtle rounded p-3">
          <div className="font-display text-[9px] font-medium tracking-label uppercase text-text-muted mb-1">
            Wiki
          </div>
          {ship.wikiUrl ? (
            <a
              href={ship.wikiUrl}
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
      {ship.notes && (
        <div className="mb-4">
          <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
            Notes
          </div>
          <div className="bg-panel border-subtle rounded p-4">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {ship.notes}
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
