import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';
import * as missionsLogic from './missions.logic';
import { validateMissionInput } from './validation';

export function registerMissionHandlers(): void {
  ipcMain.handle('db:missions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const results = missionsLogic.findAllMissions(getDatabase(), options);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = missionsLogic.findMissionById(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:findByStatus', async (_, status: string): Promise<DbResponse> => {
    try {
      const results = missionsLogic.findMissionsByStatus(getDatabase(), status);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] findByStatus error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:getActive', async (): Promise<DbResponse> => {
    try {
      const results = missionsLogic.getActiveMissions(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] getActive error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:create', async (_, data: Parameters<typeof missionsLogic.createMission>[1]): Promise<DbResponse> => {
    try {
      validateMissionInput(data as unknown as Record<string, unknown>);
      const result = missionsLogic.createMission(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:update', async (_, id: string, data: Parameters<typeof missionsLogic.updateMission>[2]): Promise<DbResponse> => {
    try {
      validateMissionInput(data as unknown as Record<string, unknown>, true);
      const result = missionsLogic.updateMission(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:complete', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = missionsLogic.completeMission(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Missions] complete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      missionsLogic.deleteMission(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Missions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:missions:search', async (_, query: string): Promise<DbResponse> => {
    try {
      const results = missionsLogic.searchMissions(getDatabase(), query);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Missions] search error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Mission handlers registered');
}
