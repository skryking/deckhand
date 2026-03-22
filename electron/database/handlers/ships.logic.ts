import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllShips(db: DB) {
  return db.select().from(schema.ships).all();
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

export function getShipCurrentLocation(db: DB, shipId: string) {
  // Check both journal entries and transactions for the most recent location
  const result = db.all(sql`
    SELECT location_id AS locationId, name AS locationName, timestamp
    FROM (
      SELECT je.location_id, l.name, je.timestamp
      FROM journal_entries je
      INNER JOIN locations l ON je.location_id = l.id
      WHERE je.ship_id = ${shipId} AND je.location_id IS NOT NULL
      UNION ALL
      SELECT t.location_id, l.name, t.timestamp
      FROM transactions t
      INNER JOIN locations l ON t.location_id = l.id
      WHERE t.ship_id = ${shipId} AND t.location_id IS NOT NULL
    )
    ORDER BY timestamp DESC
    LIMIT 1
  `);
  return result.length > 0 ? result[0] as { locationId: string; locationName: string; timestamp: Date } : null;
}

