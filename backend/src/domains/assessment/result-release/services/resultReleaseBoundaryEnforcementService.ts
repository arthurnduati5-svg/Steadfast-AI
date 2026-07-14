import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
  ResultReleasePacketAudience,
} from '../contracts';
import { evaluateBoundaryEnforcementPolicy } from '../policies/resultReleasePolicyDefinitions';

const FORBIDDEN_STUDENT_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'pdfPayload', 'portalPayload', 'notificationPayload', 'rawMasteryDelta', 'beforeStateJson',
  'afterStateJson', 'deltaJson',
];

const FORBIDDEN_PARENT_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'pdfPayload', 'portalPayload', 'notificationPayload', 'rawMasteryDelta', 'beforeStateJson',
  'afterStateJson', 'deltaJson',
];

const ALLOWED_STUDENT_FIELDS: string[] = [
  'studentRef', 'safeAchievementSummary', 'safeLearningProgressSummary', 'safeNextPracticeSummary',
  'safeRevisionGuidance', 'safeSupportGuidance', 'safeStatusSummary', 'allowedFieldNames', 'blockedFieldNames',
  'availableNextActions',
];

const ALLOWED_PARENT_FIELDS: string[] = [
  'studentRef', 'safeProgressSummary', 'safeSupportSummary', 'safeStrengths', 'safeGrowthAreas',
  'safeRecommendedSupport', 'notYetReleasedReason', 'allowedFieldNames', 'blockedFieldNames',
  'availableNextActions',
];

function envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
  return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
}

export class ResultReleaseBoundaryEnforcementService {
  async assertBoundaryAllowsAudience(ctx: ResultReleaseCommandContext, audience: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateBoundaryEnforcementPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    const validAudiences = ['student', 'parent', 'teacher', 'admin', 'school_leadership'];
    if (!validAudiences.includes(audience)) return envelope(ctx, { ok: false, safeMessage: 'Invalid audience', reasonCode: 'INVALID_AUDIENCE', status: 'error' });
    return envelope(ctx, { safeMessage: `Audience ${audience} is allowed by boundary`, data: { audience, allowed: true } });
  }

  async assertFieldAllowedForAudience(ctx: ResultReleaseCommandContext, audience: string, fieldName: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const forbidden = audience === 'student' ? FORBIDDEN_STUDENT_FIELDS : audience === 'parent' ? FORBIDDEN_PARENT_FIELDS : [];
    if (forbidden.includes(fieldName)) return envelope(ctx, { ok: false, safeMessage: `Field ${fieldName} is blocked for audience ${audience}`, reasonCode: 'FIELD_BLOCKED', status: 'blocked' });
    return envelope(ctx, { safeMessage: `Field ${fieldName} is allowed for audience ${audience}`, data: { fieldName, audience, allowed: true } });
  }

  async buildAllowedBlockedFieldSet(ctx: ResultReleaseCommandContext, audience: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (audience === 'student') return envelope(ctx, { data: { allowedFieldNames: ALLOWED_STUDENT_FIELDS, blockedFieldNames: FORBIDDEN_STUDENT_FIELDS } });
    if (audience === 'parent') return envelope(ctx, { data: { allowedFieldNames: ALLOWED_PARENT_FIELDS, blockedFieldNames: FORBIDDEN_PARENT_FIELDS } });
    return envelope(ctx, { data: { allowedFieldNames: ['*'], blockedFieldNames: FORBIDDEN_STUDENT_FIELDS } });
  }

  async redactForStudentAudience(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const redacted = { ...payload };
    for (const field of FORBIDDEN_STUDENT_FIELDS) delete redacted[field];
    return envelope(ctx, { safeMessage: 'Payload redacted for student audience', data: redacted });
  }

  async redactForParentAudience(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const redacted = { ...payload };
    for (const field of FORBIDDEN_PARENT_FIELDS) delete redacted[field];
    return envelope(ctx, { safeMessage: 'Payload redacted for parent audience', data: redacted });
  }

  async redactForTeacherAudience(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'No additional redaction for teacher audience', data: payload });
  }

  async redactForAdminAudience(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'No additional redaction for admin audience', data: payload });
  }

  async blockPacketForBoundaryViolation(ctx: ResultReleaseCommandContext, packetId: string, violationReason: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, {
      resourceId: packetId,
      status: 'blocked',
      safeMessage: `Packet blocked due to boundary violation: ${violationReason}`,
      reasonCode: 'BOUNDARY_VIOLATION',
    });
  }
}
