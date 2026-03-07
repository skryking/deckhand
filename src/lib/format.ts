/**
 * Format a Date as a short date string: "Jan 1, 2025"
 */
export function formatDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a Date as date + time: "Jan 1, 2025 · 12:30 PM"
 */
export function formatDateTime(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return (
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/**
 * Format a Date as short date + time (no year): "Jan 1 · 12:30 PM"
 */
export function formatShortDateTime(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/**
 * Format a Date for use as a datetime-local input value: "2025-01-01T12:30"
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format elapsed seconds as "Xh YYm"
 */
export function formatSessionTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/**
 * Build a lookup map of ship ID → display name from a ships array.
 */
export function buildShipNameMap(ships: Array<{ id: string; nickname: string | null; manufacturer: string; model: string }> | null): Record<string, string> {
  const map: Record<string, string> = {};
  ships?.forEach((ship) => {
    map[ship.id] = ship.nickname || `${ship.manufacturer} ${ship.model}`;
  });
  return map;
}
