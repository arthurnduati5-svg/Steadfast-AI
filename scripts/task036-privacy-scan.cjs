const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const scanPaths = [
  'docs/ops/task-036/task-036-live-school-launch-report.json',
  'docs/ops/task-036/TASK_036_LIVE_SCHOOL_LAUNCH_REPORT.md',
  'docs/ops/task-036/TASK_036_HANDOFF.md',
  'docs/architecture/TASK_036_CONTROLLED_LIVE_SCHOOL_LAUNCH_RUNTIME.md',
  'docs/architecture/TASK_036_TASK035_DEPENDENCY_GATE.md',
  'docs/architecture/TASK_036_LAUNCH_ENVIRONMENT_GATE.md',
  'docs/architecture/TASK_036_LAUNCH_WINDOW_CONTROL.md',
  'docs/architecture/TASK_036_LAUNCH_APPROVAL.md',
  'docs/architecture/TASK_036_SINGLE_SCHOOL_SCOPE.md',
  'docs/architecture/TASK_036_RUNTIME_MONITORING.md',
  'docs/architecture/TASK_036_HEALTH_INCIDENT_PAUSE_ROLLBACK_KILL_SWITCH.md',
  'docs/architecture/TASK_036_PRIVACY_CONTENT_SOCRATIC_DEEN_BOUNDARIES.md',
  'docs/architecture/TASK_036_SAFE_LAUNCH_READ_MODEL.md',
  'docs/architecture/TASK_036_NO_PUBLIC_NO_MULTI_SCHOOL_NO_BACKEND_FREEZE_BOUNDARY.md',
  'docs/architecture/TASK_036_VERIFICATION_AND_ACCEPTANCE.md',
  'reports/task-036-live-school-launch-v1.json',
  'reports/task-036-live-school-launch-v1.md',
];

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
  'school_task036_single_school_safe',
  'tenant_task036_single_school_safe',
  'task-036', 'TASK_036', 'task036',
  'safeToStartTask040', 'ACCEPTED_READY_YES',
  'controlled_single_school_live_launch',
];

const safeNegativePhrases = [
  'raw student chat exposed? no', 'raw student chat exposed?** no', 'raw student chat exposed : no',
  'private learner memory exposed? no', 'private learner memory exposed?** no', 'private learner memory exposed : no',
  'student emails exposed? no', 'student emails exposed?** no', 'student emails exposed : no',
  'student phone numbers exposed? no', 'student phone numbers exposed?** no',
  'real roster exposed? no', 'real roster exposed?** no',
  'teacher-only notes exposed? no', 'teacher-only notes exposed?** no',
  'safeguarding raw details exposed? no', 'safeguarding raw details exposed?** no',
  'deen-sensitive private text exposed? no', 'deen-sensitive private text exposed?** no',
  'tokens/secrets exposed? no', 'tokens/secrets exposed?** no', 'tokens/secrets exposed : no',
  'database URLs exposed? no', 'database URLs exposed?** no', 'database URLs exposed : no',
  'answer keys exposed? no', 'answer keys exposed?** no', 'answer keys exposed : no',
  'teacher-only content exposed? no', 'teacher-only content exposed?** no',
  'protected rubrics exposed? no', 'protected rubrics exposed?** no',
  'ai prompts exposed? no', 'ai prompts exposed?** no',
  'provider responses exposed? no', 'provider responses exposed?** no',
  'real student emails exposed? no',
  'rawStudentChatExposed":false', 'privateLearnerMemoryExposed":false',
  'tokensSecretsExposed":false', 'databaseUrlsExposed":false',
  'answerKeysExposed":false', 'teacherOnlyContentExposed":false',
  'protectedRubricsExposed":false', 'aiPromptsExposed":false',
  'providerResponsesExposed":false',
  '**answer keys exposed?** no',
  'blocks answer key/homework shortcut',
];

let exitCode = 0;
let totalFindings = 0;

console.log('=== Task 036 Privacy Leak Scan ===\n');

for (const relPath of scanPaths) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP: ' + relPath + ' (not found)');
    continue;
  }
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    console.log('SKIP: ' + relPath + ' (binary or unreadable)');
    continue;
  }
  console.log('Scanning: ' + relPath);

  for (const fp of forbiddenPatterns) {
    const matches = content.match(fp.pattern);
    if (matches) {
      for (const match of matches) {
        const isAllowed = allowedIdentifiers.some(id => match.includes(id));
        if (isAllowed) continue;

        const lineMatch = content.split('\n').find(l => l.includes(match));
        const isSafeNegative = safeNegativePhrases.some(np => lineMatch && lineMatch.toLowerCase().includes(np.toLowerCase()));
        if (isSafeNegative) continue;

        console.error('  FAIL: Found "' + fp.name + '" in ' + relPath + ': "' + match.substring(0, 100) + '"');
        totalFindings++;
        exitCode = 1;
      }
    }
  }
}

if (totalFindings === 0) {
  console.log('\nPASS: No privacy violations detected');
} else {
  console.log('\nFAIL: ' + totalFindings + ' privacy violation(s) detected');
}

console.log('\n=== Privacy scan complete. Exit code: ' + exitCode + ' ===');
process.exit(exitCode);
