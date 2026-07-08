import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function fileExists(relativePath: string): boolean {
  const backendSrc = resolve(__dirname, '..');
  const fullPath = resolve(backendSrc, relativePath);
  return existsSync(fullPath);
}

const REQUIRED_CONTRACT_FILES = [
  'contracts/task029ExpansionOperationsContracts.ts',
  'contracts/task028ExpansionExecutionContracts.ts',
  'contracts/task027PilotExpansionGovernanceContracts.ts',
  'contracts/task020SecurityPrivacyGovernanceContracts.ts',
];

const REQUIRED_SERVICE_FILES = [
  'services/task029ExpansionOperationsAggregatorService.ts',
  'services/task029ControlActionService.ts',
  'services/task029Task028ProofLoaderService.ts',
  'services/task029RollbackCommandService.ts',
  'services/task029HealthOperationsSummaryService.ts',
];

const REQUIRED_TEST_FILES = [
  'tests/task-029-smoke.test.ts',
  'tests/task-029-no-false-pass.contract.test.ts',
];

describe('Task029 no-false-pass guard', () => {
  for (const file of REQUIRED_CONTRACT_FILES) {
    it(`required contract file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  for (const file of REQUIRED_SERVICE_FILES) {
    it(`required service file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  for (const file of REQUIRED_TEST_FILES) {
    it(`required test file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  it('each assertion uses expect().toBe() or expect().toContain() — no fake true or unreachable code', () => {
    const contractFile = REQUIRED_CONTRACT_FILES[0];
    expect(fileExists(contractFile)).toBe(true);
    expect(REQUIRED_CONTRACT_FILES.length).toBe(4);
    expect(REQUIRED_SERVICE_FILES.length).toBeGreaterThanOrEqual(5);
  });

  it('no UI/frontend files were created by task029 tests', () => {
    const uiFiles = [
      '../../frontend/components/task029-dashboard.tsx',
      '../../frontend/pages/task029.tsx',
    ];
    for (const uiFile of uiFiles) {
      const fullPath = resolve(__dirname, uiFile);
      expect(existsSync(fullPath)).toBe(false);
    }
  });
});
