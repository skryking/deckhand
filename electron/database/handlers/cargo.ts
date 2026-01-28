import { ipcMain } from 'electron';
import { eq, like, desc } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerCargoHandlers(): void {
  // Get all cargo runs
  ipcMain.handle('db:cargo:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.cargoRuns).orderBy(desc(schema.cargoRuns.startedAt));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Cargo] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get cargo run by ID
  ipcMain.handle('db:cargo:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Cargo] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get cargo runs by status
  ipcMain.handle('db:cargo:findByStatus', async (_, status: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.cargoRuns)
        .where(eq(schema.cargoRuns.status, status))
        .orderBy(desc(schema.cargoRuns.startedAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Cargo] findByStatus error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create cargo run
  ipcMain.handle('db:cargo:create', async (_, data: typeof schema.cargoRuns.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.insert(schema.cargoRuns).values(data).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update cargo run
  ipcMain.handle('db:cargo:update', async (_, id: string, data: Partial<typeof schema.cargoRuns.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.cargoRuns)
        .set(data)
        .where(eq(schema.cargoRuns.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Complete cargo run (calculate profit)
  ipcMain.handle('db:cargo:complete', async (_, id: string, sellPrice: number): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const cargoRun = db.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).get();
      if (!cargoRun) {
        return { success: false, error: 'Cargo run not found' };
      }

      const profit = (sellPrice * cargoRun.quantity) - (cargoRun.buyPrice * cargoRun.quantity);
      const result = db
        .update(schema.cargoRuns)
        .set({
          sellPrice,
          profit,
          completedAt: new Date(),
          status: 'completed',
        })
        .where(eq(schema.cargoRuns.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] complete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete cargo run
  ipcMain.handle('db:cargo:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Cargo] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search cargo runs by commodity
  ipcMain.handle('db:cargo:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.cargoRuns)
        .where(like(schema.cargoRuns.commodity, searchTerm))
        .orderBy(desc(schema.cargoRuns.startedAt))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Cargo] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Cargo handlers registered');
}
