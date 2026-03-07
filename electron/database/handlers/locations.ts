import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse } from '../../../src/types/database';
import * as locationsLogic from './locations.logic';
import { validateLocationInput } from './validation';

export function registerLocationHandlers(): void {
  ipcMain.handle('db:locations:findAll', async (): Promise<DbResponse> => {
    try {
      const results = locationsLogic.findAllLocations(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = locationsLogic.findLocationById(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:create', async (_, data: Parameters<typeof locationsLogic.createLocation>[1]): Promise<DbResponse> => {
    try {
      validateLocationInput(data as unknown as Record<string, unknown>);
      const result = locationsLogic.createLocation(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:update', async (_, id: string, data: Parameters<typeof locationsLogic.updateLocation>[2]): Promise<DbResponse> => {
    try {
      validateLocationInput(data as unknown as Record<string, unknown>, true);
      const result = locationsLogic.updateLocation(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      locationsLogic.deleteLocation(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Locations] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:incrementVisit', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = locationsLogic.incrementVisit(getDatabase(), id);
      if (!result) return { success: false, error: 'Location not found' };
      return { success: true, data: result };
    } catch (error) {
      console.error('[Locations] incrementVisit error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:locations:getShipsAtLocation', async (_, locationId: string): Promise<DbResponse> => {
    try {
      const results = locationsLogic.getShipsAtLocation(getDatabase(), locationId);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Locations] getShipsAtLocation error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Location handlers registered');
}
