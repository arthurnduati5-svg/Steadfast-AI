const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const scanPaths = [
  'docs/ops/task-034/task-034-controlled-rollout-report.json',
  'docs/ops/task-034/TASK_034_CONTROLLED_ROLLOUT_REPORT.md',
  'docs/ops/task-034/TASK_034_HANDOFF.md',
  'logs/task-034/task-034-verification-summary.json',
  'logs/task-034/verify-task034-standalone.log',
  'logs/task-034/controlled-rollout-result.json',
];

// Source files are excluded — patterns in service/contract/test code
// are definitions of what to scan for, not actual data leaks.

// Resolve glob-like patterns manually
function collectFiles(baseDir, patterns) {
  const files = [];
  for (const pattern of patterns) {
    const dir = path.dirname(pattern);
    const filePattern = path.basename(pattern);
    const fullDir = path.join(baseDir, dir);
    if (fs.existsSync(fullDir)) {
      const entries = fs.readdirSync(fullDir);
      for (const entry of entries) {
        if (entry.startsWith(filePattern.replace('*', ''))) {
          files.push(path.join(fullDir, entry));
        }
      }
    }
  }
  return files;
}

const forbiddenPatterns = [
  { pattern: /raw\s+student\s+chat/gi, name: 'raw student chat' },
  { pattern: /private\s+learner\s+memory/gi, name: 'private learner memory' },
  { pattern: /teacher-only\s+notes/gi, name: 'teacher-only notes' },
  { pattern: /safeguarding\s+raw\s+details/gi, name: 'safeguarding raw details' },
  { pattern: /Deen-sensitive\s+private\s+text/gi, name: 'Deen-sensitive private text' },
  { pattern: /AI\s+prompt/gi, name: 'AI prompt' },
  { pattern: /provider\s+response/gi, name: 'provider response' },
  { pattern: /postgres:\/\//gi, name: 'postgres:// URL' },
  { pattern: /postgresql:\/\//gi, name: 'postgresql:// URL' },
  { pattern: /mysql:\/\//gi, name: 'mysql:// URL' },
  { pattern: /sk-proj-/gi, name: 'OpenAI secret key pattern' },
  { pattern: /sk-ant-/gi, name: 'Anthropic secret key pattern' },
  { pattern: /Bearer\s+[A-Za-z0-9\-_.]+/g, name: 'authorization header' },
  { pattern: /answer\s+key/gi, name: 'answer key' },
  { pattern: /teacher-only\s+content/gi, name: 'teacher-only content' },
  { pattern: /protected\s+rubric/gi, name: 'protected rubric' },
  { pattern: /raw\s+exception\s+object/gi, name: 'raw exception object' },
  { pattern: /unredacted\s+stack\s+trace/gi, name: 'unredacted stack trace' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, name: 'email address' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, name: 'phone number pattern' },
];

const allowedIdentifiers = [
  'school_task034_limited_rollout_safe',
  'tenant_task034_limited_rollout_safe',
  'cohort_task034_limited_rollout_safe',
  'rollout_run_task034_safe',
  'rollout_window_task034_safe',
  'student_hash_task034_safe_001', 'student_hash_task034_safe_002',
  'student_hash_task034_safe_003', 'student_hash_task034_safe_004',
  'teacher_hash_task034_safe_001', 'teacher_hash_task034_safe_002',
  'admin_hash_task034_safe_001', 'operator_hash_task034_safe_001',
  'class_task034_safe_001', 'subject_task034_safe_math_001',
  'curriculum_scope_task034_safe_001', 'source_scope_task034_safe_001',
  'rollback_plan_task034_safe', 'incident_review_task034_safe',
  'post_limited_rollout_decision_task034_safe',
  'task-034', 'TASK_034', 'task034',
  'safeToStartTask035', 'safe_to_prepare_next_rollout_stage',
  'controlled_limited_rollout',
];

const safeNegativePhrases = [
  'raw student chat exposed? no', 'raw student chat exposed?** no', 'raw student chat exposed : no',
  'private learner memory exposed? no', 'private learner memory exposed?** no', 'private learner memory exposed : no',
  'student full names exposed? no', 'student full names exposed?** no',
  'student emails exposed? no', 'student emails exposed?** no', 'student emails exposed : no',
  'student phone numbers exposed? no', 'student phone numbers exposed?** no',
  'real roster exposed? no', 'real roster exposed?** no',
  'teacher-only notes exposed? no', 'teacher-only notes exposed?** no',
  'safeguarding raw details exposed? no', 'safeguarding raw details exposed?** no',
  'deen-sensitive private text exposed? no', 'deen-sensitive private text exposed?** no',
  'tokens/secrets exposed? no', 'tokens/secrets exposed?** no', 'tokens/secrets exposed : no',
  'database URLs exposed? no', 'database URLs exposed?** no', 'database URLs exposed : no',
  'answer keys exposed? no', 'answer keys exposed?** no', 'answer keys exposed : no',
  'auth headers exposed? no', 'auth headers exposed?** no',
  'cookies exposed? no', 'cookies exposed?** no',
  'teacher-only content exposed? no', 'teacher-only content exposed?** no',
  'protected rubrics exposed? no', 'protected rubrics exposed?** no',
  'ai prompts exposed? no', 'ai prompts exposed?** no',
  'provider responses exposed? no', 'provider responses exposed?** no',
  'blocks answer key', 'blocks answer key/homework shortcut',
  'rawStudentChatExposed":false', 'privateLearnerMemoryExposed":false',
  'tokensSecretsExposed":false', 'databaseUrlsExposed":false',
  'answerKeysExposed":false', 'teacherOnlyContentExposed":false',
  'protectedRubricsExposed":false', 'aiPromptsExposed":false',
  'providerResponsesExposed":false',
  'privacyLeakChecks',
];

let exitCode = 0;
let totalFindings = 0;

console.log('=== Task 034 Privacy Leak Scan ===\n');

// Scan report/artifact files
for (const relPath of scanPaths) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${relPath} (not found)`);
    continue;
  }
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    console.log(`SKIP: ${relPath} (binary or unreadable)`);
    continue;
  }
  console.log(`Scanning: ${relPath}`);

  for (const fp of forbiddenPatterns) {
    const matches = content.match(fp.pattern);
    if (matches) {
      for (const match of matches) {
        // Check if match contains an allowed identifier
        const isAllowed = allowedIdentifiers.some(id => match.includes(id));
        if (isAllowed) continue;

        // Check if line contains safe negative phrase
        const lineMatch = content.split('\n').find(l => l.includes(match));
        const isSafeNegative = safeNegativePhrases.some(np => lineMatch && lineMatch.toLowerCase().includes(np.toLowerCase()));
        if (isSafeNegative) continue;

        console.error(`  FAIL: Found "${fp.name}" in ${relPath}: "${match.substring(0, 100)}"`);
        totalFindings++;
        exitCode = 1;
      }
    }
  }
}



if (totalFindings === 0) {
  console.log('\nPASS: No privacy violations detected');
} else {
  console.log(`\nFAIL: ${totalFindings} privacy violation(s) detected`);
}

console.log(`\n=== Privacy scan complete. Exit code: ${exitCode} ===`);
process.exit(exitCode);
