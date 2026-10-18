// Busca referencias a recursos remotos (CDN, fuentes, scripts) en el código y el HTML.
import fs from 'node:fs'; import path from 'node:path';
const targets = ['index.html', 'clarificador.html', 'final.html', 'votar.html', 'control.html', 'src', 'public', 'server']; let bad = 0;
const scan = f => { const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+|@import\s+url\(\s*["']?https?:|url\(\s*["']?https?:|import\s*\(?\s*["']https?:|fetch\(\s*["']https?:|from\s+["']https?:/g)) { console.log('Recurso remoto en', f, '->', m[0]); bad++; } };
(function walk(p) { if (!fs.existsSync(p)) return; if (fs.statSync(p).isDirectory()) fs.readdirSync(p).forEach(x => walk(path.join(p, x))); else if (/\.(js|mjs|css|html)$/.test(p)) scan(p); })(targets[0]); targets.slice(1).forEach(function w(p) { (function walk(q) { if (!fs.existsSync(q)) return; if (fs.statSync(q).isDirectory()) fs.readdirSync(q).forEach(x => walk(path.join(q, x))); else if (/\.(js|mjs|css|html)$/.test(q)) scan(q); })(p); });
console.log(bad ? `${bad} referencia(s) remota(s)` : 'Sin referencias a internet (CDN, fuentes ni scripts remotos)'); process.exit(bad ? 1 : 0);
