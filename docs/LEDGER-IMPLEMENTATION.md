# Ledger Implementation Plan

This document provides a step-by-step implementation guide for making the Ledger feature fully functional.

---

## Prerequisites

The following are already complete and ready to use:

- [x] Database schema (`electron/database/schema.ts`)
- [x] IPC handlers (`electron/database/handlers/transactions.ts`)
- [x] API layer (`src/lib/db/api.ts`)
- [x] React hooks (`src/lib/db/hooks.ts`)
- [x] Type definitions (`src/types/database.ts`)
- [x] Navigation setup (Sidebar, App.tsx routing)

---

## Implementation Phases

### Phase 1: Transaction Modal Component

**File:** `src/components/ledger/TransactionModal.tsx`

Create the transaction create/edit modal following the pattern from `JournalEntryModal.tsx`.

#### Structure:

```typescript
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionInput) => Promise<void>;
  transaction?: Transaction | null;  // null = create mode
  ships: Ship[];
  locations: Location[];
}
```

#### Form Fields:

1. **Transaction Type Toggle** (Income / Expense)
   - Radio or segmented control
   - Sets the sign of the amount

2. **Amount** (required)
   - Numeric input
   - Always stored/displayed as positive in input
   - Sign determined by type toggle

3. **Category** (required)
   - Dropdown with predefined categories
   - Options: cargo, mission, bounty, repair, fuel, purchase, sale, insurance, fine, other

4. **Description** (optional)
   - Textarea for details

5. **Date/Time** (defaults to now)
   - Date picker input
   - Optional: time picker

6. **Ship** (optional)
   - Dropdown populated from ships list

7. **Location** (optional)
   - Dropdown populated from locations list

#### Implementation Notes:

- Use `useState` for form data
- Use `useEffect` to populate form when editing
- Submit handler converts type + amount to signed value
- Call `onSave` then `onClose` on success

---

### Phase 2: Ledger Filters Component

**File:** `src/components/ledger/LedgerFilters.tsx`

Create filter bar component for category and income/expense filtering.

#### Props:

```typescript
interface LedgerFiltersProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showType: 'all' | 'income' | 'expenses';
  onTypeChange: (type: 'all' | 'income' | 'expenses') => void;
  counts: {
    total: number;
    income: number;
    expenses: number;
    [category: string]: number;
  };
}
```

#### UI Elements:

1. **Type Filter Buttons**
   - All | Income | Expenses
   - Show count badges

2. **Category Dropdown**
   - "All Categories" option
   - List of categories with counts

---

### Phase 3: Transaction Card Component

**File:** `src/components/ledger/TransactionCard.tsx`

Display individual transaction in the list. Can reuse `EntryCard` pattern or create custom.

#### Props:

```typescript
interface TransactionCardProps {
  transaction: Transaction;
  shipName?: string;
  locationName?: string;
  onClick: () => void;
}
```

#### Display Elements:

1. **Category Icon** - Mapped from category to Lucide icon
2. **Category Label** - Formatted category name
3. **Amount** - Color-coded (green/red), formatted with commas
4. **Description** - Truncated preview
5. **Timestamp** - Formatted date/time
6. **Metadata** - Ship and location chips if present

---

### Phase 4: Index Export

**File:** `src/components/ledger/index.ts`

```typescript
export { TransactionModal } from './TransactionModal';
export { LedgerFilters } from './LedgerFilters';
export { TransactionCard } from './TransactionCard';
```

---

### Phase 5: Update LedgerView

**File:** `src/views/LedgerView.tsx`

Transform the placeholder into a fully functional view.

#### Imports to Add:

```typescript
import { useState, useMemo } from 'react';
import { useTransactions, useBalance, useShips, useLocations } from '../lib/db';
import { transactionsApi } from '../lib/db/api';
import { TransactionModal, LedgerFilters, TransactionCard } from '../components/ledger';
import type { Transaction, CreateTransactionInput } from '../types/database';
```

#### State to Add:

```typescript
// Data hooks
const { data: transactions, loading, refetch } = useTransactions();
const { data: balance, refetch: refetchBalance } = useBalance();
const { data: ships } = useShips();
const { data: locations } = useLocations();

// UI state
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [activeCategory, setActiveCategory] = useState<string | null>(null);
const [showType, setShowType] = useState<'all' | 'income' | 'expenses'>('all');
const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
```

#### Computed Values:

```typescript
// Name lookup maps
const shipNames = useMemo(() => {
  const map: Record<string, string> = {};
  ships?.forEach(ship => {
    map[ship.id] = ship.nickname || `${ship.manufacturer} ${ship.model}`;
  });
  return map;
}, [ships]);

const locationNames = useMemo(() => {
  const map: Record<string, string> = {};
  locations?.forEach(loc => {
    map[loc.id] = loc.name;
  });
  return map;
}, [locations]);

// Filtered transactions
const filteredTransactions = useMemo(() => {
  if (!transactions) return [];

  let result = transactions;

  // Type filter
  if (showType === 'income') {
    result = result.filter(t => t.amount > 0);
  } else if (showType === 'expenses') {
    result = result.filter(t => t.amount < 0);
  }

  // Category filter
  if (activeCategory) {
    result = result.filter(t => t.category === activeCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(t =>
      t.description?.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }

  return result;
}, [transactions, showType, activeCategory, searchQuery]);

// Statistics
const stats = useMemo(() => {
  if (!transactions) return { income: 0, expenses: 0, count: 0 };

  let income = 0;
  let expenses = 0;

  transactions.forEach(t => {
    if (t.amount > 0) income += t.amount;
    else expenses += Math.abs(t.amount);
  });

  return { income, expenses, count: transactions.length };
}, [transactions]);

// Filter counts
const filterCounts = useMemo(() => {
  const counts: Record<string, number> = {
    total: transactions?.length ?? 0,
    income: 0,
    expenses: 0
  };

  transactions?.forEach(t => {
    if (t.amount > 0) counts.income++;
    else counts.expenses++;
    counts[t.category] = (counts[t.category] || 0) + 1;
  });

  return counts;
}, [transactions]);
```

#### Event Handlers:

```typescript
const handleSave = async (data: CreateTransactionInput) => {
  if (editingTransaction) {
    // Note: Need to add update handler - see Phase 6
    await transactionsApi.update(editingTransaction.id, data);
  } else {
    await transactionsApi.create(data);
  }
  refetch();
  refetchBalance();
};

const handleEdit = (transaction: Transaction) => {
  setEditingTransaction(transaction);
  setIsModalOpen(true);
};

const handleAddNew = () => {
  setEditingTransaction(null);
  setIsModalOpen(true);
};

const confirmDelete = async () => {
  if (deleteConfirm) {
    await transactionsApi.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    refetch();
    refetchBalance();
  }
};

const formatAmount = (amount: number) => {
  const formatted = Math.abs(amount).toLocaleString();
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

#### JSX Updates:

1. Replace hardcoded balance with `balance?.toLocaleString() ?? '0'`
2. Replace hardcoded stats with computed `stats.income`, `stats.expenses`, `stats.count`
3. Add `LedgerFilters` component below stats
4. Replace empty state conditional with `transactions?.length === 0`
5. Add transaction list mapping with `TransactionCard`
6. Add `TransactionModal` at bottom
7. Add delete confirmation modal

---

### Phase 6: Add Update Handler (Backend)

**File:** `electron/database/handlers/transactions.ts`

Add missing update handler:

```typescript
// Update transaction
ipcMain.handle('db:transactions:update', async (_, id: string, data: Partial<typeof schema.transactions.$inferInsert>): Promise<DbResponse> => {
  try {
    const db = getDatabase();
    const result = db
      .update(schema.transactions)
      .set(data)
      .where(eq(schema.transactions.id, id))
      .returning()
      .get();
    return { success: true, data: result };
  } catch (error) {
    console.error('[Transactions] update error:', error);
    return { success: false, error: String(error) };
  }
});
```

**File:** `src/lib/db/api.ts`

Add update method to API:

```typescript
update: (id: string, data: Partial<CreateTransactionInput>) =>
  invoke<Transaction>('db:transactions:update', id, data),
```

**File:** `src/types/database.ts`

Add update type if needed:

```typescript
export type UpdateTransactionInput = Partial<CreateTransactionInput>;
```

---

## Implementation Checklist

### Phase 1: TransactionModal
- [ ] Create `src/components/ledger/` directory
- [ ] Create `TransactionModal.tsx`
- [ ] Implement transaction type toggle (income/expense)
- [ ] Implement amount input with formatting
- [ ] Implement category dropdown
- [ ] Implement description textarea
- [ ] Implement timestamp input
- [ ] Implement ship dropdown
- [ ] Implement location dropdown
- [ ] Handle create vs edit modes
- [ ] Form validation (amount > 0, category required)

### Phase 2: LedgerFilters
- [ ] Create `LedgerFilters.tsx`
- [ ] Implement All/Income/Expenses toggle
- [ ] Implement category dropdown filter
- [ ] Display count badges

### Phase 3: TransactionCard
- [ ] Create `TransactionCard.tsx`
- [ ] Map categories to icons
- [ ] Color-code amounts
- [ ] Format timestamp
- [ ] Display metadata chips
- [ ] Handle click to edit

### Phase 4: Component Exports
- [ ] Create `index.ts` with exports

### Phase 5: LedgerView Integration
- [ ] Add data fetching hooks
- [ ] Add UI state management
- [ ] Implement computed values (filtered list, stats)
- [ ] Wire up search input
- [ ] Wire up filter components
- [ ] Implement transaction list
- [ ] Add modal with handlers
- [ ] Add delete confirmation
- [ ] Update stats display with real data
- [ ] Update balance badge with real data

### Phase 6: Backend Update Handler
- [ ] Add `db:transactions:update` IPC handler
- [ ] Add `update` method to `transactionsApi`
- [ ] Add `UpdateTransactionInput` type

---

## File Structure After Implementation

```
src/
├── components/
│   └── ledger/
│       ├── index.ts
│       ├── TransactionModal.tsx
│       ├── TransactionCard.tsx
│       └── LedgerFilters.tsx
├── views/
│   └── LedgerView.tsx (updated)
├── lib/db/
│   └── api.ts (updated with update method)
└── types/
    └── database.ts (updated with UpdateTransactionInput)

electron/database/handlers/
└── transactions.ts (updated with update handler)
```

---

## Testing Plan

### Manual Testing

1. **Create Transaction**
   - Open modal, fill required fields, save
   - Verify appears in list
   - Verify balance updates

2. **Edit Transaction**
   - Click existing transaction
   - Modify fields, save
   - Verify changes persist

3. **Delete Transaction**
   - Click delete on transaction
   - Confirm deletion
   - Verify removed from list
   - Verify balance updates

4. **Filtering**
   - Test income/expense filter
   - Test category filter
   - Test search
   - Test combined filters

5. **Statistics**
   - Verify balance matches sum
   - Verify income total
   - Verify expense total
   - Verify transaction count

6. **Edge Cases**
   - Empty state display
   - Very large amounts
   - Long descriptions
   - No filters match

---

## Estimated Effort

| Phase | Complexity | Notes |
|-------|------------|-------|
| Phase 1: TransactionModal | Medium | ~150 lines, follow JournalEntryModal pattern |
| Phase 2: LedgerFilters | Low | ~50 lines, simple filter buttons |
| Phase 3: TransactionCard | Low | ~60 lines, can leverage EntryCard |
| Phase 4: Index Export | Trivial | 3 lines |
| Phase 5: LedgerView | Medium | ~200 lines, mostly wiring |
| Phase 6: Backend Update | Low | ~20 lines, follow existing pattern |

---

## Dependencies

No new npm packages required. Uses existing:
- React + hooks
- Lucide icons
- Tailwind CSS
- Existing UI components (Modal, Button, Input, Select, etc.)

---

## Future Enhancements

After MVP is complete, consider:

1. **Date Range Filter** - Filter transactions by date range
2. **Category Charts** - Pie chart of spending by category
3. **Monthly View** - Group transactions by month
4. **CSV Export** - Export transactions to spreadsheet
5. **Recurring Transactions** - Templates for common transactions
6. **Quick Add** - Preset buttons for common transactions
7. **Linked Journal Entries** - Create journal entry from transaction
8. **Per-Ship Reports** - Profitability by ship
