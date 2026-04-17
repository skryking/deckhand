import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';
import { getShipLocation } from './ships.logic';

type DB = TestDB;

export function findAllLocations(db: DB) {
  return db.select().from(schema.locations).all();
}

export function findLocationById(db: DB, id: string) {
  const results = db.select().from(schema.locations).where(eq(schema.locations.id, id)).all();
  return results[0] || null;
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
