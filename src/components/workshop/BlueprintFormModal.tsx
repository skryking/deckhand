import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import { Plus, X } from "lucide-react";
import { formatDateTimeLocal } from "../../lib/format";
import type {
  Blueprint,
  BlueprintIngredient,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  Location,
} from "../../types/database";

interface BlueprintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBlueprintInput | UpdateBlueprintInput) => Promise<void>;
  onDelete?: () => void;
  blueprint?: (Blueprint & { ingredients: BlueprintIngredient[] }) | null;
  locations: Location[];
}

const categoryOptions = [
  { value: "weapon", label: "Weapon" },
  { value: "armor", label: "Armor" },
  { value: "component", label: "Component" },
  { value: "consumable", label: "Consumable" },
  { value: "other", label: "Other" },
];

interface IngredientForm {
  materialName: string;
  quantityCscu: string;
  minQuality: string;
}

export function BlueprintFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  blueprint,
  locations,
}: BlueprintFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "component",
    outputQuantity: "1",
    obtainedAt: formatDateTimeLocal(new Date()),
    locationId: "",
    notes: "",
  });
  const [ingredients, setIngredients] = useState<IngredientForm[]>([]);

  useEffect(() => {
    if (blueprint) {
      setFormData({
        name: blueprint.name,
        description: blueprint.description || "",
        category: blueprint.category || "component",
        outputQuantity: (blueprint.outputQuantity ?? 1).toString(),
        obtainedAt: blueprint.obtainedAt
          ? formatDateTimeLocal(new Date(blueprint.obtainedAt))
          : formatDateTimeLocal(new Date()),
        locationId: blueprint.locationId || "",
        notes: blueprint.notes || "",
      });
      setIngredients(
        blueprint.ingredients.map((ing) => ({
          materialName: ing.materialName,
          quantityCscu: ing.quantityCscu.toString(),
          minQuality: (ing.minQuality ?? 0).toString(),
        }))
      );
    } else {
      setFormData({
        name: "",
        description: "",
        category: "component",
        outputQuantity: "1",
        obtainedAt: formatDateTimeLocal(new Date()),
        locationId: "",
        notes: "",
      });
      setIngredients([]);
    }
  }, [blueprint, isOpen]);

  const addIngredient = () => {
    setIngredients([...ingredients, { materialName: "", quantityCscu: "", minQuality: "0" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientForm, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: CreateBlueprintInput | UpdateBlueprintInput = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        outputQuantity: parseInt(formData.outputQuantity) || 1,
        obtainedAt: formData.obtainedAt ? new Date(formData.obtainedAt) : null,
        locationId: formData.locationId || null,
        notes: formData.notes || null,
        ingredients: ingredients
          .filter((ing) => ing.materialName.trim())
          .map((ing) => ({
            materialName: ing.materialName.trim(),
            quantityCscu: parseInt(ing.quantityCscu) || 0,
            minQuality: parseInt(ing.minQuality) || 0,
          })),
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save blueprint:", error);
    } finally {
      setLoading(false);
    }
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={blueprint ? "Edit Blueprint" : "Add Blueprint"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Blueprint Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Plasma Rifle, Shield Generator"
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
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Output Quantity
              </label>
              <Input
                type="number"
                value={formData.outputQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, outputQuantity: e.target.value })
                }
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Obtained At Location"
              value={formData.locationId}
              onChange={(e) =>
                setFormData({ ...formData, locationId: e.target.value })
              }
              options={locationOptions}
              placeholder="Select location..."
            />
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Date Obtained
              </label>
              <Input
                type="datetime-local"
                value={formData.obtainedAt}
                onChange={(e) =>
                  setFormData({ ...formData, obtainedAt: e.target.value })
                }
              />
            </div>
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="What does this blueprint create?"
            rows={2}
          />

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
                Ingredients
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-teal-bright hover:text-teal-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-xs text-text-muted italic py-2">
                No ingredients added yet. Click "Add Ingredient" to define the recipe.
              </p>
            )}

            <div className="space-y-2">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={ing.materialName}
                      onChange={(e) => updateIngredient(index, "materialName", e.target.value)}
                      placeholder="Material name"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={ing.quantityCscu}
                      onChange={(e) => updateIngredient(index, "quantityCscu", e.target.value)}
                      placeholder="cSCU"
                      min="0"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={ing.minQuality}
                      onChange={(e) => updateIngredient(index, "minQuality", e.target.value)}
                      placeholder="Min Q"
                      min="0"
                      max="1000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2.5 text-text-muted hover:text-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any notes about this blueprint..."
            rows={2}
          />
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {blueprint && onDelete && (
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
          <Button type="submit" disabled={loading || !formData.name}>
            {loading ? "Saving..." : blueprint ? "Save Changes" : "Add Blueprint"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
