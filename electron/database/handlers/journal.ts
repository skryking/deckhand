import { ipcMain } from 'electron';
import { eq, like, or, desc } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerJournalHandlers(): void {
  // Get all journal entries
  ipcMain.handle('db:journal:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.journalEntries).orderBy(desc(schema.journalEntries.timestamp));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Journal] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get journal entry by ID
  ipcMain.handle('db:journal:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Journal] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get entries by type
  ipcMain.handle('db:journal:findByType', async (_, entryType: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.entryType, entryType))
        .orderBy(desc(schema.journalEntries.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Journal] findByType error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get favorite entries
  ipcMain.handle('db:journal:getFavorites', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.isFavorite, true))
        .orderBy(desc(schema.journalEntries.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Journal] getFavorites error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create journal entry
  ipcMain.handle('db:journal:create', async (_, data: typeof schema.journalEntries.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.insert(schema.journalEntries).values(data).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Journal] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update journal entry
  ipcMain.handle('db:journal:update', async (_, id: string, data: Partial<typeof schema.journalEntries.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.journalEntries)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.journalEntries.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Journal] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete journal entry
  ipcMain.handle('db:journal:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.journalEntries).where(eq(schema.journalEntries.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Journal] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Search journal entries
  ipcMain.handle('db:journal:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      const results = db
        .select()
        .from(schema.journalEntries)
        .where(
          or(
            like(schema.journalEntries.title, searchTerm),
            like(schema.journalEntries.content, searchTerm)
          )
        )
        .orderBy(desc(schema.journalEntries.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Journal] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get entry count
  ipcMain.handle('db:journal:count', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.journalEntries).all();
      return { success: true, data: results.length };
    } catch (error) {
      console.error('[Journal] count error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Journal handlers registered');
}
