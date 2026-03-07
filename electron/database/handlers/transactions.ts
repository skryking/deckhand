import { ipcMain } from 'electron';
import { getDatabase } from '../index';
import type { DbResponse, QueryOptions } from '../../../src/types/database';
import * as txnLogic from './transactions.logic';
import { validateTransactionInput } from './validation';

export function registerTransactionHandlers(): void {
  ipcMain.handle('db:transactions:findAll', async (_, options?: QueryOptions): Promise<DbResponse> => {
    try {
      const results = txnLogic.findAllTransactions(getDatabase(), options);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Transactions] findAll error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:transactions:create', async (_, data: Parameters<typeof txnLogic.createTransaction>[1]): Promise<DbResponse> => {
    try {
      validateTransactionInput(data as unknown as Record<string, unknown>);
      const result = txnLogic.createTransaction(getDatabase(), data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Transactions] create error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:transactions:update', async (_, id: string, data: Parameters<typeof txnLogic.updateTransaction>[2]): Promise<DbResponse> => {
    try {
      validateTransactionInput(data as unknown as Record<string, unknown>, true);
      const result = txnLogic.updateTransaction(getDatabase(), id, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Transactions] update error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:transactions:delete', async (_, id: string): Promise<DbResponse> => {
    try {
      txnLogic.deleteTransaction(getDatabase(), id);
      return { success: true };
    } catch (error) {
      console.error('[Transactions] delete error:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('db:transactions:getBalance', async (): Promise<DbResponse> => {
    try {
      const total = txnLogic.getBalance(getDatabase());
      return { success: true, data: total };
    } catch (error) {
      console.error('[Transactions] getBalance error:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Database] Transaction handlers registered');
}
