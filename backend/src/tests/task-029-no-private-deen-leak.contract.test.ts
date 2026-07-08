import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Private Deen Text Leak', () => {
  const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  it('FORBIDDEN_FIELDS must include private deen text patterns', () => {
    expect(contractSource).toContain('privateDeenText');
    expect(contractSource).toContain('deenSensitiveRaw');
  });

  it('dashboard interface must not contain deen raw fields', () => {
    const dashboardIdx = contractSource.indexOf('export interface Task029OperationsDashboard');
    const endIdx = contractSource.indexOf('export interface', dashboardIdx + 10);
    const block = endIdx === -1 ? contractSource.slice(dashboardIdx) : contractSource.slice(dashboardIdx, endIdx);
    expect(block).not.toContain('privateDeenText');
    expect(block).not.toContain('deenSensitiveRaw');
  });

  it('health summary must use deenContentRiskLevel not raw deen text', () => {
    expect(contractSource).toContain('deenContentRiskLevel');
    const healthIdx = contractSource.indexOf('export interface Task029HealthOperationsSummary');
    if (healthIdx !== -1) {
      const endIdx = contractSource.indexOf('export interface', healthIdx + 10);
      const block = endIdx === -1 ? contractSource.slice(healthIdx) : contractSource.slice(healthIdx, endIdx);
      expect(block).not.toContain('privateDeenText');
    }
  });

  it('aggregator must not include private deen text in responses', () => {
    const aggPath = path.resolve(__dirname, '../services/task029ExpansionOperationsAggregatorService.ts');
    const aggSource = fs.readFileSync(aggPath, 'utf8');
    expect(aggSource).not.toMatch(/privateDeen|deenSensitive/i);
  });

  it('preflight must track deen boundary without leaking text', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).not.toContain('privateDeenText');
    expect(preflightSource).not.toContain('deenSensitive');
  });
});
