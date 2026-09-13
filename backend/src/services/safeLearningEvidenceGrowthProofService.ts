import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import { safeLearningEvidenceSourceTruthPolicy } from './safeLearningEvidenceSourceTruthPolicy';
import type { GrowthProofSummary, GrowthProofCandidate } from '../contracts/safeLearningEvidenceContracts';

export class SafeLearningEvidenceGrowthProofService {
  buildGrowthProofSummary(params: {
    schoolId: string;
    studentId: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
  }): GrowthProofSummary {
    const evidenceRecords = safeLearningEvidenceRepository.queryEvidence({
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      skillId: params.skillId,
      limit: 500,
      offset: 0,
    });

    if (evidenceRecords.length === 0) {
      return {
        schoolId: params.schoolId,
        studentId: params.studentId,
        subjectId: params.subjectId,
        topicId: params.topicId,
        proofStatus: 'not_enough_evidence',
        sourceTruthStatus: 'insufficient_real_evidence',
        confidenceBucket: 'none',
        evidenceCount: 0,
        realEvidenceCount: 0,
        weakSignals: 0,
        masterySignals: 0,
        revisionSignals: 0,
        mistakeSignals: 0,
        hintDependencySignals: 0,
        safeReasonCodes: ['no_learning_evidence_yet'],
        safeEvidenceRefs: [],
        studentSafeMessage: 'There is not enough learning evidence yet. Complete a short learning, quiz, teach-back, or revision session to begin building your progress record.',
      };
    }

    const realEvidence = evidenceRecords.filter((r) =>
      safeLearningEvidenceSourceTruthPolicy.isRealEvidence(r.sourceTruthStatus),
    );
    const nonRealEvidence = evidenceRecords.filter((r) =>
      safeLearningEvidenceSourceTruthPolicy.isNonRealEvidence(r.sourceTruthStatus),
    );

    if (realEvidence.length === 0 && nonRealEvidence.length > 0) {
      return {
        schoolId: params.schoolId,
        studentId: params.studentId,
        subjectId: params.subjectId,
        topicId: params.topicId,
        proofStatus: 'not_enough_evidence',
        sourceTruthStatus: 'non_real_evidence_only',
        confidenceBucket: 'low',
        evidenceCount: evidenceRecords.length,
        realEvidenceCount: 0,
        weakSignals: 0,
        masterySignals: 0,
        revisionSignals: 0,
        mistakeSignals: 0,
        hintDependencySignals: 0,
        safeReasonCodes: ['non_real_evidence_cannot_support_growth_claim'],
        safeEvidenceRefs: evidenceRecords.map((r) => r.id),
        studentSafeMessage: 'Learning evidence is available but not yet from real practice sessions.',
      };
    }

    const weakSignals = evidenceRecords.filter((r) => r.weakTopicSignal).length;
    const masterySignals = evidenceRecords.filter((r) => r.masterySignal === 'mastery_candidate' || r.evidenceStrength === 'mastery_candidate').length;
    const revisionSignals = evidenceRecords.filter((r) => r.revisionSignal).length;
    const mistakeSignals = evidenceRecords.filter((r) => r.mistakeCategory).length;
    const hintDependencySignals = evidenceRecords.filter((r) => r.hintDependencyBucket).length;

    const blockedEvidence = evidenceRecords.filter(
      (r) => r.evidenceType === 'blocked_answer_key_request' || r.evidenceType === 'blocked_model_answer_request',
    );
    const hasBlockedEvents = blockedEvidence.length > 0;
    const blockedRefs = blockedEvidence.map((r) => r.id);

    let proofStatus: string;
    const codes: string[] = [];

    const hasImprovement = evidenceRecords.some(
      (r) => r.evidenceType === 'recovery_detected' || r.evidenceType === 'step_successful',
    );
    const hasWeakEvidence = weakSignals > 0 || mistakeSignals > 0 || hintDependencySignals > 0;
    const hasMasteryEvidence = masterySignals > 0;
    const hasDueRevision = revisionSignals > 0;

    if (realEvidence.length < 2) {
      proofStatus = 'early_signal';
      codes.push('early_learning_signal');
    } else if (hasBlockedEvents) {
      proofStatus = 'blocked';
      codes.push('blocked_events_detected');
    } else if (hasMasteryEvidence && !hasWeakEvidence) {
      proofStatus = 'mastery_candidate';
      codes.push('strong_evidence_suggests_mastery');
    } else if (hasDueRevision) {
      proofStatus = 'revision_needed';
      codes.push('revision_due_based_on_evidence');
    } else if (hasWeakEvidence && hasImprovement) {
      proofStatus = 'growth_observed';
      codes.push('improvement_after_weak_signals');
    } else if (hasWeakEvidence) {
      proofStatus = 'weakness_detected';
      codes.push('repeated_weak_signals_detected');
    } else if (realEvidence.length >= 3) {
      proofStatus = 'growth_observed';
      codes.push('consistent_learning_activity');
    } else {
      proofStatus = 'early_signal';
      codes.push('early_learning_signal');
    }

    const refs = evidenceRecords.slice(0, 50).map((r) => r.id);

    const candidate: GrowthProofCandidate = {
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      skillId: params.skillId,
      proofStatus,
      proofStrength: evidenceRecords.length >= 10 ? 'strong' : evidenceRecords.length >= 5 ? 'moderate' : 'weak',
      sourceEvidenceIds: evidenceRecords.slice(0, 100).map((r) => r.id),
      safeEvidenceRefs: refs,
      safeReasonCodes: codes,
      sourceTruthStatus: realEvidence.length > 0 ? 'real' : 'non_real',
      confidenceBucket: realEvidence.length >= 10 ? 'high' : realEvidence.length >= 3 ? 'medium' : 'low',
      createdAt: new Date().toISOString(),
    };
    safeLearningEvidenceRepository.createGrowthProof(candidate);

    return {
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      proofStatus,
      sourceTruthStatus: realEvidence.length > 0 ? 'real_evidence_found' : 'insufficient_real_evidence',
      confidenceBucket: candidate.confidenceBucket,
      evidenceCount: evidenceRecords.length,
      realEvidenceCount: realEvidence.length,
      weakSignals,
      masterySignals,
      revisionSignals,
      mistakeSignals,
      hintDependencySignals,
      safeReasonCodes: codes,
      safeEvidenceRefs: refs,
    };
  }
}

export const safeLearningEvidenceGrowthProofService = new SafeLearningEvidenceGrowthProofService();
