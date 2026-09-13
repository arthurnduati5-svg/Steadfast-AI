// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Admin Diagnostics Scope Policy Service
// Restricts diagnostics access to authorized admin/internal roles.
// Fail-closed: unknown roles, missing contexts are denied.
// ─────────────────────────────────────────────────────────────

import type { TelemetryComponent } from '../contracts/task018Contracts';

export type ScopeDecision = {
  allowed: boolean;
  reason: string;
  safeMessage: string;
};

const ADMIN_ROLES = new Set(['admin', 'system', 'internal', 'superadmin']);
const INTERNAL_ROLES = new Set(['admin', 'system', 'internal', 'superadmin', 'service']);

const PUBLIC_SAFE_ROUTES = new Set([
  'health_check',
  'readiness_check',
]);

export function checkDiagnosticsScope(input: {
  actorRole?: string;
  actorId?: string;
  schoolId?: string;
  operation: string;
  component?: TelemetryComponent;
}): ScopeDecision {
  const role = (input.actorRole || '').toLowerCase().trim();

  // Public-safe operations
  if (PUBLIC_SAFE_ROUTES.has(input.operation)) {
    return {
      allowed: true,
      reason: 'public_safe_operation',
      safeMessage: 'Operation is safe for unauthenticated access',
    };
  }

  // No role provided
  if (!role) {
    return {
      allowed: false,
      reason: 'missing_role',
      safeMessage: 'Authentication required for diagnostics access',
    };
  }

  // Check admin/internal roles for sensitive operations
  if (ADMIN_ROLES.has(role)) {
    return {
      allowed: true,
      reason: `role_${role}_granted`,
      safeMessage: `Access granted for ${role} role`,
    };
  }

  if (INTERNAL_ROLES.has(role)) {
    return {
      allowed: true,
      reason: `role_${role}_granted`,
      safeMessage: `Access granted for ${role} role`,
    };
  }

  // Learner role — deny
  if (role === 'learner' || role === 'student') {
    return {
      allowed: false,
      reason: 'learner_role_denied',
      safeMessage: 'Learners cannot access diagnostics',
    };
  }

  // Teacher role — deny operational diagnostics
  if (role === 'teacher' || role === 'counselor' || role === 'counsellor') {
    return {
      allowed: false,
      reason: 'teacher_role_denied_operational_diagnostics',
      safeMessage: 'Teachers cannot access operational diagnostics',
    };
  }

  // Unknown role — fail closed
  return {
    allowed: false,
    reason: 'unknown_role_denied',
    safeMessage: 'Access denied: unrecognized role',
  };
}

export function isInternalSystemHealthRoute(operation: string): boolean {
  return PUBLIC_SAFE_ROUTES.has(operation);
}
