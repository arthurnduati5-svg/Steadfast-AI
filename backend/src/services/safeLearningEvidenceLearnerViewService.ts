import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import type { LearnerSafeEvidenceView } from '../contracts/safeLearningEvidenceContracts';

export class SafeLearningEvidenceLearnerViewService {
  buildLearnerView(params: {
    schoolId: string;
    studentId: string;
  }): LearnerSafeEvidenceView {
    const records = safeLearningEvidenceRepository.queryEvidence({
      schoolId: params.schoolId,
      studentId: params.studentId,
      limit: 500,
      offset: 0,
    });

    if (records.length === 0) {
      return {
        schoolId: params.schoolId,
        studentId: params.studentId,
        proofStatus: 'not_enough_evidence',
        safeProgressSummary: 'There is not enough learning evidence yet. Complete a short learning, quiz, teach-back, or revision session to begin building your progress record.',
        strengths: [],
        areasToReview: [],
        safeReasonCodes: ['no_learning_evidence_yet'],
      };
    }

    const realRecords = records.filter((r) => r.sourceTruthStatus === 'real');
    const strongSubjects = new Set<string>();
    const weakSubjects = new Set<string>();

    for (const r of realRecords) {
      if (r.evidenceStrength === 'mastery_candidate' || r.evidenceStrength === 'strong') {
        if (r.subjectId) strongSubjects.add(r.subjectId);
      }
      if (r.weakTopicSignal || r.mistakeCategory || r.hintDependencyBucket) {
        if (r.subjectId && r.topicId) weakSubjects.add(`${r.subjectId}:${r.topicId}`);
      }
    }

    const strengths = Array.from(strongSubjects).map((s) => `Showing progress in ${s}`);
    const areasToReview = Array.from(weakSubjects).map((s) => {
      const [subj, topic] = s.split(':');
      return `${topic || s} could use more practice`;
    });

    if (strengths.length === 0) {
      strengths.push('Getting started with learning activities');
    }

    let safeProgressSummary: string;
    const totalReal = realRecords.length;
    if (totalReal < 3) {
      safeProgressSummary = 'You are beginning your learning journey. Keep going to build a strong record of progress.';
    } else if (strengths.length >= 3 && areasToReview.length <= 1) {
      safeProgressSummary = 'You are making great progress across several areas. Keep up the good work.';
    } else if (areasToReview.length >= 3) {
      safeProgressSummary = 'You are actively working on several topics. Regular practice will help strengthen your understanding.';
    } else {
      safeProgressSummary = 'You are making steady progress. Continue your learning sessions to build lasting understanding.';
    }

    const lastEvidence = records.reduce((latest, r) =>
      r.createdAt > latest ? r.createdAt : latest, records[0].createdAt);

    return {
      schoolId: params.schoolId,
      studentId: params.studentId,
      proofStatus: totalReal >= 3 ? 'growth_observed' : 'early_signal',
      safeProgressSummary,
      strengths,
      areasToReview,
      safeReasonCodes: ['learner_safe_view_generated'],
      lastEvidenceAt: lastEvidence,
    };
  }
}

export const safeLearningEvidenceLearnerViewService = new SafeLearningEvidenceLearnerViewService();
