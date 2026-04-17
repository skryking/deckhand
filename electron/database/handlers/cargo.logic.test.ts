import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and, lt, gte } from 'drizzle-orm';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  createCargoRun,
  findAllCargoRuns,
  updateCargoRun,
  completeCargoRun,
  deleteCargoRun,
} from './cargo.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createCargoRun', () => {
  it('creates a cargo run and buy transaction', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    expect(run.commodity).toBe('Laranite');
    expect(run.quantity).toBe(10);

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.cargoRunId, run.id)).all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(-1000); // -(100 * 10)
    expect(txns[0].category).toBe('cargo');
  });

  it('skips buy transaction when buyPrice is zero', () => {
    const run = createCargoRun(db, {
      commodity: 'Scrap',
      quantity: 5,
      buyPrice: 0,
      startedAt: new Date(),
    });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.cargoRunId, run.id)).all();
    expect(txns).toHaveLength(0);
  });

  it('creates both buy and sell transactions when created as completed', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    expect(run.status).toBe('completed');

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.cargoRunId, run.id)).all();
    expect(txns).toHaveLength(2);

    const buyTxn = txns.find(t => t.amount < 0);
    const sellTxn = txns.find(t => t.amount >= 0);
    expect(buyTxn!.amount).toBe(-1000);
    expect(sellTxn!.amount).toBe(1500);
  });
});

describe('completeCargoRun', () => {
  it('creates sell transaction and calculates profit', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    const completed = completeCargoRun(db, run.id, 150);
    expect(completed.status).toBe('completed');
    expect(completed.profit).toBe(500); // (150-100) * 10

    const sellTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), gte(schema.transactions.amount, 0)))
      .all();
    expect(sellTxns).toHaveLength(1);
    expect(sellTxns[0].amount).toBe(1500);
  });

  it('is idempotent — does not create duplicate sell transaction', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    completeCargoRun(db, run.id, 150);
    completeCargoRun(db, run.id, 150);

    const sellTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), gte(schema.transactions.amount, 0)))
      .all();
    expect(sellTxns).toHaveLength(1);
  });

  it('throws when cargo run not found', () => {
    expect(() => completeCargoRun(db, 'nonexistent', 100)).toThrow('Cargo run not found');
  });
});

describe('updateCargoRun', () => {
  it('updates buy transaction when buyPrice changes', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    updateCargoRun(db, run.id, { buyPrice: 200 });

    const buyTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), lt(schema.transactions.amount, 0)))
      .all();
    expect(buyTxns[0].amount).toBe(-2000);
  });

  it('updates buy transaction when quantity changes', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    updateCargoRun(db, run.id, { quantity: 20 });

    const buyTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), lt(schema.transactions.amount, 0)))
      .all();
    expect(buyTxns[0].amount).toBe(-2000);
  });

  it('creates sell transaction when status changes to completed', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    updateCargoRun(db, run.id, {
      status: 'completed',
      sellPrice: 150,
      completedAt: new Date(),
    });

    const sellTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), gte(schema.transactions.amount, 0)))
      .all();
    expect(sellTxns).toHaveLength(1);
    expect(sellTxns[0].amount).toBe(1500);
  });

  it('removes sell transaction when status moves away from completed', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    updateCargoRun(db, run.id, { status: 'in_progress' });

    const sellTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), gte(schema.transactions.amount, 0)))
      .all();
    expect(sellTxns).toHaveLength(0);
  });

  it('updates sell transaction amount when sellPrice changes while completed', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    updateCargoRun(db, run.id, { sellPrice: 200 });

    const sellTxns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.cargoRunId, run.id), gte(schema.transactions.amount, 0)))
      .all();
    expect(sellTxns[0].amount).toBe(2000);
  });

  it('throws when cargo run not found', () => {
    expect(() => updateCargoRun(db, 'nonexistent', { buyPrice: 200 })).toThrow('Cargo run not found');
  });
});

describe('FK validation', () => {
  it('rejects createCargoRun with a non-existent shipId', () => {
    expect(() => createCargoRun(db, {
      commodity: 'X', quantity: 1, buyPrice: 10, shipId: 'bogus', startedAt: new Date(),
    })).toThrow('Ship not found');
  });

  it('rejects createCargoRun with a non-existent originLocationId', () => {
    expect(() => createCargoRun(db, {
      commodity: 'X', quantity: 1, buyPrice: 10, originLocationId: 'bogus', startedAt: new Date(),
    })).toThrow('Location not found');
  });

  it('rejects updateCargoRun with a non-existent destinationLocationId', () => {
    const run = createCargoRun(db, {
      commodity: 'X', quantity: 1, buyPrice: 10, startedAt: new Date(),
    });
    expect(() => updateCargoRun(db, run.id, { destinationLocationId: 'bogus' }))
      .toThrow('Location not found');
  });
});

describe('deleteCargoRun', () => {
  it('deletes cargo run and associated transactions', () => {
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      startedAt: new Date(),
    });

    deleteCargoRun(db, run.id);

    const runs = findAllCargoRuns(db);
    expect(runs.find(r => r.id === run.id)).toBeUndefined();
    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.cargoRunId, run.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('location visit tracking', () => {
  function seedLocation(name: string) {
    return db.insert(schema.locations).values({ name }).returning().get();
  }
  function seedShip() {
    return db
      .insert(schema.ships)
      .values({ manufacturer: 'Drake', model: 'Cutlass Black' })
      .returning()
      .get();
  }

  it('bumps origin and destination visits when completeCargoRun runs with ship+locations', () => {
    const origin = seedLocation('Area18');
    const dest = seedLocation('Lorville');
    const ship = seedShip();

    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      shipId: ship.id,
      originLocationId: origin.id,
      destinationLocationId: dest.id,
      startedAt: new Date(),
    });

    completeCargoRun(db, run.id, 150);

    const originAfter = db.select().from(schema.locations).where(eq(schema.locations.id, origin.id)).get()!;
    const destAfter = db.select().from(schema.locations).where(eq(schema.locations.id, dest.id)).get()!;
    expect(originAfter.visitCount).toBe(1);
    expect(destAfter.visitCount).toBe(1);
    expect(originAfter.firstVisitedAt).toBeTruthy();
    expect(destAfter.firstVisitedAt).toBeTruthy();
  });

  it('does not bump visits when ship is missing', () => {
    const dest = seedLocation('Lorville');
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      destinationLocationId: dest.id,
      startedAt: new Date(),
    });

    completeCargoRun(db, run.id, 150);

    const destAfter = db.select().from(schema.locations).where(eq(schema.locations.id, dest.id)).get()!;
    expect(destAfter.visitCount).toBe(0);
  });

  it('completeCargoRun is idempotent for visit count', () => {
    const origin = seedLocation('Area18');
    const ship = seedShip();
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      shipId: ship.id,
      originLocationId: origin.id,
      startedAt: new Date(),
    });

    completeCargoRun(db, run.id, 150);
    completeCargoRun(db, run.id, 150);

    const originAfter = db.select().from(schema.locations).where(eq(schema.locations.id, origin.id)).get()!;
    expect(originAfter.visitCount).toBe(1);
  });

  it('updateCargoRun bumps visits on transition to completed', () => {
    const dest = seedLocation('Lorville');
    const ship = seedShip();
    const run = createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      shipId: ship.id,
      destinationLocationId: dest.id,
      startedAt: new Date(),
    });

    updateCargoRun(db, run.id, { status: 'completed', sellPrice: 150, completedAt: new Date() });

    const destAfter = db.select().from(schema.locations).where(eq(schema.locations.id, dest.id)).get()!;
    expect(destAfter.visitCount).toBe(1);
  });

  it('createCargoRun bumps visits when created as completed', () => {
    const origin = seedLocation('Area18');
    const dest = seedLocation('Lorville');
    const ship = seedShip();

    createCargoRun(db, {
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      shipId: ship.id,
      originLocationId: origin.id,
      destinationLocationId: dest.id,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const originAfter = db.select().from(schema.locations).where(eq(schema.locations.id, origin.id)).get()!;
    const destAfter = db.select().from(schema.locations).where(eq(schema.locations.id, dest.id)).get()!;
    expect(originAfter.visitCount).toBe(1);
    expect(destAfter.visitCount).toBe(1);
  });
});

describe('query operations', () => {
  it('findAll returns all cargo runs', () => {
    createCargoRun(db, { commodity: 'A', quantity: 1, buyPrice: 10, startedAt: new Date() });
    createCargoRun(db, { commodity: 'B', quantity: 2, buyPrice: 20, startedAt: new Date() });

    const all = findAllCargoRuns(db);
    expect(all).toHaveLength(2);
  });
});
