import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  alerts, auditLogs, businessSettings, customers, dollarQuotes, expenses, financialEntries,
  inventoryLots, inventoryMovements, paymentMethods, products, purchaseItems, purchases,
  saleChannels, saleItems, sales, suppliers,
} from "../../drizzle/schema";
import { allocateFifoLots, calculatePricing, calculateSaleTotals } from "../calculations";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const financeRoles = ["Admin", "Financeiro"] as const;
const operationalRoles = ["Admin", "Vendedor", "Estoque"] as const;

function restrictRoles(role: string, allowed: readonly string[]) {
  if (!allowed.includes(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não tem permissão para esta operação." });
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db;
}

async function ensureSettings() {
  const db = await dbOrThrow();
  const current = await db.select().from(businessSettings).limit(1);
  if (current[0]) return current[0];
  await db.insert(businessSettings).values({});
  const created = await db.select().from(businessSettings).limit(1);
  return created[0]!;
}

function makeProductCode(lastCode?: string | null) {
  const previous = Number(lastCode?.replace("COD", "") ?? 0);
  return `COD${String(previous + 1).padStart(3, "0")}`;
}

const MAX_PRODUCT_IMAGE_BYTES = 4_000_000;

export function decodeProductImage(imageDataUrl?: string) {
  if (!imageDataUrl) return null;
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem enviada é inválida." });
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_PRODUCT_IMAGE_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem deve ter no máximo 4 MB." });
  return { mimeType: match[1], extension: match[1].split("/")[1].replace("jpeg", "jpg"), bytes };
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("storage-timeout")), timeoutMs); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const commerceRouter = router({
  catalog: router({
    bootstrap: protectedProcedure.query(async () => {
      const db = await dbOrThrow();
      await ensureSettings();
      const [allSuppliers, allCustomers, channels, methods, settings] = await Promise.all([
        db.select().from(suppliers).where(eq(suppliers.active, true)).orderBy(asc(suppliers.name)),
        db.select().from(customers).orderBy(asc(customers.name)),
        db.select().from(saleChannels).where(eq(saleChannels.active, true)).orderBy(asc(saleChannels.name)),
        db.select().from(paymentMethods).where(eq(paymentMethods.active, true)).orderBy(asc(paymentMethods.name)),
        ensureSettings(),
      ]);
      return { suppliers: allSuppliers, customers: allCustomers, channels, methods, settings };
    }),
    search: protectedProcedure.input(z.object({ query: z.string().min(1).max(120) })).query(async ({ input }) => {
      const db = await dbOrThrow();
      const query = input.query.toLocaleLowerCase("pt-BR").trim();
      const [allProducts, allCustomers, allSuppliers, allSales, allPurchases] = await Promise.all([
        db.select().from(products).orderBy(desc(products.createdAt)), db.select().from(customers).orderBy(desc(customers.createdAt)), db.select().from(suppliers).orderBy(desc(suppliers.createdAt)), db.select().from(sales).orderBy(desc(sales.soldAt)), db.select().from(purchases).orderBy(desc(purchases.purchaseDate)),
      ]);
      const includes = (...values: Array<string | null | undefined>) => values.filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query);
      return {
        products: allProducts.filter(row => includes(row.code, row.name, row.team, row.league, row.collection)).slice(0, 6).map(row => ({ id: row.id, label: row.name, subtitle: row.code, type: "Produto" })),
        customers: allCustomers.filter(row => includes(row.name, row.whatsapp, row.instagram, row.city)).slice(0, 6).map(row => ({ id: row.id, label: row.name, subtitle: row.whatsapp || row.city || "Cliente", type: "Cliente" })),
        suppliers: allSuppliers.filter(row => includes(row.name, row.company, row.whatsapp, row.country)).slice(0, 6).map(row => ({ id: row.id, label: row.name, subtitle: row.company || row.country || "Fornecedor", type: "Fornecedor" })),
        sales: allSales.filter(row => includes(row.saleNumber, row.notes)).slice(0, 6).map(row => ({ id: row.id, label: row.saleNumber, subtitle: `Venda de ${(row.netCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, type: "Venda" })),
        purchases: allPurchases.filter(row => includes(row.orderNumber, row.notes)).slice(0, 6).map(row => ({ id: row.id, label: row.orderNumber || `Compra #${row.id}`, subtitle: `Compra de ${(row.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, type: "Compra" })),
      };
    }),
    customerInsights: protectedProcedure.query(async () => {
      const db = await dbOrThrow();
      const [allCustomers, allSales, allItems] = await Promise.all([db.select().from(customers).orderBy(asc(customers.name)), db.select().from(sales).orderBy(desc(sales.soldAt)), db.select().from(saleItems)]);
      const byCustomer = new Map<number, { purchases: number; totalCents: number; lastPurchase?: Date; productIds: number[] }>();
      allSales.filter(sale => sale.customerId && sale.paymentStatus !== "cancelado").forEach(sale => {
        const row = byCustomer.get(sale.customerId!) ?? { purchases: 0, totalCents: 0, productIds: [] };
        row.purchases += 1; row.totalCents += sale.netCents; if (!row.lastPurchase || sale.soldAt > row.lastPurchase) row.lastPurchase = sale.soldAt;
        row.productIds.push(...allItems.filter(item => item.saleId === sale.id).map(item => item.productId)); byCustomer.set(sale.customerId!, row);
      });
      const now = Date.now();
      return allCustomers.map(customer => { const row = byCustomer.get(customer.id) ?? { purchases: 0, totalCents: 0, productIds: [] }; const daysWithoutPurchase = row.lastPurchase ? Math.floor((now - row.lastPurchase.getTime()) / 86400000) : null; const classification = !row.purchases ? "novo" : (daysWithoutPurchase !== null && daysWithoutPurchase > 120) ? "inativo" : row.purchases >= 5 || row.totalCents >= 100000 ? "VIP" : row.purchases >= 2 ? "recorrente" : "novo"; return { ...customer, classification, purchaseCount: row.purchases, totalCents: row.totalCents, ticketCents: row.purchases ? Math.round(row.totalCents / row.purchases) : 0, lastPurchase: row.lastPurchase ?? null, productCount: new Set(row.productIds).size, daysWithoutPurchase }; });
    }),
    saveSupplier: protectedProcedure.input(z.object({ id: z.number().optional(), name: z.string().min(2), company: z.string().optional(), whatsapp: z.string().optional(), country: z.string().optional(), city: z.string().optional(), sourceUrl: z.string().url().optional().or(z.literal("")), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Estoque"]);
      const db = await dbOrThrow();
      const values = { name: input.name, company: input.company || null, whatsapp: input.whatsapp || null, country: input.country || null, city: input.city || null, sourceUrl: input.sourceUrl || null, notes: input.notes || null };
      if (input.id) { await db.update(suppliers).set(values).where(eq(suppliers.id, input.id)); return { id: input.id }; }
      const result = await db.insert(suppliers).values(values);
      return { id: Number(result[0].insertId) };
    }),
    saveCustomer: protectedProcedure.input(z.object({ id: z.number().optional(), name: z.string().min(2), whatsapp: z.string().optional(), instagram: z.string().optional(), email: z.string().email().optional().or(z.literal("")), city: z.string().optional(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Vendedor"]);
      const db = await dbOrThrow();
      const values = { name: input.name, whatsapp: input.whatsapp || null, instagram: input.instagram || null, email: input.email || null, city: input.city || null, notes: input.notes || null };
      if (input.id) { await db.update(customers).set(values).where(eq(customers.id, input.id)); return { id: input.id }; }
      const result = await db.insert(customers).values(values);
      return { id: Number(result[0].insertId) };
    }),
    saveSaleChannel: protectedProcedure.input(z.object({ id: z.number().optional(), name: z.string().min(2), feeBps: z.number().int().min(0).max(10000), active: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin"]);
      const db = await dbOrThrow();
      const values = { name: input.name, feeBps: input.feeBps, active: input.active };
      if (input.id) { await db.update(saleChannels).set(values).where(eq(saleChannels.id, input.id)); return { id: input.id }; }
      const result = await db.insert(saleChannels).values(values);
      return { id: Number(result[0].insertId) };
    }),
    savePaymentMethod: protectedProcedure.input(z.object({ id: z.number().optional(), name: z.string().min(2), feeBps: z.number().int().min(0).max(10000), active: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin"]);
      const db = await dbOrThrow();
      const values = { name: input.name, feeBps: input.feeBps, active: input.active };
      if (input.id) { await db.update(paymentMethods).set(values).where(eq(paymentMethods.id, input.id)); return { id: input.id }; }
      const result = await db.insert(paymentMethods).values(values);
      return { id: Number(result[0].insertId) };
    }),
  }),

  products: router({
    list: protectedProcedure.input(z.object({ query: z.string().optional(), status: z.enum(["ativo", "inativo", "todos"]).default("ativo") }).optional()).query(async ({ input }) => {
      const db = await dbOrThrow();
      const rows = await db.select().from(products).orderBy(desc(products.createdAt));
      const movementRows = await db.select({ productId: inventoryMovements.productId, quantity: inventoryMovements.quantity }).from(inventoryMovements);
      const stockByProduct = new Map<number, number>();
      movementRows.forEach(row => stockByProduct.set(row.productId, (stockByProduct.get(row.productId) ?? 0) + row.quantity));
      const query = input?.query?.toLocaleLowerCase("pt-BR").trim();
      return rows.filter(product => {
        const statusOk = input?.status === "todos" || !input?.status || product.status === input.status;
        const queryOk = !query || [product.code, product.name, product.team, product.category, product.size, product.league, product.collection].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query);
        return statusOk && queryOk;
      }).map(product => ({ ...product, stock: stockByProduct.get(product.id) ?? 0 }));
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(2), team: z.string().optional(), league: z.string().optional(), collection: z.string().optional(), category: z.string().optional(), shirtType: z.enum(["Casa", "Fora", "Especial", "Retrô"]).optional(), size: z.string().optional(), predominantColor: z.string().optional(), supplierId: z.number().optional(), supplierUrl: z.string().url().optional().or(z.literal("")), notes: z.string().optional(), listPriceCents: z.number().int().nonnegative(), usdValueCents: z.number().int().nonnegative(), quoteMicros: z.number().int().nonnegative().optional(), internationalShippingCents: z.number().int().nonnegative().default(0), domesticShippingCents: z.number().int().nonnegative().default(0), importFeesCents: z.number().int().nonnegative().default(0), packagingCostCents: z.number().int().nonnegative().default(0), otherCostsCents: z.number().int().nonnegative().default(0), initialQuantity: z.number().int().nonnegative().default(0), initialUnitCostCents: z.number().int().nonnegative().optional(), imageDataUrl: z.string().max(5_500_000).optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Estoque"]);
      const startedAt = Date.now();
      const trace = (step: string) => console.info(`[ProductCreate] ${step} +${Date.now() - startedAt}ms`);
      trace("start");
      const db = await dbOrThrow();
      trace("db-ready");
      const settings = await ensureSettings();
      trace("settings-ready");
      const last = await db.select({ code: products.code }).from(products).orderBy(desc(products.id)).limit(1);
      trace("last-code-ready");
      const code = makeProductCode(last[0]?.code);
      const { imageDataUrl, initialQuantity, initialUnitCostCents, ...productInput } = input;
      const image = decodeProductImage(imageDataUrl);
      const values = { ...productInput, code, supplierId: input.supplierId ?? null, supplierUrl: input.supplierUrl || null, team: input.team || null, league: input.league || null, collection: input.collection || null, category: input.category || null, shirtType: input.shirtType || null, size: input.size || null, predominantColor: input.predominantColor || null, notes: input.notes || null, quoteMicros: input.quoteMicros || settings.dollarQuoteMicros, createdByUserId: ctx.user.id };
      const result = await db.insert(products).values(values);
      const id = Number(result[0].insertId);
      trace(`product-inserted:${id}`);
      let imageUploadFailed = false;
      if (image) {
        try {
          const stored = await withTimeout(storagePut(`products/${id}/${nanoid(12)}.${image.extension}`, image.bytes, image.mimeType), 8000);
          await db.update(products).set({ imageKey: stored.key, imageUrl: stored.url }).where(eq(products.id, id));
        } catch (error) {
          imageUploadFailed = true;
          console.warn(`[ProductCreate] image upload skipped for ${id}:`, error);
        }
      }
      if (initialQuantity > 0) {
        const unitCostCents = initialUnitCostCents ?? input.usdValueCents;
        trace("stock-transaction-start");
        await db.transaction(async tx => {
          await tx.insert(inventoryLots).values({ productId: id, sourceType: "entrada_manual", receivedAt: new Date(), initialQuantity, availableQuantity: initialQuantity, unitCostCents });
          trace("lot-inserted");
          await tx.insert(inventoryMovements).values({ productId: id, type: "entrada_manual", quantity: initialQuantity, unitCostCents, notes: "Estoque inicial informado no cadastro", occurredAt: new Date(), createdByUserId: ctx.user.id });
          trace("movement-inserted");
        });
        trace("stock-transaction-complete");
      }
      trace("before-audit");
      await db.insert(auditLogs).values({ userId: ctx.user.id, entityType: "produto", entityId: id, action: "criado", afterData: { code, name: input.name } });
      trace("complete");
      return { id, code, imageUploadFailed };
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), name: z.string().min(2).optional(), team: z.string().optional(), league: z.string().optional(), collection: z.string().optional(), category: z.string().optional(), shirtType: z.enum(["Casa", "Fora", "Especial", "Retrô"]).optional(), size: z.string().optional(), predominantColor: z.string().optional(), supplierId: z.number().nullable().optional(), supplierUrl: z.string().url().optional().nullable().or(z.literal("")), status: z.enum(["ativo", "inativo"]).optional(), listPriceCents: z.number().int().nonnegative().optional(), usdValueCents: z.number().int().nonnegative().optional(), quoteMicros: z.number().int().nonnegative().optional(), internationalShippingCents: z.number().int().nonnegative().optional(), domesticShippingCents: z.number().int().nonnegative().optional(), importFeesCents: z.number().int().nonnegative().optional(), packagingCostCents: z.number().int().nonnegative().optional(), otherCostsCents: z.number().int().nonnegative().optional(), notes: z.string().optional(), imageDataUrl: z.string().max(5_500_000).optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Estoque"]);
      const db = await dbOrThrow();
      const { id, imageDataUrl, supplierUrl, ...changes } = input;
      const previous = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!previous[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });
      await db.update(products).set({ ...changes, supplierUrl: supplierUrl === "" ? null : supplierUrl }).where(eq(products.id, id));
      if (imageDataUrl) {
        const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem enviada é inválida." });
        const extension = match[1].split("/")[1].replace("jpeg", "jpg");
        const stored = await storagePut(`products/${id}/${nanoid(12)}.${extension}`, Buffer.from(match[2], "base64"), match[1]);
        await db.update(products).set({ imageKey: stored.key, imageUrl: stored.url }).where(eq(products.id, id));
      }
      await db.insert(auditLogs).values({ userId: ctx.user.id, entityType: "produto", entityId: id, action: changes.status === "inativo" ? "inativado" : "atualizado", beforeData: previous[0], afterData: changes });
      return { success: true };
    }),
    addStock: protectedProcedure.input(z.object({ productId: z.number(), quantity: z.number().int().positive(), unitCostCents: z.number().int().nonnegative(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Estoque"]);
      const db = await dbOrThrow();
      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });
      await db.transaction(async tx => {
        await tx.insert(inventoryLots).values({ productId: input.productId, sourceType: "entrada_manual", receivedAt: new Date(), initialQuantity: input.quantity, availableQuantity: input.quantity, unitCostCents: input.unitCostCents });
        await tx.insert(inventoryMovements).values({ productId: input.productId, type: "entrada_manual", quantity: input.quantity, unitCostCents: input.unitCostCents, notes: input.notes || "Entrada manual pelo catálogo", occurredAt: new Date(), createdByUserId: ctx.user.id });
        await tx.insert(auditLogs).values({ userId: ctx.user.id, entityType: "estoque", entityId: input.productId, action: "entrada_manual", afterData: { quantity: input.quantity, unitCostCents: input.unitCostCents } });
      });
      return { success: true };
    }),
    pricing: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      const db = await dbOrThrow();
      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });
      const settings = await ensureSettings();
      return calculatePricing({ ...product, salesTaxBps: settings.salesTaxBps, minimumMarginBps: settings.minimumMarginBps, desiredMarginBps: settings.desiredMarginBps, salePriceCents: product.listPriceCents });
    }),
    previewPricing: protectedProcedure.input(z.object({ usdValueCents: z.number().int().nonnegative(), quoteMicros: z.number().int().nonnegative(), internationalShippingCents: z.number().int().nonnegative(), domesticShippingCents: z.number().int().nonnegative(), importFeesCents: z.number().int().nonnegative(), packagingCostCents: z.number().int().nonnegative(), otherCostsCents: z.number().int().nonnegative(), salePriceCents: z.number().int().nonnegative() })).query(async ({ input }) => {
      const settings = await ensureSettings();
      return calculatePricing({ ...input, salesTaxBps: settings.salesTaxBps, minimumMarginBps: settings.minimumMarginBps, desiredMarginBps: settings.desiredMarginBps });
    }),
  }),

  purchases: router({
    create: protectedProcedure.input(z.object({ supplierId: z.number().optional(), purchaseDate: z.coerce.date(), orderNumber: z.string().optional(), shippingCents: z.number().int().nonnegative().default(0), feesCents: z.number().int().nonnegative().default(0), paymentMethodId: z.number().optional(), paymentStatus: z.enum(["pendente", "pago"]).default("pendente"), dueDate: z.coerce.date().optional(), notes: z.string().optional(), items: z.array(z.object({ productId: z.number(), quantity: z.number().int().positive(), unitCostCents: z.number().int().positive() })).min(1) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin", "Estoque"]);
      const db = await dbOrThrow();
      const baseTotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitCostCents, 0);
      const totalCents = baseTotal + input.shippingCents + input.feesCents;
      const result = await db.transaction(async tx => {
        const purchaseResult = await tx.insert(purchases).values({ supplierId: input.supplierId ?? null, purchaseDate: input.purchaseDate, orderNumber: input.orderNumber || null, shippingCents: input.shippingCents, feesCents: input.feesCents, totalCents, paymentMethodId: input.paymentMethodId ?? null, paymentStatus: input.paymentStatus, dueDate: input.dueDate ?? null, paidAt: input.paymentStatus === "pago" ? input.purchaseDate : null, notes: input.notes || null, createdByUserId: ctx.user.id });
        const purchaseId = Number(purchaseResult[0].insertId);
        for (const item of input.items) {
          const itemResult = await tx.insert(purchaseItems).values({ purchaseId, productId: item.productId, quantity: item.quantity, unitCostCents: item.unitCostCents, totalCostCents: item.quantity * item.unitCostCents });
          const purchaseItemId = Number(itemResult[0].insertId);
          await tx.insert(inventoryLots).values({ productId: item.productId, purchaseItemId, receivedAt: input.purchaseDate, initialQuantity: item.quantity, availableQuantity: item.quantity, unitCostCents: item.unitCostCents });
          await tx.insert(inventoryMovements).values({ productId: item.productId, type: "compra", quantity: item.quantity, unitCostCents: item.unitCostCents, purchaseId, occurredAt: input.purchaseDate, createdByUserId: ctx.user.id });
        }
        await tx.insert(financialEntries).values({ kind: "pagar", sourceType: "compra", sourceId: purchaseId, description: `Compra${input.orderNumber ? ` ${input.orderNumber}` : ""}`, amountCents: totalCents, status: input.paymentStatus === "pago" ? "pago" : "pendente", dueDate: input.dueDate ?? null, settledAt: input.paymentStatus === "pago" ? input.purchaseDate : null });
        await tx.insert(auditLogs).values({ userId: ctx.user.id, entityType: "compra", entityId: purchaseId, action: "registrada", afterData: { totalCents, items: input.items.length } });
        return purchaseId;
      });
      return { id: result };
    }),
  }),

  sales: router({
    create: protectedProcedure.input(z.object({ soldAt: z.coerce.date(), customerId: z.number().optional(), saleChannelId: z.number().optional(), paymentMethodId: z.number().optional(), discountCents: z.number().int().nonnegative().default(0), confirmLowMargin: z.boolean().default(false), paymentStatus: z.enum(["pendente", "recebido"]).default("recebido"), dueDate: z.coerce.date().optional(), notes: z.string().optional(), items: z.array(z.object({ productId: z.number(), quantity: z.number().int().positive(), unitPriceCents: z.number().int().positive() })).min(1) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, operationalRoles);
      const db = await dbOrThrow();
      const settings = await ensureSettings();
      const [channel] = input.saleChannelId ? await db.select().from(saleChannels).where(eq(saleChannels.id, input.saleChannelId)).limit(1) : [];
      const [method] = input.paymentMethodId ? await db.select().from(paymentMethods).where(eq(paymentMethods.id, input.paymentMethodId)).limit(1) : [];
      const ids = input.items.map(item => item.productId);
      const selectedProducts = await db.select().from(products).where(inArray(products.id, ids));
      if (selectedProducts.length !== ids.length || selectedProducts.some(product => product.status !== "ativo")) throw new TRPCError({ code: "BAD_REQUEST", message: "Há produto inexistente ou inativo na venda." });
      const grossCents = input.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
      let hasLowMarginAlert = false;
      let hasZeroStockAlert = false;
      const result = await db.transaction(async tx => {
        const allocations: Array<{ productId: number; quantity: number; unitPriceCents: number; unitCostCents: number; totalCostCents: number; lots: Array<{ id: number; take: number }> }> = [];
        let costCents = 0;
        for (const item of input.items) {
          const lots = await tx.select().from(inventoryLots).where(and(eq(inventoryLots.productId, item.productId), gt(inventoryLots.availableQuantity, 0))).orderBy(asc(inventoryLots.receivedAt), asc(inventoryLots.id));
          const fifo = allocateFifoLots(lots, item.quantity);
          if (!fifo.fulfilled) throw new TRPCError({ code: "BAD_REQUEST", message: "Estoque insuficiente para concluir a venda." });
          const itemCost = fifo.totalCostCents;
          const lotTakes = fifo.takes;
          costCents += itemCost;
          allocations.push({ productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents, unitCostCents: Math.round(itemCost / item.quantity), totalCostCents: itemCost, lots: lotTakes });
        }
        const totals = calculateSaleTotals({ grossCents, discountCents: input.discountCents, channelFeeBps: channel?.feeBps ?? 0, paymentFeeBps: method?.feeBps ?? 0, salesTaxBps: settings.salesTaxBps, costCents });
        if (totals.marginBps < settings.minimumMarginBps && !input.confirmLowMargin) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `MARGEM ABAIXO DO MÍNIMO: a margem desta venda é ${(totals.marginBps / 100).toFixed(1)}%, abaixo do mínimo de ${(settings.minimumMarginBps / 100).toFixed(1)}%. Confirme para concluir.` });
        const saleResult = await tx.insert(sales).values({ saleNumber: `VEN-${nanoid(8).toUpperCase()}`, soldAt: input.soldAt, customerId: input.customerId ?? null, saleChannelId: input.saleChannelId ?? null, paymentMethodId: input.paymentMethodId ?? null, grossCents, discountCents: input.discountCents, channelFeeCents: totals.channelFeeCents, paymentFeeCents: totals.paymentFeeCents, taxCents: totals.taxCents, costCents, netCents: totals.netCents, profitCents: totals.profitCents, paymentStatus: input.paymentStatus, dueDate: input.dueDate ?? null, receivedAt: input.paymentStatus === "recebido" ? input.soldAt : null, notes: input.notes || null, createdByUserId: ctx.user.id });
        const saleId = Number(saleResult[0].insertId);
        for (const item of allocations) {
          await tx.insert(saleItems).values({ saleId, productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents, unitCostCents: item.unitCostCents, totalCostCents: item.totalCostCents });
          for (const lot of item.lots) {
            await tx.update(inventoryLots).set({ availableQuantity: sql`${inventoryLots.availableQuantity} - ${lot.take}` }).where(eq(inventoryLots.id, lot.id));
          }
          await tx.insert(inventoryMovements).values({ productId: item.productId, type: "venda", quantity: -item.quantity, unitCostCents: item.unitCostCents, saleId, occurredAt: input.soldAt, createdByUserId: ctx.user.id });
        }
        await tx.insert(financialEntries).values({ kind: "receber", sourceType: "venda", sourceId: saleId, description: `Venda ${saleId}`, amountCents: totals.netCents, status: input.paymentStatus === "recebido" ? "recebido" : "pendente", dueDate: input.dueDate ?? null, settledAt: input.paymentStatus === "recebido" ? input.soldAt : null });
        await tx.insert(auditLogs).values({ userId: ctx.user.id, entityType: "venda", entityId: saleId, action: "registrada", afterData: { grossCents, profitCents: totals.profitCents } });
        if (totals.marginBps < settings.minimumMarginBps) {
          hasLowMarginAlert = true;
          await tx.insert(alerts).values({ type: "margem_baixa", severity: "atencao", title: "Margem abaixo do mínimo", message: `A venda ${saleId} foi concluída com margem abaixo do mínimo configurado.`, referenceType: "venda", referenceId: saleId });
        }
        for (const item of allocations) {
          const balance = await tx.select({ total: sql<number>`COALESCE(SUM(${inventoryMovements.quantity}), 0)` }).from(inventoryMovements).where(eq(inventoryMovements.productId, item.productId));
          if ((balance[0]?.total ?? 0) <= 0) {
            hasZeroStockAlert = true;
            await tx.insert(alerts).values({ type: "estoque_zerado", severity: "critico", title: "Estoque zerado", message: "Um produto acabou após a última venda.", referenceType: "produto", referenceId: item.productId });
          }
        }
        return { saleId, totals };
      });
      if (hasLowMarginAlert) {
        void notifyOwner({ title: "Margem abaixo do mínimo", content: `A venda ${result.saleId} foi concluída com margem inferior ao parâmetro configurado.` }).catch(error => console.warn("[Sales] Low-margin notification failed:", error));
      }
      if (hasZeroStockAlert) {
        void notifyOwner({ title: "Estoque zerado", content: "Uma venda acabou de zerar o estoque de pelo menos um produto." }).catch(error => console.warn("[Sales] Zero-stock notification failed:", error));
      }
      return result;
    }),
    list: protectedProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(sales).orderBy(desc(sales.soldAt)).limit(40);
    }),
  }),

  expenses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      restrictRoles(ctx.user.role, ["Admin", "Financeiro"]);
      const db = await dbOrThrow();
      return db.select().from(expenses).orderBy(desc(expenses.expenseDate)).limit(100);
    }),
    create: protectedProcedure.input(z.object({ expenseDate: z.coerce.date(), category: z.string().min(2), description: z.string().min(2), amountCents: z.number().int().positive(), supplierId: z.number().optional(), paymentMethodId: z.number().optional(), status: z.enum(["pendente", "pago"]).default("pendente"), dueDate: z.coerce.date().optional(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, financeRoles);
      const db = await dbOrThrow();
      const result = await db.transaction(async tx => {
        const insert = await tx.insert(expenses).values({ ...input, supplierId: input.supplierId ?? null, paymentMethodId: input.paymentMethodId ?? null, dueDate: input.dueDate ?? null, paidAt: input.status === "pago" ? input.expenseDate : null, notes: input.notes || null, createdByUserId: ctx.user.id });
        const expenseId = Number(insert[0].insertId);
        await tx.insert(financialEntries).values({ kind: "pagar", sourceType: "despesa", sourceId: expenseId, description: input.description, amountCents: input.amountCents, status: input.status, dueDate: input.dueDate ?? null, settledAt: input.status === "pago" ? input.expenseDate : null });
        await tx.insert(auditLogs).values({ userId: ctx.user.id, entityType: "despesa", entityId: expenseId, action: "registrada", afterData: { amountCents: input.amountCents, category: input.category } });
        return expenseId;
      });
            return { id: result };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["pendente", "pago"]) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, financeRoles);
      const db = await dbOrThrow();
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, input.id)).limit(1);
      if (!expense) throw new TRPCError({ code: "NOT_FOUND", message: "Despesa não encontrada." });
      await db.transaction(async tx => {
        await tx.update(expenses).set({ status: input.status, paidAt: input.status === "pago" ? new Date() : null }).where(eq(expenses.id, input.id));
        await tx.update(financialEntries).set({ status: input.status, settledAt: input.status === "pago" ? new Date() : null }).where(and(eq(financialEntries.sourceType, "despesa"), eq(financialEntries.sourceId, input.id)));
        await tx.insert(auditLogs).values({ userId: ctx.user.id, entityType: "despesa", entityId: input.id, action: input.status === "pago" ? "paga" : "reaberta", afterData: { status: input.status } });
      });
      return { id: input.id, status: input.status };
    }),
  }),
  finance: router({
    cashflow: protectedProcedure.query(async ({ ctx }) => {
      restrictRoles(ctx.user.role, financeRoles);
      const db = await dbOrThrow();
      const entries = await db.select().from(financialEntries).orderBy(desc(financialEntries.createdAt)).limit(200);
      const summary = entries.reduce((total, entry) => {
        const settled = entry.status === "recebido" || entry.status === "pago";
        if (entry.kind === "receber") {
          if (settled) total.inflowsCents += entry.amountCents;
          else total.receivablesCents += entry.amountCents;
        } else if (settled) total.outflowsCents += entry.amountCents;
        else total.payablesCents += entry.amountCents;
        return total;
      }, { inflowsCents: 0, outflowsCents: 0, receivablesCents: 0, payablesCents: 0 });
      const balanceCents = summary.inflowsCents - summary.outflowsCents;
      return { entries, summary: { ...summary, balanceCents, projectedBalanceCents: balanceCents + summary.receivablesCents - summary.payablesCents } };
    }),
  }),

  settings: router({
    get: protectedProcedure.query(() => ensureSettings()),
    update: protectedProcedure.input(z.object({ dollarQuoteMicros: z.number().int().positive(), minimumMarginBps: z.number().int().min(0).max(9000), desiredMarginBps: z.number().int().min(0).max(9000), salesTaxBps: z.number().int().min(0).max(9000), packagingCostCents: z.number().int().min(0), reserveBps: z.number().int().min(0).max(9000), revenueGoalCents: z.number().int().min(0), profitGoalCents: z.number().int().min(0), unitsGoal: z.number().int().min(0), minimumStock: z.number().int().min(0), idleDaysThreshold: z.number().int().min(1) })).mutation(async ({ ctx, input }) => {
      restrictRoles(ctx.user.role, ["Admin"]);
      const db = await dbOrThrow();
      const current = await ensureSettings();
      await db.update(businessSettings).set({ ...input, updatedByUserId: ctx.user.id }).where(eq(businessSettings.id, current.id));
      if (current.dollarQuoteMicros !== input.dollarQuoteMicros) await db.insert(dollarQuotes).values({ quoteMicros: input.dollarQuoteMicros, source: "manual", createdByUserId: ctx.user.id });
      return { success: true };
    }),
  }),
});
