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
    const entries = readdirSync(dir).filter(f =>
      f.startsWith('task027') && f.endsWith('.ts')
    );
    for (const entry of entries) {
      files.push(resolve(dir, entry));
    }
  }
  return files;
}

const FORBIDDEN_COMMUNICATION_PATTERNS = [
  'sendEmail',
  'sendSms',
  'sendWhatsApp',
  'sendNotification',
  'sendMessage',
  'pushNotification',
];

describe('task027NoLiveNotificationSendContract', () => {
  it('governance files do not contain sendEmail', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('sendEmail');
    }
  });

  it('governance files do not contain sendSms', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('sendSms');
    }
  });

  it('governance files do not contain sendWhatsApp', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('sendWhatsApp');
    }
  });

  it('governance files do not contain pushNotification or sendMessage', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('pushNotification');
      expect(content).not.toContain('sendNotification');
    }
  });

  it('forbidden field constants in contracts capture notification-like raw fields', () => {
    const contractsPath = resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    const content = readFileSync(contractsPath, 'utf-8');
    expect(content).toContain('TASK027_FORBIDDEN_FIELDS');
    expect(content).toContain('rawParentFeedback');
    expect(content).toContain('rawLearnerFeedback');
  });
});
