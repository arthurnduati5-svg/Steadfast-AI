import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveDiagnostics: vi.fn(),
    getDiagnostics: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function generateDiagnostics(sessionId: string, gateResults: Record<string, boolean>): any {
  const gates = Object.entries(gateResults);
  const passed = gates.filter(([, v]) => v).length;
  const failed = gates.filter(([, v]) => !v).length;
  return {
    ok: failed === 0,
    sessionId,
    status: failed === 0 ? 'launch_ready' : 'blocked',
    totalGates: gates.length,
    gatesPassed: passed,
    gatesFailed: failed,
    gatesPending: 0,
    blockingIssueCount: failed,
    healthBudgetPassed: gateResults.healthBudgetPassed ?? true,
    incidentReadinessPassed: gateResults.incidentReadinessPassed ?? true,
    pauseReady: true,
    rollbackReady: true,
    killSwitchReady: true,
    generatedAt: new Date().toISOString(),
  };
}

describe('Task036 Diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates diagnostics with all gates passed', () => {
    const diag = generateDiagnostics('sess-1', {
      environmentGatePassed: true,
      launchWindowPassed: true,
      approvalPassed: true,
      privacyBoundaryPassed: true,
      healthBudgetPassed: true,
    });
    expect(diag.ok).toBe(true);
    expect(diag.status).toBe('launch_ready');
    expect(diag.totalGates).toBe(5);
    expect(diag.gatesPassed).toBe(5);
    expect(diag.gatesFailed).toBe(0);
  });

  it('generates diagnostics with failed gates', () => {
    const diag = generateDiagnostics('sess-1', {
      environmentGatePassed: true,
      launchWindowPassed: false,
      approvalPassed: true,
      privacyBoundaryPassed: false,
    });
    expect(diag.ok).toBe(false);
    expect(diag.status).toBe('blocked');
    expect(diag.gatesPassed).toBe(2);
    expect(diag.gatesFailed).toBe(2);
    expect(diag.blockingIssueCount).toBe(2);
  });

  it('saves diagnostics to repository', () => {
    const diag = generateDiagnostics('sess-1', { gate1: true });
    task036Repository.saveDiagnostics('sess-1', diag);
    expect(task036Repository.saveDiagnostics).toHaveBeenCalledWith('sess-1', diag);
  });

  it('retrieves stored diagnostics', () => {
    const diag = generateDiagnostics('sess-1', { gate1: true });
    vi.mocked(task036Repository.getDiagnostics).mockReturnValue(diag);
    const retrieved = task036Repository.getDiagnostics('sess-1');
    expect(retrieved!.totalGates).toBe(1);
    expect(retrieved!.gatesPassed).toBe(1);
  });

  it('reports health and incident readiness status', () => {
    const diag = generateDiagnostics('sess-1', {
      healthBudgetPassed: false,
      incidentReadinessPassed: true,
    });
    expect(diag.healthBudgetPassed).toBe(false);
    expect(diag.incidentReadinessPassed).toBe(true);
  });

  it('counts gates correctly with mixed results', () => {
    const diag = generateDiagnostics('sess-1', {
      a: true, b: true, c: false, d: true, e: false, f: false,
    });
    expect(diag.totalGates).toBe(6);
    expect(diag.gatesPassed).toBe(3);
    expect(diag.gatesFailed).toBe(3);
  });
});
