import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Rollback command route contract', () => {
  it('control rollback route exists', () => {
    expect(content).toContain("router.post('/task029/expansion-operations/runs/:runId/control/rollback'");
  });

  it('control rollback uses controlGuard', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/rollback', ...controlGuard");
  });

  it('control rollback checks school context', () => {
    expect(content).toMatch(/control\/rollback[^]*?NO_SCHOOL_CONTEXT/);
  });

  it('control rollback validates rollbackReason in request body', () => {
    expect(content).toContain("rollbackReason is required in request body");
  });

  it('control rollback calls executeRollbackCommand service', () => {
    expect(content).toContain("executeRollbackCommand");
  });

  it('control rollback returns rollbackId, status and safeMessage on success', () => {
    const rollbackBlock = content.match(/\/task029\/expansion-operations\/runs\/:runId\/control\/rollback[^]*?(?=\n\/\/|$)/s);
    expect(rollbackBlock).not.toBeNull();
    if (rollbackBlock) {
      expect(rollbackBlock[0]).toContain('rollbackId: result.rollbackId');
      expect(rollbackBlock[0]).toContain('status: result.status');
      expect(rollbackBlock[0]).toContain('safeMessage: result.safeMessage');
    }
  });

  it('old rollback path also exists', () => {
    expect(content).toContain("router.post('/pilot/expansion/operations/rollback'");
  });
});
