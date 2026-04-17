import { describe, it, expect, beforeEach } from 'vitest';
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
