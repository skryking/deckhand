import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { formatDateTimeLocal } from "../../lib/format";
import type {
  Mission,
  CreateMissionInput,
  UpdateMissionInput,
  Ship,
  Location,
} from "../../types/database";

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateMissionInput | UpdateMissionInput) => Promise<void>;
  onDelete?: () => void;
  mission?: Mission | null;
  ships: Ship[];
  locations: Location[];
}

const missionTypeOptions = [
  { value: "bounty", label: "Bounty" },
  { value: "delivery", label: "Delivery" },
  { value: "mining", label: "Mining" },
  { value: "salvage", label: "Salvage" },
  { value: "investigation", label: "Investigation" },
  { value: "escort", label: "Escort" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "abandoned", label: "Abandoned" },
];

export function MissionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  mission,
  ships,
  locations,
}: MissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    missionType: "bounty",
    contractor: "",
    reward: "",
    status: "active",
    locationId: "",
    shipId: "",
    notes: "",
    acceptedAt: formatDateTimeLocal(new Date()),
  });

  useEffect(() => {
    if (mission) {
      setFormData({
        title: mission.title,
        description: mission.description || "",
        missionType: mission.missionType || "bounty",
        contractor: mission.contractor || "",
        reward: mission.reward?.toString() || "",
        status: mission.status || "active",
        locationId: mission.locationId || "",
        shipId: mission.shipId || "",
        notes: mission.notes || "",
        acceptedAt: formatDateTimeLocal(
          new Date(mission.acceptedAt || Date.now())
        ),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        missionType: "bounty",
        contractor: "",
        reward: "",
        status: "active",
        locationId: "",
        shipId: "",
        notes: "",
        acceptedAt: formatDateTimeLocal(new Date()),
      });
    }
  }, [mission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let completedAt: Date | null = mission?.completedAt
        ? new Date(mission.completedAt)
        : null;

      if (
        (formData.status === "completed" || formData.status === "failed") &&
        !completedAt
      ) {
        completedAt = new Date();
      }

      const data: CreateMissionInput | UpdateMissionInput = {
        title: formData.title,
        description: formData.description || null,
        missionType: formData.missionType || null,
        contractor: formData.contractor || null,
        reward: formData.reward ? parseInt(formData.reward) : null,
        status: formData.status,
        acceptedAt: new Date(formData.acceptedAt),
        completedAt,
        locationId: formData.locationId || null,
        shipId: formData.shipId || null,
        notes: formData.notes || null,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save mission:", error);
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
      title={mission ? "Edit Mission" : "Log Mission"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Mission Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Bounty: Nine Tails Leader"
              required
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Mission details..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Mission Type */}
            <Select
              label="Mission Type"
              value={formData.missionType}
              onChange={(e) =>
                setFormData({ ...formData, missionType: e.target.value })
              }
              options={missionTypeOptions}
            />

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
            {/* Contractor */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Contractor
              </label>
              <Input
                value={formData.contractor}
                onChange={(e) =>
                  setFormData({ ...formData, contractor: e.target.value })
                }
                placeholder="e.g., Crusader Security"
              />
            </div>

            {/* Reward */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Reward (aUEC)
              </label>
              <Input
                type="number"
                value={formData.reward}
                onChange={(e) =>
                  setFormData({ ...formData, reward: e.target.value })
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <Select
              label="Location"
              value={formData.locationId}
              onChange={(e) =>
                setFormData({ ...formData, locationId: e.target.value })
              }
              options={locationOptions}
              placeholder="Select a location..."
            />

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
          </div>

          {/* Accepted At */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Accepted At
            </label>
            <Input
              type="datetime-local"
              value={formData.acceptedAt}
              onChange={(e) =>
                setFormData({ ...formData, acceptedAt: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any notes about this mission..."
            rows={3}
          />
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {mission && onDelete && (
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
          <Button type="submit" disabled={loading || !formData.title}>
            {loading
              ? "Saving..."
              : mission
              ? "Save Changes"
              : "Log Mission"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
