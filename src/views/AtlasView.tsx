import { useState, useMemo, useEffect } from 'react'
import { Globe, Plus, List, GitBranch } from 'lucide-react'
import { Button, SearchInput } from '../components/ui'
import { LocationCard, LocationModal, LocationTree, LocationDetailModal } from '../components/atlas'
import { useLocations } from '../lib/db'
import { locationsApi } from '../lib/db/api'
import type { Location, CreateLocationInput, UpdateLocationInput, ShipAtLocation } from '../types/database'

type ViewMode = 'grid' | 'tree'

export function AtlasView() {
  const { data: locations, loading, refetch } = useLocations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleteConfirm, setDeleteConfirm] = useState<Location | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [shipsAtLocations, setShipsAtLocations] = useState<Record<string, ShipAtLocation[]>>({})
  const [detailLocation, setDetailLocation] = useState<Location | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Fetch ships at each location
  useEffect(() => {
    const fetchShipsAtLocations = async () => {
      if (!locations || locations.length === 0) return

      const shipsMap: Record<string, ShipAtLocation[]> = {}
      await Promise.all(
        locations.map(async (location) => {
          try {
            shipsMap[location.id] = await locationsApi.getShipsAtLocation(location.id)
          } catch {
            shipsMap[location.id] = []
          }
        })
      )
      setShipsAtLocations(shipsMap)
    }

    fetchShipsAtLocations()
  }, [locations])

  const filteredLocations = useMemo(() => {
    if (!locations) return []
    if (!searchQuery.trim()) return locations

    const query = searchQuery.toLowerCase()
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.type?.toLowerCase().includes(query) ||
        loc.notes?.toLowerCase().includes(query)
    )
  }, [locations, searchQuery])

  // Build a map of location IDs to parent names for display
  const parentNames = useMemo(() => {
    const map: Record<string, string> = {}
    if (!locations) return map

    locations.forEach((loc) => {
      if (loc.parentId) {
        const parent = locations.find((p) => p.id === loc.parentId)
        if (parent) {
          map[loc.id] = parent.name
        }
      }
    })
    return map
  }, [locations])

  const handleSave = async (data: CreateLocationInput | UpdateLocationInput) => {
    if (editingLocation) {
      await locationsApi.update(editingLocation.id, data)
    } else {
      await locationsApi.create(data as CreateLocationInput)
    }
    refetch()
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setIsModalOpen(true)
  }

  const handleDelete = (location: Location) => {
    setDeleteConfirm(location)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await locationsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
    }
  }

  const handleToggleFavorite = async (location: Location) => {
    await locationsApi.update(location.id, { isFavorite: !location.isFavorite })
    refetch()
  }

  const handleAddNew = () => {
    setEditingLocation(null)
    setIsModalOpen(true)
  }

  const handleTreeSelect = (location: Location) => {
    setSelectedLocation(location)
  }

  const handleCardClick = (location: Location) => {
    setDetailLocation(location)
    setIsDetailOpen(true)
  }

  const handleDetailEdit = () => {
    if (detailLocation) {
      setIsDetailOpen(false)
      setEditingLocation(detailLocation)
      setIsModalOpen(true)
    }
  }

  const locationCount = locations?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Atlas
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {locationCount} {locationCount === 1 ? 'location' : 'locations'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          {/* View mode toggle */}
          <div className="flex bg-panel rounded border-subtle">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l transition-colors ${
                viewMode === 'grid'
                  ? 'bg-teal-dark text-teal-bright'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Grid view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-2 rounded-r transition-colors ${
                viewMode === 'tree'
                  ? 'bg-teal-dark text-teal-bright'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Tree view"
            >
              <GitBranch className="w-4 h-4" />
            </button>
          </div>

          <SearchInput
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Location
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : locationCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Locations Saved
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Build your personal atlas of locations across the verse. Track stations,
              planets, moons, and points of interest.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Location
            </Button>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="flex h-full">
            {/* Tree sidebar */}
            <div className="w-80 border-r border-subtle bg-hull overflow-y-auto scrollbar-deckhand">
              <LocationTree
                locations={filteredLocations}
                onSelect={handleTreeSelect}
                selectedId={selectedLocation?.id}
              />
            </div>

            {/* Detail panel */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
              {selectedLocation ? (
                <div className="max-w-2xl">
                  <LocationCard
                    location={selectedLocation}
                    parentName={parentNames[selectedLocation.id]}
                    shipsAtLocation={shipsAtLocations[selectedLocation.id]}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />

                  {selectedLocation.notes && (
                    <div className="mt-4 p-4 bg-panel border-subtle rounded">
                      <h3 className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted mb-2">
                        Notes
                      </h3>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {selectedLocation.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  Select a location from the tree
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto scrollbar-deckhand h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  parentName={parentNames[location.id]}
                  shipsAtLocation={shipsAtLocations[location.id]}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handleCardClick}
                />
              ))}
              {filteredLocations.length === 0 && searchQuery && (
                <div className="col-span-full text-center py-12 text-text-muted">
                  No locations match "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <LocationDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailLocation(null)
        }}
        onEdit={handleDetailEdit}
        location={detailLocation}
        parentName={detailLocation ? parentNames[detailLocation.id] : undefined}
        shipsAtLocation={detailLocation ? shipsAtLocations[detailLocation.id] : undefined}
      />

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingLocation(null)
        }}
        onSave={handleSave}
        location={editingLocation}
        locations={locations || []}
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
              Delete Location?
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="text-text-primary font-medium">
                {deleteConfirm.name}
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
