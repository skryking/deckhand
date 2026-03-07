import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';
import { createTables } from './create-tables';

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqlite: Database.Database | null = null;

export function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  // Use separate database for development to protect production data
  const dbName = process.env.NODE_ENV === 'development' ? 'deckhand-dev.db' : 'deckhand.db';
  return path.join(userDataPath, dbName);
}

export function initializeDatabase(): BetterSQLite3Database<typeof schema> {
  if (db) return db;

  const dbPath = getDbPath();
  console.log(`[Database] Initializing at: ${dbPath}`);

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create better-sqlite3 connection
  sqlite = new Database(dbPath);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');  // Safe with WAL, faster than FULL
  sqlite.pragma('cache_size = -64000');   // 64MB cache
  sqlite.pragma('temp_store = MEMORY');   // Store temp tables in memory

  // Create Drizzle instance with schema
  db = drizzle({ client: sqlite, schema });

  // Create tables if they don't exist (simple migration for now)
  createTables(sqlite);

  console.log('[Database] Initialization complete');
  return db;
}

// Re-export for convenience
export { createTables } from './create-tables';

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    console.log('[Database] Connection closed');
  }
}

// Re-export schema for use in handlers
export { schema };
