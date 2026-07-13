import type { QuestionType, DifficultyBand } from '../contracts/questionVersionContracts';
import type { QuestionBankItemStatus } from '../contracts/questionBankItemContracts';
import type { UsageMode } from '../contracts/questionGovernanceContracts';

export type SecurityClassAssignment =
  | 'practice_safe'
  | 'quiz_safe'
  | 'exam_secure'
  | 'teacher_only'
  | 'restricted';

export type ClassificationResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export function classifyQuestionType(stemText: string): ClassificationResult<QuestionType> {
  const t = stemText.toLowerCase();
  if (/\b(which|what|who|when|where)\b/i.test(t) && /\[(a|b|c|d|e|f|x|y|z)\]/i.test(stemText)) {
    return { ok: true, value: 'multiple_choice' };
  }
  if (t.includes('true') && t.includes('false') && /\?$/.test(t)) {
    return { ok: true, value: 'true_false' };
  }
  if (/fill (in|the|blank)/i.test(t) || /_____/.test(t) || /__+/.test(t)) {
    return { ok: true, value: 'fill_blank' };
  }
  if (/match/i.test(t) || /pair/i.test(t)) {
    return { ok: true, value: 'matching' };
  }
  if (/\b(explain|discuss|describe|evaluate|analyse|compare|contrast|justify|critically)\b/i.test(t)) {
    return { ok: true, value: 'essay' };
  }
  if (t.includes('part') && t.includes('(') && /\((a|b|c|d|i|ii|iii)\)/.test(t)) {
    return { ok: true, value: 'multi_part' };
  }
  if (/\bshow your working\b/i.test(t) || /\bcalculate\b/i.test(t) || /\bsolve\b/i.test(t)) {
    return { ok: true, value: 'structured_working' };
  }
  if (/\bwhat is\b/i.test(t) || /\bdefine\b/i.test(t) || /\bname\b/i.test(t) || /\blist\b/i.test(t)) {
    return { ok: true, value: 'short_answer' };
  }
  if (/\bpractical\b/i.test(t) || /\binvestigat/i.test(t) || /\bexperiment\b/i.test(t)) {
    return { ok: true, value: 'practical' };
  }
  if (/\bdiscuss orally\b/i.test(t) || /\bpresent\b.*\borally\b/i.test(t)) {
    return { ok: true, value: 'oral' };
  }
  return { ok: false, reason: 'unrecognised_question_type' };
}

export function classifySecurityClass(
  questionType: QuestionType,
  subjectId: string,
  isAssessmentContent: boolean,
): ClassificationResult<SecurityClassAssignment> {
  if (isAssessmentContent) {
    return { ok: true, value: 'teacher_only' };
  }
  if (subjectId.startsWith('exam_') || subjectId.startsWith('assessment_')) {
    return { ok: true, value: 'exam_secure' };
  }
  if (questionType === 'oral' || questionType === 'practical') {
    return { ok: true, value: 'teacher_only' };
  }
  return { ok: true, value: 'practice_safe' };
}

export function classifyUsageModeEligibility(
  questionStatus: QuestionBankItemStatus,
  securityClass: string,
  usageMode: UsageMode,
  hasContentSafetyReview: boolean,
  oralPolicyConfigured: boolean,
): ClassificationResult<{ eligible: boolean; reasonCodes: string[] }> {
  const reasonCodes: string[] = [];

  if (usageMode === 'exam') {
    if (questionStatus !== 'approved') {
      reasonCodes.push('exam_requires_approved_status');
    }
    if (securityClass !== 'exam_secure' && securityClass !== 'approved') {
      reasonCodes.push('exam_requires_exam_secure_security_class');
    }
    if (!hasContentSafetyReview) {
      reasonCodes.push('exam_requires_content_safety_review');
    }
  }

  if (usageMode === 'practice') {
    if (questionStatus !== 'approved') {
      reasonCodes.push('practice_requires_approved_status');
    }
    if (securityClass !== 'practice_safe' && securityClass !== 'quiz_safe') {
      reasonCodes.push('practice_requires_practice_safe_or_quiz_safe');
    }
  }

  if (usageMode === 'oral') {
    if (!oralPolicyConfigured) {
      reasonCodes.push('oral_usage_policy_not_configured');
    }
  }

  if (securityClass === 'restricted') {
    if (usageMode === 'practice' || usageMode === 'quiz' || usageMode === 'revision') {
      reasonCodes.push('restricted_question_not_allowed_for_usage_mode');
    }
  }

  if (reasonCodes.length > 0) {
    return { ok: true, value: { eligible: false, reasonCodes } };
  }

  return { ok: true, value: { eligible: true, reasonCodes: [] } };
}
