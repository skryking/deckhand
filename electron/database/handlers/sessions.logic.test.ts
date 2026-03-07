import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import {
  startSession,
  endSession,
  getActiveSession,
  findAllSessions,
  updateSession,
  deleteSession,
} from './sessions.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('startSession', () => {
  it('creates a new session', () => {
    const session = startSession(db, 50000);
    expect(session.startingBalance).toBe(50000);
    expect(session.startedAt).toBeTruthy();
    expect(session.endedAt).toBeNull();
  });

  it('auto-closes existing active sessions', () => {
    const first = startSession(db, 10000);
    startSession(db, 20000);

    const all = findAllSessions(db);
    const firstAfter = all.find(s => s.id === first.id);
    expect(firstAfter!.endedAt).toBeTruthy();
  });
});

describe('endSession', () => {
  it('ends a session with duration and ending balance', () => {
    const session = startSession(db, 50000);
    const ended = endSession(db, session.id, 55000);

    expect(ended).toBeTruthy();
    expect(ended!.endedAt).toBeTruthy();
    expect(ended!.endingBalance).toBe(55000);
    expect(ended!.durationMinutes).toBeDefined();
  });

  it('returns null for non-existent session', () => {
    expect(endSession(db, 'nonexistent')).toBeNull();
  });
});

describe('getActiveSession', () => {
  it('returns the active session', () => {
    startSession(db);

    const active = getActiveSession(db);
    expect(active).toBeTruthy();
    expect(active!.endedAt).toBeNull();
  });

  it('returns null when no active sessions', () => {
    const session = startSession(db);
    endSession(db, session.id);

    expect(getActiveSession(db)).toBeNull();
  });
});

describe('updateSession', () => {
  it('updates session notes', () => {
    const session = startSession(db);
    const updated = updateSession(db, session.id, { notes: 'Good session' });
    expect(updated.notes).toBe('Good session');
  });
});

describe('findAll with options', () => {
  it('respects limit', () => {
    for (let i = 0; i < 5; i++) {
      startSession(db);
      // End each so they don't auto-close each other interfering with count
      const active = getActiveSession(db);
      if (active) endSession(db, active.id);
    }

    const all = findAllSessions(db);
    expect(all).toHaveLength(5);

    const limited = findAllSessions(db, { limit: 3 });
    expect(limited).toHaveLength(3);
  });
});

describe('deleteSession', () => {
  it('removes the session', () => {
    const session = startSession(db);
    deleteSession(db, session.id);

    const all = findAllSessions(db);
    expect(all.find(s => s.id === session.id)).toBeUndefined();
  });
});
