import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Run Lifecycle Contract', () => {
  it('should have POST /runs route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path === '/task030/controlled-staging-rehearsal/runs' && layer.route.methods.post
    );
    expect(has).toBe(true);
  });

  it('should have GET /runs/:runId route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('runs/:runId') && layer.route.methods.get
    );
    expect(has).toBe(true);
  });

  it('should have POST /runs/:runId/preflight route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('runs/:runId/preflight')
    );
    expect(has).toBe(true);
  });

  it('should have POST /runs/:runId/admin-operator-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('admin-operator-journey')
    );
    expect(has).toBe(true);
  });

  it('should have POST /runs/:runId/teacher-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('teacher-journey')
    );
    expect(has).toBe(true);
  });

  it('should have POST /runs/:runId/student-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('student-journey')
    );
    expect(has).toBe(true);
  });

  it('should have POST /runs/:runId/unknown-role-denial route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('unknown-role-denial')
    );
    expect(has).toBe(true);
  });

  it('should have GET /runs/:runId/evidence route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('runs/:runId/evidence')
    );
    expect(has).toBe(true);
  });
});
