// Diagnostic scanner: process-local state, transactions, indexes, timeouts.
// Read-only. Run: node backend/tools/engineering/diag-scan.js [--json]
const fs = require('fs');
const path = require('path');
const BASE = __dirname + '/../../..';
const SRC = path.join(BASE, 'backend/src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}
const files = walk(SRC);
const pats = {
  mapSet: /new\s+(Map|Set)\s*\(/g,
  transaction: /\$transaction\b/g,
  forUpdate: /FOR\s+UPDATE/i,
  updateMany: /\.updateMany\s*\(/g,
  setInterval: /setInterval\s*\(/g,
  setTimeout: /setTimeout\s*\(/g,
  ttl: /\bTTL\b|ttl\s*[:=]/g,
  deterministicRandom: /seeded|deterministic|mulberry|hash.*seed/gi,
};
const hits = {};
for (const k of Object.keys(pats)) hits[k] = [];
for (const f of files) {
  let t;
  try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const [k, re] of Object.entries(pats)) {
    re.lastIndex = 0;
    const n = (t.match(re) || []).length;
    if (n) hits[k].push({ f: path.relative(BASE, f), n });
  }
}
for (const [k, arr] of Object.entries(hits)) {
  arr.sort((a, b) => b.n - a.n);
  console.log('=== ' + k + ' files=' + arr.length + ' total=' + arr.reduce((s, x) => s + x.n, 0));
  for (const x of arr.slice(0, 25)) console.log('  ' + x.n + ' ' + x.f);
}
// schema indexes
const schema = fs.readFileSync(path.join(BASE, 'backend/prisma/schema.prisma'), 'utf8');
const models = (schema.match(/^model \w+ \{/gm) || []).length;
const uniq = (schema.match(/@@unique\(/g) || []).length;
const idx = (schema.match(/@@index\(/g) || []).length;
console.log('=== schema models=' + models + ' @@unique=' + uniq + ' @@index=' + idx);
if (process.argv.includes('--idx')) {
  const lines = schema.split('\n');
  let cur = '';
  for (const l of lines) {
    const m = l.match(/^model (\w+)/); if (m) cur = m[1];
    if (/@@(unique|index)\(/.test(l)) console.log(cur + ' :: ' + l.trim());
  }
}
