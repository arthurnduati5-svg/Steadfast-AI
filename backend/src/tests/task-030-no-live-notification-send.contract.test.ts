import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Live Notification Send Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not contain sendEmail in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('sendEmail');
    }
  });

  it('should not contain sendSms in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('sendSms');
    }
  });

  it('should not contain nodemailer in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('nodemailer');
    }
  });

  it('should not contain twilio in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('twilio');
    }
  });

  it('should not contain mailgun in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('mailgun');
    }
  });

  it('should not contain sendgrid in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('sendgrid');
    }
  });
});
