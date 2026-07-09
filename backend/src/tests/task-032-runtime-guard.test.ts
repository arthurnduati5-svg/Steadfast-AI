import { describe, it, expect } from 'vitest';
import { checkTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';

function makePassingInput() {
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

describe('Task 032 - Runtime Guard', () => {
  it('should pass when all gates pass for active canary student', async () => {
    const result = await checkTask032CanaryRuntimeGuard(makePassingInput());
    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow_canary_runtime');
    expect(result.safeToCreateSession).toBe(true);
    expect(result.safeToAccessMemory).toBe(true);
    expect(result.safeToCallAi).toBe(true);
  });

  it('should deny unknown role', async () => {
    const input = { ...makePassingInput(), input: { ...makePassingInput().input, actorRole: 'unknown' as const } };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.safeToCreateSession).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCallAi).toBe(false);
  });

  it('should deny student not in cohort', async () => {
    const input = { ...makePassingInput(), isStudentInCohort: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_not_in_canary');
  });

  it('should deny when canary is paused', async () => {
    const input = { ...makePassingInput(), isPaused: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_canary_paused');
    expect(result.safeToCreateSession).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCallAi).toBe(false);
  });

  it('should deny when kill switch is active', async () => {
    const input = { ...makePassingInput(), isKillSwitchActive: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_kill_switch_active');
  });

  it('should deny when rollback is active', async () => {
    const input = { ...makePassingInput(), rollbackActive: true };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_rollback_active');
  });

  it('should deny when curriculum scope is missing', async () => {
    const input = { ...makePassingInput(), hasCurriculumScope: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_missing_curriculum_scope');
    expect(result.safeToCallAi).toBe(false);
  });

  it('should deny when Socratic gate fails', async () => {
    const input = { ...makePassingInput(), socraticGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_socratic_gate_failed');
    expect(result.safeToCallAi).toBe(false);
  });

  it('should deny when Deen gate fails', async () => {
    const input = { ...makePassingInput(), deenGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_deen_gate_failed');
  });

  it('should deny when privacy gate fails', async () => {
    const input = { ...makePassingInput(), privacyGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny_privacy_gate_failed');
  });

  it('should deny inactive student', async () => {
    const input = { ...makePassingInput(), isActive: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.blockingIssues).toContain('inactive_student');
  });

  it('should deny teacher entering student runtime', async () => {
    const input = { ...makePassingInput(), input: { ...makePassingInput().input, actorRole: 'teacher' as const } };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.blockingIssues).toContain('teacher_not_allowed_in_student_runtime');
  });

  it('should provide safe reason code when denied', async () => {
    const input = { ...makePassingInput(), isStudentInCohort: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.safeReasonCode).toBe('student_not_in_approved_canary');
  });

  it('should not expose raw private data', async () => {
    const result = await checkTask032CanaryRuntimeGuard(makePassingInput());
    expect(result.rawPrivateDataExposed).toBe(false);
  });

  it('should block AI call before gates pass', async () => {
    const input = { ...makePassingInput(), socraticGatePassed: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.allowed).toBe(false);
    expect(result.safeToCallAi).toBe(false);
    expect(result.safeToAccessMemory).toBe(false);
    expect(result.safeToCreateSession).toBe(false);
  });

  it('should have comprehensive gate checks', async () => {
    const input = { ...makePassingInput(), canaryState: 'draft' as const, isStudentInCohort: false };
    const result = await checkTask032CanaryRuntimeGuard(input);
    expect(result.gateChecks.length).toBeGreaterThan(10);
    const failedGates = result.gateChecks.filter(g => !g.passed);
    expect(failedGates.length).toBeGreaterThan(0);
  });
});
