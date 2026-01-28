import { registerShipHandlers } from './ships';
import { registerLocationHandlers } from './locations';
import { registerJournalHandlers } from './journal';
import { registerTransactionHandlers } from './transactions';
import { registerCargoHandlers } from './cargo';
import { registerMissionHandlers } from './missions';
import { registerScreenshotHandlers } from './screenshots';
import { registerSessionHandlers } from './sessions';

export function registerDatabaseHandlers(): void {
  registerShipHandlers();
  registerLocationHandlers();
  registerJournalHandlers();
  registerTransactionHandlers();
  registerCargoHandlers();
  registerMissionHandlers();
  registerScreenshotHandlers();
  registerSessionHandlers();

  console.log('[Database] All IPC handlers registered');
}
