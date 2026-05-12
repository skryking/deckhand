import type { DbResponse } from '../../types/database';

export interface LogWatcherSuggestion {
  id: string;
  kind: 'session-start' | 'session-end' | 'ship' | 'location' | 'character' | 'version';
  detectedAt: string;
  summary: string;
  payload: Record<string, unknown>;
  signature: string;
}

export interface LogWatcherState {
  running: boolean;
  enabled: boolean;
  logPath: string;
  lastOffset: number;
  fileExists: boolean;
  fileSize: number;
  suggestions: LogWatcherSuggestion[];
}

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const response = (await window.ipcRenderer.invoke(channel, ...args)) as DbResponse<T>;
  if (!response.success) {
    throw new Error(response.error || `logwatcher ${channel} failed`);
  }
  return response.data as T;
}

export const logWatcherApi = {
  getState: () => invoke<LogWatcherState>('logwatcher:getState'),
  setEnabled: (enabled: boolean) => invoke<LogWatcherState>('logwatcher:setEnabled', enabled),
  setLogPath: (p: string) => invoke<LogWatcherState>('logwatcher:setLogPath', p),
  dismiss: (id: string) => invoke<void>('logwatcher:dismiss', id),
  resolve: (id: string) => invoke<void>('logwatcher:resolve', id),
  clearAll: () => invoke<void>('logwatcher:clearAll'),
};
