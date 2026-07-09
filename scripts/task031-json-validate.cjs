const fs = require('fs');
const path = require('path');

const reportDir = path.resolve(__dirname, '..', 'docs', 'ops', 'task-031');
const reportPath = path.join(reportDir, 'task-031-authenticated-staging-smoke-report.json');

function loadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const report = loadJson(reportPath);
const errors = [];

if (!report) {
  errors.push('Report file not found or invalid JSON');
}

if (report) {
  if (report.taskId !== '031') errors.push('taskId must be 031, got: ' + report.taskId);

  if (typeof report.safeToStartTask032 !== 'boolean') errors.push('safeToStartTask032 must be boolean');

  const validDecisions = ['TASK_031_PASS_SAFE_TO_START_TASK_032', 'TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032'];
  if (!validDecisions.includes(report.finalDecision)) {
    errors.push('finalDecision must be one of: ' + validDecisions.join(', '));
  }

  if (!Array.isArray(report.blockingIssues)) errors.push('blockingIssues must be array');
  if (!Array.isArray(report.knownLimitations)) errors.push('knownLimitations must be array');
  if (!Array.isArray(report.verificationCommands)) errors.push('verificationCommands must be array');
  if (!Array.isArray(report.testResults)) errors.push('testResults must be array');

  const requiredSections = [
    'task030Proof', 'stagingEnvironmentGate', 'noLiveStudentGuard',
    'stagingSchoolIdentityFixture', 'roleMatrix', 'embedHandoffSmoke',
    'copilotBootstrapSmoke', 'studentPreflightSmoke', 'teacherOversightSmoke',
    'adminOperatorMonitoringSmoke', 'observabilityBaseline', 'latencyErrorBudget',
    'canaryReadinessDecision', 'privacyLeakChecks', 'securityGateChecks',
    'deenGateChecks', 'socraticGateChecks', 'curriculumGateChecks',
  ];

  for (const section of requiredSections) {
    if (!report[section] || typeof report[section] !== 'object') {
      errors.push('Missing required section: ' + section);
    }
  }

  for (const cmd of (report.verificationCommands || [])) {
    if (!cmd.command) errors.push('verification command missing command field');
    if (!cmd.logPath) errors.push('verification command missing logPath field');
    if (typeof cmd.exitCode !== 'number') errors.push('verification command missing or invalid exitCode');
    if (!cmd.result) errors.push('verification command missing result field');
  }

  if (report.safeToStartTask032 === true && report.finalDecision !== 'TASK_031_PASS_SAFE_TO_START_TASK_032') {
    errors.push('safeToStartTask032 true but finalDecision is not TASK_031_PASS_SAFE_TO_START_TASK_032');
  }

  if (report.safeToStartTask032 === true && report.blockingIssues.length > 0) {
    errors.push('safeToStartTask032 true but blockingIssues not empty');
  }

  if (report.safeToStartTask032 === false && report.finalDecision !== 'TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032') {
    errors.push('safeToStartTask032 false but finalDecision is not TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032');
  }

  const forbiddenPrivateData = [
    'raw student chat', 'private learner memory', 'teacher-only notes',
    'safeguarding raw details', 'Deen-sensitive private text',
    'Bearer ', 'sk-proj-', 'sk-ant-',
    'authorization header', 'raw exception object', 'unredacted stack trace',
    'postgres://', 'postgresql://', 'mysql://',
  ];
  const reportStr = JSON.stringify(report).toLowerCase();
  for (const pattern of forbiddenPrivateData) {
    if (reportStr.includes(pattern.toLowerCase())) {
      const isSafeNegative = reportStr.includes('not exposed') || reportStr.includes('do not expose');
      if (!isSafeNegative) {
        errors.push('Report may contain forbidden private data pattern: ' + pattern);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('JSON Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('JSON Report Validation: PASS');
  console.log('  taskId:', report.taskId);
  console.log('  safeToStartTask032:', report.safeToStartTask032);
  console.log('  finalDecision:', report.finalDecision);
  console.log('  blockingIssues:', report.blockingIssues.length);
  console.log('  verificationCommands:', report.verificationCommands.length);
  console.log('  All required sections present');
  process.exit(0);
}
