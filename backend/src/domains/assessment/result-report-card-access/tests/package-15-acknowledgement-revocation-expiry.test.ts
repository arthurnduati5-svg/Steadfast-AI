import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAccessAcknowledgementRepository,
  InMemoryResultReportCardAccessRevocationRepository,
  InMemoryResultReportCardAccessExpiryRepository,
  InMemoryResultReportCardAccessAuditRepository,
  InMemoryResultReportCardAccessIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';
import { ResultReportCardAccessAcknowledgementService } from '../services/resultReportCardAccessAcknowledgementService';
import { ResultReportCardAccessRevocationService } from '../services/resultReportCardAccessRevocationService';
import { ResultReportCardAccessExpiryService } from '../services/resultReportCardAccessExpiryService';
import { ResultReportCardAccessAuditBridge } from '../services/resultReportCardAccessAuditBridge';
import { ResultReportCardAccessIdempotencyService } from '../services/resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessSafetyService } from '../services/resultReportCardAccessSafetyService';
import type { ResultReportCardAccessCommandContext } from '../contracts/resultReportCardAccessContracts';

const ctx: ResultReportCardAccessCommandContext = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'teacher',
  correlationId: 'corr-1',
  idempotencyKey: 'idem-1',
};

const GRANT_ID = 'grant-1';
const RECIPIENT_ID = 'recipient-1';
const PREVIEW_ID = 'preview-1';

describe('Package 15 — Acknowledgement Revocation Expiry', () => {
  let ackRepo: InMemoryResultReportCardAccessAcknowledgementRepository;
  let revocationRepo: InMemoryResultReportCardAccessRevocationRepository;
  let expiryRepo: InMemoryResultReportCardAccessExpiryRepository;
  let auditRepo: InMemoryResultReportCardAccessAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardAccessIdempotencyRepository;
  let auditBridge: ResultReportCardAccessAuditBridge;
  let idempotencyService: ResultReportCardAccessIdempotencyService;
  let ackService: ResultReportCardAccessAcknowledgementService;
  let revocationService: ResultReportCardAccessRevocationService;
  let expiryService: ResultReportCardAccessExpiryService;
  let safetyService: ResultReportCardAccessSafetyService;

  beforeEach(() => {
    ackRepo = new InMemoryResultReportCardAccessAcknowledgementRepository();
    revocationRepo = new InMemoryResultReportCardAccessRevocationRepository();
    expiryRepo = new InMemoryResultReportCardAccessExpiryRepository();
    auditRepo = new InMemoryResultReportCardAccessAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardAccessIdempotencyRepository();
    auditBridge = new ResultReportCardAccessAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardAccessIdempotencyService(idempotencyRepo);
    ackService = new ResultReportCardAccessAcknowledgementService(ackRepo, auditBridge, idempotencyService);
    revocationService = new ResultReportCardAccessRevocationService(revocationRepo, auditBridge, idempotencyService);
    expiryService = new ResultReportCardAccessExpiryService(expiryRepo, auditBridge, idempotencyService);
    safetyService = new ResultReportCardAccessSafetyService();
  });

  describe('Acknowledgement', () => {
    it('dry-run acknowledgement can be recorded', async () => {
      const result = await ackService.recordAccessAcknowledgement(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        resultReportCardAccessRecipientId: RECIPIENT_ID,
        resultReportCardPortalPreviewId: PREVIEW_ID,
        acknowledgementType: 'dry_run_acknowledgement',
        safeAcknowledgementSummary: 'Dry run acknowledgement for mock preview',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('created');
      expect(result.resourceId).toBeTruthy();
    });

    it('acknowledgement contains safe metadata only', () => {
      const safe = safetyService.assertAcknowledgementSafe({
        resultReportCardAccessAcknowledgementId: 'ack-1',
        acknowledgementType: 'dry_run_acknowledgement',
        safeAcknowledgementSummary: 'safe',
      });
      expect(safe.allowed).toBe(true);

      const unsafe = safetyService.assertAcknowledgementSafe({
        ...safe,
        pdfBinary: Buffer.from('pdf'),
      });
      expect(unsafe.allowed).toBe(false);
      expect(unsafe.reasonCode).toBe('ACKNOWLEDGEMENT_UNSAFE');
    });

    it('acknowledgement can be blocked', async () => {
      const created = await ackService.recordAccessAcknowledgement(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        resultReportCardAccessRecipientId: RECIPIENT_ID,
        resultReportCardPortalPreviewId: PREVIEW_ID,
        acknowledgementType: 'mock_preview_ready',
        safeAcknowledgementSummary: 'Mock preview ready acknowledgement',
      });
      const result = await ackService.blockAccessAcknowledgement(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('blocked');
    });

    it('acknowledgement can be voided', async () => {
      const created = await ackService.recordAccessAcknowledgement(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        resultReportCardAccessRecipientId: RECIPIENT_ID,
        resultReportCardPortalPreviewId: PREVIEW_ID,
        acknowledgementType: 'access_readiness_receipt',
        safeAcknowledgementSummary: 'Access readiness receipt',
      });
      const result = await ackService.voidAccessAcknowledgement(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('void');
    });
  });

  describe('Revocation', () => {
    it('revocation can be created', async () => {
      const result = await revocationService.createRevocation(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        revocationScope: 'grant',
        revocationReason: 'Parent requested removal',
        safeRevocationSummary: 'Revocation of access grant for parent',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
      expect(result.resourceId).toBeTruthy();
    });

    it('revocation can be applied', async () => {
      const created = await revocationService.createRevocation(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        revocationScope: 'recipient',
        revocationReason: 'Recipient no longer eligible',
        safeRevocationSummary: 'Revocation of recipient access',
      });
      const result = await revocationService.applyRevocation(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('applied');
    });

    it('revocation can be voided', async () => {
      const created = await revocationService.createRevocation(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        revocationScope: 'preview',
        revocationReason: 'Preview was regenerated',
        safeRevocationSummary: 'Void revocation test',
      });
      const result = await revocationService.voidRevocation(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('void');
    });
  });

  describe('Expiry', () => {
    it('expiry can be created', async () => {
      const result = await expiryService.createExpiry(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        expiryScope: 'grant',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        safeExpirySummary: 'Expiry set for 24 hours',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
      expect(result.resourceId).toBeTruthy();
    });

    it('expiry can be scheduled', async () => {
      const created = await expiryService.createExpiry(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        expiryScope: 'grant',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        safeExpirySummary: 'Schedule expiry test',
      });
      const result = await expiryService.scheduleExpiry(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('scheduled');
    });

    it('expiry can be applied', async () => {
      const created = await expiryService.createExpiry(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        expiryScope: 'grant',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        safeExpirySummary: 'Apply expiry test',
      });
      await expiryService.scheduleExpiry(ctx, created.resourceId!);
      const result = await expiryService.applyExpiry(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('applied');
    });

    it('expiry can be cancelled', async () => {
      const created = await expiryService.createExpiry(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        expiryScope: 'grant',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        safeExpirySummary: 'Cancel expiry test',
      });
      const result = await expiryService.cancelExpiry(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('cancelled');
    });

    it('expiry can be voided', async () => {
      const created = await expiryService.createExpiry(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        expiryScope: 'grant',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        safeExpirySummary: 'Void expiry test',
      });
      const result = await expiryService.voidExpiry(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('void');
    });

    it('expiry does not schedule worker', () => {
      const expirySource = require('fs').readFileSync(
        require('path').join(__dirname, '../services/resultReportCardAccessExpiryService.ts'),
        'utf-8'
      );
      expect(expirySource).not.toContain('setTimeout');
      expect(expirySource).not.toContain('setInterval');
      expect(expirySource).not.toContain('worker');
      expect(expirySource).not.toContain('scheduler');
      expect(expirySource).not.toContain('cron');
    });

    it('expiry does not revoke live portal sessions', () => {
      const expirySource = require('fs').readFileSync(
        require('path').join(__dirname, '../services/resultReportCardAccessExpiryService.ts'),
        'utf-8'
      );
      expect(expirySource).not.toContain('revokeSession');
      expect(expirySource).not.toContain('livePortal');
      expect(expirySource).not.toContain('invalidateToken');
      expect(expirySource).not.toContain('signOut');
    });
  });
});
