import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAccessRecipientRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';
import { FORBIDDEN_ACCESS_PREVIEW_FIELDS } from '../contracts/resultReportCardAccessContracts';
import {
  evaluateReportCardAccessRecipientResolutionPolicy,
} from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessSafetyService } from '../services/resultReportCardAccessSafetyService';

const audienceTypes = [
  'parent',
  'student',
  'teacher',
  'admin',
  'department_head',
] as const;

function makeRecipientInput(overrides?: Record<string, unknown>) {
  return {
    resultReportCardAccessGrantId: 'grant-1',
    audienceType: 'parent',
    safeRecipientSummary: 'Parent recipient for future access',
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
    ...overrides,
  };
}

describe('Package 15 — Recipient Boundary', () => {
  let recipientRepo: InMemoryResultReportCardAccessRecipientRepository;
  let safetyService: ResultReportCardAccessSafetyService;

  beforeEach(() => {
    recipientRepo = new InMemoryResultReportCardAccessRecipientRepository();
    safetyService = new ResultReportCardAccessSafetyService();
  });

  for (const audienceType of audienceTypes) {
    it(`recipient descriptor can be created for ${audienceType}-boundary future access`, async () => {
      const recipient = await recipientRepo.create(makeRecipientInput({ audienceType }));
      expect(recipient).toBeDefined();
      expect(recipient.audienceType).toBe(audienceType);
      expect(recipient.recipientStatus).toBe('draft');
    });
  }

  it('recipient descriptor cannot store raw email (checked by safety service)', () => {
    const result = safetyService.assertRecipientDescriptorSafe({ rawEmail: 'test@example.com' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RECIPIENT_DESCRIPTOR_UNSAFE');
  });

  it('recipient descriptor cannot store raw phone (checked by safety service)', () => {
    const result = safetyService.assertRecipientDescriptorSafe({ rawPhone: '+1234567890' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RECIPIENT_DESCRIPTOR_UNSAFE');
  });

  it('recipient descriptor cannot store password (checked by safety service)', () => {
    const result = safetyService.assertRecipientDescriptorSafe({ password: 'secret123' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RECIPIENT_DESCRIPTOR_UNSAFE');
  });

  it('recipient descriptor cannot store token (checked by safety service)', () => {
    const result = safetyService.assertRecipientDescriptorSafe({ accessToken: 'tok_abc123' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RECIPIENT_DESCRIPTOR_UNSAFE');
  });

  it('recipient descriptor cannot store notification payload (checked via FORBIDDEN_ACCESS_PREVIEW_FIELDS)', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('notificationPayload');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('emailPayload');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('smsPayload');
  });

  it('recipient can be validated', async () => {
    const recipient = await recipientRepo.create(makeRecipientInput());
    const validated = await recipientRepo.validate(recipient.resultReportCardAccessRecipientId);
    expect(validated.recipientStatus).toBe('validated');
    expect(validated.validatedAt).toBeTruthy();
  });

  it('recipient can be suppressed', async () => {
    const recipient = await recipientRepo.create(makeRecipientInput());
    const suppressed = await recipientRepo.suppress(recipient.resultReportCardAccessRecipientId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.recipientStatus).toBe('suppressed');
  });

  it('recipient can be revoked', async () => {
    const recipient = await recipientRepo.create(makeRecipientInput());
    const revoked = await recipientRepo.revoke(recipient.resultReportCardAccessRecipientId, 'POLICY_REVOKED', 'Revoked');
    expect(revoked.recipientStatus).toBe('revoked');
  });

  it('recipient can be blocked', async () => {
    const recipient = await recipientRepo.create(makeRecipientInput());
    const blocked = await recipientRepo.block(recipient.resultReportCardAccessRecipientId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.recipientStatus).toBe('blocked');
  });

  it('recipient can be voided', async () => {
    const recipient = await recipientRepo.create(makeRecipientInput());
    const voided = await recipientRepo.void(recipient.resultReportCardAccessRecipientId, 'USER_REQUEST', 'Voided');
    expect(voided.recipientStatus).toBe('void');
  });

  it('recipient resolution policy blocks student and parent', () => {
    const studentResult = evaluateReportCardAccessRecipientResolutionPolicy({ schoolId: 'school-1', actorRole: 'student' });
    expect(studentResult.allowed).toBe(false);

    const parentResult = evaluateReportCardAccessRecipientResolutionPolicy({ schoolId: 'school-1', actorRole: 'parent' });
    expect(parentResult.allowed).toBe(false);
  });

  it('recipient resolution policy allows teacher and admin', () => {
    const teacherResult = evaluateReportCardAccessRecipientResolutionPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(teacherResult.allowed).toBe(true);

    const adminResult = evaluateReportCardAccessRecipientResolutionPolicy({ schoolId: 'school-1', actorRole: 'admin' });
    expect(adminResult.allowed).toBe(true);
  });
});
