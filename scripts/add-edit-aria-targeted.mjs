import fs from 'node:fs';

const path = '/home/ubuntu/gestao-vestuario/client/src/pages/Home.tsx';
let source = fs.readFileSync(path, 'utf8');
const start = source.indexOf('function ProductEditForm');
const end = source.indexOf('function StockEntryForm', start);
if (start < 0 || end < 0) throw new Error('Limites do ProductEditForm não encontrados');
let segment = source.slice(start, end);
const replacements = [
  ['<Input value={name} onChange={event => setName(event.target.value)}', '<Input aria-label="Nome da peça" value={name} onChange={event => setName(event.target.value)}'],
  ['<Input value={collection} onChange={event => setCollection(event.target.value)}', '<Input aria-label="Coleção ou temporada" value={collection} onChange={event => setCollection(event.target.value)}'],
  ['<Input value={category} onChange={event => setCategory(event.target.value)}', '<Input aria-label="Categoria" value={category} onChange={event => setCategory(event.target.value)}'],
  ['<Input value={size} onChange={event => setSize(event.target.value)}', '<Input aria-label="Tamanho" value={size} onChange={event => setSize(event.target.value)}'],
  ['<Input value={color} onChange={event => setColor(event.target.value)}', '<Input aria-label="Cor predominante" value={color} onChange={event => setColor(event.target.value)}'],
  ['<Input value={supplierUrl} onChange={event => setSupplierUrl(event.target.value)}', '<Input aria-label="URL de origem ou fornecedor" value={supplierUrl} onChange={event => setSupplierUrl(event.target.value)}'],
  ['<Input value={quote} onChange={event => setQuote(event.target.value)}', '<Input aria-label="Cotação vinculada em reais" value={quote} onChange={event => setQuote(event.target.value)}'],
  ['<Input value={price} onChange={event => setPrice(event.target.value)}', '<Input aria-label="Preço de venda em reais" value={price} onChange={event => setPrice(event.target.value)}'],
  ['<Input value={usd} onChange={event => setUsd(event.target.value)}', '<Input aria-label="Valor em dólares" value={usd} onChange={event => setUsd(event.target.value)}'],
  ['<Input value={internationalShipping} onChange={event => setInternationalShipping(event.target.value)}', '<Input aria-label="Frete internacional em reais" value={internationalShipping} onChange={event => setInternationalShipping(event.target.value)}'],
  ['<Input value={domesticShipping} onChange={event => setDomesticShipping(event.target.value)}', '<Input aria-label="Frete nacional em reais" value={domesticShipping} onChange={event => setDomesticShipping(event.target.value)}'],
  ['<Input value={importFees} onChange={event => setImportFees(event.target.value)}', '<Input aria-label="Impostos de importação em reais" value={importFees} onChange={event => setImportFees(event.target.value)}'],
  ['<Input value={packaging} onChange={event => setPackaging(event.target.value)}', '<Input aria-label="Embalagem em reais" value={packaging} onChange={event => setPackaging(event.target.value)}'],
  ['<Input value={otherCosts} onChange={event => setOtherCosts(event.target.value)}', '<Input aria-label="Outros custos em reais" value={otherCosts} onChange={event => setOtherCosts(event.target.value)}'],
  ['<Textarea value={notes} onChange={event => setNotes(event.target.value)}', '<Textarea aria-label="Observações" value={notes} onChange={event => setNotes(event.target.value)}'],
  ['<Input type="file" accept="image/png,image/jpeg,image/webp" className={inputClass}', '<Input aria-label="Trocar foto da camisa" type="file" accept="image/png,image/jpeg,image/webp" className={inputClass}'],
];
for (const [from, to] of replacements) {
  if (segment.includes(to)) continue;
  if (!segment.includes(from)) throw new Error(`Trecho ausente no ProductEditForm: ${from}`);
  segment = segment.replace(from, to);
}
source = source.slice(0, start) + segment + source.slice(end);
fs.writeFileSync(path, source);
console.log(`Aplicados ${replacements.length} rótulos no ProductEditForm.`);
