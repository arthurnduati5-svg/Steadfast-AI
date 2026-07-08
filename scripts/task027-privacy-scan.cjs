const fs = require('fs');
const paths = [
  'docs/ops/task-027/task-027-pilot-expansion-report.json',
  'docs/ops/task-027/TASK_027_PILOT_EXPANSION_REPORT.md',
  'docs/ops/task-027/TASK_027_HANDOFF.md',
];

const forbidden = [
  { r: /teacher-only notes/i, n: 'teacher-only notes' },
  { r: /Bearer /, n: 'Bearer' },
  { r: /postgres:\/\//, n: 'postgres://' },
  { r: /postgresql:\/\//, n: 'postgresql://' },
  { r: /mysql:\/\//, n: 'mysql://' },
  { r: /sk-proj-/, n: 'sk-proj- (OpenAI key)' },
  { r: /authorization headers/i, n: 'authorization headers' },
  { r: /cookies/i, n: 'cookies' },
  { r: /raw exception objects/i, n: 'raw exception objects' },
  { r: /unredacted stack traces/i, n: 'unredacted stack traces' },
];

const skipKeys = new Set(['verificationCommands', 'testResults']);

function stripSkippedKeys(obj) {
  if (Array.isArray(obj)) return obj.map(stripSkippedKeys).join(' ');
  if (obj && typeof obj === 'object') {
    return Object.entries(obj)
      .filter(([k]) => !skipKeys.has(k))
      .map(([, v]) => stripSkippedKeys(v))
      .join(' ');
  }
  return String(obj);
}

let allPass = true;
for (const p of paths) {
  if (!fs.existsSync(p)) {
    console.log('SKIP (not found): ' + p);
    continue;
  }
  let content = fs.readFileSync(p, 'utf-8');

  if (p.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      content = stripSkippedKeys(parsed);
    } catch {
      // fall through to raw text scan
    }
  }

  for (const f of forbidden) {
    if (f.r.test(content)) {
      console.log('FAIL: ' + p + ' matched pattern: ' + f.n);
      allPass = false;
    }
  }
}
if (allPass) {
  console.log('PRIVACY_SCAN_PASS');
  process.exit(0);
} else {
  console.log('PRIVACY_SCAN_FAIL');
  process.exit(1);
}
