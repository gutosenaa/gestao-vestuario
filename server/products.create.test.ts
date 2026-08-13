import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { auditLogs, products, users } from '../drizzle/schema';
import { getDb } from './db';
import type { TrpcContext } from './_core/context';

vi.mock('./storage', () => ({
  storagePut: vi.fn(async () => { throw new Error('storage down'); }),
}));

const { appRouter } = await import('./routers');
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let userId = 0;
let productId = 0;

function context(user: NonNullable<TrpcContext['user']>): TrpcContext {
  return { user, req: { protocol: 'https', headers: {} } as TrpcContext['req'], res: { clearCookie: () => undefined } as TrpcContext['res'] };
}

describe('products.create com falha de storage', () => {
  beforeAll(async () => {
    const connection = await getDb();
    if (!connection) throw new Error('Banco indisponível.');
    db = connection;
    const inserted = await db.insert(users).values({ openId: `product-create-storage-${Date.now()}`, name: 'Teste create storage', role: 'Admin' });
    userId = Number(inserted[0].insertId);
  });

  it('conclui o produto e retorna imageUploadFailed quando o storage falha', async () => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const caller = appRouter.createCaller(context(user!));
    const result = await caller.commerce.products.create({
      name: 'Produto storage indisponível',
      listPriceCents: 12000,
      usdValueCents: 0,
      initialQuantity: 0,
      imageDataUrl: `data:image/png;base64,${Buffer.from('foto').toString('base64')}`,
    });
    productId = result.id;
    expect(result.imageUploadFailed).toBe(true);
  });

  afterAll(async () => {
    if (!db || !userId) return;
    if (productId) await db.delete(products).where(eq(products.id, productId));
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });
});
