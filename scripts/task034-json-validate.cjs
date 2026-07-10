const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPaths = [
  path.join(rootDir, 'reports', 'task-034-controlled-limited-rollout-v1.json'),
  path.join(rootDir, 'docs', 'ops', 'task-034', 'task-034-controlled-limited-rollout-report.json'),
];

let exitCode = 0;
let anyReportFound = false;

for (const reportPath of reportPaths) {
  if (!fs.existsSync(reportPath)) {
    console.log(`[SKIP] ${path.basename(reportPath)} - not found`);
    continue;
  }

  anyReportFound = true;

  try {
    const raw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);
    const errors = [];

    // taskId
    if (report.taskId !== '034') {
      errors.push(`taskId mismatch: expected 034, got ${report.taskId}`);
    }

    // verdict
    const validVerdicts = ['ACCEPTED_READY_YES'];
    if (!validVerdicts.includes(report.verdict)) {
      errors.push(`Invalid verdict: ${report.verdict}. Must be ACCEPTED_READY_YES`);
    }

    // safeToStartTask035
    if (typeof report.safeToStartTask035 !== 'boolean') {
      errors.push(`safeToStartTask035 must be boolean, got ${typeof report.safeToStartTask035}`);
    }
    if (report.safeToStartTask035 !== true && report.verdict === 'ACCEPTED_READY_YES') {
      errors.push('safeToStartTask035 must be true when verdict ACCEPTED_READY_YES');
    }

    // safeToStartTask040 must be false
    if (report.safeToStartTask040 !== false) {
      errors.push(`safeToStartTask040 must be false, got ${report.safeToStartTask040}`);
    }

    // All boolean gates must be present
    const requiredBooleanGates = [
      'task033DependencyGatePassed', 'rolloutEnvironmentGatePassed',
      'limitedRolloutConfigLoaded', 'rolloutCapGatePassed',
      'expandedCohortEligibilityPassed', 'staffReadinessGatePassed',
      'learnerNoticeReadinessPassed', 'controlledRolloutStateMachinePassed',
      'expandedRuntimeGuardPassed', 'healthIncidentRollbackPassed',
      'privacyContentSocraticDeenPassed', 'safeRolloutReadModelPassed',
      'noSchoolWideNoFreezeBoundaryPassed', 'reportPassed',
    ];
    for (const gate of requiredBooleanGates) {
      if (typeof report[gate] !== 'boolean') {
        errors.push(`Missing or non-boolean gate: ${gate}`);
      }
    }

    // All no-* fields must be false
    const noFalseFields = [
      'task035Started', 'task040Started',
      'frontendUiCreated', 'schoolWideLaunchCreated',
      'hundredPercentRolloutCreated', 'backendFreezeCreated',
      'productionDeploymentIntroduced',
      'realNotificationsSent', 'liveAiCallIntroduced',
      'liveSchoolConnectorWriteIntroduced', 'productionDataMutationExecuted',
      'rawPrivateDataStored',
    ];
    for (const f of noFalseFields) {
      if (report[f] !== false) {
        errors.push(`${f} must be false, got ${report[f]}`);
      }
    }

    // Task 034-specific fields
    const requiredTrueFields = [
      'task033Started', 'task034Started', 'controlledLimitedRolloutCreated',
      'contractsCreatedOrUpdated', 'validationCreatedOrUpdated',
      'repositoryCreatedOrUpdated', 'servicesCreatedOrUpdated',
      'routesCreatedOrUpdated', 'routesMountedOrDirectlyTested',
    ];
    for (const f of requiredTrueFields) {
      if (report[f] !== true) {
        errors.push(`${f} must be true, got ${report[f]}`);
      }
    }

    // Task 033 dependency
    if (typeof report.task033DependencyVerified !== 'boolean') {
      errors.push('task033DependencyVerified must be boolean');
    }

    // remainingBlockers
    if (!Array.isArray(report.remainingBlockers)) {
      errors.push('remainingBlockers must be an array');
    }
    if (report.safeToStartTask035 === true && report.remainingBlockers.length > 0) {
      errors.push('safeToStartTask035 true but remainingBlockers not empty');
    }

    // generatedAt
    if (!report.generatedAt || isNaN(Date.parse(report.generatedAt))) {
      errors.push('generatedAt must be a valid ISO date string');
    }

    // Stale template tokens
    const reportStr = JSON.stringify(report);
    const stalePatterns = [/\$\{/, /"undefined"/, /\[object Object\]/, /NaN/];
    for (const p of stalePatterns) {
      if (p.test(reportStr)) {
        errors.push(`Stale template token: ${p}`);
      }
    }

    if (errors.length > 0) {
      console.log(`JSON Validation FAILED (${path.basename(reportPath)}):`);
      for (const e of errors) console.log(`  - ${e}`);
      exitCode = 1;
    } else {
      console.log(`JSON Validation PASSED (${path.basename(reportPath)})`);
    }
  } catch (e) {
    console.error(`JSON Validation FAILED (${path.basename(reportPath)}): ${e.message}`);
    exitCode = 1;
  }
}

if (!anyReportFound) {
  console.error('JSON Validation FAILED: no report files found');
  exitCode = 1;
}

process.exit(exitCode);
