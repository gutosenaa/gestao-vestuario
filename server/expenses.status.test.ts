import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { auditLogs, expenses, financialEntries, users } from '../drizzle/schema';
import { getDb } from './db';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let userId = 0;
let expenseId = 0;

function context(user: NonNullable<TrpcContext['user']>): TrpcContext {
  return { user, req: { protocol: 'https', headers: {} } as TrpcContext['req'], res: { clearCookie: () => undefined } as TrpcContext['res'] };
}

describe('status de despesas', () => {
  beforeAll(async () => {
    const connection = await getDb();
    if (!connection) throw new Error('Banco indisponível.');
    db = connection;
    const inserted = await db.insert(users).values({ openId: `expense-status-${Date.now()}`, name: 'Teste despesa', role: 'Financeiro' });
    userId = Number(inserted[0].insertId);
  });

  it('marca a despesa e a conta a pagar como pagas', async () => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const caller = appRouter.createCaller(context(user!));
    const created = await caller.commerce.expenses.create({ expenseDate: new Date(), category: 'Operacional', description: 'Despesa de teste', amountCents: 2500, status: 'pendente' });
    expenseId = created.id;
    const updated = await caller.commerce.expenses.updateStatus({ id: expenseId, status: 'pago' });
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    const [entry] = await db.select().from(financialEntries).where(and(eq(financialEntries.sourceType, 'despesa'), eq(financialEntries.sourceId, expenseId)));
    expect(updated.status).toBe('pago');
    expect(expense).toMatchObject({ status: 'pago' });
    expect(expense?.paidAt).toBeTruthy();
    expect(entry).toMatchObject({ status: 'pago' });
    expect(entry?.settledAt).toBeTruthy();
  });

  afterAll(async () => {
    if (!db || !userId) return;
    if (expenseId) {
      await db.delete(financialEntries).where(and(eq(financialEntries.sourceType, 'despesa'), eq(financialEntries.sourceId, expenseId)));
      await db.delete(expenses).where(eq(expenses.id, expenseId));
    }
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });
});
