import { useState, useMemo } from 'react'
import { Hammer, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard, ConfirmDeleteModal } from '../components/ui'
import { BlueprintFormModal, BlueprintCard } from '../components/workshop'
import { useBlueprintCraftability, useLocations, invalidateQueries } from '../lib/db'
import { blueprintsApi } from '../lib/db/api'
import type {
  Blueprint,
  BlueprintIngredient,
  BlueprintCraftability,
  CreateBlueprintInput,
  UpdateBlueprintInput,
} from '../types/database'

type CraftFilter = 'all' | 'craftable' | 'missing'
type CategoryFilter = 'all' | 'armor' | 'component' | 'consumable' | 'weapon' | 'other' | 'uncategorized'

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'armor', label: 'Armor' },
  { value: 'component', label: 'Component' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'other', label: 'Other' },
  { value: 'uncategorized', label: 'Uncategorized' },
]

export function WorkshopView() {
  const { data: craftability, loading } = useBlueprintCraftability()
  const { data: locations } = useLocations()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlueprint, setEditingBlueprint] = useState<(Blueprint & { ingredients: BlueprintIngredient[] }) | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [craftFilter, setCraftFilter] = useState<CraftFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<BlueprintCraftability | null>(null)

  const filteredBlueprints = useMemo(() => {
    if (!craftability) return []

    let result = craftability

    if (craftFilter === 'craftable') {
      result = result.filter((c) => c.canCraft)
    } else if (craftFilter === 'missing') {
      result = result.filter((c) => !c.canCraft)
    }

    if (categoryFilter !== 'all') {
      result = result.filter((c) =>
        categoryFilter === 'uncategorized'
          ? !c.blueprint.category
          : c.blueprint.category === categoryFilter
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.blueprint.name.toLowerCase().includes(query) ||
          c.blueprint.description?.toLowerCase().includes(query) ||
          c.ingredients.some((i) => i.materialName.toLowerCase().includes(query))
      )
    }

    return result
  }, [craftability, craftFilter, categoryFilter, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: 0,
      armor: 0,
      component: 0,
      consumable: 0,
      weapon: 0,
      other: 0,
      uncategorized: 0,
    }
    if (!craftability) return counts
    counts.all = craftability.length
    for (const c of craftability) {
      const cat = c.blueprint.category
      if (!cat) counts.uncategorized++
      else if (cat in counts) counts[cat as CategoryFilter]++
      else counts.other++
    }
    return counts
  }, [craftability])

  const stats = useMemo(() => {
    if (!craftability) return { total: 0, craftable: 0, missing: 0, totalCraftable: 0 }

    const craftable = craftability.filter((c) => c.canCraft).length
    const totalCraftable = craftability.reduce((sum, c) => sum + c.craftableCount, 0)

    return {
      total: craftability.length,
      craftable,
      missing: craftability.length - craftable,
      totalCraftable,
    }
  }, [craftability])

  const handleSave = async (data: CreateBlueprintInput | UpdateBlueprintInput) => {
    if (editingBlueprint) {
      await blueprintsApi.update(editingBlueprint.id, data)
    } else {
      await blueprintsApi.create(data as CreateBlueprintInput)
    }
    invalidateQueries(['blueprints'])
  }

  const handleEdit = async (c: BlueprintCraftability) => {
    const full = await blueprintsApi.findById(c.blueprint.id)
    if (full) {
      setEditingBlueprint(full)
      setIsModalOpen(true)
    }
  }

  const handleAddNew = () => {
    setEditingBlueprint(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await blueprintsApi.delete(deleteConfirm.blueprint.id)
      setDeleteConfirm(null)
      invalidateQueries(['blueprints'])
    }
  }

  const craftFilters: { value: CraftFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'craftable', label: 'Craftable' },
    { value: 'missing', label: 'Missing Items' },
  ]

  const bpCount = craftability?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Workshop
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {bpCount} {bpCount === 1 ? 'blueprint' : 'blueprints'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Blueprint
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Total Blueprints" value={stats.total} />
          <StatCard label="Craftable Now" value={stats.craftable} variant="amber" />
          <StatCard label="Missing Items" value={stats.missing} />
          <StatCard label="Total Craftable" value={stats.totalCraftable} unit="items" />
        </div>

        {bpCount > 0 && (
          <div className="space-y-2 mb-6">
            <div className="flex gap-2 flex-wrap">
              {craftFilters.map((filter) => {
                const count =
                  filter.value === 'all'
                    ? craftability?.length ?? 0
                    : filter.value === 'craftable'
                    ? craftability?.filter((c) => c.canCraft).length ?? 0
                    : craftability?.filter((c) => !c.canCraft).length ?? 0
                return (
                  <button
                    key={filter.value}
                    onClick={() => setCraftFilter(filter.value)}
                    className={`
                      px-3 py-1.5 rounded text-xs font-medium transition-colors
                      ${craftFilter === filter.value
                        ? 'bg-teal-dark text-teal-bright border border-teal-muted'
                        : 'bg-panel border border-subtle text-text-secondary hover:text-text-primary'}
                    `}
                  >
                    {filter.label} ({count})
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_FILTERS.filter(
                (f) => f.value === 'all' || categoryCounts[f.value] > 0
              ).map((filter) => (
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
                  {filter.label} ({categoryCounts[filter.value]})
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : bpCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Hammer className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Blueprints Yet
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Track your crafting blueprints and their ingredients.
              See what you can build with your current mining inventory.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Blueprint
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredBlueprints.map((c) => (
              <BlueprintCard
                key={c.blueprint.id}
                craftability={c}
                onClick={() => handleEdit(c)}
              />
            ))}

            {filteredBlueprints.length === 0 && (searchQuery || craftFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No blueprints match your{' '}
                {searchQuery && (craftFilter !== 'all' || categoryFilter !== 'all')
                  ? 'search and filters'
                  : searchQuery
                  ? 'search'
                  : 'filters'}
              </div>
            )}
          </div>
        )}
      </main>

      <BlueprintFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBlueprint(null)
        }}
        onSave={handleSave}
        onDelete={editingBlueprint ? () => {
          const bp = craftability?.find((c) => c.blueprint.id === editingBlueprint.id)
          setIsModalOpen(false)
          if (bp) setDeleteConfirm(bp)
          setEditingBlueprint(null)
        } : undefined}
        blueprint={editingBlueprint}
        locations={locations || []}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Blueprint?"
        message={
          <>
            Are you sure you want to delete{' '}
            {deleteConfirm && (
              <span className="text-text-primary font-medium">
                {deleteConfirm.blueprint.name}
              </span>
            )}
            ? This will also remove all ingredient data. This action cannot be undone.
          </>
        }
      />
    </>
  )
}
