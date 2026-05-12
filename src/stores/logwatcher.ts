import { create } from 'zustand';
import { logWatcherApi, type LogWatcherState, type LogWatcherSuggestion } from '../lib/logwatcher/api';

interface Store {
  state: LogWatcherState | null;
  loading: boolean;
  error: string | null;
  // Lifecycle
  initialize: () => Promise<void>;
  // Mutations (main process is the source of truth; push notifications keep us in sync)
  setEnabled: (enabled: boolean) => Promise<void>;
  setLogPath: (p: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  resolve: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  // Internal — invoked by the IPC listener
  _apply: (next: LogWatcherState) => void;
}

export const useLogWatcher = create<Store>((set) => {
  // Subscribe once; the unsubscribe isn't wired because the store lives for
  // the lifetime of the renderer window.
  const listener = (...args: unknown[]) => {
    const next = args[0] as LogWatcherState | undefined;
    if (next) set({ state: next });
  };
  window.ipcRenderer.on('logwatcher:update', listener);

  return {
    state: null,
    loading: false,
    error: null,

    initialize: async () => {
      set({ loading: true, error: null });
      try {
        const state = await logWatcherApi.getState();
        set({ state, loading: false });
      } catch (err) {
        set({ loading: false, error: String(err) });
      }
    },

    setEnabled: async (enabled) => {
      try {
        const state = await logWatcherApi.setEnabled(enabled);
        set({ state });
      } catch (err) {
        set({ error: String(err) });
      }
    },

    setLogPath: async (p) => {
      try {
        const state = await logWatcherApi.setLogPath(p);
        set({ state });
      } catch (err) {
        set({ error: String(err) });
      }
    },

    dismiss: async (id) => {
      await logWatcherApi.dismiss(id);
    },

    resolve: async (id) => {
      await logWatcherApi.resolve(id);
    },

    clearAll: async () => {
      await logWatcherApi.clearAll();
    },

    _apply: (next) => set({ state: next }),
  };
});

export type { LogWatcherSuggestion, LogWatcherState };
