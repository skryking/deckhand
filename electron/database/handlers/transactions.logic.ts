import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import * as schema from '../schema';
import type { TestDB } from '../db-test-utils';

type DB = TestDB;

export function findAllTransactions(db: DB, options?: { limit?: number; offset?: number }) {
  let query = db.select().from(schema.transactions).orderBy(desc(schema.transactions.timestamp));
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }
  return query.all();
}

export function findTransactionsByCategory(db: DB, category: string) {
  return db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.category, category))
    .orderBy(desc(schema.transactions.timestamp))
    .all();
}

export function findTransactionsByDateRange(db: DB, startDate: number, endDate: number) {
  return db
    .select()
    .from(schema.transactions)
    .where(
      and(
        gte(schema.transactions.timestamp, new Date(startDate)),
        lte(schema.transactions.timestamp, new Date(endDate))
      )
    )
    .orderBy(desc(schema.transactions.timestamp))
    .all();
}

export function createTransaction(db: DB, data: typeof schema.transactions.$inferInsert) {
  const insertData = {
    ...data,
    timestamp: data.timestamp ? new Date(data.timestamp as unknown as string | number) : new Date(),
  };
  return db.insert(schema.transactions).values(insertData).returning().get();
}

export function updateTransaction(db: DB, id: string, data: Partial<typeof schema.transactions.$inferInsert>) {
  const updateData = {
    ...data,
    timestamp: data.timestamp ? new Date(data.timestamp as unknown as string | number) : undefined,
  };
  return db
    .update(schema.transactions)
    .set(updateData)
    .where(eq(schema.transactions.id, id))
    .returning()
    .get();
}

export function deleteTransaction(db: DB, id: string) {
  db.delete(schema.transactions).where(eq(schema.transactions.id, id)).run();
}

export function getBalance(db: DB) {
  const result = db
    .select({ total: sql<number>`SUM(${schema.transactions.amount})` })
    .from(schema.transactions)
    .get();
  return result?.total || 0;
}

export function getBalanceByCategory(db: DB) {
  const results = db
    .select({
      category: schema.transactions.category,
      total: sql<number>`SUM(${schema.transactions.amount})`,
    })
    .from(schema.transactions)
    .groupBy(schema.transactions.category)
    .all();

  const categoryTotals: Record<string, number> = {};
  for (const row of results) {
    categoryTotals[row.category] = row.total || 0;
  }
  return categoryTotals;
}
