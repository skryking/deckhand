# Deckhand — Pilot's Companion

## A Personal Logbook for Space Simulation Games

---

## Brand Identity

### Name & Tagline
**Deckhand** — *Pilot's Companion*

The name "Deckhand" evokes:
- A crew member who handles the practical work aboard a vessel
- Someone who keeps things running and documented
- Approachable, utilitarian, reliable

### Design Philosophy
Deckhand's visual identity is **original and distinctive** while being aesthetically compatible with sci-fi space games. It uses a warm teal and amber color system that feels futuristic yet different from any specific game's UI.

**Key differentiators from game UIs:**
- Warm teal (#2dd4bf) as primary accent instead of cyan/blue
- Amber (#fbbf24) as secondary accent for highlights
- Oxanium font family (not Orbitron or other commonly-used sci-fi fonts)
- Beveled/clipped corners on buttons and panels (original design element)
- Left-accent bars on cards instead of corner decorations
- Subtle grid background pattern

---

## Legal Compliance

### Required Disclaimer
The following disclaimer must appear in the app's About/Settings screen and any distribution:

> **Deckhand is an unofficial fan-created tool, not affiliated with or endorsed by Cloud Imperium Games, Roberts Space Industries, or any game developer.**
>
> This application is free, open-source software created by fans for personal use. It does not contain any copyrighted assets, trademarks, or intellectual property from any game.
>
> Star Citizen®, Squadron 42®, Roberts Space Industries®, and Cloud Imperium® are registered trademarks of Cloud Imperium Rights LLC. All rights reserved.
>
> Game-specific terminology used within this app (ship names, location names, currency) are user-entered data and do not imply any affiliation with or endorsement by game publishers.

### Distribution Guidelines
If distributing Deckhand to others:

1. **Always free** — No paywalls, subscriptions, or mandatory donations
2. **Open source preferred** — Consider MIT or GPL license
3. **No game assets** — All icons, images, and graphics must be original
4. **Clear labeling** — Never describe as "official" or "endorsed"
5. **Disclaimer visible** — Include in About screen and README

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Electron 28+ | Native Windows app, familiar web tech |
| **Frontend** | React 18 + TypeScript | Type safety, component architecture |
| **Styling** | Tailwind CSS + custom theme | Rapid styling with Deckhand design tokens |
| **State** | Zustand | Lightweight, no boilerplate |
| **Database** | SQLite (via better-sqlite3) | Local, portable, no server needed |
| **ORM** | Drizzle ORM | Type-safe queries, great DX |
| **Build** | Vite + electron-builder | Fast dev, easy packaging |

---

## Design System

### Color Palette

```css
:root {
    /* === Foundation (Warm Space Black) === */
    --dh-bg-void: #08090c;
    --dh-bg-hull: #0f1318;
    --dh-bg-panel: #161c24;
    --dh-bg-elevated: #1e262f;
    --dh-bg-hover: #2a3441;
    
    /* === Primary Accent: Warm Teal === */
    --dh-teal-bright: #2dd4bf;
    --dh-teal-primary: #14b8a6;
    --dh-teal-muted: #0d9488;
    --dh-teal-dark: #134e4a;
    --dh-teal-glow: rgba(45, 212, 191, 0.4);
    
    /* === Secondary Accent: Amber === */
    --dh-amber-bright: #fbbf24;
    --dh-amber-primary: #f59e0b;
    --dh-amber-muted: #d97706;
    --dh-amber-glow: rgba(251, 191, 36, 0.3);
    
    /* === Text Hierarchy === */
    --dh-text-primary: #f1f5f9;
    --dh-text-secondary: #94a3b8;
    --dh-text-muted: #64748b;
    --dh-text-faint: #475569;
    
    /* === Status Colors === */
    --dh-success: #22c55e;
    --dh-warning: #eab308;
    --dh-danger: #ef4444;
    --dh-info: #3b82f6;
}
```

### Typography

| Use | Font | Weight | Size | Tracking |
|-----|------|--------|------|----------|
| Display/Headers | Oxanium | 600 | 20px | 0.08em |
| Body | Outfit | 400 | 14px | normal |
| Labels | Oxanium | 500 | 10px | 0.12em |
| Monospace/Data | JetBrains Mono | 400 | 13px | normal |

**Font imports:**
```css
@import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Original Design Elements

**Beveled Buttons:**
```css
.btn {
    clip-path: polygon(
        8px 0, 100% 0, 100% calc(100% - 8px), 
        calc(100% - 8px) 100%, 0 100%, 0 8px
    );
}
```

**Left-Accent Cards:**
```css
.entry-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 16px;
    bottom: 16px;
    width: 3px;
    background: var(--dh-teal-dark);
    border-radius: 0 2px 2px 0;
}
```

**Grid Background Pattern:**
```css
body::before {
    background-image: 
        linear-gradient(rgba(45, 212, 191, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 212, 191, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
}
```

---

## Application Architecture

### Navigation Structure

```
Deckhand
├── Home (Dashboard)
│   ├── Recent activity feed
│   ├── Quick stats widgets
│   └── Session tracker
│
├── Log (Captain's Journal)
│   ├── Entry list (filterable)
│   ├── Entry editor
│   └── Tags & categories
│
├── Fleet (Ship Registry)
│   ├── Ship list
│   ├── Ship details
│   │   ├── Specs & loadout
│   │   ├── Upgrades history
│   │   └── Per-ship financials
│   └── Add/edit ship
│
├── Atlas (Location Database)
│   ├── System browser (hierarchical)
│   │   └── System > Body > Location
│   ├── Visited locations
│   ├── Favorites
│   └── Notes per location
│
├── Ledger (Finances)
│   ├── Transaction list
│   ├── Income/expense breakdown
│   ├── Charts & trends
│   └── Category management
│
├── Cargo (Trade Runs)
│   ├── Cargo run log
│   ├── Commodity tracking
│   └── Profit analysis
│
├── Jobs (Mission Log)
│   ├── Active missions
│   ├── Completed missions
│   └── Mission details (paste from game)
│
├── Gallery (Screenshots)
│   ├── Import interface
│   ├── Thumbnail grid
│   ├── Lightbox viewer
│   └── Tag/link to entries
│
└── Config (Settings)
    ├── Theme selection
    ├── Data backup/restore
    ├── Screenshot folder path
    └── About & disclaimer
```

### Database Schema

```sql
-- Core tables remain the same as original design
-- Key change: No game-specific branding in schema

CREATE TABLE ships (
    id TEXT PRIMARY KEY,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    nickname TEXT,            -- User's name for the ship
    variant TEXT,
    role TEXT,
    is_owned BOOLEAN DEFAULT TRUE,
    acquired_at DATETIME,
    acquired_price INTEGER,
    notes TEXT,
    image_path TEXT           -- User-provided screenshot
);

CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES locations(id),
    name TEXT NOT NULL,
    type TEXT,                -- 'system', 'planet', 'moon', 'station', etc.
    services TEXT,            -- JSON array
    notes TEXT,
    first_visited_at DATETIME,
    visit_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE
);

CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    entry_type TEXT,          -- 'journal', 'cargo', 'combat', 'acquisition'
    mood TEXT,
    location_id TEXT REFERENCES locations(id),
    ship_id TEXT REFERENCES ships(id),
    tags TEXT,                -- JSON array
    is_favorite BOOLEAN DEFAULT FALSE
);

-- Additional tables: transactions, cargo_runs, missions, 
-- screenshots, sessions, ship_logs, ship_upgrades
-- (see original design doc for full schema)
```

---

## Development Environment Setup

### Prerequisites (Windows 11)

```powershell
# Install Node.js LTS
winget install OpenJS.NodeJS.LTS

# Install Git
winget install Git.Git

# Install VS Code
winget install Microsoft.VisualStudioCode

# Verify installations
node --version   # Should be 20.x+
npm --version    # Should be 10.x+
git --version
```

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- SQLite Viewer

### Project Initialization

```bash
# Create and enter project directory
mkdir deckhand && cd deckhand

# Initialize Electron + React + TypeScript
npm create electron-vite@latest . -- --template react-ts

# Install core dependencies
npm install

# Install additional packages
npm install zustand better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# Start development
npm run dev
```

---

## Project Structure

```
deckhand/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   └── database.ts          # SQLite operations
├── src/
│   ├── assets/
│   │   ├── fonts/           # Local font files (optional)
│   │   └── logo.svg         # Original Deckhand logo
│   ├── components/
│   │   ├── ui/              # Design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TitleBar.tsx
│   │   │   └── StatusBar.tsx
│   │   └── modules/
│   │       ├── journal/
│   │       ├── fleet/
│   │       ├── atlas/
│   │       └── ...
│   ├── hooks/
│   ├── stores/              # Zustand state
│   ├── lib/
│   │   ├── db/              # Drizzle queries
│   │   └── utils/
│   ├── styles/
│   │   └── globals.css      # Design tokens + base styles
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── drizzle/
│   └── schema.ts
├── package.json
├── electron-builder.yml
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── LICENSE                  # MIT recommended
└── README.md                # Include disclaimer
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Dev environment setup
- [ ] Project scaffolding
- [ ] Design system (Tailwind config + components)
- [ ] App shell (title bar, sidebar, routing)
- [ ] SQLite + Drizzle setup
- [ ] About screen with disclaimer

### Phase 2: Core Features
- [ ] Journal module (CRUD + search)
- [ ] Fleet/ship registry
- [ ] Location database (with pre-populated data option)
- [ ] Settings & data backup

### Phase 3: Financial & Cargo
- [ ] Ledger module
- [ ] Cargo run tracker
- [ ] Per-ship expenses

### Phase 4: Extended Features
- [ ] Mission log
- [ ] Screenshot gallery
- [ ] Session tracking
- [ ] Dashboard with widgets

### Phase 5: Distribution
- [ ] Build configuration
- [ ] Installer creation
- [ ] README with installation instructions
- [ ] GitHub release

---

## Logo Concept

The Deckhand logo combines:
- **Compass/navigation motif** — representing exploration and direction
- **Anchor element** — representing the "deckhand" naval theme
- **Minimal geometric style** — clean and professional

```svg
<svg viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14 6H10L12 2Z" fill="#2dd4bf"/>
    <path d="M12 6V10M12 14V22" stroke="#2dd4bf" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" stroke="#2dd4bf" stroke-width="2"/>
    <path d="M12 22L8 18M12 22L16 18" stroke="#2dd4bf" stroke-width="2"/>
    <path d="M6 12H2M22 12H18" stroke="#14b8a6" stroke-width="2"/>
</svg>
```

---

## Resources

### Fonts (Google Fonts - Free)
- [Oxanium](https://fonts.google.com/specimen/Oxanium)
- [Outfit](https://fonts.google.com/specimen/Outfit)
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

### Technical
- [Electron Documentation](https://www.electronjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)

### Icons (MIT Licensed)
- [Lucide Icons](https://lucide.dev/)
- [Phosphor Icons](https://phosphoricons.com/)

---

## Ready to Build

This design document provides everything needed to create a legally compliant, visually distinctive logbook application. The "Deckhand" brand is original, the color palette is unique, and the typography choices are different from common game UIs.

**Next steps:**
1. Set up development environment
2. Initialize project with the tech stack
3. Implement the design system in Tailwind
4. Build the app shell
5. Start with the Journal module

Let's get coding!
