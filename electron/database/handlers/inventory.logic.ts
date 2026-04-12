import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllInventory(db: DB) {
  return db.select().from(schema.inventory)
    .orderBy(schema.inventory.materialName, schema.inventory.quality)
    .all();
}

export function findInventoryById(db: DB, id: string) {
  return db.select().from(schema.inventory)
    .where(eq(schema.inventory.id, id))
    .get() ?? null;
}

export function createInventoryItem(db: DB, data: typeof schema.inventory.$inferInsert) {
  return db.insert(schema.inventory).values(data).returning().get();
}

export function updateInventoryItem(db: DB, id: string, data: Partial<typeof schema.inventory.$inferInsert>) {
  const existing = db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).get();
  if (!existing) throw new Error('Inventory item not found');

  return db.update(schema.inventory)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.inventory.id, id))
    .returning()
    .get();
}

export function adjustQuantity(db: DB, id: string, delta: number) {
  const existing = db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).get();
  if (!existing) throw new Error('Inventory item not found');

  const newQuantity = existing.quantityCscu + delta;
  if (newQuantity < 0) throw new Error('Quantity cannot be negative');

  return db.update(schema.inventory)
    .set({ quantityCscu: newQuantity, updatedAt: new Date() })
    .where(eq(schema.inventory.id, id))
    .returning()
    .get();
}

export function deleteInventoryItem(db: DB, id: string) {
  db.delete(schema.inventory).where(eq(schema.inventory.id, id)).run();
}
