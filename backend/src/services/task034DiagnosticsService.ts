import type { Task034DiagnosticsResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { createTask034SafeTimestamp } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export async function runTask034Diagnostics(sessionId: string): Promise<Task034DiagnosticsResult> {
  const blockingIssues: string[] = [];
  const diagnosticDetails: Record<string, unknown> = {};

  const proof = await task034Repository.getTask033DependencyProof();
  const dependencyProofLoaded = proof?.ok === true;
  diagnosticDetails.dependencyProof = proof ? { ok: proof.ok } : { ok: false };

  const envGate = await task034Repository.getEnvironmentGate();
  const environmentGatePassed = envGate?.ok === true;
  diagnosticDetails.environmentGate = envGate ? { ok: envGate.ok } : null;

  const config = await task034Repository.getLimitedRolloutConfig();
  const configPassed = config?.ok === true;
  diagnosticDetails.config = config ? { ok: config.ok } : null;

  const capGate = await task034Repository.getRolloutCapGate();
  const capGatePassed = capGate?.ok === true;
  diagnosticDetails.capGate = capGate ? { ok: capGate.ok } : null;

  const cohort = await task034Repository.getExpandedCohortEligibility();
  const cohortEligibilityPassed = cohort?.ok === true;
  diagnosticDetails.cohortEligibility = cohort ? { ok: cohort.ok } : null;

  const staffReadiness = await task034Repository.getStaffReadiness();
  const staffReadinessPassed = staffReadiness?.ok === true;
  diagnosticDetails.staffReadiness = staffReadiness ? { ok: staffReadiness.ok } : null;

  const learnerNotice = await task034Repository.getLearnerNoticeReadiness();
  const learnerNoticeReadinessPassed = learnerNotice?.ok === true;
  diagnosticDetails.learnerNoticeReadiness = learnerNotice ? { ok: learnerNotice.ok } : null;

  const session = await task034Repository.getRolloutSession(sessionId);
  const stateMachineConsistent = session !== null && session.status !== 'blocked';
  diagnosticDetails.session = session ? { status: session.status, stage: session.rolloutStage } : null;

  const events = await task034Repository.listRolloutEventsForSession(sessionId);
  const eventIntakeWorking = events.length > 0 || session !== null;
  diagnosticDetails.events = { count: events.length };

  const runtimeGuard = await task034Repository.getExpandedRuntimeGuard();
  const runtimeGuardWorking = runtimeGuard?.ok === true;
  diagnosticDetails.runtimeGuard = runtimeGuard ? { ok: runtimeGuard.ok } : null;

  const healthBudget = await task034Repository.getHealthBudgetEscalation();
  const healthBudgetWorking = healthBudget?.ok === true;
  diagnosticDetails.healthBudget = healthBudget ? { ok: healthBudget.ok } : null;

  const incident = await task034Repository.getIncidentEscalationBridge();
  const incidentEscalationWorking = incident?.ok === true;
  diagnosticDetails.incidentEscalation = incident ? { ok: incident.ok } : null;

  const rollbackProtection = await task034Repository.getRollbackProtection();
  const rollbackProtectionWorking = rollbackProtection?.ok === true;
  diagnosticDetails.rollbackProtection = rollbackProtection ? { ok: rollbackProtection.ok } : null;

  const privacy = await task034Repository.getPrivacyReview();
  const privacyReviewWorking = privacy?.ok === true;
  diagnosticDetails.privacyReview = privacy ? { ok: privacy.ok } : null;

  const governance = await task034Repository.getContentGovernanceReview();
  const contentGovernanceReviewWorking = governance?.ok === true;
  diagnosticDetails.contentGovernanceReview = governance ? { ok: governance.ok } : null;

  const socratic = await task034Repository.getSocraticIntegrityReview();
  const socraticReviewWorking = socratic?.ok === true;
  diagnosticDetails.socraticReview = socratic ? { ok: socratic.ok } : null;

  const deen = await task034Repository.getDeenBoundaryReview();
  const deenReviewWorking = deen?.ok === true;
  diagnosticDetails.deenReview = deen ? { ok: deen.ok } : null;

  const schoolIdentity = await task034Repository.getSchoolIdentityReview();
  const schoolIdentityReviewWorking = schoolIdentity?.ok === true;
  diagnosticDetails.schoolIdentityReview = schoolIdentity ? { ok: schoolIdentity.ok } : null;

  const crossSchool = await task034Repository.getCrossSchoolDenialReview();
  const crossSchoolDenialReviewWorking = crossSchool?.ok === true;
  diagnosticDetails.crossSchoolDenialReview = crossSchool ? { ok: crossSchool.ok } : null;

  const safeReadModel = await task034Repository.getSafeRolloutReadModel(sessionId);
  const safeReadModelWorking = safeReadModel !== null;
  diagnosticDetails.safeReadModel = safeReadModel ? { status: safeReadModel.status } : null;

  const evidenceLedger = await task034Repository.getEvidenceLedger(sessionId);
  const evidenceLedgerWorking = evidenceLedger.totalCount > 0;
  diagnosticDetails.evidenceLedger = { count: evidenceLedger.totalCount };

  const report = await task034Repository.getLatestReport();
  const reportGenerationWorking = report !== null;
  diagnosticDetails.report = report ? { verdict: report.verdict } : null;

  if (!dependencyProofLoaded) blockingIssues.push('dependency_proof_not_loaded');
  if (!environmentGatePassed) blockingIssues.push('environment_gate_failed');
  if (!configPassed) blockingIssues.push('config_failed');
  if (!capGatePassed) blockingIssues.push('cap_gate_failed');
  if (!cohortEligibilityPassed) blockingIssues.push('cohort_eligibility_failed');
  if (!staffReadinessPassed) blockingIssues.push('staff_readiness_failed');
  if (!learnerNoticeReadinessPassed) blockingIssues.push('learner_notice_readiness_failed');
  if (!stateMachineConsistent) blockingIssues.push('state_machine_inconsistent');
  if (!eventIntakeWorking) blockingIssues.push('event_intake_not_working');

  const result: Task034DiagnosticsResult = {
    ok: blockingIssues.length === 0,
    sessionId,
    dependencyProofLoaded,
    environmentGatePassed,
    configPassed,
    capGatePassed,
    cohortEligibilityPassed,
    staffReadinessPassed,
    learnerNoticeReadinessPassed,
    stateMachineConsistent,
    eventIntakeWorking,
    runtimeGuardWorking,
    healthBudgetWorking,
    incidentEscalationWorking,
    rollbackProtectionWorking,
    privacyReviewWorking,
    contentGovernanceReviewWorking,
    socraticReviewWorking,
    deenReviewWorking,
    schoolIdentityReviewWorking,
    crossSchoolDenialReviewWorking,
    safeReadModelWorking,
    evidenceLedgerWorking,
    reportGenerationWorking,
    blockingIssues,
    diagnosticDetails,
  };

  await task034Repository.saveDiagnostics(result);
  return result;
}
