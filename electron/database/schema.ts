import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================
// CORE TABLES
// ============================================

export const ships = sqliteTable('ships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  nickname: text('nickname'),
  variant: text('variant'),
  role: text('role'),
  isOwned: integer('is_owned', { mode: 'boolean' }).default(true),
  acquiredAt: integer('acquired_at', { mode: 'timestamp' }),
  acquiredPrice: integer('acquired_price'),
  notes: text('notes'),
  imagePath: text('image_path'),
  wikiUrl: text('wiki_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  type: text('type'), // 'system', 'planet', 'moon', 'station', 'outpost', 'city', 'landmark'
  services: text('services', { mode: 'json' }).$type<string[]>(),
  notes: text('notes'),
  // Coordinates (optional, per-axis with individual units)
  coordX: real('coord_x'),
  coordXUnit: text('coord_x_unit').$type<'km' | 'm'>(),
  coordY: real('coord_y'),
  coordYUnit: text('coord_y_unit').$type<'km' | 'm'>(),
  coordZ: real('coord_z'),
  coordZUnit: text('coord_z_unit').$type<'km' | 'm'>(),
  firstVisitedAt: integer('first_visited_at', { mode: 'timestamp' }),
  visitCount: integer('visit_count').default(0),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  wikiUrl: text('wiki_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  title: text('title'),
  content: text('content').notNull(),
  entryType: text('entry_type'), // 'journal', 'cargo', 'combat', 'acquisition', 'mining', 'scavenging'
  mood: text('mood'),
  locationId: text('location_id'),
  shipId: text('ship_id'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================
// FINANCIAL TABLES
// ============================================

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  amount: integer('amount').notNull(), // Positive = income, negative = expense
  category: text('category').notNull(), // 'cargo', 'mission', 'repair', 'fuel', 'purchase', 'sale', 'other'
  description: text('description'),
  locationId: text('location_id'),
  shipId: text('ship_id'),
  journalEntryId: text('journal_entry_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const cargoRuns = sqliteTable('cargo_runs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  commodity: text('commodity').notNull(),
  quantity: integer('quantity').notNull(), // SCU
  buyPrice: integer('buy_price').notNull(),
  sellPrice: integer('sell_price'),
  profit: integer('profit'),
  originLocationId: text('origin_location_id'),
  destinationLocationId: text('destination_location_id'),
  shipId: text('ship_id'),
  notes: text('notes'),
  status: text('status').default('in_progress'), // 'in_progress', 'completed', 'failed'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================
// ACTIVITY TABLES
// ============================================

export const missions = sqliteTable('missions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  missionType: text('mission_type'), // 'bounty', 'delivery', 'mining', 'salvage', 'investigation', 'escort'
  contractor: text('contractor'),
  reward: integer('reward'),
  status: text('status').default('active'), // 'active', 'completed', 'failed', 'abandoned'
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  locationId: text('location_id'),
  shipId: text('ship_id'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const screenshots = sqliteTable('screenshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  filePath: text('file_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  takenAt: integer('taken_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  caption: text('caption'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  locationId: text('location_id'),
  shipId: text('ship_id'),
  journalEntryId: text('journal_entry_id'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationMinutes: integer('duration_minutes'),
  startingBalance: integer('starting_balance'),
  endingBalance: integer('ending_balance'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================
// TYPE EXPORTS FOR INFERENCE
// ============================================

export type Ship = typeof ships.$inferSelect;
export type NewShip = typeof ships.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type CargoRun = typeof cargoRuns.$inferSelect;
export type NewCargoRun = typeof cargoRuns.$inferInsert;

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;

export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
