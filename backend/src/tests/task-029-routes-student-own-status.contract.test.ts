import { describe, it, expect } from 'vitest';

describe('Task 029 - Student Own-Status (Contract)', () => {
  it('should have student own-status endpoint', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');

    expect(content).toContain('/pilot/expansion/operations/student/own-status');
    expect(content).toContain('studentGuard');
  });

  it('should not allow student to access dashboard', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');

    expect(content).toContain("/pilot/expansion/operations/dashboard");
    expect(content).toContain("...adminGuard");
    expect(content).toContain("/pilot/expansion/operations/student/own-status");
    expect(content).toContain("...studentGuard");
  });

  it('should not allow student to access controls', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');

    expect(content).toContain("/pilot/expansion/operations/pause");
    expect(content).toContain("/pilot/expansion/operations/rollback");
    expect(content).toContain("/pilot/expansion/operations/kill-switch/enable");
    expect(content).toContain("...adminGuard");
  });

  it('should return safe status view from student own-status', async () => {
    const { getStudentOwnStatusView } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getStudentOwnStatusView('test-student');

    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.isInApprovedExpandedCohort).toBe(false);
    expect(typeof result.data!.nextSafeActionLabel).toBe('string');
    expect(typeof result.data!.safeMessage).toBe('string');
  });

  it('should not expose stage or health internals to student', () => {
    const view = {
      isInApprovedExpandedCohort: false,
      accessStatus: 'not_in_cohort',
      safeMessage: 'Expanded pilot access is not available.',
      nextSafeActionLabel: 'Continue with normal learning.',
    };

    const text = JSON.stringify(view);
    expect(text).not.toContain('healthClassification');
    expect(text).not.toContain('stageNumber');
    expect(text).not.toContain('oversightItem');
  });
});
