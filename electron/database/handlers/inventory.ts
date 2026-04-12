import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse } from '../../../src/types/database';
import * as inventoryLogic from './inventory.logic';
import { validateInventoryInput } from './validation';

export function registerInventoryHandlers(): void {
  ipcMain.handle('db:inventory:findAll', async (): Promise<DbResponse> => {
    try {
      const results = inventoryLogic.findAllInventory(getDatabase());
      return { success: true, data: results };
    } catch (error) {
      console.error('[Inventory] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:inventory:findById', async (_, id: string): Promise<DbResponse> => {
    try {
      const result = inventoryLogic.findInventoryById(getDatabase(), id);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Inventory] findById error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:inventory:create', async (_, data: Parameters<typeof inventoryLogic.createInventoryItem>[1]): Promise<DbResponse> => {
    try {
      validateInventoryInput(data as unknown as Record<string, unknown>);
      const result = inventoryLogic.createInventoryItem(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Inventory] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:inventory:update', async (_, id: string, data: Parameters<typeof inventoryLogic.updateInventoryItem>[2]): Promise<DbResponse> => {
    try {
      validateInventoryInput(data as unknown as Record<string, unknown>, true);
      const result = inventoryLogic.updateInventoryItem(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Inventory] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:inventory:adjustQuantity', async (_, id: string, delta: number): Promise<DbResponse> => {
    try {
      const result = inventoryLogic.adjustQuantity(getDatabase(), id, delta);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Inventory] adjustQuantity error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:inventory:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      inventoryLogic.deleteInventoryItem(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Inventory] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Inventory handlers registered');
}
