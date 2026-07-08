import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { runPilotDryRun } from '../services/task025PilotDryRunService';

describe('task025NoLiveAiCallDuringDryRun', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function setupCompletePilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'No AI Pilot',
      scopeSummarySafe: 'No AI scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
      rollbackEnabled: true,
      killSwitchEnabled: true,
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'No AI Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    return progId;
  }

  it('dry run makes no live AI call — verified via metadata', async () => {
    const progId = await setupCompletePilot();
    const result = await runPilotDryRun(progId, SCHOOL_ID, 'no-ai-verification');

    const record = await task025PilotRepository.getDryRun(result.id);
    const meta = (record as any)?.metadataSafeJson;
    const metaObj = typeof meta === 'string' ? JSON.parse(meta) : meta;

    expect(metaObj.liveAiCalled).toBe(false);
    expect(metaObj.rawStudentDataUsed).toBe(false);
    expect(metaObj.syntheticDataUsed).toBe(true);
  });

  it('dry run checks do not include any AI provider call', async () => {
    const progId = await setupCompletePilot();
    const result = await runPilotDryRun(progId, SCHOOL_ID, 'no-ai-check');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('aiProvider');
    expect(serialized).not.toContain('ai_call');
    expect(serialized).not.toContain('llm_call');
    expect(serialized).not.toContain('openai');
    expect(serialized).not.toContain('anthropic');
  });
});
