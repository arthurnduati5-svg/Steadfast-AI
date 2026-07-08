import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVICES_DIR = resolve(__dirname, '../services');
const CONTRACTS_DIR = resolve(__dirname, '../contracts');

function getTask027ServiceFiles(): string[] {
  return readdirSync(SERVICES_DIR)
    .filter(f => f.startsWith('task027') && f.endsWith('.ts'))
    .map(f => resolve(SERVICES_DIR, f));
}

describe('task027NoLiveSchoolConnectorWriteContract', () => {
  it('governance files contain no sisClient reference', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('sisClient');
    }
  });

  it('governance files contain no googleClassroom reference', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('googleClassroom');
    }
  });

  it('governance files contain no microsoftGraph reference', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('microsoftGraph');
    }
  });

  it('governance files contain no schoolConnector write patterns', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('schoolConnector');
      expect(content).not.toContain('liveSchoolWrite');
    }
  });

  it('contracts file has no connector-related function exports', () => {
    const contractsPath = resolve(CONTRACTS_DIR, 'task027PilotExpansionGovernanceContracts.ts');
    const content = readFileSync(contractsPath, 'utf-8');
    expect(content).not.toContain('sisClient');
    expect(content).not.toContain('googleClassroom');
    expect(content).not.toContain('microsoftGraph');
  });
});
