import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';
import { getShipLocation } from './ships.logic';
import { validateFks } from './fk-validation';

type DB = TestDB;

export function findAllLocations(db: DB) {
  return db.select().from(schema.locations).all();
}

export function findLocationById(db: DB, id: string) {
  const results = db.select().from(schema.locations).where(eq(schema.locations.id, id)).all();
  return results[0] || null;
}

export function createLocation(db: DB, data: typeof schema.locations.$inferInsert) {
  validateFks(db, { parentId: data.parentId });
  return db.insert(schema.locations).values(data).returning().get();
}

export function updateLocation(db: DB, id: string, data: Partial<typeof schema.locations.$inferInsert>) {
  if (data.parentId !== undefined && data.parentId !== null) {
    if (data.parentId === id) throw new Error('Location cannot be its own parent');
    validateFks(db, { parentId: data.parentId });
    if (wouldCreateCycle(db, id, data.parentId)) {
      throw new Error('Cannot set parentId: would create a cycle in the location hierarchy');
    }
  }
  return db
    .update(schema.locations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.locations.id, id))
    .returning()
    .get();
}

// Walks up the ancestor chain from newParentId. If the target `id` appears in
// that chain, assigning it as parent would close a loop. Guards against a
// pre-existing cycle in the DB by tracking visited nodes.
function wouldCreateCycle(db: DB, id: string, newParentId: string): boolean {
  const visited = new Set<string>();
  let cursor: string | null = newParentId;
  while (cursor) {
    if (cursor === id) return true;
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    const row = db
      .select({ parentId: schema.locations.parentId })
      .from(schema.locations)
      .where(eq(schema.locations.id, cursor))
      .get();
    cursor = row?.parentId ?? null;
  }
  return false;
}

export function deleteLocation(db: DB, id: string) {
  db.transaction((tx) => {
    const location = tx.select().from(schema.locations).where(eq(schema.locations.id, id)).get();
    if (!location) return;

    // Reparent child locations to the deleted location's own parent (keeps the
    // hierarchy intact — children don't get orphaned or cascade-deleted).
    tx.update(schema.locations)
      .set({ parentId: location.parentId ?? null })
      .where(eq(schema.locations.parentId, id))
      .run();

    // Null out locationId references across every table that points here.
    tx.update(schema.journalEntries).set({ locationId: null }).where(eq(schema.journalEntries.locationId, id)).run();
    tx.update(schema.transactions).set({ locationId: null }).where(eq(schema.transactions.locationId, id)).run();
    tx.update(schema.screenshots).set({ locationId: null }).where(eq(schema.screenshots.locationId, id)).run();
    tx.update(schema.missions).set({ locationId: null }).where(eq(schema.missions.locationId, id)).run();
    tx.update(schema.cargoRuns).set({ originLocationId: null }).where(eq(schema.cargoRuns.originLocationId, id)).run();
    tx.update(schema.cargoRuns).set({ destinationLocationId: null }).where(eq(schema.cargoRuns.destinationLocationId, id)).run();
    tx.update(schema.inventory).set({ locationId: null }).where(eq(schema.inventory.locationId, id)).run();
    tx.update(schema.blueprints).set({ locationId: null }).where(eq(schema.blueprints.locationId, id)).run();

    tx.delete(schema.locations).where(eq(schema.locations.id, id)).run();
  });
}

export function incrementVisit(db: DB, id: string) {
  const location = db.select().from(schema.locations).where(eq(schema.locations.id, id)).get();
  if (!location) return null;

  return db
    .update(schema.locations)
    .set({
      visitCount: (location.visitCount || 0) + 1,
      firstVisitedAt: location.firstVisitedAt || new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.locations.id, id))
    .returning()
    .get();
}

export function getShipsAtLocation(db: DB, locationId: string) {
  const allShips = db.select().from(schema.ships).all();
  const shipsAtLocation = [];

  for (const ship of allShips) {
    const current = getShipLocation(db, ship.id);
    if (current && current.locationId === locationId) {
      shipsAtLocation.push({
        shipId: ship.id,
        shipName: ship.nickname || `${ship.manufacturer} ${ship.model}`,
        manufacturer: ship.manufacturer,
        model: ship.model,
        lastSeenTimestamp: current.timestamp,
      });
    }
  }

  return shipsAtLocation;
}
