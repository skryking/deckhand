import { create } from 'zustand';

export type QueryKey = readonly (string | number | null | undefined)[];

/**
 * Minimal key-based cache store. Each `useFetch` subscribes to the version
 * counter for its key; `invalidateQueries(prefix)` bumps the counter for any
 * registered key that starts with `prefix`, which causes subscribed hooks to
 * refetch.
 *
 * This is intentionally small: no data storage, no stale-while-revalidate,
 * no retries. The `useFetch` hook still owns its own data/loading state.
 * The only thing this store tracks is "has this key been invalidated since
 * the last fetch?" — answered via a monotonic version counter.
 */

interface QueryCacheState {
  versions: Record<string, number>;
  registry: Record<string, QueryKey>;
}

interface QueryCacheActions {
  register: (key: QueryKey) => void;
  invalidate: (prefix: QueryKey) => void;
}

export const useQueryCache = create<QueryCacheState & QueryCacheActions>((set, get) => ({
  versions: {},
  registry: {},

  register: (key) => {
    const str = JSON.stringify(key);
    if (str in get().registry) return;
    set((s) => ({
      versions: { ...s.versions, [str]: 0 },
      registry: { ...s.registry, [str]: key },
    }));
  },

  invalidate: (prefix) => {
    set((state) => {
      const newVersions = { ...state.versions };
      let changed = false;
      for (const [keyStr, rawKey] of Object.entries(state.registry)) {
        if (isPrefix(prefix, rawKey)) {
          newVersions[keyStr] = (newVersions[keyStr] ?? 0) + 1;
          changed = true;
        }
      }
      return changed ? { versions: newVersions } : state;
    });
  },
}));

function isPrefix(prefix: QueryKey, full: QueryKey): boolean {
  if (prefix.length > full.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== full[i]) return false;
  }
  return true;
}

/**
 * Bump the version for every registered query whose key begins with `prefix`.
 * Matching hooks refetch on their next render.
 */
export function invalidateQueries(prefix: QueryKey): void {
  useQueryCache.getState().invalidate(prefix);
}
