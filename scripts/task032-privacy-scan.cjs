const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const scanPaths = [
  { path: 'reports/task-032-controlled-canary-activation-v1.json', type: 'generated' },
  { path: 'reports/task-032-controlled-canary-activation-v1.md', type: 'generated' },
  { path: 'docs/ops/task-032/task-032-controlled-canary-activation-v1.json', type: 'generated' },
  { path: 'docs/ops/task-032/task-032-controlled-canary-activation-v1.md', type: 'generated' },
  { path: 'reports/task-031-staging-smoke-canary-readiness-v1.json', type: 'generated' },
];

const sourceGlobs = [
  'backend/src/contracts/task032*',
  'backend/src/services/task032*',
  'backend/src/tests/task-032*',
  'backend/src/tests/task032*',
  'backend/src/tests/fixtures/task032*',
  'scripts/*task032*',
];

function expandGlob(pattern) {
  const parts = pattern.split('*');
  const dir = path.dirname(pattern);
  const prefix = parts[0].substring(parts[0].lastIndexOf(path.sep) + 1);
  try {
    return fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) || f.includes(prefix.replace(/^task/, 'task-')))
      .map(f => path.join(dir, f))
      .filter(f => fs.statSync(f).isFile());
  } catch { return []; }
}

for (const g of sourceGlobs) {
  for (const fp of expandGlob(g)) {
    scanPaths.push({ path: path.relative(rootDir, fp), type: 'source' });
  }
}

const FORBIDDEN_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, label: 'email', critical: true },
  { pattern: /\+\d{10,}/, label: 'phone', critical: true },
  { pattern: /raw student chat/i, label: 'raw_student_chat', critical: true },
  { pattern: /private learner memory/i, label: 'private_learner_memory', critical: true },
  { pattern: /teacher-only notes/i, label: 'teacher_only_notes', critical: true },
  { pattern: /safeguarding raw details/i, label: 'safeguarding_raw_details', critical: true },
  { pattern: /deen-sensitive private text/i, label: 'deen_sensitive_text', critical: true },
  { pattern: /Bearer\s+[A-Za-z0-9._-]+/i, label: 'auth_header', critical: true },
  { pattern: /(postgres:\/\/|postgresql:\/\/|mysql:\/\/)[^\s"]+/i, label: 'database_url', critical: true },
  { pattern: /sk-(proj|ant)-[A-Za-z0-9]+/, label: 'api_key', critical: true },
  { pattern: /answer key/i, label: 'answer_key', critical: true },
  { pattern: /teacher-only content/i, label: 'teacher_only_content', critical: true },
  { pattern: /protected rubric/i, label: 'protected_rubric', critical: true },
  { pattern: /raw exception object/i, label: 'raw_exception', critical: false },
  { pattern: /unredacted stack trace/i, label: 'stack_trace', critical: false },
  { pattern: /real roster/i, label: 'real_roster', critical: true },
  { pattern: /ai prompt/i, label: 'ai_prompt', critical: true },
  { pattern: /provider response/i, label: 'provider_response', critical: true },
];

const SAFE_NEGATIVE = [
  'do not expose', 'not exposed', 'never exposed', 'forbidden',
  'exposed: no', 'exposed:** no', 'exposed? no', ': false',
  'should be blocked',
];

const SAFE_IDENTIFIERS = [
  'school_task032_canary_safe', 'canary_cohort_task032_safe',
  'student_hash_task032_safe', 'teacher_hash_task032_safe',
  'admin_hash_task032_safe', 'operator_hash_task032_safe',
  'unknown_hash_task032_safe', 'curriculum_scope_task032_safe',
  'subject_task032_safe', 'class_task032_safe',
];

let exitCode = 0;
let totalFindings = 0;

for (const entry of scanPaths) {
  const fullPath = path.join(rootDir, entry.path);
  if (!fs.existsSync(fullPath)) {
    console.log(`[SKIP] ${entry.path} - not found`);
    continue;
  }

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    continue;
  }

  const lowerContent = content.toLowerCase();

  for (const { pattern, label, critical } of FORBIDDEN_PATTERNS) {
    const matches = lowerContent.match(pattern);
    if (!matches) continue;

    const matchStr = matches[0].toLowerCase();

    // Skip safe identifiers
    const isSafeId = SAFE_IDENTIFIERS.some(id => lowerContent.includes(id.toLowerCase()) && matchStr.includes(id.toLowerCase().substring(0, 10)));
    if (isSafeId) continue;

    // Check for safe negative context
    const idx = lowerContent.indexOf(matchStr);
    const ctxStart = Math.max(0, idx - 80);
    const ctxEnd = Math.min(lowerContent.length, idx + matchStr.length + 80);
    const context = lowerContent.substring(ctxStart, ctxEnd);

    const isSafeCtx = SAFE_NEGATIVE.some(s => context.includes(s));
    if (isSafeCtx) continue;

    // Allow detected? yes/no in privacy / gate review sections
    if ((label === 'raw_student_chat' || label === 'private_learner_memory' || label === 'teacher_only_notes' || label === 'real_roster' || label === 'ai_prompt' || label === 'provider_response' || label === 'answer_key') &&
        (context.includes('detected?') || context.includes('gate review') || context.includes('privacy review'))) {
      continue;
    }

    const displayCtx = content.substring(Math.max(0, idx - 40), Math.min(content.length, idx + matchStr.length + 40)).replace(/\n/g, ' ');
    console.log(`[${critical ? 'CRITICAL' : 'WARN'}] ${entry.path}: '${label}' in "${displayCtx}"`);
    totalFindings++;
    if (critical) exitCode = 1;
  }
}

if (totalFindings === 0) {
  console.log('Privacy leak scan PASSED - no forbidden patterns found.');
} else if (exitCode === 0) {
  console.log(`Privacy leak scan COMPLETED with ${totalFindings} non-critical findings.`);
} else {
  console.log(`Privacy leak scan FAILED with ${totalFindings} critical findings.`);
  process.exit(1);
}
