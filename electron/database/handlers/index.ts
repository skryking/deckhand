import { registerShipHandlers } from './ships';
import { registerLocationHandlers } from './locations';
import { registerJournalHandlers } from './journal';
import { registerTransactionHandlers } from './transactions';
import { registerCargoHandlers } from './cargo';
import { registerMissionHandlers } from './missions';
import { registerScreenshotHandlers } from './screenshots';
import { registerSessionHandlers } from './sessions';
import { registerInventoryHandlers } from './inventory';
import { registerBlueprintHandlers } from './blueprints';

export function registerDatabaseHandlers(): void {
  registerShipHandlers();
  registerLocationHandlers();
  registerJournalHandlers();
  registerTransactionHandlers();
  registerCargoHandlers();
  registerMissionHandlers();
  registerScreenshotHandlers();
  registerSessionHandlers();
  registerInventoryHandlers();
  registerBlueprintHandlers();

  console.log('[Database] All IPC handlers registered');
}
