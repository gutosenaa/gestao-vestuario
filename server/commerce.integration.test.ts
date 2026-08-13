import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { alerts, auditLogs, financialEntries, inventoryLots, inventoryMovements, products, purchaseItems, purchases, saleItems, sales, users } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let userId = 0;
let productId = 0;
let purchaseId = 0;
let saleId = 0;
let createdProductId = 0;
let caller: ReturnType<typeof appRouter.createCaller>;

function context(user: NonNullable<TrpcContext["user"]>): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("operações comerciais transacionais", () => {
  beforeAll(async () => {
    const connection = await getDb();
    if (!connection) throw new Error("Banco de dados indisponível para os testes de integração.");
    db = connection;
    const stamp = Date.now();
    const insertedUser = await db.insert(users).values({ openId: `commerce-test-${stamp}`, name: "Teste Comercial", role: "Admin" });
    userId = Number(insertedUser[0].insertId);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    caller = appRouter.createCaller(context(user!));
    const insertedProduct = await db.insert(products).values({
      code: `TEST${stamp}`,
      name: "Produto de integração",
      listPriceCents: 18000,
      usdValueCents: 0,
      quoteMicros: 5600000,
      createdByUserId: userId,
    });
    productId = Number(insertedProduct[0].insertId);
  });

  it("registra compra, cria conta a pagar, vende pelo primeiro lote e cria conta a receber", async () => {
    const purchase = await caller.commerce.purchases.create({
      purchaseDate: new Date(),
      paymentStatus: "pendente",
      items: [{ productId, quantity: 2, unitCostCents: 8000 }],
    });
    purchaseId = purchase.id;
    const [payable] = await db.select().from(financialEntries).where(and(eq(financialEntries.sourceType, "compra"), eq(financialEntries.sourceId, purchaseId)));
    const [lot] = await db.select().from(inventoryLots).where(eq(inventoryLots.productId, productId));
    expect(payable).toMatchObject({ kind: "pagar", amountCents: 16000, status: "pendente" });
    expect(lot).toMatchObject({ availableQuantity: 2, unitCostCents: 8000 });

    const sale = await caller.commerce.sales.create({
      soldAt: new Date(),
      paymentStatus: "pendente",
      discountCents: 0,
      items: [{ productId, quantity: 1, unitPriceCents: 18000 }],
    });
    saleId = sale.saleId;
    const [receivable] = await db.select().from(financialEntries).where(and(eq(financialEntries.sourceType, "venda"), eq(financialEntries.sourceId, saleId)));
    const [updatedLot] = await db.select().from(inventoryLots).where(eq(inventoryLots.id, lot!.id));
    const [storedSale] = await db.select().from(sales).where(eq(sales.id, saleId));
    const [storedItem] = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    const [saleMovement] = await db.select().from(inventoryMovements).where(and(eq(inventoryMovements.saleId, saleId), eq(inventoryMovements.type, "venda")));
    const saleAlerts = await db.select().from(alerts).where(and(eq(alerts.referenceType, "venda"), eq(alerts.referenceId, saleId)));
    const productAlerts = await db.select().from(alerts).where(and(eq(alerts.referenceType, "produto"), eq(alerts.referenceId, productId)));
    expect(receivable).toMatchObject({ kind: "receber", amountCents: 18000, status: "pendente" });
    expect(saleAlerts).toHaveLength(0);
    expect(productAlerts).toHaveLength(0);
    expect(updatedLot?.availableQuantity).toBe(1);
    expect(storedSale).toMatchObject({ costCents: 8000, netCents: 18000, profitCents: 10000 });
    expect(storedItem).toMatchObject({ productId, quantity: 1, unitPriceCents: 18000, unitCostCents: 8000, totalCostCents: 8000 });
    expect(saleMovement).toMatchObject({ productId, saleId, quantity: -1, unitCostCents: 8000 });

    const created = await caller.commerce.products.create({
      name: "Produto create sem imagem",
      listPriceCents: 12000,
      usdValueCents: 0,
      initialQuantity: 0,
    });
    createdProductId = created.id;
    expect(created).toMatchObject({ code: expect.stringMatching(/^COD/), imageUploadFailed: false });
    const oversizedImage = Buffer.alloc(4_000_001, 1).toString("base64");
    await expect(caller.commerce.products.create({
      name: "Produto imagem grande",
      listPriceCents: 12000,
      usdValueCents: 0,
      initialQuantity: 0,
      imageDataUrl: `data:image/png;base64,${oversizedImage}`,
    })).rejects.toThrow("4 MB");
  });

  afterAll(async () => {
    if (!db || !userId) return;
    await db.delete(financialEntries).where(inArray(financialEntries.sourceId, [purchaseId, saleId].filter(Boolean)));
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(alerts).where(and(eq(alerts.referenceType, "venda"), eq(alerts.referenceId, saleId)));
    await db.delete(inventoryMovements).where(eq(inventoryMovements.productId, productId));
    await db.delete(inventoryLots).where(eq(inventoryLots.productId, productId));
    await db.delete(saleItems).where(eq(saleItems.saleId, saleId));
    await db.delete(sales).where(eq(sales.id, saleId));
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
    await db.delete(purchases).where(eq(purchases.id, purchaseId));
    if (createdProductId) {
      await db.delete(auditLogs).where(and(eq(auditLogs.userId, userId), eq(auditLogs.entityId, createdProductId)));
      await db.delete(products).where(eq(products.id, createdProductId));
    }
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(users).where(eq(users.id, userId));
  });
});
