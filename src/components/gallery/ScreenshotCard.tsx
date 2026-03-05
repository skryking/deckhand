import { Star, Globe, Ship } from "lucide-react";
import type { Screenshot } from "../../types/database";

interface ScreenshotCardProps {
  screenshot: Screenshot;
  locationName?: string;
  shipName?: string;
  onClick: () => void;
}

export function ScreenshotCard({
  screenshot,
  locationName,
  shipName,
  onClick,
}: ScreenshotCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="group bg-panel border-subtle rounded-md overflow-hidden cursor-pointer
        transition-all duration-200 hover:border-teal-muted hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-void relative overflow-hidden">
        <img
          src={`local-file://${screenshot.filePath}`}
          alt={screenshot.caption || "Screenshot"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent && !parent.querySelector(".fallback-text")) {
              const fallback = document.createElement("div");
              fallback.className =
                "fallback-text absolute inset-0 flex items-center justify-center text-text-muted text-xs";
              fallback.textContent = "Image not found";
              parent.appendChild(fallback);
            }
          }}
        />
        {screenshot.isFavorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 fill-amber-bright text-amber-bright" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {screenshot.caption ? (
          <p className="text-sm text-text-primary font-medium line-clamp-1 mb-1">
            {screenshot.caption}
          </p>
        ) : (
          <p className="text-sm text-text-muted italic mb-1">No caption</p>
        )}

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {screenshot.takenAt && (
            <span>{formatDate(screenshot.takenAt)}</span>
          )}
          {locationName && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 opacity-70" />
              {locationName}
            </span>
          )}
          {shipName && (
            <span className="flex items-center gap-1">
              <Ship className="w-3 h-3 opacity-70" />
              {shipName}
            </span>
          )}
        </div>

        {/* Tags */}
        {screenshot.tags && screenshot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {screenshot.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-void text-text-muted rounded"
              >
                {tag}
              </span>
            ))}
            {screenshot.tags.length > 3 && (
              <span className="text-[10px] text-text-faint">
                +{screenshot.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
