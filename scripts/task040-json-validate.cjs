const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, '..', 'reports', 'task-040-final-backend-logic-freeze-v1.json');

const requiredFields = [
  'taskId', 'taskName', 'scope', 'task036DependencyVerified',
  'backendFreezeCreated', 'backendFrozenThroughTask036',
  'safeToStartFrontendIntegrationOrNextPhase', 'safeToModifyBackendWithoutChangeControl',
  'newProductBehaviorCreated', 'frontendUiCreated',
  'acceptedTaskLedgerCreated', 'acceptedTaskLedgerTaskCount',
  'acceptedTaskIds', 'noDriftCheckPassed',
  'fullBackendSuitePassed', 'backendTypecheckPassed', 'backendBuildPassed',
  'prismaValidatePassed', 'prismaGeneratePassed',
  'task040FocusedTestsPassed', 'task040FocusedTestFiles', 'task040FocusedAssertions',
  'changeControlPolicyCreated', 'freezeManifestCreated', 'freezeDecisionPassed',
  'finalDecision', 'verdict', 'generatedAt',
];

const forbiddenPhrases = [
  'PENDING_VERIFICATION', 'COMMIT_PENDING',
  'mostly passed', 'core passed', 'known limitation',
  'accepted with failures',
];

let exitCode = 0;

try {
  if (!fs.existsSync(reportPath)) {
    console.error(`ERROR: Report not found at ${reportPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  let report;
  try {
    report = JSON.parse(content);
  } catch (e) {
    console.error(`ERROR: Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  for (const field of requiredFields) {
    if (!(field in report)) {
      console.error(`ERROR: Missing required field: ${field}`);
      exitCode = 1;
    }
  }

  for (const boolField of ['task036DependencyVerified', 'backendFreezeCreated', 'backendFrozenThroughTask036',
    'safeToStartFrontendIntegrationOrNextPhase', 'safeToModifyBackendWithoutChangeControl',
    'newProductBehaviorCreated', 'frontendUiCreated', 'acceptedTaskLedgerCreated',
    'noDriftCheckPassed', 'fullBackendSuitePassed', 'changeControlPolicyCreated',
    'freezeManifestCreated', 'freezeDecisionPassed']) {
    if (typeof report[boolField] !== 'boolean') {
      console.error(`ERROR: Field '${boolField}' should be boolean, got ${typeof report[boolField]}`);
      exitCode = 1;
    }
  }

  for (const phrase of forbiddenPhrases) {
    if (report.verdict && report.verdict.includes(phrase)) {
      console.error(`ERROR: Verdict contains forbidden phrase: "${phrase}"`);
      exitCode = 1;
    }
    if (report.finalDecision && report.finalDecision.includes(phrase)) {
      console.error(`ERROR: finalDecision contains forbidden phrase: "${phrase}"`);
      exitCode = 1;
    }
  }

  if (report.backendFreezeCreated && report.finalDecision !== 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED') {
    console.error(`ERROR: backendFreezeCreated=true but finalDecision is '${report.finalDecision}'`);
    exitCode = 1;
  }

  if (exitCode === 0) {
    console.log('JSON report validation: PASS');
  } else {
    console.error('JSON report validation: FAIL');
  }
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  exitCode = 1;
}

process.exit(exitCode);
