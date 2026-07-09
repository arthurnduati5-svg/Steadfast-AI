import { describe, it, expect } from 'vitest';
import task030Routes from '../routes/task030ControlledStagingRehearsalRoutes';

describe('Task 030 - Routes Report Contract', () => {
  it('should have report generation route POST /runs/:runId/report', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('runs/:runId/report')
    );
    expect(has).toBe(true);
  });

  it('should have GET /reports/latest route', () => {
    const stack = (task030Routes as any).stack;
    const has = stack.some((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('reports/latest')
    );
    expect(has).toBe(true);
  });

  it('should have report generation as POST', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('runs/:runId/report')
    );
    expect(route.route.methods).toHaveProperty('post');
  });

  it('should have latest report as GET', () => {
    const stack = (task030Routes as any).stack;
    const route = stack.find((layer: any) =>
      layer.route && layer.route.path && layer.route.path.includes('reports/latest')
    );
    expect(route.route.methods).toHaveProperty('get');
  });
});
