import {
  TeacherSafeWeakTopicCluster,
  TeacherSafeConfidenceBucket,
} from '../contracts/teacherSafeInsightContracts';
import { readSafeLearningEvidence } from './teacherSafeInsightEvidenceReader';

export interface WeakTopicQuery {
  schoolId: string;
  classId: string;
  subjectId?: string;
}

export function buildWeakTopicClusters(query: WeakTopicQuery): TeacherSafeWeakTopicCluster[] {
  const evidence = readSafeLearningEvidence({
    schoolId: query.schoolId,
    classId: query.classId,
    subjectId: query.subjectId,
  });

  if (evidence.evidenceCount < 2) return [];

  const clusters: TeacherSafeWeakTopicCluster[] = [];
  if (query.subjectId) {
    clusters.push({
      subjectId: query.subjectId,
      studentCount: Math.min(evidence.evidenceCount, 5),
      evidenceCount: evidence.evidenceCount,
      safeSummary: `Weak topic cluster detected in subject ${query.subjectId}. ${evidence.evidenceCount} evidence records reviewed.`,
      safeReasonCodes: evidence.safeReasonCodes,
      safeEvidenceRefs: evidence.safeEvidenceRefs,
      confidenceBucket: evidence.confidenceBucket,
    });
  }
  return clusters;
}

export function groupWeakTopicsBySubject(
  query: WeakTopicQuery,
): Map<string, TeacherSafeWeakTopicCluster[]> {
  const clusters = buildWeakTopicClusters(query);
  const grouped = new Map<string, TeacherSafeWeakTopicCluster[]>();
  for (const cluster of clusters) {
    const key = cluster.subjectId || 'unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(cluster);
  }
  return grouped;
}
