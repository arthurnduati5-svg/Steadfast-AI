import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 032 - No Task 040 Backend Freeze Contract', () => {
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

  it('should set backendFreezeCreated false in report', () => {
    const reportPath = path.join(servicesDir, 'task032CanaryActivationReportService.ts');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf8');
      expect(content).toContain('backendFreezeCreated: false');
    }
  });

  it('should not reference task040 in service files', () => {
    const files = listTask032Files();
    for (const file of files) {
      const basename = path.basename(file);
      expect(basename).not.toMatch(/task040/);
    }
  });

  it('should block backend freeze in environment gate', () => {
    const envGatePath = path.join(servicesDir, 'task032CanaryEnvironmentGateService.ts');
    if (fs.existsSync(envGatePath)) {
      const content = fs.readFileSync(envGatePath, 'utf8');
      expect(content).toContain('backendFreezeRequested');
      expect(content).toContain('backendFreezeBlocked');
    }
  });

  it('should have no backend freeze logic', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/backend.*freeze/i);
    }
  });

  it('should have no freeze-related routes', () => {
    const routesPath = path.resolve(__dirname, '../routes/task032ControlledCanaryActivationRoutes.ts');
    if (fs.existsSync(routesPath)) {
      const content = fs.readFileSync(routesPath, 'utf8');
      expect(content).not.toMatch(/freeze/);
    }
  });

  it('should have no freeze-related services', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/deployProduction/);
    }
  });

  it('should set safeToStartTask040 false in report', () => {
    const reportPath = path.join(servicesDir, 'task032CanaryActivationReportService.ts');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf8');
      expect(content).toContain('safeToStartTask040: false');
    }
  });

  it('should forbid deployProduction in contracts', () => {
    const contractsPath = path.resolve(__dirname, '../contracts/task032ControlledCanaryActivationContracts.ts');
    if (fs.existsSync(contractsPath)) {
      const content = fs.readFileSync(contractsPath, 'utf8');
      expect(content).toContain('deployProduction');
    }
  });
});
