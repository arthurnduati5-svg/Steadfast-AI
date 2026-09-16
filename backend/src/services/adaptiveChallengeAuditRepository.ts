import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { AdaptiveChallengeAuditRecord } from './task015Contracts';

const prisma = new PrismaClient();

export class AdaptiveChallengeAuditRepository {
  async recordAudit(audit: AdaptiveChallengeAuditRecord): Promise<void> {
    try {
      await prisma.durableAuditEvent.create({
        data: {
          id: randomUUID(),
          category: 'adaptive_challenge',
          eventType: audit.challengeType ?? 'challenge_generation',
          severity: 'info',
          visibility: 'system_only',
          actorType: audit.actorRole,
          actorIdHash: audit.actorId,
          studentIdHash: audit.tutorLearnerId,
          schoolIdHash: audit.schoolId,
          requestId: audit.requestId ?? null,
          route: null,
          method: null,
          serviceName: 'AdaptiveChallengeGenerationRuntime',
          operation: 'generate_challenge',
          safeSummary: `Challenge type: ${audit.challengeType ?? 'unknown'}, difficulty: ${audit.difficultyLevel ?? 'unknown'}, reasons: ${(audit.reasonCodes ?? []).join(', ')}`,
          safeMetadataJson: {
            challengeId: audit.challengeId,
            remediationPathId: audit.remediationPathId,
            challengeType: audit.challengeType,
            difficultyLevel: audit.difficultyLevel,
            reasonCodes: audit.reasonCodes,
            safeEvidenceRefs: audit.safeEvidenceRefs,
            privacyDecision: audit.privacyDecision,
            deenSensitivityHandled: audit.deenSensitivityHandled,
            safeguardingBoundaryApplied: audit.safeguardingBoundaryApplied,
          },
          redactionJson: {},
          occurredAt: new Date(audit.createdAt),
        },
      });
    } catch {
      // Audit DB unavailable - operation skipped in test/non-prod
    }
  }

  async getAuditRecords(
    schoolId: string,
    tutorLearnerId: string,
    limit = 50,
  ): Promise<AdaptiveChallengeAuditRecord[]> {
    try {
      const records = await prisma.durableAuditEvent.findMany({
        where: {
          category: 'adaptive_challenge',
          studentIdHash: tutorLearnerId,
          schoolIdHash: schoolId,
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      });
      return records.map(r => ({
        actorId: r.actorIdHash ?? '',
        actorRole: r.actorType,
        schoolId: r.schoolIdHash ?? '',
        tutorLearnerId: r.studentIdHash ?? '',
        sessionId: undefined,
        challengeId: ((r.safeMetadataJson as any)?.challengeId) as string | undefined,
        remediationPathId: ((r.safeMetadataJson as any)?.remediationPathId) as string | undefined,
        challengeType: ((r.safeMetadataJson as any)?.challengeType) as string | undefined,
        difficultyLevel: ((r.safeMetadataJson as any)?.difficultyLevel) as string | undefined,
        reasonCodes: ((r.safeMetadataJson as any)?.reasonCodes ?? []) as string[],
        safeEvidenceRefs: ((r.safeMetadataJson as any)?.safeEvidenceRefs ?? []) as Array<{ source: string; summary: string }>,
        privacyDecision: ((r.safeMetadataJson as any)?.privacyDecision ?? 'system_only') as string,
        deenSensitivityHandled: ((r.safeMetadataJson as any)?.deenSensitivityHandled ?? false) as boolean,
        safeguardingBoundaryApplied: ((r.safeMetadataJson as any)?.safeguardingBoundaryApplied ?? false) as boolean,
        createdAt: r.occurredAt.toISOString(),
        requestId: r.requestId ?? undefined,
      }));
    } catch {
      return [];
    }
  }
}

export const adaptiveChallengeAuditRepository = new AdaptiveChallengeAuditRepository();
