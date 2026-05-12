// Pure parsers for Star Citizen Game.log lines. No Node/Electron imports —
// keep this testable in isolation.

export type ParsedEvent =
  | { kind: 'session-start'; at: Date }
  | { kind: 'session-end'; at: Date; reason?: string }
  | { kind: 'character'; at: Date; name: string; geid: string; accountId: string }
  | { kind: 'version'; at: Date; branch?: string; fileVersion?: string; changelist?: string }
  | { kind: 'ship'; at: Date; manufacturerCode: string; model: string; geid: string }
  | { kind: 'location'; at: Date; name: string };

// Manufacturer code → display name. Codes come from the entity class prefix
// seen in log lines (e.g. `CRUS_Starlifter_M2_...`).
export const MANUFACTURER_NAMES: Record<string, string> = {
  AEGS: 'Aegis Dynamics',
  ANVL: 'Anvil Aerospace',
  ARGO: 'ARGO Astronautics',
  BANU: 'Banu',
  CNOU: 'Consolidated Outland',
  CRUS: 'Crusader Industries',
  DRAK: 'Drake Interplanetary',
  ESPR: 'Esperia',
  GAMA: 'Gatac',
  GRIN: 'Greycat Industrial',
  KRTK: 'Kruger Intergalactic',
  MISC: 'Musashi Industrial & Starflight Concern',
  ORIG: 'Origin Jumpworks',
  RSI: 'Roberts Space Industries',
  TMBL: 'Tumbril Land Systems',
  VNCL: 'Vanduul',
  XIAN: "Xi'an",
  XNAA: "Xi'an Aerospace",
};

// Every log line starts with `<ISO-8601Z>`. Extract it so events carry the
// in-game timestamp rather than wall-clock.
const TIMESTAMP_RE = /^<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)>/;

function extractTimestamp(line: string, fallback: Date): Date {
  const m = TIMESTAMP_RE.exec(line);
  if (!m) return fallback;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

const SESSION_START_RE = /Log started on /;
const SESSION_END_RE = /<SystemQuit>.*?reason=([^,]+)/;

const CHARACTER_RE =
  /<AccountLoginCharacterStatus_Character>.*?geid (\d+).*?accountId (\d+).*?name (\w+)/;

const BRANCH_RE = /^<[^>]+>\s*Branch:\s*(\S+)/;
const FILE_VERSION_RE = /^<[^>]+>\s*FileVersion:\s*(\S+)/;
const CHANGELIST_RE = /^<[^>]+>\s*Changelist:\s*(\S+)/;

// Quantum-travel lines carry the entity class name of a ship the client is
// aware of. Shape: `| CRUS_Starlifter_M2_9738036576194[9738036576194]|`
// Skip `NULL ENTITY` lines and anything without a manufacturer prefix.
const SHIP_ENTITY_RE =
  /\|\s+([A-Z]{3,4})_([A-Za-z0-9_]+?)_(\d{10,})\[\d{10,}\]/;

// Station / city loads surface as `LocationManager-<Name>` in PostInitialize
// messages. We only capture the name — the hierarchy comes later from socpak
// paths if we ever want it.
const LOCATION_RE = /LocationManager-([A-Za-z0-9_]+)/;

export function parseLine(line: string, now: Date = new Date()): ParsedEvent | null {
  if (!line) return null;

  if (SESSION_START_RE.test(line)) {
    return { kind: 'session-start', at: extractTimestamp(line, now) };
  }

  const endMatch = SESSION_END_RE.exec(line);
  if (endMatch) {
    return { kind: 'session-end', at: extractTimestamp(line, now), reason: endMatch[1].trim() };
  }

  const char = CHARACTER_RE.exec(line);
  if (char) {
    return {
      kind: 'character',
      at: extractTimestamp(line, now),
      geid: char[1],
      accountId: char[2],
      name: char[3],
    };
  }

  const branch = BRANCH_RE.exec(line);
  if (branch) return { kind: 'version', at: extractTimestamp(line, now), branch: branch[1] };

  const fileVersion = FILE_VERSION_RE.exec(line);
  if (fileVersion) return { kind: 'version', at: extractTimestamp(line, now), fileVersion: fileVersion[1] };

  const changelist = CHANGELIST_RE.exec(line);
  if (changelist) return { kind: 'version', at: extractTimestamp(line, now), changelist: changelist[1] };

  const ship = SHIP_ENTITY_RE.exec(line);
  if (ship) {
    const code = ship[1];
    if (MANUFACTURER_NAMES[code]) {
      return {
        kind: 'ship',
        at: extractTimestamp(line, now),
        manufacturerCode: code,
        model: ship[2],
        geid: ship[3],
      };
    }
  }

  const loc = LOCATION_RE.exec(line);
  if (loc) {
    return { kind: 'location', at: extractTimestamp(line, now), name: loc[1] };
  }

  return null;
}

// Split a ship entity's model fragment into display model + variant.
// Heuristic: if the last underscore-delimited token is a short alphanumeric
// variant code (e.g. M2, C1, A2), peel it off.
export function splitShipModel(raw: string): { model: string; variant: string | null } {
  const parts = raw.split('_');
  if (parts.length > 1) {
    const tail = parts[parts.length - 1];
    if (/^[A-Z]?\d+[A-Za-z]?$/.test(tail) || /^[A-Z]\d[A-Z]?$/.test(tail)) {
      return { model: parts.slice(0, -1).join(' '), variant: tail };
    }
  }
  return { model: parts.join(' '), variant: null };
}
