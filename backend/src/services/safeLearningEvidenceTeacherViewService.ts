import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import type { TeacherSafeEvidenceView } from '../contracts/safeLearningEvidenceContracts';

export class SafeLearningEvidenceTeacherViewService {
  buildTeacherView(params: {
    schoolId: string;
    studentId: string;
    subjectId?: string;
    topicId?: string;
  }): TeacherSafeEvidenceView {
    const records = safeLearningEvidenceRepository.queryEvidence({
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      limit: 500,
      offset: 0,
    });

    if (records.length === 0) {
      return {
        schoolId: params.schoolId,
        studentId: params.studentId,
        subjectId: params.subjectId,
        topicId: params.topicId,
        safeProgressBucket: 'no_evidence',
        weakTopicCount: 0,
        supportNeedBucket: 'unknown',
        revisionDueCount: 0,
        teacherSupportRecommendation: 'Student has not yet generated enough learning evidence for a meaningful teacher summary.',
        safeReasonCodes: ['no_learning_evidence_yet'],
      };
    }

    const weakTopicCount = records.filter((r) => r.weakTopicSignal).length;
    const revisionDueCount = records.filter((r) => r.revisionSignal).length;
    const mistakeCount = records.filter((r) => r.mistakeCategory).length;
    const hintDepCount = records.filter((r) => r.hintDependencyBucket).length;

    const strongRecords = records.filter(
      (r) => r.evidenceStrength === 'mastery_candidate' || r.evidenceStrength === 'strong',
    ).length;

    let safeProgressBucket: string;
    if (strongRecords >= 5) {
      safeProgressBucket = 'strong_progress';
    } else if (strongRecords >= 2) {
      safeProgressBucket = 'moderate_progress';
    } else if (records.length >= 5) {
      safeProgressBucket = 'early_progress';
    } else {
      safeProgressBucket = 'minimal_progress';
    }

    let supportNeedBucket = 'low';
    if (hintDepCount >= 5 || mistakeCount >= 5) {
      supportNeedBucket = 'high';
    } else if (hintDepCount >= 2 || mistakeCount >= 2) {
      supportNeedBucket = 'medium';
    }

    let teacherSupportRecommendation: string;
    if (weakTopicCount >= 3 || mistakeCount >= 3) {
      teacherSupportRecommendation = 'Student shows repeated weak signals across multiple topics. Teacher review recommended.';
    } else if (revisionDueCount >= 2) {
      teacherSupportRecommendation = 'Student has revision items due. Monitor progress on scheduled reviews.';
    } else if (hintDepCount >= 3) {
      teacherSupportRecommendation = 'Student frequently uses hints. Consider providing additional foundational support.';
    } else {
      teacherSupportRecommendation = 'Student is making expected progress. Continue current learning path.';
    }

    const lastEvidence = records.reduce((latest, r) =>
      r.createdAt > latest ? r.createdAt : latest, records[0].createdAt);

    return {
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      safeProgressBucket,
      weakTopicCount,
      supportNeedBucket,
      revisionDueCount,
      teacherSupportRecommendation,
      safeReasonCodes: ['teacher_safe_summary_generated'],
      lastEvidenceAt: lastEvidence,
    };
  }
}

export const safeLearningEvidenceTeacherViewService = new SafeLearningEvidenceTeacherViewService();
