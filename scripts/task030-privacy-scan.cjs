const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const TASK030_FORBIDDEN_OUTPUT_FIELDS = [
  'raw student chat',
  'private learner memory',
  'teacher-only notes',
  'safeguarding raw details',
  'Deen-sensitive private text',
  'AI prompt',
  'provider response',
  'Bearer ',
  'postgres://',
  'postgresql://',
  'mysql://',
  'answer key',
  'teacher-only content',
  'protected rubric',
  'authorization header',
  'raw exception object',
  'unredacted stack trace',
  'OpenAI key',
  'sk-proj-',
  'sk-ant-',
  'real student email',
  'real phone number',
  'real school roster',
  'authorization headers',
  'unredacted stack traces',
  'cookies',
];

const SECRET_PATTERNS = [
  { pattern: 'DATABASE_URL', label: 'DATABASE_URL' },
  { pattern: 'JWT_SECRET', label: 'JWT_SECRET' },
  { pattern: 'API_KEY', label: 'API_KEY' },
  { pattern: 'sk-proj-', label: 'OpenAI secret key' },
  { pattern: 'sk-ant-', label: 'Anthropic secret key' },
  { pattern: 'ghp_', label: 'GitHub personal access token' },
  { pattern: 'gho_', label: 'GitHub OAuth token' },
];

function isSafeLine(line, beforeContext, afterContext) {
  const lowerLine = line.toLowerCase();
  const lowerBefore = beforeContext.toLowerCase();
  const combined = lowerBefore + ' ' + lowerLine;

  if (lowerBefore.includes('forbidden') || lowerLine.includes('forbidden')) return true;
  if (lowerBefore.includes('forbids') || lowerLine.includes('forbids')) return true;
  if (/not\.toContain\b|not\.toMatch\b|not_toContain\b/.test(combined)) return true;
  if (/exposed\s*:\s*(\*\*)?\s*(no|false)/.test(lowerLine)) return true;
  if (/used\s*:\s*(\*\*)?\s*(no|false)/.test(lowerLine)) return true;
  if (/detected\s*:\s*(\*\*)?\s*(no|false)/.test(lowerLine)) return true;
  if (/\bno\s+/.test(lowerLine) && /exposed|used|reveal|contain|leak|detected/.test(lowerLine)) return true;
  if (/does not|do not|must not|should not|never expose|never reveal|never copy/.test(combined)) return true;
  if (lowerLine.trim().startsWith("'") || lowerLine.trim().startsWith('"')) return true;

  return false;
}

function scanFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${label}: file not found`);
    return { pass: true, issues: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  for (const pattern of TASK030_FORBIDDEN_OUTPUT_FIELDS) {
    let idx = 0;
    while ((idx = content.indexOf(pattern, idx)) !== -1) {
      const lineStart = content.lastIndexOf('\n', idx) + 1;
      const lineEnd = content.indexOf('\n', idx + pattern.length);
      const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : content.length).trim();

      const beforePattern = content.substring(Math.max(0, idx - 600), idx);
      const afterPattern = content.substring(idx + pattern.length, Math.min(content.length, idx + pattern.length + 200));

      if (!isSafeLine(line, beforePattern, afterPattern)) {
        issues.push({ type: 'forbidden_output', pattern, line: line.substring(0, 120) });
      }
      idx += pattern.length;
    }
  }

  for (const secret of SECRET_PATTERNS) {
    if (content.includes(secret.pattern)) {
      const lineStart = content.lastIndexOf('\n', content.indexOf(secret.pattern)) + 1;
      const lineEnd = content.indexOf('\n', content.indexOf(secret.pattern) + secret.pattern.length);
      const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : content.length).trim();
      issues.push({ type: 'secret', pattern: secret.label, line: line.substring(0, 120) });
    }
  }

  if (issues.length > 0) {
    console.log(`[FAIL] ${label}: ${issues.length} issue(s)`);
    for (const issue of issues) {
      console.log(`  ${issue.type.toUpperCase()}: "${issue.pattern}" in line: ${issue.line}`);
    }
  } else {
    console.log(`[PASS] ${label}: clean`);
  }

  return { pass: issues.length === 0, issues };
}

console.log('=== Task 030 Privacy Leak Scan ===\n');

const backendDir = path.join(rootDir, 'backend', 'src');
const filesToScan = [];

function addSourceFiles() {
  const contractsDir = path.join(backendDir, 'contracts');
  const servicesDir = path.join(backendDir, 'services');
  const repoDir = path.join(backendDir, 'repositories');
  const routesDir = path.join(backendDir, 'routes');
  const testDir = path.join(backendDir, 'tests');

  const dirs = [
    { dir: contractsDir, label: 'Contracts/*' },
    { dir: servicesDir, label: 'Services/*' },
    { dir: repoDir, label: 'Repositories/*' },
    { dir: routesDir, label: 'Routes/*' },
    { dir: testDir, label: 'Tests/*' },
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d.dir)) continue;
    const entries = fs.readdirSync(d.dir);
    for (const entry of entries) {
      const fullPath = path.join(d.dir, entry);
      if (fs.statSync(fullPath).isFile() && entry.toLowerCase().includes('task030')) {
        filesToScan.push({ path: fullPath, label: `Backend: ${d.label}/${entry}` });
      }
    }
  }

  if (fs.existsSync(testDir)) {
    const testFiles = fs.readdirSync(testDir).filter(f =>
      f.startsWith('task030-') || f.startsWith('task-030-')
    );
    for (const f of testFiles) {
      const fullPath = path.join(testDir, f);
      if (!filesToScan.some(x => x.path === fullPath)) {
        filesToScan.push({ path: fullPath, label: `Test: ${f}` });
      }
    }
  }
}

addSourceFiles();

const scriptDir = path.join(rootDir, 'scripts');
if (fs.existsSync(scriptDir)) {
  const scriptFiles = fs.readdirSync(scriptDir).filter(f =>
    f.includes('task030') || f.includes('task-030')
  );
  for (const f of scriptFiles) {
    filesToScan.push({ path: path.join(scriptDir, f), label: `Script: ${f}` });
  }
}

console.log(`Scanned ${filesToScan.length} files\n`);
filesToScan.forEach(f => console.log(`  ${f.label}`));
console.log('');

let allPass = true;
let totalLeaks = 0;
for (const f of filesToScan) {
  const result = scanFile(f.path, f.label);
  if (!result.pass) {
    allPass = false;
    totalLeaks += result.issues.length;
  }
}

console.log(`\n=== Scan Result ===`);
if (allPass) {
  console.log(`PASS: No privacy leaks detected`);
  process.exit(0);
} else {
  console.log(`FAIL: ${totalLeaks} leak(s) found`);
  process.exit(1);
}