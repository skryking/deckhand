import { useEffect, useMemo, useState } from 'react';
import {
  Radio,
  Ship as ShipIcon,
  MapPin,
  PlayCircle,
  StopCircle,
  User,
  Info,
  Check,
  X as XIcon,
} from 'lucide-react';
import { Button } from '../ui';
import { useLogWatcher, type LogWatcherSuggestion } from '../../stores/logwatcher';
import { shipsApi, locationsApi, invalidateQueries } from '../../lib/db';
import { useSession } from '../../stores/session';
import type { CreateShipInput, CreateLocationInput } from '../../types/database';

const ICONS: Record<LogWatcherSuggestion['kind'], typeof Radio> = {
  'session-start': PlayCircle,
  'session-end': StopCircle,
  ship: ShipIcon,
  location: MapPin,
  character: User,
  version: Info,
};

export function LogWatcherPanel() {
  const { state, initialize, setEnabled, dismiss, resolve, clearAll } = useLogWatcher();
  const activeSession = useSession((s) => s.activeSession);
  const startSessionInStore = useSession((s) => s.start);
  const stopSessionInStore = useSession((s) => s.stop);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2500);
  };

  const suggestions = useMemo(
    () => (state?.suggestions ?? []).slice().sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
    [state?.suggestions]
  );

  const accept = async (s: LogWatcherSuggestion) => {
    setBusyId(s.id);
    try {
      switch (s.kind) {
        case 'ship': {
          const input: CreateShipInput = {
            manufacturer: String(s.payload.manufacturer ?? ''),
            model: String(s.payload.model ?? ''),
            nickname: null,
            variant: (s.payload.variant as string | null) ?? null,
            role: null,
            isOwned: true,
            acquiredAt: null,
            acquiredPrice: null,
            notes: `Auto-detected from Game.log`,
            imagePath: null,
            wikiUrl: null,
          };
          await shipsApi.create(input);
          invalidateQueries(['ships']);
          showToast('ok', `Added ${input.manufacturer} ${input.model}`);
          break;
        }
        case 'location': {
          const input: CreateLocationInput = {
            parentId: null,
            name: String(s.payload.name ?? ''),
            type: null,
            services: null,
            notes: 'Auto-detected from Game.log',
            coordX: null,
            coordXUnit: null,
            coordY: null,
            coordYUnit: null,
            coordZ: null,
            coordZUnit: null,
            firstVisitedAt: new Date(s.detectedAt),
            visitCount: 1,
            isFavorite: false,
            wikiUrl: null,
          };
          await locationsApi.create(input);
          invalidateQueries(['locations']);
          showToast('ok', `Added location ${input.name}`);
          break;
        }
        case 'session-start': {
          if (activeSession) {
            showToast('err', 'A session is already active');
            break;
          }
          await startSessionInStore();
          invalidateQueries(['sessions']);
          showToast('ok', 'Session started');
          break;
        }
        case 'session-end': {
          if (!activeSession) {
            showToast('err', 'No active session to end');
            break;
          }
          await stopSessionInStore();
          invalidateQueries(['sessions']);
          showToast('ok', 'Session ended');
          break;
        }
        case 'character':
        case 'version':
          // Informational — nothing to persist; just dismiss.
          break;
      }
      await resolve(s.id);
    } catch (err) {
      showToast('err', String(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDismiss = async (id: string) => {
    setBusyId(id);
    try {
      await dismiss(id);
    } finally {
      setBusyId(null);
    }
  };

  if (!state) return null;

  const { enabled, running, logPath, fileExists, fileSize } = state;

  return (
    <section className="mb-8">
      <h2 className="font-display text-sm font-medium tracking-display text-text-secondary mb-4 uppercase flex items-center gap-2">
        <Radio className="w-4 h-4" />
        Game Log Watcher
      </h2>
      <div className="bg-panel border border-subtle rounded p-4 space-y-4">
        {toast && (
          <div
            className={`text-xs rounded px-3 py-2 ${
              toast.type === 'ok'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-text-primary text-sm font-medium">Watch Star Citizen Game.log</h3>
            <p className="text-text-muted text-xs mt-1">
              Tail the log and surface ships, locations, and session events you can accept into Deckhand.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-panel border border-subtle rounded-full peer-checked:bg-teal-dark peer-checked:border-teal-muted transition-all" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full peer-checked:translate-x-4 peer-checked:bg-teal-bright transition-all" />
          </label>
        </div>

        {/* Status row */}
        <div className="text-xs text-text-muted font-mono flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Status:{' '}
            <span className={running ? 'text-teal-bright' : 'text-text-muted'}>
              {running ? 'watching' : 'stopped'}
            </span>
          </span>
          <span>
            Log:{' '}
            <span className={fileExists ? 'text-text-secondary' : 'text-danger'}>
              {fileExists ? `${(fileSize / 1024).toFixed(1)} KB` : 'not found'}
            </span>
          </span>
          <span className="break-all">{logPath}</span>
        </div>

        {/* Suggestions list */}
        <div className="h-px bg-subtle" />
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-sm font-medium">
            Suggestions{' '}
            <span className="text-text-muted text-xs">({suggestions.length})</span>
          </h3>
          {suggestions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearAll()}>
              Clear all
            </Button>
          )}
        </div>

        {suggestions.length === 0 ? (
          <p className="text-text-muted text-xs py-4 text-center">
            {enabled
              ? 'No suggestions yet — play some Star Citizen and come back.'
              : 'Enable the watcher to start collecting suggestions.'}
          </p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar-deckhand pr-1">
            {suggestions.map((s) => {
              const Icon = ICONS[s.kind];
              const acceptable =
                s.kind === 'ship' ||
                s.kind === 'location' ||
                s.kind === 'session-start' ||
                s.kind === 'session-end';
              const acceptLabel = acceptableLabel(s.kind);
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 bg-hull border border-subtle rounded px-3 py-2"
                >
                  <Icon className="w-4 h-4 text-teal-bright flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{s.summary}</p>
                    <p className="text-[11px] text-text-muted font-mono">
                      {new Date(s.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  {acceptable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === s.id}
                      onClick={() => accept(s)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      {acceptLabel}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === s.id}
                    onClick={() => onDismiss(s.id)}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function acceptableLabel(kind: LogWatcherSuggestion['kind']): string {
  switch (kind) {
    case 'ship':
      return 'Add to fleet';
    case 'location':
      return 'Add to atlas';
    case 'session-start':
      return 'Start session';
    case 'session-end':
      return 'End session';
    default:
      return 'Accept';
  }
}
