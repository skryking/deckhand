import { eq, and, lt, gte, desc } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllCargoRuns(db: DB, options?: { limit?: number; offset?: number }) {
  let query = db.select().from(schema.cargoRuns).orderBy(desc(schema.cargoRuns.startedAt));
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }
  return query.all();
}

export function createCargoRun(db: DB, data: typeof schema.cargoRuns.$inferInsert) {
  return db.transaction((tx) => {
    const newRun = tx.insert(schema.cargoRuns).values(data).returning().get();

    // Create buy expense transaction
    const buyTotal = newRun.buyPrice * newRun.quantity;
    if (buyTotal > 0) {
      tx.insert(schema.transactions).values({
        timestamp: newRun.startedAt,
        amount: -buyTotal,
        category: 'cargo',
        description: `Cargo purchase: ${newRun.quantity} SCU of ${newRun.commodity}`,
        locationId: newRun.originLocationId,
        shipId: newRun.shipId,
        cargoRunId: newRun.id,
      }).run();
    }

    // If created already completed (with sellPrice), also create sell transaction
    if (newRun.status === 'completed' && newRun.sellPrice != null) {
      const sellTotal = newRun.sellPrice * newRun.quantity;
      tx.insert(schema.transactions).values({
        timestamp: newRun.completedAt ?? new Date(),
        amount: sellTotal,
        category: 'cargo',
        description: `Cargo sale: ${newRun.quantity} SCU of ${newRun.commodity}`,
        locationId: newRun.destinationLocationId,
        shipId: newRun.shipId,
        cargoRunId: newRun.id,
      }).run();
    }

    return newRun;
  });
}

export function updateCargoRun(db: DB, id: string, data: Partial<typeof schema.cargoRuns.$inferInsert>) {
  return db.transaction((tx) => {
    const current = tx.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).get();
    if (!current) throw new Error('Cargo run not found');

    const updated = tx
      .update(schema.cargoRuns)
      .set(data)
      .where(eq(schema.cargoRuns.id, id))
      .returning()
      .get();

    // Update buy transaction if buyPrice or quantity changed
    const oldBuyTotal = current.buyPrice * current.quantity;
    const newBuyTotal = updated.buyPrice * updated.quantity;
    if (oldBuyTotal !== newBuyTotal) {
      const existingBuyTxn = tx.select().from(schema.transactions)
        .where(and(eq(schema.transactions.cargoRunId, id), lt(schema.transactions.amount, 0)))
        .get();
      if (existingBuyTxn) {
        tx.update(schema.transactions)
          .set({
            amount: -newBuyTotal,
            description: `Cargo purchase: ${updated.quantity} SCU of ${updated.commodity}`,
            locationId: updated.originLocationId,
            shipId: updated.shipId,
          })
          .where(eq(schema.transactions.id, existingBuyTxn.id))
          .run();
      }
    }

    // Handle status transitions for sell transaction
    const wasCompleted = current.status === 'completed';
    const isNowCompleted = updated.status === 'completed';

    if (isNowCompleted && updated.sellPrice != null) {
      const existingSellTxn = tx.select().from(schema.transactions)
        .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
        .get();

      const sellTotal = updated.sellPrice * updated.quantity;

      if (existingSellTxn) {
        tx.update(schema.transactions)
          .set({
            amount: sellTotal,
            description: `Cargo sale: ${updated.quantity} SCU of ${updated.commodity}`,
            locationId: updated.destinationLocationId,
            shipId: updated.shipId,
          })
          .where(eq(schema.transactions.id, existingSellTxn.id))
          .run();
      } else {
        tx.insert(schema.transactions).values({
          timestamp: updated.completedAt ?? new Date(),
          amount: sellTotal,
          category: 'cargo',
          description: `Cargo sale: ${updated.quantity} SCU of ${updated.commodity}`,
          locationId: updated.destinationLocationId,
          shipId: updated.shipId,
          cargoRunId: id,
        }).run();
      }
    } else if (wasCompleted && !isNowCompleted) {
      tx.delete(schema.transactions)
        .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
        .run();
    }

    return updated;
  });
}

export function completeCargoRun(db: DB, id: string, sellPrice: number) {
  return db.transaction((tx) => {
    const cargoRun = tx.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).get();
    if (!cargoRun) throw new Error('Cargo run not found');

    const profit = (sellPrice * cargoRun.quantity) - (cargoRun.buyPrice * cargoRun.quantity);
    const completedAt = new Date();

    const updated = tx
      .update(schema.cargoRuns)
      .set({ sellPrice, profit, completedAt, status: 'completed' })
      .where(eq(schema.cargoRuns.id, id))
      .returning()
      .get();

    // Create sell income transaction (only if one doesn't already exist)
    const existingSellTxn = tx.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
      .get();

    if (!existingSellTxn) {
      const sellTotal = sellPrice * cargoRun.quantity;
      tx.insert(schema.transactions).values({
        timestamp: completedAt,
        amount: sellTotal,
        category: 'cargo',
        description: `Cargo sale: ${cargoRun.quantity} SCU of ${cargoRun.commodity}`,
        locationId: cargoRun.destinationLocationId,
        shipId: cargoRun.shipId,
        cargoRunId: id,
      }).run();
    }

    return updated;
  });
}

export function deleteCargoRun(db: DB, id: string) {
  db.transaction((tx) => {
    tx.delete(schema.transactions).where(eq(schema.transactions.cargoRunId, id)).run();
    tx.delete(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).run();
  });
}

