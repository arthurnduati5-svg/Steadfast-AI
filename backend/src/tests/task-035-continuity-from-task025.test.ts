import { describe, it, expect } from 'vitest';
import {
  validateTask025PilotReadinessContext,
  validateTask025PilotScopeInput,
  validateTask025CandidateCohortInput,
  validateTask025StakeholderReadinessInput,
  validateTask025AdminAcceptanceInput,
} from '../lib/task025ControlledPilotReadinessValidation';

describe('task035 continuity from task025 (pilot readiness)', () => {
  it('pilot readiness validators are importable', () => {
    expect(typeof validateTask025PilotReadinessContext).toBe('function');
    expect(typeof validateTask025PilotScopeInput).toBe('function');
    expect(typeof validateTask025CandidateCohortInput).toBe('function');
  });

  it('rejects pilot context without schoolId', () => {
    const result = validateTask025PilotReadinessContext({ actorId: 'a', actorRole: 'admin' });
    expect(result.valid).toBe(false);
    if (!result.valid && 'code' in result) {
      expect(result.code).toBe('MISSING_SCHOOL_ID');
    }
  });

  it('rejects learner roles for pilot readiness', () => {
    const result = validateTask025PilotReadinessContext({
      schoolId: 'school_1',
      actorId: 'learner_1',
      actorRole: 'student',
      verifiedSchoolIdentity: true,
    });
    expect(result.valid).toBe(false);
    if (!result.valid && 'code' in result) {
      expect(result.code).toBe('LEARNER_PARENT_PEER_DENIED');
    }
  });

  it('accepts valid admin pilot context', () => {
    const result = validateTask025PilotReadinessContext({
      schoolId: 'school_1',
      actorId: 'admin_1',
      actorRole: 'admin',
      verifiedSchoolIdentity: true,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects cross-school pilot scope', () => {
    const result = validateTask025PilotScopeInput(
      { schoolId: 'school_2', pilotPurpose: 'test', cohortSize: 10, pilotDurationWeeks: 4 },
      'school_1',
    );
    expect(result.valid).toBe(false);
    if (!result.valid && 'code' in result) {
      expect(result.code).toBe('CROSS_SCHOOL_SCOPE');
    }
  });

  it('rejects cohort without teacher owner', () => {
    const result = validateTask025CandidateCohortInput(
      { schoolId: 'school_1', cohortSize: 10 },
      'school_1',
    );
    expect(result.valid).toBe(false);
    if (!result.valid && 'code' in result) {
      expect(result.code).toBe('MISSING_COHORT_ID');
    }
  });

  it('validates stakeholder readiness requires teacher IDs', () => {
    const result = validateTask025StakeholderReadinessInput({ schoolId: 'school_1', adminIds: ['a'] }, 'school_1');
    expect(result.valid).toBe(false);
  });

  it('validates admin acceptance requires owner', () => {
    const result = validateTask025AdminAcceptanceInput({});
    expect(result.valid).toBe(false);
    if (!result.valid && 'code' in result) {
      expect(result.code).toBe('MISSING_ADMIN_ACCEPTANCE_OWNER');
    }
  });
});
