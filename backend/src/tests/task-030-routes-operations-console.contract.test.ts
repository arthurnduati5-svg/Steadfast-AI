import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Operations Console Contract', () => {
  it('should have operations-console-rehearsal route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('operations-console-rehearsal')
    );
    expect(has).toBe(true);
  });

  it('should be POST method', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('operations-console-rehearsal')
    );
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should have runId param in path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('operations-console-rehearsal')
    );
    expect(route.route.path).toContain(':runId');
  });

  it('should be under task030 path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('operations-console-rehearsal')
    );
    expect(route.route.path).toContain('staging-rehearsal');
  });
});
