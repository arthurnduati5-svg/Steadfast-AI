import { describe, it, expect, beforeEach } from 'vitest';
import { enforcePilotRuntimeGate } from '../services/task026PilotRuntimeGuardIntegration';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 No Memory Before Runtime Gate', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
  });

  it('should block memory read when runtime gate fails', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'memory_read',
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should block memory read without school identity', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'memory_read',
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should block conversation read without gate pass', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'conversation_read',
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should block learning evidence write without gate pass', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'learning_evidence_write',
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });
});
