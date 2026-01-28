import { BookOpen, Ship, Globe, Wallet, Package, Target, Image, Clock } from 'lucide-react'
import { StatCard } from '../components/ui'
import { useNavigation } from '../stores'
import { useJournalCount, useShips, useLocations, useBalance } from '../lib/db/hooks'

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

export function HomeView() {
  const { data: journalCount } = useJournalCount()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()
  const { data: balance } = useBalance()

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
            <Clock className="w-3.5 h-3.5" />
            Session: 0h 0m
          </span>
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

        {/* Recent Activity Placeholder */}
        <section>
          <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase">
            Recent Activity
          </h2>
          <div className="bg-panel border border-subtle rounded p-8 text-center">
            <p className="text-text-muted text-sm">
              No recent activity yet. Start by adding a journal entry or registering a ship.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
