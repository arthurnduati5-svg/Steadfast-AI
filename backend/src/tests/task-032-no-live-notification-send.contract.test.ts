import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - No Live Notification Send Contract', () => {
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

  it('should have no sendEmail in any Task 032 file', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bsendEmail\b/);
    }
  });

  it('should have no sendSms in any Task 032 file', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bsendSms\b/);
    }
  });

  it('should have no sendWhatsapp in any Task 032 file', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bsendWhatsapp\b/);
    }
  });

  it('should forbid sendEmail in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
  });

  it('should forbid sendSms in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendSms');
  });

  it('should forbid sendWhatsapp in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendWhatsapp');
  });

  it('should have no nodemailer imports in Task 032 code', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/nodemailer/i);
      expect(content).not.toMatch(/mailjet/i);
      expect(content).not.toMatch(/sendgrid/i);
      expect(content).not.toMatch(/twilio/i);
    }
  });

  it('should have no notification service imports', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/notification/i);
    }
  });

  it('should have runtime guard noLiveNotification set to true', () => {
    const guardPath = path.join(servicesDir, 'task032CanaryRuntimeGuardService.ts');
    if (fs.existsSync(guardPath)) {
      const content = fs.readFileSync(guardPath, 'utf8');
      expect(content).toContain('noLiveNotification');
    }
  });
});
