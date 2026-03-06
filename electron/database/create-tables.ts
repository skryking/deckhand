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
}
