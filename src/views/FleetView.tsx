import { useState, useMemo } from 'react'
import { Ship, Plus } from 'lucide-react'
import { Button, SearchInput } from '../components/ui'
import { ShipCard, ShipModal } from '../components/fleet'
import { useShips } from '../lib/db'
import { shipsApi } from '../lib/db/api'
import type { Ship as ShipType, CreateShipInput, UpdateShipInput } from '../types/database'

export function FleetView() {
  const { data: ships, loading, refetch } = useShips()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShip, setEditingShip] = useState<ShipType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<ShipType | null>(null)

  const filteredShips = useMemo(() => {
    if (!ships) return []
    if (!searchQuery.trim()) return ships

    const query = searchQuery.toLowerCase()
    return ships.filter(
      (ship) =>
        ship.manufacturer.toLowerCase().includes(query) ||
        ship.model.toLowerCase().includes(query) ||
        ship.nickname?.toLowerCase().includes(query) ||
        ship.role?.toLowerCase().includes(query)
    )
  }, [ships, searchQuery])

  const handleSave = async (data: CreateShipInput | UpdateShipInput) => {
    if (editingShip) {
      await shipsApi.update(editingShip.id, data)
    } else {
      await shipsApi.create(data as CreateShipInput)
    }
    refetch()
  }

  const handleEdit = (ship: ShipType) => {
    setEditingShip(ship)
    setIsModalOpen(true)
  }

  const handleDelete = async (ship: ShipType) => {
    setDeleteConfirm(ship)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await shipsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
    }
  }

  const handleAddNew = () => {
    setEditingShip(null)
    setIsModalOpen(true)
  }

  const shipCount = ships?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Fleet Registry
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {shipCount} {shipCount === 1 ? 'ship' : 'ships'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search ships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Ship
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : shipCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Ship className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Ships Registered
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Start building your fleet by adding your first ship. Track specifications,
              loadouts, and maintenance history.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Ship
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredShips.map((ship) => (
              <ShipCard
                key={ship.id}
                ship={ship}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {filteredShips.length === 0 && searchQuery && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No ships match "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </main>

      <ShipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingShip(null)
        }}
        onSave={handleSave}
        ship={editingShip}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-hull border-subtle rounded-lg shadow-2xl p-6 max-w-md mx-4">
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
              Delete Ship?
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="text-text-primary font-medium">
                {deleteConfirm.manufacturer} {deleteConfirm.model}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-danger hover:bg-danger/80"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
