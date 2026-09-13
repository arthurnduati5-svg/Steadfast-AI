import type {
  SafeLearningEvidenceResponse,
  SafeLearningEvidenceErrorResponse,
  SafeLearningEvidencePersistenceResult,
  GrowthProofSummary,
  SafeLearningEvidenceAggregate,
  WhyThisNextEvidencePacket,
  TeacherSafeEvidenceView,
  LearnerSafeEvidenceView,
} from '../contracts/safeLearningEvidenceContracts';

export class SafeLearningEvidenceResponseBuilder {
  buildPersistenceResponse(result: SafeLearningEvidencePersistenceResult): SafeLearningEvidenceResponse {
    if (!result.persisted) {
      if (result.policyDecision === 'duplicate_ignored') {
        return {
          ok: true,
          status: 'duplicate_ignored',
          policyDecision: result.policyDecision,
          dataQualityStatus: result.dataQualityStatus,
          safeReasonCodes: result.safeReasonCodes,
          safeEvidenceRefs: result.safeEvidenceRefs,
        };
      }
      return {
        ok: true,
        status: 'rejected',
        message: 'Evidence could not be persisted due to policy rules.',
        policyDecision: result.policyDecision,
        dataQualityStatus: result.dataQualityStatus,
        safeReasonCodes: result.safeReasonCodes,
        safeEvidenceRefs: result.safeEvidenceRefs,
      };
    }
    return {
      ok: true,
      status: 'persisted',
      policyDecision: result.policyDecision,
      dataQualityStatus: result.dataQualityStatus,
      safeReasonCodes: result.safeReasonCodes,
      safeEvidenceRefs: result.safeEvidenceRefs,
      evidence: result.record,
    };
  }

  buildEmptyEvidenceResponse(safeReasonCodes: string[]): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'empty',
      safeReasonCodes,
      safeEvidenceRefs: [],
      studentSafeMessage: 'There is not enough learning evidence yet. Complete a short learning, quiz, teach-back, or revision session to begin building your progress record.',
    };
  }

  buildGrowthProofResponse(summary: GrowthProofSummary): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'found',
      safeReasonCodes: summary.safeReasonCodes,
      safeEvidenceRefs: summary.safeEvidenceRefs,
      growthProof: summary,
      studentSafeMessage: summary.studentSafeMessage,
    };
  }

  buildAggregateResponse(aggregate: SafeLearningEvidenceAggregate): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'found',
      safeReasonCodes: ['aggregate_found'],
      safeEvidenceRefs: [],
      aggregate,
    };
  }

  buildWhyThisNextResponse(packet: WhyThisNextEvidencePacket): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'found',
      safeReasonCodes: packet.safeReasonCodes,
      safeEvidenceRefs: packet.safeEvidenceRefs,
      whyThisNextPacket: packet,
    };
  }

  buildTeacherViewResponse(view: TeacherSafeEvidenceView): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'found',
      safeReasonCodes: view.safeReasonCodes,
      safeEvidenceRefs: [],
      teacherView: view,
    };
  }

  buildLearnerViewResponse(view: LearnerSafeEvidenceView): SafeLearningEvidenceResponse {
    return {
      ok: true,
      status: 'found',
      safeReasonCodes: view.safeReasonCodes,
      safeEvidenceRefs: [],
      learnerView: view,
    };
  }

  buildErrorResponse(code: string, message: string, safeReasonCodes?: string[]): SafeLearningEvidenceErrorResponse {
    return {
      ok: false,
      code,
      message,
      safeReasonCodes: safeReasonCodes || [code],
      safeEvidenceRefs: [],
    };
  }
}

export const safeLearningEvidenceResponseBuilder = new SafeLearningEvidenceResponseBuilder();
