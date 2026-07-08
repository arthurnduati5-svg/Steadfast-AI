import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task027 expansion governance continuity', () => {
  it('Task027 contract file exists with governance constants', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('TASK027_GOVERNANCE_STATUSES');
    expect(source).toContain('TASK027_EXPANSION_DECISIONS');
  });

  it('Task027 exports governance statuses including approved_for_expansion and blocked', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('approved_for_expansion');
    expect(source).toContain('rejected_do_not_expand');
  });

  it('Task027 exports review actor roles consistent with Task029 operator roles', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('authorized_expansion_reviewer');
    expect(source).toContain('operations_reviewer');
  });

  it('Task029 contract accepts Task028 dependency proof that references Task027 governance', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('Task028ProofStatus');
    expect(task029Source).toContain('acceptanceVerdict');
  });
});
