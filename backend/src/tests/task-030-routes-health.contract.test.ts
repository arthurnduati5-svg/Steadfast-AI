import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Health Contract', () => {
  it('should export a routes object', () => {
    expect(task030Routes).toBeDefined();
  });

  it('should have a health route registered', () => {
    const stack = (task030Routes as any).stack;
    const hasHealth = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('health')
    );
    expect(hasHealth).toBe(true);
  });

  it('should have health route as GET method', () => {
    const stack = (task030Routes as any).stack;
    const healthRoute = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('health')
    );
    expect(healthRoute).toBeDefined();
    expect(healthRoute.route.methods).toHaveProperty('get');
  });

  it('should have at least one route stacked', () => {
    expect((task030Routes as any).stack.length).toBeGreaterThan(0);
  });
});
