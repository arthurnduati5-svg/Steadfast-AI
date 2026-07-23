import * as fs from 'fs';
import * as path from 'path';
import { Task035Task034ProofStatus } from '../contracts/task035SchoolWideReadinessContracts';

const rootDir = path.resolve(__dirname, '..', '..', '..');

export function loadTask034Proof(): Task035Task034ProofStatus {
  const reportPath = path.join(rootDir, 'docs/ops/task-034/task-034-controlled-rollout-report.json');
  const handoffPath = path.join(rootDir, 'docs/ops/task-034/TASK_034_HANDOFF.md');
  const verSummaryPath = path.join(rootDir, 'logs/task-034/task-034-verification-summary.json');
  const rolloutResultPath = path.join(rootDir, 'logs/task-034/controlled-rollout-result.json');
  const standaloneLogPath = path.join(rootDir, 'logs/task-034/verify-task034-standalone.log');

  const status: Task035Task034ProofStatus = {
    ok: false,
    reportFound: false,
    taskId: '',
    safeToStartTask035: false,
    finalDecision: '',
    blockingIssuesEmpty: false,
    verificationExitCodeZero: false,
    controlledRolloutScenarioRun: false,
    controlledRolloutSafeToStartTask035: false,
    controlledRolloutRolloutPercent: 0,
    controlledRolloutOpenRolloutPerformed: false,
    controlledRolloutSchoolWideRolloutPerformed: false,
    controlledRolloutHundredPercentRolloutPerformed: false,
    handoffConsistent: false,
    handoffAgreesWithReport: false,
    standaloneLogExists: false,
    standaloneLogExitZero: false,
    privacyScanPassed: false,
    jsonValidationPassed: false,
    testsPassed: false,
    noStalePlaceholders: false,
    safeToRunTask035: false,
    safeToStartTask036: false,
    blockingIssues: [],
  };

  if (!fs.existsSync(reportPath)) {
    status.blockingIssues.push('task034_report_not_found');
    return status;
  }
  status.reportFound = true;

  try {
    const reportRaw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(reportRaw);

    status.taskId = report.taskId || '';
    status.safeToStartTask035 = report.safeToStartTask035 === true;
    status.finalDecision = report.finalDecision || '';
    status.blockingIssuesEmpty = Array.isArray(report.blockingIssues) && report.blockingIssues.length === 0;

    if (report.taskId !== '034') {
      status.blockingIssues.push('task034_report_wrong_task_id');
    }
    if (report.safeToStartTask035 !== true) {
      status.blockingIssues.push('task034_safeToStartTask035_not_true');
    }
    if (report.finalDecision !== 'TASK_034_PASS_SAFE_TO_START_TASK_035') {
      status.blockingIssues.push('task034_finalDecision_not_pass');
    }
    if (!status.blockingIssuesEmpty) {
      status.blockingIssues.push('task034_blockingIssues_not_empty');
    }

    if (fs.existsSync(verSummaryPath)) {
      try {
        const verRaw = fs.readFileSync(verSummaryPath, 'utf8').replace(/^\uFEFF/, '');
        const verSummary = JSON.parse(verRaw);
        status.verificationExitCodeZero = verSummary.OverallExitCode === 0;
        if (!status.verificationExitCodeZero) {
          status.blockingIssues.push('task034_verification_exit_code_nonzero');
        }
      } catch {
        status.blockingIssues.push('task034_verification_summary_unreadable');
      }
    } else {
      status.blockingIssues.push('task034_verification_summary_not_found');
    }

    if (fs.existsSync(rolloutResultPath)) {
      try {
        const rolloutRaw = fs.readFileSync(rolloutResultPath, 'utf8').replace(/^\uFEFF/, '');
        const rolloutResult = JSON.parse(rolloutRaw);
        status.controlledRolloutScenarioRun = rolloutResult.scenarioRun === true;
        status.controlledRolloutSafeToStartTask035 = rolloutResult.safeToStartTask035 === true;
        status.controlledRolloutRolloutPercent = rolloutResult.rolloutPercent || 0;
        status.controlledRolloutOpenRolloutPerformed = rolloutResult.openRolloutPerformed === true;
        status.controlledRolloutSchoolWideRolloutPerformed = rolloutResult.schoolWideRolloutPerformed === true;
        status.controlledRolloutHundredPercentRolloutPerformed = rolloutResult.hundredPercentRolloutPerformed === true;

        if (!status.controlledRolloutScenarioRun) {
          status.blockingIssues.push('task034_controlled_rollout_scenario_not_run');
        }
        if (!status.controlledRolloutSafeToStartTask035) {
          status.blockingIssues.push('task034_controlled_rollout_not_safe');
        }
        if (status.controlledRolloutRolloutPercent > 25) {
          status.blockingIssues.push('task034_rollout_percent_exceeds_25');
        }
        if (status.controlledRolloutOpenRolloutPerformed) {
          status.blockingIssues.push('task034_open_rollout_performed');
        }
        if (status.controlledRolloutSchoolWideRolloutPerformed) {
          status.blockingIssues.push('task034_school_wide_rollout_performed');
        }
        if (status.controlledRolloutHundredPercentRolloutPerformed) {
          status.blockingIssues.push('task034_hundred_percent_rollout_performed');
        }
      } catch {
        status.blockingIssues.push('task034_rollout_result_unreadable');
      }
    } else {
      status.blockingIssues.push('task034_rollout_result_not_found');
    }

    status.standaloneLogExists = fs.existsSync(standaloneLogPath);

    if (fs.existsSync(handoffPath)) {
      try {
        const handoffContent = fs.readFileSync(handoffPath, 'utf8');
        status.handoffConsistent = handoffContent.includes('TASK_034_PASS_SAFE_TO_START_TASK_035');
        status.handoffAgreesWithReport = status.handoffConsistent;
        if (!status.handoffConsistent) {
          status.blockingIssues.push('task034_handoff_inconsistent');
        }
      } catch {
        status.blockingIssues.push('task034_handoff_unreadable');
      }
    } else {
      status.blockingIssues.push('task034_handoff_not_found');
    }

    const reportStr = JSON.stringify(report);
    const stalePatterns = [/undefined/gi, /pending/gi, /\[object Object\]/gi, /\$\{report\./, /\$\{verificationCommands\./, /\$\{testResults\./];
    status.noStalePlaceholders = !stalePatterns.some(p => p.test(reportStr));
    if (!status.noStalePlaceholders) {
      status.blockingIssues.push('task034_report_contains_stale_placeholders');
    }

    const allChecks: boolean[] = [
      report.taskId === '034',
      report.safeToStartTask035 === true,
      report.finalDecision === 'TASK_034_PASS_SAFE_TO_START_TASK_035',
      status.blockingIssuesEmpty,
      status.verificationExitCodeZero,
      status.controlledRolloutScenarioRun,
      status.controlledRolloutSafeToStartTask035,
      status.controlledRolloutRolloutPercent <= 25,
      !status.controlledRolloutOpenRolloutPerformed,
      !status.controlledRolloutSchoolWideRolloutPerformed,
      !status.controlledRolloutHundredPercentRolloutPerformed,
      status.handoffConsistent,
      status.noStalePlaceholders,
    ];

    status.ok = allChecks.every(Boolean);
    status.safeToRunTask035 = status.ok;
    status.safeToStartTask036 = false;

    if (status.ok) {
      console.log('[Task035 ProofLoader] Task 034 proof validated successfully');
    } else {
      console.log('[Task035 ProofLoader] Task 034 proof validation failed');
    }
  } catch (e: any) {
    status.blockingIssues.push('task034_report_unreadable: ' + (e.message || ''));
  }

  return status;
}
