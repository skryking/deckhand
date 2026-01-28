import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import type {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  Ship,
  Location,
} from "../../types/database";

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateJournalEntryInput | UpdateJournalEntryInput) => Promise<void>;
  entry?: JournalEntry | null;
  ships: Ship[];
  locations: Location[];
}

const entryTypeOptions = [
  { value: "journal", label: "Journal" },
  { value: "cargo", label: "Cargo Run" },
  { value: "combat", label: "Combat" },
  { value: "acquisition", label: "Acquisition" },
  { value: "mining", label: "Mining" },
  { value: "scavenging", label: "Scavenging" },
];

const moodOptions = [
  { value: "excited", label: "Excited" },
  { value: "satisfied", label: "Satisfied" },
  { value: "neutral", label: "Neutral" },
  { value: "frustrated", label: "Frustrated" },
  { value: "disappointed", label: "Disappointed" },
];

export function JournalEntryModal({
  isOpen,
  onClose,
  onSave,
  entry,
  ships,
  locations,
}: JournalEntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    entryType: "journal",
    mood: "",
    shipId: "",
    locationId: "",
    tags: "",
    isFavorite: false,
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || "",
        content: entry.content || "",
        entryType: entry.entryType || "journal",
        mood: entry.mood || "",
        shipId: entry.shipId || "",
        locationId: entry.locationId || "",
        tags: entry.tags?.join(", ") || "",
        isFavorite: entry.isFavorite || false,
      });
    } else {
      setFormData({
        title: "",
        content: "",
        entryType: "journal",
        mood: "",
        shipId: "",
        locationId: "",
        tags: "",
        isFavorite: false,
      });
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const data: CreateJournalEntryInput | UpdateJournalEntryInput = {
        timestamp: entry?.timestamp || new Date(),
        title: formData.title || null,
        content: formData.content,
        entryType: formData.entryType || null,
        mood: formData.mood || null,
        shipId: formData.shipId || null,
        locationId: formData.locationId || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        isFavorite: formData.isFavorite,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
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
      title={entry ? "Edit Entry" : "New Entry"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Give your entry a title..."
            />
          </div>

          {/* Content */}
          <Textarea
            label="Content *"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Write your log entry..."
            rows={6}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Entry Type */}
            <Select
              label="Entry Type"
              value={formData.entryType}
              onChange={(e) =>
                setFormData({ ...formData, entryType: e.target.value })
              }
              options={entryTypeOptions}
            />

            {/* Mood */}
            <Select
              label="Mood"
              value={formData.mood}
              onChange={(e) =>
                setFormData({ ...formData, mood: e.target.value })
              }
              options={moodOptions}
              placeholder="How are you feeling?"
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
              placeholder="Comma-separated tags (e.g., trading, exploration, milestone)"
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
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : entry ? "Save Changes" : "Create Entry"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
