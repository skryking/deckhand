import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { parseLine, splitShipModel, MANUFACTURER_NAMES, type ParsedEvent } from './parser';

// A single suggestion pushed to the renderer. The renderer decides whether to
// materialize it in the DB.
export interface Suggestion {
  id: string;
  kind: 'session-start' | 'session-end' | 'ship' | 'location' | 'character' | 'version';
  detectedAt: string; // ISO timestamp from the log line
  // Human-readable summary
  summary: string;
  // Raw payload — shape varies by kind; renderer matches on `kind`.
  payload: Record<string, unknown>;
  // Signature used to de-duplicate: we only emit one suggestion per signature
  // per watcher lifetime. Session events never de-dupe (always fresh).
  signature: string;
}

export interface WatcherState {
  running: boolean;
  logPath: string;
  lastOffset: number;
  fileExists: boolean;
  fileSize: number;
  // Parsed-but-not-yet-resolved suggestions, keyed by signature.
  suggestions: Suggestion[];
}

// Poll interval in ms. SC writes to the log a few times a second during
// gameplay; 2s is a good balance between freshness and CPU.
const POLL_MS = 2000;

// Read up to 4 MB per tick. Protects us from pathological file growth.
const MAX_READ_CHUNK = 4 * 1024 * 1024;

export class LogWatcher extends EventEmitter {
  private logPath: string;
  private lastOffset = 0;
  private lastSize = 0;
  private buffer = '';
  private timer: NodeJS.Timeout | null = null;
  private suggestions = new Map<string, Suggestion>();
  private signatures = new Set<string>();

  constructor(logPath: string) {
    super();
    this.logPath = logPath;
  }

  getLogPath(): string {
    return this.logPath;
  }

  setLogPath(p: string): void {
    if (p === this.logPath) return;
    const wasRunning = this.timer !== null;
    this.stop();
    this.logPath = p;
    this.resetState();
    if (wasRunning) this.start({ replayHistory: true });
  }

  getState(): WatcherState {
    const stat = this.safeStat();
    return {
      running: this.timer !== null,
      logPath: this.logPath,
      lastOffset: this.lastOffset,
      fileExists: stat !== null,
      fileSize: stat?.size ?? 0,
      suggestions: Array.from(this.suggestions.values()),
    };
  }

  start(opts: { replayHistory: boolean }): void {
    if (this.timer) return;
    if (opts.replayHistory) {
      // Read from the start so the user can see suggestions for the current
      // session even if the app was opened after the game.
      this.lastOffset = 0;
    } else {
      const stat = this.safeStat();
      this.lastOffset = stat?.size ?? 0;
    }
    this.tick();
    this.timer = setInterval(() => this.tick(), POLL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dismiss(id: string): void {
    const existing = Array.from(this.suggestions.entries()).find(([, s]) => s.id === id);
    if (existing) {
      this.suggestions.delete(existing[0]);
      this.emit('change');
    }
  }

  // Called when the user accepts a suggestion — we remove it from the live
  // list but keep the signature so we don't re-prompt for the same thing.
  resolve(id: string): void {
    this.dismiss(id);
  }

  clearAll(): void {
    this.suggestions.clear();
    this.signatures.clear();
    this.emit('change');
  }

  private resetState(): void {
    this.lastOffset = 0;
    this.lastSize = 0;
    this.buffer = '';
    this.suggestions.clear();
    this.signatures.clear();
  }

  private safeStat(): fs.Stats | null {
    try {
      return fs.statSync(this.logPath);
    } catch {
      return null;
    }
  }

  private tick(): void {
    const stat = this.safeStat();
    if (!stat) {
      // File doesn't exist — keep polling, user may launch the game later.
      return;
    }

    // Rotation detection: file shrank (new log) — re-read from the top.
    if (stat.size < this.lastSize) {
      this.lastOffset = 0;
      this.buffer = '';
    }
    this.lastSize = stat.size;

    if (stat.size <= this.lastOffset) return;

    const readStart = this.lastOffset;
    const readEnd = Math.min(stat.size, this.lastOffset + MAX_READ_CHUNK);

    let chunk: Buffer;
    try {
      const fd = fs.openSync(this.logPath, 'r');
      try {
        const len = readEnd - readStart;
        chunk = Buffer.alloc(len);
        fs.readSync(fd, chunk, 0, len, readStart);
      } finally {
        fs.closeSync(fd);
      }
    } catch (err) {
      console.error('[LogWatcher] read error:', err);
      return;
    }

    this.lastOffset = readEnd;
    this.buffer += chunk.toString('utf8');

    // Consume complete lines. Leave any trailing partial line in the buffer.
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? '';

    let emittedAny = false;
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const suggestion = toSuggestion(parsed);
      if (!suggestion) continue;

      // Session events are not de-duped — every start/quit is meaningful.
      if (suggestion.kind === 'session-start' || suggestion.kind === 'session-end') {
        this.suggestions.set(suggestion.id, suggestion);
        emittedAny = true;
        continue;
      }

      if (this.signatures.has(suggestion.signature)) continue;
      this.signatures.add(suggestion.signature);
      this.suggestions.set(suggestion.id, suggestion);
      emittedAny = true;
    }

    if (emittedAny) this.emit('change');
  }
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `lw_${Date.now()}_${counter}`;
}

function toSuggestion(e: ParsedEvent): Suggestion | null {
  switch (e.kind) {
    case 'session-start':
      return {
        id: nextId(),
        kind: 'session-start',
        detectedAt: e.at.toISOString(),
        summary: 'Game session started',
        payload: { at: e.at.toISOString() },
        signature: `session-start:${e.at.toISOString()}`,
      };

    case 'session-end':
      return {
        id: nextId(),
        kind: 'session-end',
        detectedAt: e.at.toISOString(),
        summary: e.reason ? `Game quit (${e.reason})` : 'Game quit',
        payload: { at: e.at.toISOString(), reason: e.reason },
        signature: `session-end:${e.at.toISOString()}`,
      };

    case 'character':
      return {
        id: nextId(),
        kind: 'character',
        detectedAt: e.at.toISOString(),
        summary: `Character detected: ${e.name}`,
        payload: { name: e.name, geid: e.geid, accountId: e.accountId },
        signature: `character:${e.geid}`,
      };

    case 'version':
      return {
        id: nextId(),
        kind: 'version',
        detectedAt: e.at.toISOString(),
        summary: `Build: ${e.branch ?? e.fileVersion ?? e.changelist}`,
        payload: { branch: e.branch, fileVersion: e.fileVersion, changelist: e.changelist },
        signature: `version:${e.branch ?? e.fileVersion ?? e.changelist}`,
      };

    case 'ship': {
      const manufacturer = MANUFACTURER_NAMES[e.manufacturerCode] ?? e.manufacturerCode;
      const { model, variant } = splitShipModel(e.model);
      return {
        id: nextId(),
        kind: 'ship',
        detectedAt: e.at.toISOString(),
        summary: `Ship seen: ${manufacturer} ${model}${variant ? ` ${variant}` : ''}`,
        payload: {
          manufacturer,
          manufacturerCode: e.manufacturerCode,
          model,
          variant,
          rawEntity: `${e.manufacturerCode}_${e.model}`,
        },
        // De-dupe by class name (not GEID) — a second Starlifter shouldn't
        // trigger a second suggestion.
        signature: `ship:${e.manufacturerCode}_${e.model}`,
      };
    }

    case 'location':
      return {
        id: nextId(),
        kind: 'location',
        detectedAt: e.at.toISOString(),
        summary: `Location loaded: ${e.name}`,
        payload: { name: e.name },
        signature: `location:${e.name}`,
      };
  }
}

// Default install path for the LIVE branch on Windows. The user can override
// it via settings.
export function defaultLogPath(): string {
  return path.join(
    'C:',
    'Program Files',
    'Roberts Space Industries',
    'StarCitizen',
    'LIVE',
    'Game.log'
  );
}
