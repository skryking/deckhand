import { create } from 'zustand'

export type NavId =
  | 'home'
  | 'log'
  | 'fleet'
  | 'atlas'
  | 'ledger'
  | 'cargo'
  | 'jobs'
  | 'mining'
  | 'workshop'
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
