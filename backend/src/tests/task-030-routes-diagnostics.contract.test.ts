import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Diagnostics Contract', () => {
  it('should have diagnostics route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('diagnostics')
    );
    expect(has).toBe(true);
  });

  it('should be GET method', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('diagnostics')
    );
    expect(route).toBeDefined();
    expect(route.route.methods).toHaveProperty('get');
  });

  it('should be under task030 path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('diagnostics')
    );
    expect(route.route.path).toContain('task030');
  });

  it('should not be POST for diagnostics', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('diagnostics')
    );
    expect(route.route.methods).not.toHaveProperty('post');
  });
});
