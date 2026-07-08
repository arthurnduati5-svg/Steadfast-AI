import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Raw Learner Data Leak', () => {
  const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  it('contract must not include raw learner data fields in response interfaces', () => {
    const responseInterfaces = [
      'Task029LearnerOwnStatus',
      'Task029OperationsDashboard',
      'Task029CohortOperationsSummary',
      'Task029HealthOperationsSummary',
      'Task029SafeAuditEvent',
    ];
    for (const iface of responseInterfaces) {
      const idx = contractSource.indexOf(`export interface ${iface}`);
      if (idx === -1) continue;
      const endIdx = contractSource.indexOf('export interface', idx + 10);
      const block = endIdx === -1 ? contractSource.slice(idx) : contractSource.slice(idx, endIdx);
      expect(block).not.toContain('rawStudentData');
      expect(block).not.toContain('rawLearnerData');
    }
  });

  it('FORBIDDEN_FIELDS must include raw learner data patterns', () => {
    expect(contractSource).toContain('rawStudentData');
    expect(contractSource).toContain('rawLearnerData');
    expect(contractSource).toContain('rawStudentProfile');
  });

  it('dashboard must use safeSummary not raw data', () => {
    const aggPath = path.resolve(__dirname, '../services/task029ExpansionOperationsAggregatorService.ts');
    const aggSource = fs.readFileSync(aggPath, 'utf8');
    expect(aggSource).not.toMatch(/rawStudentData|rawLearnerData/);
  });

  it('learner own status must expose safe ref not raw id', () => {
    const learnerServicePath = path.resolve(__dirname, '../services/task029LearnerOwnStatusService.ts');
    const learnerSource = fs.readFileSync(learnerServicePath, 'utf8');
    expect(learnerSource).toContain('learnerSafeRef');
    expect(learnerSource).not.toContain('rawStudent');
  });

  it('health endpoint must contain disclaimer about no raw data', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).toContain('do not expose raw student messages');
  });
});
