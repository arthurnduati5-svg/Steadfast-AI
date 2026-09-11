import { describe, it, expect, vi } from 'vitest';

// Explicit test-only Prisma module stub: composition assertions verify which
// repository classes the production factory instantiates, never a live DB.
vi.mock('../../../../lib/prisma', () => ({ prisma: {} }));

import {
  buildProductionResultReleaseDependencies,
  createResultReleaseRouter,
} from '../../../../routes/resultRelease';
import {
  PrismaResultReleasePacketRepository,
  PrismaResultReleaseApprovalRepository,
  PrismaResultAudienceProjectionRepository,
  PrismaStudentResultReportSnapshotRepository,
  PrismaParentSafeResultSummaryRepository,
  PrismaStudentSafeResultSummaryRepository,
  PrismaResultReleaseDeliveryIntentRepository,
  PrismaResultReleaseAuditRepository,
  PrismaResultReleaseIdempotencyRepository,
  PrismaResultReleaseApprovalAtomicCommitter,
} from '../repositories/prismaResultReleaseRepositories';
import {
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseApprovalRepository,
  InMemoryResultAudienceProjectionRepository,
  InMemoryStudentResultReportSnapshotRepository,
  InMemoryParentSafeResultSummaryRepository,
  InMemoryStudentSafeResultSummaryRepository,
  InMemoryResultReleaseDeliveryIntentRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
  InMemoryResultReleaseApprovalAtomicCommitter,
} from '../repositories/inMemoryResultReleaseRepositories';
import { readBackendSrcFile } from '../../../../test-utils/repositoryPaths';

describe('R8-F result-release production composition', () => {
  it('default dependencies use Prisma repositories', () => {
    const deps = buildProductionResultReleaseDependencies();
    expect(deps.packetRepo).toBeInstanceOf(PrismaResultReleasePacketRepository);
    expect(deps.approvalRepo).toBeInstanceOf(PrismaResultReleaseApprovalRepository);
    expect(deps.projectionRepo).toBeInstanceOf(PrismaResultAudienceProjectionRepository);
    expect(deps.reportSnapshotRepo).toBeInstanceOf(PrismaStudentResultReportSnapshotRepository);
    expect(deps.parentSummaryRepo).toBeInstanceOf(PrismaParentSafeResultSummaryRepository);
    expect(deps.studentSummaryRepo).toBeInstanceOf(PrismaStudentSafeResultSummaryRepository);
    expect(deps.deliveryIntentRepo).toBeInstanceOf(PrismaResultReleaseDeliveryIntentRepository);
    expect(deps.auditRepo).toBeInstanceOf(PrismaResultReleaseAuditRepository);
    expect(deps.idempotencyRepo).toBeInstanceOf(PrismaResultReleaseIdempotencyRepository);
  });

  it('default atomic committer is PrismaResultReleaseApprovalAtomicCommitter', () => {
    const deps = buildProductionResultReleaseDependencies();
    expect(deps.atomicCommitter).toBeInstanceOf(PrismaResultReleaseApprovalAtomicCommitter);
  });

  it('in-memory composition exists only through explicit test injection', () => {
    const approvalRepo = new InMemoryResultReleaseApprovalRepository();
    const packetRepo = new InMemoryResultReleasePacketRepository();
    const auditRepo = new InMemoryResultReleaseAuditRepository();
    const router = createResultReleaseRouter({
      packetRepo,
      approvalRepo,
      projectionRepo: new InMemoryResultAudienceProjectionRepository(),
      reportSnapshotRepo: new InMemoryStudentResultReportSnapshotRepository(),
      parentSummaryRepo: new InMemoryParentSafeResultSummaryRepository(),
      studentSummaryRepo: new InMemoryStudentSafeResultSummaryRepository(),
      deliveryIntentRepo: new InMemoryResultReleaseDeliveryIntentRepository(),
      auditRepo,
      idempotencyRepo: new InMemoryResultReleaseIdempotencyRepository(),
      atomicCommitter: new InMemoryResultReleaseApprovalAtomicCommitter(approvalRepo, packetRepo, auditRepo),
    });
    expect(typeof router).toBe('function');
    expect(typeof (router as any).stack).toBe('object');
  });

  it('production route source has no in-memory default and no silent fallback', () => {
    const src = readBackendSrcFile('routes/resultRelease.ts');
    expect(src).not.toContain('new InMemory');
    expect(src).not.toContain('InMemoryResultRelease');
    expect(src).not.toContain('NODE_ENV');
    expect(src).toContain('PrismaResultReleaseApprovalAtomicCommitter');
    expect(src).toContain('buildProductionResultReleaseDependencies');
  });
});
