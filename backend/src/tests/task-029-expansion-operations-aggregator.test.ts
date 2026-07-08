import { describe, it, expect } from 'vitest';

describe('Task 029 - Expansion Operations Aggregator', () => {
  it('should have getOperationsDashboard function accessible', async () => {
    const { getOperationsDashboard } = await import('../services/task029ExpansionOperationsAggregatorService');
    expect(typeof getOperationsDashboard).toBe('function');
  });

  it('should have getStudentOwnStatusView function accessible', async () => {
    const { getStudentOwnStatusView } = await import('../services/task029ExpansionOperationsAggregatorService');
    expect(typeof getStudentOwnStatusView).toBe('function');
  });

  it('should have loadTask028ProofForTask029 function accessible', async () => {
    const { loadTask028ProofForTask029 } = await import('../services/task029Task028ProofLoaderService');
    expect(typeof loadTask028ProofForTask029).toBe('function');
  });

  it('should return proof status without requiring execution run', async () => {
    const { getOperationsDashboard } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getOperationsDashboard('admin');

    expect(result).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    expect(result.data).toBeDefined();
    expect(result.data!.task028ProofStatus).toBeDefined();
    expect(result.data!.runStatus).toBeDefined();
  });

  it('should getOperationsDashboard returns data structure with fields', async () => {
    const { getOperationsDashboard } = await import('../services/task029ExpansionOperationsAggregatorService');
    const adminResult = await getOperationsDashboard('admin');
    expect(adminResult.data!.schoolId).toBeDefined();
    expect(adminResult.data!.cohortSafeCounts).toBeDefined();
    expect(adminResult.data!.stageSafeCounts).toBeDefined();
    expect(adminResult.data!.healthRiskLevel).toBeDefined();
    expect(adminResult.data!.interventionQueueCounts).toBeDefined();
    expect(adminResult.data!.incidentCounts).toBeDefined();
    expect(adminResult.data!.generatedAt).toBeDefined();
  });

  it('should return student own-status view without execution run', async () => {
    const { getStudentOwnStatusView } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getStudentOwnStatusView('test-student-hash');

    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.isInApprovedExpandedCohort).toBe(false);
    expect(result.data!.nextSafeActionLabel).toBeDefined();
    expect(result.data!.safeMessage).toBeDefined();
  });
});
