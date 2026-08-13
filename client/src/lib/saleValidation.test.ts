import { describe, expect, it } from 'vitest';
import { canShareSale, canSubmitSale, validateSaleDraft } from './saleValidation';

describe('validateSaleDraft', () => {
  const valid = { itemCount: 1, channelId: '1', methodId: '2', discountCents: 0, grossTotalCents: 18_000 };

  it('mantém Compartilhar e Concluir desabilitados sem itens e habilitados com rascunho válido', () => {
    expect(canShareSale(0)).toBe(false);
    expect(canSubmitSale(0, false)).toBe(false);
    expect(canShareSale(1)).toBe(true);
    expect(canSubmitSale(1, false)).toBe(true);
    expect(canSubmitSale(1, true)).toBe(false);
  });

  it('aceita uma venda sem desconto informado', () => {
    expect(validateSaleDraft(valid)).toBeNull();
  });

  it('exige item, canal e forma de pagamento', () => {
    expect(validateSaleDraft({ ...valid, itemCount: 0 })).toContain('peça');
    expect(validateSaleDraft({ ...valid, channelId: '' })).toContain('canal');
    expect(validateSaleDraft({ ...valid, methodId: '' })).toContain('pagamento');
  });

  it('impede desconto superior ao total', () => {
    expect(validateSaleDraft({ ...valid, discountCents: 18_001 })).toContain('superar');
  });
});
