import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';
import * as sessionsLogic from './sessions.logic';

export function registerSessionHandlers(): void {
  ipcMain.handle('db:sessions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const results = sessionsLogic.findAllSessions(getDatabase(), options);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Sessions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = sessionsLogic.findSessionById(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:getActive', async (): Promise<DbResponse> => {
    try {
      const result = sessionsLogic.getActiveSession(getDatabase());
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] getActive error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:start', async (_, startingBalance?: number): Promise<DbResponse> => {
    try {
      const result = sessionsLogic.startSession(getDatabase(), startingBalance);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] start error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:end', async (_, id: string, endingBalance?: number): Promise<DbResponse> => {
    try {
      const result = sessionsLogic.endSession(getDatabase(), id, endingBalance);
      if (!result) return { success: false, error: 'Session not found' };
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] end error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:update', async (_, id: string, data: Parameters<typeof sessionsLogic.updateSession>[2]): Promise<DbResponse> => {
    try {
      const result = sessionsLogic.updateSession(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Sessions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:sessions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      sessionsLogic.deleteSession(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Sessions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Session handlers registered');
}
