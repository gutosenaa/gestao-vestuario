import { describe, expect, it } from 'vitest';
import { getSaleErrorMessage } from './saleErrorMessage';

describe('mensagens de erro da venda', () => {
  it('orienta a correção por estoque, canal e pagamento', () => {
    expect(getSaleErrorMessage('Estoque insuficiente para esta venda')).toContain('Estoque insuficiente');
    expect(getSaleErrorMessage('Canal de venda obrigatório')).toContain('canal de venda');
    expect(getSaleErrorMessage('Forma de pagamento obrigatória')).toContain('forma de pagamento');
  });

  it('usa orientação segura para falhas desconhecidas', () => {
    expect(getSaleErrorMessage('Falha inesperada')).toBe('Não foi possível concluir a venda. Revise os dados e tente novamente.');
  });
});
