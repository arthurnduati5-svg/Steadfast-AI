import type { AdaptiveChallengeAuditRecord } from './task015Contracts';
import { adaptiveChallengeAuditRepository } from './adaptiveChallengeAuditRepository';

export class AdaptiveChallengeAuditService {
  async record(audit: AdaptiveChallengeAuditRecord): Promise<void> {
    await adaptiveChallengeAuditRepository.recordAudit(audit);
  }

  async getAuditRecords(schoolId: string, tutorLearnerId: string, limit = 50): Promise<AdaptiveChallengeAuditRecord[]> {
    return adaptiveChallengeAuditRepository.getAuditRecords(schoolId, tutorLearnerId, limit);
  }
}

export const adaptiveChallengeAuditService = new AdaptiveChallengeAuditService();
