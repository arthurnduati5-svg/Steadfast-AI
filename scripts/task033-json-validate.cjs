const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs/ops/task-033/task-033-canary-observation-report.json');

let exitCode = 0;

try {
  const raw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
  const report = JSON.parse(raw);

  const errors = [];

  // Check taskId
  if (report.taskId !== '033') {
    errors.push(`taskId mismatch: expected 033, got ${report.taskId}`);
  }

  // Check safeToStartTask034
  if (typeof report.safeToStartTask034 !== 'boolean') {
    errors.push(`safeToStartTask034 must be boolean, got ${typeof report.safeToStartTask034}`);
  }

  // Check finalDecision
  const validDecisions = ['TASK_033_PASS_SAFE_TO_START_TASK_034', 'TASK_033_FAIL_NOT_SAFE_TO_START_TASK_034'];
  if (!validDecisions.includes(report.finalDecision)) {
    errors.push(`Invalid finalDecision: ${report.finalDecision}`);
  }

  // Check finalDecision consistency with safeToStartTask034
  if (report.safeToStartTask034 === true && report.finalDecision !== 'TASK_033_PASS_SAFE_TO_START_TASK_034') {
    errors.push('safeToStartTask034 true but finalDecision is not TASK_033_PASS_SAFE_TO_START_TASK_034');
  }
  if (report.safeToStartTask034 === false && report.finalDecision !== 'TASK_033_FAIL_NOT_SAFE_TO_START_TASK_034') {
    errors.push('safeToStartTask034 false but finalDecision is not TASK_033_FAIL_NOT_SAFE_TO_START_TASK_034');
  }

  // Check blockingIssues
  if (!Array.isArray(report.blockingIssues)) {
    errors.push('blockingIssues must be an array');
  } else if (report.safeToStartTask034 === true && report.blockingIssues.length > 0) {
    errors.push('safeToStartTask034 true but blockingIssues not empty');
  }

  // Check knownLimitations
  if (!Array.isArray(report.knownLimitations)) {
    errors.push('knownLimitations must be an array');
  }

  // Check verificationCommands
  if (!Array.isArray(report.verificationCommands)) {
    errors.push('verificationCommands must be an array');
  } else {
    for (const cmd of report.verificationCommands) {
      if (cmd.result === 'pending' || cmd.result === 'PENDING') {
        errors.push('verification command result is still pending');
      }
      if (cmd.exitCode === undefined || cmd.exitCode === null) {
        errors.push('verification command has undefined/null exitCode');
      }
    }
  }

  // Check testResults
  if (!Array.isArray(report.testResults)) {
    errors.push('testResults must be an array');
  }

  // Required sections
  const requiredSections = [
    'task032Proof', 'observationConfig', 'approvedCanaryScope',
    'evidenceCollector', 'aggregateMonitoringSnapshot', 'teacherFeedbackReview',
    'studentSafeFeedback', 'adminReviewWorkflow', 'healthBudgetReview',
    'learningQualityReview', 'deenGovernanceReview', 'curriculumSourceReview',
    'privacyReview', 'incidentBridgeReview', 'rollbackReadinessReview',
    'runtimeGuardReview', 'roleBoundaryReview', 'postCanaryDecision',
    'privacyLeakChecks', 'securityGateChecks', 'deenGateChecks',
    'socraticGateChecks', 'curriculumGateChecks',
    'testResults', 'verificationCommands', 'blockingIssues', 'knownLimitations',
    'safeToStartTask034', 'finalDecision',
  ];

  for (const section of requiredSections) {
    if (!report[section] && report[section] !== false) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Check privacy leak fields are false
  const privacyFields = ['rawStudentChatExposed', 'privateLearnerMemoryExposed', 'tokensSecretsExposed', 'databaseUrlsExposed'];
  if (report.privacyLeakChecks) {
    for (const field of privacyFields) {
      if (report.privacyLeakChecks[field] !== false) {
        errors.push(`privacyLeakChecks.${field} must be false, got ${report.privacyLeakChecks[field]}`);
      }
    }
  }

  // Check security/Deen/socratic/curriculum gate weakened fields are false
  const gateFields = [
    ['securityGateChecks', ['schoolAuthGateWeakened', 'canaryGateWeakened', 'observationGateWeakened']],
    ['deenGateChecks', ['fatwaEngineIntroduced', 'deenGovernanceGateWeakened']],
    ['socraticGateChecks', ['socraticGateWeakened', 'noFinalAnswerPolicyWeakened']],
    ['curriculumGateChecks', ['curriculumSourceGateWeakened', 'contentGovernanceGateWeakened']],
  ];
  for (const [section, fields] of gateFields) {
    if (report[section]) {
      for (const field of fields) {
        if (report[section][field] !== false) {
          errors.push(`${section}.${field} must be false, got ${report[section][field]}`);
        }
      }
    }
  }

  // Check for stale template tokens
  const reportStr = JSON.stringify(report);
  const stalePatterns = [
    /\$\{report\./,
    /\$\{verificationCommands\./,
    /\$\{testResults\./,
    /"undefined"/,
    /"pending"/i,
    /\[object Object\]/,
    /NaN/,
  ];

  for (const pattern of stalePatterns) {
    if (pattern.test(reportStr)) {
      errors.push(`Stale template token found: ${pattern}`);
    }
  }

  // Check for forbidden private data
  const forbiddenPatterns = [
    'raw student chat', 'private learner memory', 'teacher-only notes',
    'safeguarding raw details', 'Deen-sensitive private text',
    'AI prompt', 'provider response', 'answer key',
    'teacher-only content', 'protected rubric',
    'Bearer ', 'authorization header', 'raw exception object',
    'unredacted stack trace', 'student email', 'student phone',
    'real roster', 'postgres://', 'postgresql://', 'mysql://',
  ];

  for (const pattern of forbiddenPatterns) {
    if (reportStr.toLowerCase().includes(pattern.toLowerCase())) {
      const idx = reportStr.toLowerCase().indexOf(pattern.toLowerCase());
      const contextStart = Math.max(0, idx - 80);
      const contextEnd = Math.min(reportStr.length, idx + pattern.length + 80);
      const context = reportStr.substring(contextStart, contextEnd).toLowerCase();
      const isSafeNegative = context.includes('do not expose') || context.includes('not exposed') ||
        context.includes('never ') || context.includes('forbidden') ||
        context.includes(': false') || context.includes(':false') ||
        context.includes('exposed? no') || context.includes('exposed?** no');
      if (!isSafeNegative) {
        errors.push(`Forbidden private data pattern '${pattern}' found in report`);
      }
    }
  }

  if (errors.length > 0) {
    console.log('JSON Report Validation FAILED:');
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    exitCode = 1;
  } else {
    console.log('JSON Report Validation PASSED');
  }
} catch (e) {
  console.error('JSON Report Validation FAILED with exception:', e.message);
  exitCode = 1;
}

process.exit(exitCode);
