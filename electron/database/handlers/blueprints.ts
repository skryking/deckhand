import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse } from '../../../src/types/database';
import * as blueprintsLogic from './blueprints.logic';
import { validateBlueprintInput } from './validation';

export function registerBlueprintHandlers(): void {
  ipcMain.handle('db:blueprints:findAll', async (): Promise<DbResponse> => {
    try {
      const results = blueprintsLogic.findAllBlueprints(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Blueprints] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = blueprintsLogic.findBlueprintById(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Blueprints] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:create', async (_, data: Parameters<typeof blueprintsLogic.createBlueprint>[1]): Promise<DbResponse> => {
    try {
      validateBlueprintInput(data as unknown as Record<string, unknown>);
      const result = blueprintsLogic.createBlueprint(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Blueprints] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:update', async (_, id: string, data: Parameters<typeof blueprintsLogic.updateBlueprint>[2]): Promise<DbResponse> => {
    try {
      validateBlueprintInput(data as unknown as Record<string, unknown>, true);
      const result = blueprintsLogic.updateBlueprint(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Blueprints] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      blueprintsLogic.deleteBlueprint(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Blueprints] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:getCraftability', async (): Promise<DbResponse> => {
    try {
      const results = blueprintsLogic.getCraftability(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Blueprints] getCraftability error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:blueprints:getCraftabilityForBlueprint', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = blueprintsLogic.getCraftabilityForBlueprint(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Blueprints] getCraftabilityForBlueprint error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Blueprint handlers registered');
}
