import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - No Task 033 Canary Observation Contract', () => {
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

  it('should forbid observeCanaryTraffic in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('observeCanaryTraffic');
  });

  it('should have no traffic observation logic in Task 032 services', () => {
    const files = listTask032Files().filter(f => !f.includes('ActivationReport') && !f.includes('ControlAction') && !f.includes('EnvironmentGate') && !f.includes('MonitoringSnapshot'));
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/canary.*observ/i);
      expect(content).not.toMatch(/observ.*canary/i);
    }
  });

  it('should have no task033 references in service logic', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (file.includes('Report') || file.includes('Diagnostics') || file.includes('ActivationCommand') || file.includes('ActivationStateMachine') || file.includes('View') || file.includes('MonitoringSnapshot') || file.includes('ProofLoader')) {
        continue;
      }
      expect(content).not.toMatch(/task033/i);
    }
  });

  it('should set canaryObservationCreated false in report', () => {
    const reportServicePath = path.join(servicesDir, 'task032CanaryActivationReportService.ts');
    if (fs.existsSync(reportServicePath)) {
      const content = fs.readFileSync(reportServicePath, 'utf8');
      expect(content).toContain('canaryObservationCreated: false');
    }
  });

  it('should not call observeCanaryTraffic', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/observeCanaryTraffic/);
    }
  });

  it('should have no live traffic monitoring routes', () => {
    const routesPath = path.resolve(__dirname, '../routes/task032ControlledCanaryActivationRoutes.ts');
    if (fs.existsSync(routesPath)) {
      const content = fs.readFileSync(routesPath, 'utf8');
      const stripped = content.replace(/canaryObservationRequested/g, '').replace(/canaryObservationBlocked/g, '');
      expect(stripped).not.toMatch(/observ/i);
      expect(stripped).not.toMatch(/traffic/i);
    }
  });

  it('should use monitoring snapshot placeholder not real observation', () => {
    const snapshotPath = path.join(servicesDir, 'task032CanaryMonitoringSnapshotService.ts');
    if (fs.existsSync(snapshotPath)) {
      const content = fs.readFileSync(snapshotPath, 'utf8');
      expect(content).toContain('observationStarted: false');
    }
  });
});
