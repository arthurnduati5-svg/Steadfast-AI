import {
  TeacherSafeNextActionRecommendation,
  TeacherSafeNextActionType,
  TeacherSafeSupportPriority,
  TeacherSafeInsightContext,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';

export function buildNextActionRecommendation(
  context: TeacherSafeInsightContext,
): TeacherSafeNextActionRecommendation {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    studentId: context.studentId,
    classId: context.classId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
  });

  const now = new Date().toISOString();

  if (evidence.evidenceCount === 0) {
    return {
      studentId: context.studentId,
      classId: context.classId,
      actionType: 'no_action_needed',
      priority: 'none',
      safeSummary: 'There is not enough safe learning evidence yet to recommend a teacher action.',
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }

  if (evidence.safeReasonCodes.includes('deen_referral_created')) {
    return {
      studentId: context.studentId,
      classId: context.classId,
      actionType: 'refer_deen_question',
      priority: 'medium',
      safeSummary: 'Deen-related uncertainty detected. A scholar referral may be appropriate.',
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }

  if (evidence.safeReasonCodes.includes('content_gap_no_curriculum_context')) {
    return {
      studentId: context.studentId,
      classId: context.classId,
      actionType: 'clarify_content_gap',
      priority: 'medium',
      safeSummary: 'Content gap detected without curriculum context. Clarify the source material.',
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }

  if (evidence.evidenceCount >= 5) {
    return {
      studentId: context.studentId,
      classId: context.classId,
      actionType: 'review_weak_topic',
      priority: 'medium',
      safeSummary: `Multiple evidence records (${evidence.evidenceCount}) indicate a topic that may benefit from teacher review.`,
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }

  return {
    studentId: context.studentId,
    classId: context.classId,
    actionType: 'no_action_needed',
    priority: 'none',
    safeSummary: 'No strong evidence yet to recommend a specific teacher action.',
    safeReasonCodes: evidence.safeReasonCodes,
    safeEvidenceRefs: evidence.safeEvidenceRefs,
    sourceTruthStatus: evidence.sourceTruthStatus,
    confidenceBucket: evidence.confidenceBucket,
  };
}

export function buildClassNextActions(
  context: TeacherSafeInsightContext,
): TeacherSafeNextActionRecommendation[] {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    classId: context.classId,
    subjectId: context.subjectId,
  });

  if (evidence.evidenceCount === 0) return [];

  const actions: TeacherSafeNextActionRecommendation[] = [];

  if (evidence.evidenceCount >= 3) {
    actions.push({
      classId: context.classId,
      actionType: 'start_small_group_support',
      priority: 'medium',
      safeSummary: `${evidence.evidenceCount} students show patterns that may benefit from small group support.`,
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    });
  }

  return actions;
}

export function buildHintDependencyAction(
  context: TeacherSafeInsightContext,
): TeacherSafeNextActionRecommendation | null {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    studentId: context.studentId,
  });

  if (evidence.evidenceCount >= 3) {
    return {
      studentId: context.studentId,
      actionType: 'recommend_focus_mode',
      priority: 'low',
      safeSummary: 'Hint dependency pattern detected. Focus mode may help build independent problem-solving.',
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }
  return null;
}

export function buildTeachBackAction(
  context: TeacherSafeInsightContext,
): TeacherSafeNextActionRecommendation | null {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    studentId: context.studentId,
  });

  if (evidence.evidenceCount >= 3) {
    return {
      studentId: context.studentId,
      actionType: 'recommend_teach_back',
      priority: 'low',
      safeSummary: 'Teach-back mode may help reinforce understanding of recent topics.',
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    };
  }
  return null;
}
