import { describe, it, expect } from 'vitest';
import { checkTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';

describe('Task 032 - AI / Memory Before Gates', () => {
  function baseInput() {
    return {
      input: {
        actorRole: 'student' as const,
        actorHash: 'student_hash_task032_safe_001',
        schoolId: 'school_task032_canary_safe',
        cohortId: 'canary_cohort_task032_safe',
        canaryRunId: 'canary_run_task032_safe',
        studentHash: 'student_hash_task032_safe_001',
        curriculumScope: 'curriculum_scope_task032_safe_001',
        sourceScope: 'task032_safe_source_scope_001',
        subjectId: 'subject_task032_safe_math_001',
        classId: 'class_task032_safe_001',
      },
      canaryState: 'active' as const,
      isPaused: false,
      isKillSwitchActive: false,
      rollbackActive: false,
      hasCurriculumScope: true,
      hasSourceScope: true,
      socraticGatePassed: true,
      deenGatePassed: true,
      privacyGatePassed: true,
      isStudentInCohort: true,
      isApprovedSchool: true,
      isApprovedCohort: true,
      isActive: true,
      consentAuthorizationOk: true,
    };
  }

  it('should block AI when school identity missing', async () => {
    const input = { ...baseInput(), input: { ...baseInput().input, actorRole: 'unknown' as const } };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCreateSession).toBe(false);
  });

  it('should block AI when canary is paused', async () => {
    const input = { ...baseInput(), isPaused: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCreateSession).toBe(false);
  });

  it('should block AI when kill switch active', async () => {
    const input = { ...baseInput(), isKillSwitchActive: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
  });

  it('should block AI when rollback active', async () => {
    const input = { ...baseInput(), rollbackActive: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
  });

  it('should block AI when curriculum scope missing', async () => {
    const input = { ...baseInput(), hasCurriculumScope: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
  });

  it('should block AI when Socratic gate fails', async () => {
    const input = { ...baseInput(), socraticGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
  });

  it('should block AI when Deen gate fails', async () => {
    const input = { ...baseInput(), deenGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
  });

  it('should block AI when privacy gate fails', async () => {
    const input = { ...baseInput(), privacyGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
  });

  it('should block student outside canary', async () => {
    const input = { ...baseInput(), isStudentInCohort: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCreateSession).toBe(false);
  });

  it('should allow approved active canary member after all gates', async () => {
    const result = await checkTask032CanaryRuntimeGuard(baseInput());
    expect(result.allowed).toBe(true);
    expect(result.safeToCallAi).toBe(true);
    expect(result.safeToAccessMemory).toBe(true);
    expect(result.safeToCreateSession).toBe(true);
  });
});
