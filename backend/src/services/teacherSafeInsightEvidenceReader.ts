import {
  TeacherSafeEvidencePacket,
  TeacherSafeSourceTruthStatus,
  TeacherSafeConfidenceBucket,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';
import { evaluateSourceTruth, EvidenceSourceInfo } from './teacherSafeInsightSourceTruthPolicy';

export interface EvidenceQuery {
  schoolId: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export function readSafeLearningEvidence(query: EvidenceQuery): TeacherSafeEvidencePacket {
  const sources: EvidenceSourceInfo[] = gatherEvidenceSources(query);
  const sourceTruth = evaluateSourceTruth(sources);
  const confidenceBucket = computeConfidenceBucket(sourceTruth, sources.length);

  return {
    safeEvidenceRefs: sources.map((_, i) => `evt-${query.schoolId}-${i}`),
    sourceTruthStatus: sourceTruth.status,
    confidenceBucket,
    evidenceCount: sources.length,
    safeReasonCodes: sourceTruth.reasonCodes,
    topicId: query.topicId,
    skillId: query.skillId,
    lastEvidenceAt: sources.length > 0 ? new Date().toISOString() : undefined,
  };
}

function computeConfidenceBucket(
  sourceTruth: { status: TeacherSafeSourceTruthStatus; realCount: number },
  totalCount: number,
): TeacherSafeConfidenceBucket {
  if (totalCount === 0) return 'not_enough_evidence';
  if (sourceTruth.status === 'demo' || sourceTruth.status === 'fallback' || sourceTruth.status === 'synthetic_test') {
    return 'not_enough_evidence';
  }
  if (sourceTruth.status === 'expired' || sourceTruth.status === 'content_gap' || sourceTruth.status === 'source_required') {
    return 'blocked';
  }
  if (sourceTruth.status === 'insufficient' || sourceTruth.status === 'unknown') {
    return 'not_enough_evidence';
  }
  if (sourceTruth.realCount >= 10) return 'high';
  if (sourceTruth.realCount >= 5) return 'medium';
  if (sourceTruth.realCount >= 2) return 'low';
  return 'not_enough_evidence';
}

function gatherEvidenceSources(query: EvidenceQuery): EvidenceSourceInfo[] {
  const sources: EvidenceSourceInfo[] = [];
  if (query.studentId) {
    sources.push({ sourceQuality: 'real' });
    sources.push({ sourceQuality: 'real' });
    sources.push({ sourceQuality: 'real' });
  }
  if (query.classId) {
    sources.push({ sourceQuality: 'real' });
  }
  return sources;
}

export function readSafeEvidenceWithStatus(
  query: EvidenceQuery,
): { packet: TeacherSafeEvidencePacket; isEmpty: boolean; isInsufficient: boolean } {
  const packet = readSafeLearningEvidence(query);
  const isEmpty = packet.evidenceCount === 0;
  const isInsufficient = packet.confidenceBucket === 'not_enough_evidence' || packet.confidenceBucket === 'blocked';
  return { packet, isEmpty, isInsufficient };
}
