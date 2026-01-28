import { useState, useEffect } from "react";
import { Modal, ModalFooter, Button, Input, Textarea, Select } from "../ui";
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  Ship,
  Location,
} from "../../types/database";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onDelete?: () => void;
  transaction?: Transaction | null;
  ships: Ship[];
  locations: Location[];
}

// Format date for datetime-local input (local time, not UTC)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const categoryOptions = [
  { value: "mission", label: "Mission Payout" },
  { value: "bounty", label: "Bounty" },
  { value: "cargo", label: "Cargo/Trading" },
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "repair", label: "Repair" },
  { value: "fuel", label: "Fuel" },
  { value: "insurance", label: "Insurance" },
  { value: "fine", label: "Fine/Penalty" },
  { value: "food", label: "Food" },
  { value: "armor", label: "Armor" },
  { value: "weapons", label: "Weapons" },
  { value: "ship_components", label: "Ship Components" },
  { value: "clothing", label: "Clothing" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transaction,
  ships,
  locations,
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: "income" as "income" | "expense",
    amount: "",
    category: "mission",
    description: "",
    shipId: "",
    locationId: "",
    timestamp: formatDateTimeLocal(new Date()),
  });

  useEffect(() => {
    if (transaction) {
      const isIncome = transaction.amount >= 0;
      setFormData({
        transactionType: isIncome ? "income" : "expense",
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        description: transaction.description || "",
        shipId: transaction.shipId || "",
        locationId: transaction.locationId || "",
        timestamp: formatDateTimeLocal(new Date(transaction.timestamp)),
      });
    } else {
      setFormData({
        transactionType: "income",
        amount: "",
        category: "mission",
        description: "",
        shipId: "",
        locationId: "",
        timestamp: formatDateTimeLocal(new Date()),
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountValue = parseFloat(formData.amount) || 0;
      const signedAmount = formData.transactionType === "income" ? amountValue : -amountValue;

      const data: CreateTransactionInput | UpdateTransactionInput = {
        timestamp: new Date(formData.timestamp),
        amount: signedAmount,
        category: formData.category,
        description: formData.description || null,
        shipId: formData.shipId || null,
        locationId: formData.locationId || null,
        journalEntryId: transaction?.journalEntryId || null,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save transaction:", error);
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
      title={transaction ? "Edit Transaction" : "New Transaction"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Transaction Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: "income" })}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                  formData.transactionType === "income"
                    ? "bg-success/20 text-success border border-success/50"
                    : "bg-panel border border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                + Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: "expense" })}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                  formData.transactionType === "expense"
                    ? "bg-danger/20 text-danger border border-danger/50"
                    : "bg-panel border border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                - Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Amount (aUEC) *
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount..."
              min="0"
              step="1"
              required
            />
          </div>

          {/* Category */}
          <Select
            label="Category *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categoryOptions}
            required
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add details about this transaction..."
            rows={3}
          />

          {/* Date/Time */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
              Date & Time
            </label>
            <Input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ship */}
            <Select
              label="Ship"
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
              options={shipOptions}
              placeholder="Select a ship..."
            />

            {/* Location */}
            <Select
              label="Location"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              options={locationOptions}
              placeholder="Select a location..."
            />
          </div>
        </div>

        <ModalFooter className="-mx-6 -mb-5 mt-5">
          {transaction && onDelete && (
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
          <Button type="submit" disabled={loading || !formData.amount}>
            {loading ? "Saving..." : transaction ? "Save Changes" : "Add Transaction"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
