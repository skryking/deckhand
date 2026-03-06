import { eq, like, or, isNull, and, isNotNull, desc } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllLocations(db: DB) {
  return db.select().from(schema.locations).all();
}

export function findLocationById(db: DB, id: string) {
  const results = db.select().from(schema.locations).where(eq(schema.locations.id, id)).all();
  return results[0] || null;
}

export function findLocationsByParentId(db: DB, parentId: string | null) {
  return parentId
    ? db.select().from(schema.locations).where(eq(schema.locations.parentId, parentId)).all()
    : db.select().from(schema.locations).where(isNull(schema.locations.parentId)).all();
}

export function getFavoriteLocations(db: DB) {
  return db.select().from(schema.locations).where(eq(schema.locations.isFavorite, true)).all();
}

export function createLocation(db: DB, data: typeof schema.locations.$inferInsert) {
  return db.insert(schema.locations).values(data).returning().get();
}

export function updateLocation(db: DB, id: string, data: Partial<typeof schema.locations.$inferInsert>) {
  return db
    .update(schema.locations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.locations.id, id))
    .returning()
    .get();
}

export function deleteLocation(db: DB, id: string) {
  db.delete(schema.locations).where(eq(schema.locations.id, id)).run();
}

export function searchLocations(db: DB, query: string) {
  const searchTerm = `%${query}%`;
  return db
    .select()
    .from(schema.locations)
    .where(
      or(
        like(schema.locations.name, searchTerm),
        like(schema.locations.type, searchTerm)
      )
    )
    .all();
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
    const latestEntry = db
      .select({
        locationId: schema.journalEntries.locationId,
        timestamp: schema.journalEntries.timestamp,
      })
      .from(schema.journalEntries)
      .where(
        and(
          eq(schema.journalEntries.shipId, ship.id),
          isNotNull(schema.journalEntries.locationId)
        )
      )
      .orderBy(desc(schema.journalEntries.timestamp))
      .limit(1)
      .get();

    if (latestEntry && latestEntry.locationId === locationId) {
      shipsAtLocation.push({
        shipId: ship.id,
        shipName: ship.nickname || `${ship.manufacturer} ${ship.model}`,
        manufacturer: ship.manufacturer,
        model: ship.model,
        lastSeenTimestamp: latestEntry.timestamp,
      });
    }
  }

  return shipsAtLocation;
}
