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
import type { QueryOptions } from '../../types/database';

// ============================================
// GENERIC FETCH HOOK
// ============================================
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Store fetchFn in a ref to avoid stale closure issues
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Track request sequence to ignore stale responses
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      // Only update state if this is still the latest request
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

  // Re-fetch when deps change
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    refetch();
  }, [refetch, depsKey]);

  return { data, loading, error, refetch };
}

// ============================================
// SHIPS HOOKS
// ============================================
export function useShips() {
  return useFetch(() => shipsApi.findAll(), []);
}

export function useShipCurrentLocation(shipId: string | null) {
  return useFetch(
    () => (shipId ? shipsApi.getCurrentLocation(shipId) : Promise.resolve(null)),
    [shipId]
  );
}

// ============================================
// LOCATIONS HOOKS
// ============================================
export function useLocations() {
  return useFetch(() => locationsApi.findAll(), []);
}

export function useLocation(id: string | null) {
  return useFetch(
    () => (id ? locationsApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useShipsAtLocation(locationId: string | null) {
  return useFetch(
    () => (locationId ? locationsApi.getShipsAtLocation(locationId) : Promise.resolve([])),
    [locationId]
  );
}

// ============================================
// JOURNAL HOOKS
// ============================================
export function useJournalEntries(options?: QueryOptions) {
  return useFetch(
    () => journalApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

export function useJournalCount() {
  return useFetch(() => journalApi.count(), []);
}

// ============================================
// TRANSACTIONS HOOKS
// ============================================
export function useTransactions(options?: QueryOptions) {
  return useFetch(
    () => transactionsApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

export function useBalance() {
  return useFetch(() => transactionsApi.getBalance(), []);
}

// ============================================
// CARGO HOOKS
// ============================================
export function useCargoRuns(options?: QueryOptions) {
  return useFetch(
    () => cargoApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

// ============================================
// MISSIONS HOOKS
// ============================================
export function useMissions(options?: QueryOptions) {
  return useFetch(
    () => missionsApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

// ============================================
// SCREENSHOTS HOOKS
// ============================================
export function useScreenshots(options?: QueryOptions) {
  return useFetch(
    () => screenshotsApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

export function useScreenshotsByLocation(locationId: string) {
  return useFetch(
    () => screenshotsApi.findByLocation(locationId),
    [locationId]
  );
}

export function useScreenshotsByShip(shipId: string | null) {
  return useFetch(
    () => (shipId ? screenshotsApi.findByShip(shipId) : Promise.resolve([])),
    [shipId]
  );
}

export function useScreenshotsByJournalEntry(journalEntryId: string | null) {
  return useFetch(
    () => (journalEntryId ? screenshotsApi.findByJournalEntry(journalEntryId) : Promise.resolve([])),
    [journalEntryId]
  );
}

// ============================================
// INVENTORY HOOKS
// ============================================
export function useInventory() {
  return useFetch(() => inventoryApi.findAll(), []);
}

// ============================================
// BLUEPRINTS HOOKS
// ============================================
export function useBlueprints() {
  return useFetch(() => blueprintsApi.findAll(), []);
}

export function useBlueprintCraftability() {
  return useFetch(() => blueprintsApi.getCraftability(), []);
}

// ============================================
// SESSIONS HOOKS
// ============================================
export function useSessions(options?: QueryOptions) {
  return useFetch(
    () => sessionsApi.findAll(options),
    [options?.limit, options?.offset]
  );
}

export function useActiveSession() {
  return useFetch(() => sessionsApi.getActive(), []);
}
