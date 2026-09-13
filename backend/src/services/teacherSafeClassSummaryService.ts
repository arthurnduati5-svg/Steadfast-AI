import { randomUUID } from 'crypto';
import {
  TeacherSafeClassSummary,
  TeacherSafeInsightContext,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';

export function buildClassSafeSummary(
  context: TeacherSafeInsightContext,
  studentIds: string[],
): TeacherSafeClassSummary {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    classId: context.classId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
  });

  const now = new Date().toISOString();

  const summary: TeacherSafeClassSummary = {
    id: `tcs-${randomUUID()}`,
    schoolId: context.schoolId,
    teacherId: context.teacherId,
    classId: context.classId || 'unknown',
    studentCount: studentIds.length,
    evidenceCount: evidence.evidenceCount,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
    insightType: 'class_summary',
    reportScope: 'class',
    viewAudience: 'teacher',
    safeSummary: buildSafeClassSummaryText(evidence, studentIds.length),
    safeReasonCodes: evidence.safeReasonCodes,
    safeEvidenceRefs: evidence.safeEvidenceRefs,
    sourceTruthStatus: evidence.sourceTruthStatus,
    confidenceBucket: evidence.confidenceBucket,
    supportPriority: evidence.evidenceCount > 0 ? 'low' : 'none',
    commonWeakTopicClusters: [],
    commonRevisionNeeds: [],
    commonSupportNeeds: [],
    safeRecommendedGroupActions: [],
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

function buildSafeClassSummaryText(
  evidence: { evidenceCount: number; sourceTruthStatus: string },
  studentCount: number,
): string {
  if (evidence.evidenceCount === 0) {
    return 'There is not enough safe learning evidence yet to summarize this class.';
  }
  return `Class has ${studentCount} students with ${evidence.evidenceCount} pieces of safe learning evidence. Evidence source: ${evidence.sourceTruthStatus}.`;
}
