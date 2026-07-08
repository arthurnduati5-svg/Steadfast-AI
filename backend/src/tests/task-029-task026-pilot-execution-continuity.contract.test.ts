import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task026 pilot execution continuity', () => {
  it('Task026 contract files exist with pilot execution types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task026PilotExecutionContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('PilotExecutionStatus');
    expect(source).toContain('PilotExecutionEventType');
  });

  it('Task026 exports execution statuses including not_started and active', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task026PilotExecutionContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('not_started');
    expect(source).toContain('rolled_back');
  });

  it('Task026 controlled execution contracts export forbidden fields consistent with Task029', () => {
    const controlledPath = path.resolve(__dirname, '../contracts/task026ControlledPilotExecutionContracts.ts');
    expect(fs.existsSync(controlledPath)).toBe(true);
    const source = fs.readFileSync(controlledPath, 'utf8');
    expect(source).toContain('TASK026_FORBIDDEN_FIELDS');
    expect(source).toContain('TASK026_EXECUTION_CONTROL_ACTIONS');
  });

  it('Task029 references task026 dependency types for continuity', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('task028ProofStatus');
    expect(task029Source).toContain('runStatus');
  });
});
