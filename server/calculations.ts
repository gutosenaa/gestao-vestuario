export type PricingInput = {
  usdValueCents: number;
  quoteMicros: number;
  internationalShippingCents: number;
  domesticShippingCents: number;
  importFeesCents: number;
  packagingCostCents: number;
  otherCostsCents: number;
  salesTaxBps: number;
  minimumMarginBps: number;
  desiredMarginBps: number;
  salePriceCents: number;
};

export function calculatePricing(input: PricingInput) {
  const convertedCents = Math.round((input.usdValueCents * input.quoteMicros) / 1_000_000);
  const totalCostCents = convertedCents + input.internationalShippingCents + input.domesticShippingCents + input.importFeesCents + input.packagingCostCents + input.otherCostsCents;
  const suggestedDenominator = 10_000 - input.desiredMarginBps - input.salesTaxBps;
  const minimumDenominator = 10_000 - input.minimumMarginBps - input.salesTaxBps;
  const suggestedPriceCents = suggestedDenominator > 0 ? Math.ceil((totalCostCents * 10_000) / suggestedDenominator) : 0;
  const minimumPriceCents = minimumDenominator > 0 ? Math.ceil((totalCostCents * 10_000) / minimumDenominator) : 0;
  const promotionalPriceCents = minimumPriceCents ? Math.ceil(minimumPriceCents * 1.05) : 0;
  const salesTaxCents = Math.round((input.salePriceCents * input.salesTaxBps) / 10_000);
  const grossProfitCents = input.salePriceCents - totalCostCents - salesTaxCents;
  const marginBps = input.salePriceCents > 0 ? Math.round((grossProfitCents * 10_000) / input.salePriceCents) : 0;
  const markupBps = totalCostCents > 0 ? Math.round((input.salePriceCents * 10_000) / totalCostCents) : 0;
  const status = input.salePriceCents <= 0
    ? "SEM PREÇO"
    : marginBps < input.minimumMarginBps
      ? "BAIXA"
      : marginBps < input.minimumMarginBps + 1000
        ? "ATENÇÃO"
        : marginBps < input.minimumMarginBps + 2000
          ? "BOA"
          : "EXCELENTE";

  return { convertedCents, totalCostCents, suggestedPriceCents, minimumPriceCents, promotionalPriceCents, salesTaxCents, grossProfitCents, marginBps, markupBps, status };
}

export function calculateSaleTotals(input: {
  grossCents: number;
  discountCents: number;
  channelFeeBps: number;
  paymentFeeBps: number;
  salesTaxBps: number;
  costCents: number;
}) {
  const discountedCents = Math.max(0, input.grossCents - input.discountCents);
  const channelFeeCents = Math.round((discountedCents * input.channelFeeBps) / 10_000);
  const paymentFeeCents = Math.round((discountedCents * input.paymentFeeBps) / 10_000);
  const taxCents = Math.round((discountedCents * input.salesTaxBps) / 10_000);
  const netCents = discountedCents - channelFeeCents - paymentFeeCents;
  const profitCents = netCents - taxCents - input.costCents;
  const marginBps = discountedCents > 0 ? Math.round((profitCents * 10_000) / discountedCents) : 0;
  return { discountedCents, channelFeeCents, paymentFeeCents, taxCents, netCents, profitCents, marginBps };
}

export type InventoryLotBalance = { id: number; availableQuantity: number; unitCostCents: number };

export function allocateFifoLots(lots: InventoryLotBalance[], quantity: number) {
  let pending = quantity;
  let totalCostCents = 0;
  const takes: Array<{ id: number; take: number }> = [];
  for (const lot of lots) {
    if (pending <= 0) break;
    const take = Math.min(pending, lot.availableQuantity);
    if (take <= 0) continue;
    totalCostCents += take * lot.unitCostCents;
    takes.push({ id: lot.id, take });
    pending -= take;
  }
  return { fulfilled: pending === 0, pendingQuantity: pending, totalCostCents, takes };
}
