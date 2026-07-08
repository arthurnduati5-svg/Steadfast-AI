import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Raw Safeguarding Data Leak', () => {
  const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  it('FORBIDDEN_FIELDS must include raw safeguarding patterns', () => {
    expect(contractSource).toContain('rawSafeguardingNote');
    expect(contractSource).toContain('rawSafeguardingCase');
    expect(contractSource).toContain('safeguardingRaw');
  });

  it('no response interface must expose raw safeguarding data', () => {
    const interfaces = ['Task029OperationsDashboard', 'Task029HealthOperationsSummary', 'Task029IncidentOperationsSummary'];
    for (const iface of interfaces) {
      const idx = contractSource.indexOf(`export interface ${iface}`);
      if (idx === -1) continue;
      const endIdx = contractSource.indexOf('export interface', idx + 10);
      const block = endIdx === -1 ? contractSource.slice(idx) : contractSource.slice(idx, endIdx);
      expect(block).not.toContain('rawSafeguardingNote');
      expect(block).not.toContain('safeguardingRaw');
    }
  });

  it('incident operations must use safeCategory not raw notes', () => {
    expect(contractSource).toContain('safeCategory');
    const incidentIdx = contractSource.indexOf('export interface Task029IncidentOperationsSummary');
    if (incidentIdx !== -1) {
      const endIdx = contractSource.indexOf('export interface', incidentIdx + 10);
      const block = endIdx === -1 ? contractSource.slice(incidentIdx) : contractSource.slice(incidentIdx, endIdx);
      expect(block).not.toContain('rawSafeguardingNote');
    }
  });

  it('dashboard must not expose raw safeguarding fields', () => {
    const dashboardIdx = contractSource.indexOf('export interface Task029OperationsDashboard');
    const endIdx = contractSource.indexOf('export interface', dashboardIdx + 10);
    const block = endIdx === -1 ? contractSource.slice(dashboardIdx) : contractSource.slice(dashboardIdx, endIdx);
    expect(block).not.toContain('safeguardingRaw');
    expect(block).not.toContain('rawSafeguarding');
  });

  it('preflight must reference safeguarding boundary without raw data', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).not.toMatch(/rawSafeguarding|safeguardingRaw/i);
  });
});
