import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';
import * as cargoLogic from './cargo.logic';
import { validateCargoRunInput } from './validation';

export function registerCargoHandlers(): void {
  ipcMain.handle('db:cargo:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const results = cargoLogic.findAllCargoRuns(getDatabase(), options);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Cargo] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:cargo:create', async (_, data: Parameters<typeof cargoLogic.createCargoRun>[1]): Promise<DbResponse> => {
    try {
      validateCargoRunInput(data as unknown as Record<string, unknown>);
      const result = cargoLogic.createCargoRun(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:cargo:update', async (_, id: string, data: Parameters<typeof cargoLogic.updateCargoRun>[2]): Promise<DbResponse> => {
    try {
      validateCargoRunInput(data as unknown as Record<string, unknown>, true);
      const result = cargoLogic.updateCargoRun(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:cargo:complete', async (_, id: string, sellPrice: number): Promise<DbResponse> => {
    try {
      const result = cargoLogic.completeCargoRun(getDatabase(), id, sellPrice);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Cargo] complete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:cargo:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      cargoLogic.deleteCargoRun(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Cargo] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Cargo handlers registered');
}
