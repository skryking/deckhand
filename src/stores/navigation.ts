import { create } from 'zustand'

export type NavId =
  | 'home'
  | 'log'
  | 'fleet'
  | 'atlas'
  | 'ledger'
  | 'cargo'
  | 'jobs'
  | 'gallery'
  | 'config'

interface NavigationState {
  activeView: NavId
  setActiveView: (view: NavId) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  activeView: 'home',
  setActiveView: (view) => set({ activeView: view }),
}))

// Store for triggering data refreshes across components
interface RefreshState {
  balanceVersion: number
  invalidateBalance: () => void
}

export const useRefresh = create<RefreshState>((set) => ({
  balanceVersion: 0,
  invalidateBalance: () => set((state) => ({ balanceVersion: state.balanceVersion + 1 })),
}))
