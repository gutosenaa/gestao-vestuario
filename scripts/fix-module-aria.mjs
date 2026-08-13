import fs from 'node:fs';
const path = '/home/ubuntu/gestao-vestuario/client/src/pages/Home.tsx';
let s = fs.readFileSync(path, 'utf8');
const replacements = [
  ['<Button onClick={onAdd} className="bg-cyan-300', '<Button aria-label="Adicionar produto" onClick={onAdd} className="bg-cyan-300'],
  ['<Button onClick={() => onNavigate("compras")} className="bg-cyan-300', '<Button aria-label="Ir para compras e registrar entrada de estoque" onClick={() => onNavigate("compras")} className="bg-cyan-300'],
  ['<Button disabled={!selected || pending} onClick={() => selected && onSubmit({ supplierId:', '<Button aria-label="Registrar compra" disabled={!selected || pending} onClick={() => selected && onSubmit({ supplierId:'],
  ['<Button disabled={!description || !cents(amount) || pending} onClick={() => onSubmit({ expenseDate:', '<Button aria-label="Lançar despesa" disabled={!description || !cents(amount) || pending} onClick={() => onSubmit({ expenseDate:'],
  ['<Input value={stock} onChange={event => setStock(event.target.value)}', '<Input aria-label="Estoque mínimo em unidades" value={stock} onChange={event => setStock(event.target.value)}'],
  ['<Input value={unitsGoal} onChange={event => setUnitsGoal(event.target.value)}', '<Input aria-label="Meta mensal de peças" value={unitsGoal} onChange={event => setUnitsGoal(event.target.value)}'],
  ['<Input value={minMargin} onChange={event => setMinMargin(event.target.value)}', '<Input aria-label="Margem mínima em porcentagem" value={minMargin} onChange={event => setMinMargin(event.target.value)}'],
  ['<Input value={desiredMargin} onChange={event => setDesiredMargin(event.target.value)}', '<Input aria-label="Margem desejada em porcentagem" value={desiredMargin} onChange={event => setDesiredMargin(event.target.value)}'],
  ['<Input value={tax} onChange={event => setTax(event.target.value)}', '<Input aria-label="Imposto sobre venda em porcentagem" value={tax} onChange={event => setTax(event.target.value)}'],
  ['<Button disabled={pending || !settings} onClick={submit}', '<Button aria-label="Salvar configurações" disabled={pending || !settings} onClick={submit}'],
  ['<Button variant="outline" onClick={() => setEditing(selected)}', '<Button aria-label="Editar produto selecionado" variant="outline" onClick={() => setEditing(selected)}'],
  ['<Button variant="outline" onClick={() => { setStockProduct(selected); setSelected(null); }}', '<Button aria-label="Ajustar estoque do produto selecionado" variant="outline" onClick={() => { setStockProduct(selected); setSelected(null); }}'],
  ['<Button variant="outline" onClick={() => setSelected(null)}', '<Button aria-label="Fechar detalhes do produto" variant="outline" onClick={() => setSelected(null)}'],
  ['<Button onClick={() => { onArchive(selected.id); setSelected(null); }}', '<Button aria-label="Inativar produto selecionado" onClick={() => { onArchive(selected.id); setSelected(null); }}'],
];
for (const [a,b] of replacements) {
  if (!s.includes(a)) throw new Error(`Trecho não encontrado: ${a}`);
  s = s.replaceAll(a,b);
}
fs.writeFileSync(path,s);
console.log(`Aplicadas ${replacements.length} correções de nomes acessíveis.`);
