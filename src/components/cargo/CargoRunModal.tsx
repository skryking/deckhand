import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { formatDateTimeLocal } from "../../lib/format";
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (cargoRun) {
      setFormData({
        commodity: cargoRun.commodity,
        quantity: cargoRun.quantity.toString(),
        buyPrice: cargoRun.buyPrice.toString(),
        sellPrice: cargoRun.sellPrice?.toString() || "",
        originLocationId: cargoRun.originLocationId || "",
        destinationLocationId: cargoRun.destinationLocationId || "",
        shipId: cargoRun.shipId || "",
        status: cargoRun.status || "in_progress",
        notes: cargoRun.notes || "",
        startedAt: formatDateTimeLocal(new Date(cargoRun.startedAt)),
      });
    } else {
      setFormData({
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
      });
    }
  }, [cargoRun, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity) || 0;
      const buyPrice = parseInt(formData.buyPrice) || 0;
      const sellPrice = formData.sellPrice
        ? parseInt(formData.sellPrice)
        : null;

      let profit: number | null = null;
      let completedAt: Date | null = cargoRun?.completedAt
        ? new Date(cargoRun.completedAt)
        : null;

      if (formData.status === "completed" && sellPrice !== null) {
        profit = sellPrice * quantity - buyPrice * quantity;
        if (!completedAt) completedAt = new Date();
      }

      const data: CreateCargoRunInput | UpdateCargoRunInput = {
        startedAt: new Date(formData.startedAt),
        completedAt,
        commodity: formData.commodity,
        quantity,
        buyPrice,
        sellPrice,
        profit,
        originLocationId: formData.originLocationId || null,
        destinationLocationId: formData.destinationLocationId || null,
        shipId: formData.shipId || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save cargo run:", error);
    } finally {
      setLoading(false);
    }
  };

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
