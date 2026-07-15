import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAccessGrantRepository,
  InMemoryResultReportCardAccessRecipientRepository,
  InMemoryResultReportCardPortalPreviewRepository,
  InMemoryResultReportCardAccessTokenIntentRepository,
  InMemoryResultReportCardAccessAcknowledgementRepository,
  InMemoryResultReportCardAccessRevocationRepository,
  InMemoryResultReportCardAccessExpiryRepository,
  InMemoryResultReportCardAccessTimelineRepository,
  InMemoryResultReportCardAccessAuditRepository,
  InMemoryResultReportCardAccessIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';

function makeCreateInput() {
  return {
    resultReportCardAssemblyId: 'assembly-1',
    resultReportCardAudienceProjectionId: 'projection-1',
    resultReportCardReviewId: 'review-1',
    studentRef: 'student-1',
    audienceType: 'student',
    resultReportCardExportJobId: 'job-1',
    resultReportCardExportTargetId: 'target-1',
    resultReportCardExportEnvelopeId: 'env-1',
    resultReleasePacketId: 'packet-1',
    paperId: 'paper-1',
    paperVersionId: 'paper-v1',
    deliverySessionId: 'session-1',
    grantMode: 'future_access_only' as const,
    grantPurpose: 'parent-portal-future-access',
    safeGrantSummary: 'Access grant for parent portal future access',
    sourceRefsJson: { exportJobId: 'job-1', exportEnvelopeId: 'env-1', exportReceiptId: 'rec-1', archiveManifestId: 'arch-1' } as Record<string, unknown>,
    allowedChannelsJson: { parent_portal_future: true } as Record<string, unknown>,
    blockedChannelsJson: {} as Record<string, unknown>,
    blockedReasonCodesJson: {} as Record<string, unknown>,
  };
}

describe('Package 15 — Access Grant Lifecycle', () => {
  let grantRepo: InMemoryResultReportCardAccessGrantRepository;

  beforeEach(() => {
    grantRepo = new InMemoryResultReportCardAccessGrantRepository();
  });

  it('can create access grant from readiness references', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(grant).toBeDefined();
    expect(grant.resultReportCardAccessGrantId).toBeTruthy();
    expect(grant.grantStatus).toBe('draft');
    expect(grant.schoolId).toBe('school-1');
    expect(grant.studentRef).toBe('student-1');
    expect(grant.sourceRefsJson).toEqual({ exportJobId: 'job-1', exportEnvelopeId: 'env-1', exportReceiptId: 'rec-1', archiveManifestId: 'arch-1' });
  });

  it('missing export job ref is NOT blocked at repository level (validation is service-level)', async () => {
    const input = { ...makeCreateInput(), sourceRefsJson: {} as Record<string, unknown> };
    const grant = await grantRepo.create({
      ...input,
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(grant).toBeDefined();
    expect(grant.sourceRefsJson).toEqual({});
  });

  it('missing export envelope ref is NOT blocked at repository level (validation is service-level)', async () => {
    const input = { ...makeCreateInput(), sourceRefsJson: { exportJobId: 'job-1' } as Record<string, unknown> };
    const grant = await grantRepo.create({
      ...input,
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(grant).toBeDefined();
    expect(grant.sourceRefsJson).toEqual({ exportJobId: 'job-1' });
  });

  it('missing receipt/archive manifest is NOT blocked at repository level (validation is service-level)', async () => {
    const input = { ...makeCreateInput(), sourceRefsJson: { exportJobId: 'job-1', exportEnvelopeId: 'env-1' } as Record<string, unknown> };
    const grant = await grantRepo.create({
      ...input,
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(grant).toBeDefined();
    expect(grant.sourceRefsJson).toEqual({ exportJobId: 'job-1', exportEnvelopeId: 'env-1' });
  });

  it('wrong school scope is blocked by filtering (list-only)', async () => {
    await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const wrongSchoolGrants = await grantRepo.listBySchool('school-99');
    expect(wrongSchoolGrants).toHaveLength(0);
    const sameSchoolGrants = await grantRepo.listBySchool('school-1');
    expect(sameSchoolGrants.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> validated -> ready_for_future_access', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(grant.grantStatus).toBe('draft');

    const validated = await grantRepo.updateStatus(grant.resultReportCardAccessGrantId, { status: 'validated', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Validated' });
    expect(validated.grantStatus).toBe('validated');
    expect(validated.validatedAt).toBeTruthy();

    const ready = await grantRepo.updateStatus(validated.resultReportCardAccessGrantId, { status: 'ready_for_future_access', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Ready for future access' });
    expect(ready.grantStatus).toBe('ready_for_future_access');
    expect(ready.readyAt).toBeTruthy();
  });

  it('access grant can be suppressed', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const suppressed = await grantRepo.suppress(grant.resultReportCardAccessGrantId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.grantStatus).toBe('suppressed');
    expect(suppressed.suppressedAt).toBeTruthy();
  });

  it('access grant can be revoked', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const revoked = await grantRepo.revoke(grant.resultReportCardAccessGrantId, 'POLICY_REVOKED', 'Revoked');
    expect(revoked.grantStatus).toBe('revoked');
    expect(revoked.revokedAt).toBeTruthy();
  });

  it('access grant can be expired', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const expired = await grantRepo.expire(grant.resultReportCardAccessGrantId, 'POLICY_EXPIRED', 'Expired');
    expect(expired.grantStatus).toBe('expired');
    expect(expired.expiredAt).toBeTruthy();
  });

  it('access grant can be blocked', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await grantRepo.block(grant.resultReportCardAccessGrantId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.grantStatus).toBe('blocked');
    expect(blocked.blockedAt).toBeTruthy();
  });

  it('access grant can be voided', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await grantRepo.void(grant.resultReportCardAccessGrantId, 'USER_REQUEST', 'Voided');
    expect(voided.grantStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('access grant does not create live URLs', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardAccessGrantRepository.prototype);
    expect(methods).not.toContain('createLiveUrl');
    expect(methods).not.toContain('generatePortalUrl');
    expect(methods).not.toContain('publishUrl');
  });

  it('access grant does not generate real tokens', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardAccessGrantRepository.prototype);
    expect(methods).not.toContain('generateToken');
    expect(methods).not.toContain('createToken');
    expect(methods).not.toContain('issueToken');
  });

  it('access grant does not send notifications', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultReportCardAccessGrantRepository.prototype);
    expect(methods).not.toContain('sendNotification');
    expect(methods).not.toContain('sendEmail');
    expect(methods).not.toContain('sendSms');
    expect(methods).not.toContain('notify');
  });

  it('access grant does not mutate Package 14 records (only operates on its own)', async () => {
    const grant = await grantRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const updated = await grantRepo.update(grant.resultReportCardAccessGrantId, { safeGrantSummary: 'Updated summary' });
    expect(updated.safeGrantSummary).toBe('Updated summary');
    expect(updated.resultReportCardAssemblyId).toBe('assembly-1');
    expect(updated).not.toHaveProperty('exportJobStatus');
    expect(updated).not.toHaveProperty('envelopeStatus');
  });
});
