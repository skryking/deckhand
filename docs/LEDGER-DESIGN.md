# Ledger Feature Design Document

## Overview

The Ledger module provides financial tracking for Star Citizen pilots. It records income and expenses across the verse, enabling pilots to understand their economic activity, track profitability, and make informed decisions about their operations.

---

## Current State Analysis

### Backend (Complete)

The database layer is fully implemented:

| Component | Status | Location |
|-----------|--------|----------|
| Database Schema | Complete | `electron/database/schema.ts` |
| IPC Handlers | Complete | `electron/database/handlers/transactions.ts` |
| API Layer | Complete | `src/lib/db/api.ts` |
| React Hooks | Complete | `src/lib/db/hooks.ts` |
| Type Definitions | Complete | `src/types/database.ts` |

### Frontend (Placeholder Only)

The current `LedgerView.tsx` is a static placeholder with:
- Hardcoded zero values
- No data fetching
- No CRUD operations
- No filtering or search

---

## Transaction Data Model

```typescript
interface Transaction {
  id: string;                    // UUID, auto-generated
  timestamp: Date;               // When the transaction occurred
  amount: number;                // Positive = income, negative = expense
  category: string;              // Transaction category (see below)
  description: string | null;    // Optional details
  locationId: string | null;     // FK to locations table
  shipId: string | null;         // FK to ships table
  journalEntryId: string | null; // FK to journal_entries table
  createdAt: Date | null;        // Record creation timestamp
}
```

### Transaction Categories

| Category | Description | Typical Sign |
|----------|-------------|--------------|
| `cargo` | Trading commodities | +/- (profit or loss) |
| `mission` | Mission payouts | + (income) |
| `bounty` | Bounty hunting rewards | + (income) |
| `repair` | Ship repairs | - (expense) |
| `fuel` | Hydrogen/Quantum fuel | - (expense) |
| `purchase` | Equipment, components | - (expense) |
| `sale` | Selling items | + (income) |
| `insurance` | Insurance claims/premiums | +/- |
| `fine` | Fines and penalties | - (expense) |
| `other` | Miscellaneous | +/- |

---

## User Interface Design

### Layout Structure

```
+------------------------------------------------------------------+
| HEADER                                                            |
| Ledger                    [Search...]  [+ Add Transaction]        |
| [Balance Badge: 1,234,567 aUEC]                                  |
+------------------------------------------------------------------+
| STATS BAR                                                         |
| [Current Balance] [Total Income] [Total Expenses] [# Transactions]|
+------------------------------------------------------------------+
| FILTERS BAR                                                       |
| [All] [Income] [Expenses] | Category: [Dropdown] | [Date Range]  |
+------------------------------------------------------------------+
| TRANSACTION LIST                                                  |
| +--------------------------------------------------------------+ |
| | TransactionCard                                               | |
| | [Icon] Category  |  Amount (+/-)  |  Description  |  Date    | |
| | [Location] [Ship]                                             | |
| +--------------------------------------------------------------+ |
| | TransactionCard                                               | |
| | ...                                                           | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Components Required

#### 1. LedgerView (Main Container)
- Header with title, balance badge, search, add button
- Stats grid showing financial overview
- Filter bar for category and income/expense
- Transaction list or empty state

#### 2. TransactionModal (Create/Edit Form)
- Amount input (with +/- toggle for income/expense)
- Category dropdown
- Description textarea
- Date/time picker
- Optional: Ship selector
- Optional: Location selector
- Optional: Link to journal entry

#### 3. TransactionCard (List Item)
- Category icon and label
- Amount with color coding (green=income, red=expense)
- Description preview
- Timestamp
- Metadata chips (location, ship)

#### 4. LedgerFilters (Filter Bar)
- Income/Expense/All toggle
- Category dropdown filter
- Future: Date range picker

#### 5. DeleteConfirmModal (Reusable)
- Confirmation dialog for deletion

---

## Functional Requirements

### Core Features (MVP)

1. **View Transactions**
   - Display all transactions in reverse chronological order
   - Show amount, category, description, and timestamp
   - Color-code amounts (green for income, red for expense)

2. **Create Transaction**
   - Modal form with required fields: amount, category
   - Optional fields: description, ship, location
   - Automatic timestamp (editable)

3. **Edit Transaction**
   - Click transaction to open in edit mode
   - Pre-populate form with existing data

4. **Delete Transaction**
   - Delete button with confirmation dialog
   - Soft warning about irreversibility

5. **Financial Statistics**
   - Current balance (sum of all transactions)
   - Total income (sum of positive amounts)
   - Total expenses (sum of negative amounts)
   - Transaction count

6. **Search**
   - Search by description text
   - Real-time filtering

7. **Category Filter**
   - Filter by transaction category
   - Show count per category

### Enhanced Features (Future)

- Income vs Expense toggle filter
- Date range filtering
- Category breakdown chart
- Monthly/weekly summaries
- Export to CSV
- Recurring transactions
- Budget targets
- Per-ship profitability reports

---

## User Stories

### MVP Stories

1. **As a pilot**, I want to record a mission payout so I can track my earnings.
2. **As a pilot**, I want to log repair costs so I can understand my expenses.
3. **As a pilot**, I want to see my current balance so I know my financial status.
4. **As a pilot**, I want to filter by category so I can analyze specific income/expense types.
5. **As a pilot**, I want to search transactions so I can find specific entries.
6. **As a pilot**, I want to edit a transaction so I can fix mistakes.
7. **As a pilot**, I want to delete a transaction so I can remove incorrect entries.

### Future Stories

8. **As a pilot**, I want to see income vs expenses over time so I can track trends.
9. **As a pilot**, I want to see profit per ship so I can optimize my fleet usage.
10. **As a pilot**, I want to export my ledger so I can analyze it externally.

---

## Amount Formatting

### Display Format
- Use `toLocaleString()` for thousand separators: `1,234,567 aUEC`
- Positive amounts: Green text with `+` prefix
- Negative amounts: Red text with `-` prefix (natural)
- Balance can be either color depending on value

### Input Format
- Allow negative numbers directly, or
- Provide Income/Expense toggle that sets sign automatically
- Strip non-numeric characters on parse

---

## Category Icons

Map each category to a Lucide icon:

| Category | Icon |
|----------|------|
| cargo | `Package` |
| mission | `Target` |
| bounty | `Crosshair` |
| repair | `Wrench` |
| fuel | `Fuel` |
| purchase | `ShoppingCart` |
| sale | `Tag` |
| insurance | `Shield` |
| fine | `AlertTriangle` |
| other | `MoreHorizontal` |

---

## State Management

### Local Component State
- `isModalOpen: boolean` - Transaction modal visibility
- `editingTransaction: Transaction | null` - Current edit target
- `searchQuery: string` - Search input value
- `activeCategory: string | null` - Category filter
- `showIncomeOnly: boolean` - Income filter
- `showExpensesOnly: boolean` - Expense filter
- `deleteConfirm: Transaction | null` - Delete confirmation target

### Derived/Computed Values
- `filteredTransactions` - Transactions after search + filters
- `totalIncome` - Sum of positive amounts
- `totalExpenses` - Sum of negative amounts (absolute value)
- `categoryCounts` - Count per category for filter badges

---

## Error Handling

1. **API Errors**: Display toast/inline error message
2. **Empty States**: Show helpful empty state with CTA
3. **Loading States**: Show skeleton or spinner during fetch
4. **Validation**: Require amount > 0 and category selection

---

## Accessibility

- Keyboard navigation for transaction list
- ARIA labels on interactive elements
- Focus management for modal open/close
- Color is not the only indicator (use icons + text)

---

## Integration Points

### With Ships
- Link transactions to ships for per-ship profitability
- Show ship name in transaction cards

### With Locations
- Link transactions to locations for location-based analysis
- Show location name in transaction cards

### With Journal
- Optionally link transactions to journal entries
- Navigate to related journal entry

### With Dashboard (Home)
- Recent transactions widget
- Balance summary widget
- Income/expense chart widget

---

## Performance Considerations

- Paginate large transaction lists (use existing `limit`/`offset` in API)
- Memoize filtered results with `useMemo`
- Debounce search input
- Virtual scrolling for 1000+ transactions (future)
