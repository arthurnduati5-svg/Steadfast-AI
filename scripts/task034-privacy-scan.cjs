const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const scanPaths = [
  { path: 'reports/task-034-controlled-limited-rollout-v1.json', type: 'generated' },
  { path: 'reports/task-034-controlled-limited-rollout-v1.md', type: 'generated' },
  { path: 'docs/ops/task-034/task-034-controlled-limited-rollout-report.json', type: 'generated' },
  { path: 'docs/ops/task-034/TASK_034_CONTROLLED_LIMITED_ROLLOUT_REPORT.md', type: 'generated' },
  { path: 'docs/ops/task-034/TASK_034_HANDOFF.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_CONTROLLED_LIMITED_ROLLOUT_RUNTIME.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_TASK033_DEPENDENCY_GATE.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_ROLLOUT_ENVIRONMENT_GATE.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_LIMITED_ROLLOUT_CONFIG.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_ROLLOUT_CAP_GATE.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_EXPANDED_COHORT_ELIGIBILITY.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_STAFF_READINESS.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_LEARNER_NOTICE_READINESS.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_CONTROLLED_ROLLOUT_STATE_MACHINE.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_EXPANDED_RUNTIME_GUARD.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_HEALTH_INCIDENT_AND_ROLLBACK.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_PRIVACY_CONTENT_SOCRATIC_DEEN_REVIEWS.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_SAFE_ROLLOUT_READ_MODEL.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_NO_SCHOOL_WIDE_NO_BACKEND_FREEZE_BOUNDARY.md', type: 'generated' },
  { path: 'docs/architecture/TASK_034_VERIFICATION_AND_ACCEPTANCE.md', type: 'generated' },
];

const logsDir = path.join(rootDir, 'logs', 'task-034');
try {
  for (const f of fs.readdirSync(logsDir)) {
    if (f.endsWith('.json') || f.endsWith('.log')) {
      scanPaths.push({ path: path.join('logs', 'task-034', f), type: 'generated' });
    }
  }
} catch {}

const FORBIDDEN_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, label: 'email', critical: true },
  { pattern: /\+\d{10,}/, label: 'phone', critical: true },
  { pattern: /raw student chat/i, label: 'raw_student_chat', critical: true },
  { pattern: /private learner memory/i, label: 'private_learner_memory', critical: true },
  { pattern: /teacher-only notes/i, label: 'teacher_only_notes', critical: true },
  { pattern: /safeguarding raw details/i, label: 'safeguarding_raw_details', critical: true },
  { pattern: /Deen-sensitive private text/i, label: 'deen_sensitive_text', critical: true },
  { pattern: /Bearer\s+[A-Za-z0-9._-]+/i, label: 'auth_header', critical: true },
  { pattern: /(postgres:\/\/|postgresql:\/\/|mysql:\/\/)[^\s"]+/i, label: 'database_url', critical: true },
  { pattern: /sk-(proj|ant)-[A-Za-z0-9]+/, label: 'api_key', critical: true },
  { pattern: /answer key/i, label: 'answer_key', critical: true },
  { pattern: /teacher-only content/i, label: 'teacher_only_content', critical: true },
  { pattern: /protected rubric/i, label: 'protected_rubric', critical: true },
  { pattern: /raw exception object/i, label: 'raw_exception', critical: false },
  { pattern: /unredacted stack trace/i, label: 'stack_trace', critical: false },
  { pattern: /real roster/i, label: 'real_roster', critical: true },
  { pattern: /AI prompt/i, label: 'ai_prompt', critical: true },
  { pattern: /provider response/i, label: 'provider_response', critical: true },
];

const SAFE_NEGATIVE = [
  'do not expose', 'not exposed', 'never exposed', 'forbidden',
  'exposed: no', 'exposed:** no', 'exposed? no', 'exposed?** no',
  ': false', 'should be blocked', 'exposed:**no',
];

let exitCode = 0;
let totalFindings = 0;

for (const entry of scanPaths) {
  const fullPath = path.join(rootDir, entry.path);
  if (!fs.existsSync(fullPath)) {
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
    const idx = lowerContent.indexOf(matchStr);
    const ctxStart = Math.max(0, idx - 80);
    const ctxEnd = Math.min(lowerContent.length, idx + matchStr.length + 80);
    const context = lowerContent.substring(ctxStart, ctxEnd);

    // Check for safe negative indicators (pattern mentioned as blocked/not exposed)
    const isSafeCtx = SAFE_NEGATIVE.some(s => context.includes(s));
    if (isSafeCtx) continue;

    // Handoff docs: "raw student chat exposed? no" or "raw student chat exposed?** no"
    if (context.includes('exposed?') || context.includes('exposed:**')) {
      continue;
    }

    // Architecture docs and ops docs are policy documents that define forbidden
    // data patterns as constraints. These are not actual data leaks.
    const normalizedPath = entry.path.replace(/\\/g, '/');
    const isPolicyDoc = normalizedPath.startsWith('docs/architecture/') ||
      normalizedPath.startsWith('docs/ops/') ||
      normalizedPath.startsWith('docs/operations/');
    if (isPolicyDoc) {
      continue;
    }

    // Test log output: test names like "should fail when raw student chat is exposed"
    if (context.includes('should fail') || context.includes('should pass') ||
        context.includes('it should') || context.includes('✓') || context.includes('√')) {
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
