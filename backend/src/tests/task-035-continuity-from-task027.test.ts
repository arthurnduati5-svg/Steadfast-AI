import { describe, it, expect } from 'vitest';
import {
  validateTask027GovernanceContext,
  validateTask027TeacherReviewInput,
  validateTask027SchoolAdminApprovalInput,
  validateTask027DeenContentReviewInput,
  validateTask027PrivacyReviewInput,
  rejectTask027ForbiddenFields,
} from '../lib/task027PilotExpansionGovernanceValidation';

describe('task035 continuity from task027 (expansion governance)', () => {
  it('expansion governance validators are importable', () => {
    expect(typeof validateTask027GovernanceContext).toBe('function');
    expect(typeof validateTask027TeacherReviewInput).toBe('function');
    expect(typeof validateTask027SchoolAdminApprovalInput).toBe('function');
    expect(typeof rejectTask027ForbiddenFields).toBe('function');
  });

  it('rejects governance context missing schoolId', () => {
    const result = validateTask027GovernanceContext({ actorId: 'a', actorRole: 'admin' });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects learner roles in governance context', () => {
    const result = validateTask027GovernanceContext({
      schoolId: 'school_1',
      actorId: 'learner_1',
      actorRole: 'student',
      pilotRunId: 'pilot_1',
      verifiedSchoolIdentity: true,
      task026CommitVerified: true,
      task025Accepted: true,
      task024Accepted: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('learner'))).toBe(true);
  });

  it('accepts valid admin governance context', () => {
    const result = validateTask027GovernanceContext({
      schoolId: 'school_1',
      actorId: 'admin_1',
      actorRole: 'school_admin',
      pilotRunId: 'pilot_1',
      verifiedSchoolIdentity: true,
      task026CommitVerified: true,
      task025Accepted: true,
      task024Accepted: true,
    });
    expect(result.ok).toBe(true);
  });

  it('validates teacher review input requires safe summary', () => {
    const result = validateTask027TeacherReviewInput({
      schoolId: 'school_1',
      proposalId: 'prop_1',
      pilotRunId: 'pilot_1',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates school admin approval requires multiple boolean gates', () => {
    const result = validateTask027SchoolAdminApprovalInput({
      schoolId: 'school_1',
      proposalId: 'prop_1',
      pilotRunId: 'pilot_1',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates deen content review requires deen source fields', () => {
    const result = validateTask027DeenContentReviewInput({
      schoolId: 'school_1',
      proposalId: 'prop_1',
      pilotRunId: 'pilot_1',
    });
    expect(result.ok).toBe(false);
  });

  it('validates privacy review requires all boolean checks', () => {
    const result = validateTask027PrivacyReviewInput({ schoolId: 's', proposalId: 'p', pilotRunId: 'r' });
    expect(result.ok).toBe(false);
  });

  it('detects forbidden fields', () => {
    const result = rejectTask027ForbiddenFields({ rawStudentData: 'secret' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for safe fields', () => {
    const result = rejectTask027ForbiddenFields({ schoolId: 's' });
    expect(result).toHaveLength(0);
  });
});
