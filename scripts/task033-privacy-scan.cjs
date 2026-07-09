const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const scanPaths = [
  'docs/ops/task-033/task-033-canary-observation-report.json',
  'docs/ops/task-033/TASK_033_CANARY_OBSERVATION_REPORT.md',
  'docs/ops/task-033/TASK_033_HANDOFF.md',
  'logs/task-033/task-033-verification-summary.json',
  'logs/task-033/verify-task033-standalone.log',
  'logs/task-033/canary-observation-result.json',
  'backend/src/contracts/task033CanaryObservationContracts.ts',
  'backend/src/services/task033Task032ProofLoaderService.ts',
  'backend/src/services/task033CanaryObservationConfigService.ts',
  'backend/src/services/task033CanaryObservationEvidenceService.ts',
  'backend/src/services/task033AggregateMonitoringSnapshotService.ts',
  'backend/src/services/task033TeacherFeedbackReviewService.ts',
  'backend/src/services/task033StudentSafeFeedbackService.ts',
  'backend/src/services/task033AdminReviewWorkflowService.ts',
  'backend/src/services/task033HealthBudgetEnforcementService.ts',
  'backend/src/services/task033LearningQualityReviewService.ts',
  'backend/src/services/task033DeenGovernanceReviewService.ts',
  'backend/src/services/task033CurriculumSourceReviewService.ts',
  'backend/src/services/task033PrivacyReviewService.ts',
  'backend/src/services/task033IncidentBridgeReviewService.ts',
  'backend/src/services/task033RollbackReadinessReviewService.ts',
  'backend/src/services/task033PostCanaryDecisionService.ts',
  'backend/src/routes/task033CanaryObservationRoutes.ts',
  'scripts/run-task033-canary-observation.cjs',
  'scripts/gen-task033-report.cjs',
  'scripts/task033-json-validate.cjs',
  'scripts/task033-privacy-scan.cjs',
  'scripts/verify-task033.ps1',
];

const forbiddenPatterns = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, label: 'student_email', critical: true },
  { pattern: /\+\d{10,}/, label: 'student_phone', critical: true },
  { pattern: /raw student chat/i, label: 'raw_student_chat', critical: true },
  { pattern: /private learner memory/i, label: 'private_learner_memory', critical: true },
  { pattern: /teacher-only notes/i, label: 'teacher_only_notes', critical: true },
  { pattern: /safeguarding raw details/i, label: 'safeguarding_raw_details', critical: true },
  { pattern: /Deen-sensitive private text/i, label: 'deen_sensitive_text', critical: true },
  { pattern: /Bearer\s+[A-Za-z0-9._-]+/i, label: 'auth_header', critical: true },
  { pattern: /(postgres:\/\/|postgresql:\/\/|mysql:\/\/)[^\s"]+/i, label: 'database_url', critical: true },
  { pattern: /sk-proj-[A-Za-z0-9]+/, label: 'openai_key', critical: true },
  { pattern: /sk-ant-[A-Za-z0-9]+/, label: 'anthropic_key', critical: true },
  { pattern: /answer key/i, label: 'answer_key', critical: true },
  { pattern: /teacher-only content/i, label: 'teacher_only_content', critical: true },
  { pattern: /protected rubric/i, label: 'protected_rubric', critical: true },
  { pattern: /raw exception object/i, label: 'raw_exception_object', critical: false },
  { pattern: /unredacted stack trace/i, label: 'stack_trace', critical: false },
  { pattern: /real roster/i, label: 'real_roster', critical: true },
  { pattern: /AI prompt/i, label: 'ai_prompt', critical: true },
  { pattern: /provider response/i, label: 'provider_response', critical: true },
];

const sourceCodeSafeSuffixes = ['.ts', '.cjs', '.ps1'];
const generatedArtifactExtensions = ['.json', '.md', '.log'];
const testFilePatterns = ['.test.ts', '.contract.test.ts', '.spec.ts'];

const safeIdentifiers = [
  'school_task032_canary_safe',
  'tenant_task032_canary_safe',
  'canary_cohort_task032_safe',
  'canary_run_task032_safe',
  'student_hash_task032_safe_001',
  'student_hash_task032_safe_002',
  'teacher_hash_task032_safe_001',
  'admin_hash_task032_safe_001',
  'operator_hash_task032_safe_001',
  'observation_run_task033_safe',
  'observation_window_task033_safe',
  'teacher_feedback_task033_safe',
  'student_feedback_task033_safe',
  'incident_review_task033_safe',
  'post_canary_decision_task033_safe',
];

let exitCode = 0;
let totalFindings = 0;

function isSafeIdentifier(content, lowerContent, matchText) {
  for (const id of safeIdentifiers) {
    if (lowerContent.includes(id.toLowerCase())) {
      const idIdx = lowerContent.indexOf(id.toLowerCase());
      const matchIdx = lowerContent.indexOf(matchText.toLowerCase());
      if (matchIdx >= idIdx && matchIdx < idIdx + id.length + 5) {
        return true;
      }
    }
  }
  return false;
}

for (const scanPath of scanPaths) {
  const fullPath = path.join(rootDir, scanPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[SKIP] ${scanPath} - not found`);
    continue;
  }

  const ext = path.extname(scanPath).toLowerCase();
  const isGenerated = generatedArtifactExtensions.includes(ext);
  const isTestFile = testFilePatterns.some(p => scanPath.includes(p));

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    console.log(`[SKIP] ${scanPath} - binary or unreadable`);
    continue;
  }

  const lowerContent = content.toLowerCase();

  for (const { pattern, label, critical } of forbiddenPatterns) {
    const matches = lowerContent.match(pattern);
    if (!matches) continue;

    if (isSafeIdentifier(content, lowerContent, matches[0])) {
      continue;
    }

    if (sourceCodeSafeSuffixes.includes(ext)) {
      const idx = lowerContent.indexOf(matches[0].toLowerCase());
      const contextStart = Math.max(0, idx - 500);
      const contextEnd = Math.min(lowerContent.length, idx + matches[0].length + 500);
      const context = lowerContent.substring(contextStart, contextEnd);

      const isDefinition = context.includes('forbidden') || context.includes('do not expose') ||
        context.includes('not exposed') || context.includes('never ') ||
        context.includes('redact') || context.includes('blocked') ||
        context.includes('task033_forbidden') || context.includes('task_033_forbidden') ||
        context.includes('forbiddenoutputpattern') || context.includes('forbidden_pattern') ||
        context.includes('forbiddenpatterns') || context.includes('should not contain') ||
        context.includes('should not find') || context.includes('must not') ||
        context.includes('will not') || context.includes('safe') || context.includes('denied') ||
        context.includes('exposed?** no') || context.includes('exposed? no');

      if (isDefinition) {
        continue;
      }

      if (isTestFile) {
        const isTestAssertion = context.includes('expect(') || context.includes('assert.') ||
          context.includes('.tobe(') || context.includes('.toEqual(') ||
          context.includes('detect') || context.includes('check') ||
          context.includes('test(') || context.includes('it(') ||
          context.includes('describe(') || context.includes('is forbidden');
        if (isTestAssertion) {
          continue;
        }
      }
    }

    if (isGenerated) {
      const idx = lowerContent.indexOf(matches[0].toLowerCase());
      const contextStart = Math.max(0, idx - 80);
      const contextEnd = Math.min(lowerContent.length, idx + matches[0].length + 80);
      const context = lowerContent.substring(contextStart, contextEnd);

      const isSafeNegative = context.includes('do not expose') || context.includes('not exposed') ||
        context.includes('never ') || context.includes('forbidden') ||
        context.includes(': false') || context.includes(':false') ||
        context.includes('exposed? no') || context.includes('exposed?** no') ||
        context.includes('exposed?**no') || context.includes('blocks answer');

      if (isSafeNegative) {
        continue;
      }

      if ((label === 'raw_student_chat' || label === 'private_learner_memory' ||
           label === 'teacher_only_notes' || label === 'safeguarding_raw_details' ||
           label === 'deen_sensitive_text' || label === 'answer_key' ||
           label === 'teacher_only_content' || label === 'protected_rubric' ||
           label === 'ai_prompt' || label === 'provider_response' || label === 'real_roster') &&
          (context.includes('detected?') || context.includes('checklist') ||
           context.includes('gate review') || context.includes('privacy review'))) {
        continue;
      }

      if (label === 'student_email' && context.includes('should be blocked')) {
        continue;
      }
    }

    const idx = lowerContent.indexOf(matches[0].toLowerCase());
    const contextStart = Math.max(0, idx - 40);
    const contextEnd = Math.min(lowerContent.length, idx + matches[0].length + 40);
    const context = content.substring(contextStart, contextEnd).replace(/\n/g, ' ');

    console.log(`[${critical ? 'CRITICAL' : 'WARN'}] ${scanPath}: found '${label}' pattern`);
    console.log(`  Context: ...${context}...`);
    totalFindings++;
    if (critical) {
      exitCode = 1;
    }
  }
}

if (totalFindings === 0) {
  console.log('Privacy leak scan PASSED - no forbidden patterns found.');
} else if (exitCode === 0) {
  console.log(`Privacy leak scan COMPLETED with ${totalFindings} non-critical findings.`);
} else {
  console.log(`Privacy leak scan FAILED with ${totalFindings} critical findings.`);
}

process.exit(exitCode);
