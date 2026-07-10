import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - No Live School Connector Write Contract', () => {
  const servicesDir = path.resolve(__dirname, '../services');
  const routesDir = path.resolve(__dirname, '../routes');

  const dirsToScan = [servicesDir, routesDir].filter(d => fs.existsSync(d));

  function listTask032Files(): string[] {
    const files: string[] = [];
    for (const dir of dirsToScan) {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.includes('task032') && entry.endsWith('.ts')) {
          files.push(path.join(dir, entry));
        }
      }
    }
    return files;
  }

  it('should have no writeLiveConnector in any Task 032 file', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/writeLiveConnector/);
    }
  });

  it('should forbid writeLiveConnector in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('writeLiveConnector');
  });

  it('should have no SIS connector imports in Task 032 code', () => {
    const files = listTask032Files().filter(f => !f.includes('ActivationReport') && !f.includes('EnvironmentGate') && !f.includes('Routes'));
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/sisconnector/i);
      expect(content).not.toMatch(/school.*connect/i);
      expect(content).not.toMatch(/powerSchool/i);
      expect(content).not.toMatch(/infiniteCampus/i);
    }
  });

  it('should have no external API write calls in Task 032 services', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/axios\.(post|put|patch)/i);
      expect(content).not.toMatch(/fetch\(.*post/i);
    }
  });

  it('should have no school connector routes', () => {
    const files = listTask032Files().filter(f => !f.includes('ActivationReport') && !f.includes('EnvironmentGate') && !f.includes('Routes'));
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/school.*connector/i);
    }
  });

  it('should forbid writeLiveConnector in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('writeLiveConnector');
  });

  it('should have environment gate block live school connector', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('writeLiveConnector');
  });

  it('should not export any connector write function', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/export.*connect/i);
    }
  });
});
