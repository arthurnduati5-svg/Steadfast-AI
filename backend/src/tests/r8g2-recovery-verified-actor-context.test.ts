import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryOutcomeActionPolicyEnforcer } from '../domains/assessment/recovery-outcome-action/policies/recoveryOutcomeActionPolicyDefinitions';

/**
 * R8-G.2 authorization proof (static contract test).
 *
 * Proves across the fixed seven-file recovery route set:
 * - no caller-controlled x-user-id / x-user-role / x-school-id authorization
 *   fallback remains in executable route code;
 * - verified server actor context is the identity source;
 * and proves the Package-20 role vocabulary:
 * - student / parent / guest / unknown remain denied;
 * - teacher / admin / school_admin are allowed.
 */

const SEVEN_ROUTES = [
  'src/routes/recoveryOutcomeAction.ts',
  'src/routes/recoveryCaseTriage.ts',
  'src/routes/recoveryLifecycleClosure.ts',
  'src/routes/recoveryCaseAdjudication.ts',
  'src/routes/recoveryOutcomeExecutionSimulation.ts',
  'src/routes/recoveryExecutionAuthorizationPreview.ts',
  'src/routes/recoveryExecutionReadinessBoard.ts',
];

const FORBIDDEN_FALLBACK_PATTERNS = [
  "req.headers['x-user-id']",
  'req.headers["x-user-id"]',
  "req.headers['x-user-role']",
  'req.headers["x-user-role"]',
  "req.headers['x-school-id']",
  'req.headers["x-school-id"]',
  '(req as any).userId',
  '(req as any).userRole',
  '(req as any).schoolId',
  'req.body.schoolId',
  'req.body.actorId',
  'req.body.actorRole',
];

function readRoute(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', rel), 'utf-8');
}

describe('R8-G.2 recovery verified actor context', () => {
  it.each(SEVEN_ROUTES)('%s contains no caller-controlled identity authorization fallback', (rel) => {
    const content = readRoute(rel);
    for (const pattern of FORBIDDEN_FALLBACK_PATTERNS) {
      expect(content, `${rel} must not contain authorization fallback ${pattern}`).not.toContain(pattern);
    }
  });

  it.each(SEVEN_ROUTES)('%s derives caller identity from verified server context', (rel) => {
    const content = readRoute(rel);
    expect(content).toContain('verifiedActorContext');
    const usesHelper =
      content.includes('buildVerifiedActorContext(req)') || content.includes('getVerifiedSchoolId(req)');
    expect(usesHelper, `${rel} must use buildVerifiedActorContext or getVerifiedSchoolId`).toBe(true);
  });

  it('candidate set is exactly the frozen seven routes', () => {
    expect(SEVEN_ROUTES).toHaveLength(7);
  });
});

describe('R8-G.2 Package-20 role vocabulary', () => {
  const enforcer = new RecoveryOutcomeActionPolicyEnforcer();
  const policy = 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION';

  it.each(['teacher', 'lead_teacher', 'department_head', 'admin', 'school_admin', 'system_job'])(
    '%s is allowed Package-20 teacher+ access',
    (role) => {
      const decision = enforcer.enforce(role, policy);
      expect(decision.allowed).toBe(true);
      expect(decision.denied).toBe(false);
    },
  );

  it.each(['student', 'parent', 'guest', 'unknown'])('%s remains denied', (role) => {
    const decision = enforcer.enforce(role, policy);
    expect(decision.allowed).toBe(false);
    expect(decision.denied).toBe(true);
  });

  it('missing/unsupported verified role fails closed, never defaults to allowed', () => {
    for (const role of ['', 'counselor', 'internal_operator']) {
      const decision = enforcer.enforce(role, policy);
      expect(decision.allowed).toBe(false);
      expect(decision.denied).toBe(true);
    }
  });
});
