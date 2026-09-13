import { randomUUID } from 'crypto';
import {
  TeacherSafeDashboardEvidencePacket,
  TeacherSafeInsightContext,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';

export function buildDashboardEvidencePacket(
  context: TeacherSafeInsightContext,
): TeacherSafeDashboardEvidencePacket {
  const evidence = readSafeLearningEvidence({
    schoolId: context.schoolId,
    studentId: context.studentId,
    classId: context.classId,
  });

  const now = new Date().toISOString();

  return {
    summaryCards: [],
    supportQueuePreview: [],
    weakTopicClusters: [],
    revisionAttentionPreview: [],
    growthProofSnapshot: [],
    teacherNextActions: [],
    sourceTruthSummary: {
      status: evidence.sourceTruthStatus,
      realCount: evidence.evidenceCount > 0 ? Math.min(evidence.evidenceCount, 3) : 0,
      nonRealCount: 0,
    },
    safeReasonCodes: evidence.safeReasonCodes,
    rawPrivateDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
  };
}
