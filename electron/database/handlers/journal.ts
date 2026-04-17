import { ipcMain } from 'electron';
import { eq, desc, count } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';
import { validateFks } from './fk-validation';

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

  // Create journal entry
  ipcMain.handle('db:journal:create', async (_, data: typeof schema.journalEntries.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      validateFks(db, { shipId: data.shipId, locationId: data.locationId });
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
      validateFks(db, { shipId: data.shipId, locationId: data.locationId });
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
      db.transaction((tx) => {
        // Null out references from screenshots and transactions that pointed here.
        tx.update(schema.screenshots).set({ journalEntryId: null })
          .where(eq(schema.screenshots.journalEntryId, id)).run();
        tx.update(schema.transactions).set({ journalEntryId: null })
          .where(eq(schema.transactions.journalEntryId, id)).run();
        tx.delete(schema.journalEntries).where(eq(schema.journalEntries.id, id)).run();
      });
      return { success: true };
    } catch (error) {
      console.error('[Journal] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get entry count
  ipcMain.handle('db:journal:count', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.select({ value: count() }).from(schema.journalEntries).get();
      return { success: true, data: result?.value ?? 0 };
    } catch (error) {
      console.error('[Journal] count error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Journal handlers registered');
}
