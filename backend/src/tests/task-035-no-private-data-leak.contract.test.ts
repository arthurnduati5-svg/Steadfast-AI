import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 035 - No Private Data Leak Contract', () => {
  it('should not expose raw student chat in any Task 035 service', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(servicesDir)
      .filter((f: string) => f.startsWith('task035') && f.endsWith('.ts'))
      .map((f: string) => path.join(servicesDir, f));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/raw\s+student\s+chat/i);
    }
  });

  it('should not expose database URLs in service outputs', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(servicesDir)
      .filter((f: string) => f.startsWith('task035') && f.endsWith('.ts'))
      .map((f: string) => path.join(servicesDir, f));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/postgres:\/\//);
      expect(content).not.toMatch(/postgresql:\/\//);
      expect(content).not.toMatch(/mysql:\/\//);
    }
  });

  it('should not expose API keys in service outputs', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(servicesDir)
      .filter((f: string) => f.startsWith('task035') && f.endsWith('.ts'))
      .map((f: string) => path.join(servicesDir, f));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('sk-proj-');
      expect(content).not.toContain('sk-ant-');
    }
  });

  it('should have all privacy fields set to false in services', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const privacyFiles = fs.readdirSync(servicesDir)
      .filter((f: string) => f.startsWith('task035') && f.includes('Privacy'))
      .map((f: string) => path.join(servicesDir, f));

    for (const file of privacyFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/: true\b.*exposed/i);
    }
  });
});
