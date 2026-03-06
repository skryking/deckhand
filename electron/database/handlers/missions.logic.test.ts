import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  createMission,
  findMissionById,
  findMissionsByStatus,
  getActiveMissions,
  updateMission,
  completeMission,
  deleteMission,
  searchMissions,
} from './missions.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createMission', () => {
  it('creates an active mission without a reward transaction', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'active',
      reward: 5000,
    });

    expect(mission.title).toBe('Bounty Hunt');
    expect(mission.status).toBe('active');

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });

  it('creates reward transaction when created as completed', () => {
    const mission = createMission(db, {
      title: 'Delivery Run',
      status: 'completed',
      reward: 3000,
      completedAt: new Date(),
    });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(3000);
    expect(txns[0].category).toBe('mission');
  });

  it('does not create transaction for completed mission with zero reward', () => {
    const mission = createMission(db, {
      title: 'Favor',
      status: 'completed',
      reward: 0,
      completedAt: new Date(),
    });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('completeMission', () => {
  it('creates reward transaction on completion', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'active',
      reward: 5000,
    });

    const completed = completeMission(db, mission.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeTruthy();

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(5000);
  });

  it('is idempotent — does not create duplicate reward', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'active',
      reward: 5000,
    });

    completeMission(db, mission.id);
    completeMission(db, mission.id);

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(1);
  });

  it('does not create transaction for mission with no reward', () => {
    const mission = createMission(db, {
      title: 'Volunteer Work',
      status: 'active',
    });

    completeMission(db, mission.id);

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('updateMission', () => {
  it('creates reward transaction when status changes to completed', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'active',
      reward: 5000,
    });

    updateMission(db, mission.id, { status: 'completed', completedAt: new Date() });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(5000);
  });

  it('removes reward transaction when status moves away from completed', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'completed',
      reward: 5000,
      completedAt: new Date(),
    });

    updateMission(db, mission.id, { status: 'active' });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });

  it('updates reward amount on existing transaction', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'completed',
      reward: 5000,
      completedAt: new Date(),
    });

    updateMission(db, mission.id, { reward: 8000 });

    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(8000);
  });
});

describe('deleteMission', () => {
  it('deletes mission and associated transactions', () => {
    const mission = createMission(db, {
      title: 'Bounty Hunt',
      status: 'completed',
      reward: 5000,
      completedAt: new Date(),
    });

    deleteMission(db, mission.id);

    expect(findMissionById(db, mission.id)).toBeNull();
    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });
});

describe('query operations', () => {
  it('findByStatus filters correctly', () => {
    createMission(db, { title: 'A', status: 'active' });
    createMission(db, { title: 'B', status: 'completed', completedAt: new Date() });

    expect(findMissionsByStatus(db, 'active')).toHaveLength(1);
    expect(findMissionsByStatus(db, 'completed')).toHaveLength(1);
  });

  it('getActive returns only active missions', () => {
    createMission(db, { title: 'A', status: 'active' });
    createMission(db, { title: 'B', status: 'completed', completedAt: new Date() });
    createMission(db, { title: 'C', status: 'active' });

    expect(getActiveMissions(db)).toHaveLength(2);
  });

  it('search finds by title, description, and contractor', () => {
    createMission(db, { title: 'Bounty Hunt', contractor: 'Miles Eckhart' });
    createMission(db, { title: 'Delivery', description: 'Deliver bounty supplies' });

    expect(searchMissions(db, 'bounty')).toHaveLength(2);
    expect(searchMissions(db, 'eckhart')).toHaveLength(1);
  });
});
