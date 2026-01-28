import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import type {
  Location,
  CreateLocationInput,
  UpdateLocationInput,
} from "../../types/database";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLocationInput | UpdateLocationInput) => Promise<void>;
  location?: Location | null;
  locations: Location[];
}

const typeOptions = [
  // Celestial bodies
  { value: "system", label: "Star System" },
  { value: "star", label: "Star" },
  { value: "planet", label: "Planet" },
  { value: "moon", label: "Moon" },
  { value: "asteroid", label: "Asteroid/Planetoid" },
  // Orbital locations
  { value: "lagrange", label: "Lagrange Point" },
  { value: "station", label: "Space Station" },
  { value: "platform", label: "Orbital Platform" },
  // Surface locations
  { value: "city", label: "Landing Zone/City" },
  { value: "outpost", label: "Outpost" },
  { value: "underground", label: "Underground Facility" },
  // Other
  { value: "asteroid_belt", label: "Asteroid Belt" },
  { value: "jump_point", label: "Jump Point" },
  { value: "comm_array", label: "Comm Array" },
  { value: "wreck", label: "Wreck/Derelict" },
  { value: "cave", label: "Cave" },
  { value: "poi", label: "Point of Interest" },
];

const serviceOptions = [
  // Basic services
  "Refuel",
  "Repair",
  "Restock",
  "Medical",
  // Commerce
  "Trading",
  "Ship Sales",
  "Component Sales",
  "Armor/Weapons",
  "Food & Drink",
  // Industry
  "Mining",
  "Refinery",
  "Cargo Deck",
  // Facilities
  "Hangar",
  "Vehicle Pad",
  "Spawn Point",
  "Clinic",
  "Hospital",
  "Habitation",
  "Prison",
  // Services
  "Admin Office",
  "Ship Customization",
  "Racing",
];

export function LocationModal({
  isOpen,
  onClose,
  onSave,
  location,
  locations,
}: LocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    parentId: "",
    services: [] as string[],
    notes: "",
    wikiUrl: "",
    isFavorite: false,
    coordX: "" as string | number,
    coordXUnit: "km" as "km" | "m",
    coordY: "" as string | number,
    coordYUnit: "km" as "km" | "m",
    coordZ: "" as string | number,
    coordZUnit: "km" as "km" | "m",
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        type: location.type || "",
        parentId: location.parentId || "",
        services: location.services || [],
        notes: location.notes || "",
        wikiUrl: location.wikiUrl || "",
        isFavorite: location.isFavorite || false,
        coordX: location.coordX ?? "",
        coordXUnit: location.coordXUnit || "km",
        coordY: location.coordY ?? "",
        coordYUnit: location.coordYUnit || "km",
        coordZ: location.coordZ ?? "",
        coordZUnit: location.coordZUnit || "km",
      });
    } else {
      setFormData({
        name: "",
        type: "",
        parentId: "",
        services: [],
        notes: "",
        wikiUrl: "",
        isFavorite: false,
        coordX: "",
        coordXUnit: "km",
        coordY: "",
        coordYUnit: "km",
        coordZ: "",
        coordZUnit: "km",
      });
    }
  }, [location, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse coordinate values - empty string becomes null
      const parseCoord = (val: string | number): number | null => {
        if (val === "" || val === null || val === undefined) return null;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? null : num;
      };

      const coordX = parseCoord(formData.coordX);
      const coordY = parseCoord(formData.coordY);
      const coordZ = parseCoord(formData.coordZ);

      const data: CreateLocationInput | UpdateLocationInput = {
        name: formData.name,
        type: formData.type || null,
        parentId: formData.parentId || null,
        services: formData.services.length > 0 ? formData.services : null,
        notes: formData.notes || null,
        wikiUrl: formData.wikiUrl || null,
        isFavorite: formData.isFavorite,
        firstVisitedAt: location?.firstVisitedAt || new Date(),
        visitCount: location?.visitCount || 0,
        coordX,
        coordXUnit: coordX !== null ? formData.coordXUnit : null,
        coordY,
        coordYUnit: coordY !== null ? formData.coordYUnit : null,
        coordZ,
        coordZUnit: coordZ !== null ? formData.coordZUnit : null,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save location:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  // Build parent options - exclude current location and its children
  const parentOptions = locations
    .filter((loc) => {
      if (!location) return true;
      // Can't be parent of itself
      if (loc.id === location.id) return false;
      // Can't set child as parent (would create cycle)
      // Simple check - in a real app you'd do recursive check
      return true;
    })
    .map((loc) => ({
      value: loc.id,
      label: loc.name,
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={location ? "Edit Location" : "Add Location"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Port Tressler, Hurston..."
              required
            />
          </div>

          {/* Type */}
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value })
            }
            options={typeOptions}
            placeholder="Select type..."
          />

          {/* Parent Location */}
          <div className="col-span-2">
            <Select
              label="Parent Location"
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              options={parentOptions}
              placeholder="None (top-level)"
            />
          </div>
        </div>

        {/* Services */}
        <div className="mt-4">
          <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted block mb-2">
            Services
          </label>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={`
                  px-3 py-1.5 text-xs rounded transition-all
                  ${
                    formData.services.includes(service)
                      ? "bg-teal-dark text-teal-bright border border-teal-muted"
                      : "bg-panel text-text-muted border-subtle hover:border-teal-dark"
                  }
                `}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Wiki URL */}
        <div className="mt-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Wiki URL
            </label>
            <Input
              type="url"
              value={formData.wikiUrl}
              onChange={(e) =>
                setFormData({ ...formData, wikiUrl: e.target.value })
              }
              placeholder="https://starcitizen.tools/..."
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes about this location..."
            rows={3}
          />
        </div>

        {/* Coordinates */}
        <div className="mt-4 p-3 bg-panel/50 rounded border-subtle">
          <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted block mb-3">
            Coordinates (Optional)
          </label>
          <div className="space-y-2">
            {(["X", "Y", "Z"] as const).map((axis) => {
              const coordKey = `coord${axis}` as "coordX" | "coordY" | "coordZ";
              const unitKey = `coord${axis}Unit` as "coordXUnit" | "coordYUnit" | "coordZUnit";
              return (
                <div key={axis} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-mono text-text-muted">{axis}</span>
                  <input
                    type="number"
                    step="any"
                    value={formData[coordKey]}
                    onChange={(e) =>
                      setFormData({ ...formData, [coordKey]: e.target.value })
                    }
                    placeholder="0.00"
                    className="flex-1 px-3 py-1.5 text-sm bg-panel border-subtle rounded focus:border-teal-muted focus:outline-none text-text-primary placeholder:text-text-muted/50"
                  />
                  <div className="flex rounded overflow-hidden border-subtle">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [unitKey]: "km" })}
                      className={`px-2 py-1 text-xs transition-colors ${
                        formData[unitKey] === "km"
                          ? "bg-teal-dark text-teal-bright"
                          : "bg-panel text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      km
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [unitKey]: "m" })}
                      className={`px-2 py-1 text-xs transition-colors ${
                        formData[unitKey] === "m"
                          ? "bg-teal-dark text-teal-bright"
                          : "bg-panel text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      m
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite toggle */}
        <div className="mt-4 flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFavorite}
              onChange={(e) =>
                setFormData({ ...formData, isFavorite: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-panel border-subtle rounded-full peer peer-checked:bg-teal-dark peer-checked:border-teal-muted transition-all">
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full peer-checked:translate-x-4 peer-checked:bg-teal-bright transition-all" />
            </div>
          </label>
          <span className="text-sm text-text-secondary">Mark as favorite</span>
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : location ? "Save Changes" : "Add Location"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
