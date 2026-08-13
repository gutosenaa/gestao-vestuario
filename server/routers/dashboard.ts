import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { alerts, businessSettings, expenses, inventoryLots, inventoryMovements, products, saleItems, sales } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export const dashboardRouter = router({
  overview: protectedProcedure.input(z.object({ months: z.number().int().min(3).max(12).default(6) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    const [allSales, allExpenses, allProducts, movements, lots, allItems, activeAlerts, settingsRows] = await Promise.all([
      db.select().from(sales).orderBy(desc(sales.soldAt)), db.select().from(expenses).orderBy(desc(expenses.expenseDate)), db.select().from(products), db.select().from(inventoryMovements), db.select().from(inventoryLots), db.select().from(saleItems), db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(8), db.select().from(businessSettings).limit(1),
    ]);
    const settings = settingsRows[0] ?? { revenueGoalCents: 0, profitGoalCents: 0, unitsGoal: 0, minimumStock: 0, idleDaysThreshold: 60, reserveBps: 0 };
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const monthlySales = allSales.filter(sale => sale.soldAt >= currentMonth && sale.paymentStatus !== "cancelado");
    const monthlyExpenses = allExpenses.filter(expense => expense.expenseDate >= currentMonth && expense.status !== "cancelado");
    const revenueCents = monthlySales.reduce((sum, sale) => sum + sale.grossCents - sale.discountCents, 0);
    const grossProfitCents = monthlySales.reduce((sum, sale) => sum + sale.netCents - sale.costCents, 0);
    const netProfitCents = monthlySales.reduce((sum, sale) => sum + sale.profitCents, 0) - monthlyExpenses.reduce((sum, expense) => sum + expense.amountCents, 0) - Math.round((revenueCents * settings.reserveBps) / 10000);
    const stockByProduct = new Map<number, number>();
    movements.forEach(movement => stockByProduct.set(movement.productId, (stockByProduct.get(movement.productId) ?? 0) + movement.quantity));
    const stockRows = allProducts.map(product => ({ product, stock: stockByProduct.get(product.id) ?? 0 }));
    const stockValueCents = lots.reduce((sum, lot) => sum + Math.max(0, lot.availableQuantity) * lot.unitCostCents, 0);
    const potentialStockValueCents = stockRows.reduce((sum, row) => sum + Math.max(0, row.stock) * row.product.listPriceCents, 0);
    const receivablesCents = allSales.filter(sale => sale.paymentStatus === "pendente").reduce((sum, sale) => sum + sale.netCents, 0);
    const payablesCents = allExpenses.filter(expense => expense.status === "pendente" || expense.status === "vencido").reduce((sum, expense) => sum + expense.amountCents, 0);
    const productMap = new Map(allProducts.map(product => [product.id, product]));
    const productSales = new Map<number, { quantity: number; revenue: number; profit: number; lastSoldAt?: Date }>();
    const salesById = new Map(allSales.map(sale => [sale.id, sale]));
    allItems.forEach(item => {
      const row = productSales.get(item.productId) ?? { quantity: 0, revenue: 0, profit: 0 };
      row.quantity += item.quantity;
      row.revenue += item.quantity * item.unitPriceCents - item.discountCents;
      row.profit += item.quantity * item.unitPriceCents - item.totalCostCents - item.discountCents;
      const soldAt = salesById.get(item.saleId)?.soldAt;
      if (soldAt && (!row.lastSoldAt || soldAt > row.lastSoldAt)) row.lastSoldAt = soldAt;
      productSales.set(item.productId, row);
    });
    const ranking = Array.from(productSales.entries()).map(([productId, row]) => ({ productId, name: productMap.get(productId)?.name ?? "Produto", code: productMap.get(productId)?.code ?? "", marginBps: row.revenue ? Math.round((row.profit * 10000) / row.revenue) : 0, ...row }));
    const health = stockRows.map(({ product, stock }) => {
      const salesData = productSales.get(product.id);
      const sold90 = allItems.filter(item => item.productId === product.id && (salesById.get(item.saleId)?.soldAt ?? now) >= new Date(now.getTime() - 90 * 86400000)).reduce((sum, item) => sum + item.quantity, 0);
      const lastSoldAt = salesData?.lastSoldAt;
      const daysWithoutSale = Math.max(0, Math.floor((now.getTime() - (lastSoldAt ?? product.createdAt).getTime()) / 86400000));
      const classification = stock <= 0 ? "Sem estoque" : sold90 >= 6 ? "Alta saída" : sold90 >= 2 ? "Saída normal" : daysWithoutSale >= settings.idleDaysThreshold ? "Encalhado" : "Baixa saída";
      const unitCost = lots.filter(lot => lot.productId === product.id && lot.availableQuantity > 0).reduce((sum, lot) => sum + lot.unitCostCents * lot.availableQuantity, 0) / Math.max(1, lots.filter(lot => lot.productId === product.id && lot.availableQuantity > 0).reduce((sum, lot) => sum + lot.availableQuantity, 0));
      return { id: product.id, code: product.code, name: product.name, stock, sold90, daysWithoutSale, lastSoldAt, classification, unitCostCents: Math.round(unitCost), idleValueCents: Math.round(unitCost) * Math.max(0, stock), potentialProfitCents: Math.max(0, stock) * Math.max(0, product.listPriceCents - Math.round(unitCost)) };
    });
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousSales = allSales.filter(sale => sale.soldAt >= previousMonth && sale.soldAt < currentMonth && sale.paymentStatus !== "cancelado");
    const previousRevenueCents = previousSales.reduce((sum, sale) => sum + sale.grossCents - sale.discountCents, 0);
    const previousProfitCents = previousSales.reduce((sum, sale) => sum + sale.profitCents, 0);
    const change = (value: number, previous: number) => previous ? Math.round(((value - previous) * 10000) / previous) : null;
    const daysElapsed = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const unitsSold = monthlySales.reduce((sum, sale) => sum + allItems.filter(item => item.saleId === sale.id).reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const months = input?.months ?? 6;
    const chart = Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1);
      const key = monthKey(date);
      const salesInMonth = allSales.filter(sale => monthKey(sale.soldAt) === key && sale.paymentStatus !== "cancelado");
      const expensesInMonth = allExpenses.filter(expense => monthKey(expense.expenseDate) === key && expense.status !== "cancelado");
      const revenue = salesInMonth.reduce((sum, sale) => sum + sale.grossCents - sale.discountCents, 0);
      const costs = salesInMonth.reduce((sum, sale) => sum + sale.costCents, 0);
      const expenseTotal = expensesInMonth.reduce((sum, expense) => sum + expense.amountCents, 0);
      return { label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), faturamento: revenue / 100, custos: costs / 100, despesas: expenseTotal / 100, lucro: (salesInMonth.reduce((sum, sale) => sum + sale.profitCents, 0) - expenseTotal) / 100 };
    });
    return {
      kpis: { revenueCents, grossProfitCents, netProfitCents, marginBps: revenueCents ? Math.round((netProfitCents * 10000) / revenueCents) : 0, stockUnits: stockRows.reduce((sum, row) => sum + Math.max(0, row.stock), 0), stockValueCents, potentialStockValueCents, ticketCents: monthlySales.length ? Math.round(revenueCents / monthlySales.length) : 0, piecesSold: unitsSold, receivablesCents, payablesCents, revenueGoalCents: settings.revenueGoalCents, profitGoalCents: settings.profitGoalCents, unitsGoal: settings.unitsGoal, revenueChangeBps: change(revenueCents, previousRevenueCents), profitChangeBps: change(netProfitCents, previousProfitCents), projectedRevenueCents: Math.round((revenueCents / daysElapsed) * daysInMonth), revenueNeededPerDayCents: Math.max(0, Math.ceil((settings.revenueGoalCents - revenueCents) / Math.max(1, daysInMonth - daysElapsed))), goalProgressBps: settings.revenueGoalCents ? Math.min(10000, Math.round((revenueCents * 10000) / settings.revenueGoalCents)) : 0 },
      chart,
      alerts: activeAlerts,
      lowStock: stockRows.filter(row => row.stock <= settings.minimumStock).map(row => ({ id: row.product.id, code: row.product.code, name: row.product.name, stock: row.stock })).slice(0, 6),
      topSold: ranking.sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      topProfitable: ranking.sort((a, b) => b.profit - a.profit).slice(0, 10),
      topRevenue: ranking.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      topMargin: ranking.sort((a, b) => b.marginBps - a.marginBps).slice(0, 10),
      inventoryHealth: health,
      idleStock: health.filter(item => item.stock > 0 && item.daysWithoutSale >= settings.idleDaysThreshold).sort((a, b) => b.idleValueCents - a.idleValueCents),
      recommendations: health.map(item => ({ ...item, suggestion: item.stock <= settings.minimumStock && item.classification === "Alta saída" ? "RECOMPRAR" : item.classification === "Encalhado" || (item.stock > settings.minimumStock * 3 && item.sold90 < 2) ? "NÃO COMPRAR" : "OBSERVAR" })).sort((a, b) => b.sold90 - a.sold90),
    };
  }),
  inventory: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível");
    const [allProducts, movements] = await Promise.all([db.select().from(products), db.select().from(inventoryMovements)]);
    const stockByProduct = new Map<number, number>();
    movements.forEach(movement => stockByProduct.set(movement.productId, (stockByProduct.get(movement.productId) ?? 0) + movement.quantity));
    return allProducts.map(product => ({ ...product, stock: stockByProduct.get(product.id) ?? 0 }));
  }),
});
