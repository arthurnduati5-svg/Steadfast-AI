import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { PilotFeedbackInput } from '../contracts/task026PilotExecutionContracts';
import { PILOT_FEEDBACK_TYPES, PRIVATE_CONTENT_PATTERNS } from '../contracts/task026PilotExecutionContracts';

function containsPrivateContent(text: string): boolean {
  const lower = text.toLowerCase();
  for (const pattern of PRIVATE_CONTENT_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) return true;
  }
  return false;
}

function redactUnsafeContent(text: string): string {
  let safe = text;
  for (const pattern of PRIVATE_CONTENT_PATTERNS) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    safe = safe.replace(regex, '[REDACTED]');
  }
  return safe.substring(0, 2000);
}

export async function submitPilotFeedback(input: PilotFeedbackInput): Promise<{
  ok: boolean;
  feedbackId?: string;
  redactionStatus: string;
  safetySignalCreated: boolean;
  reasonCodes: string[];
  safeMessage: string;
}> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, redactionStatus: 'rejected', safetySignalCreated: false, reasonCodes: ['missing_required_fields'], safeMessage: 'Required fields missing.' };
  }

  if (!PILOT_FEEDBACK_TYPES.includes(input.feedbackType as any)) {
    return { ok: false, redactionStatus: 'rejected', safetySignalCreated: false, reasonCodes: ['invalid_feedback_type'], safeMessage: `Invalid feedback type: ${input.feedbackType}` };
  }

  const rawSummary = input.safeSummary || '';
  const hasPrivateContent = containsPrivateContent(rawSummary);
  const safeSummary = hasPrivateContent ? redactUnsafeContent(rawSummary) : rawSummary.substring(0, 2000);
  const redactionStatus = hasPrivateContent ? 'redacted' : 'safe_summary_only';

  if (hasPrivateContent && rawSummary.length > 0 && safeSummary.replace(/\[REDACTED\]/g, '').trim().length === 0) {
    return {
      ok: false,
      redactionStatus: 'rejected',
      safetySignalCreated: false,
      reasonCodes: ['feedback_contains_only_private_content'],
      safeMessage: 'Feedback contains only private content and cannot be stored.',
    };
  }

  const riskFlags: string[] = [...(input.riskFlags ?? [])];
  if (input.safeguardingRelevant && !riskFlags.includes('safeguarding')) riskFlags.push('safeguarding');
  if (input.deenRelevant && !riskFlags.includes('deen')) riskFlags.push('deen');
  if (input.privacyRelevant && !riskFlags.includes('privacy')) riskFlags.push('privacy');
  if (input.teacherActionRequested && !riskFlags.includes('teacher_action_requested')) riskFlags.push('teacher_action_requested');

  const record = await task026PilotExecutionRepository.createFeedbackRecord({
    executionRunId: input.executionRunId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    actorRole: input.actorRole,
    actorIdHash: input.actorIdHash,
    feedbackType: input.feedbackType,
    sentiment: input.sentiment,
    safeSummary,
    redactionStatus,
    riskFlags,
    teacherActionRequested: input.teacherActionRequested ?? false,
    safeguardingRelevant: input.safeguardingRelevant ?? false,
    deenRelevant: input.deenRelevant ?? false,
    privacyRelevant: input.privacyRelevant ?? false,
    metadataSafeJson: input.metadataSafeJson ?? {},
  });

  let safetySignalCreated = false;
  if (riskFlags.length > 0 || input.safeguardingRelevant || input.deenRelevant) {
    const { createSafetySignalFromFeedback } = await import('./task026PilotSafetySignalService');
    try {
      await createSafetySignalFromFeedback({
        executionRunId: input.executionRunId,
        pilotProgramId: input.pilotProgramId,
        schoolId: input.schoolId,
        feedbackType: input.feedbackType,
        riskFlags,
        safeSummary,
        actorRole: input.actorRole,
      });
      safetySignalCreated = true;
    } catch { /* signal creation failed silently */ }
  }

  return {
    ok: true,
    feedbackId: (record as any).id,
    redactionStatus,
    safetySignalCreated,
    reasonCodes: [],
    safeMessage: `Feedback recorded with ${redactionStatus} redaction.`,
  };
}

export async function listFeedbackRecords(executionRunId: string) {
  const records = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
  return records.map((r: any) => ({
    id: r.id,
    feedbackType: r.feedbackType,
    sentiment: r.sentiment,
    safeSummary: r.safeSummary,
    redactionStatus: r.redactionStatus,
    riskFlags: r.riskFlags,
    teacherActionRequested: r.teacherActionRequested,
    safeguardingRelevant: r.safeguardingRelevant,
    deenRelevant: r.deenRelevant,
    privacyRelevant: r.privacyRelevant,
    actorRole: r.actorRole,
    createdAt: r.createdAt,
  }));
}
