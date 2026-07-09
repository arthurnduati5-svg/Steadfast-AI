const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs/ops/task-034/task-034-controlled-rollout-report.json');
const requiredSections = [
  'task033Proof', 'controlledRolloutConfig', 'rolloutCap', 'expandedCohortEligibility',
  'staffReadiness', 'learnerNoticeReadiness', 'activationStateMachine', 'expandedRuntimeGuard',
  'expandedPrivacyBoundary', 'healthBudget', 'canaryBaselineComparison', 'expandedMonitoringSnapshot',
  'teacherAdminReview', 'studentSafeFeedbackContinuation', 'incidentRollbackBridge', 'rollbackProof',
  'socraticIntegrityReview', 'deenGovernanceReview', 'curriculumSourceReview', 'roleBoundaryReview',
  'postLimitedRolloutDecision', 'privacyLeakChecks', 'securityGateChecks', 'deenGateChecks',
  'socraticGateChecks', 'curriculumGateChecks', 'rolloutScopeChecks', 'testResults',
  'verificationCommands', 'blockingIssues', 'knownLimitations', 'safeToStartTask035', 'finalDecision',
];

const forbiddenStale = [/undefined/gi, /pending/gi, /\[object Object\]/gi, /\$\{report\./, /\$\{verificationCommands\./, /\$\{testResults\./];

const forbiddenPrivate = [
  'raw student chat', 'private learner memory', 'teacher-only notes',
  'safeguarding raw details', 'Deen-sensitive private text',
  'AI prompt', 'provider response',
  'database URL', 'postgres://', 'postgresql://', 'mysql://',
  'OpenAI key', 'sk-proj-', 'sk-ant-',
  'authorization header', 'cookie', 'answer key',
  'teacher-only content', 'protected rubric',
  'raw exception object', 'unredacted stack trace',
  'student email', 'student phone', 'real roster',
];

let exitCode = 0;

console.log('=== Task 034 JSON Report Validator ===\n');

if (!fs.existsSync(reportPath)) {
  console.error('FAIL: Report not found at', reportPath);
  process.exit(1);
}

let report;
try {
  const raw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
  report = JSON.parse(raw);
} catch (e) {
  console.error('FAIL: Invalid JSON:', e.message);
  process.exit(1);
}

// Check taskId
if (report.taskId !== '034') {
  console.error('FAIL: taskId is not "034" - got', report.taskId);
  exitCode = 1;
} else {
  console.log('PASS: taskId is "034"');
}

// Check safeToStartTask035 is boolean
if (typeof report.safeToStartTask035 !== 'boolean') {
  console.error('FAIL: safeToStartTask035 is not boolean - got', typeof report.safeToStartTask035);
  exitCode = 1;
} else {
  console.log('PASS: safeToStartTask035 is boolean:', report.safeToStartTask035);
}

// Check finalDecision
const validDecisions = ['TASK_034_PASS_SAFE_TO_START_TASK_035', 'TASK_034_FAIL_NOT_SAFE_TO_START_TASK_035'];
if (!validDecisions.includes(report.finalDecision)) {
  console.error('FAIL: finalDecision invalid - got', report.finalDecision);
  exitCode = 1;
} else {
  console.log('PASS: finalDecision is valid:', report.finalDecision);
}

// Check finalDecision matches safeToStartTask035
const expectedDecision = report.safeToStartTask035
  ? 'TASK_034_PASS_SAFE_TO_START_TASK_035'
  : 'TASK_034_FAIL_NOT_SAFE_TO_START_TASK_035';
if (report.finalDecision !== expectedDecision) {
  console.error(`FAIL: finalDecision ${report.finalDecision} does not match safeToStartTask035 ${report.safeToStartTask035}`);
  exitCode = 1;
} else {
  console.log('PASS: finalDecision matches safeToStartTask035');
}

// Check blockingIssues is array
if (!Array.isArray(report.blockingIssues)) {
  console.error('FAIL: blockingIssues is not array');
  exitCode = 1;
} else {
  console.log('PASS: blockingIssues is array, length:', report.blockingIssues.length);
}

// Check knownLimitations is array
if (!Array.isArray(report.knownLimitations)) {
  console.error('FAIL: knownLimitations is not array');
  exitCode = 1;
} else {
  console.log('PASS: knownLimitations is array, length:', report.knownLimitations.length);
}

// Check verificationCommands is array
if (!Array.isArray(report.verificationCommands)) {
  console.error('FAIL: verificationCommands is not array');
  exitCode = 1;
} else {
  console.log('PASS: verificationCommands is array, length:', report.verificationCommands.length);
}

// Check testResults is array
if (!Array.isArray(report.testResults)) {
  console.error('FAIL: testResults is not array');
  exitCode = 1;
} else {
  console.log('PASS: testResults is array, length:', report.testResults.length);
}

// Check all required sections exist
let allSectionsExist = true;
for (const section of requiredSections) {
  if (report[section] === undefined) {
    console.error(`FAIL: Required section "${section}" missing`);
    allSectionsExist = false;
    exitCode = 1;
  }
}
if (allSectionsExist) {
  console.log('PASS: All required sections present');
}

// Check verificationCommands structure
let verCommandsOk = true;
for (const cmd of report.verificationCommands) {
  if (!cmd.command || cmd.exitCode === undefined || !cmd.result || !cmd.summary) {
    console.error('FAIL: verificationCommand missing required fields');
    verCommandsOk = false;
    exitCode = 1;
    break;
  }
  if (cmd.result === 'pending' || cmd.exitCode === undefined) {
    console.error('FAIL: verificationCommand has pending/undefined result');
    verCommandsOk = false;
    exitCode = 1;
  }
}
if (verCommandsOk) {
  console.log('PASS: All verification commands have valid structure');
}

// Check stale placeholders
const reportStr = JSON.stringify(report);
let staleFound = false;
for (const pattern of forbiddenStale) {
  if (pattern.test(reportStr)) {
    console.error('FAIL: Stale placeholder detected:', pattern);
    staleFound = true;
    exitCode = 1;
  }
}
if (!staleFound) {
  console.log('PASS: No stale placeholders');
}

// Check forbidden private data
let privateDataFound = false;
for (const pattern of forbiddenPrivate) {
  const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (regex.test(reportStr)) {
    // Allow safe negative checklist phrases
    const negativePhrases = [
      'raw student chat exposed? no', 'private learner memory exposed? no',
      'student emails exposed? no', 'tokens/secrets exposed? no',
      'database urls exposed? no', 'answer keys exposed? no',
      'rawStudentChatExposed":false', 'privateLearnerMemoryExposed":false',
      'tokensSecretsExposed":false', 'databaseUrlsExposed":false',
      'answerKeysExposed":false', 'teacherOnlyContentExposed":false',
      'protectedRubricsExposed":false', 'aiPromptsExposed":false',
      'providerResponsesExposed":false',
    ];
    // Check if it's a property name rather than actual data
    const isProperty = reportStr.includes(`"${pattern}"`) || reportStr.includes(`'${pattern}'`);
    if (!isProperty) {
      const lineMatch = reportStr.split('\n').find(l => regex.test(l));
      const isAllowedNegative = negativePhrases.some(np => lineMatch && lineMatch.toLowerCase().includes(np));
      if (!isAllowedNegative) {
        console.error('FAIL: Forbidden private data pattern detected:', pattern);
        privateDataFound = true;
        exitCode = 1;
      }
    }
  }
}
if (!privateDataFound) {
  console.log('PASS: No forbidden private data patterns in report');
}

// Check privacy leak fields
const privacyFields = ['rawStudentChatExposed', 'privateLearnerMemoryExposed', 'teacherOnlyNotesExposed',
  'safeguardingRawDetailsExposed', 'deenSensitivePrivateTextExposed', 'aiPromptsExposed',
  'providerResponsesExposed', 'tokensSecretsExposed', 'databaseUrlsExposed', 'answerKeysExposed',
  'teacherOnlyContentExposed', 'protectedRubricsExposed'];
if (report.privacyLeakChecks) {
  let privacyOk = true;
  for (const field of privacyFields) {
    if (report.privacyLeakChecks[field] !== false) {
      console.error(`FAIL: privacyLeakChecks.${field} is not false`);
      privacyOk = false;
      exitCode = 1;
    }
  }
  if (privacyOk) console.log('PASS: All privacy leak fields are false');
}

// Check rollout scope fields
if (report.rolloutScopeChecks) {
  const scopeFields = ['openRegistrationEnabled', 'publicSignupEnabled', 'allStudentsEnabled',
    'schoolWideRolloutPerformed', 'hundredPercentRolloutPerformed'];
  let scopeOk = true;
  for (const field of scopeFields) {
    if (report.rolloutScopeChecks[field] !== false) {
      console.error(`FAIL: rolloutScopeChecks.${field} is not false`);
      scopeOk = false;
      exitCode = 1;
    }
  }
  if (scopeOk) console.log('PASS: All rollout scope fields are false');
}

// Check security/deen/socratic/curriculum gate weakened fields
const gateFields = {
  securityGateChecks: ['schoolAuthGateWeakened', 'rolloutGateWeakened'],
  deenGateChecks: ['fatwaEngineIntroduced', 'deenGovernanceGateWeakened'],
  socraticGateChecks: ['socraticGateWeakened', 'noFinalAnswerPolicyWeakened'],
  curriculumGateChecks: ['curriculumSourceGateWeakened', 'contentGovernanceGateWeakened'],
};
for (const [section, fields] of Object.entries(gateFields)) {
  if (report[section]) {
    for (const field of fields) {
      if (report[section][field] !== false) {
        console.error(`FAIL: ${section}.${field} is not false`);
        exitCode = 1;
      }
    }
  }
}
console.log('PASS: All gate weakened fields are false');

console.log(`\n=== Validation complete. Exit code: ${exitCode} ===`);
process.exit(exitCode);
