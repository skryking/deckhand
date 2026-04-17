import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  createLocation,
  findLocationById,
  updateLocation,
  deleteLocation,
  incrementVisit,
  getShipsAtLocation,
} from './locations.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('CRUD operations', () => {
  it('creates and retrieves a location', () => {
    const loc = createLocation(db, { name: 'Port Olisar', type: 'station' });
    expect(loc.name).toBe('Port Olisar');

    const found = findLocationById(db, loc.id);
    expect(found).toBeTruthy();
    expect(found!.name).toBe('Port Olisar');
  });

  it('updates a location', () => {
    const loc = createLocation(db, { name: 'Port Olisar', type: 'station' });
    const updated = updateLocation(db, loc.id, { notes: 'Main hub' });
    expect(updated.notes).toBe('Main hub');
  });

  it('deletes a location', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });
    deleteLocation(db, loc.id);
    expect(findLocationById(db, loc.id)).toBeNull();
  });

  it('rejects creating a location with a non-existent parentId', () => {
    expect(() => createLocation(db, { name: 'Child', parentId: 'bogus' })).toThrow('Location not found');
  });

  it('rejects setting parentId to self', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });
    expect(() => updateLocation(db, loc.id, { parentId: loc.id })).toThrow('own parent');
  });

  it('rejects setting parentId to a non-existent location', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });
    expect(() => updateLocation(db, loc.id, { parentId: 'bogus' })).toThrow('Location not found');
  });

  it('rejects a two-node cycle (A becomes child of its own child)', () => {
    const a = createLocation(db, { name: 'A' });
    const b = createLocation(db, { name: 'B', parentId: a.id });
    // B is already A's child; making A a child of B would close the loop.
    expect(() => updateLocation(db, a.id, { parentId: b.id })).toThrow('cycle');
  });

  it('rejects a deeper cycle (ancestor becomes descendant)', () => {
    const a = createLocation(db, { name: 'A' });
    const b = createLocation(db, { name: 'B', parentId: a.id });
    const c = createLocation(db, { name: 'C', parentId: b.id });
    // A → B → C. Making A a child of C would cycle A → C → B → A.
    expect(() => updateLocation(db, a.id, { parentId: c.id })).toThrow('cycle');
  });

  it('allows reparenting that does not create a cycle', () => {
    const a = createLocation(db, { name: 'A' });
    const b = createLocation(db, { name: 'B', parentId: a.id });
    const c = createLocation(db, { name: 'C' }); // unrelated root
    // Moving B under C is a valid reparent.
    const updated = updateLocation(db, b.id, { parentId: c.id });
    expect(updated.parentId).toBe(c.id);
  });

  it('allows clearing parentId (reparent to root)', () => {
    const a = createLocation(db, { name: 'A' });
    const b = createLocation(db, { name: 'B', parentId: a.id });
    const updated = updateLocation(db, b.id, { parentId: null });
    expect(updated.parentId).toBeNull();
  });
});

describe('deleteLocation cascades', () => {
  it('reparents child locations to the grandparent', () => {
    const grandparent = createLocation(db, { name: 'Stanton' });
    const parent = createLocation(db, { name: 'Hurston', parentId: grandparent.id });
    const child = createLocation(db, { name: 'Lorville', parentId: parent.id });

    deleteLocation(db, parent.id);

    const afterChild = findLocationById(db, child.id);
    expect(afterChild!.parentId).toBe(grandparent.id);
  });

  it('makes top-level children roots when deleting a root location', () => {
    const root = createLocation(db, { name: 'Stanton' });
    const child = createLocation(db, { name: 'Hurston', parentId: root.id });

    deleteLocation(db, root.id);

    const afterChild = findLocationById(db, child.id);
    expect(afterChild!.parentId).toBeNull();
  });

  it('nulls locationId on referencing journal, transactions, screenshots, missions, cargo, inventory, blueprints', () => {
    const loc = createLocation(db, { name: 'Lorville' });

    const journal = db.insert(schema.journalEntries).values({
      content: 'Visited', locationId: loc.id, timestamp: new Date(),
    }).returning().get();
    const txn = db.insert(schema.transactions).values({
      amount: 100, category: 'other', locationId: loc.id, timestamp: new Date(),
    }).returning().get();
    const screenshot = db.insert(schema.screenshots).values({
      filePath: '/tmp/x.png', locationId: loc.id,
    }).returning().get();
    const mission = db.insert(schema.missions).values({
      title: 'M', locationId: loc.id,
    }).returning().get();
    const cargoOrigin = db.insert(schema.cargoRuns).values({
      commodity: 'A', quantity: 1, buyPrice: 10, originLocationId: loc.id, startedAt: new Date(),
    }).returning().get();
    const cargoDest = db.insert(schema.cargoRuns).values({
      commodity: 'B', quantity: 1, buyPrice: 10, destinationLocationId: loc.id, startedAt: new Date(),
    }).returning().get();
    const inv = db.insert(schema.inventory).values({
      materialName: 'Ore', quantityCscu: 1, quality: 0, locationId: loc.id,
    }).returning().get();
    const bp = db.insert(schema.blueprints).values({
      name: 'BP', locationId: loc.id,
    }).returning().get();

    deleteLocation(db, loc.id);

    expect(db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, journal.id)).get()!.locationId).toBeNull();
    expect(db.select().from(schema.transactions).where(eq(schema.transactions.id, txn.id)).get()!.locationId).toBeNull();
    expect(db.select().from(schema.screenshots).where(eq(schema.screenshots.id, screenshot.id)).get()!.locationId).toBeNull();
    expect(db.select().from(schema.missions).where(eq(schema.missions.id, mission.id)).get()!.locationId).toBeNull();
    expect(db.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, cargoOrigin.id)).get()!.originLocationId).toBeNull();
    expect(db.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, cargoDest.id)).get()!.destinationLocationId).toBeNull();
    expect(db.select().from(schema.inventory).where(eq(schema.inventory.id, inv.id)).get()!.locationId).toBeNull();
    expect(db.select().from(schema.blueprints).where(eq(schema.blueprints.id, bp.id)).get()!.locationId).toBeNull();
  });
});

describe('incrementVisit', () => {
  it('increments visit count and sets firstVisitedAt on first visit', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });
    expect(loc.visitCount).toBe(0);

    const visited = incrementVisit(db, loc.id);
    expect(visited!.visitCount).toBe(1);
    expect(visited!.firstVisitedAt).toBeTruthy();
  });

  it('increments count without changing firstVisitedAt on subsequent visits', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });

    const first = incrementVisit(db, loc.id);
    const firstVisitedAt = first!.firstVisitedAt;

    const second = incrementVisit(db, loc.id);
    expect(second!.visitCount).toBe(2);
    expect(second!.firstVisitedAt!.getTime()).toBe(firstVisitedAt!.getTime());
  });

  it('returns null for non-existent location', () => {
    expect(incrementVisit(db, 'nonexistent')).toBeNull();
  });
});

describe('getShipsAtLocation', () => {
  it('returns ships whose latest journal entry is at the given location', () => {
    const loc = createLocation(db, { name: 'Port Olisar' });
    const otherLoc = createLocation(db, { name: 'ArcCorp' });

    const ship1 = db.insert(schema.ships).values({ manufacturer: 'RSI', model: 'Aurora' }).returning().get();
    const ship2 = db.insert(schema.ships).values({ manufacturer: 'MISC', model: 'Freelancer' }).returning().get();

    // Ship 1: last seen at Port Olisar
    db.insert(schema.journalEntries).values({
      content: 'At Port Olisar',
      shipId: ship1.id,
      locationId: loc.id,
      timestamp: new Date('2024-01-02'),
    }).run();

    // Ship 2: was at Port Olisar, then moved to ArcCorp
    db.insert(schema.journalEntries).values({
      content: 'At Port Olisar',
      shipId: ship2.id,
      locationId: loc.id,
      timestamp: new Date('2024-01-01'),
    }).run();
    db.insert(schema.journalEntries).values({
      content: 'At ArcCorp',
      shipId: ship2.id,
      locationId: otherLoc.id,
      timestamp: new Date('2024-01-02'),
    }).run();

    const ships = getShipsAtLocation(db, loc.id);
    expect(ships).toHaveLength(1);
    expect(ships[0].shipId).toBe(ship1.id);
    expect(ships[0].model).toBe('Aurora');
  });

  it('returns empty array when no ships at location', () => {
    const loc = createLocation(db, { name: 'Empty Station' });
    expect(getShipsAtLocation(db, loc.id)).toHaveLength(0);
  });

  it('finds ship whose latest event is a completed cargo run destination', () => {
    const origin = createLocation(db, { name: 'Area18' });
    const dest = createLocation(db, { name: 'Lorville' });
    const ship = db.insert(schema.ships).values({ manufacturer: 'RSI', model: 'Aurora' }).returning().get();

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

    const ships = getShipsAtLocation(db, dest.id);
    expect(ships).toHaveLength(1);
    expect(ships[0].shipId).toBe(ship.id);
  });

  it('finds ship whose latest event is a completed mission', () => {
    const loc = createLocation(db, { name: 'Grim Hex' });
    const ship = db.insert(schema.ships).values({ manufacturer: 'RSI', model: 'Aurora' }).returning().get();

    db.insert(schema.missions).values({
      title: 'Bounty',
      status: 'completed',
      shipId: ship.id,
      locationId: loc.id,
      acceptedAt: new Date('2024-06-01'),
      completedAt: new Date('2024-06-02'),
    }).run();

    const ships = getShipsAtLocation(db, loc.id);
    expect(ships).toHaveLength(1);
    expect(ships[0].shipId).toBe(ship.id);
  });
});
