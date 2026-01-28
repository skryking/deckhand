import type {
  Ship,
  Location,
  JournalEntry,
  Transaction,
  CargoRun,
  Mission,
  Screenshot,
  Session,
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
  findById: (id: string) => invoke<Ship | null>('db:ships:findById', id),
  create: (data: CreateShipInput) => invoke<Ship>('db:ships:create', data),
  update: (id: string, data: UpdateShipInput) => invoke<Ship>('db:ships:update', id, data),
  delete: (id: string) => invoke<void>('db:ships:delete', id),
  search: (query: string) => invoke<Ship[]>('db:ships:search', query),
};

// ============================================
// LOCATIONS API
// ============================================
export const locationsApi = {
  findAll: () => invoke<Location[]>('db:locations:findAll'),
  findById: (id: string) => invoke<Location | null>('db:locations:findById', id),
  findByParentId: (parentId: string | null) => invoke<Location[]>('db:locations:findByParentId', parentId),
  getFavorites: () => invoke<Location[]>('db:locations:getFavorites'),
  create: (data: CreateLocationInput) => invoke<Location>('db:locations:create', data),
  update: (id: string, data: UpdateLocationInput) => invoke<Location>('db:locations:update', id, data),
  delete: (id: string) => invoke<void>('db:locations:delete', id),
  search: (query: string) => invoke<Location[]>('db:locations:search', query),
  incrementVisit: (id: string) => invoke<Location>('db:locations:incrementVisit', id),
};

// ============================================
// JOURNAL ENTRIES API
// ============================================
export const journalApi = {
  findAll: (options?: QueryOptions) => invoke<JournalEntry[]>('db:journal:findAll', options),
  findById: (id: string) => invoke<JournalEntry | null>('db:journal:findById', id),
  findByType: (entryType: string) => invoke<JournalEntry[]>('db:journal:findByType', entryType),
  getFavorites: () => invoke<JournalEntry[]>('db:journal:getFavorites'),
  create: (data: CreateJournalEntryInput) => invoke<JournalEntry>('db:journal:create', data),
  update: (id: string, data: UpdateJournalEntryInput) => invoke<JournalEntry>('db:journal:update', id, data),
  delete: (id: string) => invoke<void>('db:journal:delete', id),
  search: (query: string) => invoke<JournalEntry[]>('db:journal:search', query),
  count: () => invoke<number>('db:journal:count'),
};

// ============================================
// TRANSACTIONS API
// ============================================
export const transactionsApi = {
  findAll: (options?: QueryOptions) => invoke<Transaction[]>('db:transactions:findAll', options),
  findByCategory: (category: string) => invoke<Transaction[]>('db:transactions:findByCategory', category),
  findByDateRange: (startDate: Date, endDate: Date) =>
    invoke<Transaction[]>('db:transactions:findByDateRange', startDate.getTime(), endDate.getTime()),
  create: (data: CreateTransactionInput) => invoke<Transaction>('db:transactions:create', data),
  update: (id: string, data: UpdateTransactionInput) => invoke<Transaction>('db:transactions:update', id, data),
  delete: (id: string) => invoke<void>('db:transactions:delete', id),
  getBalance: () => invoke<number>('db:transactions:getBalance'),
  getBalanceByCategory: () => invoke<Record<string, number>>('db:transactions:getBalanceByCategory'),
};

// ============================================
// CARGO RUNS API
// ============================================
export const cargoApi = {
  findAll: (options?: QueryOptions) => invoke<CargoRun[]>('db:cargo:findAll', options),
  findById: (id: string) => invoke<CargoRun | null>('db:cargo:findById', id),
  findByStatus: (status: string) => invoke<CargoRun[]>('db:cargo:findByStatus', status),
  create: (data: CreateCargoRunInput) => invoke<CargoRun>('db:cargo:create', data),
  update: (id: string, data: UpdateCargoRunInput) => invoke<CargoRun>('db:cargo:update', id, data),
  complete: (id: string, sellPrice: number) => invoke<CargoRun>('db:cargo:complete', id, sellPrice),
  delete: (id: string) => invoke<void>('db:cargo:delete', id),
  search: (query: string) => invoke<CargoRun[]>('db:cargo:search', query),
};

// ============================================
// MISSIONS API
// ============================================
export const missionsApi = {
  findAll: (options?: QueryOptions) => invoke<Mission[]>('db:missions:findAll', options),
  findById: (id: string) => invoke<Mission | null>('db:missions:findById', id),
  findByStatus: (status: string) => invoke<Mission[]>('db:missions:findByStatus', status),
  getActive: () => invoke<Mission[]>('db:missions:getActive'),
  create: (data: CreateMissionInput) => invoke<Mission>('db:missions:create', data),
  update: (id: string, data: UpdateMissionInput) => invoke<Mission>('db:missions:update', id, data),
  complete: (id: string) => invoke<Mission>('db:missions:complete', id),
  delete: (id: string) => invoke<void>('db:missions:delete', id),
  search: (query: string) => invoke<Mission[]>('db:missions:search', query),
};

// ============================================
// SCREENSHOTS API
// ============================================
export const screenshotsApi = {
  findAll: (options?: QueryOptions) => invoke<Screenshot[]>('db:screenshots:findAll', options),
  findById: (id: string) => invoke<Screenshot | null>('db:screenshots:findById', id),
  getFavorites: () => invoke<Screenshot[]>('db:screenshots:getFavorites'),
  findByLocation: (locationId: string) => invoke<Screenshot[]>('db:screenshots:findByLocation', locationId),
  create: (data: CreateScreenshotInput) => invoke<Screenshot>('db:screenshots:create', data),
  update: (id: string, data: UpdateScreenshotInput) => invoke<Screenshot>('db:screenshots:update', id, data),
  delete: (id: string) => invoke<void>('db:screenshots:delete', id),
  search: (query: string) => invoke<Screenshot[]>('db:screenshots:search', query),
};

// ============================================
// SESSIONS API
// ============================================
export const sessionsApi = {
  findAll: (options?: QueryOptions) => invoke<Session[]>('db:sessions:findAll', options),
  findById: (id: string) => invoke<Session | null>('db:sessions:findById', id),
  getActive: () => invoke<Session | null>('db:sessions:getActive'),
  start: (startingBalance?: number) => invoke<Session>('db:sessions:start', startingBalance),
  end: (id: string, endingBalance?: number) => invoke<Session>('db:sessions:end', id, endingBalance),
  update: (id: string, data: UpdateSessionInput) => invoke<Session>('db:sessions:update', id, data),
  delete: (id: string) => invoke<void>('db:sessions:delete', id),
};
