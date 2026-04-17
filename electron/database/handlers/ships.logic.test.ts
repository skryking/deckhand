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

  it('includes transactions as a source', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const loc = db.insert(schema.locations).values({ name: 'Port Olisar' }).returning().get();

    db.insert(schema.transactions).values({
      timestamp: new Date('2024-06-01'),
      amount: -100,
      category: 'fuel',
      shipId: ship.id,
      locationId: loc.id,
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Port Olisar');
  });

  it('includes completed cargo run destination', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const origin = db.insert(schema.locations).values({ name: 'Area18' }).returning().get();
    const dest = db.insert(schema.locations).values({ name: 'Lorville' }).returning().get();

    db.insert(schema.cargoRuns).values({
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      shipId: ship.id,
      originLocationId: origin.id,
      destinationLocationId: dest.id,
      startedAt: new Date('2024-06-01'),
      completedAt: new Date('2024-06-02'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Lorville');
  });

  it('includes cargo run origin at startedAt even while in progress', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const origin = db.insert(schema.locations).values({ name: 'Area18' }).returning().get();

    db.insert(schema.cargoRuns).values({
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      status: 'in_progress',
      shipId: ship.id,
      originLocationId: origin.id,
      startedAt: new Date('2024-06-01'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Area18');
  });

  it('ignores unfinished cargo destination (no completedAt yet)', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const origin = db.insert(schema.locations).values({ name: 'Area18' }).returning().get();
    const dest = db.insert(schema.locations).values({ name: 'Lorville' }).returning().get();

    db.insert(schema.cargoRuns).values({
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      status: 'in_progress',
      shipId: ship.id,
      originLocationId: origin.id,
      destinationLocationId: dest.id,
      startedAt: new Date('2024-06-01'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    // Ship is at origin until the run completes
    expect(current!.locationName).toBe('Area18');
  });

  it('includes completed mission location', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const loc = db.insert(schema.locations).values({ name: 'Grim Hex' }).returning().get();

    db.insert(schema.missions).values({
      title: 'Bounty',
      status: 'completed',
      shipId: ship.id,
      locationId: loc.id,
      acceptedAt: new Date('2024-06-01'),
      completedAt: new Date('2024-06-02'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Grim Hex');
  });

  it('ignores active missions (only completed ones contribute)', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const missionLoc = db.insert(schema.locations).values({ name: 'Grim Hex' }).returning().get();
    const journalLoc = db.insert(schema.locations).values({ name: 'Port Olisar' }).returning().get();

    db.insert(schema.missions).values({
      title: 'Bounty',
      status: 'active',
      shipId: ship.id,
      locationId: missionLoc.id,
      acceptedAt: new Date('2024-06-05'),
    }).run();
    db.insert(schema.journalEntries).values({
      content: 'Docked',
      shipId: ship.id,
      locationId: journalLoc.id,
      timestamp: new Date('2024-06-01'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Port Olisar');
  });

  it('latest event across all sources wins', () => {
    const ship = createShip(db, { manufacturer: 'RSI', model: 'Aurora MR' });
    const journalLoc = db.insert(schema.locations).values({ name: 'Port Olisar' }).returning().get();
    const cargoDest = db.insert(schema.locations).values({ name: 'Lorville' }).returning().get();
    const missionLoc = db.insert(schema.locations).values({ name: 'Grim Hex' }).returning().get();

    db.insert(schema.journalEntries).values({
      content: 'Docked',
      shipId: ship.id,
      locationId: journalLoc.id,
      timestamp: new Date('2024-06-01'),
    }).run();
    db.insert(schema.cargoRuns).values({
      commodity: 'Laranite',
      quantity: 10,
      buyPrice: 100,
      sellPrice: 150,
      status: 'completed',
      shipId: ship.id,
      destinationLocationId: cargoDest.id,
      startedAt: new Date('2024-06-02'),
      completedAt: new Date('2024-06-03'),
    }).run();
    db.insert(schema.missions).values({
      title: 'Bounty',
      status: 'completed',
      shipId: ship.id,
      locationId: missionLoc.id,
      acceptedAt: new Date('2024-06-04'),
      completedAt: new Date('2024-06-05'),
    }).run();

    const current = getShipCurrentLocation(db, ship.id);
    expect(current!.locationName).toBe('Grim Hex');
    expect(current!.timestamp).toBeInstanceOf(Date);
    expect(current!.timestamp.getTime()).toBe(new Date('2024-06-05').getTime());
  });
});
