const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

const artifacts = [
  'docs/ops/task-028/task-028-expansion-execution-report.json',
  'docs/ops/task-028/TASK_028_EXPANSION_EXECUTION_REPORT.md',
  'docs/ops/task-028/TASK_028_HANDOFF.md',
  'logs/task-028/task-028-verification-summary.json',
];

const FORBIDDEN_PATTERNS = [
  { pattern: 'raw student chat', label: 'raw student chat' },
  { pattern: 'private learner memory', label: 'private learner memory' },
  { pattern: 'teacher-only notes', label: 'teacher-only notes' },
  { pattern: 'safeguarding raw details', label: 'safeguarding raw details' },
  { pattern: 'Deen-sensitive private text', label: 'Deen-sensitive private text' },
  { pattern: 'Bearer ', label: 'Bearer token' },
  { pattern: 'postgres://', label: 'postgres:// URL' },
  { pattern: 'postgresql://', label: 'postgresql:// URL' },
  { pattern: 'mysql://', label: 'mysql:// URL' },
  { pattern: 'answer key', label: 'answer key' },
  { pattern: 'teacher-only content', label: 'teacher-only content' },
  { pattern: 'protected rubric', label: 'protected rubric' },
];

let allClean = true;

for (const artifact of artifacts) {
  const artifactPath = path.join(rootDir, artifact);
  if (!fs.existsSync(artifactPath)) {
    console.log(`SKIP: ${artifact} (not found)`);
    continue;
  }

  const content = fs.readFileSync(artifactPath, 'utf-8');
  const lower = content.toLowerCase();

  for (const f of FORBIDDEN_PATTERNS) {
    if (lower.includes(f.pattern.toLowerCase())) {
      console.log(`FAIL: ${artifact} contains forbidden pattern: ${f.label}`);
      allClean = false;
    }
  }
}

if (allClean) {
  console.log('TASK028_PRIVACY_SCAN_PASS');
  process.exit(0);
} else {
  console.log('TASK028_PRIVACY_SCAN_FAIL');
  process.exit(1);
}
