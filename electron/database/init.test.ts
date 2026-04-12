import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from './create-tables';

function getTableNames(sqlite: Database.Database): string[] {
  const rows = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  return rows.map(r => r.name).sort();
}

function getColumnNames(sqlite: Database.Database, table: string): string[] {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.map(r => r.name).sort();
}

describe('createTables', () => {
  it('creates all 11 tables on a fresh database', () => {
    const sqlite = new Database(':memory:');
    createTables(sqlite);

    const tables = getTableNames(sqlite);
    expect(tables).toEqual([
      'blueprint_ingredients',
      'blueprints',
      'cargo_runs',
      'inventory',
      'journal_entries',
      'locations',
      'missions',
      'screenshots',
      'sessions',
      'ships',
      'transactions',
    ]);
    sqlite.close();
  });

  it('is idempotent — running twice does not error', () => {
    const sqlite = new Database(':memory:');
    createTables(sqlite);
    expect(() => createTables(sqlite)).not.toThrow();
    sqlite.close();
  });

  it('ships table has wiki_url column', () => {
    const sqlite = new Database(':memory:');
    createTables(sqlite);

    const columns = getColumnNames(sqlite, 'ships');
    expect(columns).toContain('wiki_url');
    sqlite.close();
  });

  it('locations table has coordinate columns', () => {
    const sqlite = new Database(':memory:');
    createTables(sqlite);

    const columns = getColumnNames(sqlite, 'locations');
    expect(columns).toContain('coord_x');
    expect(columns).toContain('coord_x_unit');
    expect(columns).toContain('coord_y');
    expect(columns).toContain('coord_y_unit');
    expect(columns).toContain('coord_z');
    expect(columns).toContain('coord_z_unit');
    sqlite.close();
  });

  it('transactions table has mission_id and cargo_run_id columns', () => {
    const sqlite = new Database(':memory:');
    createTables(sqlite);

    const columns = getColumnNames(sqlite, 'transactions');
    expect(columns).toContain('mission_id');
    expect(columns).toContain('cargo_run_id');
    sqlite.close();
  });

  it('applies migrations to an old schema missing columns', () => {
    const sqlite = new Database(':memory:');

    // Create old ships table without wiki_url
    sqlite.exec(`CREATE TABLE ships (
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
      created_at INTEGER,
      updated_at INTEGER
    )`);

    // Create old transactions table without mission_id/cargo_run_id
    sqlite.exec(`CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      location_id TEXT,
      ship_id TEXT,
      journal_entry_id TEXT,
      created_at INTEGER
    )`);

    // Create old locations table without coordinates or wiki_url
    sqlite.exec(`CREATE TABLE locations (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      services TEXT,
      notes TEXT,
      first_visited_at INTEGER,
      visit_count INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )`);

    // Run createTables which should add missing columns
    createTables(sqlite);

    // Verify migrations applied
    const shipsColumns = getColumnNames(sqlite, 'ships');
    expect(shipsColumns).toContain('wiki_url');

    const txnColumns = getColumnNames(sqlite, 'transactions');
    expect(txnColumns).toContain('mission_id');
    expect(txnColumns).toContain('cargo_run_id');

    const locColumns = getColumnNames(sqlite, 'locations');
    expect(locColumns).toContain('coord_x');
    expect(locColumns).toContain('wiki_url');

    sqlite.close();
  });
});
