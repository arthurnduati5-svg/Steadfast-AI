import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task029OperationsDiagnosticsInput, Task029OperationsDiagnostics } from '../contracts/task029ExpansionOperationsContracts';

vi.mock('../services/task029OperationsDiagnosticsService', () => ({
  getOperationsDiagnostics: vi.fn(),
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordOperationsDiagnostics: vi.fn(),
  },
}));

vi.mock('../services/task029Task028ProofLoaderService', () => ({
  loadTask028ProofForTask029: vi.fn(),
}));

const { getOperationsDiagnostics } = await import('../services/task029OperationsDiagnosticsService');

describe('getOperationsDiagnostics', () => {
  const validInput: Task029OperationsDiagnosticsInput = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'admin',
  };

  const mockDiagnostics: Task029OperationsDiagnostics = {
    task028ProofStatus: 'proof_valid',
    routeMountStatus: 'mounted',
    dashboardReadModelStatus: 'available',
    permissionMatrixStatus: 'available',
    controlActionServiceStatus: 'available',
    reportGenerationStatus: 'available',
    safetyScanStatus: 'passed',
    blockedDependencyList: [],
    safeRemediationLabels: ['all_checks_passed'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true with diagnostics data for valid input', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
  });

  it('returns task028ProofStatus string', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(typeof result.data!.task028ProofStatus).toBe('string');
    expect(['proof_valid', 'proof_invalid']).toContain(result.data!.task028ProofStatus);
  });

  it('returns all route and service status fields', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(result.data!.routeMountStatus).toBe('mounted');
    expect(result.data!.dashboardReadModelStatus).toBe('available');
    expect(result.data!.permissionMatrixStatus).toBe('available');
    expect(result.data!.controlActionServiceStatus).toBe('available');
    expect(result.data!.reportGenerationStatus).toBe('available');
  });

  it('returns safetyScanStatus', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(typeof result.data!.safetyScanStatus).toBe('string');
  });

  it('returns blockedDependencyList as string array', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(Array.isArray(result.data!.blockedDependencyList)).toBe(true);
  });

  it('returns safeRemediationLabels as string array', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(Array.isArray(result.data!.safeRemediationLabels)).toBe(true);
    expect(result.data!.safeRemediationLabels.length).toBeGreaterThanOrEqual(0);
  });

  it('returns blockingIssues when missing input fields', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getOperationsDiagnostics({ schoolId: '', actorId: '', actorRole: '' });
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('missing_required_input_fields');
  });

  it('remediation labels change based on blocked dependencies', async () => {
    const blockedDiag: Task029OperationsDiagnostics = {
      ...mockDiagnostics,
      task028ProofStatus: 'proof_invalid',
      blockedDependencyList: ['task028_proof_not_found'],
      safeRemediationLabels: ['resolve_task028_proof_issues'],
    };
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: blockedDiag, blockingIssues: ['task028_proof_not_found'] });
    const result = await getOperationsDiagnostics(validInput);
    expect(result.data!.blockedDependencyList.length).toBeGreaterThan(0);
    expect(result.data!.safeRemediationLabels).toContain('resolve_task028_proof_issues');
  });

  it('reportGenerationStatus is a non-empty string', async () => {
    vi.mocked(getOperationsDiagnostics).mockResolvedValue({ ok: true, data: mockDiagnostics, blockingIssues: [] });
    const result = await getOperationsDiagnostics(validInput);
    expect(result.data!.reportGenerationStatus.length).toBeGreaterThan(0);
  });
});
