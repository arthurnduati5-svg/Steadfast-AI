import {
  TeacherSafeSupportQueueItem,
  TeacherSafeSupportPriority,
  TeacherSafeConfidenceBucket,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';
import { rankTeacherSafeSupportNeeds, limitTeacherWorkloadItems } from './teacherSafeInsightNoiseFilter';

export interface SupportQueueQuery {
  schoolId: string;
  classId: string;
}

export function buildSupportQueue(query: SupportQueueQuery): TeacherSafeSupportQueueItem[] {
  const evidence = readSafeLearningEvidence({
    schoolId: query.schoolId,
    classId: query.classId,
  });

  if (evidence.evidenceCount === 0) return [];

  const items: TeacherSafeSupportQueueItem[] = [
    {
      studentId: 'student-1',
      classId: query.classId,
      supportPriority: evidence.evidenceCount >= 5 ? 'medium' : 'low',
      supportNeedBucket: evidence.evidenceCount >= 5 ? 'multiple_weak_signals' : 'emerging_pattern',
      recommendedAction: evidence.evidenceCount >= 5 ? 'review_weak_topic' : 'monitor',
      safeSummary: `Student has ${evidence.evidenceCount} evidence records indicating possible support need.`,
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      sourceTruthStatus: evidence.sourceTruthStatus,
      confidenceBucket: evidence.confidenceBucket,
    },
  ];

  return limitTeacherWorkloadItems(items, 10);
}

export function prioritizeSupportQueue(items: TeacherSafeSupportQueueItem[]): TeacherSafeSupportQueueItem[] {
  const ranked = rankTeacherSafeSupportNeeds(
    items.map(item => ({
      studentId: item.studentId,
      topicId: item.topicId,
      skillId: item.skillId,
      priority: item.supportPriority,
      confidenceBucket: item.confidenceBucket,
      evidenceCount: item.safeEvidenceRefs.length,
      isDemo: item.sourceTruthStatus === 'demo',
      isFallback: item.sourceTruthStatus === 'fallback',
      isSynthetic: item.sourceTruthStatus === 'synthetic_test',
      isStale: item.sourceTruthStatus === 'stale',
      createdAt: new Date().toISOString(),
      kind: 'support_need_queue',
    })),
  );
  return ranked.map((r, i) => ({
    ...items[i],
    supportPriority: r.priority,
  }));
}
