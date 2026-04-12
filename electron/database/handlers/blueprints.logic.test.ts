import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  findAllBlueprints,
  findBlueprintById,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  getCraftability,
  getCraftabilityForBlueprint,
} from './blueprints.logic';
import { createInventoryItem } from './inventory.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createBlueprint', () => {
  it('creates a blueprint with ingredients', () => {
    const bp = createBlueprint(db, {
      name: 'Plasma Rifle',
      category: 'weapon',
      ingredients: [
        { materialName: 'Quantanium', quantityCscu: 100, minQuality: 500 },
        { materialName: 'Titanium', quantityCscu: 50, minQuality: 0 },
      ],
    });

    expect(bp.name).toBe('Plasma Rifle');
    expect(bp.ingredients).toHaveLength(2);
    expect(bp.ingredients[0].materialName).toBe('Quantanium');
    expect(bp.ingredients[0].minQuality).toBe(500);
    expect(bp.ingredients[1].materialName).toBe('Titanium');
  });

  it('creates a blueprint without ingredients', () => {
    const bp = createBlueprint(db, { name: 'Simple Part' });
    expect(bp.name).toBe('Simple Part');
    expect(bp.ingredients).toHaveLength(0);
  });
});

describe('findAllBlueprints', () => {
  it('returns blueprints ordered by name', () => {
    createBlueprint(db, { name: 'Zeta Shield' });
    createBlueprint(db, { name: 'Alpha Blade' });

    const all = findAllBlueprints(db);
    expect(all).toHaveLength(2);
    expect(all[0].name).toBe('Alpha Blade');
    expect(all[1].name).toBe('Zeta Shield');
  });
});

describe('findBlueprintById', () => {
  it('returns blueprint with ingredients', () => {
    const created = createBlueprint(db, {
      name: 'Test BP',
      ingredients: [{ materialName: 'Gold', quantityCscu: 25 }],
    });

    const found = findBlueprintById(db, created.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Test BP');
    expect(found!.ingredients).toHaveLength(1);
  });

  it('returns null for non-existent id', () => {
    expect(findBlueprintById(db, 'bad-id')).toBeNull();
  });
});

describe('updateBlueprint', () => {
  it('updates blueprint fields', () => {
    const bp = createBlueprint(db, { name: 'Old Name', category: 'weapon' });
    const updated = updateBlueprint(db, bp.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.category).toBe('weapon');
  });

  it('replaces ingredients when provided', () => {
    const bp = createBlueprint(db, {
      name: 'Test',
      ingredients: [
        { materialName: 'Gold', quantityCscu: 10 },
        { materialName: 'Copper', quantityCscu: 20 },
      ],
    });
    expect(bp.ingredients).toHaveLength(2);

    const updated = updateBlueprint(db, bp.id, {
      ingredients: [{ materialName: 'Titanium', quantityCscu: 50 }],
    });
    expect(updated.ingredients).toHaveLength(1);
    expect(updated.ingredients[0].materialName).toBe('Titanium');
  });

  it('throws for non-existent blueprint', () => {
    expect(() => updateBlueprint(db, 'bad-id', { name: 'x' })).toThrow('Blueprint not found');
  });
});

describe('deleteBlueprint', () => {
  it('deletes blueprint and its ingredients', () => {
    const bp = createBlueprint(db, {
      name: 'Doomed BP',
      ingredients: [{ materialName: 'Gold', quantityCscu: 10 }],
    });
    deleteBlueprint(db, bp.id);

    expect(findAllBlueprints(db)).toHaveLength(0);
    const ingredients = db.select().from(schema.blueprintIngredients).all();
    expect(ingredients).toHaveLength(0);
  });
});

describe('getCraftability', () => {
  it('reports canCraft when all ingredients are sufficient', () => {
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 100, quality: 500 });
    createInventoryItem(db, { materialName: 'Titanium', quantityCscu: 200, quality: 300 });

    createBlueprint(db, {
      name: 'Ring',
      ingredients: [
        { materialName: 'Gold', quantityCscu: 50 },
        { materialName: 'Titanium', quantityCscu: 100 },
      ],
    });

    const results = getCraftability(db);
    expect(results).toHaveLength(1);
    expect(results[0].canCraft).toBe(true);
    expect(results[0].craftableCount).toBe(2); // min(100/50, 200/100) = 2
  });

  it('reports canCraft false when missing ingredients', () => {
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 30, quality: 500 });

    createBlueprint(db, {
      name: 'Ring',
      ingredients: [
        { materialName: 'Gold', quantityCscu: 50 },
        { materialName: 'Titanium', quantityCscu: 100 },
      ],
    });

    const results = getCraftability(db);
    expect(results[0].canCraft).toBe(false);
    expect(results[0].craftableCount).toBe(0);
    expect(results[0].ingredients[0].sufficient).toBe(false);
    expect(results[0].ingredients[0].available).toBe(30);
    expect(results[0].ingredients[1].available).toBe(0);
  });

  it('respects minQuality when checking inventory', () => {
    // Low quality gold - should not count for high-quality requirement
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 200, quality: 100 });
    // High quality gold - should count
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 50, quality: 800 });

    createBlueprint(db, {
      name: 'Premium Ring',
      ingredients: [
        { materialName: 'Gold', quantityCscu: 100, minQuality: 500 },
      ],
    });

    const results = getCraftability(db);
    expect(results[0].canCraft).toBe(false);
    // Only the quality-800 stock (50 cSCU) counts, not the quality-100 stock
    expect(results[0].ingredients[0].available).toBe(50);
    expect(results[0].ingredients[0].required).toBe(100);
  });

  it('sums multiple inventory rows for same material above min quality', () => {
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 60, quality: 600 });
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 50, quality: 800 });

    createBlueprint(db, {
      name: 'Ring',
      ingredients: [
        { materialName: 'Gold', quantityCscu: 100, minQuality: 500 },
      ],
    });

    const results = getCraftability(db);
    expect(results[0].canCraft).toBe(true);
    expect(results[0].ingredients[0].available).toBe(110); // 60 + 50
  });

  it('returns craftableCount 0 for blueprint with no ingredients', () => {
    createBlueprint(db, { name: 'Empty' });
    const results = getCraftability(db);
    expect(results[0].canCraft).toBe(false);
    expect(results[0].craftableCount).toBe(0);
  });
});

describe('getCraftabilityForBlueprint', () => {
  it('returns craftability for a specific blueprint', () => {
    createInventoryItem(db, { materialName: 'Gold', quantityCscu: 100, quality: 500 });
    const bp = createBlueprint(db, {
      name: 'Ring',
      ingredients: [{ materialName: 'Gold', quantityCscu: 50 }],
    });

    const result = getCraftabilityForBlueprint(db, bp.id);
    expect(result).not.toBeNull();
    expect(result!.canCraft).toBe(true);
    expect(result!.craftableCount).toBe(2);
  });

  it('returns null for non-existent blueprint', () => {
    expect(getCraftabilityForBlueprint(db, 'bad-id')).toBeNull();
  });
});
