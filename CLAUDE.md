# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deckhand is an Electron + React + TypeScript desktop application - a personal logbook for Star Citizen pilots. It tracks ships, locations, transactions, missions, cargo runs, screenshots, and gaming sessions.

## Commands

```bash
npm run dev          # Start Vite dev server with Electron
npm run build        # TypeScript check → Vite build → Electron build
npm run lint         # ESLint with zero warnings tolerance

npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Apply migrations to database
npm run db:studio    # Open Drizzle Studio UI for database inspection
```

## Architecture

### Process Separation

**Main Process** (`electron/`):
- `main.ts` - Window management, IPC handler registration, app lifecycle, data export/import, screenshot file management, custom `local-file://` protocol
- `preload.ts` - Context bridge exposing IPC invoke to renderer
- `database/index.ts` - Database initialization, connection management, WAL mode
- `database/schema.ts` - Drizzle ORM schema (source of truth for types)
- `database/handlers/` - IPC handlers per entity (ships, locations, journal, transactions, cargo, missions, screenshots, sessions)

**Renderer Process** (`src/`):
- React app with Zustand for navigation state and balance refresh triggers
- `lib/db/api.ts` - Typed IPC invoke wrappers (8 API modules: ships, locations, journal, transactions, cargo, missions, screenshots, sessions)
- `lib/db/hooks.ts` - Data fetching hooks with loading/error/refetch
- `views/` - Page components (Home, Log, Fleet, Atlas, Ledger, Cargo, Jobs, Gallery, Config)
- `components/layout/` - TitleBar, Sidebar, StatusBar

### IPC Pattern

All database operations use typed IPC with channel naming: `db:{entity}:{operation}`

```typescript
// Renderer (src/lib/db/api.ts)
shipsApi.create(data)  // → invoke('db:ships:create', data)

// Main process (electron/database/handlers/ships.ts)
ipcMain.handle('db:ships:create', async (_, data) => {
  // Returns DbResponse<T> { success, data?, error? }
})
```

### Database

- **Engine**: better-sqlite3 (synchronous, safe for Electron)
- **ORM**: Drizzle ORM with type inference
- **Dev/Prod separation**: `deckhand-dev.db` vs `deckhand.db` based on NODE_ENV
- **Schema location**: `electron/database/schema.ts`

### Type Flow

```
Drizzle schema → inferred types → IPC handlers → api.ts → React components
```

Types defined in `src/types/database.ts` as manually defined interfaces mirroring the schema. Input types use `Omit<Entity, 'id' | 'createdAt' | ...>` with `Partial<>` for updates.

## Key Directories

```
electron/database/handlers/  # Add new IPC handlers here (one file per entity)
src/views/                   # Add new pages here
src/components/ui/           # Reusable UI components (Button, Modal, Card, Input, Select, etc.)
src/components/{feature}/    # Feature-specific components (fleet/, atlas/, journal/, cargo/, jobs/, gallery/)
src/components/layout/       # Layout components (TitleBar, Sidebar, StatusBar)
src/lib/db/                  # API client and data fetching hooks
src/stores/                  # Zustand stores (navigation, refresh)
```

## Adding New Features

1. Add table to `electron/database/schema.ts`
2. Create handler in `electron/database/handlers/{entity}.ts`
3. Register in `electron/database/handlers/index.ts`
4. Add types to `src/types/database.ts`
5. Add API methods to `src/lib/db/api.ts`
6. Add data fetching hooks to `src/lib/db/hooks.ts`
7. Create view in `src/views/{Feature}View.tsx`
8. Add navigation entry to `src/stores/navigation.ts` and `src/components/layout/Sidebar.tsx`

## Domain Notes

- Ships have manufacturers, models, nicknames, variants, roles, ownership status (isOwned), acquisition date/price, notes, image path, and optional wiki URLs
- Ship acquisition automatically creates a purchase transaction in the ledger
- Locations are hierarchical (system → planet → moon → station) via parentId, with services (JSON), visit count tracking, and favorite flag
- Coordinates use per-axis units (km or m for X, Y, Z independently)
- Journal entry types: journal, cargo, combat, acquisition, mining, scavenging
- Journal entries support mood tracking, tags (JSON), and favorite marking
- Transaction categories: cargo, mission, repair, fuel, purchase, sale, other (positive amount = income, negative = expense)
- Cargo quantities measured in SCU (Standard Cargo Units); cargo run statuses: in_progress, completed, failed
- Mission types: bounty, delivery, mining, salvage, investigation, escort; statuses: active, completed, failed, abandoned
- Screenshots are copied to app userData directory with UUID filenames; support linking to locations, ships, and journal entries
- Sessions track gaming time with optional starting/ending balance
- All timestamps stored as Date objects
