import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess, checkPilotAccessForTutorSession } from '../services/task025PilotAccessGateService';

describe('task025PilotAccessGate', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  let PROGRAM_ID: string = '';

  async function setupActivePilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Gate Test Pilot',
      scopeSummarySafe: 'Gate test scope',
      allowedSubjects: ['Mathematics', 'Science'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    PROGRAM_ID = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      name: 'Gate Test Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher-hash-001',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    return program;
  }

  it('allows access for eligible student in active pilot', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(true);
  });

  it('denies access when no school identity', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: '',
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('denies access for nonexistent program', async () => {
    const result = await checkPilotAccess({
      pilotProgramId: 'nonexistent',
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('pilot_program_not_found');
  });

  it('denies access when pilot is rolled back', async () => {
    await setupActivePilot();
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'rolled_back');
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('pilot_rolled_back');
  });

  it('denies access when pilot is paused', async () => {
    await setupActivePilot();
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'paused');
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('pilot_not_active');
  });

  it('denies access for school mismatch', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: 'other-school',
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('denies access for role not allowed', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'external-actor',
      role: 'counselor',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('denies access for user not in participants', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'unknown-user',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });

  it('denies access for participant not eligible', async () => {
    await setupActivePilot();
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'blocked-student',
      role: 'student',
      eligibilityStatus: 'blocked',
    });
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'blocked-student',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_not_eligible');
  });

  it('denies access for subject outside pilot scope', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
      subject: 'History',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('subject_not_in_pilot_scope');
  });

  it('denies access for curriculum track outside pilot scope', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
      curriculumTrack: 'saudi_national',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('curriculum_track_not_in_pilot_scope');
  });

  it('checkPilotAccessForTutorSession blocks after kill switch', async () => {
    await setupActivePilot();
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'rolled_back');
    const result = await checkPilotAccessForTutorSession({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
  });

  it('student outside cohort is denied', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'outside-student',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
  });

  it('teacher outside pilot scope is denied', async () => {
    await setupActivePilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'outside-teacher',
      role: 'teacher',
    });
    expect(result.allowed).toBe(false);
  });
});
