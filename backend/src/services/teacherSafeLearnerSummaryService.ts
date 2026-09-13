import { randomUUID } from 'crypto';
import {
  TeacherSafeLearnerSummary,
  TeacherSafeInsightContext,
  TeacherSafeSourceTruthStatus,
  TeacherSafeConfidenceBucket,
  TeacherSafeSupportPriority,
  TeacherSafeNextActionType,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';

export function buildLearnerSafeSummary(
  context: TeacherSafeInsightContext,
): TeacherSafeLearnerSummary {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    studentId: context.studentId,
    classId: context.classId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
  });

  const now = new Date().toISOString();
  const confidenceBucket = evidence.confidenceBucket;
  const supportPriority = computeSupportPriority(evidence.evidenceCount, confidenceBucket);
  const nextAction = computeNextAction(evidence);

  const summary: TeacherSafeLearnerSummary = {
    id: `tls-${randomUUID()}`,
    schoolId: context.schoolId,
    teacherId: context.teacherId,
    classId: context.classId,
    studentId: context.studentId || 'unknown',
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
    insightType: 'learner_summary',
    reportScope: 'learner',
    viewAudience: 'teacher',
    safeSummary: buildSafeLearnerSummaryText(evidence),
    safeReasonCodes: evidence.safeReasonCodes,
    safeEvidenceRefs: evidence.safeEvidenceRefs,
    sourceTruthStatus: evidence.sourceTruthStatus,
    confidenceBucket,
    supportPriority,
    nextActionType: nextAction,
    createdAt: now,
    updatedAt: now,
    rawPrivateDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
  };

  return summary;
}

function buildSafeLearnerSummaryText(evidence: { evidenceCount: number; sourceTruthStatus: TeacherSafeSourceTruthStatus }): string {
  if (evidence.evidenceCount === 0) {
    return 'There is not enough safe learning evidence yet to summarize this learner. Encourage a short learning, quiz, teach-back, or revision session first.';
  }
  if (evidence.sourceTruthStatus === 'demo' || evidence.sourceTruthStatus === 'fallback' || evidence.sourceTruthStatus === 'synthetic_test') {
    return 'Available evidence is from non-real sources and cannot support a teacher insight summary yet.';
  }
  return `Learner has ${evidence.evidenceCount} pieces of safe learning evidence. Overall progress is developing.`;
}

function computeSupportPriority(
  evidenceCount: number,
  confidenceBucket: TeacherSafeConfidenceBucket,
): TeacherSafeSupportPriority {
  if (confidenceBucket === 'not_enough_evidence' || confidenceBucket === 'blocked') return 'none';
  if (evidenceCount >= 10) return 'medium';
  if (evidenceCount >= 5) return 'low';
  return 'none';
}

function computeNextAction(evidence: { evidenceCount: number; safeReasonCodes: TeacherSafeReasonCode[] }): TeacherSafeNextActionType | undefined {
  if (evidence.evidenceCount === 0) return 'no_action_needed';
  if (evidence.safeReasonCodes.includes('deen_referral_created')) return 'refer_deen_question';
  if (evidence.safeReasonCodes.includes('content_gap_no_curriculum_context')) return 'clarify_content_gap';
  if (evidence.evidenceCount < 3) return 'no_action_needed';
  return undefined;
}
