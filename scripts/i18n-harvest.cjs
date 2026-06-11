// Recolhe chaves t(lang, "key", "fallback PT") usadas no código que ainda
// não existem no dicionário translations.jsx. Uso: node scripts/i18n-harvest.cjs
const fs = require('fs'), path = require('path');
const m = fs.readFileSync('src/components/utils/translations.jsx', 'utf8');
const src = m.replace(/^\/\/.*$/gm, '').replace('export const translations =', 'globalThis.__T=').replace(/export function t[\s\S]*$/, '');
eval(src);
const existing = new Set(Object.keys(globalThis.__T.PT));
const keys = new Map();
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f); const s = fs.statSync(p);
    if (s.isDirectory()) { if (!p.includes('node_modules')) walk(p); }
    else if (p.endsWith('.jsx') && !p.includes('translations.jsx')) {
      const c = fs.readFileSync(p, 'utf8');
      const re = /t\(\s*lang\s*,\s*"([a-zA-Z0-9_]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
      let mm;
      while ((mm = re.exec(c))) {
        if (!existing.has(mm[1])) {
          const prev = keys.get(mm[1]);
          if (prev && prev !== mm[2]) console.error('CONFLITO', mm[1], '::', prev, '||', mm[2]);
          keys.set(mm[1], mm[2]);
        }
      }
    }
  }
}
walk('src');
console.log('NOVAS CHAVES:', keys.size);
for (const [k, v] of [...keys.entries()].sort()) console.log(k + ' = ' + v);
