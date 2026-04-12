import type Database from 'better-sqlite3';

export function createTables(sqlite: Database.Database): void {
  // Ships table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ships (
      id TEXT PRIMARY KEY,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      nickname TEXT,
      variant TEXT,
      role TEXT,
      is_owned INTEGER DEFAULT 1,
      acquired_at INTEGER,
      acquired_price INTEGER,
      notes TEXT,
      image_path TEXT,
      wiki_url TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Migration: Add wiki_url column if it doesn't exist
  const shipsColumns = sqlite.prepare("PRAGMA table_info(ships)").all() as { name: string }[];
  const shipsColumnNames = shipsColumns.map(c => c.name);

  if (!shipsColumnNames.includes('wiki_url')) {
    sqlite.exec('ALTER TABLE ships ADD COLUMN wiki_url TEXT');
  }

  // Locations table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      services TEXT,
      notes TEXT,
      coord_x REAL,
      coord_x_unit TEXT,
      coord_y REAL,
      coord_y_unit TEXT,
      coord_z REAL,
      coord_z_unit TEXT,
      first_visited_at INTEGER,
      visit_count INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      wiki_url TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Migration: Add wiki_url column to locations if it doesn't exist
  const locationsColumnsForWiki = sqlite.prepare("PRAGMA table_info(locations)").all() as { name: string }[];
  const locationsColumnNamesForWiki = locationsColumnsForWiki.map(c => c.name);

  if (!locationsColumnNamesForWiki.includes('wiki_url')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN wiki_url TEXT');
  }

  // Migration: Add coordinate columns if they don't exist
  const locationsColumns = sqlite.prepare("PRAGMA table_info(locations)").all() as { name: string }[];
  const columnNames = locationsColumns.map(c => c.name);

  if (!columnNames.includes('coord_x')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_x REAL');
  }
  if (!columnNames.includes('coord_x_unit')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_x_unit TEXT');
  }
  if (!columnNames.includes('coord_y')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_y REAL');
  }
  if (!columnNames.includes('coord_y_unit')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_y_unit TEXT');
  }
  if (!columnNames.includes('coord_z')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_z REAL');
  }
  if (!columnNames.includes('coord_z_unit')) {
    sqlite.exec('ALTER TABLE locations ADD COLUMN coord_z_unit TEXT');
  }

  // Journal entries table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      entry_type TEXT,
      mood TEXT,
      location_id TEXT,
      ship_id TEXT,
      tags TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Transactions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      location_id TEXT,
      ship_id TEXT,
      journal_entry_id TEXT,
      created_at INTEGER
    )
  `);

  // Migration: Add missionId and cargoRunId to transactions
  const txnColumns = sqlite.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  const txnColumnNames = txnColumns.map(c => c.name);
  if (!txnColumnNames.includes('mission_id')) {
    sqlite.exec('ALTER TABLE transactions ADD COLUMN mission_id TEXT');
  }
  if (!txnColumnNames.includes('cargo_run_id')) {
    sqlite.exec('ALTER TABLE transactions ADD COLUMN cargo_run_id TEXT');
  }

  // Cargo runs table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cargo_runs (
      id TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      commodity TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER,
      profit INTEGER,
      origin_location_id TEXT,
      destination_location_id TEXT,
      ship_id TEXT,
      notes TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at INTEGER
    )
  `);

  // Missions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      mission_type TEXT,
      contractor TEXT,
      reward INTEGER,
      status TEXT DEFAULT 'active',
      accepted_at INTEGER,
      completed_at INTEGER,
      location_id TEXT,
      ship_id TEXT,
      notes TEXT,
      created_at INTEGER
    )
  `);

  // Screenshots table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      taken_at INTEGER,
      caption TEXT,
      tags TEXT,
      location_id TEXT,
      ship_id TEXT,
      journal_entry_id TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `);

  // Sessions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_minutes INTEGER,
      starting_balance INTEGER,
      ending_balance INTEGER,
      notes TEXT,
      created_at INTEGER
    )
  `);

  // Inventory table (mining & materials)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      material_name TEXT NOT NULL,
      category TEXT,
      source TEXT,
      quantity_cscu INTEGER NOT NULL DEFAULT 0,
      quality INTEGER NOT NULL DEFAULT 0,
      location_id TEXT,
      ship_id TEXT,
      notes TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      UNIQUE(material_name, quality)
    )
  `);

  // Blueprints table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS blueprints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      output_quantity INTEGER DEFAULT 1,
      obtained_at INTEGER,
      location_id TEXT,
      notes TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Blueprint ingredients table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS blueprint_ingredients (
      id TEXT PRIMARY KEY,
      blueprint_id TEXT NOT NULL,
      material_name TEXT NOT NULL,
      quantity_cscu INTEGER NOT NULL,
      min_quality INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `);

  // Indexes for foreign key columns and commonly queried fields
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_timestamp ON journal_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_ship_id ON journal_entries(ship_id);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_location_id ON journal_entries(location_id);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_type ON journal_entries(entry_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_ship_id ON transactions(ship_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_location_id ON transactions(location_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_cargo_run_id ON transactions(cargo_run_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_mission_id ON transactions(mission_id);
    CREATE INDEX IF NOT EXISTS idx_cargo_runs_ship_id ON cargo_runs(ship_id);
    CREATE INDEX IF NOT EXISTS idx_cargo_runs_status ON cargo_runs(status);
    CREATE INDEX IF NOT EXISTS idx_missions_ship_id ON missions(ship_id);
    CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
    CREATE INDEX IF NOT EXISTS idx_screenshots_ship_id ON screenshots(ship_id);
    CREATE INDEX IF NOT EXISTS idx_screenshots_location_id ON screenshots(location_id);
    CREATE INDEX IF NOT EXISTS idx_screenshots_journal_entry_id ON screenshots(journal_entry_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_inventory_material_name ON inventory(material_name);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_blueprint_ingredients_blueprint_id ON blueprint_ingredients(blueprint_id);
    CREATE INDEX IF NOT EXISTS idx_blueprint_ingredients_material_name ON blueprint_ingredients(material_name);
  `);
}
