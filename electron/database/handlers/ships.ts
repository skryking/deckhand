import { ipcMain } from 'electron';
import { eq, like, or, and, isNotNull, desc } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse } from '../../../src/types/database';

export function registerShipHandlers(): void {
  // Get all ships
  ipcMain.handle('db:ships:findAll', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.ships).all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Ships] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get ship by ID
  ipcMain.handle('db:ships:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.ships).where(eq(schema.ships.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Ships] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create ship + purchase transaction
  ipcMain.handle('db:ships:create', async (_, data: typeof schema.ships.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.transaction((tx) => {
        const newShip = tx.insert(schema.ships).values(data).returning().get();

        // Create purchase expense transaction if price is set
        if (newShip.acquiredPrice != null && newShip.acquiredPrice > 0) {
          tx.insert(schema.transactions).values({
            timestamp: newShip.acquiredAt ?? new Date(),
            amount: -newShip.acquiredPrice,
            category: 'purchase',
            description: `Ship purchase: ${newShip.manufacturer} ${newShip.model}`,
            shipId: newShip.id,
          }).run();
        }

        return newShip;
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('[Ships] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update ship + sync purchase transaction
  ipcMain.handle('db:ships:update', async (_, id: string, data: Partial<typeof schema.ships.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.transaction((tx) => {
        const current = tx.select().from(schema.ships).where(eq(schema.ships.id, id)).get();
        if (!current) throw new Error('Ship not found');

        const updated = tx
          .update(schema.ships)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.ships.id, id))
          .returning()
          .get();

        // Sync purchase transaction
        const existingTxn = tx.select().from(schema.transactions)
          .where(and(eq(schema.transactions.shipId, id), eq(schema.transactions.category, 'purchase')))
          .get();

        if (updated.acquiredPrice != null && updated.acquiredPrice > 0) {
          if (existingTxn) {
            // Update existing purchase transaction
            tx.update(schema.transactions)
              .set({
                amount: -updated.acquiredPrice,
                description: `Ship purchase: ${updated.manufacturer} ${updated.model}`,
                timestamp: updated.acquiredAt ?? existingTxn.timestamp,
              })
              .where(eq(schema.transactions.id, existingTxn.id))
              .run();
          } else {
            // Create new purchase transaction (price was added)
            tx.insert(schema.transactions).values({
              timestamp: updated.acquiredAt ?? new Date(),
              amount: -updated.acquiredPrice,
              category: 'purchase',
              description: `Ship purchase: ${updated.manufacturer} ${updated.model}`,
              shipId: id,
            }).run();
          }
        } else if (existingTxn) {
          // Price was removed — delete the purchase transaction
          tx.delete(schema.transactions)
            .where(eq(schema.transactions.id, existingTxn.id))
            .run();
        }

        return updated;
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('[Ships] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete ship + associated purchase transaction
  ipcMain.handle('db:ships:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.transaction((tx) => {
        tx.delete(schema.transactions)
          .where(and(eq(schema.transactions.shipId, id), eq(schema.transactions.category, 'purchase')))
          .run();
        tx.delete(schema.ships).where(eq(schema.ships.id, id)).run();
      });
      return { success: true };
    } catch (error) {
      console.error('[Ships] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search ships
  ipcMain.handle('db:ships:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.ships)
        .where(
          or(
            like(schema.ships.model, searchTerm),
            like(schema.ships.manufacturer, searchTerm),
            like(schema.ships.nickname, searchTerm)
          )
        )
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Ships] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get current location for a ship (most recent journal entry with both ship and location)
  ipcMain.handle('db:ships:getCurrentLocation', async (_, shipId: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .select({
          locationId: schema.journalEntries.locationId,
          locationName: schema.locations.name,
          timestamp: schema.journalEntries.timestamp,
        })
        .from(schema.journalEntries)
        .innerJoin(schema.locations, eq(schema.journalEntries.locationId, schema.locations.id))
        .where(
          and(
            eq(schema.journalEntries.shipId, shipId),
            isNotNull(schema.journalEntries.locationId)
          )
        )
        .orderBy(desc(schema.journalEntries.timestamp))
        .limit(1)
        .get();
      return { success: true, data: result || null };
    } catch (error) {
      console.error('[Ships] getCurrentLocation error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get location history for a ship
  ipcMain.handle('db:ships:getLocationHistory', async (_, shipId: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select({
          locationId: schema.journalEntries.locationId,
          locationName: schema.locations.name,
          timestamp: schema.journalEntries.timestamp,
          entryId: schema.journalEntries.id,
          entryTitle: schema.journalEntries.title,
        })
        .from(schema.journalEntries)
        .innerJoin(schema.locations, eq(schema.journalEntries.locationId, schema.locations.id))
        .where(
          and(
            eq(schema.journalEntries.shipId, shipId),
            isNotNull(schema.journalEntries.locationId)
          )
        )
        .orderBy(desc(schema.journalEntries.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Ships] getLocationHistory error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Ship handlers registered');
}
