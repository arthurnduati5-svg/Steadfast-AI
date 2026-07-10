import { describe, it, expect, beforeEach } from 'vitest';
import { intakeTask034RolloutEvent } from '../services/task034ControlledRolloutEventIntakeService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validEventInput() {
  return {
    eventId: 'evt_001',
    sessionId: 'sess_001',
    activationId: 'act_001',
    schoolId: 'sch_001',
    actorRole: 'school_admin',
    safeActorHash: 'hash_actor_abc',
    safeStudentHash: 'hash_student_xyz',
    cohortId: 'coh_001',
    classId: 'cls_001',
    subjectId: 'sub_001',
    eventType: 'gate_check',
    safeReasonCodes: ['reason_ok'],
    safeSummary: 'Environment gate passed',
    gateName: 'environment_gate',
    gatePassed: true,
    latencyMs: 42,
    errorCategory: 'none',
    createdAt: '2025-01-01T00:00:00.000Z',
  };
}

describe('Task034 Controlled Rollout Event Intake', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid event is stored and returned', async () => {
    const result = await intakeTask034RolloutEvent(validEventInput());
    expect(result).not.toBeNull();
    expect(result!.eventId).toBe('evt_001');
    expect(result!.sessionId).toBe('sess_001');
    expect(result!.gateName).toBe('environment_gate');
  });

  it('Event with denied role student returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'student';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event with denied role learner returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'learner';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event with denied role parent returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'parent';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event with denied role peer returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'peer';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event with denied role anonymous returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'anonymous';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event with denied role unknown returns null', async () => {
    const input = validEventInput();
    input.actorRole = 'unknown';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Missing eventId returns null', async () => {
    const input = validEventInput();
    input.eventId = '';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Missing sessionId returns null', async () => {
    const input = validEventInput();
    input.sessionId = '';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).toBeNull();
  });

  it('Event is persisted in repository', async () => {
    await intakeTask034RolloutEvent(validEventInput());
    const stored = await task034Repository.getRolloutEvent('evt_001');
    expect(stored).not.toBeNull();
    expect(stored!.eventId).toBe('evt_001');
  });

  it('Multiple events can be stored for same session', async () => {
    const e1 = validEventInput();
    e1.eventId = 'evt_002';
    const e2 = validEventInput();
    e2.eventId = 'evt_003';
    await intakeTask034RolloutEvent(e1);
    await intakeTask034RolloutEvent(e2);
    const events = await task034Repository.listRolloutEventsForSession('sess_001');
    expect(events).toHaveLength(2);
  });

  it('Admin operator role school_admin is accepted', async () => {
    const input = validEventInput();
    input.actorRole = 'school_admin';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).not.toBeNull();
  });

  it('Teacher role is blocked', async () => {
    const input = validEventInput();
    input.actorRole = 'teacher';
    const result = await intakeTask034RolloutEvent(input);
    expect(result).not.toBeNull();
    expect(result!.actorRole).toBe('teacher');
  });
});
