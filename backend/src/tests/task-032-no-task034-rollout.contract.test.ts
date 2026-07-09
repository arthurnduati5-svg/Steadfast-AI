import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 032 - No Task 034 Rollout Contract', () => {
  const servicesDir = path.resolve(__dirname, '../services');

  function listTask032Files(): string[] {
    const files: string[] = [];
    if (fs.existsSync(servicesDir)) {
      const entries = fs.readdirSync(servicesDir);
      for (const entry of entries) {
        if (entry.includes('task032') && entry.endsWith('.ts')) {
          files.push(path.join(servicesDir, entry));
        }
      }
    }
    return files;
  }

  it('should set rolloutCreated false in report', () => {
    const reportPath = path.join(servicesDir, 'task032CanaryActivationReportService.ts');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf8');
      expect(content).toContain('rolloutCreated: false');
    }
  });

  it('should have no rollout logic in Task 032 services', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/startRollout/);
    }
  });

  it('should not reference task034 in service names', () => {
    const files = listTask032Files();
    for (const file of files) {
      const basename = path.basename(file);
      expect(basename).not.toMatch(/task034/);
    }
  });

  it('should block rollout in environment gate', () => {
    const envGatePath = path.join(servicesDir, 'task032CanaryEnvironmentGateService.ts');
    if (fs.existsSync(envGatePath)) {
      const content = fs.readFileSync(envGatePath, 'utf8');
      expect(content).toContain('rolloutRequested');
      expect(content).toContain('rolloutBlocked');
    }
  });

  it('should have no rollout routes', () => {
    const routesPath = path.resolve(__dirname, '../routes/task032ControlledCanaryActivationRoutes.ts');
    if (fs.existsSync(routesPath)) {
      const content = fs.readFileSync(routesPath, 'utf8');
      expect(content).not.toMatch(/rollout/i);
    }
  });

  it('should have no rollout service imports', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/rollout.*service/i);
    }
  });

  it('should forbid startRollout in side effect patterns', () => {
    const contractsPath = path.resolve(__dirname, '../contracts/task032ControlledCanaryActivationContracts.ts');
    if (fs.existsSync(contractsPath)) {
      const content = fs.readFileSync(contractsPath, 'utf8');
      expect(content).toContain('startRollout');
    }
  });
});
