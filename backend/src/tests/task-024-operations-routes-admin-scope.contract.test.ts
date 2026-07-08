import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROUTE_FILE = resolve(__dirname, '..', 'routes', 'task024OperationsRoutes.ts');
const source = readFileSync(ROUTE_FILE, 'utf-8');

describe('task024OperationsRoutes admin scope contract', () => {
  it('exports a Router (default export)', () => {
    expect(source).toMatch(/export\s+default\s+router/);
    expect(source).toMatch(/const\s+router\s*=\s*Router\(\)/);
  });

  it('all routes are prefixed with /operations/', () => {
    const routeLines = source
      .split('\n')
      .filter((l) => /router\.(get|post|put|patch|delete)\('/.test(l));
    expect(routeLines.length).toBeGreaterThan(0);
    for (const line of routeLines) {
      expect(line).toMatch(/router\.\w+\('\/operations\//);
    }
  });

  it('defines internalGuard with schoolAuthMiddleware and requireRole', () => {
    expect(source).toMatch(/import.*schoolAuthMiddleware.*from\s+['"]\.\.\/middleware\/schoolAuthMiddleware['"]/);
    expect(source).toMatch(/import.*requireRole.*from\s+['"]\.\.\/lib\/rbac['"]/);
    expect(source).toMatch(/const\s+internalGuard\s*=\s*\[schoolAuthMiddleware,\s*requireRole\('admin',\s*'counselor'\)\]/);
  });

  it('applies enforceInternalAccess on every route handler', () => {
    const handlerBodies = source.split(/router\.\w+\(/).slice(1);
    for (const body of handlerBodies) {
      if (body.includes('/operations/health') && body.includes('getBackendLiveness')) continue;
      expect(body).toMatch(/enforceInternalAccess\(req,\s*res\)/);
    }
  });

  it('safeDeniedResponse returns 403 with safe message', () => {
    expect(source).toMatch(/res\.status\(403\)/);
    expect(source).toMatch(/Access denied\. Operations routes are admin\/internal only/);
  });

  it('has GET /operations/health', () => {
    expect(source).toMatch(/router\.get\('\/operations\/health'/);
  });

  it('has GET /operations/metrics', () => {
    expect(source).toMatch(/router\.get\('\/operations\/metrics'/);
  });

  it('has POST /operations/incidents/detect', () => {
    expect(source).toMatch(/router\.post\('\/operations\/incidents\/detect'/);
  });

  it('has GET /operations/incidents/:id/response-plan', () => {
    expect(source).toMatch(/router\.get\('\/operations\/incidents\/:id\/response-plan'/);
  });

  it('has GET /operations/backup/readiness', () => {
    expect(source).toMatch(/router\.get\('\/operations\/backup\/readiness'/);
  });

  it('has POST /operations/restore/drill', () => {
    expect(source).toMatch(/router\.post\('\/operations\/restore\/drill'/);
  });

  it('has GET /operations/data-integrity', () => {
    expect(source).toMatch(/router\.get\('\/operations\/data-integrity'/);
  });

  it('has GET /operations/hardening', () => {
    expect(source).toMatch(/router\.get\('\/operations\/hardening'/);
  });

  it('denies anonymous access via enforceInternalAccess', () => {
    const fnMatch = source.match(/async function enforceInternalAccess[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toMatch(/role\s*!==\s*'admin'/);
    expect(fnBody).toMatch(/role\s*!==\s*'counselor'/);
    expect(fnBody).toMatch(/safeDeniedResponse/);
  });
});
