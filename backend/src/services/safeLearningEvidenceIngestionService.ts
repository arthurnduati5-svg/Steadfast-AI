import type {
  SafeLearningEvidenceIngestRequest,
  SafeLearningEvidencePersistenceResult,
} from '../contracts/safeLearningEvidenceContracts';
import { safeLearningEvidencePrivacyGuard } from './safeLearningEvidencePrivacyGuard';
import { safeLearningEvidenceAccessPolicy, type EvidenceAccessContext } from './safeLearningEvidenceAccessPolicy';
import { safeLearningEvidenceSourceTruthPolicy } from './safeLearningEvidenceSourceTruthPolicy';
import { safeLearningEvidenceIdempotencyService } from './safeLearningEvidenceIdempotencyService';
import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import { safeLearningEvidenceAggregateService } from './safeLearningEvidenceAggregateService';

export class SafeLearningEvidenceIngestionService {
  async ingestEvidence(
    request: SafeLearningEvidenceIngestRequest,
    accessCtx: EvidenceAccessContext,
  ): Promise<SafeLearningEvidencePersistenceResult> {
    const codes: string[] = [];
    const refs: string[] = [];

    const privacyCheck = safeLearningEvidencePrivacyGuard.rejectForbiddenEvidenceFields(request);
    if (!privacyCheck.allowed) {
      return {
        persisted: false,
        policyDecision: 'blocked_forbidden_raw_field',
        dataQualityStatus: 'unsafe_rejected',
        idempotencyKey: '',
        safeReasonCodes: ['forbidden_raw_field_detected', ...privacyCheck.forbidden.map((f) => `forbidden:${f.key}`)],
        safeEvidenceRefs: [],
      };
    }

    const accessCheck = safeLearningEvidenceAccessPolicy.evaluateEvidenceWriteAccess(accessCtx);
    if (!accessCheck.allowed) {
      return {
        persisted: false,
        policyDecision: accessCheck.policyDecision,
        dataQualityStatus: 'blocked',
        idempotencyKey: '',
        safeReasonCodes: accessCheck.safeReasonCodes,
        safeEvidenceRefs: [],
      };
    }

    const sourceTruthCheck = safeLearningEvidenceSourceTruthPolicy.evaluate({
      sourceTruthStatus: request.sourceTruthStatus || 'real',
      evidenceStrength: request.evidenceStrength,
      evidenceType: request.evidenceType,
      isBlockedAnswerKey: request.evidenceType === 'blocked_answer_key_request',
      isBlockedModelAnswer: request.evidenceType === 'blocked_model_answer_request',
      isDeenSensitive: request.sourceMode === 'deen_referral',
      isContentGap: request.sourceTruthStatus === 'content_gap',
    });
    codes.push(...sourceTruthCheck.safeReasonCodes);
    const effectiveStatus = sourceTruthCheck.effectiveStatus;

    const idempotencyKey = safeLearningEvidenceIdempotencyService.buildIdempotencyKey({
      schoolId: request.schoolId,
      studentId: request.studentId,
      sourceTask: request.sourceTask,
      sourceMode: request.sourceMode,
      evidenceType: request.evidenceType,
      turnId: request.turnId,
      modeSessionId: request.modeSessionId,
      targetRef: request.targetRef,
      attemptNumber: request.attemptNumber,
      explicitKey: request.idempotencyKey,
    });

    const dedup = safeLearningEvidenceIdempotencyService.detectDuplicate(idempotencyKey);
    if (dedup.duplicate) {
      return {
        persisted: false,
        policyDecision: 'duplicate_ignored',
        dataQualityStatus: 'duplicate_ignored',
        idempotencyKey,
        safeReasonCodes: codes.concat(dedup.safeReasonCodes),
        safeEvidenceRefs: [],
      };
    }

    const record = safeLearningEvidenceRepository.createEvidenceRecord({
      schoolId: request.schoolId,
      studentId: request.studentId,
      tutorLearnerId: request.tutorLearnerId,
      conversationId: request.conversationId,
      tutorSessionId: request.tutorSessionId,
      turnId: request.turnId,
      modeSessionId: request.modeSessionId,
      sourceTask: request.sourceTask,
      sourceMode: request.sourceMode,
      evidenceType: request.evidenceType,
      evidenceStrength: request.evidenceStrength,
      sourceTruthStatus: request.sourceTruthStatus || 'real',
      dataQualityStatus: request.dataQualityStatus || 'valid',
      approvedContentRef: request.approvedContentRef,
      contentFingerprint: request.contentFingerprint,
      subjectId: request.subjectId,
      topicId: request.topicId,
      skillId: request.skillId,
      objectiveId: request.objectiveId,
      targetType: request.targetType,
      targetRef: request.targetRef,
      attemptNumber: request.attemptNumber,
      timeSpentBucket: request.timeSpentBucket,
      difficultyBucket: request.difficultyBucket,
      supportNeed: request.supportNeed,
      hintLevel: request.hintLevel,
      hintDependencyBucket: request.hintDependencyBucket,
      mistakeCategory: request.mistakeCategory,
      misconceptionCategory: request.misconceptionCategory,
      recallQuality: request.recallQuality,
      explanationQualityBucket: request.explanationQualityBucket,
      reflectionQualityBucket: request.reflectionQualityBucket,
      readinessBucket: request.readinessBucket,
      masterySignal: request.masterySignal,
      weakTopicSignal: request.weakTopicSignal,
      revisionSignal: request.revisionSignal,
      growthProofSignal: request.growthProofSignal,
      policyDecision: 'allowed',
      safeReasonCodesJson: request.safeReasonCodes || [],
      safeEvidenceRefsJson: request.safeEvidenceRefs || [],
      safeMetadataJson: {},
      idempotencyKey,
    });
    refs.push(record.id);
    codes.push('evidence_persisted');

    safeLearningEvidenceAggregateService.updateAggregateFromEvidence(request, effectiveStatus);

    const outputCheck = safeLearningEvidencePrivacyGuard.rejectForbiddenEvidenceFields(record);
    if (outputCheck.allowed) {
      return {
        persisted: true,
        record,
        policyDecision: 'allowed',
        dataQualityStatus: 'valid',
        idempotencyKey,
        safeReasonCodes: codes,
        safeEvidenceRefs: refs,
      };
    }

    return {
      persisted: true,
      record: safeLearningEvidencePrivacyGuard.redactForbiddenEvidenceFields(record) as any,
      policyDecision: 'allowed',
      dataQualityStatus: 'valid',
      idempotencyKey,
      safeReasonCodes: codes.concat(['output_redacted_forbidden_fields']),
      safeEvidenceRefs: refs,
    };
  }
}

export const safeLearningEvidenceIngestionService = new SafeLearningEvidenceIngestionService();
