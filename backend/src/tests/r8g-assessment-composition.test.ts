import { describe, it, expect, vi } from 'vitest';

// Explicit test-only Prisma module stub: composition assertions verify which
// repository classes the production factories instantiate, never a live DB.
vi.mock('../lib/prisma', () => ({ default: {}, prisma: {} }));

/**
 * R8-G production composition proof: the retained rewired assessment HTTP
 * routes (exam delivery, result evidence bridge, result governance, result
 * delivery) default to durable Prisma repositories. In-memory repositories
 * remain available only through the explicit test-injection seams. These are
 * construction assertions (no database I/O): they prove production can no
 * longer silently serve this canonical assessment state from process memory.
 * Recovery triage / outcome-action / simulation conversions were reverted
 * pending durability-intent proof (see stabilization report).
 */
describe('R8-G assessment durable composition', () => {
  it('exam-delivery production repos are Prisma-backed', async () => {
    const { buildProductionExamDeliveryRepositories } = await import('../routes/examDelivery');
    const {
      PrismaExamDeliverySessionRepository,
      PrismaExamAttemptRepository,
    } = await import(
      '../domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories'
    );
    const repos = buildProductionExamDeliveryRepositories();
    expect(repos.sessionRepository).toBeInstanceOf(PrismaExamDeliverySessionRepository);
    expect(repos.attemptRepository).toBeInstanceOf(PrismaExamAttemptRepository);
  });

  it('result-learning-evidence production repos are Prisma-backed', async () => {
    const { buildProductionResultLearningEvidenceRepos } = await import(
      '../routes/resultLearningEvidence'
    );
    const {
      PrismaResultLearningEvidenceBridgeRepository,
      PrismaResultLearningEvidenceIdempotencyRepository,
    } = await import(
      '../domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories'
    );
    const repos = buildProductionResultLearningEvidenceRepos();
    expect(repos.bridgeRepo).toBeInstanceOf(PrismaResultLearningEvidenceBridgeRepository);
    expect(repos.idempotencyRepo).toBeInstanceOf(PrismaResultLearningEvidenceIdempotencyRepository);
  });

  it('result-governance production repos are Prisma-backed', async () => {
    const { buildProductionResultGovernanceRepos } = await import('../routes/resultGovernance');
    const {
      PrismaResultFinalizationDecisionRepository,
      PrismaResultGovernanceAuditRepository,
    } = await import(
      '../domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories'
    );
    const repos = buildProductionResultGovernanceRepos();
    expect(repos.decisionRepo).toBeInstanceOf(PrismaResultFinalizationDecisionRepository);
    expect(repos.auditRepo).toBeInstanceOf(PrismaResultGovernanceAuditRepository);
  });

  it('result-delivery production repos are Prisma-backed', async () => {
    const { buildProductionResultDeliveryRepos } = await import('../routes/resultDelivery');
    const {
      PrismaResultDeliveryJobRepository,
      PrismaResultDeliveryIdempotencyRepository,
    } = await import(
      '../domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories'
    );
    const repos = buildProductionResultDeliveryRepos();
    expect(repos.jobRepo).toBeInstanceOf(PrismaResultDeliveryJobRepository);
    expect(repos.idempotencyRepo).toBeInstanceOf(PrismaResultDeliveryIdempotencyRepository);
  });

});
