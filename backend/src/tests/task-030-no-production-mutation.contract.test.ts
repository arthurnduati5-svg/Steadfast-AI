import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Production Mutation Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not contain pg_dump in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('pg_dump');
    }
  });

  it('should not contain pg_restore in task030 service files', () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('pg_restore');
    }
  });

  it('should not contain prisma migrate deploy in task030 files', () => {
    const routeContent = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(routeContent).not.toContain('prisma migrate deploy');
  });

  it('should not contain any production mutation patterns in contracts', () => {
    const content = fs.readFileSync(path.join(baseDir, 'contracts', 'task030ControlledStagingRehearsalContracts.ts'), 'utf8');
    expect(content).not.toContain('pg_dump');
    expect(content).not.toContain('pg_restore');
  });

  it('should not contain prisma commands in lib', () => {
    const content = fs.readFileSync(path.join(baseDir, 'lib', 'task030ControlledStagingRehearsalValidation.ts'), 'utf8');
    expect(content).not.toContain('prisma migrate');
  });

  it('should not contain destructive commands in repository', () => {
    const content = fs.readFileSync(path.join(baseDir, 'repositories', 'task030ControlledStagingRehearsalRepository.ts'), 'utf8');
    expect(content).not.toContain('prisma migrate');
    expect(content).not.toContain('prisma db push');
  });
});
