import { ipcRenderer, contextBridge } from 'electron'

// Whitelist of allowed IPC channels
const ALLOWED_INVOKE_CHANNELS = new Set([
  // Window controls
  'window-minimize',
  'window-maximize',
  'window-close',
  // Data management
  'data:openFolder',
  'data:export',
  'data:import',
  'data:clear',
  'data:getPath',
  // Screenshot file operations
  'screenshots:selectFiles',
  'screenshots:openFolder',
  'screenshots:deleteFile',
  // Database: Ships
  'db:ships:findAll',
  'db:ships:findById',
  'db:ships:create',
  'db:ships:update',
  'db:ships:delete',
  'db:ships:search',
  'db:ships:getCurrentLocation',
  'db:ships:getLocationHistory',
  // Database: Locations
  'db:locations:findAll',
  'db:locations:findById',
  'db:locations:findByParentId',
  'db:locations:getFavorites',
  'db:locations:create',
  'db:locations:update',
  'db:locations:delete',
  'db:locations:search',
  'db:locations:incrementVisit',
  'db:locations:getShipsAtLocation',
  // Database: Journal
  'db:journal:findAll',
  'db:journal:findById',
  'db:journal:findByType',
  'db:journal:getFavorites',
  'db:journal:create',
  'db:journal:update',
  'db:journal:delete',
  'db:journal:search',
  'db:journal:count',
  // Database: Transactions
  'db:transactions:findAll',
  'db:transactions:findByCategory',
  'db:transactions:findByDateRange',
  'db:transactions:create',
  'db:transactions:update',
  'db:transactions:delete',
  'db:transactions:getBalance',
  'db:transactions:getBalanceByCategory',
  // Database: Cargo
  'db:cargo:findAll',
  'db:cargo:findById',
  'db:cargo:findByStatus',
  'db:cargo:create',
  'db:cargo:update',
  'db:cargo:complete',
  'db:cargo:delete',
  'db:cargo:search',
  // Database: Missions
  'db:missions:findAll',
  'db:missions:findById',
  'db:missions:findByStatus',
  'db:missions:getActive',
  'db:missions:create',
  'db:missions:update',
  'db:missions:complete',
  'db:missions:delete',
  'db:missions:search',
  // Database: Screenshots
  'db:screenshots:findAll',
  'db:screenshots:findById',
  'db:screenshots:getFavorites',
  'db:screenshots:findByLocation',
  'db:screenshots:findByShip',
  'db:screenshots:findByJournalEntry',
  'db:screenshots:create',
  'db:screenshots:update',
  'db:screenshots:delete',
  'db:screenshots:search',
  // Database: Inventory
  'db:inventory:findAll',
  'db:inventory:findById',
  'db:inventory:create',
  'db:inventory:update',
  'db:inventory:adjustQuantity',
  'db:inventory:delete',
  // Database: Blueprints
  'db:blueprints:findAll',
  'db:blueprints:findById',
  'db:blueprints:create',
  'db:blueprints:update',
  'db:blueprints:delete',
  'db:blueprints:getCraftability',
  'db:blueprints:getCraftabilityForBlueprint',
  // Database: Sessions
  'db:sessions:findAll',
  'db:sessions:findById',
  'db:sessions:getActive',
  'db:sessions:start',
  'db:sessions:end',
  'db:sessions:update',
  'db:sessions:delete',
])

const ALLOWED_SEND_CHANNELS = new Set<string>([])

const ALLOWED_ON_CHANNELS = new Set([
  'main-process-message',
])

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: unknown[]) => void) {
    if (!ALLOWED_ON_CHANNELS.has(channel)) {
      console.warn(`[Preload] Blocked ipcRenderer.on for channel: ${channel}`)
      return
    }
    ipcRenderer.on(channel, (_event, ...args) => listener(...args))
  },
  off(channel: string, listener: (...args: unknown[]) => void) {
    ipcRenderer.off(channel, listener)
  },
  send(channel: string, ...args: unknown[]) {
    if (!ALLOWED_SEND_CHANNELS.has(channel)) {
      console.warn(`[Preload] Blocked ipcRenderer.send for channel: ${channel}`)
      return
    }
    ipcRenderer.send(channel, ...args)
  },
  invoke(channel: string, ...args: unknown[]) {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  },
})
