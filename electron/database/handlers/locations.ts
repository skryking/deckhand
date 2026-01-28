import { ipcMain } from 'electron';
import { eq, like, or, isNull } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse } from '../../../src/types/database';

export function registerLocationHandlers(): void {
  // Get all locations
  ipcMain.handle('db:locations:findAll', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.locations).all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get location by ID
  ipcMain.handle('db:locations:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.locations).where(eq(schema.locations.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Locations] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get locations by parent ID (for hierarchical browsing)
  ipcMain.handle('db:locations:findByParentId', async (_, parentId: string | null): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = parentId
        ? db.select().from(schema.locations).where(eq(schema.locations.parentId, parentId)).all()
        : db.select().from(schema.locations).where(isNull(schema.locations.parentId)).all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] findByParentId error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get favorite locations
  ipcMain.handle('db:locations:getFavorites', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.locations).where(eq(schema.locations.isFavorite, true)).all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] getFavorites error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create location
  ipcMain.handle('db:locations:create', async (_, data: typeof schema.locations.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.insert(schema.locations).values(data).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update location
  ipcMain.handle('db:locations:update', async (_, id: string, data: Partial<typeof schema.locations.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.locations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.locations.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete location
  ipcMain.handle('db:locations:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.locations).where(eq(schema.locations.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Locations] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search locations
  ipcMain.handle('db:locations:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.locations)
        .where(
          or(
            like(schema.locations.name, searchTerm),
            like(schema.locations.type, searchTerm)
          )
        )
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Increment visit count
  ipcMain.handle('db:locations:incrementVisit', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const location = db.select().from(schema.locations).where(eq(schema.locations.id, id)).get();
      if (!location) {
        return { success: false, error: 'Location not found' };
      }
      const result = db
        .update(schema.locations)
        .set({
          visitCount: (location.visitCount || 0) + 1,
          firstVisitedAt: location.firstVisitedAt || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.locations.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] incrementVisit error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Location handlers registered');
}
