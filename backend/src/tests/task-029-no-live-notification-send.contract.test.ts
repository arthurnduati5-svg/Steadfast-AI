import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Live Notification Send Code', () => {
  const task029Files = [
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

  for (const file of task029Files) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');

    it(`${file} must not call notification or email sending`, () => {
      expect(source).not.toMatch(/sendNotification/i);
      expect(source).not.toMatch(/sendEmail/i);
    });
  }

  it('must not import any notification service', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/notification/i);
  });

  it('contract must have realNotificationsSent boolean without payload in response interfaces', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('realNotificationsSent');
    const reportIdx = contractSource.indexOf('export interface Task029OperationsReport');
    const endIdx = contractSource.indexOf('export interface', reportIdx + 10);
    const block = endIdx === -1 ? contractSource.slice(reportIdx) : contractSource.slice(reportIdx, endIdx);
    expect(block).not.toContain('rawNotificationPayload');
  });
});
