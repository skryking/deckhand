import { eq, like, or, and, isNotNull, desc } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllShips(db: DB) {
  return db.select().from(schema.ships).all();
}

export function findShipById(db: DB, id: string) {
  const results = db.select().from(schema.ships).where(eq(schema.ships.id, id)).all();
  return results[0] || null;
}

export function createShip(db: DB, data: typeof schema.ships.$inferInsert) {
  return db.transaction((tx) => {
    const newShip = tx.insert(schema.ships).values(data).returning().get();

    if (newShip.acquiredPrice != null && newShip.acquiredPrice > 0) {
      tx.insert(schema.transactions).values({
        timestamp: newShip.acquiredAt ?? new Date(),
        amount: -newShip.acquiredPrice,
        category: 'purchase',
        description: `Ship purchase: ${newShip.manufacturer} ${newShip.model}`,
        shipId: newShip.id,
      }).run();
    }

    return newShip;
  });
}

export function updateShip(db: DB, id: string, data: Partial<typeof schema.ships.$inferInsert>) {
  return db.transaction((tx) => {
    const current = tx.select().from(schema.ships).where(eq(schema.ships.id, id)).get();
    if (!current) throw new Error('Ship not found');

    const updated = tx
      .update(schema.ships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.ships.id, id))
      .returning()
      .get();

    const existingTxn = tx.select().from(schema.transactions)
      .where(and(eq(schema.transactions.shipId, id), eq(schema.transactions.category, 'purchase')))
      .get();

    if (updated.acquiredPrice != null && updated.acquiredPrice > 0) {
      if (existingTxn) {
        tx.update(schema.transactions)
          .set({
            amount: -updated.acquiredPrice,
            description: `Ship purchase: ${updated.manufacturer} ${updated.model}`,
            timestamp: updated.acquiredAt ?? existingTxn.timestamp,
          })
          .where(eq(schema.transactions.id, existingTxn.id))
          .run();
      } else {
        tx.insert(schema.transactions).values({
          timestamp: updated.acquiredAt ?? new Date(),
          amount: -updated.acquiredPrice,
          category: 'purchase',
          description: `Ship purchase: ${updated.manufacturer} ${updated.model}`,
          shipId: id,
        }).run();
      }
    } else if (existingTxn) {
      tx.delete(schema.transactions)
        .where(eq(schema.transactions.id, existingTxn.id))
        .run();
    }

    return updated;
  });
}

export function deleteShip(db: DB, id: string) {
  db.transaction((tx) => {
    tx.delete(schema.transactions)
      .where(and(eq(schema.transactions.shipId, id), eq(schema.transactions.category, 'purchase')))
      .run();
    tx.delete(schema.ships).where(eq(schema.ships.id, id)).run();
  });
}

export function searchShips(db: DB, query: string) {
  const escaped = query.replace(/[%_]/g, '\\$&');
  const searchTerm = `%${escaped}%`;
  return db
    .select()
    .from(schema.ships)
    .where(
      or(
        like(schema.ships.model, searchTerm),
        like(schema.ships.manufacturer, searchTerm),
        like(schema.ships.nickname, searchTerm)
      )
    )
    .all();
}

export function getShipCurrentLocation(db: DB, shipId: string) {
  const result = db
    .select({
      locationId: schema.journalEntries.locationId,
      locationName: schema.locations.name,
      timestamp: schema.journalEntries.timestamp,
    })
    .from(schema.journalEntries)
    .innerJoin(schema.locations, eq(schema.journalEntries.locationId, schema.locations.id))
    .where(
      and(
        eq(schema.journalEntries.shipId, shipId),
        isNotNull(schema.journalEntries.locationId)
      )
    )
    .orderBy(desc(schema.journalEntries.timestamp))
    .limit(1)
    .get();
  return result || null;
}

export function getShipLocationHistory(db: DB, shipId: string) {
  return db
    .select({
      locationId: schema.journalEntries.locationId,
      locationName: schema.locations.name,
      timestamp: schema.journalEntries.timestamp,
      entryId: schema.journalEntries.id,
      entryTitle: schema.journalEntries.title,
    })
    .from(schema.journalEntries)
    .innerJoin(schema.locations, eq(schema.journalEntries.locationId, schema.locations.id))
    .where(
      and(
        eq(schema.journalEntries.shipId, shipId),
        isNotNull(schema.journalEntries.locationId)
      )
    )
    .orderBy(desc(schema.journalEntries.timestamp))
    .all();
}
