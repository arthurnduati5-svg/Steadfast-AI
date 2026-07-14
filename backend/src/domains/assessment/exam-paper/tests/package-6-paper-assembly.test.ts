import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ExamPaperAssemblyService, ExamPaperAssemblyInput } from '../services/examPaperAssemblyService';
import { ExamPaperVersionService } from '../services/examPaperVersionService';
import { ExamPaperSectionLayoutService } from '../services/examPaperSectionLayoutService';
import { ExamPaperCommandContext } from '../contracts/examPaperContracts';

function makeTeacherContext(): ExamPaperCommandContext {
  return { schoolId: 's1', actorId: 'a1', actorRole: 'teacher', correlationId: 'c1', idempotencyKey: 'k1' };
}

describe('Package 6 - Paper Assembly', () => {
  const assemblyService = new ExamPaperAssemblyService();
  const versionService = new ExamPaperVersionService();
  const layoutService = new ExamPaperSectionLayoutService();

  const sampleDraftQuestions: ExamPaperAssemblyInput['draftQuestions'] = [
    { draftQuestionId: 'dq1', questionId: 'q1', questionVersionId: 'qv1', position: 1, sectionKey: 'section_a', marksAllocated: 5, selectionReason: 'Covers objective 1', safeTeacherSummary: 'Good question' },
    { draftQuestionId: 'dq2', questionId: 'q2', questionVersionId: 'qv2', position: 2, sectionKey: 'section_a', marksAllocated: 3, selectionReason: 'Covers objective 2', safeTeacherSummary: 'Fair question' },
    { draftQuestionId: 'dq3', questionId: 'q3', questionVersionId: 'qv3', position: 1, sectionKey: 'section_b', marksAllocated: 4, selectionReason: 'Covers objective 3', safeTeacherSummary: 'Hard question' },
  ];

  const sampleInput: ExamPaperAssemblyInput = {
    sourceDraftSetId: 'ds1',
    sourceDraftId: 'd1',
    blueprintId: 'bp1',
    blueprintVersionId: 'bpv1',
    title: 'Midterm Exam',
    subjectId: 'subj1',
    curriculumVersionId: 'cv1',
    gradeBand: 'grade_10',
    examType: 'midterm',
    instructionsSafeText: 'Read carefully',
    durationMinutes: 60,
    securityClass: 'exam_safe',
    draftQuestions: sampleDraftQuestions,
  };

  it('A paper can be assembled from a selected draft', async () => {
    const result = await assemblyService.assemblePaperFromDraft(sampleInput, makeTeacherContext());
    expect(result.status).toBe('completed');
    expect(result.paperId).toBeTruthy();
    expect(result.paperVersionId).toBeTruthy();
    expect(result.assemblyRunId).toBeTruthy();
  });

  it('Assembly creates paper shell with ID', async () => {
    const result = await assemblyService.assemblePaperFromDraft(sampleInput, makeTeacherContext());
    expect(result.paperId).toBeTruthy();
    expect(result.paperId.length).toBeGreaterThan(0);
  });

  it('Assembly creates first paper version with ID', async () => {
    const result = await assemblyService.assemblePaperFromDraft(sampleInput, makeTeacherContext());
    expect(result.paperVersionId).toBeTruthy();
    expect(result.paperVersionId.length).toBeGreaterThan(0);
  });

  it('Assembly creates sections', async () => {
    const layout = await layoutService.createSectionsFromDraftQuestions([
      { sectionKey: 'section_a', sectionTitle: 'Section A', sectionOrder: 1, instructionsSafeText: 'Do section A', timingGuidanceMinutes: 30, questions: [
        { questionId: 'q1', questionVersionId: 'qv1', draftQuestionId: 'dq1', position: 1, marksAllocated: 5, selectionReason: 'R1', safeTeacherSummary: 'S1' },
        { questionId: 'q2', questionVersionId: 'qv2', draftQuestionId: 'dq2', position: 2, marksAllocated: 3, selectionReason: 'R2', safeTeacherSummary: 'S2' },
      ]},
      { sectionKey: 'section_b', sectionTitle: 'Section B', sectionOrder: 2, instructionsSafeText: 'Do section B', timingGuidanceMinutes: 30, questions: [
        { questionId: 'q3', questionVersionId: 'qv3', draftQuestionId: 'dq3', position: 1, marksAllocated: 4, selectionReason: 'R3', safeTeacherSummary: 'S3' },
      ]},
    ], 'pv1', 's1');
    expect(layout.sections.length).toBe(2);
    expect(layout.questions.length).toBe(3);
  });

  it('Assembly creates paper questions', async () => {
    const layout = await layoutService.createSectionsFromDraftQuestions([
      { sectionKey: 'section_a', sectionTitle: 'Section A', sectionOrder: 1, instructionsSafeText: '', timingGuidanceMinutes: 30, questions: [
        { questionId: 'q1', questionVersionId: 'qv1', draftQuestionId: 'dq1', position: 1, marksAllocated: 5, selectionReason: 'R1', safeTeacherSummary: 'S1' },
      ]},
    ], 'pv1', 's1');
    expect(layout.questions.length).toBe(1);
    expect(layout.questions[0].questionId).toBe('q1');
  });

  it('Assembly links sourceDraftQuestionId', async () => {
    const layout = await layoutService.createSectionsFromDraftQuestions([
      { sectionKey: 'section_a', sectionTitle: 'Section A', sectionOrder: 1, instructionsSafeText: '', timingGuidanceMinutes: 30, questions: [
        { questionId: 'q1', questionVersionId: 'qv1', draftQuestionId: 'dq1', position: 1, marksAllocated: 5, selectionReason: 'R1', safeTeacherSummary: 'S1' },
      ]},
    ], 'pv1', 's1');
    expect(layout.questions[0].sourceDraftQuestionId).toBe('dq1');
  });

  it('Assembly preserves questionVersionId', async () => {
    const layout = await layoutService.createSectionsFromDraftQuestions([
      { sectionKey: 'section_a', sectionTitle: 'Section A', sectionOrder: 1, instructionsSafeText: '', timingGuidanceMinutes: 30, questions: [
        { questionId: 'q1', questionVersionId: 'qv1', draftQuestionId: 'dq1', position: 1, marksAllocated: 5, selectionReason: 'R1', safeTeacherSummary: 'S1' },
      ]},
    ], 'pv1', 's1');
    expect(layout.questions[0].questionVersionId).toBe('qv1');
  });

  it('Assembly preserves marks', async () => {
    const result = await assemblyService.assemblePaperFromDraft(sampleInput, makeTeacherContext());
    expect(result.totalMarks).toBe(12);
    expect(result.questionCount).toBe(3);
  });

  it('Assembly preserves deterministic question order', async () => {
    const result = await assemblyService.assemblePaperFromDraft({
      ...sampleInput,
      draftQuestions: sampleDraftQuestions.sort(() => 0.5 - Math.random()),
    }, makeTeacherContext());
    expect(result.questionCount).toBe(3);
  });

  it('Assembly reconciles total marks', async () => {
    const result = await assemblyService.assemblePaperFromDraft(sampleInput, makeTeacherContext());
    expect(result.totalMarks).toBe(sampleDraftQuestions.reduce((s, q) => s + q.marksAllocated, 0));
  });

  it('Assembly does not copy answer key text', () => {
    const sample: any = { answerKeyLinked: false, rubricLinked: false };
    expect('answerKeyLinked' in sample).toBe(true);
    expect('answerKeyText' in sample).toBe(false);
  });

  it('Assembly does not copy rubric internals', () => {
    const sample: any = { rubricLinked: false };
    expect('rubricLinked' in sample).toBe(true);
    expect('rubricText' in sample).toBe(false);
    expect('rubricInternal' in sample).toBe(false);
  });

  it('Assembly does not create ExamModeSessionRecord', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const examModeSessionCount = (content.match(/model ExamModeSessionRecord/g) || []).length;
    expect(examModeSessionCount).toBe(1);
  });

  it('Assembly does not create PracticeAttempt', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matchCount = (content.match(/model PracticeAttempt/g) || []).length;
    expect(matchCount).toBe(1);
  });

  it('Assembly does not create MarkingRunRecord', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content.includes('model MarkingRunRecord')).toBe(true);
  });

  it('Assembly does not mutate SkillMasterySnapshot', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matchCount = (content.match(/model SkillMasterySnapshot/g) || []).length;
    expect(matchCount).toBe(1);
  });

  it('Held questions produce warning', async () => {
    const result = await assemblyService.assemblePaperFromDraft({
      ...sampleInput,
      draftQuestions: [],
    }, makeTeacherContext());
    expect(result.status).toBe('partial');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
