import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import type { SafeLearningEvidenceIngestRequest, SafeLearningEvidenceAggregate } from '../contracts/safeLearningEvidenceContracts';

function computeConfidenceBucket(evidenceCount: number, realCount: number): string {
  if (evidenceCount === 0) return 'none';
  if (realCount === 0) return 'low';
  if (evidenceCount < 3) return 'low';
  if (evidenceCount < 10) return 'medium';
  if (realCount >= 10) return 'high';
  return 'medium';
}

export class SafeLearningEvidenceAggregateService {
  updateAggregateFromEvidence(
    request: SafeLearningEvidenceIngestRequest,
    effectiveStatus: string,
  ): void {
    const windows = ['current_session', 'daily', 'weekly', 'monthly', 'term', 'all_time'];
    for (const window of windows) {
      const existing = safeLearningEvidenceRepository.findAggregate({
        schoolId: request.schoolId,
        studentId: request.studentId,
        aggregateWindow: window,
      });

      const evidenceCount = (existing?.evidenceCount || 0) + 1;
      const realEvidenceCount = (existing?.realEvidenceCount || 0) + (effectiveStatus === 'real' ? 1 : 0);
      const weakSignalCount = (existing?.weakSignalCount || 0) + (request.weakTopicSignal ? 1 : 0);
      const masterySignalCount = (existing?.masterySignalCount || 0) + (request.masterySignal ? 1 : 0);
      const revisionSignalCount = (existing?.revisionSignalCount || 0) + (request.revisionSignal ? 1 : 0);
      const mistakeSignalCount = (existing?.mistakeSignalCount || 0) + (request.mistakeCategory ? 1 : 0);
      const hintDependencyCount = (existing?.hintDependencyCount || 0) + (request.hintDependencyBucket ? 1 : 0);
      const reflectionCount = (existing?.reflectionCount || 0) + (request.evidenceType === 'reflection_submitted' || request.evidenceType === 'reflection_quality_marked' ? 1 : 0);
      const teachBackCount = (existing?.teachBackCount || 0) + (request.sourceMode === 'teach_back' ? 1 : 0);
      const quizRecallCount = (existing?.quizRecallCount || 0) + (request.sourceMode === 'quiz' ? 1 : 0);

      const agg: SafeLearningEvidenceAggregate = {
        schoolId: request.schoolId,
        studentId: request.studentId,
        tutorLearnerId: request.tutorLearnerId,
        aggregateWindow: window,
        subjectId: request.subjectId,
        topicId: request.topicId,
        skillId: request.skillId,
        evidenceCount,
        realEvidenceCount,
        weakSignalCount,
        masterySignalCount,
        revisionSignalCount,
        mistakeSignalCount,
        hintDependencyCount,
        reflectionCount,
        teachBackCount,
        quizRecallCount,
        lastEvidenceAt: new Date().toISOString(),
        confidenceBucket: computeConfidenceBucket(evidenceCount, realEvidenceCount),
        safeSummaryJson: {},
      };
      safeLearningEvidenceRepository.upsertAggregate(agg);
    }
  }

  getAggregate(params: {
    schoolId: string;
    studentId: string;
    aggregateWindow: string;
  }): SafeLearningEvidenceAggregate | null {
    return safeLearningEvidenceRepository.findAggregate(params);
  }
}

export const safeLearningEvidenceAggregateService = new SafeLearningEvidenceAggregateService();
