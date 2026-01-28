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
- `main.ts` - Window management, IPC handler registration, app lifecycle
- `database/schema.ts` - Drizzle ORM schema (source of truth for types)
- `database/handlers/` - IPC handlers per entity (ships, locations, journal, etc.)

**Renderer Process** (`src/`):
- React app with Zustand for navigation state only
- `lib/db/api.ts` - Typed IPC invoke wrappers
- `lib/db/hooks.ts` - Data fetching hooks with loading/error/refetch
- `views/` - Page components (one per feature)

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

Types defined in `src/types/database.ts` mirror schema definitions. Use `typeof schema.ships.$inferSelect` pattern for database types.

## Key Directories

```
electron/database/handlers/  # Add new IPC handlers here (one file per entity)
src/views/                   # Add new pages here
src/components/ui/           # Reusable UI components (Button, Modal, Card, etc.)
src/components/{feature}/    # Feature-specific components (fleet/, atlas/, journal/)
src/lib/db/                  # API client and data fetching hooks
```

## Adding New Features

1. Add table to `electron/database/schema.ts`
2. Create handler in `electron/database/handlers/{entity}.ts`
3. Register in `electron/database/handlers/index.ts`
4. Add types to `src/types/database.ts`
5. Add API methods to `src/lib/db/api.ts`
6. Create view in `src/views/{Feature}View.tsx`
7. Add navigation entry to `src/stores/navigation.ts` and `src/components/layout/Sidebar.tsx`

## Domain Notes

- Ships have manufacturers, models, variants, roles, and optional wiki URLs
- Locations are hierarchical (system → planet → moon → station) via parentId
- Coordinates use per-axis units (km or m for X, Y, Z independently)
- Journal entry types: journal, cargo, combat, acquisition, mining, scavenging
- Cargo quantities measured in SCU (Standard Cargo Units)
- All timestamps use ISO 8601 format
