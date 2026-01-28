import { Package, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard } from '../components/ui'

export function CargoView() {
  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Cargo Runs
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            0 runs
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput placeholder="Search cargo runs..." />
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Log Run
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Total Runs" value={0} />
          <StatCard label="Total Profit" value="0" unit="aUEC" variant="amber" />
          <StatCard label="SCU Hauled" value="0" unit="SCU" />
          <StatCard label="Avg Profit/Run" value="0" unit="aUEC" />
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-display text-lg font-medium text-text-primary mb-2">
            No Cargo Runs Logged
          </h2>
          <p className="text-text-muted text-sm max-w-md mb-6">
            Track your trading runs across the verse. Log routes, commodities,
            profits, and build your trading history.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Log Your First Run
          </Button>
        </div>
      </main>
    </>
  )
}
