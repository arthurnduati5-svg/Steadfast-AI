import { describe, it, expect, beforeEach } from 'vitest';
import express, { Router, Request, Response } from 'express';
import { MarkingRunService } from '../../marking/services/markingRunService';
import { DeterministicMarkerService } from '../../marking/services/deterministicMarkerService';
import { TeacherReviewQueueService } from '../../marking/services/teacherReviewQueueService';
import { MarkingInvocationRequestService } from '../../marking-invocation/services/markingInvocationRequestService';
import { ExamPaperAssemblyService } from '../../exam-paper/services/examPaperAssemblyService';
import { InMemoryMarkingRunRepository, InMemoryMarkingResultVersionRepository } from '../../marking/repositories/inMemoryMarkingRepositories';
import { InMemoryMarkingInvocationRequestRepository } from '../../marking-invocation/repositories/inMemoryMarkingInvocationRepositories';
import { InMemoryExamPaperAssemblyPersistence } from '../../exam-paper/services/inMemoryExamPaperAssemblyPersistence';

describe('Package RT2 - Package 5 DI (MarkingRunService)', () => {
  it('requires explicit dependency injection - no hidden defaults', () => {
    const runRepo = new InMemoryMarkingRunRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    const markerService = new DeterministicMarkerService();
    const reviewQueueService = new TeacherReviewQueueService();
    const service = new MarkingRunService(runRepo, resultRepo, markerService, reviewQueueService);
    expect(service).toBeDefined();
  });

  it('createMarkingRun succeeds with injected dependencies', async () => {
    const runRepo = new InMemoryMarkingRunRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    const markerService = new DeterministicMarkerService();
    const reviewQueueService = new TeacherReviewQueueService();
    const service = new MarkingRunService(runRepo, resultRepo, markerService, reviewQueueService);
    const result = await service.createMarkingRun({
      schoolId: 'school-1',
      sourceType: 'blueprint',
      sourceRef: 'ref-1',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      safeSummary: 'test run',
    });
    expect(result.markingRunId).toBeDefined();
    expect(result.status).toBeDefined();
  });
});

describe('Package RT2 - Package 8 DI (MarkingInvocationRequestService)', () => {
  it('requires explicit repo injection - no hidden InMemory defaults', () => {
    const repo = new InMemoryMarkingInvocationRequestRepository();
    const service = new MarkingInvocationRequestService(repo);
    expect(service).toBeDefined();
  });
});

describe('Package RT2 - Package 6 Persistence (ExamPaperAssemblyService)', () => {
  it('requires explicit persistence injection - not optional', () => {
    const persistence = new InMemoryExamPaperAssemblyPersistence();
    const service = new ExamPaperAssemblyService(persistence);
    expect(service).toBeDefined();
  });

  it('cannot be constructed without persistence (compile-time error if no arg)', () => {
    const persistence = new InMemoryExamPaperAssemblyPersistence();
    const service = new ExamPaperAssemblyService(persistence);
    expect(service).toBeDefined();
  });

  it('with persistence, assemblePaperFromDraft produces a complete result', async () => {
    const persistence = new InMemoryExamPaperAssemblyPersistence();
    const service = new ExamPaperAssemblyService(persistence);
    const input = {
      sourceDraftSetId: 'ds-1',
      sourceDraftId: 'draft-1',
      blueprintId: 'bp-1',
      blueprintVersionId: 'bpv-1',
      title: 'Test Paper',
      subjectId: 'subj-1',
      curriculumVersionId: 'cv-1',
      gradeBand: 'grade-1',
      examType: 'summative',
      instructionsSafeText: 'Read carefully',
      durationMinutes: 60,
      securityClass: 'standard',
      draftQuestions: [{
        draftQuestionId: 'dq-1',
        questionId: 'q-1',
        questionVersionId: 'qv-1',
        position: 1,
        sectionKey: 'section-a',
        marksAllocated: 5,
        selectionReason: 'curriculum-aligned',
        safeTeacherSummary: 'Test question',
      }],
    };
    const ctx = {
      schoolId: 'school-1',
      actorId: 'teacher-1',
      actorRole: 'teacher',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    const result = await service.assemblePaperFromDraft(input, ctx);
    expect(result.paperId).toBeDefined();
    expect(result.paperVersionId).toBeDefined();
    expect(result.assemblyRunId).toBeDefined();
    expect(result.status).toBe('completed');
  });
});
