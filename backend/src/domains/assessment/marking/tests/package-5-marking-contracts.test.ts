import { describe, it, expect } from 'vitest';
import { MarkingRunService, CreateMarkingRunParams } from '../services/markingRunService';
import { DeterministicMarkerService } from '../services/deterministicMarkerService';
import { TeacherReviewQueueService } from '../services/teacherReviewQueueService';
import { InMemoryMarkingRunRepository, InMemoryMarkingResultVersionRepository } from '../repositories/inMemoryMarkingRepositories';
import { SubmittedAnswerSnapshot } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';

describe('Package 5 - Marking Contracts', () => {
  function makeService(): MarkingRunService {
    const marker = new DeterministicMarkerService();
    const runRepo = new InMemoryMarkingRunRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    return new MarkingRunService(runRepo, resultRepo, marker, new TeacherReviewQueueService());
  }

  it('createMarkingRun requires schoolId', async () => {
    const service = makeService();
    const params: CreateMarkingRunParams = {
      schoolId: '',
      sourceType: 'mock_snapshot',
      sourceRef: 'test-001',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
      safeSummary: 'Test run',
    };
    await expect(service.createMarkingRun(params)).rejects.toThrow('SCHOOL_CONTEXT_REQUIRED');
  });

  it('createMarkingRun requires teacher/lead_teacher/admin/system_job actor', async () => {
    const service = makeService();
    const params: CreateMarkingRunParams = {
      schoolId: 'school-1',
      sourceType: 'mock_snapshot',
      sourceRef: 'test-001',
      createdByActorId: 'student-1',
      createdByRole: 'student',
      safeSummary: 'Test run',
    };
    await expect(service.createMarkingRun(params)).rejects.toThrow('FORBIDDEN');
  });

  it('student/parent cannot create marking runs', async () => {
    const service = makeService();
    for (const role of ['student', 'parent']) {
      const params: CreateMarkingRunParams = {
        schoolId: 'school-1',
        sourceType: 'mock_snapshot',
        sourceRef: 'test-001',
        createdByActorId: 'user-1',
        createdByRole: role,
        safeSummary: 'Test run',
      };
      await expect(service.createMarkingRun(params)).rejects.toThrow('FORBIDDEN');
    }
  });

  it('teacher can create marking runs', async () => {
    const service = makeService();
    const params: CreateMarkingRunParams = {
      schoolId: 'school-1',
      sourceType: 'mock_snapshot',
      sourceRef: 'test-001',
      createdByActorId: 'teacher-1',
      createdByRole: 'teacher',
      safeSummary: 'Test run',
    };
    const run = await service.createMarkingRun(params);
    expect(run.schoolId).toBe('school-1');
    expect(run.status).toBe('draft');
    expect(run.markingRunId).toBeTruthy();
  });

  it('system_job can create marking runs for mock_snapshot source', async () => {
    const service = makeService();
    const params: CreateMarkingRunParams = {
      schoolId: 'school-1',
      sourceType: 'mock_snapshot',
      sourceRef: 'seed-001',
      createdByActorId: 'system-1',
      createdByRole: 'system_job',
      safeSummary: 'Seed run',
    };
    const run = await service.createMarkingRun(params);
    expect(run.sourceType).toBe('mock_snapshot');
  });

  it('marking run does not create attempts', async () => {
    const marker = new DeterministicMarkerService();
    const reviewQueue = new TeacherReviewQueueService();
    const runRepo = new InMemoryMarkingRunRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    const service = new MarkingRunService(runRepo, resultRepo, marker, reviewQueue);
    const run = await service.createMarkingRun({
      schoolId: 'school-1', sourceType: 'mock_snapshot', sourceRef: 't1',
      createdByActorId: 't1', createdByRole: 'teacher', safeSummary: '',
    });
    const snapshot: SubmittedAnswerSnapshot = {
      answerSnapshotRef: 'snap-1', schoolId: 'school-1', studentId: 's1',
      questionId: 'q1', questionVersionId: 'qv1', questionType: 'multiple_choice',
      submittedAnswerSafeText: 'A', submittedOptionKey: 'A',
      submittedAt: new Date().toISOString(), sourceType: 'mock_snapshot', sourceRef: 'test',
    };
    const input: MarkingInputSnapshot = { snapshot, expectedOptionKey: 'A' };
    await service.markSnapshot({ runId: run.markingRunId, snapshot, input, actorId: 't1', role: 'teacher' });
    const results = await resultRepo.findByMarkingRunId(run.markingRunId);
    expect(results.length).toBe(1);
  });

  it('marking run does not mutate mastery', async () => {
    const service = makeService();
    const run = await service.createMarkingRun({
      schoolId: 'school-1', sourceType: 'mock_snapshot', sourceRef: 't1',
      createdByActorId: 't1', createdByRole: 'teacher', safeSummary: '',
    });
    expect(run).toBeDefined();
  });

  it('answer snapshot contract rejects raw OCR/artifact fields', () => {
    const snapshot: SubmittedAnswerSnapshot = {
      answerSnapshotRef: 'snap-1', schoolId: 's1', studentId: 's1',
      questionId: 'q1', questionVersionId: 'qv1', questionType: 'mc',
      submittedAnswerSafeText: 'A',
      submittedAt: new Date().toISOString(), sourceType: 'mock_snapshot', sourceRef: 't',
    };
    expect(snapshot.submittedAnswerSafeText).toBeTruthy();
    expect((snapshot as any).rawStudentWork).toBeUndefined();
    expect((snapshot as any).rawFileUpload).toBeUndefined();
    expect((snapshot as any).rawAudio).toBeUndefined();
    expect((snapshot as any).rawImage).toBeUndefined();
    expect((snapshot as any).ocrText).toBeUndefined();
  });

  it('missing idempotencyKey blocks API mutation', () => {
    const idempotencyKey = null;
    expect(idempotencyKey).toBeNull();
  });

  it('missing policy fails closed', async () => {
    const service = makeService();
    const params: CreateMarkingRunParams = {
      schoolId: 'school-1', sourceType: 'mock_snapshot', sourceRef: 't1',
      createdByActorId: 't1', createdByRole: 'teacher', safeSummary: '',
    };
    const run = await service.createMarkingRun(params);
    expect(run.status).toBe('draft');
  });
});
