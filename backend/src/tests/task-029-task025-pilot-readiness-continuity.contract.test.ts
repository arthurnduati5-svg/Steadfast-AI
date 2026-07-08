import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task025 pilot readiness continuity', () => {
  it('Task025 contract file exists with pilot readiness types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task025PilotContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('PilotProgramStatus');
    expect(source).toContain('PilotReadinessCheckType');
  });

  it('Task025 exports pilot program statuses including draft and ready', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task025PilotContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('draft');
    expect(source).toContain('rolled_back');
  });

  it('Task025 controlled readiness contracts export decision constants', () => {
    const controlledPath = path.resolve(__dirname, '../contracts/task025ControlledPilotReadinessContracts.ts');
    expect(fs.existsSync(controlledPath)).toBe(true);
    const source = fs.readFileSync(controlledPath, 'utf8');
    expect(source).toContain('TASK025_PILOT_READINESS_DECISIONS');
    expect(source).toContain('TASK025_FORBIDDEN_FIELDS');
  });

  it('Task029 cohort summary references pilot concepts from Task025', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('approvedCohortCount');
    expect(task029Source).toContain('teacherSafeCount');
  });
});
