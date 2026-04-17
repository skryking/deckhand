import { useEffect } from 'react'
import { useSession } from './session'

/**
 * Drives the once-per-second update of `elapsedSeconds` in the session store
 * while a session is active and unpaused. Mount this hook exactly once
 * (top-level in App) so a single interval is shared across the app.
 */
export function useSessionTicker(): void {
  const activeSessionId = useSession((s) => s.activeSession?.id ?? null)
  const paused = useSession((s) => s.paused)
  const segmentStart = useSession((s) => s.segmentStart)

  useEffect(() => {
    if (!activeSessionId || paused || !segmentStart) return

    const tick = () => {
      const { accumulatedSeconds } = useSession.getState()
      const segmentElapsed = Math.floor((Date.now() - segmentStart) / 1000)
      useSession.setState({ elapsedSeconds: accumulatedSeconds + segmentElapsed })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeSessionId, paused, segmentStart])
}
