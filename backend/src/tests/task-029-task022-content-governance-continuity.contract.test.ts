import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task022 content governance continuity', () => {
  it('Task022 contract file exists with curriculum governance exports', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task022CurriculumGovernanceContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('GovernanceActorRole');
    expect(source).toContain('TASK022_SOURCE_TYPES');
  });

  it('Task022 exports source types including curriculum_specification and madrasa_text', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task022CurriculumGovernanceContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('curriculum_specification');
    expect(source).toContain('madrasa_text');
  });

  it('Task029 references content governance risk levels consistent with Task022', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('contentGovernanceRiskLevel');
    expect(task029Source).toContain('content_governance_reviewer');
  });

  it('Task022 contract exports review actor roles compatible with Task029', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task022CurriculumGovernanceContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('deen_reviewer');
  });
});
