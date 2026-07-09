import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Live School Connector Write Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not contain sisClient in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('sisClient');
    }
  });

  it('should not contain googleClassroom in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('googleClassroom');
    }
  });

  it('should not contain microsoftGraph in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('microsoftGraph');
    }
  });

  it('should not contain curriculumVendorClient in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('curriculumVendorClient');
    }
  });

  it('should not contain liveConnector in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('liveConnector');
    }
  });

  it('should not contain webhook in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('webhook');
    }
  });
});
