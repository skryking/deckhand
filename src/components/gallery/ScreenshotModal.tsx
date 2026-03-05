import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import type {
  Screenshot,
  CreateScreenshotInput,
  UpdateScreenshotInput,
  Ship,
  Location,
} from "../../types/database";

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateScreenshotInput | UpdateScreenshotInput) => Promise<void>;
  onDelete?: () => void;
  screenshot?: Screenshot | null;
  ships: Ship[];
  locations: Location[];
}

export function ScreenshotModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  screenshot,
  ships,
  locations,
}: ScreenshotModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    filePath: "",
    caption: "",
    tags: "",
    locationId: "",
    shipId: "",
    isFavorite: false,
  });

  useEffect(() => {
    if (screenshot) {
      setFormData({
        filePath: screenshot.filePath,
        caption: screenshot.caption || "",
        tags: screenshot.tags?.join(", ") || "",
        locationId: screenshot.locationId || "",
        shipId: screenshot.shipId || "",
        isFavorite: screenshot.isFavorite || false,
      });
    } else {
      setFormData({
        filePath: "",
        caption: "",
        tags: "",
        locationId: "",
        shipId: "",
        isFavorite: false,
      });
    }
  }, [screenshot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const data: CreateScreenshotInput | UpdateScreenshotInput = {
        filePath: formData.filePath,
        thumbnailPath: null,
        takenAt: screenshot?.takenAt ? new Date(screenshot.takenAt) : new Date(),
        caption: formData.caption || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        locationId: formData.locationId || null,
        shipId: formData.shipId || null,
        journalEntryId: screenshot?.journalEntryId || null,
        isFavorite: formData.isFavorite,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save screenshot:", error);
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
      title={screenshot ? "Edit Screenshot" : "Add Screenshot"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* File path (read-only when editing) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              File Path
            </label>
            <Input
              value={formData.filePath}
              onChange={(e) =>
                setFormData({ ...formData, filePath: e.target.value })
              }
              placeholder="Path to screenshot..."
              disabled={!!screenshot}
            />
            {formData.filePath && (
              <div className="aspect-video max-h-48 bg-void rounded overflow-hidden">
                <img
                  src={`local-file:///${formData.filePath.replace(/\\/g, '/')}`}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <Textarea
            label="Caption"
            value={formData.caption}
            onChange={(e) =>
              setFormData({ ...formData, caption: e.target.value })
            }
            placeholder="Describe this screenshot..."
            rows={3}
          />

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

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Tags
            </label>
            <Input
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="Comma-separated tags (e.g., combat, scenic, fleet)"
            />
          </div>

          {/* Favorite toggle */}
          <div className="flex items-center gap-3">
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
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {screenshot && onDelete && (
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
          <Button type="submit" disabled={loading || !formData.filePath}>
            {loading ? "Saving..." : screenshot ? "Save Changes" : "Add Screenshot"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
