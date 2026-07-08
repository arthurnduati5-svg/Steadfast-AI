import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GOVERNANCE_DIRS = [
  resolve(__dirname, '../services'),
  resolve(__dirname, '../contracts'),
  resolve(__dirname, '../routes'),
];

function getGovernanceFiles(): string[] {
  const files: string[] = [];
  for (const dir of GOVERNANCE_DIRS) {
    if (dir.endsWith('services') || dir.endsWith('contracts') || dir.endsWith('routes')) {
      const entries = readdirSync(dir).filter(f =>
        f.startsWith('task027') && f.endsWith('.ts')
      );
      for (const entry of entries) {
        files.push(resolve(dir, entry));
      }
    }
  }
  return files;
}

const FORBIDDEN_ACTIVATION_PATTERNS = [
  'activateExpandedCohort',
  'enrollExpandedLearners',
  'inviteNewStudents',
  'activateCohortExpansion',
  'performCohortActivation',
];

describe('task027NoExpandedCohortActivationContract', () => {
  it('governance files do not contain cohort activation function names', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      for (const pattern of FORBIDDEN_ACTIVATION_PATTERNS) {
        expect(content).not.toContain(pattern);
      }
    }
  });

  it('proposal service does not activate cohorts', () => {
    const proposalPath = resolve(__dirname, '../services/task027CohortExpansionProposalService.ts');
    const content = readFileSync(proposalPath, 'utf-8');
    expect(content).not.toContain('activateExpandedCohort');
    expect(content).not.toContain('enrollExpandedLearners');
    expect(content).not.toContain('inviteNewStudents');
    expect(content).not.toContain('performCohortActivation');
  });

  it('evidence pack safeNextActions mention governance review not cohort activation', () => {
    const evidencePath = resolve(__dirname, '../services/task027ExpansionEvidencePackService.ts');
    const content = readFileSync(evidencePath, 'utf-8');
    expect(content).toContain('Proceed to governance decision review');
    expect(content).not.toContain('Activate cohort expansion');
  });
});
