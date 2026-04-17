import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  assertShipExists,
  assertLocationExists,
  assertJournalEntryExists,
  assertMissionExists,
  assertCargoRunExists,
  assertBlueprintExists,
  validateFks,
} from './fk-validation';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('individual assertions', () => {
  it('noops when id is null or undefined', () => {
    expect(() => assertShipExists(db, null)).not.toThrow();
    expect(() => assertShipExists(db, undefined)).not.toThrow();
    expect(() => assertLocationExists(db, null)).not.toThrow();
    expect(() => assertJournalEntryExists(db, undefined)).not.toThrow();
  });

  it('passes when the row exists', () => {
    const ship = db.insert(schema.ships).values({ manufacturer: 'RSI', model: 'A' }).returning().get();
    const loc = db.insert(schema.locations).values({ name: 'X' }).returning().get();
    expect(() => assertShipExists(db, ship.id)).not.toThrow();
    expect(() => assertLocationExists(db, loc.id)).not.toThrow();
  });

  it('throws a descriptive error when the row is missing', () => {
    expect(() => assertShipExists(db, 'bogus')).toThrow('Ship not found: bogus');
    expect(() => assertLocationExists(db, 'bogus')).toThrow('Location not found: bogus');
    expect(() => assertJournalEntryExists(db, 'bogus')).toThrow('Journal entry not found: bogus');
    expect(() => assertMissionExists(db, 'bogus')).toThrow('Mission not found: bogus');
    expect(() => assertCargoRunExists(db, 'bogus')).toThrow('Cargo run not found: bogus');
    expect(() => assertBlueprintExists(db, 'bogus')).toThrow('Blueprint not found: bogus');
  });
});

describe('validateFks', () => {
  it('passes when all FK fields are unset', () => {
    expect(() => validateFks(db, {})).not.toThrow();
  });

  it('passes when all referenced rows exist', () => {
    const ship = db.insert(schema.ships).values({ manufacturer: 'RSI', model: 'A' }).returning().get();
    const loc = db.insert(schema.locations).values({ name: 'X' }).returning().get();
    expect(() =>
      validateFks(db, { shipId: ship.id, locationId: loc.id, originLocationId: loc.id })
    ).not.toThrow();
  });

  it('throws on the first missing reference', () => {
    expect(() => validateFks(db, { shipId: 'bogus' })).toThrow('Ship not found');
  });

  it('skips null values (null is a legal unlink)', () => {
    expect(() =>
      validateFks(db, { shipId: null, locationId: null, parentId: null })
    ).not.toThrow();
  });
});
