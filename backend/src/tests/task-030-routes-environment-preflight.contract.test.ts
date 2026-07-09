import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Environment Preflight Contract', () => {
  it('should have environment preflight route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('environment/preflight')
    );
    expect(has).toBe(true);
  });

  it('should be a POST route', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('environment/preflight')
    );
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should NOT be a GET route', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('environment/preflight')
    );
    expect(route.route.methods).not.toHaveProperty('get');
  });

  it('should have synthetic fixture route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('fixtures/synthetic-school')
    );
    expect(has).toBe(true);
  });

  it('should have role-token-matrix route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('role-token-matrix')
    );
    expect(has).toBe(true);
  });

  it('should have runs route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('/runs')
    );
    expect(has).toBe(true);
  });
});
