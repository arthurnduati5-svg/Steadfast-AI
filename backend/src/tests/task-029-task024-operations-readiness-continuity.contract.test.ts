import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task024 operations readiness continuity', () => {
  it('Task024 contracts file exists with operations types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task024OperationsContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('OperationalComponentStatus');
    expect(source).toContain('OperationalSeverity');
  });

  it('Task024 exports readiness constants with TASK024_OPERATION_ENVIRONMENTS', () => {
    const readinessPath = path.resolve(__dirname, '../contracts/task024OperationsReadinessContracts.ts');
    expect(fs.existsSync(readinessPath)).toBe(true);
    const source = fs.readFileSync(readinessPath, 'utf8');
    expect(source).toContain('TASK024_OPERATION_ENVIRONMENTS');
    expect(source).toContain('production');
  });

  it('Task024 exports incident severity and status constants', () => {
    const readinessPath = path.resolve(__dirname, '../contracts/task024OperationsReadinessContracts.ts');
    const source = fs.readFileSync(readinessPath, 'utf8');
    expect(source).toContain('TASK024_INCIDENT_SEVERITIES');
    expect(source).toContain('TASK024_INCIDENT_STATUSES');
  });

  it('Task029 references operational health summary consistent with Task024 patterns', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('operationsRiskLevel');
    expect(task029Source).toContain('healthRiskLevel');
  });
});
