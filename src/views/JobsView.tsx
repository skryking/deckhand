import { Target, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard } from '../components/ui'

export function JobsView() {
  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Missions
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            0 missions
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput placeholder="Search missions..." />
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Log Mission
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Missions Completed" value={0} />
          <StatCard label="Total Earnings" value="0" unit="aUEC" variant="amber" />
          <StatCard label="Success Rate" value="--" unit="%" />
          <StatCard label="Active Missions" value={0} />
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-display text-lg font-medium text-text-primary mb-2">
            No Missions Logged
          </h2>
          <p className="text-text-muted text-sm max-w-md mb-6">
            Track your missions and contracts. Log bounties, deliveries,
            investigations, and other jobs across the verse.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Log Your First Mission
          </Button>
        </div>
      </main>
    </>
  )
}
