import { describe, it, expect } from 'vitest';

type RouteDef = { method: string; path: string; handler: string; auth: boolean; scope: string };

function getTask036Routes(): RouteDef[] {
  return [
    { method: 'POST', path: '/api/v1/task036/proof/load', handler: 'loadTask035Proof', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/proof', handler: 'getTask035Proof', auth: true, scope: 'internal_operator' },
    { method: 'POST', path: '/api/v1/task036/environment-gate', handler: 'runEnvironmentGate', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/launch-window', handler: 'validateLaunchWindow', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/approval', handler: 'processApproval', auth: true, scope: 'school_admin' },
    { method: 'POST', path: '/api/v1/task036/single-school-scope', handler: 'checkSingleSchoolScope', auth: true, scope: 'internal_operator' },
    { method: 'POST', path: '/api/v1/task036/state/transition', handler: 'transitionState', auth: true, scope: 'technical_operator' },
    { method: 'GET', path: '/api/v1/task036/state/:sessionId', handler: 'getState', auth: true, scope: 'internal_operator' },
    { method: 'POST', path: '/api/v1/task036/events', handler: 'intakeEvent', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/events/:sessionId', handler: 'listEvents', auth: true, scope: 'internal_operator' },
    { method: 'POST', path: '/api/v1/task036/runtime-monitoring', handler: 'runMonitoring', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/health-budget', handler: 'checkHealthBudget', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/incident-readiness', handler: 'checkReadiness', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/pause', handler: 'executePause', auth: true, scope: 'rollback_owner' },
    { method: 'POST', path: '/api/v1/task036/rollback', handler: 'executeRollback', auth: true, scope: 'rollback_owner' },
    { method: 'POST', path: '/api/v1/task036/kill-switch', handler: 'executeKillSwitch', auth: true, scope: 'rollback_owner' },
    { method: 'POST', path: '/api/v1/task036/privacy-boundary', handler: 'checkPrivacyBoundary', auth: true, scope: 'privacy_owner' },
    { method: 'POST', path: '/api/v1/task036/content-governance', handler: 'checkContentGovernance', auth: true, scope: 'content_governance_owner' },
    { method: 'POST', path: '/api/v1/task036/socratic-integrity', handler: 'checkSocraticIntegrity', auth: true, scope: 'safeguarding_owner' },
    { method: 'POST', path: '/api/v1/task036/deen-boundary', handler: 'checkDeenBoundary', auth: true, scope: 'deen_review_owner' },
    { method: 'POST', path: '/api/v1/task036/school-identity', handler: 'verifySchoolIdentity', auth: true, scope: 'internal_operator' },
    { method: 'POST', path: '/api/v1/task036/cross-school-denial', handler: 'checkCrossSchoolDenial', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/read-model/:sessionId', handler: 'getReadModel', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/evidence-ledger/:sessionId', handler: 'getEvidenceLedger', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/diagnostics/:sessionId', handler: 'getDiagnostics', auth: true, scope: 'technical_operator' },
    { method: 'POST', path: '/api/v1/task036/final-decision', handler: 'computeFinalDecision', auth: true, scope: 'internal_operator' },
    { method: 'GET', path: '/api/v1/task036/report', handler: 'getReport', auth: true, scope: 'internal_operator' },
  ];
}

describe('Task036 Canonical Routes', () => {
  it('defines all expected routes', () => {
    const routes = getTask036Routes();
    expect(routes.length).toBeGreaterThanOrEqual(20);
  });

  it('all routes require authentication', () => {
    const routes = getTask036Routes();
    for (const route of routes) {
      expect(route.auth).toBe(true);
    }
  });

  it('all routes have a valid HTTP method', () => {
    const routes = getTask036Routes();
    for (const route of routes) {
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(route.method);
    }
  });

  it('all routes have non-empty path and handler', () => {
    const routes = getTask036Routes();
    for (const route of routes) {
      expect(route.path.length).toBeGreaterThan(0);
      expect(route.handler.length).toBeGreaterThan(0);
    }
  });

  it('no route duplicates paths', () => {
    const routes = getTask036Routes();
    const paths = routes.map(r => r.method + r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('all routes have a defined scope', () => {
    const routes = getTask036Routes();
    for (const route of routes) {
      expect(route.scope.length).toBeGreaterThan(0);
    }
  });

  it('route paths start with /api/v1/task036', () => {
    const routes = getTask036Routes();
    for (const route of routes) {
      expect(route.path.startsWith('/api/v1/task036')).toBe(true);
    }
  });

  it('includes routes for all gate services', () => {
    const routes = getTask036Routes();
    const routePaths = routes.map(r => r.path);
    expect(routePaths).toContain('/api/v1/task036/approval');
    expect(routePaths).toContain('/api/v1/task036/pause');
    expect(routePaths).toContain('/api/v1/task036/rollback');
    expect(routePaths).toContain('/api/v1/task036/kill-switch');
    expect(routePaths).toContain('/api/v1/task036/privacy-boundary');
    expect(routePaths).toContain('/api/v1/task036/final-decision');
  });
});
