import { useState, useMemo } from 'react'
import { Globe, Ship, BookOpen, Plus, Star } from 'lucide-react'
import { Button, SearchInput, EntryCard } from '../components/ui'
import { JournalFilters, JournalEntryModal } from '../components/journal'
import { useJournalEntries, useShips, useLocations } from '../lib/db'
import { journalApi } from '../lib/db/api'
import type {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../types/database'

export function LogView() {
  const { data: entries, loading, refetch } = useJournalEntries()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<JournalEntry | null>(null)

  // Build maps for ship/location names
  const shipNames = useMemo(() => {
    const map: Record<string, string> = {}
    ships?.forEach((ship) => {
      map[ship.id] = ship.nickname || `${ship.manufacturer} ${ship.model}`
    })
    return map
  }, [ships])

  const locationNames = useMemo(() => {
    const map: Record<string, string> = {}
    locations?.forEach((loc) => {
      map[loc.id] = loc.name
    })
    return map
  }, [locations])

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    if (!entries) return []

    let result = entries

    // Apply type filter
    if (activeFilter) {
      result = result.filter((e) => e.entryType === activeFilter)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query) ||
          e.tags?.some((t) => t.toLowerCase().includes(query))
      )
    }

    return result
  }, [entries, activeFilter, searchQuery])

  // Calculate counts for filters
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { total: entries?.length ?? 0 }
    entries?.forEach((e) => {
      if (e.entryType) {
        counts[e.entryType] = (counts[e.entryType] || 0) + 1
      }
    })
    return counts
  }, [entries])

  const handleSave = async (data: CreateJournalEntryInput | UpdateJournalEntryInput) => {
    if (editingEntry) {
      await journalApi.update(editingEntry.id, data)
    } else {
      await journalApi.create(data as CreateJournalEntryInput)
    }
    refetch()
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await journalApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
    }
  }

  const handleAddNew = () => {
    setEditingEntry(null)
    setIsModalOpen(true)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatEntryType = (type: string | null) => {
    if (!type) return 'Journal'
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  const entryCount = entries?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Captain's Log
          </h1>
          <span className="font-mono text-[11px] py-1 px-2.5 bg-teal-dark text-teal-bright rounded-sm">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            New Entry
          </Button>
        </div>
      </header>

      {/* Filters bar */}
      {entryCount > 0 && (
        <div className="px-7 py-3 border-b border-subtle bg-hull/50">
          <JournalFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={filterCounts}
          />
        </div>
      )}

      <main className="flex-1 p-6 pl-7 overflow-y-auto scrollbar-deckhand">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : entryCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Log Entries Yet
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Start documenting your adventures. Create journal entries, log cargo runs,
              record combat encounters, and track acquisitions.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Entry
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredEntries.map((entry) => {
              const meta: Array<{
                icon: React.ReactNode
                value: string
                variant?: 'default' | 'positive' | 'negative'
              }> = []

              if (entry.locationId && locationNames[entry.locationId]) {
                meta.push({
                  icon: <Globe className="w-3 h-3" />,
                  value: locationNames[entry.locationId],
                })
              }

              if (entry.shipId && shipNames[entry.shipId]) {
                meta.push({
                  icon: <Ship className="w-3 h-3" />,
                  value: shipNames[entry.shipId],
                })
              }

              if (entry.isFavorite) {
                meta.push({
                  icon: <Star className="w-3 h-3 fill-amber-bright" />,
                  value: 'Favorite',
                })
              }

              return (
                <EntryCard
                  key={entry.id}
                  date={formatDate(entry.timestamp)}
                  type={formatEntryType(entry.entryType)}
                  title={entry.title || 'Untitled Entry'}
                  preview={
                    entry.content.length > 200
                      ? entry.content.substring(0, 200) + '...'
                      : entry.content
                  }
                  meta={meta}
                  onClick={() => handleEdit(entry)}
                />
              )
            })}

            {filteredEntries.length === 0 && (searchQuery || activeFilter) && (
              <div className="text-center py-12 text-text-muted">
                No entries match your{' '}
                {searchQuery && activeFilter
                  ? 'search and filter'
                  : searchQuery
                  ? 'search'
                  : 'filter'}
              </div>
            )}
          </div>
        )}
      </main>

      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEntry(null)
        }}
        onSave={handleSave}
        entry={editingEntry}
        ships={ships || []}
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
              Delete Entry?
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="text-text-primary font-medium">
                {deleteConfirm.title || 'this entry'}
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
