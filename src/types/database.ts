// ============================================
// ENTITY TYPES
// ============================================

export interface Ship {
  id: string;
  manufacturer: string;
  model: string;
  nickname: string | null;
  variant: string | null;
  role: string | null;
  isOwned: boolean | null;
  acquiredAt: Date | null;
  acquiredPrice: number | null;
  notes: string | null;
  imagePath: string | null;
  wikiUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Location {
  id: string;
  parentId: string | null;
  name: string;
  type: string | null;
  services: string[] | null;
  notes: string | null;
  // Coordinates (optional, per-axis with individual units)
  coordX: number | null;
  coordXUnit: 'km' | 'm' | null;
  coordY: number | null;
  coordYUnit: 'km' | 'm' | null;
  coordZ: number | null;
  coordZUnit: 'km' | 'm' | null;
  firstVisitedAt: Date | null;
  visitCount: number | null;
  isFavorite: boolean | null;
  wikiUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface JournalEntry {
  id: string;
  timestamp: Date;
  title: string | null;
  content: string;
  entryType: string | null;
  mood: string | null;
  locationId: string | null;
  shipId: string | null;
  tags: string[] | null;
  isFavorite: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  category: string;
  description: string | null;
  locationId: string | null;
  shipId: string | null;
  journalEntryId: string | null;
  createdAt: Date | null;
}

export interface CargoRun {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  commodity: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number | null;
  profit: number | null;
  originLocationId: string | null;
  destinationLocationId: string | null;
  shipId: string | null;
  notes: string | null;
  status: string | null;
  createdAt: Date | null;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  missionType: string | null;
  contractor: string | null;
  reward: number | null;
  status: string | null;
  acceptedAt: Date | null;
  completedAt: Date | null;
  locationId: string | null;
  shipId: string | null;
  notes: string | null;
  createdAt: Date | null;
}

export interface Screenshot {
  id: string;
  filePath: string;
  thumbnailPath: string | null;
  takenAt: Date | null;
  caption: string | null;
  tags: string[] | null;
  locationId: string | null;
  shipId: string | null;
  journalEntryId: string | null;
  isFavorite: boolean | null;
  createdAt: Date | null;
}

export interface Session {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  startingBalance: number | null;
  endingBalance: number | null;
  notes: string | null;
  createdAt: Date | null;
}

// ============================================
// INPUT TYPES (for create/update operations)
// ============================================

export type CreateShipInput = Omit<Ship, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateShipInput = Partial<CreateShipInput>;

export type CreateLocationInput = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateLocationInput = Partial<CreateLocationInput>;

export type CreateJournalEntryInput = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;

export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt'>;
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type CreateCargoRunInput = Omit<CargoRun, 'id' | 'createdAt'>;
export type UpdateCargoRunInput = Partial<CreateCargoRunInput>;

export type CreateMissionInput = Omit<Mission, 'id' | 'createdAt'>;
export type UpdateMissionInput = Partial<CreateMissionInput>;

export type CreateScreenshotInput = Omit<Screenshot, 'id' | 'createdAt'>;
export type UpdateScreenshotInput = Partial<CreateScreenshotInput>;

export type CreateSessionInput = Omit<Session, 'id' | 'createdAt'>;
export type UpdateSessionInput = Partial<CreateSessionInput>;

// ============================================
// IPC RESPONSE TYPE
// ============================================

export interface DbResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// QUERY OPTIONS
// ============================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
