import type { Task033ObservationEvidenceResult } from '../contracts/task033CanaryObservationContracts';

interface EvidenceInput {
  sessionCount?: number;
  successfulGatedSessionCount?: number;
  safeDenialCount?: number;
  schoolAuthDenialCount?: number;
  cohortDenialCount?: number;
  curriculumGateDenialCount?: number;
  sourceGateDenialCount?: number;
  socraticPolicyBlockCount?: number;
  deenReferralCount?: number;
  privacyBlockCount?: number;
  aiBeforeGateBlockCount?: number;
  memoryBeforeGateBlockCount?: number;
  pauseStateCount?: number;
  killSwitchStateCount?: number;
  rollbackStateCount?: number;
  aggregateLatencyMs?: number;
  aggregateErrorCount?: number;
  safeEventSummaries?: string[];
  observationRunId?: string;
}

const FORBIDDEN_EVIDENCE_PATTERNS = [
  /raw prompt/i,
  /raw AI response/i,
  /raw student chat/i,
  /private learner memory/i,
  /student name/i,
  /student email/i,
  /student phone/i,
  /full roster/i,
  /teacher-only note/i,
  /safeguarding raw detail/i,
  /Deen-sensitive private text/i,
  /answer key/i,
  /protected rubric/i,
];

export function collectTask033ObservationEvidence(input: EvidenceInput): Task033ObservationEvidenceResult {
  const blockingIssues: string[] = [];

  const rawText = JSON.stringify(input).toLowerCase();
  for (const pattern of FORBIDDEN_EVIDENCE_PATTERNS) {
    if (pattern.test(rawText)) {
      blockingIssues.push(`forbidden_evidence_pattern_detected: ${pattern}`);
    }
  }

  const safeEventSummaries = (input.safeEventSummaries || []).filter(s => {
    const sLow = s.toLowerCase();
    for (const pattern of FORBIDDEN_EVIDENCE_PATTERNS) {
      if (pattern.test(sLow)) return false;
    }
    return true;
  });

  return {
    ok: blockingIssues.length === 0,
    observationRunId: input.observationRunId || 'observation_run_task033_safe',
    evidenceCaptured: true,
    aggregateOnly: true,
    rawPrivateDataCaptured: blockingIssues.length > 0,
    safeEvidenceItemCount: safeEventSummaries.length,
    sessionCount: input.sessionCount || 0,
    successfulGatedSessionCount: input.successfulGatedSessionCount || 0,
    safeDenialCount: input.safeDenialCount || 0,
    schoolAuthDenialCount: input.schoolAuthDenialCount || 0,
    cohortDenialCount: input.cohortDenialCount || 0,
    curriculumGateDenialCount: input.curriculumGateDenialCount || 0,
    sourceGateDenialCount: input.sourceGateDenialCount || 0,
    socraticPolicyBlockCount: input.socraticPolicyBlockCount || 0,
    deenReferralCount: input.deenReferralCount || 0,
    privacyBlockCount: input.privacyBlockCount || 0,
    aiBeforeGateBlockCount: input.aiBeforeGateBlockCount || 0,
    memoryBeforeGateBlockCount: input.memoryBeforeGateBlockCount || 0,
    pauseStateCount: input.pauseStateCount || 0,
    killSwitchStateCount: input.killSwitchStateCount || 0,
    rollbackStateCount: input.rollbackStateCount || 0,
    aggregateLatencyMs: input.aggregateLatencyMs || 0,
    aggregateErrorCount: input.aggregateErrorCount || 0,
    safeEventSummaries,
    blockingIssues,
  };
}
