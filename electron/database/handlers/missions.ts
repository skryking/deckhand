import { ipcMain } from 'electron';
import { eq, like, or, desc } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerMissionHandlers(): void {
  // Get all missions
  ipcMain.handle('db:missions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.missions).orderBy(desc(schema.missions.acceptedAt));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get mission by ID
  ipcMain.handle('db:missions:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.missions).where(eq(schema.missions.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Missions] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get missions by status
  ipcMain.handle('db:missions:findByStatus', async (_, status: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.missions)
        .where(eq(schema.missions.status, status))
        .orderBy(desc(schema.missions.acceptedAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] findByStatus error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get active missions
  ipcMain.handle('db:missions:getActive', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.missions)
        .where(eq(schema.missions.status, 'active'))
        .orderBy(desc(schema.missions.acceptedAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] getActive error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create mission
  ipcMain.handle('db:missions:create', async (_, data: typeof schema.missions.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.insert(schema.missions).values(data).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update mission
  ipcMain.handle('db:missions:update', async (_, id: string, data: Partial<typeof schema.missions.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.missions)
        .set(data)
        .where(eq(schema.missions.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Complete mission
  ipcMain.handle('db:missions:complete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.missions)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(schema.missions.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] complete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete mission
  ipcMain.handle('db:missions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.missions).where(eq(schema.missions.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Missions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search missions
  ipcMain.handle('db:missions:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.missions)
        .where(
          or(
            like(schema.missions.title, searchTerm),
            like(schema.missions.description, searchTerm),
            like(schema.missions.contractor, searchTerm)
          )
        )
        .orderBy(desc(schema.missions.acceptedAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Mission handlers registered');
}
