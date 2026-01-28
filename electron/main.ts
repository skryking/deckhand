import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { initializeDatabase, closeDatabase, getDbPath, getDatabase } from './database'
import { registerDatabaseHandlers } from './database/handlers'
import { schema } from './database'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#08090c',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Window control IPC handlers
ipcMain.handle('window-minimize', () => {
  win?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  win?.close()
})

// Clean up database on quit
app.on('before-quit', () => {
  closeDatabase()
})

// ============================================
// DATA BACKUP / RESTORE HANDLERS
// ============================================

// Open the database folder in file explorer
ipcMain.handle('data:openFolder', async () => {
  const dbPath = getDbPath()
  const dbDir = path.dirname(dbPath)
  await shell.openPath(dbDir)
  return { success: true }
})

// Export all data to JSON file
ipcMain.handle('data:export', async () => {
  try {
    const db = getDatabase()

    // Collect all data from tables
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        ships: db.select().from(schema.ships).all(),
        locations: db.select().from(schema.locations).all(),
        journalEntries: db.select().from(schema.journalEntries).all(),
        transactions: db.select().from(schema.transactions).all(),
        cargoRuns: db.select().from(schema.cargoRuns).all(),
        missions: db.select().from(schema.missions).all(),
        screenshots: db.select().from(schema.screenshots).all(),
        sessions: db.select().from(schema.sessions).all(),
      }
    }

    // Show save dialog
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Deckhand Data',
      defaultPath: `deckhand-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    // Write to file
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2))

    return { success: true, filePath: result.filePath }
  } catch (error) {
    console.error('[Data Export] Error:', error)
    return { success: false, error: String(error) }
  }
})

// Import data from JSON file
ipcMain.handle('data:import', async () => {
  try {
    // Show open dialog
    const result = await dialog.showOpenDialog(win!, {
      title: 'Import Deckhand Data',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' }
    }

    // Read and parse file
    const fileContent = fs.readFileSync(result.filePaths[0], 'utf-8')
    const importData = JSON.parse(fileContent)

    // Validate structure
    if (!importData.version || !importData.data) {
      return { success: false, error: 'Invalid backup file format' }
    }

    const db = getDatabase()

    // Clear existing data and import new data
    // Using transactions for atomicity
    db.delete(schema.ships).run()
    db.delete(schema.locations).run()
    db.delete(schema.journalEntries).run()
    db.delete(schema.transactions).run()
    db.delete(schema.cargoRuns).run()
    db.delete(schema.missions).run()
    db.delete(schema.screenshots).run()
    db.delete(schema.sessions).run()

    // Import data
    const data = importData.data

    if (data.ships?.length) {
      for (const ship of data.ships) {
        db.insert(schema.ships).values(ship).run()
      }
    }
    if (data.locations?.length) {
      for (const location of data.locations) {
        db.insert(schema.locations).values(location).run()
      }
    }
    if (data.journalEntries?.length) {
      for (const entry of data.journalEntries) {
        db.insert(schema.journalEntries).values(entry).run()
      }
    }
    if (data.transactions?.length) {
      for (const transaction of data.transactions) {
        db.insert(schema.transactions).values(transaction).run()
      }
    }
    if (data.cargoRuns?.length) {
      for (const run of data.cargoRuns) {
        db.insert(schema.cargoRuns).values(run).run()
      }
    }
    if (data.missions?.length) {
      for (const mission of data.missions) {
        db.insert(schema.missions).values(mission).run()
      }
    }
    if (data.screenshots?.length) {
      for (const screenshot of data.screenshots) {
        db.insert(schema.screenshots).values(screenshot).run()
      }
    }
    if (data.sessions?.length) {
      for (const session of data.sessions) {
        db.insert(schema.sessions).values(session).run()
      }
    }

    return { success: true, importedAt: importData.exportedAt }
  } catch (error) {
    console.error('[Data Import] Error:', error)
    return { success: false, error: String(error) }
  }
})

// Clear all data
ipcMain.handle('data:clear', async () => {
  try {
    const db = getDatabase()

    db.delete(schema.ships).run()
    db.delete(schema.locations).run()
    db.delete(schema.journalEntries).run()
    db.delete(schema.transactions).run()
    db.delete(schema.cargoRuns).run()
    db.delete(schema.missions).run()
    db.delete(schema.screenshots).run()
    db.delete(schema.sessions).run()

    return { success: true }
  } catch (error) {
    console.error('[Data Clear] Error:', error)
    return { success: false, error: String(error) }
  }
})

// Get database path
ipcMain.handle('data:getPath', () => {
  return { success: true, path: getDbPath() }
})

app.whenReady().then(() => {
  // Initialize database before creating window
  try {
    initializeDatabase()
    registerDatabaseHandlers()
    console.log('[Main] Database ready')
  } catch (error) {
    console.error('[Main] Database initialization failed:', error)
    app.quit()
    return
  }

  createWindow()
})
