import { ipcMain } from 'electron';
import { eq, desc, isNull } from 'drizzle-orm';
import { getDatabase, schema } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';

export function registerSessionHandlers(): void {
  // Get all sessions
  ipcMain.handle('db:sessions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      let query = db.select().from(schema.sessions).orderBy(desc(schema.sessions.startedAt));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const results = query.all();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Sessions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get session by ID
  ipcMain.handle('db:sessions:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Sessions] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get active session (no endedAt)
  ipcMain.handle('db:sessions:getActive', async (): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const results = db
        .select()
        .from(schema.sessions)
        .where(isNull(schema.sessions.endedAt))
        .orderBy(desc(schema.sessions.startedAt))
        .limit(1)
        .all();
      return { success: true, data: results[0] || null };
    } catch (error) {
      console.error('[Sessions] getActive error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Start new session
  ipcMain.handle('db:sessions:start', async (_, startingBalance?: number): Promise<DbResponse> => {
    try {
      const db = getDatabase();

      // End any active sessions first
      const activeSessions = db
        .select()
        .from(schema.sessions)
        .where(isNull(schema.sessions.endedAt))
        .all();

      for (const session of activeSessions) {
        const duration = Math.floor((Date.now() - (session.startedAt?.getTime() || Date.now())) / 60000);
        db.update(schema.sessions)
          .set({
            endedAt: new Date(),
            durationMinutes: duration,
          })
          .where(eq(schema.sessions.id, session.id))
          .run();
      }

      // Create new session
      const result = db
        .insert(schema.sessions)
        .values({
          startedAt: new Date(),
          startingBalance,
        })
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] start error:', error);
      return { success: false, error: String(error) };
    }
  });

  // End session
  ipcMain.handle('db:sessions:end', async (_, id: string, endingBalance?: number): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const session = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).get();

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const duration = Math.floor((Date.now() - (session.startedAt?.getTime() || Date.now())) / 60000);

      const result = db
        .update(schema.sessions)
        .set({
          endedAt: new Date(),
          durationMinutes: duration,
          endingBalance,
        })
        .where(eq(schema.sessions.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] end error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update session
  ipcMain.handle('db:sessions:update', async (_, id: string, data: Partial<typeof schema.sessions.$inferInsert>): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      const result = db
        .update(schema.sessions)
        .set(data)
        .where(eq(schema.sessions.id, id))
        .returning()
        .get();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete session
  ipcMain.handle('db:sessions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      const db = getDatabase();
      db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
      return { success: true };
    } catch (error) {
      console.error('[Sessions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Session handlers registered');
}
