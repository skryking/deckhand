import { create } from 'zustand'
import { sessionsApi } from '../lib/db/api'
import { invalidateQueries } from '../lib/db/queryCache'
import type { Session } from '../types/database'

interface SessionState {
  activeSession: Session | null
  elapsedSeconds: number
  paused: boolean
  loading: boolean
  // Seconds accumulated from previously running segments (before pauses).
  accumulatedSeconds: number
  // Timestamp (ms) when the current running segment started, or null when paused/stopped.
  segmentStart: number | null

  initialize: () => Promise<void>
  start: (startingBalance?: number) => Promise<void>
  stop: (endingBalance?: number) => Promise<void>
  pause: () => void
  resume: () => void
  reset: () => Promise<void>
}

export const useSession = create<SessionState>((set, get) => ({
  activeSession: null,
  elapsedSeconds: 0,
  paused: false,
  loading: false,
  accumulatedSeconds: 0,
  segmentStart: null,

  initialize: async () => {
    try {
      const session = await sessionsApi.getActive()
      if (session) {
        const start = new Date(session.startedAt).getTime()
        set({
          activeSession: session,
          elapsedSeconds: Math.floor((Date.now() - start) / 1000),
          paused: false,
          accumulatedSeconds: 0,
          segmentStart: start,
        })
      }
    } catch {
      // No active session
    }
  },

  start: async (startingBalance?: number) => {
    set({ loading: true })
    try {
      const session = await sessionsApi.start(startingBalance)
      set({
        activeSession: session,
        elapsedSeconds: 0,
        paused: false,
        loading: false,
        accumulatedSeconds: 0,
        segmentStart: Date.now(),
      })
    } catch {
      set({ loading: false })
    }
  },

  stop: async (endingBalance?: number) => {
    const { activeSession } = get()
    if (!activeSession) return
    set({ loading: true })
    try {
      await sessionsApi.end(activeSession.id, endingBalance)
      set({
        activeSession: null,
        elapsedSeconds: 0,
        paused: false,
        loading: false,
        accumulatedSeconds: 0,
        segmentStart: null,
      })
      invalidateQueries(['sessions'])
    } catch {
      set({ loading: false })
    }
  },

  pause: () => {
    const { activeSession, accumulatedSeconds, segmentStart } = get()
    if (!activeSession || !segmentStart) return
    const segmentElapsed = Math.floor((Date.now() - segmentStart) / 1000)
    const total = accumulatedSeconds + segmentElapsed
    set({
      paused: true,
      elapsedSeconds: total,
      accumulatedSeconds: total,
      segmentStart: null,
    })
  },

  resume: () => {
    const { activeSession, paused } = get()
    if (!activeSession || !paused) return
    set({
      paused: false,
      segmentStart: Date.now(),
    })
  },

  reset: async () => {
    const { activeSession } = get()
    if (!activeSession) return
    set({ loading: true })
    try {
      await sessionsApi.end(activeSession.id)
      const session = await sessionsApi.start(activeSession.startingBalance ?? undefined)
      set({
        activeSession: session,
        elapsedSeconds: 0,
        paused: false,
        loading: false,
        accumulatedSeconds: 0,
        segmentStart: Date.now(),
      })
      invalidateQueries(['sessions'])
    } catch {
      set({ loading: false })
    }
  },
}))
