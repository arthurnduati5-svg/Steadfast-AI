import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_OUTPUT_FIELDS,
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
  TASK036_ALLOWED_ENVIRONMENT_TYPES,
  TASK036_ALLOWED_LAUNCH_MODES,
  TASK036_DENIED_ACTOR_ROLES,
  calculateTask036FinalLaunchDecision,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateForbiddenOutputFields,
  validateForbiddenSideEffects,
  validateFutureTaskBoundaries,
  validateFinalLaunchDecision,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Task036 Verification Script Smoke', () => {
  it('no output fields contain forbidden data', () => {
    const obj = {
      safeField: 'hello',
      anotherSafe: 42,
      nested: { value: true },
    };
    expect(validateForbiddenOutputFields(obj)).toEqual([]);
  });

  it('forbidden output fields list is comprehensive', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('secret');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS.length).toBeGreaterThanOrEqual(14);
  });

  it('no side effect patterns found in clean code', () => {
    const cleanCode = 'function getData() { return fetchSafeData(); }';
    const errors = validateForbiddenSideEffects(cleanCode);
    const forbiddenInClean = errors.filter(e => !e.includes('fetch('));
    expect(forbiddenInClean).toEqual([]);
  });

  it('side effect patterns detect violations', () => {
    const dirtyCode = 'openai.chat.completions.create()';
    const errors = validateForbiddenSideEffects(dirtyCode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('future task patterns detect violations', () => {
    const dirtyCode = '// TODO: implement task040';
    const errors = validateFutureTaskBoundaries(dirtyCode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('forbidden side effects patterns include AI providers', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('anthropic');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gemini');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('fetch(');
  });

  it('forbidden future task patterns include task040', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('multi-school rollout');
  });

  it('allowed environment types exclude production', () => {
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).not.toContain('production');
  });

  it('allowed launch modes are restricted', () => {
    expect(TASK036_ALLOWED_LAUNCH_MODES).toEqual(['single_school_controlled_live_launch']);
  });

  it('denied actor roles include students', () => {
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('student');
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('teacher');
  });

  it('final launch decision validation works', () => {
    const gates: Record<string, boolean> = {
      dependencyProofPassed: true, environmentGatePassed: true,
      launchWindowPassed: true, launchApprovalPassed: true,
      singleSchoolScopePassed: true, privacyBoundaryPassed: true,
      contentGovernancePassed: true, socraticIntegrityPassed: true,
      deenBoundaryPassed: true, schoolIdentityPassed: true,
      crossSchoolDenialPassed: true, runtimeMonitoringPassed: true,
      healthBudgetPassed: true, incidentReadinessPassed: true,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(validateFinalLaunchDecision(decision)).toEqual([]);
  });

  it('verifies all forbidden patterns are strings', () => {
    for (const p of TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
      expect(typeof p).toBe('string');
    }
    for (const p of TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS) {
      expect(typeof p).toBe('string');
    }
  });
});
