import { eq, desc } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';
import { incrementVisit } from './locations.logic';

type DB = TestDB;

function bumpMissionVisit(
  tx: DB,
  shipId: string | null | undefined,
  locationId: string | null | undefined,
) {
  if (shipId && locationId) incrementVisit(tx, locationId);
}

export function findAllMissions(db: DB, options?: { limit?: number; offset?: number }) {
  let query = db.select().from(schema.missions).orderBy(desc(schema.missions.acceptedAt));
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }
  return query.all();
}

export function createMission(db: DB, data: typeof schema.missions.$inferInsert) {
  return db.transaction((tx) => {
    const newMission = tx.insert(schema.missions).values(data).returning().get();

    if (newMission.status === 'completed' && newMission.reward != null && newMission.reward > 0) {
      tx.insert(schema.transactions).values({
        timestamp: newMission.completedAt ?? new Date(),
        amount: newMission.reward,
        category: 'mission',
        description: `Mission completed: ${newMission.title}`,
        locationId: newMission.locationId,
        shipId: newMission.shipId,
        missionId: newMission.id,
      }).run();
    }

    if (newMission.status === 'completed') {
      bumpMissionVisit(tx, newMission.shipId, newMission.locationId);
    }

    return newMission;
  });
}

export function updateMission(db: DB, id: string, data: Partial<typeof schema.missions.$inferInsert>) {
  return db.transaction((tx) => {
    const current = tx.select().from(schema.missions).where(eq(schema.missions.id, id)).get();
    if (!current) throw new Error('Mission not found');

    const updated = tx
      .update(schema.missions)
      .set(data)
      .where(eq(schema.missions.id, id))
      .returning()
      .get();

    const wasCompleted = current.status === 'completed';
    const isNowCompleted = updated.status === 'completed';

    if (isNowCompleted && updated.reward != null && updated.reward > 0) {
      const existingTxn = tx.select().from(schema.transactions)
        .where(eq(schema.transactions.missionId, id))
        .get();

      if (existingTxn) {
        tx.update(schema.transactions)
          .set({
            amount: updated.reward,
            description: `Mission completed: ${updated.title}`,
            locationId: updated.locationId,
            shipId: updated.shipId,
          })
          .where(eq(schema.transactions.id, existingTxn.id))
          .run();
      } else {
        tx.insert(schema.transactions).values({
          timestamp: updated.completedAt ?? new Date(),
          amount: updated.reward,
          category: 'mission',
          description: `Mission completed: ${updated.title}`,
          locationId: updated.locationId,
          shipId: updated.shipId,
          missionId: id,
        }).run();
      }
    } else if (wasCompleted && !isNowCompleted) {
      tx.delete(schema.transactions)
        .where(eq(schema.transactions.missionId, id))
        .run();
    }

    if (!wasCompleted && isNowCompleted) {
      bumpMissionVisit(tx, updated.shipId, updated.locationId);
    }

    return updated;
  });
}

export function completeMission(db: DB, id: string) {
  return db.transaction((tx) => {
    const mission = tx.select().from(schema.missions).where(eq(schema.missions.id, id)).get();
    if (!mission) throw new Error('Mission not found');

    const wasAlreadyCompleted = mission.status === 'completed';
    const completedAt = new Date();
    const updated = tx
      .update(schema.missions)
      .set({ status: 'completed', completedAt })
      .where(eq(schema.missions.id, id))
      .returning()
      .get();

    if (mission.reward != null && mission.reward > 0) {
      const existingTxn = tx.select().from(schema.transactions)
        .where(eq(schema.transactions.missionId, id))
        .get();

      if (!existingTxn) {
        tx.insert(schema.transactions).values({
          timestamp: completedAt,
          amount: mission.reward,
          category: 'mission',
          description: `Mission completed: ${mission.title}`,
          locationId: mission.locationId,
          shipId: mission.shipId,
          missionId: id,
        }).run();
      }
    }

    if (!wasAlreadyCompleted) {
      bumpMissionVisit(tx, mission.shipId, mission.locationId);
    }

    return updated;
  });
}

export function deleteMission(db: DB, id: string) {
  db.transaction((tx) => {
    tx.delete(schema.transactions).where(eq(schema.transactions.missionId, id)).run();
    tx.delete(schema.missions).where(eq(schema.missions.id, id)).run();
  });
}

