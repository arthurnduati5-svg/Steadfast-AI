import { describe, it, expect, beforeEach } from 'vitest';
import { enforcePilotRuntimeGate } from '../services/task026PilotRuntimeGuardIntegration';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 No Live AI Before Runtime Gate', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
  });

  it('should block AI provider call when runtime gate fails', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'ai_provider_call',
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should block AI provider call with no school identity', async () => {
    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'ai_provider_call',
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should block AI call when execution run is not active', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-1',
      name: 'AI Gate Test',
      scopeSummarySafe: 'Test',
      createdByRole: 'admin',
      approvalStatus: 'approved',
    });
    const ppId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(ppId, 'active', 'admin');

    const result = await enforcePilotRuntimeGate({
      integrationPoint: 'ai_provider_call',
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId: ppId,
    });

    expect(result.allowed).toBe(false);
  });
});
