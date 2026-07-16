import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardQueueService } from '../services/recoveryExecutionReadinessBoardQueueService';
import {
  InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository,
  InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository,
} from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Teacher/Admin Queue Safety', () => {
  it('createTeacherQueue returns queue with boardTeacherQueueId', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const result = await service.createTeacherQueue(ctx, 'school-1', {
      schoolId: 'school-1',
      teacherRef: 'teacher-1',
      queueSummary: 'Teacher queue',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardTeacherQueueId).toBeDefined();
  });

  it('createAdminQueue returns queue with boardAdminQueueId', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const result = await service.createAdminQueue(ctx, 'school-1', {
      schoolId: 'school-1',
      adminRef: 'admin-1',
      queueSummary: 'Admin queue',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardAdminQueueId).toBeDefined();
  });

  it('listTeacherQueuesForSchool returns teacher queues', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't2', queueSummary: 'Q2' });
    const result = await service.listTeacherQueuesForSchool('school-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listAdminQueuesForSchool returns admin queues', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a2', queueSummary: 'A2' });
    const result = await service.listAdminQueuesForSchool('school-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listTeacherQueuesByTeacher filters by teacherRef', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    const result = await service.listTeacherQueuesByTeacher('t1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
  });

  it('listAdminQueuesByAdmin filters by adminRef', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    const result = await service.listAdminQueuesByAdmin('a1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
  });

  it('markTeacherQueueReviewReady changes queueStatus', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    const result = await service.markTeacherQueueReviewReady(ctx, 'school-1', created.data!.boardTeacherQueueId);
    expect(result.success).toBe(true);
    expect(result.data?.queueStatus).toBe('review_ready');
  });

  it('markAdminQueueReviewReady changes queueStatus', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    const result = await service.markAdminQueueReviewReady(ctx, 'school-1', created.data!.boardAdminQueueId);
    expect(result.success).toBe(true);
    expect(result.data?.queueStatus).toBe('review_ready');
  });

  it('refreshTeacherQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    const result = await service.refreshTeacherQueue(ctx, 'school-1', created.data!.boardTeacherQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('refreshed');
  });

  it('refreshAdminQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    const result = await service.refreshAdminQueue(ctx, 'school-1', created.data!.boardAdminQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('refreshed');
  });

  it('blockTeacherQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    const result = await service.blockTeacherQueue(ctx, 'school-1', created.data!.boardTeacherQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('blockAdminQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    const result = await service.blockAdminQueue(ctx, 'school-1', created.data!.boardAdminQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('voidTeacherQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createTeacherQueue(ctx, 'school-1', { schoolId: 'school-1', teacherRef: 't1', queueSummary: 'Q1' });
    const result = await service.voidTeacherQueue(ctx, 'school-1', created.data!.boardTeacherQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });

  it('voidAdminQueue works', async () => {
    const teacherRepo = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    const adminRepo = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    const service = new RecoveryExecutionReadinessBoardQueueService(teacherRepo, adminRepo);
    const created = await service.createAdminQueue(ctx, 'school-1', { schoolId: 'school-1', adminRef: 'a1', queueSummary: 'A1' });
    const result = await service.voidAdminQueue(ctx, 'school-1', created.data!.boardAdminQueueId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });
});
