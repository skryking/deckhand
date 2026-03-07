import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse } from '../../../src/types/database';
import * as shipsLogic from './ships.logic';
import { validateShipInput } from './validation';

export function registerShipHandlers(): void {
  ipcMain.handle('db:ships:findAll', async (): Promise<DbResponse> => {
    try {
      const results = shipsLogic.findAllShips(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Ships] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:ships:create', async (_, data: Parameters<typeof shipsLogic.createShip>[1]): Promise<DbResponse> => {
    try {
      validateShipInput(data as unknown as Record<string, unknown>);
      const result = shipsLogic.createShip(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Ships] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:ships:update', async (_, id: string, data: Parameters<typeof shipsLogic.updateShip>[2]): Promise<DbResponse> => {
    try {
      validateShipInput(data as unknown as Record<string, unknown>, true);
      const result = shipsLogic.updateShip(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Ships] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:ships:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      shipsLogic.deleteShip(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Ships] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:ships:getCurrentLocation', async (_, shipId: string): Promise<DbResponse> => {
    try {
      const result = shipsLogic.getShipCurrentLocation(getDatabase(), shipId);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Ships] getCurrentLocation error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Ship handlers registered');
}
