import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';
import type { BlueprintCraftability, IngredientStatus } from '../../../src/types/database';

type DB = TestDB;

export function findAllBlueprints(db: DB) {
  return db.select().from(schema.blueprints)
    .orderBy(schema.blueprints.name)
    .all();
}

export function findBlueprintById(db: DB, id: string) {
  const blueprint = db.select().from(schema.blueprints)
    .where(eq(schema.blueprints.id, id))
    .get();
  if (!blueprint) return null;

  const ingredients = db.select().from(schema.blueprintIngredients)
    .where(eq(schema.blueprintIngredients.blueprintId, id))
    .all();

  return { ...blueprint, ingredients };
}

export function createBlueprint(
  db: DB,
  data: typeof schema.blueprints.$inferInsert & {
    ingredients?: Omit<typeof schema.blueprintIngredients.$inferInsert, 'blueprintId'>[];
  }
) {
  return db.transaction((tx) => {
    const { ingredients, ...blueprintData } = data;
    const blueprint = tx.insert(schema.blueprints).values(blueprintData).returning().get();

    if (ingredients?.length) {
      for (const ing of ingredients) {
        tx.insert(schema.blueprintIngredients).values({
          ...ing,
          blueprintId: blueprint.id,
        }).run();
      }
    }

    const savedIngredients = tx.select().from(schema.blueprintIngredients)
      .where(eq(schema.blueprintIngredients.blueprintId, blueprint.id))
      .all();

    return { ...blueprint, ingredients: savedIngredients };
  });
}

export function updateBlueprint(
  db: DB,
  id: string,
  data: Partial<typeof schema.blueprints.$inferInsert> & {
    ingredients?: Omit<typeof schema.blueprintIngredients.$inferInsert, 'blueprintId'>[];
  }
) {
  return db.transaction((tx) => {
    const existing = tx.select().from(schema.blueprints).where(eq(schema.blueprints.id, id)).get();
    if (!existing) throw new Error('Blueprint not found');

    const { ingredients, ...blueprintData } = data;

    const blueprint = tx.update(schema.blueprints)
      .set({ ...blueprintData, updatedAt: new Date() })
      .where(eq(schema.blueprints.id, id))
      .returning()
      .get();

    if (ingredients !== undefined) {
      // Replace all ingredients
      tx.delete(schema.blueprintIngredients)
        .where(eq(schema.blueprintIngredients.blueprintId, id))
        .run();

      for (const ing of ingredients) {
        tx.insert(schema.blueprintIngredients).values({
          ...ing,
          blueprintId: id,
        }).run();
      }
    }

    const savedIngredients = tx.select().from(schema.blueprintIngredients)
      .where(eq(schema.blueprintIngredients.blueprintId, id))
      .all();

    return { ...blueprint, ingredients: savedIngredients };
  });
}

export function deleteBlueprint(db: DB, id: string) {
  db.transaction((tx) => {
    tx.delete(schema.blueprintIngredients)
      .where(eq(schema.blueprintIngredients.blueprintId, id))
      .run();
    tx.delete(schema.blueprints)
      .where(eq(schema.blueprints.id, id))
      .run();
  });
}

export function getCraftability(db: DB): BlueprintCraftability[] {
  const allBlueprints = db.select().from(schema.blueprints).all();
  const allIngredients = db.select().from(schema.blueprintIngredients).all();
  const allInventory = db.select().from(schema.inventory).all();

  return allBlueprints.map((bp) => {
    const bpIngredients = allIngredients.filter((i) => i.blueprintId === bp.id);

    const ingredients: IngredientStatus[] = bpIngredients.map((ing) => {
      const minQuality = ing.minQuality ?? 0;
      const matchingInventory = allInventory.filter(
        (inv) => inv.materialName === ing.materialName && inv.quality >= minQuality
      );
      const available = matchingInventory.reduce((sum, inv) => sum + inv.quantityCscu, 0);

      return {
        materialName: ing.materialName,
        required: ing.quantityCscu,
        available,
        minQuality,
        sufficient: available >= ing.quantityCscu,
      };
    });

    const canCraft = ingredients.length > 0 && ingredients.every((i) => i.sufficient);
    const craftableCount = ingredients.length === 0
      ? 0
      : Math.floor(Math.min(...ingredients.map((i) =>
          i.required > 0 ? i.available / i.required : Infinity
        )));

    return { blueprint: bp, ingredients, canCraft, craftableCount };
  });
}

export function getCraftabilityForBlueprint(db: DB, blueprintId: string): BlueprintCraftability | null {
  const result = getCraftability(db);
  return result.find((r) => r.blueprint.id === blueprintId) ?? null;
}
