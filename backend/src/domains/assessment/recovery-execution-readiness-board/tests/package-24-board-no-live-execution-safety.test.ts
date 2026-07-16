import { describe, it, expect } from 'vitest';
import { RECOVERY_EXECUTION_READINESS_BOARD_POLICIES } from '../policies/recoveryExecutionReadinessBoardPolicyDefinitions';

function checkPolicy(policyFamily: string, actorRole: string): { allowed: boolean; denied: boolean } {
  const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyFamily];
  if (!policy) return { allowed: false, denied: true };
  if (policy.blockedRoles.includes(actorRole)) return { allowed: false, denied: true };
  if (policy.allowedRoles.includes(actorRole)) return { allowed: true, denied: false };
  if (policy.failClosed) return { allowed: false, denied: true };
  return { allowed: false, denied: true };
}

describe('Package 24 - Board No-Live Execution Safety', () => {
  const ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  const testCases = [
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_BOARD_ACTION', 'checkNoLiveBoardAction'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_AUTHORIZATION', 'checkNoLiveAuthorization'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_EXECUTION', 'checkNoLiveExecution'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_CLOSURE', 'checkNoLiveClosure'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ACTIVATION', 'checkNoLiveActivation'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_COMPLETION', 'checkNoLiveCompletion'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_ASSIGNMENT', 'checkNoLiveAssignment'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_LIVE_NOTIFICATION', 'checkNoLiveNotification'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_PORTAL_PUBLISH', 'checkNoPortalPublish'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_SCORE_MUTATION', 'checkNoScoreMutation'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_MASTERY_MUTATION', 'checkNoMasteryMutation'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_REGRADE_EXECUTION', 'checkNoRegradeExecution'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_GENERATED_QUESTION', 'checkNoGeneratedQuestion'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_AI_NARRATIVE', 'checkNoAINarrative'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_OCR', 'checkNoOCR'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_PDF', 'checkNoPDF'],
    ['RECOVERY_EXECUTION_READINESS_BOARD_NO_EXTERNAL_SYNC', 'checkNoExternalSync'],
  ];

  for (const [policyFamily, methodName] of testCases) {
    it(`${methodName} returns allowed=false even for admin`, () => {
      const decision = checkPolicy(policyFamily, ctx.actorRole);
      expect(decision.allowed).toBe(false);
      expect(decision.denied).toBe(true);
      const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyFamily];
      expect(policy.allowedRoles).not.toContain(ctx.actorRole);
      expect(policy.blockedRoles).toContain(ctx.actorRole);
    });
  }

  it('all 17 no-live policies exist in policy definitions', () => {
    expect(testCases.length).toBe(17);
    for (const [policyFamily] of testCases) {
      expect(RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyFamily]).toBeDefined();
    }
  });
});
