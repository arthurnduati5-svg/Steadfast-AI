import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardAudienceProjectionRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
import { ResultReportCardAudienceProjectionService } from '../services/resultReportCardAudienceProjectionService';
import { ResultReportCardSafetyService } from '../services/resultReportCardSafetyService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';

function makeCtx(overrides?: Partial<ResultReportCardCommandContext>): ResultReportCardCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

describe('Package 13 — Audience Projection Safety', () => {
  let projectionRepo: InMemoryResultReportCardAudienceProjectionRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let safetyService: ResultReportCardSafetyService;
  let service: ResultReportCardAudienceProjectionService;

  beforeEach(() => {
    projectionRepo = new InMemoryResultReportCardAudienceProjectionRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    safetyService = new ResultReportCardSafetyService();
    service = new ResultReportCardAudienceProjectionService(projectionRepo, safetyService, auditBridge, idempotencyService);
  });

  it('teacher projection can be generated', async () => {
    const ctx = makeCtx();
    const result = await service.generateTeacherProjection(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      audienceType: 'teacher' as const,
      safeProjectionSummary: 'Teacher view',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('admin projection can be generated', async () => {
    const ctx = makeCtx();
    const result = await service.generateAdminProjection(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      audienceType: 'admin' as const,
      safeProjectionSummary: 'Admin view',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('student-safe projection can be generated', async () => {
    const ctx = makeCtx();
    const result = await service.generateStudentSafeProjection(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      audienceType: 'student' as const,
      safeProjectionSummary: 'Student safe view',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('parent-boundary projection can be generated', async () => {
    const ctx = makeCtx();
    const result = await service.generateParentBoundaryProjection(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      audienceType: 'parent' as const,
      safeProjectionSummary: 'Parent view',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('student projection excludes forbidden fields (test safety service)', async () => {
    const safe = await safetyService.assertStudentProjectionSafe({ score: 85, comment: 'Good' });
    expect(safe.safe).toBe(true);

    const unsafe = await safetyService.assertStudentProjectionSafe({ teacherOnlyNotes: 'confidential' });
    expect(unsafe.safe).toBe(false);
    expect(unsafe.reasonCode).toBe('STUDENT_PROJECTION_UNSAFE');
  });

  it('parent projection excludes forbidden fields', async () => {
    const safe = await safetyService.assertParentProjectionSafe({ score: 85 });
    expect(safe.safe).toBe(true);

    const unsafe = await safetyService.assertParentProjectionSafe({ markingNotesTeacherOnly: 'private' });
    expect(unsafe.safe).toBe(false);
    expect(unsafe.reasonCode).toBe('PARENT_PROJECTION_UNSAFE');
  });

  it('teacher projection excludes provider secrets, hidden reasoning, live payloads, PDF binaries', async () => {
    const safe = await safetyService.assertTeacherProjectionSafe({ score: 85, comment: 'ok' });
    expect(safe.safe).toBe(true);

    const unsafe1 = await safetyService.assertTeacherProjectionSafe({ providerSecret: 'sk-xxx' });
    expect(unsafe1.safe).toBe(false);
    expect(unsafe1.reasonCode).toBe('TEACHER_PROJECTION_UNSAFE');

    const unsafe2 = await safetyService.assertTeacherProjectionSafe({ pdfBinary: 'binary' });
    expect(unsafe2.safe).toBe(false);
    expect(unsafe2.reasonCode).toBe('TEACHER_PROJECTION_UNSAFE');
  });

  it('admin projection excludes provider secrets, live payloads, PDF binaries', async () => {
    const safe = await safetyService.assertAdminProjectionSafe({ score: 85 });
    expect(safe.safe).toBe(true);

    const unsafe1 = await safetyService.assertAdminProjectionSafe({ apiKey: 'key-123' });
    expect(unsafe1.safe).toBe(false);
    expect(unsafe1.reasonCode).toBe('ADMIN_PROJECTION_UNSAFE');

    const unsafe2 = await safetyService.assertAdminProjectionSafe({ liveProviderPayload: 'payload' });
    expect(unsafe2.safe).toBe(false);
    expect(unsafe2.reasonCode).toBe('ADMIN_PROJECTION_UNSAFE');
  });

  it('projection with answer key leakage is blocked', async () => {
    const result = await safetyService.assertNoAnswerKeyLeakage({ correctAnswerSummary: 'A' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('projection with raw rubric leakage is blocked', async () => {
    const result = await safetyService.assertNoRubricLeakage({ rawRubric: 'detailed rubric' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('RUBRIC_LEAKAGE');
  });

  it('projection with raw student answer leakage is blocked', async () => {
    const result = await safetyService.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'full essay text' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('projection with teacher-only leakage to parent/student is blocked', async () => {
    const studentResult = await safetyService.assertNoTeacherOnlyLeakage({ markingNotesTeacherOnly: 'note' }, 'student');
    expect(studentResult.safe).toBe(false);
    expect(studentResult.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');

    const parentResult = await safetyService.assertNoTeacherOnlyLeakage({ teacherOnlyNotes: 'note' }, 'parent');
    expect(parentResult.safe).toBe(false);
    expect(parentResult.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('projection with AI narrative is blocked', async () => {
    const result = await safetyService.assertNoAiNarrativeLeakage({ aiNarrative: 'generated text' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE_LEAKAGE');
  });

  it('projection with OCR text is blocked', async () => {
    const result = await safetyService.assertNoOcrTextLeakage({ ocrText: 'scanned text' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('OCR_TEXT_LEAKAGE');
  });

  it('projection can be sealed only after safety checks', async () => {
    const ctx = makeCtx();
    const created = await service.generateTeacherProjection(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      audienceType: 'teacher' as const,
      safeProjectionSummary: 'To seal',
    });
    expect(created.ok).toBe(true);

    const projectionId = created.resourceId!;
    const sealed = await service.sealAudienceProjection(ctx, projectionId);
    expect(sealed.ok).toBe(true);
    expect(sealed.status).toBe('sealed');
  });
});
