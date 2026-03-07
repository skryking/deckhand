import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, type TestDB } from '../db-test-utils';
import {
  createTransaction,
  findAllTransactions,
  updateTransaction,
  deleteTransaction,
  getBalance,
} from './transactions.logic';

let db: TestDB;

beforeEach(() => {
  ({ db } = createTestDatabase());
});

describe('createTransaction', () => {
  it('creates a transaction', () => {
    const txn = createTransaction(db, {
      amount: 5000,
      category: 'mission',
      description: 'Bounty reward',
      timestamp: new Date(),
    });

    expect(txn.amount).toBe(5000);
    expect(txn.category).toBe('mission');
    expect(txn.id).toBeTruthy();
  });
});

describe('updateTransaction', () => {
  it('updates transaction fields', () => {
    const txn = createTransaction(db, {
      amount: 5000,
      category: 'mission',
      timestamp: new Date(),
    });

    const updated = updateTransaction(db, txn.id, { amount: 7000, description: 'Updated' });
    expect(updated.amount).toBe(7000);
    expect(updated.description).toBe('Updated');
  });
});

describe('deleteTransaction', () => {
  it('removes the transaction', () => {
    const txn = createTransaction(db, {
      amount: 5000,
      category: 'mission',
      timestamp: new Date(),
    });

    deleteTransaction(db, txn.id);
    expect(findAllTransactions(db)).toHaveLength(0);
  });
});

describe('getBalance', () => {
  it('returns zero with no transactions', () => {
    expect(getBalance(db)).toBe(0);
  });

  it('sums all transaction amounts', () => {
    createTransaction(db, { amount: 5000, category: 'mission', timestamp: new Date() });
    createTransaction(db, { amount: -2000, category: 'repair', timestamp: new Date() });
    createTransaction(db, { amount: 1000, category: 'cargo', timestamp: new Date() });

    expect(getBalance(db)).toBe(4000);
  });
});

describe('findAll with options', () => {
  it('respects limit', () => {
    for (let i = 0; i < 5; i++) {
      createTransaction(db, { amount: i * 100, category: 'other', timestamp: new Date() });
    }

    const limited = findAllTransactions(db, { limit: 3 });
    expect(limited).toHaveLength(3);
  });
});
