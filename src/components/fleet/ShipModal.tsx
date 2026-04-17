import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { useEntityForm } from "../../lib/useEntityForm";
import type { Ship, CreateShipInput, UpdateShipInput } from "../../types/database";

const emptyForm = {
  manufacturer: "",
  model: "",
  nickname: "",
  variant: "",
  role: "",
  acquiredAt: "",
  acquiredPrice: "",
  notes: "",
  wikiUrl: "",
  isOwned: true,
};

interface ShipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateShipInput | UpdateShipInput) => Promise<void>;
  ship?: Ship | null;
}

const roleOptions = [
  { value: "cargo", label: "Cargo" },
  { value: "combat", label: "Combat" },
  { value: "data", label: "Data Running" },
  { value: "exploration", label: "Exploration" },
  { value: "medical", label: "Medical" },
  { value: "mining", label: "Mining" },
  { value: "multi", label: "Multi-Role" },
  { value: "other", label: "Other" },
  { value: "racing", label: "Racing" },
  { value: "salvage", label: "Salvage" },
];

export function ShipModal({ isOpen, onClose, onSave, ship }: ShipModalProps) {
  const { formData, setFormData, loading, handleSubmit } = useEntityForm({
    entity: ship,
    isOpen,
    onClose,
    defaultFormData: emptyForm,
    errorLabel: "ship",
    toFormData: (s: Ship) => ({
      manufacturer: s.manufacturer || "",
      model: s.model || "",
      nickname: s.nickname || "",
      variant: s.variant || "",
      role: s.role || "",
      acquiredAt: s.acquiredAt
        ? new Date(s.acquiredAt).toISOString().split("T")[0]
        : "",
      acquiredPrice: s.acquiredPrice?.toString() || "",
      notes: s.notes || "",
      wikiUrl: s.wikiUrl || "",
      isOwned: s.isOwned !== false,
    }),
    onSubmit: async (data) => {
      const payload: CreateShipInput | UpdateShipInput = {
        manufacturer: data.manufacturer,
        model: data.model,
        nickname: data.nickname || null,
        variant: data.variant || null,
        role: data.role || null,
        acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
        acquiredPrice: data.acquiredPrice
          ? parseInt(data.acquiredPrice, 10)
          : null,
        notes: data.notes || null,
        wikiUrl: data.wikiUrl || null,
        isOwned: data.isOwned,
        imagePath: null,
      };
      await onSave(payload);
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ship ? "Edit Ship" : "Add Ship"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {/* Manufacturer */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Manufacturer *
            </label>
            <Input
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              placeholder="e.g., Origin, Aegis, RSI..."
              required
            />
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Model *
            </label>
            <Input
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              placeholder="e.g., 400i, Gladius, Aurora..."
              required
            />
          </div>

          {/* Nickname */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Nickname
            </label>
            <Input
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              placeholder="Your name for this ship..."
            />
          </div>

          {/* Variant */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Variant
            </label>
            <Input
              value={formData.variant}
              onChange={(e) =>
                setFormData({ ...formData, variant: e.target.value })
              }
              placeholder="e.g., Emerald, F7C-M..."
            />
          </div>

          {/* Role */}
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            options={roleOptions}
            placeholder="Select a role..."
          />

          {/* Acquired Date */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Acquired Date
            </label>
            <Input
              type="date"
              value={formData.acquiredAt}
              onChange={(e) =>
                setFormData({ ...formData, acquiredAt: e.target.value })
              }
            />
          </div>

          {/* Acquired Price */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Acquired Price (aUEC)
            </label>
            <Input
              type="number"
              value={formData.acquiredPrice}
              onChange={(e) =>
                setFormData({ ...formData, acquiredPrice: e.target.value })
              }
              placeholder="0"
            />
          </div>

          {/* Ownership toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOwned}
                onChange={(e) =>
                  setFormData({ ...formData, isOwned: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-panel border-subtle rounded-full peer peer-checked:bg-teal-dark peer-checked:border-teal-muted transition-all">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full peer-checked:translate-x-4 peer-checked:bg-teal-bright transition-all" />
              </div>
            </label>
            <span className="text-sm text-text-secondary">
              {formData.isOwned ? "Owned" : "Wishlist"}
            </span>
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
            placeholder="Additional notes about this ship..."
            rows={3}
          />
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : ship ? "Save Changes" : "Add Ship"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
