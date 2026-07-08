import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { runPilotDryRun, getDryRunStatus } from '../services/task025PilotDryRunService';

describe('task025PilotDryRunService', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';
  let PROGRAM_ID: string = '';

  async function setupCompletePilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Dry Run Pilot',
      scopeSummarySafe: 'Dry run scope',
      allowedSubjects: ['Mathematics'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
      rollbackEnabled: true,
      killSwitchEnabled: true,
    });
    PROGRAM_ID = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      name: 'Dry Run Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'dryrun-teacher',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'dryrun-student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
  }

  async function createMinimalPilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Incomplete Pilot',
      scopeSummarySafe: 'Incomplete',
      createdByRole: 'admin',
    });
    PROGRAM_ID = (program as any).id;
  }

  it('dry run passes for complete pilot setup', async () => {
    await setupCompletePilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'test-dry-run');
    expect(result.status).toBe('passed');
    expect(result.checksPassed.length).toBeGreaterThan(0);
    expect(result.checksFailed.length).toBe(0);
    expect(result.blockingIssues.length).toBe(0);
  });

  it('dry run fails for incomplete pilot', async () => {
    await createMinimalPilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'incomplete-dry-run');
    expect(result.status).toBe('failed');
    expect(result.checksFailed.length).toBeGreaterThan(0);
  });

  it('dry run does not call live AI', async () => {
    await setupCompletePilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'no-ai-dry-run');
    expect(result.status).toBe('passed');
    const record = await task025PilotRepository.getDryRun(result.id);
    const meta = (record as any)?.metadataSafeJson;
    if (typeof meta === 'string') {
      const parsed = JSON.parse(meta);
      expect(parsed.liveAiCalled).toBe(false);
    } else if (meta) {
      expect(meta.liveAiCalled).toBe(false);
    }
  });

  it('dry run does not expose raw student data', async () => {
    await setupCompletePilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'privacy-dry-run');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('rawChat');
    expect(serialized).not.toContain('raw_chat');
    expect(serialized).not.toContain('privateMemory');
    expect(serialized).not.toContain('providerResponse');
    expect(serialized).not.toContain('answerKey');
  });

  it('getDryRunStatus returns null for nonexistent dry run', async () => {
    const status = await getDryRunStatus('nonexistent');
    expect(status).toBeNull();
  });

  it('dry run checks Socratic/no-final-answer policy', async () => {
    await setupCompletePilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'socratic-check');
    expect(result.checksPassed).toContain('socratic_no_final_answer_guard_checked');
  });

  it('dry run checks Deen governance policy', async () => {
    await setupCompletePilot();
    const result = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'deen-check');
    expect(result.checksPassed).toContain('deen_governance_checked');
  });
});
