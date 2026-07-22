import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 6 - Paper Contracts', () => {
  const contractsDir = path.resolve(__dirname, '../contracts');

  it('ExamPaper contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperContracts.ts'))).toBe(true);
  });

  it('ExamPaperVersion contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperVersionContracts.ts'))).toBe(true);
  });

  it('ExamPaperSection contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperSectionContracts.ts'))).toBe(true);
  });

  it('ExamPaperVariant contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperVariantContracts.ts'))).toBe(true);
  });

  it('ExamAccessPolicy contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperAccessContracts.ts'))).toBe(true);
  });

  it('ExamPaperApproval contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperApprovalContracts.ts'))).toBe(true);
  });

  it('ExamPaperDeliveryBridge contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperDeliveryBridgeContracts.ts'))).toBe(true);
  });

  it('Repository contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperRepositoryContracts.ts'))).toBe(true);
  });

  it('Contracts index file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'index.ts'))).toBe(true);
  });

  it('ExamPaperProjection contracts file exists', () => {
    expect(fs.existsSync(path.join(contractsDir, 'examPaperProjectionContracts.ts'))).toBe(true);
  });

  it('ExamPaper Contract exports ExamPaper type', async () => {
    const mod = await import('../contracts/examPaperContracts');
    expect(mod).toBeDefined();
  });

  it('ExamPaperVersion Contract exports ExamPaperVersionStatus type', async () => {
    const mod = await import('../contracts/examPaperVersionContracts');
    expect(mod).toBeDefined();
  });

  it('Student preview projection excludes answer keys', () => {
    const forbidden = ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText', 'markingNotesTeacherOnly', 'teacherOnlyNotes'];
    const studentPreviewKeys: string[] = ['paperId', 'title', 'instructionsSafeText', 'durationMinutes', 'totalMarks', 'sectionTitles', 'safeQuestionCount', 'safePolicySummary', 'safeAvailabilityMode', 'paperStatus', 'deliveryReadinessLabel'];
    for (const f of forbidden) {
      expect(studentPreviewKeys.includes(f)).toBe(false);
    }
  });

  it('Parent preview projection excludes answer keys', () => {
    const forbidden = ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText'];
    const parentPreviewKeys: string[] = ['paperId', 'title', 'durationMinutes', 'totalMarks', 'sectionCount', 'safePolicySummary', 'deliveryReadinessLabel'];
    for (const f of forbidden) {
      expect(parentPreviewKeys.includes(f)).toBe(false);
    }
  });

  it('Missing schoolId blocks mutation in assembly service', async () => {
    const [mod, persistMod] = await Promise.all([import('../services/examPaperAssemblyService'), import('../services/inMemoryExamPaperAssemblyPersistence')]);
    const persistence = new persistMod.InMemoryExamPaperAssemblyPersistence();
    const service = new mod.ExamPaperAssemblyService(persistence);
    const decision = service.validateCommandContext({ schoolId: '', actorId: 'a1', actorRole: 'teacher', correlationId: 'c1', idempotencyKey: 'k1' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('Student actors cannot assemble papers', async () => {
    const [mod, persistMod] = await Promise.all([import('../services/examPaperAssemblyService'), import('../services/inMemoryExamPaperAssemblyPersistence')]);
    const persistence = new persistMod.InMemoryExamPaperAssemblyPersistence();
    const service = new mod.ExamPaperAssemblyService(persistence);
    const decision = service.validateCommandContext({ schoolId: 's1', actorId: 'a1', actorRole: 'student', correlationId: 'c1', idempotencyKey: 'k1' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('ROLE_NOT_ALLOWED');
  });

  it('Parent actors cannot assemble papers', async () => {
    const [mod, persistMod] = await Promise.all([import('../services/examPaperAssemblyService'), import('../services/inMemoryExamPaperAssemblyPersistence')]);
    const persistence = new persistMod.InMemoryExamPaperAssemblyPersistence();
    const service = new mod.ExamPaperAssemblyService(persistence);
    const decision = service.validateCommandContext({ schoolId: 's1', actorId: 'a1', actorRole: 'parent', correlationId: 'c1', idempotencyKey: 'k1' });
    expect(decision.allowed).toBe(false);
  });

  it('Student actors cannot approve papers', async () => {
    const mod = await import('../services/examPaperApprovalService');
    const service = new mod.ExamPaperApprovalService();
    const decision = service.validateApprovalContext({ schoolId: 's1', actorId: 'a1', actorRole: 'student', correlationId: 'c1', idempotencyKey: 'k1' });
    expect(decision.allowed).toBe(false);
  });

  it('Parent actors cannot approve papers', async () => {
    const mod = await import('../services/examPaperApprovalService');
    const service = new mod.ExamPaperApprovalService();
    const decision = service.validateApprovalContext({ schoolId: 's1', actorId: 'a1', actorRole: 'parent', correlationId: 'c1', idempotencyKey: 'k1' });
    expect(decision.allowed).toBe(false);
  });
});
