import { create } from 'zustand'
import { sessionsApi } from '../lib/db/api'
import { useRefresh } from './navigation'
import type { Session } from '../types/database'

interface SessionState {
  activeSession: Session | null
  elapsedSeconds: number
  paused: boolean
  loading: boolean
  // Accumulated seconds from previous running segments (before pauses)
  _accumulatedSeconds: number
  // Timestamp (ms) when the current running segment started
  _segmentStart: number | null
  _intervalId: ReturnType<typeof setInterval> | null

  initialize: () => Promise<void>
  start: (startingBalance?: number) => Promise<void>
  stop: (endingBalance?: number) => Promise<void>
  pause: () => void
  resume: () => void
  reset: () => Promise<void>
  _tick: () => void
  _startTimer: () => void
  _stopTimer: () => void
}

export const useSession = create<SessionState>((set, get) => ({
  activeSession: null,
  elapsedSeconds: 0,
  paused: false,
  loading: false,
  _accumulatedSeconds: 0,
  _segmentStart: null,
  _intervalId: null,

  initialize: async () => {
    try {
      const session = await sessionsApi.getActive()
      if (session) {
        const start = new Date(session.startedAt).getTime()
        const elapsed = Math.floor((Date.now() - start) / 1000)
        set({
          activeSession: session,
          elapsedSeconds: elapsed,
          paused: false,
          _accumulatedSeconds: 0,
          _segmentStart: start,
        })
        get()._startTimer()
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
        _accumulatedSeconds: 0,
        _segmentStart: Date.now(),
      })
      get()._startTimer()
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
      get()._stopTimer()
      set({
        activeSession: null,
        elapsedSeconds: 0,
        paused: false,
        loading: false,
        _accumulatedSeconds: 0,
        _segmentStart: null,
      })
      useRefresh.getState().invalidateSessions()
    } catch {
      set({ loading: false })
    }
  },

  pause: () => {
    const { activeSession, _accumulatedSeconds, _segmentStart } = get()
    if (!activeSession || !_segmentStart) return
    const segmentElapsed = Math.floor((Date.now() - _segmentStart) / 1000)
    const total = _accumulatedSeconds + segmentElapsed
    get()._stopTimer()
    set({
      paused: true,
      elapsedSeconds: total,
      _accumulatedSeconds: total,
      _segmentStart: null,
    })
  },

  resume: () => {
    const { activeSession, paused } = get()
    if (!activeSession || !paused) return
    set({
      paused: false,
      _segmentStart: Date.now(),
    })
    get()._startTimer()
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
        _accumulatedSeconds: 0,
        _segmentStart: Date.now(),
      })
      useRefresh.getState().invalidateSessions()
    } catch {
      set({ loading: false })
    }
  },

  _tick: () => {
    const { _accumulatedSeconds, _segmentStart } = get()
    if (_segmentStart) {
      const segmentElapsed = Math.floor((Date.now() - _segmentStart) / 1000)
      set({ elapsedSeconds: _accumulatedSeconds + segmentElapsed })
    }
  },

  _startTimer: () => {
    get()._stopTimer()
    const id = setInterval(() => get()._tick(), 1000)
    set({ _intervalId: id })
  },

  _stopTimer: () => {
    const { _intervalId } = get()
    if (_intervalId) {
      clearInterval(_intervalId)
      set({ _intervalId: null })
    }
  },
}))
