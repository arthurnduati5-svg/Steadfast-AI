import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Smoke Test', () => {
  it('should import routes successfully', () => {
    expect(task030Routes).toBeDefined();
  });

  it('should have stack property (express Router)', () => {
    expect(Array.isArray((task030Routes as any).stack)).toBe(true);
  });

  it('should have at least one route registered', () => {
    expect((task030Routes as any).stack.length).toBeGreaterThan(0);
  });

  it('should have a route with path containing task030', () => {
    const hasTask030Route = (task030Routes as any).stack.some((layer: any) => {
      return layer.route && layer.route.path && layer.route.path.includes('task030');
    });
    expect(hasTask030Route).toBe(true);
  });

  it('should have the health route registered', () => {
    const hasHealth = (task030Routes as any).stack.some((layer: any) => {
      return layer.route && layer.route.path && layer.route.path.includes('health');
    });
    expect(hasHealth).toBe(true);
  });
});
