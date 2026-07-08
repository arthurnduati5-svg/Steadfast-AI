import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Control action delegation contract', () => {
  it('control pause route delegates to executeControlAction', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/pause'");
    expect(content).toContain("executeControlAction");
  });

  it('control resume route delegates to executeControlAction', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/resume'");
    expect(content).toContain("action: 'resume_expansion'");
  });

  it('control intervention route delegates to executeControlAction', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/intervention'");
    expect(content).toContain("action: 'request_intervention'");
  });

  it('control kill-switch enable delegates to executeControlAction', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/kill-switch/enable'");
    expect(content).toContain("action: 'execute_kill_switch'");
  });

  it('executeControlAction is imported from task029ControlActionService', () => {
    expect(content).toContain("import { executeControlAction } from '../services/task029ControlActionService'");
  });

  it('control pause action outcome is returned with action, status and safeMessage', () => {
    const pauseBlock = content.match(/\/task029\/expansion-operations\/runs\/:runId\/control\/pause[^]*?(?=\n\/\/|$)/s);
    expect(pauseBlock).not.toBeNull();
    if (pauseBlock) {
      expect(pauseBlock[0]).toContain('action: result.action');
      expect(pauseBlock[0]).toContain('status: result.status');
      expect(pauseBlock[0]).toContain('safeMessage: result.safeMessage');
    }
  });
});
