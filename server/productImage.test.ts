import { describe, expect, it } from 'vitest';
import { decodeProductImage, withTimeout } from './routers/commerce';

describe('proteções do cadastro de produto com imagem', () => {
  it('aceita ausência de imagem e imagem válida', () => {
    expect(decodeProductImage()).toBeNull();
    const result = decodeProductImage(`data:image/jpeg;base64,${Buffer.from('foto').toString('base64')}`);
    expect(result).toMatchObject({ mimeType: 'image/jpeg', extension: 'jpg' });
    expect(result?.bytes).toEqual(Buffer.from('foto'));
  });

  it('rejeita payload inválido e imagem acima de 4 MB', () => {
    expect(() => decodeProductImage('arquivo-sem-data-url')).toThrow('inválida');
    const oversized = Buffer.alloc(4_000_001, 1).toString('base64');
    expect(() => decodeProductImage(`data:image/png;base64,${oversized}`)).toThrow('4 MB');
  });

  it('encerra upload lento com erro de timeout controlado', async () => {
    await expect(withTimeout(new Promise<string>(() => undefined), 5)).rejects.toThrow('storage-timeout');
    await expect(withTimeout(Promise.resolve('ok'), 20)).resolves.toBe('ok');
  });
});
