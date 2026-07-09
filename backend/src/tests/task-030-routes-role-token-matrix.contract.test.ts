import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Role Token Matrix Contract', () => {
  it('should have role-token-matrix route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('role-token-matrix')
    );
    expect(has).toBe(true);
  });

  it('should be POST method', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('role-token-matrix')
    );
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should NOT have GET method on role-token-matrix', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('role-token-matrix')
    );
    expect(route.route.methods).not.toHaveProperty('get');
  });

  it('should be under task030 path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('role-token-matrix')
    );
    expect(route.route.path).toContain('staging-rehearsal');
  });
});
