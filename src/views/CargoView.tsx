import { useState, useMemo } from 'react'
import { Package, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard, Modal, ModalFooter } from '../components/ui'
import { CargoRunModal, CargoRunCard } from '../components/cargo'
import { useCargoRuns, useShips, useLocations } from '../lib/db'
import { cargoApi } from '../lib/db/api'
import { useRefresh } from '../stores'
import { buildShipNameMap } from '../lib/format'
import type {
  CargoRun,
  CreateCargoRunInput,
  UpdateCargoRunInput,
} from '../types/database'

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'failed'

export function CargoView() {
  const { data: cargoRuns, loading, refetch } = useCargoRuns()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()
  const invalidateBalance = useRefresh((s) => s.invalidateBalance)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRun, setEditingRun] = useState<CargoRun | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<CargoRun | null>(null)

  // Name lookup maps
  const locationNames = useMemo(() => {
    const map: Record<string, string> = {}
    locations?.forEach((loc) => {
      map[loc.id] = loc.name
    })
    return map
  }, [locations])

  const shipNames = useMemo(() => buildShipNameMap(ships), [ships])

  // Filter and search
  const filteredRuns = useMemo(() => {
    if (!cargoRuns) return []

    let result = cargoRuns

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.commodity.toLowerCase().includes(query) ||
          r.notes?.toLowerCase().includes(query)
      )
    }

    return result
  }, [cargoRuns, statusFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    if (!cargoRuns) return { totalRuns: 0, totalProfit: 0, scuHauled: 0, avgProfit: 0 }

    const completed = cargoRuns.filter((r) => r.status === 'completed')
    const totalProfit = completed.reduce((sum, r) => sum + (r.profit ?? 0), 0)
    const scuHauled = completed.reduce((sum, r) => sum + r.quantity, 0)
    const avgProfit = completed.length > 0 ? Math.round(totalProfit / completed.length) : 0

    return {
      totalRuns: cargoRuns.length,
      totalProfit,
      scuHauled,
      avgProfit,
    }
  }, [cargoRuns])

  const handleSave = async (data: CreateCargoRunInput | UpdateCargoRunInput) => {
    if (editingRun) {
      await cargoApi.update(editingRun.id, data)
    } else {
      await cargoApi.create(data as CreateCargoRunInput)
    }
    refetch()
    invalidateBalance()
  }

  const handleEdit = (run: CargoRun) => {
    setEditingRun(run)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingRun(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await cargoApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
      invalidateBalance()
    }
  }

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ]

  const runCount = cargoRuns?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Cargo Runs
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {runCount} {runCount === 1 ? 'run' : 'runs'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search cargo runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Log Run
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Total Runs" value={stats.totalRuns} />
          <StatCard label="Total Profit" value={stats.totalProfit.toLocaleString()} unit="aUEC" variant="amber" />
          <StatCard label="SCU Hauled" value={stats.scuHauled.toLocaleString()} unit="SCU" />
          <StatCard label="Avg Profit/Run" value={stats.avgProfit.toLocaleString()} unit="aUEC" />
        </div>

        {/* Status Filters */}
        {runCount > 0 && (
          <div className="flex gap-2 mb-6">
            {statusFilters.map((filter) => {
              const count =
                filter.value === 'all'
                  ? cargoRuns?.length ?? 0
                  : cargoRuns?.filter((r) => r.status === filter.value).length ?? 0
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`
                    px-3 py-1.5 rounded text-xs font-medium transition-colors
                    ${statusFilter === filter.value
                      ? 'bg-teal-dark text-teal-bright border border-teal-muted'
                      : 'bg-panel border border-subtle text-text-secondary hover:text-text-primary'}
                  `}
                >
                  {filter.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : runCount === 0 ? (
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
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Log Your First Run
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredRuns.map((run) => (
              <CargoRunCard
                key={run.id}
                cargoRun={run}
                originName={run.originLocationId ? locationNames[run.originLocationId] : undefined}
                destinationName={run.destinationLocationId ? locationNames[run.destinationLocationId] : undefined}
                shipName={run.shipId ? shipNames[run.shipId] : undefined}
                onClick={() => handleEdit(run)}
              />
            ))}

            {filteredRuns.length === 0 && (searchQuery || statusFilter !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No cargo runs match your{' '}
                {searchQuery && statusFilter !== 'all'
                  ? 'search and filter'
                  : searchQuery
                  ? 'search'
                  : 'filter'}
              </div>
            )}
          </div>
        )}
      </main>

      <CargoRunModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRun(null)
        }}
        onSave={handleSave}
        onDelete={editingRun ? () => {
          setIsModalOpen(false)
          setDeleteConfirm(editingRun)
          setEditingRun(null)
        } : undefined}
        cargoRun={editingRun}
        ships={ships || []}
        locations={locations || []}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Cargo Run?"
        size="sm"
      >
        <p className="text-text-secondary mb-2">
          Are you sure you want to delete this cargo run
          {deleteConfirm && (
            <>
              {' '}for{' '}
              <span className="text-text-primary font-medium">
                {deleteConfirm.commodity}
              </span>
            </>
          )}
          ? This action cannot be undone.
        </p>
        <ModalFooter className="-mx-6 -mb-5 mt-5">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="bg-danger hover:bg-danger/80"
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
