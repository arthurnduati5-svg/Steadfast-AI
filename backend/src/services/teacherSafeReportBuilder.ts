import {
  TeacherSafeInsightResponse,
  TeacherSafeInsightErrorResponse,
  TeacherSafeInsightType,
  TeacherSafeReportScope,
  TeacherSafeSourceTruthStatus,
  TeacherSafeConfidenceBucket,
  TeacherSafeReasonCode,
  TeacherSafePolicyDecision,
} from '../contracts/teacherSafeInsightContracts';

export function buildSafeInsightResponse(
  reportType: TeacherSafeInsightType,
  scope: TeacherSafeReportScope,
  data: unknown,
  sourceTruthStatus: TeacherSafeSourceTruthStatus,
  confidenceBucket: TeacherSafeConfidenceBucket,
  safeReasonCodes: TeacherSafeReasonCode[],
  status: 'ok' | 'empty' | 'insufficient' = 'ok',
): TeacherSafeInsightResponse {
  return {
    ok: true,
    status,
    reportType,
    scope,
    data,
    safeReasonCodes,
    sourceTruthStatus,
    confidenceBucket,
    generatedAt: new Date().toISOString(),
    rawPrivateDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
  };
}

export function buildSafeInsightErrorResponse(
  status: 'blocked' | 'error',
  policyDecision: TeacherSafePolicyDecision | undefined,
  safeReasonCodes: TeacherSafeReasonCode[],
): TeacherSafeInsightErrorResponse {
  return {
    ok: false,
    status,
    policyDecision,
    safeReasonCodes,
    generatedAt: new Date().toISOString(),
    rawPrivateDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
  };
}

export function buildEmptyEvidenceResponse(
  reportType: TeacherSafeInsightType,
  scope: TeacherSafeReportScope,
): TeacherSafeInsightResponse {
  return buildSafeInsightResponse(
    reportType,
    scope,
    {
      teacherSafeMessage: 'There is not enough safe learning evidence yet to summarize this learner. Encourage a short learning, quiz, teach-back, or revision session first.',
    },
    'insufficient',
    'not_enough_evidence',
    ['no_safe_learning_evidence_yet'],
    'empty',
  );
}

export function buildInsufficientRealEvidenceResponse(
  reportType: TeacherSafeInsightType,
  scope: TeacherSafeReportScope,
): TeacherSafeInsightResponse {
  return buildSafeInsightResponse(
    reportType,
    scope,
    {
      teacherSafeMessage: 'Available evidence is from non-real sources and cannot support a teacher insight summary yet.',
    },
    'insufficient',
    'not_enough_evidence',
    ['no_real_learning_evidence_yet', 'non_real_evidence_cannot_support_teacher_insight'],
    'insufficient',
  );
}
