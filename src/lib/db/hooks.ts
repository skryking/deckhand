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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
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

export function useShip(id: string | null) {
  return useFetch(
    () => (id ? shipsApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useShipSearch(query: string) {
  return useFetch(
    () => (query ? shipsApi.search(query) : Promise.resolve([])),
    [query]
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

export function useLocationChildren(parentId: string | null) {
  return useFetch(() => locationsApi.findByParentId(parentId), [parentId]);
}

export function useFavoriteLocations() {
  return useFetch(() => locationsApi.getFavorites(), []);
}

export function useLocationSearch(query: string) {
  return useFetch(
    () => (query ? locationsApi.search(query) : Promise.resolve([])),
    [query]
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

export function useJournalEntry(id: string | null) {
  return useFetch(
    () => (id ? journalApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useJournalEntriesByType(entryType: string) {
  return useFetch(() => journalApi.findByType(entryType), [entryType]);
}

export function useFavoriteJournalEntries() {
  return useFetch(() => journalApi.getFavorites(), []);
}

export function useJournalSearch(query: string) {
  return useFetch(
    () => (query ? journalApi.search(query) : Promise.resolve([])),
    [query]
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

export function useTransactionsByCategory(category: string) {
  return useFetch(() => transactionsApi.findByCategory(category), [category]);
}

export function useBalance() {
  return useFetch(() => transactionsApi.getBalance(), []);
}

export function useBalanceByCategory() {
  return useFetch(() => transactionsApi.getBalanceByCategory(), []);
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

export function useCargoRun(id: string | null) {
  return useFetch(
    () => (id ? cargoApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useCargoRunsByStatus(status: string) {
  return useFetch(() => cargoApi.findByStatus(status), [status]);
}

export function useActiveCargoRuns() {
  return useFetch(() => cargoApi.findByStatus('in_progress'), []);
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

export function useMission(id: string | null) {
  return useFetch(
    () => (id ? missionsApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useActiveMissions() {
  return useFetch(() => missionsApi.getActive(), []);
}

export function useMissionsByStatus(status: string) {
  return useFetch(() => missionsApi.findByStatus(status), [status]);
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

export function useScreenshot(id: string | null) {
  return useFetch(
    () => (id ? screenshotsApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useFavoriteScreenshots() {
  return useFetch(() => screenshotsApi.getFavorites(), []);
}

export function useScreenshotsByLocation(locationId: string) {
  return useFetch(
    () => screenshotsApi.findByLocation(locationId),
    [locationId]
  );
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

export function useSession(id: string | null) {
  return useFetch(
    () => (id ? sessionsApi.findById(id) : Promise.resolve(null)),
    [id]
  );
}

export function useActiveSession() {
  return useFetch(() => sessionsApi.getActive(), []);
}
