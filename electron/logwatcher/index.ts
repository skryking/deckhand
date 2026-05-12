import { app, ipcMain, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { LogWatcher, defaultLogPath, type Suggestion, type WatcherState } from './watcher';

interface StoredSettings {
  enabled: boolean;
  logPath: string;
}

// Lightweight JSON store for user preferences. Lives alongside the DB file so
// backups can be manual.
function settingsFile(): string {
  return path.join(app.getPath('userData'), 'logwatcher.json');
}

function loadSettings(): StoredSettings {
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      enabled: parsed.enabled ?? false,
      logPath: parsed.logPath ?? defaultLogPath(),
    };
  } catch {
    return { enabled: false, logPath: defaultLogPath() };
  }
}

function saveSettings(s: StoredSettings): void {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
  } catch (err) {
    console.error('[LogWatcher] failed to save settings:', err);
  }
}

let watcher: LogWatcher | null = null;

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

function getOrCreate(): LogWatcher {
  if (!watcher) {
    const { logPath } = loadSettings();
    watcher = new LogWatcher(logPath);
    watcher.on('change', () => {
      broadcast('logwatcher:update', stateSnapshot());
    });
  }
  return watcher;
}

function stateSnapshot(): WatcherState & { enabled: boolean } {
  const w = getOrCreate();
  const settings = loadSettings();
  return { ...w.getState(), enabled: settings.enabled };
}

export function registerLogWatcherHandlers(): void {
  ipcMain.handle('logwatcher:getState', () => ({ success: true, data: stateSnapshot() }));

  ipcMain.handle('logwatcher:setEnabled', (_, enabled: boolean) => {
    const settings = loadSettings();
    settings.enabled = Boolean(enabled);
    saveSettings(settings);
    const w = getOrCreate();
    if (settings.enabled) {
      w.start({ replayHistory: true });
    } else {
      w.stop();
    }
    broadcast('logwatcher:update', stateSnapshot());
    return { success: true, data: stateSnapshot() };
  });

  ipcMain.handle('logwatcher:setLogPath', (_, logPath: string) => {
    const settings = loadSettings();
    settings.logPath = logPath;
    saveSettings(settings);
    getOrCreate().setLogPath(logPath);
    broadcast('logwatcher:update', stateSnapshot());
    return { success: true, data: stateSnapshot() };
  });

  ipcMain.handle('logwatcher:dismiss', (_, id: string) => {
    getOrCreate().dismiss(id);
    return { success: true };
  });

  ipcMain.handle('logwatcher:resolve', (_, id: string) => {
    getOrCreate().resolve(id);
    return { success: true };
  });

  ipcMain.handle('logwatcher:clearAll', () => {
    getOrCreate().clearAll();
    return { success: true };
  });

  // Auto-start on app boot if the user previously enabled it.
  const settings = loadSettings();
  if (settings.enabled) {
    getOrCreate().start({ replayHistory: true });
  }

  console.log('[LogWatcher] handlers registered');
}

export type { Suggestion, WatcherState };
