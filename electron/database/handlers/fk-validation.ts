import { eq, sql } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

function exists(db: DB, table: SQLiteTable & { id: unknown }, id: string): boolean {
  const row = db
    .select({ one: sql<number>`1` })
    .from(table)
    .where(eq(table.id as never, id))
    .get();
  return !!row;
}

export function assertShipExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.ships, id)) throw new Error(`Ship not found: ${id}`);
}

export function assertLocationExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.locations, id)) throw new Error(`Location not found: ${id}`);
}

export function assertJournalEntryExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.journalEntries, id)) throw new Error(`Journal entry not found: ${id}`);
}

export function assertMissionExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.missions, id)) throw new Error(`Mission not found: ${id}`);
}

export function assertCargoRunExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.cargoRuns, id)) throw new Error(`Cargo run not found: ${id}`);
}

export function assertBlueprintExists(db: DB, id: string | null | undefined): void {
  if (!id) return;
  if (!exists(db, schema.blueprints, id)) throw new Error(`Blueprint not found: ${id}`);
}

// Common FK field names across the schema. Pass a row payload; each set field
// (non-null, non-undefined) is validated against the corresponding parent table.
// Skips fields that are absent or explicitly null (null is a legal "unlink" value).
type FkFields = {
  shipId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  originLocationId?: string | null;
  destinationLocationId?: string | null;
  journalEntryId?: string | null;
  missionId?: string | null;
  cargoRunId?: string | null;
  blueprintId?: string | null;
};

export function validateFks(db: DB, data: FkFields): void {
  assertShipExists(db, data.shipId);
  assertLocationExists(db, data.locationId);
  assertLocationExists(db, data.parentId);
  assertLocationExists(db, data.originLocationId);
  assertLocationExists(db, data.destinationLocationId);
  assertJournalEntryExists(db, data.journalEntryId);
  assertMissionExists(db, data.missionId);
  assertCargoRunExists(db, data.cargoRunId);
  assertBlueprintExists(db, data.blueprintId);
}
