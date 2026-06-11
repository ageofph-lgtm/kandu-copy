// Verifica que todas as línguas têm exatamente as mesmas chaves que PT.
const fs = require('fs');
const m = fs.readFileSync('src/components/utils/translations.jsx', 'utf8');
const src = m.replace(/^\/\/.*$/gm, '').replace('export const translations =', 'globalThis.__T=').replace(/export function t[\s\S]*$/, '');
eval(src);
const T = globalThis.__T;
const ptKeys = Object.keys(T.PT);
let fail = false;
for (const l of Object.keys(T)) {
  const ks = new Set(Object.keys(T[l]));
  const missing = ptKeys.filter(k => !ks.has(k));
  const extra = Object.keys(T[l]).filter(k => !ptKeys.includes(k));
  console.log(`${l}: ${ks.size} chaves` + (missing.length ? ` | FALTAM ${missing.length}: ${missing.slice(0, 10).join(',')}` : '') + (extra.length ? ` | EXTRA: ${extra.slice(0, 10).join(',')}` : ''));
  if (missing.length || extra.length) fail = true;
}
process.exit(fail ? 1 : 0);
