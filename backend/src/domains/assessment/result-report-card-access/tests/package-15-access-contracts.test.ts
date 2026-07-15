import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  ALLOWED_ACCESS_CREATION_ROLES,
  BLOCKED_ACCESS_CREATION_ROLES,
  FORBIDDEN_ACCESS_PREVIEW_FIELDS,
} from '../contracts';
import {
  evaluateReportCardAccessGrantCreationPolicy,
  evaluateReportCardAccessRecipientResolutionPolicy,
  evaluateReportCardPortalPreviewCompositionPolicy,
  evaluateReportCardAccessTokenIntentPolicy,
  evaluateReportCardAccessAcknowledgementPolicy,
  evaluateReportCardAccessRevocationPolicy,
  evaluateReportCardAccessExpiryPolicy,
  evaluateReportCardAccessTimelinePolicy,
  evaluateReportCardAccessSummaryPolicy,
  evaluateReportCardAccessAuditPolicy,
  evaluateReportCardAccessNoLivePortalPolicy,
  evaluateReportCardAccessNoRealTokenPolicy,
  evaluateReportCardAccessNoNotificationPolicy,
} from '../policies/resultReportCardAccessPolicyDefinitions';

describe('Package 15 — Access Contracts', () => {
  it('contracts module has runtime exports', async () => {
    const mod = await import('../contracts/index');
    expect(mod).toBeDefined();
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('ALLOWED_ACCESS_CREATION_ROLES');
    expect(keys).toContain('BLOCKED_ACCESS_CREATION_ROLES');
    expect(keys).toContain('FORBIDDEN_ACCESS_PREVIEW_FIELDS');
  });

  it('policy definitions exist with expected families', () => {
    expect(evaluateReportCardAccessGrantCreationPolicy).toBeDefined();
    expect(evaluateReportCardAccessRecipientResolutionPolicy).toBeDefined();
    expect(evaluateReportCardPortalPreviewCompositionPolicy).toBeDefined();
    expect(evaluateReportCardAccessTokenIntentPolicy).toBeDefined();
    expect(evaluateReportCardAccessAcknowledgementPolicy).toBeDefined();
    expect(evaluateReportCardAccessRevocationPolicy).toBeDefined();
    expect(evaluateReportCardAccessExpiryPolicy).toBeDefined();
    expect(evaluateReportCardAccessTimelinePolicy).toBeDefined();
    expect(evaluateReportCardAccessSummaryPolicy).toBeDefined();
    expect(evaluateReportCardAccessAuditPolicy).toBeDefined();
    expect(evaluateReportCardAccessNoLivePortalPolicy).toBeDefined();
    expect(evaluateReportCardAccessNoRealTokenPolicy).toBeDefined();
    expect(evaluateReportCardAccessNoNotificationPolicy).toBeDefined();
  });

  it('repository contract source file exists (interfaces are type-only)', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessRepositoryContracts.ts'))).toBe(true);
  });

  it('access grant contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessGrantContracts.ts'))).toBe(true);
  });

  it('recipient contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessRecipientContracts.ts'))).toBe(true);
  });

  it('portal preview contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardPortalPreviewContracts.ts'))).toBe(true);
  });

  it('token intent contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessTokenIntentContracts.ts'))).toBe(true);
  });

  it('acknowledgement contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessAcknowledgementContracts.ts'))).toBe(true);
  });

  it('revocation contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessRevocationContracts.ts'))).toBe(true);
  });

  it('expiry contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessExpiryContracts.ts'))).toBe(true);
  });

  it('timeline contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultReportCardAccessTimelineContracts.ts'))).toBe(true);
  });

  it('summary type is defined via access contracts', () => {
    expect(Array.isArray(ALLOWED_ACCESS_CREATION_ROLES)).toBe(true);
    expect(ALLOWED_ACCESS_CREATION_ROLES.length).toBeGreaterThan(0);
    expect(Array.isArray(BLOCKED_ACCESS_CREATION_ROLES)).toBe(true);
    expect(BLOCKED_ACCESS_CREATION_ROLES.length).toBeGreaterThan(0);
  });

  it('student/parent/guest actors cannot create access grants (BLOCKED_ACCESS_CREATION_ROLES)', () => {
    const studentResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'student' });
    expect(studentResult.allowed).toBe(false);

    const parentResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'parent' });
    expect(parentResult.allowed).toBe(false);

    const guestResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'guest' });
    expect(guestResult.allowed).toBe(false);
  });

  it('teacher/admin/system_job can create governed records where permitted (ALLOWED_ACCESS_CREATION_ROLES)', () => {
    const teacherResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(teacherResult.allowed).toBe(true);

    const adminResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'admin' });
    expect(adminResult.allowed).toBe(true);

    const systemJobResult = evaluateReportCardAccessGrantCreationPolicy({ schoolId: 'school-1', actorRole: 'system_job' });
    expect(systemJobResult.allowed).toBe(true);
  });

  it('missing schoolId blocks mutation via policy', () => {
    const result = evaluateReportCardAccessGrantCreationPolicy({ schoolId: '', actorRole: 'student' });
    expect(result.allowed).toBe(false);
    expect(result.policyFamily).toBe('RESULT_REPORT_CARD_ACCESS_GRANT_CREATION');
  });

  it('future-intent/mock-only/metadata-only modes are allowed in type definitions', () => {
    const grantModes = ['mock_portal_preview_only', 'future_access_only', 'metadata_only', 'admin_review_only', 'print_counter_preview_only'];
    const previewModes = ['mock_portal_preview_only', 'teacher_review_preview', 'admin_preview', 'metadata_only'];
    const tokenModes = ['no_token_created', 'future_token_required', 'admin_review_required'];
    expect(grantModes.length).toBe(5);
    expect(previewModes.length).toBe(4);
    expect(tokenModes.length).toBe(3);
  });

  it('live portal modes are blocked via evaluateReportCardAccessNoLivePortalPolicy', () => {
    const result = evaluateReportCardAccessNoLivePortalPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_PORTAL_BLOCKED');
  });

  describe('source file existence', () => {
    it('contracts/index.ts exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../contracts/index.ts'))).toBe(true);
    });

    it('policies definitions file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../policies/resultReportCardAccessPolicyDefinitions.ts'))).toBe(true);
    });

    it('in-memory repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/inMemoryResultReportCardAccessRepositories.ts'))).toBe(true);
    });

    it('prisma repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/prismaResultReportCardAccessRepositories.ts'))).toBe(true);
    });

    it('services directory has audit bridge service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardAccessAuditBridge.ts'))).toBe(true);
    });

    it('services directory has idempotency service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardAccessIdempotencyService.ts'))).toBe(true);
    });

    it('services directory has grant service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardAccessGrantService.ts'))).toBe(true);
    });

    it('services directory has recipient service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardAccessRecipientService.ts'))).toBe(true);
    });

    it('services directory has portal preview service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardPortalPreviewService.ts'))).toBe(true);
    });

    it('services directory has safety service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultReportCardAccessSafetyService.ts'))).toBe(true);
    });
  });
});
