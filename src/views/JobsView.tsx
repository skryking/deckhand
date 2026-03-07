import { useState, useMemo } from 'react'
import { Target, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard, Modal, ModalFooter } from '../components/ui'
import { MissionModal, MissionCard } from '../components/jobs'
import { useMissions, useShips, useLocations } from '../lib/db'
import { missionsApi } from '../lib/db/api'
import { useRefresh } from '../stores'
import { buildShipNameMap } from '../lib/format'
import type {
  Mission,
  CreateMissionInput,
  UpdateMissionInput,
} from '../types/database'

type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'abandoned'

export function JobsView() {
  const { data: missions, loading, refetch } = useMissions()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()
  const invalidateBalance = useRefresh((s) => s.invalidateBalance)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<Mission | null>(null)

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
  const filteredMissions = useMemo(() => {
    if (!missions) return []

    let result = missions

    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.contractor?.toLowerCase().includes(query) ||
          m.notes?.toLowerCase().includes(query)
      )
    }

    return result
  }, [missions, statusFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    if (!missions) return { completed: 0, totalEarnings: 0, successRate: '--', active: 0 }

    const completed = missions.filter((m) => m.status === 'completed')
    const failed = missions.filter((m) => m.status === 'failed')
    const active = missions.filter((m) => m.status === 'active')
    const totalEarnings = completed.reduce((sum, m) => sum + (m.reward ?? 0), 0)

    const totalFinished = completed.length + failed.length
    const successRate = totalFinished > 0
      ? Math.round((completed.length / totalFinished) * 100).toString()
      : '--'

    return {
      completed: completed.length,
      totalEarnings,
      successRate,
      active: active.length,
    }
  }, [missions])

  const handleSave = async (data: CreateMissionInput | UpdateMissionInput) => {
    if (editingMission) {
      await missionsApi.update(editingMission.id, data)
    } else {
      await missionsApi.create(data as CreateMissionInput)
    }
    refetch()
    invalidateBalance()
  }

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingMission(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await missionsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
      invalidateBalance()
    }
  }

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'abandoned', label: 'Abandoned' },
  ]

  const missionCount = missions?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Missions
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {missionCount} {missionCount === 1 ? 'mission' : 'missions'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Log Mission
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Missions Completed" value={stats.completed} />
          <StatCard label="Total Earnings" value={stats.totalEarnings.toLocaleString()} unit="aUEC" variant="amber" />
          <StatCard label="Success Rate" value={stats.successRate} unit="%" />
          <StatCard label="Active Missions" value={stats.active} />
        </div>

        {/* Status Filters */}
        {missionCount > 0 && (
          <div className="flex gap-2 mb-6">
            {statusFilters.map((filter) => {
              const count =
                filter.value === 'all'
                  ? missions?.length ?? 0
                  : missions?.filter((m) => m.status === filter.value).length ?? 0
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
        ) : missionCount === 0 ? (
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
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Log Your First Mission
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                locationName={mission.locationId ? locationNames[mission.locationId] : undefined}
                shipName={mission.shipId ? shipNames[mission.shipId] : undefined}
                onClick={() => handleEdit(mission)}
              />
            ))}

            {filteredMissions.length === 0 && (searchQuery || statusFilter !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No missions match your{' '}
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

      <MissionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMission(null)
        }}
        onSave={handleSave}
        onDelete={editingMission ? () => {
          setIsModalOpen(false)
          setDeleteConfirm(editingMission)
          setEditingMission(null)
        } : undefined}
        mission={editingMission}
        ships={ships || []}
        locations={locations || []}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Mission?"
        size="sm"
      >
        <p className="text-text-secondary mb-2">
          Are you sure you want to delete{' '}
          {deleteConfirm && (
            <span className="text-text-primary font-medium">
              {deleteConfirm.title}
            </span>
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
