import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEvidenceBundleRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseEvidenceBundleService } from '../services/recoveryCaseEvidenceBundleService';
import { RecoveryCaseAdjudicationCommandContext, ADJUDICATION_GOVERNANCE_POLICY_VERSION } from '../contracts';

function makeCtx(overrides?: Partial<RecoveryCaseAdjudicationCommandContext>): RecoveryCaseAdjudicationCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
    ...overrides,
  };
}

describe('Package 26 - Evidence Bundle Integrity', () => {
  let repo: InMemoryEvidenceBundleRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseEvidenceBundleService;

  beforeEach(() => {
    repo = new InMemoryEvidenceBundleRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseEvidenceBundleService(repo, auditRepo);
  });

  it('create evidence bundle', async () => {
    const result = await service.createEvidenceBundle(makeCtx(), {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      sourceRefs: { worksheetId: 'ws-1', rubricId: 'rb-1' },
      safeEvidenceItems: [{ item: 'answer sheet' }],
      sourceUpdatedAt: { worksheetId: '2026-07-01T00:00:00Z' },
      safeBundleSummary: 'Evidence bundle test',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
    expect(result.data!.evidenceBundleId).toBeTruthy();
  });

  it('same canonical inputs produce same SHA-256 digest', async () => {
    const input1 = {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      safeSourceReferences: { rubricId: 'rb-1', worksheetId: 'ws-1' } as Record<string, string>,
      sourceTimestamps: { worksheetId: '2026-07-01T00:00:00Z', rubricId: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    const input2 = {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      safeSourceReferences: { worksheetId: 'ws-1', rubricId: 'rb-1' } as Record<string, string>,
      sourceTimestamps: { rubricId: '2026-07-01T00:00:00Z', worksheetId: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    const digest1 = service.calculateEvidenceDigest(input1);
    const digest2 = service.calculateEvidenceDigest(input2);
    expect(digest1).toBe(digest2);
  });

  it('different queue item produces different digest', async () => {
    const input1 = {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      safeSourceReferences: { worksheetId: 'ws-1' } as Record<string, string>,
      sourceTimestamps: { worksheetId: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    const input2 = {
      schoolId: 'school-1',
      queueItemId: 'queue-2',
      safeSourceReferences: { worksheetId: 'ws-1' } as Record<string, string>,
      sourceTimestamps: { worksheetId: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    expect(service.calculateEvidenceDigest(input1)).not.toBe(service.calculateEvidenceDigest(input2));
  });

  it('sorting source-reference keys does not change digest', async () => {
    const input = {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      safeSourceReferences: { zKey: 'z-val', aKey: 'a-val' } as Record<string, string>,
      sourceTimestamps: { zKey: '2026-07-01T00:00:00Z', aKey: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    const canonical = service.canonicalizeEvidenceDigestInput(input);
    const parsed = JSON.parse(canonical);
    const refKeys = Object.keys(parsed.safeSourceReferences);
    const tsKeys = Object.keys(parsed.sourceTimestamps);
    expect(refKeys).toEqual(refKeys.slice().sort());
    expect(tsKeys).toEqual(tsKeys.slice().sort());
  });

  it('changing a source timestamp changes digest', async () => {
    const baseInput = {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      safeSourceReferences: { worksheetId: 'ws-1' } as Record<string, string>,
      sourceTimestamps: { worksheetId: '2026-07-01T00:00:00Z' },
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    };
    const changedInput = {
      ...baseInput,
      sourceTimestamps: { worksheetId: '2026-07-02T00:00:00Z' },
    };
    expect(service.calculateEvidenceDigest(baseInput)).not.toBe(service.calculateEvidenceDigest(changedInput));
  });

  it('bundle can be marked stale', async () => {
    const result = await service.createEvidenceBundle(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', sourceRefs: {}, safeEvidenceItems: [], sourceUpdatedAt: {}, safeBundleSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const stale = await service.markEvidenceBundleStale(result.data!.evidenceBundleId);
    expect(stale.success).toBe(true);
    expect(stale.data!.bundleStatus).toBe('stale');
  });

  it('bundle can be blocked', async () => {
    const result = await service.createEvidenceBundle(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', sourceRefs: {}, safeEvidenceItems: [], sourceUpdatedAt: {}, safeBundleSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const blocked = await service.blockEvidenceBundle(result.data!.evidenceBundleId, ['integrity_failure']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.bundleStatus).toBe('blocked');
  });

  it('bundle can be voided', async () => {
    const result = await service.createEvidenceBundle(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', sourceRefs: {}, safeEvidenceItems: [], sourceUpdatedAt: {}, safeBundleSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const voided = await service.voidEvidenceBundle(result.data!.evidenceBundleId);
    expect(voided.success).toBe(true);
    expect(voided.data!.bundleStatus).toBe('void');
  });

  it('digest algorithm is SHA-256', async () => {
    const bundle = await repo.create({
      schoolId: 'school-1', queueItemId: 'q1', sourceRefs: {}, safeEvidenceItems: [], sourceUpdatedAt: {}, safeBundleSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(bundle.digestAlgorithm).toBe('SHA-256');
  });

  it('bundle status starts as draft', async () => {
    const bundle = await repo.create({
      schoolId: 'school-1', queueItemId: 'q1', sourceRefs: {}, safeEvidenceItems: [], sourceUpdatedAt: {}, safeBundleSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(bundle.bundleStatus).toBe('draft');
  });
});
