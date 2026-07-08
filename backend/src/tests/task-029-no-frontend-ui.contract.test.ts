import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Frontend UI Code in Backend Files', () => {
  const task029BackendFiles = [
    'routes/task029ExpansionOperationsRoutes.ts',
    'services/task029ExpansionOperationsAggregatorService.ts',
    'services/task029ControlActionPreflightService.ts',
    'services/task029ControlActionService.ts',
    'services/task029RollbackCommandService.ts',
    'services/task029LearnerOwnStatusService.ts',
    'services/task029Task028ProofLoaderService.ts',
    'repositories/task029ExpansionOperationsRepository.ts',
    'contracts/task029ExpansionOperationsContracts.ts',
  ];

  for (const file of task029BackendFiles) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');

    it(`${file} must not contain JSX`, () => {
      expect(source).not.toMatch(/return\s*\(?\s*</);
    });

    it(`${file} must not contain frontend import patterns`, () => {
      expect(source).not.toMatch(/from ['"]react['"]/);
      expect(source).not.toMatch(/from ['"]react-dom['"]/);
    });
  }

  it('contract must have frontendUiCreated boolean but no dashboard payload in response interfaces', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('frontendUiCreated');
    const dashboardIdx = contractSource.indexOf('export interface Task029OperationsDashboard');
    const endIdx = contractSource.indexOf('export interface', dashboardIdx + 10);
    const block = endIdx === -1 ? contractSource.slice(dashboardIdx) : contractSource.slice(dashboardIdx, endIdx);
    expect(block).not.toContain('frontendDashboardPayload');
  });
});
