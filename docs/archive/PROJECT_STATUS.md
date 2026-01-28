# Deckhand Project Status

## Overview
Deckhand is a Star Citizen logbook Electron app built with React, TypeScript, Tailwind CSS v4, SQLite (better-sqlite3), and Drizzle ORM.

**Current Version:** 0.1.0

---

## Completed Work

### Commit 1: `dd49ea8` - Initial App Shell
- Electron + React + TypeScript project with electron-vite
- Tailwind CSS v4 configured with custom `@theme` design tokens
- Custom color palette: warm teal (#2dd4bf) / amber (#fbbf24) on space black
- Fonts: Oxanium (display), Outfit (body), JetBrains Mono (code)
- Frameless window with custom title bar and window controls
- Layout components: TitleBar, Sidebar (9 nav items), StatusBar
- UI components: Button (beveled), Input, SearchInput, Card, StatCard, EntryCard
- Lucide icons installed

### Commit 2: `555ad38` - Database Layer
- SQLite database with Drizzle ORM
- Database location: `%APPDATA%/deckhand/deckhand.db`
- 8 database tables:
  - `ships` - Ship registry
  - `locations` - Hierarchical location database
  - `journal_entries` - Captain's log entries
  - `transactions` - Financial ledger
  - `cargo_runs` - Trade run tracking
  - `missions` - Mission log
  - `screenshots` - Gallery metadata
  - `sessions` - Play session tracking
- Full IPC handlers for CRUD operations on all entities
- Typed renderer API (`src/lib/db/api.ts`)
- React hooks for data fetching (`src/lib/db/hooks.ts`)
- Shared TypeScript types (`src/types/database.ts`)

### Commit 3: `9087333` - Phase 2 Core Features
- **Zustand navigation store** (`src/stores/navigation.ts`)
  - Typed `NavId` union for all 9 views
  - `useNavigation` hook for accessing/setting active view
- **View components** (`src/views/`) - All 9 module views created
- **Sidebar** updated to use Zustand store directly
- **App.tsx** updated with view routing via switch statement

- **New UI Components** (`src/components/ui/`):
  - `Modal.tsx` - Reusable modal with backdrop, title, footer
  - `ModalFooter.tsx` - Standard modal actions layout
  - `Textarea.tsx` - Multi-line text input with label/error support
  - `Select.tsx` - Dropdown select with label/error support

- **Fleet Module** (`src/components/fleet/`):
  - `ShipCard.tsx` - Ship display card with edit/delete menu
  - `ShipModal.tsx` - Add/edit ship form (manufacturer, model, role, price, etc.)
  - `FleetView.tsx` - Full CRUD with grid layout, search, empty states

- **Atlas Module** (`src/components/atlas/`):
  - `LocationCard.tsx` - Location card with favorite toggle, 17 location type icons
  - `LocationModal.tsx` - Add/edit location with parent selection, services
  - `LocationTree.tsx` - Hierarchical tree navigation with expand/collapse
  - `AtlasView.tsx` - Grid/tree view toggle, full CRUD, search
  - **17 Star Citizen location types**: system, star, planet, moon, asteroid, lagrange, station, platform, city, outpost, underground, asteroid_belt, jump_point, comm_array, wreck, cave, poi
  - **22 services**: Refuel, Repair, Restock, Medical, Trading, Ship Sales, Component Sales, Armor/Weapons, Food & Drink, Mining, Refinery, Cargo Deck, Hangar, Vehicle Pad, Spawn Point, Clinic, Hospital, Habitation, Prison, Admin Office, Ship Customization, Racing

- **Journal Module** (`src/components/journal/`):
  - `JournalFilters.tsx` - Type filter tabs (All, Journal, Cargo, Combat, Acquisition)
  - `JournalEntryModal.tsx` - Entry form with ship/location dropdowns, tags, mood
  - `LogView.tsx` - Full CRUD, search, filters, ship/location linking

- **Config/Backup Module** (`src/views/ConfigView.tsx`):
  - Export all data to JSON backup file
  - Import data from JSON backup (replaces existing)
  - Clear all data with confirmation
  - Open database folder in file explorer
  - DEV MODE indicator when running in development
  - IPC handlers in `electron/main.ts`

- **Development/Production Database Separation**:
  - Dev mode uses `deckhand-dev.db`
  - Production uses `deckhand.db`
  - Protects production data during development

- **Build Configuration**:
  - electron-builder configured for Windows NSIS installer
  - App name: "Deckhand"
  - Output to `release/` folder
  - Custom icon support (`build/icon.ico`)

- **Bug Fixes**:
  - Fixed Tailwind CSS v4 preflight conflict (removed manual `* { padding: 0 }` reset)
  - Fixed EntryCard text cutoff with proper left padding for accent bar

---

## Project Structure

```
deckhand/
├── build/
│   ├── icon.svg              # App icon source
│   └── icon.ico              # Windows app icon (256x256+)
├── electron/
│   ├── main.ts               # Electron main process (DB init, IPC handlers)
│   ├── preload.ts            # IPC bridge
│   └── database/
│       ├── index.ts          # DB initialization, connection, dev/prod separation
│       ├── schema.ts         # Drizzle schema (8 tables)
│       └── handlers/         # IPC handlers for each entity
│           ├── index.ts
│           ├── ships.ts
│           ├── locations.ts
│           ├── journal.ts
│           ├── transactions.ts
│           ├── cargo.ts
│           ├── missions.ts
│           ├── screenshots.ts
│           └── sessions.ts
├── src/
│   ├── App.tsx               # Main app with view routing
│   ├── index.css             # Tailwind v4 + design system
│   ├── components/
│   │   ├── Logo.tsx          # SVG anchor/compass logo
│   │   ├── layout/
│   │   │   ├── TitleBar.tsx
│   │   │   ├── Sidebar.tsx   # Uses Zustand for navigation
│   │   │   └── StatusBar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx      # Card, StatCard, EntryCard
│   │   │   ├── Modal.tsx     # Reusable modal
│   │   │   ├── Textarea.tsx  # Multi-line input
│   │   │   └── Select.tsx    # Dropdown select
│   │   ├── fleet/
│   │   │   ├── ShipCard.tsx
│   │   │   └── ShipModal.tsx
│   │   ├── atlas/
│   │   │   ├── LocationCard.tsx
│   │   │   ├── LocationModal.tsx
│   │   │   └── LocationTree.tsx
│   │   └── journal/
│   │       ├── JournalFilters.tsx
│   │       └── JournalEntryModal.tsx
│   ├── stores/
│   │   ├── index.ts
│   │   └── navigation.ts     # Zustand navigation store
│   ├── views/
│   │   ├── index.ts
│   │   ├── HomeView.tsx
│   │   ├── LogView.tsx
│   │   ├── FleetView.tsx
│   │   ├── AtlasView.tsx
│   │   ├── LedgerView.tsx
│   │   ├── CargoView.tsx
│   │   ├── JobsView.tsx
│   │   ├── GalleryView.tsx
│   │   └── ConfigView.tsx
│   ├── lib/
│   │   └── db/
│   │       ├── api.ts        # Typed IPC wrappers
│   │       ├── hooks.ts      # React data hooks
│   │       └── index.ts
│   └── types/
│       └── database.ts       # Shared DB types
├── docs/
│   ├── DECKHAND-DESIGN.md    # Full design document
│   ├── PROJECT_STATUS.md     # This file
│   └── deckhand-mockup.html  # Visual mockup
├── release/                  # Production builds output here
├── drizzle.config.ts         # Drizzle Kit configuration
├── vite.config.ts            # Vite + Electron config
└── package.json              # With electron-builder config
```

---

## Key Configuration

### Native Module Setup
better-sqlite3 requires compilation for Electron. After cloning:
```bash
npm install
npx @electron/rebuild -f -w better-sqlite3
npm run dev
```

**Requirements for building native modules (Windows):**
- Python 3.x
- Visual Studio Build Tools 2022 with "Desktop development with C++" workload

### Vite Config
Native modules externalized in `vite.config.ts`:
```typescript
external: ['better-sqlite3', 'drizzle-orm', 'drizzle-orm/better-sqlite3']
```

### npm Scripts
- `npm run dev` - Start development (uses `deckhand-dev.db`)
- `npm run build` - Build for production (run as Administrator on Windows)
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database

### Production Build
```bash
# Run as Administrator for symlink permissions
npm run build
```
Output: `release/Deckhand Setup 0.1.0.exe`

---

## Phase Checklist

### Phase 1 - Foundation (Complete)
- [x] Dev environment setup
- [x] Project scaffolding
- [x] Design system (Tailwind config + components)
- [x] App shell (title bar, sidebar, routing)
- [x] SQLite + Drizzle setup
- [x] Zustand navigation store
- [x] View components for all 9 modules
- [x] About screen with disclaimer (in ConfigView)

### Phase 2 - Core Features (Complete)
- [x] New UI components (Modal, Textarea, Select)
- [x] Journal module - CRUD operations, search, filtering by type
- [x] Fleet/ship registry - Add/edit ships, track loadouts
- [x] Location database - Hierarchical locations with tree view
- [x] Settings & data backup - Export/import functionality
- [x] Dev/prod database separation
- [x] Production build configuration
- [x] App icon

### Phase 3 - Enhanced Features (Planned)
- [ ] Ledger/transaction tracking with charts
- [ ] Cargo run logging with profit analysis
- [ ] Mission tracking
- [ ] Screenshot gallery with tagging
- [ ] Session tracking with playtime stats
- [ ] Home dashboard with real stats and recent activity

---

## Design System Quick Reference

### Colors (CSS variables)
```css
--color-void: #08090c       /* Darkest background */
--color-hull: #0f1318       /* Panel background */
--color-panel: #161c24      /* Card background */
--color-teal-bright: #2dd4bf /* Primary accent */
--color-amber-bright: #fbbf24 /* Secondary accent */
--color-text-primary: #f1f5f9
--color-text-secondary: #94a3b8
```

### Tailwind Utilities
- `font-display` - Oxanium
- `font-mono` - JetBrains Mono
- `tracking-display` - 0.08em letter spacing
- `clip-bevel` - Beveled button corners
- `border-subtle` - Teal 15% opacity border
- `glow-teal` - Teal box shadow

### Navigation Store Usage
```tsx
import { useNavigation, type NavId } from './stores';

function MyComponent() {
  const activeView = useNavigation((s) => s.activeView);
  const setActiveView = useNavigation((s) => s.setActiveView);

  // Navigate to a different view
  setActiveView('fleet');
}
```

### Database Hooks Usage
```tsx
import { useShips, useJournalEntries, useBalance } from './lib/db';

function MyComponent() {
  const { data: ships, loading, refetch } = useShips();
  const { data: entries } = useJournalEntries({ limit: 10 });
  const { data: balance } = useBalance();
}
```

### Database API Usage
```tsx
import { shipsApi, journalApi } from './lib/db';

// Create
await shipsApi.create({ manufacturer: 'Origin', model: '400i' });

// Update
await shipsApi.update(id, { nickname: 'My Ship' });

// Delete
await shipsApi.delete(id);
```

---

## Running the App

### Development
```bash
cd C:\Dev\deckhand
npm run dev
```
Uses separate `deckhand-dev.db` database.

### Production
Install from `release/Deckhand Setup 0.1.0.exe`
Uses `deckhand.db` in `%APPDATA%/deckhand/`

The app will open as a frameless Electron window with the Deckhand UI.
