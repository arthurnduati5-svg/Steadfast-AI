import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Production Deployment Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not contain prisma migrate deploy in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('prisma migrate deploy');
    }
  });

  it('should not contain prisma db push in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('prisma db push');
    }
  });

  it('should not contain prisma migrate reset in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('prisma migrate reset');
    }
  });

  it('should not contain kubectl apply in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('kubectl apply');
    }
  });

  it('should not contain railway up in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('railway up');
    }
  });

  it('should not contain vercel deploy in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('vercel deploy');
    }
  });
});
