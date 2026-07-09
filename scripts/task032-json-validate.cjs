const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPaths = [
  path.join(rootDir, 'reports', 'task-032-controlled-canary-activation-v1.json'),
  path.join(rootDir, 'docs', 'ops', 'task-032', 'task-032-controlled-canary-activation-v1.json'),
];

let exitCode = 0;
let anyReportFound = false;

for (const reportPath of reportPaths) {
  if (!fs.existsSync(reportPath)) {
    console.log(`[SKIP] ${reportPath} - not found`);
    continue;
  }

  anyReportFound = true;

  try {
    const raw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);
    const errors = [];

    // taskId
    if (report.taskId !== '032') {
      errors.push(`taskId mismatch: expected 032, got ${report.taskId}`);
    }

    // safeToStartTask033
    if (typeof report.safeToStartTask033 !== 'boolean') {
      errors.push(`safeToStartTask033 must be boolean, got ${typeof report.safeToStartTask033}`);
    }

    // finalDecision consistency
    const validDecisions = ['TASK_032_PASS_SAFE_TO_START_TASK_033', 'TASK_032_FAIL_NOT_SAFE_TO_START_TASK_033'];
    if (!validDecisions.includes(report.verdict)) {
      errors.push(`Invalid verdict: ${report.verdict}`);
    }
    if (report.safeToStartTask033 === true && report.verdict !== 'TASK_032_PASS_SAFE_TO_START_TASK_033') {
      errors.push('safeToStartTask033 true but verdict not PASS');
    }
    if (report.safeToStartTask033 === false && report.verdict !== 'TASK_032_FAIL_NOT_SAFE_TO_START_TASK_033') {
      errors.push('safeToStartTask033 false but verdict not FAIL');
    }

    // blockingIssues
    if (!Array.isArray(report.blockingIssues)) {
      errors.push('blockingIssues must be an array');
    } else if (report.safeToStartTask033 === true && report.blockingIssues.length > 0) {
      errors.push('safeToStartTask033 true but blockingIssues not empty');
    }

    // knownLimitations
    if (!Array.isArray(report.knownLimitations)) {
      errors.push('knownLimitations must be an array');
    }

    // Required sections
    const requiredSections = [
      'task031Dependency', 'canaryEnvironmentGate', 'approvedSchoolCanaryConfig',
      'consentAuthorizationMatrix', 'cohortEligibility', 'liveStudentPrivacyBoundary',
      'activationStateMachine', 'runtimeGuard', 'controlActions', 'healthBudget',
      'incidentBridge', 'safeViews', 'privacyLeakChecks', 'securityGateChecks',
      'deenGateChecks', 'socraticGateChecks', 'curriculumGateChecks',
    ];

    for (const section of requiredSections) {
      if (!report[section] || typeof report[section] !== 'object') {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Privacy fields must be false
    const privacyFalseFields = ['rawStudentChatExposed', 'privateLearnerMemoryExposed', 'tokensSecretsExposed', 'databaseUrlsExposed'];
    if (report.privacyLeakChecks) {
      for (const f of privacyFalseFields) {
        if (report.privacyLeakChecks[f] !== false) {
          errors.push(`privacyLeakChecks.${f} must be false`);
        }
      }
    }

    // Gate weakened fields must be false
    const gateChecks = [
      ['securityGateChecks', ['schoolAuthGateWeakened', 'teacherAdminOversightGateWeakened', 'canaryGateWeakened']],
      ['deenGateChecks', ['fatwaEngineIntroduced', 'deenGovernanceGateWeakened']],
      ['socraticGateChecks', ['socraticGateWeakened', 'noFinalAnswerPolicyWeakened']],
      ['curriculumGateChecks', ['curriculumSourceGateWeakened', 'contentGovernanceGateWeakened']],
    ];
    for (const [section, fields] of gateChecks) {
      if (report[section]) {
        for (const f of fields) {
          if (report[section][f] !== false) {
            errors.push(`${section}.${f} must be false`);
          }
        }
      }
    }

    // Stale template tokens
    const reportStr = JSON.stringify(report);
    const stalePatterns = [/\$\{report\./, /\$\{/, /"undefined"/, /\[object Object\]/, /NaN/];
    for (const p of stalePatterns) {
      if (p.test(reportStr)) {
        errors.push(`Stale template token: ${p}`);
      }
    }

    // Forbidden private data
    const forbidden = [
      'raw student chat', 'private learner memory', 'teacher-only notes',
      'safeguarding raw details', 'deen-sensitive private text',
      'ai prompt', 'provider response', 'answer key',
      'bearer ', 'authorization header',
      'postgres://', 'postgresql://', 'mysql://',
    ];
    const lowerStr = reportStr.toLowerCase();
    for (const p of forbidden) {
      if (lowerStr.includes(p)) {
        const idx = lowerStr.indexOf(p);
        const ctx = lowerStr.substring(Math.max(0, idx - 60), idx + p.length + 60);
        const safe = ctx.includes('do not expose') || ctx.includes('not exposed') || ctx.includes(': false') || ctx.includes('exposed? no');
        if (!safe) {
          errors.push(`Forbidden pattern '${p}' found in report`);
        }
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
