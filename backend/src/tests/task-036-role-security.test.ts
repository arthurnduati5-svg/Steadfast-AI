import { describe, it, expect } from 'vitest';
import {
  TASK036_ALLOWED_ACTOR_ROLES,
  TASK036_DENIED_ACTOR_ROLES,
  REQUIRED_APPROVAL_ROLES,
  resolveTask036ActorRole,
  isTask036LaunchOperatorRole,
  isTask036DeniedRole,
} from '../contracts/task036LiveSchoolLaunchContracts';

type RolePolicy = {
  role: string;
  canApproveLaunch: boolean;
  canManageRollback: boolean;
  canManageKillSwitch: boolean;
  canAccessPrivacyData: boolean;
  canAccessDeenData: boolean;
};

const ROLE_POLICIES: Record<string, RolePolicy> = {
  school_admin: { role: 'school_admin', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: false },
  internal_operator: { role: 'internal_operator', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: false },
  technical_operator: { role: 'technical_operator', canApproveLaunch: false, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: false },
  privacy_owner: { role: 'privacy_owner', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: true, canAccessDeenData: false },
  safeguarding_owner: { role: 'safeguarding_owner', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: true, canAccessDeenData: false },
  content_governance_owner: { role: 'content_governance_owner', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: false },
  deen_review_owner: { role: 'deen_review_owner', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: true },
  rollback_owner: { role: 'rollback_owner', canApproveLaunch: true, canManageRollback: true, canManageKillSwitch: true, canAccessPrivacyData: false, canAccessDeenData: false },
  support_owner: { role: 'support_owner', canApproveLaunch: true, canManageRollback: false, canManageKillSwitch: false, canAccessPrivacyData: false, canAccessDeenData: false },
};

describe('Task036 Role Security', () => {
  it('all allowed roles are in role policies', () => {
    for (const role of TASK036_ALLOWED_ACTOR_ROLES) {
      expect(ROLE_POLICIES[role]).toBeDefined();
    }
  });

  it('denied roles are not in role policies', () => {
    for (const role of TASK036_DENIED_ACTOR_ROLES) {
      expect(ROLE_POLICIES[role]).toBeUndefined();
    }
  });

  it('REQUIRED_APPROVAL_ROLES match allowed roles', () => {
    expect(REQUIRED_APPROVAL_ROLES).toEqual(TASK036_ALLOWED_ACTOR_ROLES);
  });

  it('only rollback_owner can manage rollback', () => {
    for (const [role, policy] of Object.entries(ROLE_POLICIES)) {
      if (role === 'rollback_owner') {
        expect(policy.canManageRollback).toBe(true);
        expect(policy.canManageKillSwitch).toBe(true);
      } else {
        expect(policy.canManageRollback).toBe(false);
      }
    }
  });

  it('only privacy_owner and safeguarding_owner can access privacy data', () => {
    for (const [role, policy] of Object.entries(ROLE_POLICIES)) {
      if (role === 'privacy_owner' || role === 'safeguarding_owner') {
        expect(policy.canAccessPrivacyData).toBe(true);
      } else {
        expect(policy.canAccessPrivacyData).toBe(false);
      }
    }
  });

  it('only deen_review_owner can access deen data', () => {
    for (const [role, policy] of Object.entries(ROLE_POLICIES)) {
      if (role === 'deen_review_owner') {
        expect(policy.canAccessDeenData).toBe(true);
      } else {
        expect(policy.canAccessDeenData).toBe(false);
      }
    }
  });

  it('resolveTask036ActorRole maps denied roles correctly', () => {
    expect(isTask036DeniedRole(resolveTask036ActorRole('student'))).toBe(true);
    expect(isTask036DeniedRole(resolveTask036ActorRole('teacher'))).toBe(true);
    expect(isTask036DeniedRole(resolveTask036ActorRole('parent'))).toBe(true);
  });

  it('resolveTask036ActorRole maps allowed roles correctly', () => {
    expect(isTask036LaunchOperatorRole(resolveTask036ActorRole('school_admin'))).toBe(true);
    expect(isTask036LaunchOperatorRole(resolveTask036ActorRole('rollback_owner'))).toBe(true);
  });

  it('unknown role resolves to unknown and is denied', () => {
    const role = resolveTask036ActorRole('some_random_role');
    expect(role).toBe('unknown');
    expect(isTask036DeniedRole(role)).toBe(true);
  });
});
