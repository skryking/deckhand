import { ipcMain } from 'electron';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerTransactionHandlers(): void {
  // Get all transactions
  ipcMain.handle('db:transactions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.transactions).orderBy(desc(schema.transactions.timestamp));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Transactions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get transactions by category
  ipcMain.handle('db:transactions:findByCategory', async (_, category: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.category, category))
        .orderBy(desc(schema.transactions.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Transactions] findByCategory error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get transactions by date range
  ipcMain.handle('db:transactions:findByDateRange', async (_, startDate: number, endDate: number): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.transactions)
        .where(
          and(
            gte(schema.transactions.timestamp, new Date(startDate)),
            lte(schema.transactions.timestamp, new Date(endDate))
          )
        )
        .orderBy(desc(schema.transactions.timestamp))
        .all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Transactions] findByDateRange error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Create transaction
  ipcMain.handle('db:transactions:create', async (_, data: typeof schema.transactions.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      // Convert timestamp from IPC (may be string or Date) to Date object
      const insertData = {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      };
      const result = db.insert(schema.transactions).values(insertData).returning().get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Transactions] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update transaction
  ipcMain.handle('db:transactions:update', async (_, id: string, data: Partial<typeof schema.transactions.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      // Convert timestamp from IPC (may be string or Date) to Date object
      const updateData = {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      };
      const result = db
        .update(schema.transactions)
        .set(updateData)
        .where(eq(schema.transactions.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Transactions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete transaction
  ipcMain.handle('db:transactions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.transactions).where(eq(schema.transactions.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Transactions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get total balance
  ipcMain.handle('db:transactions:getBalance', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .select({ total: sql<number>`SUM(${schema.transactions.amount})` })
        .from(schema.transactions)
        .get();
      return { success: true, data: result?.total || 0 };
    } catch (error) {
      console.error('[Transactions] getBalance error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get balance by category
  ipcMain.handle('db:transactions:getBalanceByCategory', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select({
          category: schema.transactions.category,
          total: sql<number>`SUM(${schema.transactions.amount})`,
        })
        .from(schema.transactions)
        .groupBy(schema.transactions.category)
        .all();

      const categoryTotals: Record<string, number> = {};
      for (const row of results) {
        categoryTotals[row.category] = row.total || 0;
      }
      return { success: true, data: categoryTotals };
    } catch (error) {
      console.error('[Transactions] getBalanceByCategory error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Transaction handlers registered');
}
