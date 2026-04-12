import type {
  Ship,
  Location,
  JournalEntry,
  Transaction,
  CargoRun,
  Mission,
  Screenshot,
  Session,
  InventoryItem,
  Blueprint,
  BlueprintIngredient,
  BlueprintCraftability,
  ShipCurrentLocation,
  ShipAtLocation,
  CreateShipInput,
  UpdateShipInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateCargoRunInput,
  UpdateCargoRunInput,
  CreateMissionInput,
  UpdateMissionInput,
  CreateScreenshotInput,
  UpdateScreenshotInput,
  UpdateSessionInput,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  DbResponse,
  QueryOptions,
} from '../../types/database';

// Generic invoke wrapper with error handling
async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const response = (await window.ipcRenderer.invoke(channel, ...args)) as DbResponse<T>;
  if (!response.success) {
    throw new Error(response.error || 'Database operation failed');
  }
  return response.data as T;
}

// ============================================
// SHIPS API
// ============================================
export const shipsApi = {
  findAll: () => invoke<Ship[]>('db:ships:findAll'),
  create: (data: CreateShipInput) => invoke<Ship>('db:ships:create', data),
  update: (id: string, data: UpdateShipInput) => invoke<Ship>('db:ships:update', id, data),
  delete: (id: string) => invoke<void>('db:ships:delete', id),
  getCurrentLocation: (shipId: string) => invoke<ShipCurrentLocation | null>('db:ships:getCurrentLocation', shipId),
};

// ============================================
// LOCATIONS API
// ============================================
export const locationsApi = {
  findAll: () => invoke<Location[]>('db:locations:findAll'),
  findById: (id: string) => invoke<Location | null>('db:locations:findById', id),
  create: (data: CreateLocationInput) => invoke<Location>('db:locations:create', data),
  update: (id: string, data: UpdateLocationInput) => invoke<Location>('db:locations:update', id, data),
  delete: (id: string) => invoke<void>('db:locations:delete', id),
  incrementVisit: (id: string) => invoke<Location>('db:locations:incrementVisit', id),
  getShipsAtLocation: (locationId: string) => invoke<ShipAtLocation[]>('db:locations:getShipsAtLocation', locationId),
};

// ============================================
// JOURNAL ENTRIES API
// ============================================
export const journalApi = {
  findAll: (options?: QueryOptions) => invoke<JournalEntry[]>('db:journal:findAll', options),
  create: (data: CreateJournalEntryInput) => invoke<JournalEntry>('db:journal:create', data),
  update: (id: string, data: UpdateJournalEntryInput) => invoke<JournalEntry>('db:journal:update', id, data),
  delete: (id: string) => invoke<void>('db:journal:delete', id),
  count: () => invoke<number>('db:journal:count'),
};

// ============================================
// TRANSACTIONS API
// ============================================
export const transactionsApi = {
  findAll: (options?: QueryOptions) => invoke<Transaction[]>('db:transactions:findAll', options),
  create: (data: CreateTransactionInput) => invoke<Transaction>('db:transactions:create', data),
  update: (id: string, data: UpdateTransactionInput) => invoke<Transaction>('db:transactions:update', id, data),
  delete: (id: string) => invoke<void>('db:transactions:delete', id),
  getBalance: () => invoke<number>('db:transactions:getBalance'),
};

// ============================================
// CARGO RUNS API
// ============================================
export const cargoApi = {
  findAll: (options?: QueryOptions) => invoke<CargoRun[]>('db:cargo:findAll', options),
  create: (data: CreateCargoRunInput) => invoke<CargoRun>('db:cargo:create', data),
  update: (id: string, data: UpdateCargoRunInput) => invoke<CargoRun>('db:cargo:update', id, data),
  complete: (id: string, sellPrice: number) => invoke<CargoRun>('db:cargo:complete', id, sellPrice),
  delete: (id: string) => invoke<void>('db:cargo:delete', id),
};

// ============================================
// MISSIONS API
// ============================================
export const missionsApi = {
  findAll: (options?: QueryOptions) => invoke<Mission[]>('db:missions:findAll', options),
  create: (data: CreateMissionInput) => invoke<Mission>('db:missions:create', data),
  update: (id: string, data: UpdateMissionInput) => invoke<Mission>('db:missions:update', id, data),
  complete: (id: string) => invoke<Mission>('db:missions:complete', id),
  delete: (id: string) => invoke<void>('db:missions:delete', id),
};

// ============================================
// SCREENSHOTS API
// ============================================
export const screenshotsApi = {
  findAll: (options?: QueryOptions) => invoke<Screenshot[]>('db:screenshots:findAll', options),
  findByLocation: (locationId: string) => invoke<Screenshot[]>('db:screenshots:findByLocation', locationId),
  findByShip: (shipId: string) => invoke<Screenshot[]>('db:screenshots:findByShip', shipId),
  findByJournalEntry: (journalEntryId: string) => invoke<Screenshot[]>('db:screenshots:findByJournalEntry', journalEntryId),
  create: (data: CreateScreenshotInput) => invoke<Screenshot>('db:screenshots:create', data),
  update: (id: string, data: UpdateScreenshotInput) => invoke<Screenshot>('db:screenshots:update', id, data),
  delete: (id: string) => invoke<void>('db:screenshots:delete', id),
};

// ============================================
// INVENTORY API
// ============================================
export const inventoryApi = {
  findAll: () => invoke<InventoryItem[]>('db:inventory:findAll'),
  findById: (id: string) => invoke<InventoryItem | null>('db:inventory:findById', id),
  create: (data: CreateInventoryItemInput) => invoke<InventoryItem>('db:inventory:create', data),
  update: (id: string, data: UpdateInventoryItemInput) => invoke<InventoryItem>('db:inventory:update', id, data),
  adjustQuantity: (id: string, delta: number) => invoke<InventoryItem>('db:inventory:adjustQuantity', id, delta),
  delete: (id: string) => invoke<void>('db:inventory:delete', id),
};

// ============================================
// BLUEPRINTS API
// ============================================
export const blueprintsApi = {
  findAll: () => invoke<Blueprint[]>('db:blueprints:findAll'),
  findById: (id: string) => invoke<(Blueprint & { ingredients: BlueprintIngredient[] }) | null>('db:blueprints:findById', id),
  create: (data: CreateBlueprintInput) => invoke<Blueprint & { ingredients: BlueprintIngredient[] }>('db:blueprints:create', data),
  update: (id: string, data: UpdateBlueprintInput) => invoke<Blueprint & { ingredients: BlueprintIngredient[] }>('db:blueprints:update', id, data),
  delete: (id: string) => invoke<void>('db:blueprints:delete', id),
  getCraftability: () => invoke<BlueprintCraftability[]>('db:blueprints:getCraftability'),
  getCraftabilityForBlueprint: (id: string) => invoke<BlueprintCraftability | null>('db:blueprints:getCraftabilityForBlueprint', id),
};

// ============================================
// SESSIONS API
// ============================================
export const sessionsApi = {
  findAll: (options?: QueryOptions) => invoke<Session[]>('db:sessions:findAll', options),
  getActive: () => invoke<Session | null>('db:sessions:getActive'),
  start: (startingBalance?: number) => invoke<Session>('db:sessions:start', startingBalance),
  end: (id: string, endingBalance?: number) => invoke<Session>('db:sessions:end', id, endingBalance),
  update: (id: string, data: UpdateSessionInput) => invoke<Session>('db:sessions:update', id, data),
  delete: (id: string) => invoke<void>('db:sessions:delete', id),
};
