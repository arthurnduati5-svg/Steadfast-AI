import fs from 'fs';
import path from 'path';
import type { Task032Task031DependencyProof } from '../contracts/task032ControlledCanaryActivationContracts';

export async function loadTask031ProofForTask032(): Promise<Task032Task031DependencyProof> {
  const proof: Task032Task031DependencyProof = {
    ok: false,
    commitFound: false,
    task031ReportFound: false,
    task031OpsReportFound: false,
    verdict: '',
    safeToStartTask032: false,
    safeToStartTask033: false,
    safeToStartTask034: false,
    safeToStartTask035: false,
    safeToStartTask040: false,
    task031FocusedTestsPassed: false,
    task020To030RegressionPassed: false,
    phase3RegressionPassed: false,
    fullBackendSuitePassed: false,
    backendBuildPassed: false,
    backendTypecheckPassed: false,
    prismaValidatePassed: false,
    prismaGeneratePassed: false,
    task031VerificationScriptPassed: false,
    privacyScanPassed: false,
    noProductionMutationScanPassed: false,
    noLiveConnectorAiScanPassed: false,
    noLiveNotificationScanPassed: false,
    noFrontendUiScanPassed: false,
    noTask032ToTask040ScanPassed: false,
    noFalsePassScanPassed: false,
    remainingBlockers: [],
    blockingIssues: []
  };

  try {
    const { execSync } = require('child_process');
    const result = execSync('git log --oneline --all | findstr "bfcf5af"', { encoding: 'utf8', cwd: process.cwd() });
    proof.commitFound = result.includes('bfcf5af');
  } catch {
    proof.blockingIssues.push('commit_bfcf5af_not_found');
  }

  if (!proof.commitFound) {
    proof.blockingIssues.push('commit_bfcf5af_not_found');
  }

  const reportPath = path.resolve(process.cwd(), 'reports/task-031-staging-smoke-canary-readiness-v1.json');
  const opsReportPath = path.resolve(process.cwd(), 'docs/ops/task-031/task-031-staging-smoke-canary-readiness-report.json');

  if (fs.existsSync(reportPath)) {
    proof.task031ReportFound = true;
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      if (report.verdict === 'ACCEPTED_READY_YES') proof.verdict = report.verdict;
      else proof.blockingIssues.push(`wrong_verdict: ${report.verdict}`);
      if (report.safeToStartTask032 === true) proof.safeToStartTask032 = true;
      else proof.blockingIssues.push('safeToStartTask032_not_true');
      if (report.safeToStartTask033 === false) proof.safeToStartTask033 = false;
      else proof.blockingIssues.push('safeToStartTask033_not_false');
      if (report.safeToStartTask034 === false) proof.safeToStartTask034 = false;
      else proof.blockingIssues.push('safeToStartTask034_not_false');
      if (report.safeToStartTask035 === false) proof.safeToStartTask035 = false;
      else proof.blockingIssues.push('safeToStartTask035_not_false');
      if (report.safeToStartTask040 === false) proof.safeToStartTask040 = false;
      else proof.blockingIssues.push('safeToStartTask040_not_false');
      proof.remainingBlockers = report.remainingBlockers || [];
    } catch {
      proof.blockingIssues.push('cannot_parse_task031_report');
    }
  } else {
    proof.blockingIssues.push('task031_report_not_found');
  }

  if (fs.existsSync(opsReportPath)) {
    proof.task031OpsReportFound = true;
    try {
      const opsReport = JSON.parse(fs.readFileSync(opsReportPath, 'utf8'));
      if (opsReport.task031FocusedTestsPassed === true) proof.task031FocusedTestsPassed = true;
      else proof.blockingIssues.push('task031_focused_tests_not_passed');
      if (opsReport.task020To030RegressionPassed === true) proof.task020To030RegressionPassed = true;
      else proof.blockingIssues.push('task020_to_030_regression_not_passed');
      if (opsReport.phase3RegressionPassed === true) proof.phase3RegressionPassed = true;
      else proof.blockingIssues.push('phase3_regression_not_passed');
      if (opsReport.fullBackendSuitePassed === true) proof.fullBackendSuitePassed = true;
      else proof.blockingIssues.push('full_backend_suite_not_passed');
      if (opsReport.backendBuildPassed === true) proof.backendBuildPassed = true;
      else proof.blockingIssues.push('backend_build_not_passed');
      if (opsReport.backendTypecheckPassed === true) proof.backendTypecheckPassed = true;
      else proof.blockingIssues.push('backend_typecheck_not_passed');
      if (opsReport.prismaValidatePassed === true) proof.prismaValidatePassed = true;
      else proof.blockingIssues.push('prisma_validate_not_passed');
      if (opsReport.prismaGeneratePassed === true) proof.prismaGeneratePassed = true;
      else proof.blockingIssues.push('prisma_generate_not_passed');
      if (opsReport.task031VerificationScriptPassed === true) proof.task031VerificationScriptPassed = true;
      else proof.blockingIssues.push('verification_script_not_passed');
      if (opsReport.privacyScanPassed === true) proof.privacyScanPassed = true;
      else proof.blockingIssues.push('privacy_scan_not_passed');
      if (opsReport.noProductionMutationScanPassed === true) proof.noProductionMutationScanPassed = true;
      else proof.blockingIssues.push('no_production_mutation_scan_not_passed');
      if (opsReport.noLiveConnectorAiScanPassed === true) proof.noLiveConnectorAiScanPassed = true;
      else proof.blockingIssues.push('no_live_connector_ai_scan_not_passed');
      if (opsReport.noLiveNotificationScanPassed === true) proof.noLiveNotificationScanPassed = true;
      else proof.blockingIssues.push('no_live_notification_scan_not_passed');
      if (opsReport.noFrontendUiScanPassed === true) proof.noFrontendUiScanPassed = true;
      else proof.blockingIssues.push('no_frontend_ui_scan_not_passed');
      if (opsReport.noTask032ToTask040ScanPassed === true) proof.noTask032ToTask040ScanPassed = true;
      else proof.blockingIssues.push('no_task032_to_task040_scan_not_passed');
      if (opsReport.noFalsePassScanPassed === true) proof.noFalsePassScanPassed = true;
      else proof.blockingIssues.push('no_false_pass_scan_not_passed');
    } catch {
      proof.blockingIssues.push('cannot_parse_task031_ops_report');
    }
  } else {
    proof.blockingIssues.push('task031_ops_report_not_found');
  }

  proof.ok = proof.commitFound && proof.task031ReportFound && proof.task031OpsReportFound &&
    proof.verdict === 'ACCEPTED_READY_YES' && proof.safeToStartTask032 === true &&
    proof.safeToStartTask033 === false && proof.safeToStartTask034 === false &&
    proof.safeToStartTask035 === false && proof.safeToStartTask040 === false &&
    proof.task031FocusedTestsPassed && proof.task020To030RegressionPassed &&
    proof.phase3RegressionPassed && proof.fullBackendSuitePassed &&
    proof.backendBuildPassed && proof.backendTypecheckPassed &&
    proof.prismaValidatePassed && proof.prismaGeneratePassed &&
    proof.task031VerificationScriptPassed && proof.privacyScanPassed &&
    proof.noProductionMutationScanPassed && proof.noLiveConnectorAiScanPassed &&
    proof.noLiveNotificationScanPassed && proof.noFrontendUiScanPassed &&
    proof.noTask032ToTask040ScanPassed && proof.noFalsePassScanPassed &&
    proof.remainingBlockers.length === 0;

  return proof;
}

export async function verifyTask031DependencyForTask032(): Promise<Task032Task031DependencyProof> {
  return loadTask031ProofForTask032();
}
