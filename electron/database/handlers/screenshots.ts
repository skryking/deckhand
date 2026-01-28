import { ipcMain } from 'electron';
import { eq, like, desc } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerScreenshotHandlers(): void {
  // Get all screenshots
  ipcMain.handle('db:screenshots:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.screenshots).orderBy(desc(schema.screenshots.takenAt));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Screenshots] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get screenshot by ID
  ipcMain.handle('db:screenshots:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.screenshots).where(eq(schema.screenshots.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Screenshots] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get favorite screenshots
  ipcMain.handle('db:screenshots:getFavorites', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.screenshots)
        .where(eq(schema.screenshots.isFavorite, true))
        .orderBy(desc(schema.screenshots.takenAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Screenshots] getFavorites error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get screenshots by location
  ipcMain.handle('db:screenshots:findByLocation', async (_, locationId: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.screenshots)
        .where(eq(schema.screenshots.locationId, locationId))
        .orderBy(desc(schema.screenshots.takenAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Screenshots] findByLocation error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create screenshot
  ipcMain.handle('db:screenshots:create', async (_, data: typeof schema.screenshots.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.insert(schema.screenshots).values(data).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Screenshots] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update screenshot
  ipcMain.handle('db:screenshots:update', async (_, id: string, data: Partial<typeof schema.screenshots.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.screenshots)
        .set(data)
        .where(eq(schema.screenshots.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Screenshots] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete screenshot
  ipcMain.handle('db:screenshots:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.screenshots).where(eq(schema.screenshots.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Screenshots] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search screenshots by caption
  ipcMain.handle('db:screenshots:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.screenshots)
        .where(like(schema.screenshots.caption, searchTerm))
        .orderBy(desc(schema.screenshots.takenAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Screenshots] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Screenshot handlers registered');
}
