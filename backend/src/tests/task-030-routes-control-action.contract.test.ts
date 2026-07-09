import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Control Action Contract', () => {
  it('should have control-action-rehearsal route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('control-action-rehearsal')
    );
    expect(has).toBe(true);
  });

  it('should be POST method', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('control-action-rehearsal')
    );
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should have runId param in path', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('control-action-rehearsal')
    );
    expect(route.route.path).toContain(':runId');
  });

  it('should not be a GET route', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('control-action-rehearsal')
    );
    expect(route.route.methods).not.toHaveProperty('get');
  });
});
