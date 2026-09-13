import type { WhyThisNextEvidencePacket, SafeLearningEvidenceRecord } from '../contracts/safeLearningEvidenceContracts';
import { safeLearningEvidenceSourceTruthPolicy } from './safeLearningEvidenceSourceTruthPolicy';

export class SafeLearningEvidenceWhyThisNextBridge {
  buildPacket(records: SafeLearningEvidenceRecord[]): WhyThisNextEvidencePacket | null {
    if (records.length === 0) return null;

    const first = records[0];
    const refs = records.slice(0, 20).map((r) => r.id);

    const hasRealEvidence = records.some((r) =>
      safeLearningEvidenceSourceTruthPolicy.isRealEvidence(r.sourceTruthStatus),
    );

    const weakSignals = records.filter((r) => r.weakTopicSignal).length;
    const masterySignals = records.filter((r) => r.masterySignal).length;
    const mistakeSignals = records.filter((r) => r.mistakeCategory).length;
    const revisionSignals = records.filter((r) => r.revisionSignal).length;
    const hintDeps = records.filter((r) => r.hintDependencyBucket).length;

    const evidenceUses: string[] = [];
    if (masterySignals > 0) evidenceUses.push('mastery_update');
    if (weakSignals > 0 || mistakeSignals > 0 || hintDeps > 0) evidenceUses.push('weak_topic_update');
    if (revisionSignals > 0) evidenceUses.push('revision_scheduling');
    if (hasRealEvidence) evidenceUses.push('growth_proof');
    if (evidenceUses.length === 0) evidenceUses.push('general_evidence');

    const totalCount = records.length;
    const confidenceBucket =
      totalCount >= 20 ? 'high' :
      totalCount >= 10 ? 'medium' :
      totalCount >= 3 ? 'low' :
      'none';

    return {
      schoolId: first.schoolId,
      studentId: first.studentId,
      tutorLearnerId: first.tutorLearnerId,
      subjectId: first.subjectId,
      topicId: first.topicId,
      skillId: first.skillId,
      safeEvidenceRefs: refs,
      sourceTruthSummary: hasRealEvidence ? 'real_evidence_available' : 'non_real_evidence_only',
      confidenceBucket,
      safeReasonCodes: ['evidence_packet_built'],
      recommendedEvidenceUse: evidenceUses,
    };
  }
}

export const safeLearningEvidenceWhyThisNextBridge = new SafeLearningEvidenceWhyThisNextBridge();
