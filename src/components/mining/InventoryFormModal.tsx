import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  Ship,
  Location,
} from "../../types/database";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInventoryItemInput | UpdateInventoryItemInput) => Promise<void>;
  onDelete?: () => void;
  item?: InventoryItem | null;
  ships: Ship[];
  locations: Location[];
}

const categoryOptions = [
  { value: "mineral", label: "Mineral" },
  { value: "gem", label: "Gem" },
  { value: "component", label: "Component" },
  { value: "salvage", label: "Salvage" },
  { value: "other", label: "Other" },
];

const sourceOptions = [
  { value: "mined", label: "Mined" },
  { value: "purchased", label: "Purchased" },
  { value: "salvaged", label: "Salvaged" },
  { value: "other", label: "Other" },
];

export function InventoryFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  item,
  ships,
  locations,
}: InventoryFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    materialName: "",
    category: "mineral",
    source: "mined",
    quantityCscu: "",
    quality: "",
    locationId: "",
    shipId: "",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        materialName: item.materialName,
        category: item.category || "mineral",
        source: item.source || "mined",
        quantityCscu: item.quantityCscu.toString(),
        quality: item.quality.toString(),
        locationId: item.locationId || "",
        shipId: item.shipId || "",
        notes: item.notes || "",
      });
    } else {
      setFormData({
        materialName: "",
        category: "mineral",
        source: "mined",
        quantityCscu: "",
        quality: "",
        locationId: "",
        shipId: "",
        notes: "",
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: CreateInventoryItemInput | UpdateInventoryItemInput = {
        materialName: formData.materialName,
        category: formData.category || null,
        source: formData.source || null,
        quantityCscu: parseInt(formData.quantityCscu) || 0,
        quality: parseInt(formData.quality) || 0,
        locationId: formData.locationId || null,
        shipId: formData.shipId || null,
        notes: formData.notes || null,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  const shipOptions = ships.map((ship) => ({
    value: ship.id,
    label: ship.nickname || `${ship.manufacturer} ${ship.model}`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? "Edit Inventory Item" : "Add to Inventory"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Material Name *
            </label>
            <Input
              value={formData.materialName}
              onChange={(e) =>
                setFormData({ ...formData, materialName: e.target.value })
              }
              placeholder="e.g., Quantanium, Hadanite, Plasma Capacitor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={categoryOptions}
            />
            <Select
              label="Source"
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              options={sourceOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Quantity (cSCU) *
              </label>
              <Input
                type="number"
                value={formData.quantityCscu}
                onChange={(e) =>
                  setFormData({ ...formData, quantityCscu: e.target.value })
                }
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Quality (0-1000) *
              </label>
              <Input
                type="number"
                value={formData.quality}
                onChange={(e) =>
                  setFormData({ ...formData, quality: e.target.value })
                }
                placeholder="0"
                min="0"
                max="1000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Location"
              value={formData.locationId}
              onChange={(e) =>
                setFormData({ ...formData, locationId: e.target.value })
              }
              options={locationOptions}
              placeholder="Select location..."
            />
            <Select
              label="Ship"
              value={formData.shipId}
              onChange={(e) =>
                setFormData({ ...formData, shipId: e.target.value })
              }
              options={shipOptions}
              placeholder="Select a ship..."
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any notes about this material..."
            rows={3}
          />
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {item && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="mr-auto text-danger hover:text-danger hover:bg-danger/10"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              loading || !formData.materialName || !formData.quantityCscu
            }
          >
            {loading ? "Saving..." : item ? "Save Changes" : "Add Item"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
