import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import {
  findAllInventory,
  findInventoryById,
  createInventoryItem,
  updateInventoryItem,
  adjustQuantity,
  deleteInventoryItem,
} from './inventory.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createInventoryItem', () => {
  it('creates an inventory item', () => {
    const item = createInventoryItem(db, {
      materialName: 'Quantanium',
      category: 'mineral',
      source: 'mined',
      quantityCscu: 500,
      quality: 800,
    });

    expect(item.materialName).toBe('Quantanium');
    expect(item.quantityCscu).toBe(500);
    expect(item.quality).toBe(800);
    expect(item.category).toBe('mineral');
    expect(item.source).toBe('mined');
  });

  it('allows same mineral with different quality', () => {
    createInventoryItem(db, {
      materialName: 'Quantanium',
      quantityCscu: 200,
      quality: 800,
    });
    const item2 = createInventoryItem(db, {
      materialName: 'Quantanium',
      quantityCscu: 300,
      quality: 400,
    });

    expect(item2.materialName).toBe('Quantanium');
    expect(item2.quality).toBe(400);

    const all = findAllInventory(db);
    expect(all).toHaveLength(2);
  });

  it('rejects duplicate mineral+quality combination', () => {
    createInventoryItem(db, {
      materialName: 'Hadanite',
      quantityCscu: 100,
      quality: 500,
    });

    expect(() => createInventoryItem(db, {
      materialName: 'Hadanite',
      quantityCscu: 200,
      quality: 500,
    })).toThrow();
  });
});

describe('findAllInventory', () => {
  it('returns items ordered by material name then quality', () => {
    createInventoryItem(db, { materialName: 'Quantanium', quantityCscu: 100, quality: 800 });
    createInventoryItem(db, { materialName: 'Hadanite', quantityCscu: 50, quality: 600 });
    createInventoryItem(db, { materialName: 'Hadanite', quantityCscu: 30, quality: 300 });

    const items = findAllInventory(db);
    expect(items).toHaveLength(3);
    expect(items[0].materialName).toBe('Hadanite');
    expect(items[0].quality).toBe(300);
    expect(items[1].materialName).toBe('Hadanite');
    expect(items[1].quality).toBe(600);
    expect(items[2].materialName).toBe('Quantanium');
  });
});

describe('findInventoryById', () => {
  it('returns item by id', () => {
    const created = createInventoryItem(db, { materialName: 'Gold', quantityCscu: 100, quality: 500 });
    const found = findInventoryById(db, created.id);
    expect(found).not.toBeNull();
    expect(found!.materialName).toBe('Gold');
  });

  it('returns null for non-existent id', () => {
    const found = findInventoryById(db, 'non-existent');
    expect(found).toBeNull();
  });
});

describe('updateInventoryItem', () => {
  it('updates fields and sets updatedAt', () => {
    const item = createInventoryItem(db, { materialName: 'Laranite', quantityCscu: 100, quality: 700 });
    const updated = updateInventoryItem(db, item.id, { quantityCscu: 250 });
    expect(updated.quantityCscu).toBe(250);
    expect(updated.materialName).toBe('Laranite');
  });

  it('throws for non-existent item', () => {
    expect(() => updateInventoryItem(db, 'bad-id', { quantityCscu: 100 })).toThrow('Inventory item not found');
  });
});

describe('adjustQuantity', () => {
  it('adds to quantity', () => {
    const item = createInventoryItem(db, { materialName: 'Titanium', quantityCscu: 100, quality: 500 });
    const adjusted = adjustQuantity(db, item.id, 50);
    expect(adjusted.quantityCscu).toBe(150);
  });

  it('subtracts from quantity', () => {
    const item = createInventoryItem(db, { materialName: 'Titanium', quantityCscu: 100, quality: 500 });
    const adjusted = adjustQuantity(db, item.id, -30);
    expect(adjusted.quantityCscu).toBe(70);
  });

  it('throws when result would be negative', () => {
    const item = createInventoryItem(db, { materialName: 'Titanium', quantityCscu: 10, quality: 500 });
    expect(() => adjustQuantity(db, item.id, -20)).toThrow('Quantity cannot be negative');
  });
});

describe('deleteInventoryItem', () => {
  it('deletes an item', () => {
    const item = createInventoryItem(db, { materialName: 'Copper', quantityCscu: 50, quality: 300 });
    deleteInventoryItem(db, item.id);
    expect(findAllInventory(db)).toHaveLength(0);
  });
});
