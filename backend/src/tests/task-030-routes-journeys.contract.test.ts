import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Journeys Contract', () => {
  it('should have admin-operator-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('admin-operator-journey')
    );
    expect(has).toBe(true);
  });

  it('should have teacher-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('teacher-journey')
    );
    expect(has).toBe(true);
  });

  it('should have student-journey route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('student-journey')
    );
    expect(has).toBe(true);
  });

  it('should have unknown-role-denial route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('unknown-role-denial')
    );
    expect(has).toBe(true);
  });

  it('all journey routes should be POST', () => {
    const stack = (task030Routes as any).stack;
    const journeyRoutes = stack.filter((layer: any) =>
      layer.route && layer.route.path &&
      (layer.route.path.includes('admin-operator-journey') ||
       layer.route.path.includes('teacher-journey') ||
       layer.route.path.includes('student-journey') ||
       layer.route.path.includes('unknown-role-denial'))
    );
    journeyRoutes.forEach((r: any) => {
      expect(r.route.methods).toHaveProperty('post');
    });
  });

  it('admin-operator-journey should accept runId param', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('admin-operator-journey')
    );
    expect(route.route.path).toContain(':runId');
  });

  it('teacher-journey should accept runId param', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('teacher-journey')
    );
    expect(route.route.path).toContain(':runId');
  });

  it('student-journey should accept runId param', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('student-journey')
    );
    expect(route.route.path).toContain(':runId');
  });
});
