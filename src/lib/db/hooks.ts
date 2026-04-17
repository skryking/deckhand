import { useState, useEffect, useCallback, useRef } from 'react';
import {
  shipsApi,
  locationsApi,
  journalApi,
  transactionsApi,
  cargoApi,
  missionsApi,
  screenshotsApi,
  sessionsApi,
  inventoryApi,
  blueprintsApi,
} from './api';
import { useQueryCache, type QueryKey } from './queryCache';
import type { QueryOptions, Ship, Location, ShipCurrentLocation, ShipAtLocation } from '../../types/database';

// ============================================
// GENERIC FETCH HOOK
// ============================================
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useFetch<T>(queryKey: QueryKey, fetchFn: () => Promise<T>): UseFetchResult<T> {
  const keyStr = JSON.stringify(queryKey);
  const version = useQueryCache((s) => s.versions[keyStr] ?? 0);
  const register = useQueryCache((s) => s.register);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep the latest fetcher in a ref so `refetch` is stable across renders.
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Ignore out-of-order responses (a later fetch finishing before an earlier one).
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (currentRequestId === requestIdRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  }, []);

  // Register this key with the cache on first use so `invalidateQueries` can find it.
  useEffect(() => {
    register(queryKey);
    // queryKey is covered by keyStr; registering with the raw key lets prefix
    // matching compare element-by-element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, keyStr]);

  // Refetch when the key changes OR when an invalidation bumps the version.
  useEffect(() => {
    refetch();
  }, [refetch, keyStr, version]);

  return { data, loading, error, refetch };
}

// ============================================
// SHIPS HOOKS
// ============================================
export function useShips() {
  return useFetch(['ships'], () => shipsApi.findAll());
}

export function useShipCurrentLocation(shipId: string | null) {
  return useFetch(
    ['ships', 'currentLocation', shipId],
    () => (shipId ? shipsApi.getCurrentLocation(shipId) : Promise.resolve(null))
  );
}

/**
 * Batched variant: fetch the current location for every ship in the list.
 * Re-fetches when the set of ship ids changes.
 */
export function useShipLocations(ships: Ship[] | null) {
  const idsKey = (ships ?? [])
    .map((s) => s.id)
    .sort()
    .join(',');

  return useFetch(['ships', 'currentLocations', idsKey], async () => {
    if (!ships || ships.length === 0) return {} as Record<string, ShipCurrentLocation | null>;
    const entries = await Promise.all(
      ships.map(async (ship) => {
        try {
          const loc = await shipsApi.getCurrentLocation(ship.id);
          return [ship.id, loc] as const;
        } catch {
          return [ship.id, null] as const;
        }
      })
    );
    return Object.fromEntries(entries) as Record<string, ShipCurrentLocation | null>;
  });
}

// ============================================
// LOCATIONS HOOKS
// ============================================
export function useLocations() {
  return useFetch(['locations'], () => locationsApi.findAll());
}

export function useLocation(id: string | null) {
  return useFetch(
    ['locations', 'byId', id],
    () => (id ? locationsApi.findById(id) : Promise.resolve(null))
  );
}

export function useShipsAtLocation(locationId: string | null) {
  return useFetch(
    ['locations', 'shipsAt', locationId],
    () => (locationId ? locationsApi.getShipsAtLocation(locationId) : Promise.resolve([]))
  );
}

/**
 * Batched variant: fetch ships-at-location for every location in the list.
 */
export function useShipsAtLocations(locations: Location[] | null) {
  const idsKey = (locations ?? [])
    .map((l) => l.id)
    .sort()
    .join(',');

  return useFetch(['locations', 'shipsAtAll', idsKey], async () => {
    if (!locations || locations.length === 0) return {} as Record<string, ShipAtLocation[]>;
    const entries = await Promise.all(
      locations.map(async (loc) => {
        try {
          const ships = await locationsApi.getShipsAtLocation(loc.id);
          return [loc.id, ships] as const;
        } catch {
          return [loc.id, [] as ShipAtLocation[]] as const;
        }
      })
    );
    return Object.fromEntries(entries) as Record<string, ShipAtLocation[]>;
  });
}

// ============================================
// JOURNAL HOOKS
// ============================================
export function useJournalEntries(options?: QueryOptions) {
  return useFetch(['journal', options?.limit ?? null, options?.offset ?? null], () =>
    journalApi.findAll(options)
  );
}

export function useJournalCount() {
  return useFetch(['journal', 'count'], () => journalApi.count());
}

// ============================================
// TRANSACTIONS HOOKS
// ============================================
export function useTransactions(options?: QueryOptions) {
  return useFetch(['transactions', options?.limit ?? null, options?.offset ?? null], () =>
    transactionsApi.findAll(options)
  );
}

export function useBalance() {
  return useFetch(['balance'], () => transactionsApi.getBalance());
}

// ============================================
// CARGO HOOKS
// ============================================
export function useCargoRuns(options?: QueryOptions) {
  return useFetch(['cargo', options?.limit ?? null, options?.offset ?? null], () =>
    cargoApi.findAll(options)
  );
}

// ============================================
// MISSIONS HOOKS
// ============================================
export function useMissions(options?: QueryOptions) {
  return useFetch(['missions', options?.limit ?? null, options?.offset ?? null], () =>
    missionsApi.findAll(options)
  );
}

// ============================================
// SCREENSHOTS HOOKS
// ============================================
export function useScreenshots(options?: QueryOptions) {
  return useFetch(['screenshots', options?.limit ?? null, options?.offset ?? null], () =>
    screenshotsApi.findAll(options)
  );
}

export function useScreenshotsByLocation(locationId: string) {
  return useFetch(['screenshots', 'byLocation', locationId], () =>
    screenshotsApi.findByLocation(locationId)
  );
}

export function useScreenshotsByShip(shipId: string | null) {
  return useFetch(['screenshots', 'byShip', shipId], () =>
    shipId ? screenshotsApi.findByShip(shipId) : Promise.resolve([])
  );
}

export function useScreenshotsByJournalEntry(journalEntryId: string | null) {
  return useFetch(['screenshots', 'byJournalEntry', journalEntryId], () =>
    journalEntryId ? screenshotsApi.findByJournalEntry(journalEntryId) : Promise.resolve([])
  );
}

// ============================================
// INVENTORY HOOKS
// ============================================
export function useInventory() {
  return useFetch(['inventory'], () => inventoryApi.findAll());
}

// ============================================
// BLUEPRINTS HOOKS
// ============================================
export function useBlueprints() {
  return useFetch(['blueprints'], () => blueprintsApi.findAll());
}

export function useBlueprintCraftability() {
  return useFetch(['blueprints', 'craftability'], () => blueprintsApi.getCraftability());
}

// ============================================
// SESSIONS HOOKS
// ============================================
export function useSessions(options?: QueryOptions) {
  return useFetch(['sessions', options?.limit ?? null, options?.offset ?? null], () =>
    sessionsApi.findAll(options)
  );
}

export function useActiveSession() {
  return useFetch(['sessions', 'active'], () => sessionsApi.getActive());
}
