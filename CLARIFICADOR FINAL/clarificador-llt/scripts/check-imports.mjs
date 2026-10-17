// Verifica que cada import local exista y que cada nombre importado esté exportado (sin necesidad de internet).
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('src'); const files = []; (function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : f.name.endsWith('.js') && files.push(path.join(d, f.name)); })(root);
const exportsOf = f => { const t = fs.readFileSync(f, 'utf8'), s = new Set();
  for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+(\w+)/gm)) s.add(m[1]);
  for (const m of t.matchAll(/^export\s*\{([^}]*)\}/gm)) m[1].split(',').map(x => x.trim()).filter(Boolean).forEach(x => s.add(x.split(/\s+as\s+/).pop())); return s; };
let bad = 0;
for (const f of files) { const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/^import\s+(?:([\w*\s{},]+?)\s+from\s+)?'([^']+)';/gm)) {
    const spec = m[2]; if (!spec.startsWith('.')) { if (!['three', 'animejs/lib/anime.es.js', 'socket.io-client', 'qrcode'].includes(spec)) { console.log('Dependencia no declarada:', spec, 'en', path.relative('.', f)); bad++; } continue; }
    if (spec.endsWith('.css')) continue;
    const target = path.resolve(path.dirname(f), spec); if (!fs.existsSync(target)) { console.log('No existe', spec, 'en', path.relative('.', f)); bad++; continue; }
    const named = (m[1] || '').match(/\{([^}]*)\}/); if (named) { const ex = exportsOf(target);
      for (const n of named[1].split(',').map(x => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)) if (!ex.has(n)) { console.log(`"${n}" no se exporta desde ${spec} (en ${path.relative('.', f)})`); bad++; } } } }
console.log(bad ? `${bad} problema(s) de importación` : `Importaciones correctas en ${files.length} archivos`); process.exit(bad ? 1 : 0);
