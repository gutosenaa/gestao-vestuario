import { describe, expect, it } from "vitest";
import { allocateFifoLots, calculatePricing, calculateSaleTotals } from "./calculations";

describe("calculatePricing", () => {
  it("calcula custo, preços, lucro, margem, markup e classificação de forma consistente", () => {
    const result = calculatePricing({
      usdValueCents: 1000,
      quoteMicros: 5_600_000,
      internationalShippingCents: 500,
      domesticShippingCents: 0,
      importFeesCents: 0,
      packagingCostCents: 500,
      otherCostsCents: 0,
      salesTaxBps: 0,
      minimumMarginBps: 3000,
      desiredMarginBps: 5500,
      salePriceCents: 18_000,
    });

    expect(result.convertedCents).toBe(5600);
    expect(result.totalCostCents).toBe(6600);
    expect(result.suggestedPriceCents).toBe(14667);
    expect(result.minimumPriceCents).toBe(9429);
    expect(result.promotionalPriceCents).toBe(9901);
    expect(result.grossProfitCents).toBe(11400);
    expect(result.marginBps).toBe(6333);
    expect(result.markupBps).toBe(27273);
    expect(result.status).toBe("EXCELENTE");
  });

  it("indica SEM PREÇO quando não há preço de venda definido", () => {
    const result = calculatePricing({
      usdValueCents: 1000,
      quoteMicros: 5_600_000,
      internationalShippingCents: 0,
      domesticShippingCents: 0,
      importFeesCents: 0,
      packagingCostCents: 0,
      otherCostsCents: 0,
      salesTaxBps: 0,
      minimumMarginBps: 3000,
      desiredMarginBps: 5500,
      salePriceCents: 0,
    });

    expect(result.status).toBe("SEM PREÇO");
  });
});

describe("calculateSaleTotals", () => {
  it("desconta taxas, imposto e custo histórico para encontrar o lucro da operação", () => {
    const result = calculateSaleTotals({
      grossCents: 18_000,
      discountCents: 1_000,
      channelFeeBps: 2000,
      paymentFeeBps: 0,
      salesTaxBps: 1000,
      costCents: 6600,
    });

    expect(result.discountedCents).toBe(17_000);
    expect(result.channelFeeCents).toBe(3400);
    expect(result.taxCents).toBe(1700);
    expect(result.netCents).toBe(13_600);
    expect(result.profitCents).toBe(5300);
    expect(result.marginBps).toBe(3118);
  });

  it("mantém o total bruto quando o operador não informa desconto", () => {
    const result = calculateSaleTotals({
      grossCents: 18_000,
      discountCents: 0,
      channelFeeBps: 1600,
      paymentFeeBps: 0,
      salesTaxBps: 0,
      costCents: 6_600,
    });

    expect(result.discountedCents).toBe(18_000);
    expect(result.channelFeeCents).toBe(2_880);
    expect(result.netCents).toBe(15_120);
  });

  it("combina taxas de canal e pagamento antes de apurar recebimento líquido e margem", () => {
    const result = calculateSaleTotals({
      grossCents: 10_000,
      discountCents: 1_000,
      channelFeeBps: 1000,
      paymentFeeBps: 200,
      salesTaxBps: 500,
      costCents: 5_000,
    });

    expect(result).toMatchObject({
      discountedCents: 9_000,
      channelFeeCents: 900,
      paymentFeeCents: 180,
      taxCents: 450,
      netCents: 7_920,
      profitCents: 2_470,
      marginBps: 2744,
    });
  });
});

describe("allocateFifoLots", () => {
  it("baixa os lotes mais antigos e preserva o custo histórico da venda", () => {
    const allocation = allocateFifoLots([
      { id: 1, availableQuantity: 1, unitCostCents: 8000 },
      { id: 2, availableQuantity: 2, unitCostCents: 9500 },
    ], 2);

    expect(allocation).toEqual({
      fulfilled: true,
      pendingQuantity: 0,
      totalCostCents: 17500,
      takes: [{ id: 1, take: 1 }, { id: 2, take: 1 }],
    });
  });

  it("impede a venda quando a quantidade solicitada supera o saldo em lote", () => {
    const allocation = allocateFifoLots([{ id: 1, availableQuantity: 1, unitCostCents: 8000 }], 2);
    expect(allocation.fulfilled).toBe(false);
    expect(allocation.pendingQuantity).toBe(1);
  });
});
