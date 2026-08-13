import fs from 'node:fs';
const source = fs.readFileSync('/home/ubuntu/gestao-vestuario/client/src/pages/Home.tsx', 'utf8');
const modules = ['DashboardPage','QuickSale','ProductsPage','PricingPage','InventoryPage','PurchasePage','ExpensesPage','FinancialPage','ReportsPage','CustomersPage','SuppliersPage','SettingsPage'];
for (const module of modules) {
  const start = source.indexOf(`function ${module}`);
  const next = source.indexOf('\nfunction ', start + 10);
  const segment = start >= 0 ? source.slice(start, next >= 0 ? next : source.length) : '';
  const inputs = [...segment.matchAll(/<(Input|Textarea|SelectTrigger|Button)([^>]*)>/g)];
  const unnamed = inputs.filter(([, tag, attrs]) => !/aria-label=|aria-labelledby=/.test(attrs) && !(tag === 'Button' && /[>]/.test(attrs))).map(([, tag, attrs]) => `${tag}: ${attrs.slice(0, 100)}`);
  console.log(JSON.stringify({ module, controls: inputs.length, unnamed: unnamed.length, samples: unnamed.slice(0, 8) }));
}
