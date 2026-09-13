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
import { assertSafeTeacherInsightOutput } from './teacherSafeInsightPrivacyGuard';

export function buildSafeResponse(
  reportType: TeacherSafeInsightType,
  scope: TeacherSafeReportScope,
  data: unknown,
  sourceTruthStatus: TeacherSafeSourceTruthStatus,
  confidenceBucket: TeacherSafeConfidenceBucket,
  safeReasonCodes: TeacherSafeReasonCode[],
  status: 'ok' | 'empty' | 'insufficient' = 'ok',
): TeacherSafeInsightResponse {
  assertSafeTeacherInsightOutput(data);
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

export function buildSafeErrorResponse(
  status: 'blocked' | 'error',
  policyDecision?: TeacherSafePolicyDecision,
  safeReasonCodes?: TeacherSafeReasonCode[],
): TeacherSafeInsightErrorResponse {
  return {
    ok: false,
    status,
    policyDecision,
    safeReasonCodes: safeReasonCodes || [],
    generatedAt: new Date().toISOString(),
    rawPrivateDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
  };
}
