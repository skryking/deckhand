import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import * as schema from '../schema';
import {
  createMission,
  updateMission,
  completeMission,
  deleteMission,
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

    const rows = db.select().from(schema.missions)
      .where(eq(schema.missions.id, mission.id)).all();
    expect(rows).toHaveLength(0);
    const txns = db.select().from(schema.transactions)
      .where(eq(schema.transactions.missionId, mission.id)).all();
    expect(txns).toHaveLength(0);
  });
});