import { Play, Pause, Square, RotateCcw } from 'lucide-react'
import { useSession } from '../../stores'

function formatSessionTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

interface StatusBarProps {
  balance?: string;
  location?: string;
  ship?: string;
}

export function StatusBar({
  balance = "0",
  location = "Unknown",
  ship = "None",
}: StatusBarProps) {
  const activeSession = useSession((s) => s.activeSession)
  const elapsedSeconds = useSession((s) => s.elapsedSeconds)
  const paused = useSession((s) => s.paused)
  const loading = useSession((s) => s.loading)
  const start = useSession((s) => s.start)
  const stop = useSession((s) => s.stop)
  const pause = useSession((s) => s.pause)
  const resume = useSession((s) => s.resume)
  const reset = useSession((s) => s.reset)

  const isActive = !!activeSession

  return (
    <footer className="h-9 bg-hull border-t border-subtle flex items-center px-5 text-[11px] gap-5">
      <StatusSegment>
        {isActive && !paused ? (
          <div className="w-1.5 h-1.5 rounded-full bg-teal-bright status-pulse glow-teal" />
        ) : isActive && paused ? (
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-text-faint" />
        )}
        <StatusLabel>Session</StatusLabel>
        <StatusValue>{formatSessionTime(elapsedSeconds)}</StatusValue>
        <div className="flex items-center gap-1 ml-1">
          {!isActive ? (
            <button
              onClick={() => start()}
              disabled={loading}
              className="text-text-muted hover:text-teal-bright transition-colors disabled:opacity-50"
              title="Start session"
            >
              <Play className="w-3 h-3" />
            </button>
          ) : (
            <>
              {paused ? (
                <button
                  onClick={() => resume()}
                  disabled={loading}
                  className="text-text-muted hover:text-teal-bright transition-colors disabled:opacity-50"
                  title="Resume session"
                >
                  <Play className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => pause()}
                  disabled={loading}
                  className="text-text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                  title="Pause session"
                >
                  <Pause className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => stop()}
                disabled={loading}
                className="text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                title="Stop session"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                onClick={() => reset()}
                disabled={loading}
                className="text-text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                title="Reset session"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Balance</StatusLabel>
        <StatusValue>{balance} aUEC</StatusValue>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Location</StatusLabel>
        <StatusValue>{location}</StatusValue>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Ship</StatusLabel>
        <StatusValue>{ship}</StatusValue>
      </StatusSegment>

      <a
        href="#about"
        className="ml-auto text-[9px] text-text-faint opacity-60 hover:opacity-100 hover:text-text-muted transition-opacity"
      >
        Unofficial Fan Tool
      </a>
    </footer>
  );
}

function StatusSegment({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function StatusLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display font-medium tracking-display uppercase text-[9px] text-text-muted">
      {children}
    </span>
  );
}

function StatusValue({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-text-secondary">{children}</span>;
}

function StatusDivider() {
  return <div className="w-px h-[18px] bg-text-faint opacity-30" />;
}
