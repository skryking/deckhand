import { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  FolderOpen,
  Info,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { Button } from '../components/ui'

export function ConfigView() {
  const [dbPath, setDbPath] = useState<string>('%APPDATA%/deckhand/deckhand.db')
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const isDevMode = dbPath.includes('-dev.db')

  useEffect(() => {
    // Get database path on mount
    window.ipcRenderer.invoke('data:getPath').then((result: { success: boolean; path?: string }) => {
      if (result.success && result.path) {
        setDbPath(result.path)
      }
    })
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleOpenFolder = async () => {
    await window.ipcRenderer.invoke('data:openFolder')
  }

  const handleExport = async () => {
    setLoading('export')
    try {
      const result = await window.ipcRenderer.invoke('data:export')
      if (result.success) {
        showMessage('success', 'Data exported successfully!')
      } else if (result.error !== 'Export cancelled') {
        showMessage('error', result.error || 'Export failed')
      }
    } catch (error) {
      showMessage('error', 'Export failed')
    } finally {
      setLoading(null)
    }
  }

  const handleImport = async () => {
    setLoading('import')
    try {
      const result = await window.ipcRenderer.invoke('data:import')
      if (result.success) {
        showMessage('success', `Data imported successfully! (from ${result.importedAt})`)
        // Reload the page to refresh all data
        window.location.reload()
      } else if (result.error !== 'Import cancelled') {
        showMessage('error', result.error || 'Import failed')
      }
    } catch (error) {
      showMessage('error', 'Import failed')
    } finally {
      setLoading(null)
    }
  }

  const handleClearData = async () => {
    setLoading('clear')
    try {
      const result = await window.ipcRenderer.invoke('data:clear')
      if (result.success) {
        showMessage('success', 'All data cleared')
        setShowClearConfirm(false)
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        showMessage('error', result.error || 'Clear failed')
      }
    } catch (error) {
      showMessage('error', 'Clear failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Settings
          </h1>
          {isDevMode && (
            <span className="font-mono text-[11px] py-1 px-2.5 bg-amber-dark text-amber-bright rounded-sm">
              DEV MODE
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        <div className="max-w-2xl">
          {/* Status message */}
          {message && (
            <div
              className={`
                mb-6 p-4 rounded border flex items-center gap-3
                ${message.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
                }
              `}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Data Section */}
          <section className="mb-8">
            <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Management
            </h2>
            <div className="bg-panel border border-subtle rounded p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text-primary text-sm font-medium">Database Location</h3>
                  <p className="text-text-muted text-xs font-mono mt-1 break-all">{dbPath}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleOpenFolder}>
                  <FolderOpen className="w-4 h-4 mr-1" />
                  Open Folder
                </Button>
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text-primary text-sm font-medium">Export Data</h3>
                  <p className="text-text-muted text-xs mt-1">Export all your data to a backup file</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={loading !== null}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {loading === 'export' ? 'Exporting...' : 'Export'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text-primary text-sm font-medium">Import Data</h3>
                  <p className="text-text-muted text-xs mt-1">Restore from a backup file (replaces all existing data)</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImport}
                  disabled={loading !== null}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {loading === 'import' ? 'Importing...' : 'Import'}
                </Button>
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-danger text-sm font-medium">Clear All Data</h3>
                  <p className="text-text-muted text-xs mt-1">Permanently delete all your data</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={loading !== null}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Data
                </Button>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="mb-8">
            <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase flex items-center gap-2">
              <Info className="w-4 h-4" />
              About
            </h2>
            <div className="bg-panel border border-subtle rounded p-4">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded bg-hull border border-subtle flex items-center justify-center">
                  <Settings className="w-6 h-6 text-teal-bright" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-text-primary">Deckhand</h3>
                  <p className="text-text-muted text-xs">Version 0.1.0</p>
                  <p className="text-text-secondary text-sm mt-2">
                    A personal logbook for Star Citizen pilots.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Disclaimer Section */}
          <section>
            <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Disclaimer
            </h2>
            <div className="bg-panel border border-amber-bright/20 rounded p-4">
              <p className="text-text-secondary text-sm leading-relaxed">
                <strong className="text-amber-bright">This is a fan-made application.</strong>
                {' '}Deckhand is not affiliated with, endorsed by, or connected to Cloud Imperium
                Games, Roberts Space Industries, or the Star Citizen project. All game-related
                content, names, and trademarks are the property of their respective owners.
              </p>
              <p className="text-text-muted text-xs mt-3">
                Star Citizen® is a registered trademark of Cloud Imperium Rights LLC.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative bg-hull border-subtle rounded-lg shadow-2xl p-6 max-w-md mx-4">
            <h3 className="font-display text-lg font-semibold text-danger mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Clear All Data?
            </h3>
            <p className="text-text-secondary mb-6">
              This will permanently delete all your ships, locations, journal entries,
              and all other data. This action cannot be undone.
            </p>
            <p className="text-text-muted text-sm mb-6">
              Consider exporting a backup first.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleClearData}
                disabled={loading === 'clear'}
                className="bg-danger hover:bg-danger/80"
              >
                {loading === 'clear' ? 'Clearing...' : 'Clear All Data'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
