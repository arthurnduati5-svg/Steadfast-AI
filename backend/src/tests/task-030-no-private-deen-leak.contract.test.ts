import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Private Deen Leak Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const dirs = ['services', 'contracts', 'lib', 'repositories', 'routes'];

  it('should not contain privateDeenText in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bprivateDeenText\b/);
      }
    }
  });

  it('should not contain deenSensitiveRaw in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bdeenSensitiveRaw\b/);
      }
    }
  });

  it('should not expose Deen-sensitive text in service outputs', () => {
    const content = fs.readFileSync(path.join(baseDir, 'services', 'task030ControlledStagingRehearsalService.ts'), 'utf8');
    expect(content).not.toContain('fatwa');
    expect(content).not.toContain('Deen-sensitive');
  });

  it('should not contain deen_referral_boundary in routes file', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toMatch(/\bprivateDeenText\b/);
    expect(content).not.toMatch(/\bdeenSensitiveRaw\b/);
  });

  it('should not expose Deen text in contracts', () => {
    const content = fs.readFileSync(path.join(baseDir, 'contracts', 'task030ControlledStagingRehearsalContracts.ts'), 'utf8');
    expect(content).not.toMatch(/\bprivateDeenText\b/);
  });

  it('should not export raw Deen data from lib', () => {
    const content = fs.readFileSync(path.join(baseDir, 'lib', 'task030ControlledStagingRehearsalValidation.ts'), 'utf8');
    expect(content).not.toMatch(/\bprivateDeenText\b/);
  });
});
