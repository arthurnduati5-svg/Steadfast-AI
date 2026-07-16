import { describe, it, expect } from 'vitest';
import {
  InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository,
  InMemoryRecoveryExecutionReadinessBoardAuditRepository,
} from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

describe('Package 24 - Board Idempotency and Audit', () => {
  it('Idempotency checkIdempotency returns no_key when no idempotency key', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
    const result = await repo.getByIdempotencyKey('school-1', 'createSnapshot', 'ik-nonexistent');
    expect(result).toBeNull();
  });

  it('Idempotency markInProgress creates entry', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
    const result = await repo.create({
      schoolId: 'school-1',
      operation: 'createSnapshot',
      idempotencyKey: 'ik-1',
      status: 'in_progress',
    });
    expect(result.idempotencyKey).toBe('ik-1');
    expect(result.status).toBe('in_progress');
    expect(result.idempotencyId).toBeDefined();
  });

  it('Idempotency markComplete updates status', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
    const entry = await repo.create({
      schoolId: 'school-1',
      operation: 'createSnapshot',
      idempotencyKey: 'ik-1',
      status: 'in_progress',
    });
    const result = await repo.complete(entry.idempotencyId, 'Snapshot created');
    expect(result.status).toBe('completed');
    expect(result.resultSummary).toBe('Snapshot created');
  });

  it('Audit bridge recordAuditEvent creates audit event', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardAuditRepository();
    const result = await repo.create({
      schoolId: 'school-1',
      eventType: 'BOARD_SNAPSHOT_CREATED',
      actorId: 'actor-1',
      action: 'createBoardSnapshot',
    });
    expect(result.auditEventId).toBeDefined();
    expect(result.eventType).toBe('BOARD_SNAPSHOT_CREATED');
  });

  it('Audit bridge listAuditEventsForSchool returns events', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardAuditRepository();
    await repo.create({ schoolId: 'school-1', eventType: 'EVENT_1', action: 'action1' });
    await repo.create({ schoolId: 'school-1', eventType: 'EVENT_2', action: 'action2' });
    const results = await repo.listBySchool('school-1');
    expect(results.length).toBe(2);
  });

  it('Audit event contains action, actorId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardAuditRepository();
    const result = await repo.create({
      schoolId: 'school-1',
      eventType: 'BOARD_SNAPSHOT_CREATED',
      actorId: 'actor-1',
      action: 'createBoardSnapshot',
    });
    expect(result.action).toBe('createBoardSnapshot');
    expect(result.actorId).toBe('actor-1');
  });

  it('getByIdempotencyKey finds existing key', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
    await repo.create({
      schoolId: 'school-1',
      operation: 'createSnapshot',
      idempotencyKey: 'ik-1',
      status: 'completed',
    });
    const found = await repo.getByIdempotencyKey('school-1', 'createSnapshot', 'ik-1');
    expect(found).not.toBeNull();
    expect(found.status).toBe('completed');
  });
});
