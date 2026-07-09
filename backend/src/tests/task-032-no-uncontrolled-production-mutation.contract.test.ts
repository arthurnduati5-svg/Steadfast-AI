import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - No Uncontrolled Production Data Mutation Contract', () => {
  const task032Dir = path.resolve(__dirname, '../../');
  const task032Files: string[] = [];

  before(() => {
    const gather = (dir: string, acc: string[]) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('node_modules') && !e.name.startsWith('.git') && !e.name.startsWith('.planning')) {
          gather(full, acc);
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && e.name.includes('task-032')) {
          acc.push(full);
        }
      }
    };
    gather(task032Dir, task032Files);
  });

  it('should not contain direct database write outside gated context', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prisma.*\.create\b.*\{.*[^}]/s);
    }
  });

  it('should not contain production data update without gate check', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('prisma') && content.includes('.update')) {
        expect(content).toMatch(/gate|guard|check|validate/i);
      }
    }
  });

  it('should not contain raw production delete operations', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/\.delete\s*\(/);
    }
  });

  it('should not contain uncontrolled bulk mutations', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/updateMany|deleteMany|createMany/i);
    }
  });

  it('should not contain raw SQL mutations', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/\$executeRaw|\$queryRaw/i);
    }
  });

  it('should not contain production data export', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/export.*production/i);
    }
  });

  it('should not contain uncontrolled data import', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/import.*production/i);
    }
  });

  it('should not contain production data overwrite', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/overwrite.*production/i);
    }
  });

  it('should not contain production data migration without guard', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('migration') && content.includes('production')) {
        expect(content).toMatch(/guard|check|validate/i);
      }
    }
  });

  it('should not contain production data mutation in test files', () => {
    const testFiles = task032Files.filter(f => f.endsWith('.test.ts'));
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*mutate/i);
    }
  });

  it('should not contain uncontrolled production schema change', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/schema.*production/i);
    }
  });

  it('should not contain production data mutation in service tests', () => {
    const serviceTests = task032Files.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceTests) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production/i);
    }
  });
});
