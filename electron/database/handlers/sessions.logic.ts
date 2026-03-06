import { eq, desc, isNull } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllSessions(db: DB, options?: { limit?: number; offset?: number }) {
  let query = db.select().from(schema.sessions).orderBy(desc(schema.sessions.startedAt));
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }
  return query.all();
}

export function findSessionById(db: DB, id: string) {
  const results = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).all();
  return results[0] || null;
}

export function getActiveSession(db: DB) {
  const results = db
    .select()
    .from(schema.sessions)
    .where(isNull(schema.sessions.endedAt))
    .orderBy(desc(schema.sessions.startedAt))
    .limit(1)
    .all();
  return results[0] || null;
}

export function startSession(db: DB, startingBalance?: number) {
  // End any active sessions first
  const activeSessions = db
    .select()
    .from(schema.sessions)
    .where(isNull(schema.sessions.endedAt))
    .all();

  for (const session of activeSessions) {
    const duration = Math.floor((Date.now() - (session.startedAt?.getTime() || Date.now())) / 60000);
    db.update(schema.sessions)
      .set({
        endedAt: new Date(),
        durationMinutes: duration,
      })
      .where(eq(schema.sessions.id, session.id))
      .run();
  }

  return db
    .insert(schema.sessions)
    .values({
      startedAt: new Date(),
      startingBalance,
    })
    .returning()
    .get();
}

export function endSession(db: DB, id: string, endingBalance?: number) {
  const session = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).get();
  if (!session) return null;

  const duration = Math.floor((Date.now() - (session.startedAt?.getTime() || Date.now())) / 60000);

  return db
    .update(schema.sessions)
    .set({
      endedAt: new Date(),
      durationMinutes: duration,
      endingBalance,
    })
    .where(eq(schema.sessions.id, id))
    .returning()
    .get();
}

export function updateSession(db: DB, id: string, data: Partial<typeof schema.sessions.$inferInsert>) {
  return db
    .update(schema.sessions)
    .set(data)
    .where(eq(schema.sessions.id, id))
    .returning()
    .get();
}

export function deleteSession(db: DB, id: string) {
  db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
}
