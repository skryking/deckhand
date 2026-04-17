import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { formatDateTimeLocal } from "../../lib/format";
import { useEntityForm } from "../../lib/useEntityForm";
import type {
  CargoRun,
  CreateCargoRunInput,
  UpdateCargoRunInput,
  Ship,
  Location,
} from "../../types/database";

interface CargoRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCargoRunInput | UpdateCargoRunInput) => Promise<void>;
  onDelete?: () => void;
  cargoRun?: CargoRun | null;
  ships: Ship[];
  locations: Location[];
}

const statusOptions = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "in_progress", label: "In Progress" },
];

export function CargoRunModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  cargoRun,
  ships,
  locations,
}: CargoRunModalProps) {
  const { formData, setFormData, loading, handleSubmit } = useEntityForm({
    entity: cargoRun,
    isOpen,
    onClose,
    errorLabel: "cargo run",
    defaultFormData: {
      commodity: "",
      quantity: "",
      buyPrice: "",
      sellPrice: "",
      originLocationId: "",
      destinationLocationId: "",
      shipId: "",
      status: "in_progress",
      notes: "",
      startedAt: formatDateTimeLocal(new Date()),
    },
    toFormData: (r: CargoRun) => ({
      commodity: r.commodity,
      quantity: r.quantity.toString(),
      buyPrice: r.buyPrice.toString(),
      sellPrice: r.sellPrice?.toString() || "",
      originLocationId: r.originLocationId || "",
      destinationLocationId: r.destinationLocationId || "",
      shipId: r.shipId || "",
      status: r.status || "in_progress",
      notes: r.notes || "",
      startedAt: formatDateTimeLocal(new Date(r.startedAt)),
    }),
    onSubmit: async (data) => {
      const quantity = parseInt(data.quantity) || 0;
      const buyPrice = parseInt(data.buyPrice) || 0;
      const sellPrice = data.sellPrice ? parseInt(data.sellPrice) : null;

      let profit: number | null = null;
      let completedAt: Date | null = cargoRun?.completedAt
        ? new Date(cargoRun.completedAt)
        : null;

      if (data.status === "completed" && sellPrice !== null) {
        profit = sellPrice * quantity - buyPrice * quantity;
        if (!completedAt) completedAt = new Date();
      }

      const payload: CreateCargoRunInput | UpdateCargoRunInput = {
        startedAt: new Date(data.startedAt),
        completedAt,
        commodity: data.commodity,
        quantity,
        buyPrice,
        sellPrice,
        profit,
        originLocationId: data.originLocationId || null,
        destinationLocationId: data.destinationLocationId || null,
        shipId: data.shipId || null,
        status: data.status,
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
      title={cargoRun ? "Edit Cargo Run" : "Log Cargo Run"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Commodity */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Commodity *
            </label>
            <Input
              value={formData.commodity}
              onChange={(e) =>
                setFormData({ ...formData, commodity: e.target.value })
              }
              placeholder="e.g., Laranite, Titanium, Medical Supplies"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Quantity (SCU) *
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="0"
                min="1"
                required
              />
            </div>

            {/* Status */}
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={statusOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Buy Price */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Buy Price (aUEC/SCU) *
              </label>
              <Input
                type="number"
                value={formData.buyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, buyPrice: e.target.value })
                }
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* Sell Price */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Sell Price (aUEC/SCU)
              </label>
              <Input
                type="number"
                value={formData.sellPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellPrice: e.target.value })
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Origin */}
            <Select
              label="Origin"
              value={formData.originLocationId}
              onChange={(e) =>
                setFormData({ ...formData, originLocationId: e.target.value })
              }
              options={locationOptions}
              placeholder="Select origin..."
            />

            {/* Destination */}
            <Select
              label="Destination"
              value={formData.destinationLocationId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  destinationLocationId: e.target.value,
                })
              }
              options={locationOptions}
              placeholder="Select destination..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ship */}
            <Select
              label="Ship"
              value={formData.shipId}
              onChange={(e) =>
                setFormData({ ...formData, shipId: e.target.value })
              }
              options={shipOptions}
              placeholder="Select a ship..."
            />

            {/* Date/Time */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Started At
              </label>
              <Input
                type="datetime-local"
                value={formData.startedAt}
                onChange={(e) =>
                  setFormData({ ...formData, startedAt: e.target.value })
                }
              />
            </div>
          </div>

          {/* Notes */}
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any notes about this run..."
            rows={3}
          />
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {cargoRun && onDelete && (
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
              loading || !formData.commodity || !formData.quantity || !formData.buyPrice
            }
          >
            {loading ? "Saving..." : cargoRun ? "Save Changes" : "Log Run"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
