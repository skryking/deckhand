import { ipcMain } from 'electron';
import { eq, and, lt, gte, like, desc } from 'drizzle-orm';
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

  // Create cargo run + buy expense transaction
  ipcMain.handle('db:cargo:create', async (_, data: typeof schema.cargoRuns.$inferInsert): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.transaction((tx) => {
        const newRun = tx.insert(schema.cargoRuns).values(data).returning().get();

        // Create buy expense transaction
        const buyTotal = newRun.buyPrice * newRun.quantity;
        if (buyTotal > 0) {
          tx.insert(schema.transactions).values({
            timestamp: newRun.startedAt,
            amount: -buyTotal,
            category: 'cargo',
            description: `Cargo purchase: ${newRun.quantity} SCU of ${newRun.commodity}`,
            locationId: newRun.originLocationId,
            shipId: newRun.shipId,
            cargoRunId: newRun.id,
          }).run();
        }

        // If created already completed (with sellPrice), also create sell transaction
        if (newRun.status === 'completed' && newRun.sellPrice != null) {
          const sellTotal = newRun.sellPrice * newRun.quantity;
          tx.insert(schema.transactions).values({
            timestamp: newRun.completedAt ?? new Date(),
            amount: sellTotal,
            category: 'cargo',
            description: `Cargo sale: ${newRun.quantity} SCU of ${newRun.commodity}`,
            locationId: newRun.destinationLocationId,
            shipId: newRun.shipId,
            cargoRunId: newRun.id,
          }).run();
        }

        return newRun;
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update cargo run + sync transactions
  ipcMain.handle('db:cargo:update', async (_, id: string, data: Partial<typeof schema.cargoRuns.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.transaction((tx) => {
        // Fetch current state to detect changes
        const current = tx.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).get();
        if (!current) throw new Error('Cargo run not found');

        // Apply the update
        const updated = tx
          .update(schema.cargoRuns)
          .set(data)
          .where(eq(schema.cargoRuns.id, id))
          .returning()
          .get();

        // Update buy transaction if buyPrice or quantity changed
        const oldBuyTotal = current.buyPrice * current.quantity;
        const newBuyTotal = updated.buyPrice * updated.quantity;
        if (oldBuyTotal !== newBuyTotal) {
          const existingBuyTxn = tx.select().from(schema.transactions)
            .where(and(eq(schema.transactions.cargoRunId, id), lt(schema.transactions.amount, 0)))
            .get();
          if (existingBuyTxn) {
            tx.update(schema.transactions)
              .set({
                amount: -newBuyTotal,
                description: `Cargo purchase: ${updated.quantity} SCU of ${updated.commodity}`,
                locationId: updated.originLocationId,
                shipId: updated.shipId,
              })
              .where(eq(schema.transactions.id, existingBuyTxn.id))
              .run();
          }
        }

        // Handle status transitions for sell transaction
        const wasCompleted = current.status === 'completed';
        const isNowCompleted = updated.status === 'completed';

        if (isNowCompleted && updated.sellPrice != null) {
          const existingSellTxn = tx.select().from(schema.transactions)
            .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
            .get();

          const sellTotal = updated.sellPrice * updated.quantity;

          if (existingSellTxn) {
            // Update existing sell transaction
            tx.update(schema.transactions)
              .set({
                amount: sellTotal,
                description: `Cargo sale: ${updated.quantity} SCU of ${updated.commodity}`,
                locationId: updated.destinationLocationId,
                shipId: updated.shipId,
              })
              .where(eq(schema.transactions.id, existingSellTxn.id))
              .run();
          } else {
            // Create new sell transaction
            tx.insert(schema.transactions).values({
              timestamp: updated.completedAt ?? new Date(),
              amount: sellTotal,
              category: 'cargo',
              description: `Cargo sale: ${updated.quantity} SCU of ${updated.commodity}`,
              locationId: updated.destinationLocationId,
              shipId: updated.shipId,
              cargoRunId: id,
            }).run();
          }
        } else if (wasCompleted && !isNowCompleted) {
          // Status moved away from completed — remove sell transaction
          tx.delete(schema.transactions)
            .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
            .run();
        }

        return updated;
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Complete cargo run (calculate profit) + create sell transaction
  ipcMain.handle('db:cargo:complete', async (_, id: string, sellPrice: number): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db.transaction((tx) => {
        const cargoRun = tx.select().from(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).get();
        if (!cargoRun) throw new Error('Cargo run not found');

        const profit = (sellPrice * cargoRun.quantity) - (cargoRun.buyPrice * cargoRun.quantity);
        const completedAt = new Date();

        const updated = tx
          .update(schema.cargoRuns)
          .set({ sellPrice, profit, completedAt, status: 'completed' })
          .where(eq(schema.cargoRuns.id, id))
          .returning()
          .get();

        // Create sell income transaction (only if one doesn't already exist)
        const existingSellTxn = tx.select().from(schema.transactions)
          .where(and(eq(schema.transactions.cargoRunId, id), gte(schema.transactions.amount, 0)))
          .get();

        if (!existingSellTxn) {
          const sellTotal = sellPrice * cargoRun.quantity;
          tx.insert(schema.transactions).values({
            timestamp: completedAt,
            amount: sellTotal,
            category: 'cargo',
            description: `Cargo sale: ${cargoRun.quantity} SCU of ${cargoRun.commodity}`,
            locationId: cargoRun.destinationLocationId,
            shipId: cargoRun.shipId,
            cargoRunId: id,
          }).run();
        }

        return updated;
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] complete error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete cargo run + associated transactions
  ipcMain.handle('db:cargo:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.transaction((tx) => {
        tx.delete(schema.transactions).where(eq(schema.transactions.cargoRunId, id)).run();
        tx.delete(schema.cargoRuns).where(eq(schema.cargoRuns.id, id)).run();
      });
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
