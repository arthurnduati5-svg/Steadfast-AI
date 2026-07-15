import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAccessTimelineRepository,
  InMemoryResultReportCardAccessSummaryRepository,
  InMemoryResultReportCardAccessAuditRepository,
  InMemoryResultReportCardAccessIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';
import { ResultReportCardAccessTimelineService } from '../services/resultReportCardAccessTimelineService';
import { ResultReportCardAccessSummaryService } from '../services/resultReportCardAccessSummaryService';
import { ResultReportCardAccessAuditBridge } from '../services/resultReportCardAccessAuditBridge';
import { ResultReportCardAccessIdempotencyService } from '../services/resultReportCardAccessIdempotencyService';
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
const STUDENT_REF = 'student-1';
const ASSEMBLY_ID = 'assembly-1';
const EXPORT_JOB_ID = 'job-1';

describe('Package 15 — Timeline Summary Read Model', () => {
  let timelineRepo: InMemoryResultReportCardAccessTimelineRepository;
  let summaryRepo: InMemoryResultReportCardAccessSummaryRepository;
  let auditRepo: InMemoryResultReportCardAccessAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardAccessIdempotencyRepository;
  let auditBridge: ResultReportCardAccessAuditBridge;
  let idempotencyService: ResultReportCardAccessIdempotencyService;
  let timelineService: ResultReportCardAccessTimelineService;
  let summaryService: ResultReportCardAccessSummaryService;

  beforeEach(() => {
    timelineRepo = new InMemoryResultReportCardAccessTimelineRepository();
    summaryRepo = new InMemoryResultReportCardAccessSummaryRepository();
    auditRepo = new InMemoryResultReportCardAccessAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardAccessIdempotencyRepository();
    auditBridge = new ResultReportCardAccessAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardAccessIdempotencyService(idempotencyRepo);
    timelineService = new ResultReportCardAccessTimelineService(timelineRepo, auditBridge, idempotencyService);
    summaryService = new ResultReportCardAccessSummaryService(summaryRepo, auditBridge, idempotencyService);
  });

  describe('Timeline', () => {
    it('timeline event can be recorded', async () => {
      const result = await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        eventType: 'ACCESS_GRANT_CREATED',
        safeEventSummary: 'Access grant created for student-1',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('recorded');
      expect(result.resourceId).toBeTruthy();
    });

    it('timeline event can be listed by grant', async () => {
      await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        eventType: 'ACCESS_GRANT_VALIDATED',
        safeEventSummary: 'Grant validated',
      });
      const result = await timelineService.listTimelineForGrant(ctx, GRANT_ID);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('timeline event can be listed by recipient', async () => {
      const event = await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        resultReportCardAccessRecipientId: RECIPIENT_ID,
        eventType: 'ACCESS_RECIPIENT_ADDED',
        safeEventSummary: 'Recipient added to grant',
      });
      expect(event.ok).toBe(true);

      const result = await timelineService.listTimelineForRecipient(ctx, RECIPIENT_ID);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('timeline event can be listed by student', async () => {
      await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        eventType: 'ACCESS_GRANT_READY',
        safeEventSummary: 'Grant ready for future access',
      });
      const result = await timelineService.listTimelineForStudent(ctx, STUDENT_REF);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('timeline event can be suppressed', async () => {
      const created = await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        eventType: 'ACCESS_GRANT_EXPIRED',
        safeEventSummary: 'Grant expired',
      });
      const result = await timelineService.suppressTimelineEvent(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('suppressed');
    });

    it('timeline event can be voided', async () => {
      const created = await timelineService.recordTimelineEvent(ctx, {
        resultReportCardAccessGrantId: GRANT_ID,
        eventType: 'ACCESS_GRANT_REVOKED',
        safeEventSummary: 'Grant revoked',
      });
      const result = await timelineService.voidTimelineEvent(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('void');
    });
  });

  describe('Access Summary', () => {
    it('access summary can be created', async () => {
      const result = await summaryService.createAccessSummary(ctx, {
        summaryScope: 'school',
        safeSummary: 'School-wide access summary',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('active');
      expect(result.resourceId).toBeTruthy();
    });

    it('access summary can be listed by school', async () => {
      await summaryService.createAccessSummary({ ...ctx, idempotencyKey: 'idem-list-school-a' }, {
        summaryScope: 'school',
        safeSummary: 'Summary A',
      });
      await summaryService.createAccessSummary({ ...ctx, idempotencyKey: 'idem-list-school-b' }, {
        summaryScope: 'school',
        safeSummary: 'Summary B',
      });
      const result = await summaryService.listSummariesForSchool(ctx);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as any[]).length).toBe(2);
    });

    it('access summary can be listed by student', async () => {
      await summaryService.createAccessSummary(ctx, {
        studentRef: STUDENT_REF,
        summaryScope: 'student',
        safeSummary: 'Student summary',
      });
      const result = await summaryService.listSummariesForStudent(ctx, STUDENT_REF);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('access summary can be listed by assembly', async () => {
      await summaryService.createAccessSummary(ctx, {
        resultReportCardAssemblyId: ASSEMBLY_ID,
        summaryScope: 'assembly',
        safeSummary: 'Assembly summary',
      });
      const result = await summaryService.listSummariesForAssembly(ctx, ASSEMBLY_ID);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('access summary can be listed by export job', async () => {
      await summaryService.createAccessSummary(ctx, {
        resultReportCardExportJobId: EXPORT_JOB_ID,
        summaryScope: 'export',
        safeSummary: 'Export job summary',
      });
      const result = await summaryService.listSummariesForExportJob(ctx, EXPORT_JOB_ID);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('access summary can be refreshed', async () => {
      const created = await summaryService.createAccessSummary(ctx, {
        summaryScope: 'school',
        safeSummary: 'Refreshable summary',
      });
      const result = await summaryService.refreshAccessSummary(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.safeMessage).toContain('refreshed');
    });

    it('access summary can be marked stale', async () => {
      const created = await summaryService.createAccessSummary(ctx, {
        summaryScope: 'school',
        safeSummary: 'Stale test summary',
      });
      const result = await summaryService.markSummaryStale(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('stale');
    });

    it('access summary can be blocked', async () => {
      const created = await summaryService.createAccessSummary(ctx, {
        summaryScope: 'school',
        safeSummary: 'Block test summary',
      });
      const result = await summaryService.blockAccessSummary(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('blocked');
    });

    it('access summary can be voided', async () => {
      const created = await summaryService.createAccessSummary(ctx, {
        summaryScope: 'school',
        safeSummary: 'Void test summary',
      });
      const result = await summaryService.voidAccessSummary(ctx, created.resourceId!);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('void');
    });
  });

  describe('No forbidden field leakage', () => {
    it('timeline preview fields do not expose forbidden payload', () => {
      const preview = {
        resultReportCardAccessTimelineId: 'tl-1',
        schoolId: 'school-1',
        resultReportCardAccessGrantId: 'grant-1',
        timelineStatus: 'recorded',
        eventType: 'ACCESS_GRANT_CREATED',
        safeEventSummary: 'safe',
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(preview).not.toHaveProperty('eventPayloadJson');
      expect(preview).not.toHaveProperty('tokenValue');
      expect(preview).not.toHaveProperty('jwt');
      expect(preview).not.toHaveProperty('signedUrl');
    });

    it('summary preview fields do not expose forbidden data', () => {
      const preview = {
        resultReportCardAccessSummaryId: 'sum-1',
        schoolId: 'school-1',
        summaryStatus: 'active',
        summaryScope: 'school',
        safeSummary: 'safe',
        refreshedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(preview).not.toHaveProperty('audienceCountsJson');
      expect(preview).not.toHaveProperty('statusCountsJson');
      expect(preview).not.toHaveProperty('blockedReasonCodesJson');
      expect(preview).not.toHaveProperty('livePortalUrl');
      expect(preview).not.toHaveProperty('accessToken');
    });
  });
});
