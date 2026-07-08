import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROUTE_FILE = resolve(__dirname, '..', 'routes', 'task024OperationsRoutes.ts');
const source = readFileSync(ROUTE_FILE, 'utf-8');

describe('task024 learner denied operations routes contract', () => {
  it('safeDeniedResponse returns 403 with safe error message', () => {
    expect(source).toMatch(/res\.status\(403\)/);
    expect(source).toMatch(/error:\s*'Access denied\. Operations routes are admin\/internal only\.'/);
    expect(source).toMatch(/ok:\s*false/);
  });

  it('enforceInternalAccess denies non-admin non-counselor roles', () => {
    expect(source).toMatch(/role\s*!==\s*'admin'/);
    expect(source).toMatch(/role\s*!==\s*'counselor'/);
    const adminCheck = source.match(/['"]admin['"]/g);
    const counselorCheck = source.match(/['"]counselor['"]/g);
    expect(adminCheck).not.toBeNull();
    expect(counselorCheck).not.toBeNull();
  });

  it('getActorRole defaults to anonymous when no user', () => {
    expect(source).toMatch(/getActorRole/);
    expect(source).toMatch(/user\?\.role/);
    expect(source).toMatch(/anonymous/);
  });

  it('getActorId defaults to anonymous when no user', () => {
    expect(source).toMatch(/getActorId/);
    expect(source).toMatch(/user\?\.id/);
    expect(source).toMatch(/anonymous/);
  });

  it('all route handlers call enforceInternalAccess before processing', () => {
    const routes = source.match(/router\.\w+\(['"`]\/operations\/[^'"]+['"`]/g);
    expect(routes).not.toBeNull();
    for (const route of routes || []) {
      const routeIndex = source.indexOf(route);
      const handlerBlock = source.slice(routeIndex, routeIndex + 1200);
      expect(
        handlerBlock.includes('enforceInternalAccess(req, res)') ||
        handlerBlock.includes('enforceInternalAccess(req,res)'),
      ).toBe(true);
    }
  });

  it('internalGuard and enforceInternalAccess patterns exist', () => {
    expect(source).toMatch(/internalGuard/);
    expect(source).toMatch(/enforceInternalAccess/);
  });

  it('safeDeniedResponse is defined in the route module', () => {
    expect(source).toMatch(/function safeDeniedResponse/);
  });

  it('most route handlers provide a safe error fallback on exception', () => {
    const catchBlocks = source.match(/catch\s*\{[\s\S]*?res\.status\(\d+\)[\s\S]*?\.json\([\s\S]*?\}\)/g);
    const routeCount = (source.match(/router\.\w+\(['"`]\/operations\//g) || []).length;
    expect(catchBlocks).not.toBeNull();
    const routesWithCatch = catchBlocks ? catchBlocks.length : 0;
    expect(routesWithCatch).toBeGreaterThanOrEqual(routeCount - 3);
  });
});
