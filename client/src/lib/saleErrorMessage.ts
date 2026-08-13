export function getSaleErrorMessage(rawMessage: string) {
  const message = rawMessage.toLowerCase();
  if (message.includes('estoque')) return 'Estoque insuficiente para concluir. Revise a quantidade dos itens.';
  if (message.includes('canal')) return 'Selecione um canal de venda antes de concluir.';
  if (message.includes('pagamento')) return 'Selecione uma forma de pagamento antes de concluir.';
  return 'Não foi possível concluir a venda. Revise os dados e tente novamente.';
}
