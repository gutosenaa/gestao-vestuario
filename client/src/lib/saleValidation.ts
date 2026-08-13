export type SaleDraftValidationInput = {
  itemCount: number;
  channelId: string;
  methodId: string;
  discountCents: number;
  grossTotalCents: number;
};

export function canShareSale(itemCount: number): boolean {
  return itemCount > 0;
}

export function canSubmitSale(itemCount: number, pending: boolean): boolean {
  return itemCount > 0 && !pending;
}

export function validateSaleDraft(input: SaleDraftValidationInput): string | null {
  if (input.itemCount < 1) return "Adicione ao menos uma peça antes de concluir.";
  if (!input.channelId) return "Selecione o canal de venda.";
  if (!input.methodId) return "Selecione a forma de pagamento.";
  if (input.discountCents < 0) return "O desconto não pode ser negativo.";
  if (input.discountCents > input.grossTotalCents) return "O desconto não pode superar o total da venda.";
  return null;
}
