import { useState, useMemo } from 'react'
import { Image, Upload, Star, X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, SearchInput, StatCard, Modal, ModalFooter } from '../components/ui'
import { ScreenshotCard, ScreenshotModal } from '../components/gallery'
import { useScreenshots, useShips, useLocations } from '../lib/db'
import { screenshotsApi } from '../lib/db/api'
import { buildShipNameMap } from '../lib/format'
import type {
  Screenshot,
  CreateScreenshotInput,
  UpdateScreenshotInput,
} from '../types/database'

type GalleryFilter = 'all' | 'favorites'

export function GalleryView() {
  const { data: screenshots, loading, refetch } = useScreenshots()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<Screenshot | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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
  const filteredScreenshots = useMemo(() => {
    if (!screenshots) return []

    let result = screenshots

    if (galleryFilter === 'favorites') {
      result = result.filter((s) => s.isFavorite)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.caption?.toLowerCase().includes(query) ||
          s.tags?.some((t) => t.toLowerCase().includes(query))
      )
    }

    return result
  }, [screenshots, galleryFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    if (!screenshots) return { total: 0, tagged: 0, locations: 0, ships: 0 }

    const tagged = screenshots.filter((s) => s.tags && s.tags.length > 0).length
    const uniqueLocations = new Set(screenshots.filter((s) => s.locationId).map((s) => s.locationId)).size
    const uniqueShips = new Set(screenshots.filter((s) => s.shipId).map((s) => s.shipId)).size

    return {
      total: screenshots.length,
      tagged,
      locations: uniqueLocations,
      ships: uniqueShips,
    }
  }, [screenshots])

  const handleImport = async () => {
    try {
      const result = await window.ipcRenderer.invoke('screenshots:selectFiles') as {
        success: boolean
        filePaths?: string[]
        error?: string
      }

      if (!result.success || !result.filePaths) return

      // Create a screenshot record for each selected file
      for (const filePath of result.filePaths) {
        await screenshotsApi.create({
          filePath,
          thumbnailPath: null,
          takenAt: new Date(),
          caption: null,
          tags: null,
          locationId: null,
          shipId: null,
          journalEntryId: null,
          isFavorite: false,
        })
      }

      refetch()
    } catch (error) {
      console.error('Failed to import screenshots:', error)
    }
  }

  const handleSave = async (data: CreateScreenshotInput | UpdateScreenshotInput) => {
    if (editingScreenshot) {
      await screenshotsApi.update(editingScreenshot.id, data)
    } else {
      await screenshotsApi.create(data as CreateScreenshotInput)
    }
    refetch()
  }

  const handleEdit = (screenshot: Screenshot) => {
    setEditingScreenshot(screenshot)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      // Delete the copied file from the app data directory
      await window.ipcRenderer.invoke('screenshots:deleteFile', deleteConfirm.filePath)
      await screenshotsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
    }
  }

  const screenshotCount = screenshots?.length ?? 0
  const favoritesCount = screenshots?.filter((s) => s.isFavorite).length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Gallery
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {screenshotCount} {screenshotCount === 1 ? 'screenshot' : 'screenshots'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleImport}>
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard label="Screenshots" value={stats.total} />
          <StatCard label="Tagged" value={stats.tagged} />
          <StatCard label="Locations" value={stats.locations} />
          <StatCard label="Ships" value={stats.ships} />
        </div>

        {/* Filters */}
        {screenshotCount > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setGalleryFilter('all')}
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${galleryFilter === 'all'
                  ? 'bg-teal-dark text-teal-bright border border-teal-muted'
                  : 'bg-panel border border-subtle text-text-secondary hover:text-text-primary'}
              `}
            >
              All ({screenshotCount})
            </button>
            <button
              onClick={() => setGalleryFilter('favorites')}
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition-colors inline-flex items-center gap-1
                ${galleryFilter === 'favorites'
                  ? 'bg-teal-dark text-teal-bright border border-teal-muted'
                  : 'bg-panel border border-subtle text-text-secondary hover:text-text-primary'}
              `}
            >
              <Star className="w-3 h-3" />
              Favorites ({favoritesCount})
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : screenshotCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Screenshots Yet
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Import and organize your Star Citizen screenshots. Tag them with
              locations, ships, and link them to journal entries.
            </p>
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4 mr-1" />
              Import Screenshots
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredScreenshots.map((screenshot) => (
                <ScreenshotCard
                  key={screenshot.id}
                  screenshot={screenshot}
                  locationName={screenshot.locationId ? locationNames[screenshot.locationId] : undefined}
                  shipName={screenshot.shipId ? shipNames[screenshot.shipId] : undefined}
                  onClick={() => setLightboxIndex(filteredScreenshots.indexOf(screenshot))}
                />
              ))}
            </div>

            {filteredScreenshots.length === 0 && (searchQuery || galleryFilter !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No screenshots match your{' '}
                {searchQuery && galleryFilter !== 'all'
                  ? 'search and filter'
                  : searchQuery
                  ? 'search'
                  : 'filter'}
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && filteredScreenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setLightboxIndex(null)}
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute top-4 right-14 text-text-muted hover:text-text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(filteredScreenshots[lightboxIndex])
              setLightboxIndex(null)
            }}
            title="Edit screenshot"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <img
            src={`local-file:///${filteredScreenshots[lightboxIndex].filePath.replace(/\\/g, '/')}`}
            alt={filteredScreenshots[lightboxIndex].caption || 'Screenshot'}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {filteredScreenshots.length > 1 && (
            <>
              {lightboxIndex > 0 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel/80 border border-subtle text-text-muted hover:text-text-primary flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(lightboxIndex - 1)
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightboxIndex < filteredScreenshots.length - 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel/80 border border-subtle text-text-muted hover:text-text-primary flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(lightboxIndex + 1)
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          <div className="absolute bottom-4 text-xs text-text-muted">
            {lightboxIndex + 1} / {filteredScreenshots.length}
            {filteredScreenshots[lightboxIndex].caption && (
              <span className="ml-3 text-text-secondary">{filteredScreenshots[lightboxIndex].caption}</span>
            )}
          </div>
        </div>
      )}

      <ScreenshotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingScreenshot(null)
        }}
        onSave={handleSave}
        onDelete={editingScreenshot ? () => {
          setIsModalOpen(false)
          setDeleteConfirm(editingScreenshot)
          setEditingScreenshot(null)
        } : undefined}
        screenshot={editingScreenshot}
        ships={ships || []}
        locations={locations || []}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Screenshot?"
        size="sm"
      >
        <p className="text-text-secondary mb-2">
          Are you sure you want to delete this screenshot? This action cannot be undone.
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
