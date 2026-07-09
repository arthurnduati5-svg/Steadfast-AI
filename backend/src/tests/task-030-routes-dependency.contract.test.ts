import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Dependency Contract', () => {
  it('should have a dependency task029 check route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('dependency/task029/check')
    );
    expect(has).toBe(true);
  });

  it('should be a POST route', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('dependency/task029/check')
    );
    expect(route).toBeDefined();
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should have POST method only (not GET)', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('dependency/task029/check')
    );
    expect(route.route.methods).not.toHaveProperty('get');
  });

  it('should be mounted under task030 path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('dependency/task029/check')
    );
    expect(route.route.path).toContain('task030');
  });
});
