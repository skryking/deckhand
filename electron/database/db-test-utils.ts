import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { createTables } from './create-tables';

export type TestDB = BetterSQLite3Database<typeof schema>;

export function createTestDatabase(): { db: TestDB; sqlite: Database.Database } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  createTables(sqlite);

  const db = drizzle({ client: sqlite, schema });
  return { db, sqlite };
}
