import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  createShip,
  findAllShips,
  updateShip,
  deleteShip,
  getShipCurrentLocation,
} from './ships.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createShip', () => {
  it('creates a ship with purchase transaction', () => {
    const ship = createShip(db, {
      manufacturer: 'RSI',
      model: 'Aurora MR',
      acquiredPrice: 25000,
      acquiredAt: new Date(),
    });

    expect(ship.manufacturer).toBe('RSI');
    expect(ship.model).toBe('Aurora MR');

    const txns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.shipId, ship.id), eq(schema.transactions.category, 'purchase')))
      .all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(-25000);
  });

  it('does not create transaction when no price', () => {
    const ship = createShip(db, {
      manufacturer: 'MISC',
      model: 'Freelancer',
    });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.shipId, ship.id)).all();
    expect(txns).toHaveLength(0);
  });

  it('does not create transaction when price is zero', () => {
    const ship = createShip(db, {
      manufacturer: 'MISC',
      model: 'Freelancer',
      acquiredPrice: 0,
    });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.shipId, ship.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('updateShip', () => {
  it('updates purchase transaction when price changes', () => {
    const ship = createShip(db, {
      manufacturer: 'RSI',
      model: 'Aurora MR',
      acquiredPrice: 25000,
      acquiredAt: new Date(),
    });

    updateShip(db, ship.id, { acquiredPrice: 30000 });

    const txns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.shipId, ship.id), eq(schema.transactions.category, 'purchase')))
      .all();
    expect(txns[0].amount).toBe(-30000);
  });

  it('creates purchase transaction when price is added', () => {
    const ship = createShip(db, {
      manufacturer: 'RSI',
      model: 'Aurora MR',
    });

    updateShip(db, ship.id, { acquiredPrice: 25000 });

    const txns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.shipId, ship.id), eq(schema.transactions.category, 'purchase')))
      .all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(-25000);
  });

  it('removes purchase transaction when price is cleared', () => {
    const ship = createShip(db, {
      manufacturer: 'RSI',
      model: 'Aurora MR',
      acquiredPrice: 25000,
      acquiredAt: new Date(),
    });

    updateShip(db, ship.id, { acquiredPrice: 0 });

    const txns = db.select().from(schema.transactions)
      .where(and(eq(schema.transactions.shipId, ship.id), eq(schema.transactions.category, 'purchase')))
      .all();
    expect(txns).toHaveLength(0);
  });

  it('throws when ship not found', () => {
    expect(() => updateShip(db, 'nonexistent', { nickname: 'Ghost' })).toThrow('Ship not found');
  });
});

describe('deleteShip', () => {
  it('deletes ship and purchase transaction', () => {
    const ship = createShip(db, {
      manufacturer: 'RSI',
      model: 'Aurora MR',
      acquiredPrice: 25000,
      acquiredAt: new Date(),
    });

    deleteShip(db, ship.id);

    const remaining = db.select().from(schema.ships).where(eq(schema.ships.id, ship.id)).all();
    expect(remaining).toHaveLength(0);
    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.shipId, ship.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('query operations', () => {
  it('findAll returns all ships', () => {
    createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    createShip(db, { manufacturer: 'MISC', model: 'Freelancer' });

    expect(findAllShips(db)).toHaveLength(2);
  });

});

describe('location tracking', () => {
  it('getCurrentLocation returns most recent location', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const loc1 = db.insert(schema.locations).values({ name: 'Port Olisar' }).returning().get();
    const loc2 = db.insert(schema.locations).values({ name: 'ArcCorp' }).returning().get();

    db.insert(schema.journalEntries).values({
      content: 'Docked at Port Olisar',
      shipId: ship.id,
      locationId: loc1.id,
      timestamp: new Date('2024-01-01'),
    }).run();
    db.insert(schema.journalEntries).values({
      content: 'Arrived at ArcCorp',
      shipId: ship.id,
      locationId: loc2.id,
      timestamp: new Date('2024-01-02'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current).toBeTruthy();
    expect(current!.locationName).toBe('ArcCorp');
  });

  it('returns null for ship with no location entries', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    expect(getShipCurrentLocation(db, ship.id)).toBeNull();
  });
});
