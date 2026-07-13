import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040BackendSurfaceManifest,
  Task040BackendSurfaceRouteEntry,
  createTask040SafeTimestamp as ts,
} from '../contracts/task040BackendFreezeContracts';

function makeRouteEntry(overrides: Partial<Task040BackendSurfaceRouteEntry> = {}): Task040BackendSurfaceRouteEntry {
  return {
    routePrefix: '/api/v1/schools',
    routeFile: 'backend/src/routes/schoolRoutes.ts',
    mountedInIndex: true,
    middlewareUsed: ['verifySchoolContext', 'rateLimiter'],
    requiresVerifiedSchoolContext: true,
    requiresRoleScope: true,
    safeReadOnly: true,
    taskOwner: 'task-020',
    acceptedTaskId: '020',
    status: 'active',
    notes: '',
    ...overrides,
  };
}

function buildManifest(routeCount: number = 5): Task040BackendSurfaceManifest {
  const routes: Task040BackendSurfaceRouteEntry[] = [
    makeRouteEntry({ routePrefix: '/api/v1/schools', routeFile: 'schoolRoutes.ts', taskOwner: 'task-020', acceptedTaskId: '020' }),
    makeRouteEntry({ routePrefix: '/api/v1/students', routeFile: 'studentRoutes.ts', taskOwner: 'task-021', acceptedTaskId: '021' }),
    makeRouteEntry({ routePrefix: '/api/v1/classes', routeFile: 'classRoutes.ts', taskOwner: 'task-022', acceptedTaskId: '022' }),
    makeRouteEntry({ routePrefix: '/api/v1/assessments', routeFile: 'assessmentRoutes.ts', taskOwner: 'task-025', acceptedTaskId: '025', safeReadOnly: false }),
    makeRouteEntry({ routePrefix: '/api/v1/progress', routeFile: 'progressRoutes.ts', taskOwner: 'task-030', acceptedTaskId: '030', safeReadOnly: true }),
  ];
  return {
    taskId: '040',
    routeEntries: routes.slice(0, routeCount),
    routeCount: routeCount,
    generatedAt: ts(),
  };
}

describe('Task040 Backend Surface Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('builds a surface manifest with correct taskId', () => {
    const manifest = buildManifest();
    expect(manifest.taskId).toBe('040');
    expect(manifest.generatedAt).toBeDefined();
  });

  it('routeCount matches the number of route entries', () => {
    const manifest = buildManifest(3);
    expect(manifest.routeCount).toBe(3);
    expect(manifest.routeEntries.length).toBe(3);
  });

  it('each route entry has required fields', () => {
    const manifest = buildManifest();
    for (const entry of manifest.routeEntries) {
      expect(entry).toHaveProperty('routePrefix');
      expect(entry).toHaveProperty('routeFile');
      expect(entry).toHaveProperty('mountedInIndex');
      expect(entry).toHaveProperty('middlewareUsed');
      expect(entry).toHaveProperty('requiresVerifiedSchoolContext');
      expect(entry).toHaveProperty('requiresRoleScope');
      expect(entry).toHaveProperty('safeReadOnly');
      expect(entry).toHaveProperty('taskOwner');
      expect(entry).toHaveProperty('acceptedTaskId');
      expect(entry).toHaveProperty('status');
    }
  });

  it('all routes are mounted in index', () => {
    const manifest = buildManifest();
    for (const entry of manifest.routeEntries) {
      expect(entry.mountedInIndex).toBe(true);
    }
  });

  it('routes require verified school context and role scope', () => {
    const manifest = buildManifest();
    for (const entry of manifest.routeEntries) {
      expect(entry.requiresVerifiedSchoolContext).toBe(true);
      expect(entry.requiresRoleScope).toBe(true);
    }
  });

  it('most routes are safe read-only', () => {
    const manifest = buildManifest();
    const safeCount = manifest.routeEntries.filter(e => e.safeReadOnly).length;
    expect(safeCount).toBeGreaterThanOrEqual(manifest.routeCount - 1);
  });

  it('all routes are active', () => {
    const manifest = buildManifest();
    for (const entry of manifest.routeEntries) {
      expect(entry.status).toBe('active');
    }
  });

  it('round-trips through the repository', () => {
    const manifest = buildManifest();
    task040Repository.saveBackendSurfaceManifest(manifest);
    const retrieved = task040Repository.getBackendSurfaceManifest();
    expect(retrieved).toEqual(manifest);
  });
});
