import { useState } from "react";
import { Image, Plus, X } from "lucide-react";
import { screenshotsApi } from "../../lib/db/api";
import type { Screenshot, CreateScreenshotInput } from "../../types/database";

interface LinkedScreenshotsProps {
  screenshots: Screenshot[];
  onImport: (screenshot: Screenshot) => void;
  linkData: {
    shipId?: string | null;
    locationId?: string | null;
    journalEntryId?: string | null;
  };
}

export function LinkedScreenshots({
  screenshots,
  onImport,
  linkData,
}: LinkedScreenshotsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleImport = async () => {
    try {
      const result = (await window.ipcRenderer.invoke(
        "screenshots:selectFiles"
      )) as {
        success: boolean;
        filePaths?: string[];
        error?: string;
      };

      if (!result.success || !result.filePaths) return;

      for (const filePath of result.filePaths) {
        const data: CreateScreenshotInput = {
          filePath,
          thumbnailPath: null,
          takenAt: new Date(),
          caption: null,
          tags: null,
          locationId: linkData.locationId ?? null,
          shipId: linkData.shipId ?? null,
          journalEntryId: linkData.journalEntryId ?? null,
          isFavorite: false,
        };
        const created = await screenshotsApi.create(data);
        onImport(created);
      }
    } catch (error) {
      console.error("Failed to import screenshot:", error);
    }
  };

  const handleUnlink = async (screenshot: Screenshot) => {
    try {
      const update: Record<string, null> = {};
      if (linkData.shipId) update.shipId = null;
      if (linkData.locationId) update.locationId = null;
      if (linkData.journalEntryId) update.journalEntryId = null;
      await screenshotsApi.update(screenshot.id, update);
      onImport(screenshot); // triggers refetch in parent
    } catch (error) {
      console.error("Failed to unlink screenshot:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
          Screenshots
        </div>
        <button
          type="button"
          onClick={handleImport}
          className="inline-flex items-center gap-1 text-[11px] text-teal-primary hover:text-teal-bright transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Image
        </button>
      </div>

      {screenshots.length === 0 ? (
        <button
          type="button"
          onClick={handleImport}
          className="w-full flex flex-col items-center justify-center py-6 border border-dashed border-subtle rounded hover:border-teal-primary/50 hover:bg-teal-dark/5 transition-colors cursor-pointer"
        >
          <Image className="w-6 h-6 text-text-muted mb-1.5" />
          <span className="text-xs text-text-muted">
            Click to add screenshots
          </span>
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-deckhand pb-1">
          {screenshots.map((ss, index) => (
            <div
              key={ss.id}
              className="relative group flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-void border border-subtle hover:border-teal-primary/50 transition-colors cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={`local-file:///${ss.filePath.replace(/\\/g, "/")}`}
                alt={ss.caption || "Screenshot"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlink(ss);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-void/80 text-text-muted hover:text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Unlink screenshot"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={`local-file:///${screenshots[lightboxIndex].filePath.replace(/\\/g, "/")}`}
            alt={screenshots[lightboxIndex].caption || "Screenshot"}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {screenshots.length > 1 && (
            <>
              {lightboxIndex > 0 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-3xl px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex - 1);
                  }}
                >
                  ‹
                </button>
              )}
              {lightboxIndex < screenshots.length - 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-3xl px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex + 1);
                  }}
                >
                  ›
                </button>
              )}
            </>
          )}
          <div className="absolute bottom-4 text-xs text-text-muted">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
