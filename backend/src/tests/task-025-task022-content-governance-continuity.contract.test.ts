import { describe, it, expect } from 'vitest';
import {
  TASK025_BLOCKER_TYPES,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { PILOT_READINESS_CHECK_TYPES } from '../contracts/task025PilotContracts';

describe('Task025 Task022 content governance continuity contract', () => {
  it('blocker types include content_governance from Task 022', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('content_governance');
  });

  it('readiness check types include curriculum_scope from content governance', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('curriculum_scope');
  });

  it('readiness check types include approved_sources from Task 022', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('approved_sources');
  });

  it('readiness check types include content_governance and deen_governance from Task 022', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('content_governance');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('deen_governance');
  });

  it('readiness check types include socratic_safety and academic_integrity from content governance pipeline', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('socratic_safety');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('academic_integrity');
  });
});
