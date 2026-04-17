import { useState, useMemo } from 'react'
import { Gem, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard, Modal, ModalFooter } from '../components/ui'
import { InventoryFormModal, InventoryCard } from '../components/mining'
import { useInventory, useShips, useLocations } from '../lib/db'
import { inventoryApi } from '../lib/db/api'
import { buildShipNameMap } from '../lib/format'
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from '../types/database'

type CategoryFilter = 'all' | 'mineral' | 'gem' | 'component' | 'salvage' | 'other'

export function MiningView() {
  const { data: inventory, loading, refetch } = useInventory()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null)

  const locationNames = useMemo(() => {
    const map: Record<string, string> = {}
    locations?.forEach((loc) => {
      map[loc.id] = loc.name
    })
    return map
  }, [locations])

  const shipNames = useMemo(() => buildShipNameMap(ships), [ships])

  const filteredItems = useMemo(() => {
    if (!inventory) return []

    let result = inventory

    if (categoryFilter !== 'all') {
      result = result.filter((i) => (i.category || 'other') === categoryFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.materialName.toLowerCase().includes(query) ||
          i.notes?.toLowerCase().includes(query)
      )
    }

    return [...result].sort((a, b) => {
      const nameCompare = a.materialName.localeCompare(b.materialName)
      if (nameCompare !== 0) return nameCompare
      return b.quality - a.quality
    })
  }, [inventory, categoryFilter, searchQuery])

  const stats = useMemo(() => {
    if (!inventory) return { totalItems: 0, totalCscu: 0, uniqueMaterials: 0, avgQuality: 0 }

    const totalCscu = inventory.reduce((sum, i) => sum + i.quantityCscu, 0)
    const uniqueMaterials = new Set(inventory.map((i) => i.materialName)).size
    const avgQuality = inventory.length > 0
      ? Math.round(inventory.reduce((sum, i) => sum + i.quality, 0) / inventory.length)
      : 0

    return {
      totalItems: inventory.length,
      totalCscu,
      uniqueMaterials,
      avgQuality,
    }
  }, [inventory])

  const handleSave = async (data: CreateInventoryItemInput | UpdateInventoryItemInput) => {
    if (editingItem) {
      await inventoryApi.update(editingItem.id, data)
    } else {
      await inventoryApi.create(data as CreateInventoryItemInput)
    }
    refetch()
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleAdjust = async (item: InventoryItem, delta: number) => {
    try {
      await inventoryApi.adjustQuantity(item.id, delta)
      refetch()
    } catch (error) {
      console.error('Failed to adjust quantity:', error)
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await inventoryApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
    }
  }

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'mineral', label: 'Minerals' },
    { value: 'gem', label: 'Gems' },
    { value: 'component', label: 'Components' },
    { value: 'salvage', label: 'Salvage' },
    { value: 'other', label: 'Other' },
  ]

  const itemCount = inventory?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Mining Inventory
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Inventory Entries" value={stats.totalItems} />
          <StatCard label="Total Stock" value={stats.totalCscu.toLocaleString()} unit="cSCU" variant="amber" />
          <StatCard label="Unique Materials" value={stats.uniqueMaterials} />
          <StatCard label="Avg Quality" value={stats.avgQuality} unit="/ 1000" />
        </div>

        {itemCount > 0 && (
          <div className="flex gap-2 mb-6">
            {categoryFilters.map((filter) => {
              const count =
                filter.value === 'all'
                  ? inventory?.length ?? 0
                  : inventory?.filter((i) => (i.category || 'other') === filter.value).length ?? 0
              return (
                <button
                  key={filter.value}
                  onClick={() => setCategoryFilter(filter.value)}
                  className={`
                    px-3 py-1.5 rounded text-xs font-medium transition-colors
                    ${categoryFilter === filter.value
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Gem className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Materials in Inventory
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Track your mined minerals, gems, and crafting materials.
              Add items to your inventory to monitor your stock.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                locationName={item.locationId ? locationNames[item.locationId] : undefined}
                shipName={item.shipId ? shipNames[item.shipId] : undefined}
                onClick={() => handleEdit(item)}
                onAdjust={(delta) => handleAdjust(item, delta)}
              />
            ))}

            {filteredItems.length === 0 && (searchQuery || categoryFilter !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No items match your{' '}
                {searchQuery && categoryFilter !== 'all'
                  ? 'search and filter'
                  : searchQuery
                  ? 'search'
                  : 'filter'}
              </div>
            )}
          </div>
        )}
      </main>

      <InventoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSave}
        onDelete={editingItem ? () => {
          setIsModalOpen(false)
          setDeleteConfirm(editingItem)
          setEditingItem(null)
        } : undefined}
        item={editingItem}
        ships={ships || []}
        locations={locations || []}
      />

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Inventory Item?"
        size="sm"
      >
        <p className="text-text-secondary mb-2">
          Are you sure you want to delete{' '}
          {deleteConfirm && (
            <span className="text-text-primary font-medium">
              {deleteConfirm.materialName} (Q:{deleteConfirm.quality})
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
