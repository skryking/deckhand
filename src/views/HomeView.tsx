import { useEffect, useMemo } from 'react'
import { BookOpen, Ship, Globe, Wallet, Package, Target, Image, Clock, Play, Pause, Square, RotateCcw } from 'lucide-react'
import { StatCard } from '../components/ui'
import { useNavigation, useSession, useRefresh } from '../stores'
import { useJournalCount, useShips, useLocations, useBalance, useJournalEntries, useTransactions, useMissions, useSessions } from '../lib/db/hooks'
import { formatSessionTime } from '../lib/format'
import type { JournalEntry, Transaction, Mission, Session } from '../types/database'

interface QuickLinkProps {
  icon: React.ReactNode
  label: string
  viewId: 'log' | 'fleet' | 'atlas' | 'ledger' | 'cargo' | 'jobs' | 'gallery'
}

function QuickLink({ icon, label, viewId }: QuickLinkProps) {
  const setActiveView = useNavigation((s) => s.setActiveView)

  return (
    <button
      onClick={() => setActiveView(viewId)}
      className="flex flex-col items-center gap-2 p-4 bg-panel border border-subtle rounded hover:border-teal-bright/30 hover:bg-teal-bright/5 transition-all cursor-pointer group"
    >
      <span className="text-text-muted group-hover:text-teal-bright transition-colors">
        {icon}
      </span>
      <span className="font-display text-xs tracking-display text-text-secondary group-hover:text-text-primary">
        {label}
      </span>
    </button>
  )
}

type ActivityItem = {
  id: string
  type: 'journal' | 'transaction' | 'mission' | 'session'
  label: string
  detail: string | null
  timestamp: Date
  viewId: 'log' | 'ledger' | 'jobs' | 'home'
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function toActivityItems(
  journal: JournalEntry[] | null,
  transactions: Transaction[] | null,
  missions: Mission[] | null,
  sessions: Session[] | null,
): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const j of journal ?? []) {
    items.push({
      id: j.id,
      type: 'journal',
      label: j.title || 'Untitled Entry',
      detail: j.entryType,
      timestamp: new Date(j.timestamp),
      viewId: 'log',
    })
  }

  for (const t of transactions ?? []) {
    const sign = t.amount >= 0 ? '+' : ''
    items.push({
      id: t.id,
      type: 'transaction',
      label: t.description || t.category,
      detail: `${sign}${t.amount.toLocaleString()} aUEC`,
      timestamp: new Date(t.timestamp),
      viewId: 'ledger',
    })
  }

  for (const m of missions ?? []) {
    items.push({
      id: m.id,
      type: 'mission',
      label: m.title,
      detail: m.status,
      timestamp: new Date(m.acceptedAt ?? m.createdAt ?? new Date()),
      viewId: 'jobs',
    })
  }

  for (const s of sessions ?? []) {
    if (!s.endedAt) continue
    items.push({
      id: s.id,
      type: 'session',
      label: 'Gaming Session',
      detail: formatDuration(s.durationMinutes),
      timestamp: new Date(s.endedAt),
      viewId: 'home',
    })
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return items.slice(0, 10)
}

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

const activityIcons: Record<ActivityItem['type'], React.ReactNode> = {
  journal: <BookOpen className="w-4 h-4" />,
  transaction: <Wallet className="w-4 h-4" />,
  mission: <Target className="w-4 h-4" />,
  session: <Clock className="w-4 h-4" />,
}

export function HomeView() {
  const setActiveView = useNavigation((s) => s.setActiveView)
  const activeSession = useSession((s) => s.activeSession)
  const elapsedSeconds = useSession((s) => s.elapsedSeconds)
  const sessionPaused = useSession((s) => s.paused)
  const sessionLoading = useSession((s) => s.loading)
  const startSession = useSession((s) => s.start)
  const stopSession = useSession((s) => s.stop)
  const pauseSession = useSession((s) => s.pause)
  const resumeSession = useSession((s) => s.resume)
  const resetSession = useSession((s) => s.reset)
  const isActive = !!activeSession
  const { data: journalCount } = useJournalCount()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()
  const { data: balance } = useBalance()
  const { data: recentJournal } = useJournalEntries({ limit: 5 })
  const { data: recentTransactions } = useTransactions({ limit: 5 })
  const { data: recentMissions } = useMissions({ limit: 5 })
  const { data: recentSessions, refetch: refetchSessions } = useSessions({ limit: 5 })
  const sessionVersion = useRefresh((s) => s.sessionVersion)

  useEffect(() => {
    if (sessionVersion > 0) {
      refetchSessions()
    }
  }, [sessionVersion, refetchSessions])

  const activityItems = useMemo(
    () => toActivityItems(recentJournal, recentTransactions, recentMissions, recentSessions),
    [recentJournal, recentTransactions, recentMissions, recentSessions],
  )

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Welcome, Commander
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          <span className="font-mono text-xs text-text-muted flex items-center gap-2">
            {isActive && !sessionPaused ? (
              <div className="w-2 h-2 rounded-full bg-teal-bright status-pulse glow-teal" />
            ) : isActive && sessionPaused ? (
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            Session: {formatSessionTime(elapsedSeconds)}
          </span>
          {!isActive ? (
            <button
              onClick={() => startSession()}
              disabled={sessionLoading}
              className="text-text-muted hover:text-teal-bright transition-colors disabled:opacity-50"
              title="Start session"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              {sessionPaused ? (
                <button
                  onClick={() => resumeSession()}
                  disabled={sessionLoading}
                  className="text-text-muted hover:text-teal-bright transition-colors disabled:opacity-50"
                  title="Resume session"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => pauseSession()}
                  disabled={sessionLoading}
                  className="text-text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                  title="Pause session"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => stopSession()}
                disabled={sessionLoading}
                className="text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                title="Stop session"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => resetSession()}
                disabled={sessionLoading}
                className="text-text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                title="Reset session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Log Entries" value={journalCount ?? 0} />
          <StatCard label="Ships Registered" value={ships?.length ?? 0} />
          <StatCard label="Locations Visited" value={locations?.length ?? 0} />
          <StatCard label="Balance" value={(balance ?? 0).toLocaleString()} unit="aUEC" variant="amber" />
        </div>

        {/* Quick Links */}
        <section className="mb-7">
          <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase">
            Quick Access
          </h2>
          <div className="grid grid-cols-7 gap-3">
            <QuickLink icon={<BookOpen className="w-5 h-5" />} label="Log" viewId="log" />
            <QuickLink icon={<Ship className="w-5 h-5" />} label="Fleet" viewId="fleet" />
            <QuickLink icon={<Globe className="w-5 h-5" />} label="Atlas" viewId="atlas" />
            <QuickLink icon={<Wallet className="w-5 h-5" />} label="Ledger" viewId="ledger" />
            <QuickLink icon={<Package className="w-5 h-5" />} label="Cargo" viewId="cargo" />
            <QuickLink icon={<Target className="w-5 h-5" />} label="Jobs" viewId="jobs" />
            <QuickLink icon={<Image className="w-5 h-5" />} label="Gallery" viewId="gallery" />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase">
            Recent Activity
          </h2>
          {activityItems.length === 0 ? (
            <div className="bg-panel border border-subtle rounded p-8 text-center">
              <p className="text-text-muted text-sm">
                No recent activity yet. Start by adding a journal entry or registering a ship.
              </p>
            </div>
          ) : (
            <div className="bg-panel border border-subtle rounded divide-y divide-subtle">
              {activityItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => setActiveView(item.viewId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-bright/5 transition-colors cursor-pointer text-left group"
                >
                  <span className="text-text-muted group-hover:text-teal-bright transition-colors">
                    {activityIcons[item.type]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary truncate block">
                      {item.label}
                    </span>
                  </span>
                  {item.detail && (
                    <span className={`text-xs font-mono whitespace-nowrap ${
                      item.type === 'transaction'
                        ? item.detail.startsWith('+')
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-text-muted'
                    }`}>
                      {item.detail}
                    </span>
                  )}
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
