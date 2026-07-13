const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs/ops/task-036/task-036-live-school-launch-report.json');

const requiredSections = [
  'taskId', 'taskName', 'scope', 'task035DependencyVerified',
  'task036Started', 'task040Started',
  'frontendUiCreated', 'publicLaunchCreated', 'multiSchoolRolloutCreated', 'backendFreezeCreated',
  'productionDeploymentIntroduced', 'realNotificationsSent', 'liveAiExpansionIntroduced',
  'liveSchoolConnectorWriteExpansionIntroduced', 'productionDataMutationExecuted',
  'rawPrivateDataStored', 'controlledLiveSchoolLaunchCreated',
  'task035DependencyGatePassed', 'launchEnvironmentGatePassed', 'launchWindowPassed',
  'launchApprovalPassed', 'singleSchoolScopePassed', 'runtimeMonitoringReady',
  'healthIncidentPauseRollbackKillSwitchReady', 'privacyContentSocraticDeenBoundariesPassed',
  'safeLaunchReadModelPassed', 'noPublicNoMultiSchoolNoBackendFreezeBoundaryPassed',
  'reportPassed', 'testResults', 'scanResults', 'safeToStartTask040',
  'verdict', 'commandsRun', 'filesCreated', 'filesModified',
  'filesStaged', 'filesIntentionallyNotStaged', 'remainingBlockers', 'generatedAt',
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

console.log('=== Task 036 JSON Report Validator ===\n');

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
if (report.taskId !== '036') {
  console.error('FAIL: taskId is not "036" - got', report.taskId);
  exitCode = 1;
} else {
  console.log('PASS: taskId is "036"');
}

// Check scope
if (report.scope !== 'controlled_single_school_live_launch') {
  console.error('FAIL: scope is not "controlled_single_school_live_launch" - got', report.scope);
  exitCode = 1;
} else {
  console.log('PASS: scope is "controlled_single_school_live_launch"');
}

// Check safeToStartTask040 is boolean
if (typeof report.safeToStartTask040 !== 'boolean') {
  console.error('FAIL: safeToStartTask040 is not boolean - got', typeof report.safeToStartTask040);
  exitCode = 1;
} else {
  console.log('PASS: safeToStartTask040 is boolean:', report.safeToStartTask040);
}

// Check verdict
const validVerdicts = ['ACCEPTED_READY_YES', 'NOT_ACCEPTED'];
if (!validVerdicts.includes(report.verdict)) {
  console.error('FAIL: verdict invalid - got', report.verdict);
  exitCode = 1;
} else {
  console.log('PASS: verdict is valid:', report.verdict);
}

// Check verdict matches safeToStartTask040
if (report.safeToStartTask040 === true && report.verdict !== 'ACCEPTED_READY_YES') {
  console.error('FAIL: safeToStartTask040 true but verdict is not ACCEPTED_READY_YES');
  exitCode = 1;
} else if (report.safeToStartTask040 === false && report.verdict !== 'NOT_ACCEPTED') {
  console.error('FAIL: safeToStartTask040 false but verdict is not NOT_ACCEPTED');
  exitCode = 1;
} else {
  console.log('PASS: verdict matches safeToStartTask040');
}

// Check remainingBlockers
if (!Array.isArray(report.remainingBlockers)) {
  console.error('FAIL: remainingBlockers is not array');
  exitCode = 1;
} else {
  console.log('PASS: remainingBlockers is array, length:', report.remainingBlockers.length);
}

// Check all required sections exist
let allSectionsExist = true;
for (const section of requiredSections) {
  if (report[section] === undefined) {
    console.error('FAIL: Required section "' + section + '" missing');
    allSectionsExist = false;
    exitCode = 1;
  }
}
if (allSectionsExist) {
  console.log('PASS: All required sections present');
}

// Check testResults structure
let testResultsOk = true;
if (Array.isArray(report.testResults)) {
  for (const tr of report.testResults) {
    if (!tr.testFile || tr.count === undefined || tr.passed === undefined || tr.failed === undefined || tr.skipped === undefined || !tr.result) {
      console.error('FAIL: testResult missing required fields');
      testResultsOk = false;
      exitCode = 1;
      break;
    }
    if (tr.failed > 0) {
      console.error('FAIL: testResult has failures');
      testResultsOk = false;
      exitCode = 1;
    }
  }
}
if (testResultsOk) {
  console.log('PASS: All test results have valid structure');
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
    const isProperty = reportStr.includes('"' + pattern + '"') || reportStr.includes("'" + pattern + "'");
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

// Check boundary fields
const boundaryFields = ['frontendUiCreated', 'publicLaunchCreated', 'multiSchoolRolloutCreated',
  'backendFreezeCreated', 'productionDeploymentIntroduced', 'realNotificationsSent',
  'liveAiExpansionIntroduced', 'liveSchoolConnectorWriteExpansionIntroduced',
  'productionDataMutationExecuted', 'rawPrivateDataStored'];
let boundaryOk = true;
for (const field of boundaryFields) {
  if (report[field] !== false) {
    console.error('FAIL: Boundary field ' + field + ' is not false');
    boundaryOk = false;
    exitCode = 1;
  }
}
if (boundaryOk) {
  console.log('PASS: All boundary fields are false');
}

// Check gate fields
const gateFields = ['task035DependencyGatePassed', 'launchEnvironmentGatePassed', 'launchWindowPassed',
  'launchApprovalPassed', 'singleSchoolScopePassed', 'runtimeMonitoringReady',
  'healthIncidentPauseRollbackKillSwitchReady', 'privacyContentSocraticDeenBoundariesPassed',
  'safeLaunchReadModelPassed', 'noPublicNoMultiSchoolNoBackendFreezeBoundaryPassed', 'reportPassed'];
let gateOk = true;
for (const field of gateFields) {
  if (report[field] !== true) {
    console.error('FAIL: Gate field ' + field + ' is not true');
    gateOk = false;
    exitCode = 1;
  }
}
if (gateOk) {
  console.log('PASS: All gate fields are true');
}

// Check scanResults
if (report.scanResults) {
  const scanFields = ['privacyLeakScanPassed', 'jsonValidationPassed', 'staleTokensFound', 'forbiddenPatternsFound'];
  let scanOk = true;
  for (const field of scanFields) {
    if (field === 'privacyLeakScanPassed' && report.scanResults[field] !== true) {
      console.error('FAIL: scanResults.' + field + ' is not true');
      scanOk = false;
      exitCode = 1;
    }
    if (field === 'jsonValidationPassed' && report.scanResults[field] !== true) {
      console.error('FAIL: scanResults.' + field + ' is not true');
      scanOk = false;
      exitCode = 1;
    }
    if ((field === 'staleTokensFound' || field === 'forbiddenPatternsFound') && report.scanResults[field] !== false) {
      console.error('FAIL: scanResults.' + field + ' is not false');
      scanOk = false;
      exitCode = 1;
    }
  }
  if (scanOk) console.log('PASS: All scan result fields are correct');
}

console.log('\n=== Validation complete. Exit code: ' + exitCode + ' ===');
process.exit(exitCode);
