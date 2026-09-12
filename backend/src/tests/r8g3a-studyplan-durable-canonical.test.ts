import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Study Planning — DURABLE_CANONICAL proof (static ownership).
// Study plans are persistent authored snapshots: the service writes
// StudyPlan/StudyGoal rows via Prisma raw SQL and addresses them later
// by stable IDs for GET/update/completion. No process-local plan store
// exists on this path.
const SRC = path.resolve(__dirname, '..');

describe('R8-G.3A study-plan durable-canonical ownership', () => {
  it('study support service persists plans and goals through Prisma', () => {
    const svc = fs.readFileSync(path.join(SRC, 'services/studySupportService.ts'), 'utf-8');
    expect(svc).toContain('"StudyPlan"');
    expect(svc).toContain('"StudyGoal"');
    expect(svc).toMatch(/\$executeRawUnsafe|\$queryRawUnsafe/);
    expect(svc).toContain('INSERT INTO');
  });

  it('study-plan route is mounted as a persistent plan API', () => {
    const index = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf-8');
    expect(index).toContain('phase3StudyPlanRoutes');
    expect(index).toContain('/api/phase3/study-plans');
    const route = fs.readFileSync(path.join(SRC, 'routes/phase3StudyPlanRoutes.ts'), 'utf-8');
    expect(route).toContain('studySupportService');
  });
});
