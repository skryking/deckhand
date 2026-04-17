import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { useEntityForm } from "../../lib/useEntityForm";
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
  { value: "component", label: "Component" },
  { value: "gem", label: "Gem" },
  { value: "mineral", label: "Mineral" },
  { value: "other", label: "Other" },
  { value: "salvage", label: "Salvage" },
];

const sourceOptions = [
  { value: "mined", label: "Mined" },
  { value: "other", label: "Other" },
  { value: "purchased", label: "Purchased" },
  { value: "salvaged", label: "Salvaged" },
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
  const { formData, setFormData, loading, handleSubmit } = useEntityForm({
    entity: item,
    isOpen,
    onClose,
    errorLabel: "inventory item",
    defaultFormData: {
      materialName: "",
      category: "mineral",
      source: "mined",
      quantityCscu: "",
      quality: "",
      locationId: "",
      shipId: "",
      notes: "",
    },
    toFormData: (i: InventoryItem) => ({
      materialName: i.materialName,
      category: i.category || "mineral",
      source: i.source || "mined",
      quantityCscu: i.quantityCscu.toString(),
      quality: i.quality.toString(),
      locationId: i.locationId || "",
      shipId: i.shipId || "",
      notes: i.notes || "",
    }),
    onSubmit: async (data) => {
      const payload: CreateInventoryItemInput | UpdateInventoryItemInput = {
        materialName: data.materialName,
        category: data.category || null,
        source: data.source || null,
        quantityCscu: parseInt(data.quantityCscu) || 0,
        quality: parseInt(data.quality) || 0,
        locationId: data.locationId || null,
        shipId: data.shipId || null,
        notes: data.notes || null,
      };
      await onSave(payload);
    },
  });

  const shipOptions = ships
    .map((ship) => ({
      value: ship.id,
      label: ship.nickname || `${ship.manufacturer} ${ship.model}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const locationOptions = locations
    .map((loc) => ({
      value: loc.id,
      label: loc.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
