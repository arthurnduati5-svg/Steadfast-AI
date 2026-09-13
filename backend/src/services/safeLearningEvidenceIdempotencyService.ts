import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import type { SafeLearningEvidenceDeduplicationResult } from '../contracts/safeLearningEvidenceContracts';

export class SafeLearningEvidenceIdempotencyService {
  buildIdempotencyKey(params: {
    schoolId: string;
    studentId: string;
    sourceTask: string;
    sourceMode: string;
    evidenceType: string;
    turnId?: string;
    modeSessionId?: string;
    targetRef?: string;
    attemptNumber?: number;
    explicitKey?: string;
  }): string {
    if (params.explicitKey) return params.explicitKey;
    const parts = [
      params.schoolId,
      params.studentId,
      params.sourceTask,
      params.sourceMode,
      params.evidenceType,
      params.turnId || '',
      params.modeSessionId || '',
      params.targetRef || '',
      String(params.attemptNumber ?? 0),
    ];
    return parts.join('::');
  }

  detectDuplicate(idempotencyKey: string): SafeLearningEvidenceDeduplicationResult {
    const existing = safeLearningEvidenceRepository.findEvidenceByIdempotencyKey(idempotencyKey);
    if (existing) {
      return {
        duplicate: true,
        policyDecision: 'duplicate_ignored',
        safeReasonCodes: ['duplicate_idempotency_key'],
      };
    }
    return {
      duplicate: false,
      policyDecision: 'allowed',
      safeReasonCodes: ['idempotency_key_unique'],
    };
  }

  isDuplicate(idempotencyKey: string): boolean {
    return this.detectDuplicate(idempotencyKey).duplicate;
  }
}

export const safeLearningEvidenceIdempotencyService = new SafeLearningEvidenceIdempotencyService();
