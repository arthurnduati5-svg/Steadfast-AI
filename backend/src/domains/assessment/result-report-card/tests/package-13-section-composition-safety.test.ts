import { describe, it, expect, beforeEach } from 'vitest';
import { ResultReportCardSectionComposer } from '../services/resultReportCardSectionComposer';
import { ResultReportCardSafetyService } from '../services/resultReportCardSafetyService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import {
  InMemoryResultReportCardSectionRepository,
  InMemoryResultReportCardEvidenceLinkRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
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

function makeSectionInput(assemblyId: string) {
  return {
    resultReportCardAssemblyId: assemblyId,
    safeHeading: 'Result Overview',
    safeSummary: 'Overview of results',
    safeBodyJson: { totalScore: 85, maxScore: 100 },
  };
}

describe('Package 13 — Section Composition Safety', () => {
  let sectionRepo: InMemoryResultReportCardSectionRepository;
  let evidenceRepo: InMemoryResultReportCardEvidenceLinkRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let safetyService: ResultReportCardSafetyService;
  let sectionComposer: ResultReportCardSectionComposer;

  beforeEach(() => {
    sectionRepo = new InMemoryResultReportCardSectionRepository();
    evidenceRepo = new InMemoryResultReportCardEvidenceLinkRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    safetyService = new ResultReportCardSafetyService();
    sectionComposer = new ResultReportCardSectionComposer(
      sectionRepo, evidenceRepo, safetyService, auditBridge, idempotencyService,
    );
  });

  it('Result overview section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeResultOverviewSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Strengths section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeStrengthsSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Growth areas section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeGrowthAreasSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Objective mastery section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeObjectiveMasterySection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Practice next steps section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composePracticeNextStepsSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Parent support guidance section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeParentSupportGuidanceSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Student reflection prompt section can be composed', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeStudentReflectionPromptSection(ctx, makeSectionInput('asm-1'));
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Teacher review note section is blocked from student/parent projections', async () => {
    const unsafeContent = { teacherOnlyNotes: 'Internal notes about student behavior' };
    const input = { resultReportCardAssemblyId: 'asm-1', safeHeading: 'Teacher Note', safeSummary: 'Note', safeBodyJson: unsafeContent };

    const resultForStudent = await safetyService.assertNoTeacherOnlyLeakage(unsafeContent, 'student');
    expect(resultForStudent.safe).toBe(false);
    expect(resultForStudent.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');

    const resultForParent = await safetyService.assertNoTeacherOnlyLeakage(unsafeContent, 'parent');
    expect(resultForParent.safe).toBe(false);
    expect(resultForParent.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');

    const resultForTeacher = await safetyService.assertNoTeacherOnlyLeakage(unsafeContent, 'teacher');
    expect(resultForTeacher.safe).toBe(true);
  });

  it('Admin audit summary is blocked from student/parent projections', async () => {
    const auditContent = { auditInternals: 'audit-trail-data' };
    const studentResult = await safetyService.assertStudentProjectionSafe(auditContent);
    expect(studentResult.safe).toBe(false);
    expect(studentResult.reasonCode).toBe('STUDENT_PROJECTION_UNSAFE');

    const parentResult = await safetyService.assertParentProjectionSafe(auditContent);
    expect(parentResult.safe).toBe(false);
    expect(parentResult.reasonCode).toBe('PARENT_PROJECTION_UNSAFE');

    const teacherResult = await safetyService.assertTeacherProjectionSafe(auditContent);
    expect(teacherResult.safe).toBe(true);
  });

  it('Delivery readiness summary can reference Package 12 dry-run receipts', async () => {
    const ctx = makeCtx();
    const result = await sectionComposer.composeDeliveryReadinessSummarySection(ctx, {
      resultReportCardAssemblyId: 'asm-1',
      safeHeading: 'Delivery Readiness',
      safeSummary: 'References Package 12 mock receipts',
      safeBodyJson: { receiptRef: 'receipt-123', provider: 'mock_provider' },
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
  });

  it('Section with answer keys is blocked', async () => {
    const content = { answerKeyText: '1:A,2:B,3:C' };
    const result = await safetyService.assertNoAnswerKeyLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('Section with raw rubrics is blocked', async () => {
    const content = { rawRubric: 'detailed-rubric-data' };
    const result = await safetyService.assertNoRubricLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('RUBRIC_LEAKAGE');
  });

  it('Section with raw student answers is blocked', async () => {
    const content = { rawStudentAnswer: 'student-full-essay' };
    const result = await safetyService.assertNoRawStudentAnswerLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('Section with hidden reasoning is blocked', async () => {
    const content = { hiddenReasoning: 'internal-model-reasoning' };
    const result = await safetyService.assertNoHiddenReasoningLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
  });

  it('Section with provider secret is blocked', async () => {
    const content = { providerSecret: 'sk-secret-key' };
    const result = await safetyService.assertNoProviderSecretLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('PROVIDER_SECRET_LEAKAGE');
  });

  it('Section with PDF binary is blocked', async () => {
    const content = { pdfBinary: 'base64-encoded-pdf' };
    const result = await safetyService.assertNoPdfBinaryLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('PDF_BINARY_LEAKAGE');
  });

  it('Section with AI narrative is blocked', async () => {
    const content = { aiNarrative: 'AI generated paragraph' };
    const result = await safetyService.assertNoAiNarrativeLeakage(content);
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE_LEAKAGE');
  });

  it('Section can be sealed only after safety checks', async () => {
    const ctx = makeCtx();
    const composeResult = await sectionComposer.composeResultOverviewSection(ctx, {
      resultReportCardAssemblyId: 'asm-1',
      safeHeading: 'Overview',
      safeSummary: 'Safe summary',
      safeBodyJson: { totalScore: 85, maxScore: 100 },
    });
    expect(composeResult.ok).toBe(true);
    const sectionId = composeResult.resourceId!;

    const sealResult = await sectionComposer.sealSection(ctx, sectionId);
    expect(sealResult.ok).toBe(true);
    expect(sealResult.status).toBe('sealed');
  });
});
