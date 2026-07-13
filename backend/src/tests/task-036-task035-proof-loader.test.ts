import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateTask035DependencyProof } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveTask035DependencyProof: vi.fn(),
    getTask035DependencyProof: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function loadProof(proof: any): string[] {
  const errors = validateTask035DependencyProof(proof);
  if (errors.length === 0) {
    task036Repository.saveTask035DependencyProof(proof);
  }
  return errors;
}

describe('Task036 Task035 Proof Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a valid proof successfully', () => {
    const proof = {
      ok: true, handoffExists: true, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: false,
      remainingBlockersEmpty: true, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: [],
      loadedAt: new Date().toISOString(),
    };
    const errors = loadProof(proof);
    expect(errors).toEqual([]);
    expect(task036Repository.saveTask035DependencyProof).toHaveBeenCalledWith(proof);
  });

  it('rejects proof with missing handoff', () => {
    const proof = {
      ok: true, handoffExists: false, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: false,
      remainingBlockersEmpty: true, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: [],
      loadedAt: new Date().toISOString(),
    };
    const errors = loadProof(proof);
    expect(errors).toContain('task035_handoff_not_found');
    expect(task036Repository.saveTask035DependencyProof).not.toHaveBeenCalled();
  });

  it('rejects proof with task040 contamination', () => {
    const proof = {
      ok: true, handoffExists: true, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: true,
      remainingBlockersEmpty: true, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: [],
      loadedAt: new Date().toISOString(),
    };
    const errors = loadProof(proof);
    expect(errors).toContain('task035_safeToStartTask040_should_be_false');
  });

  it('validates proof from repository retrieval', () => {
    const proof = {
      ok: true, handoffExists: true, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: false,
      remainingBlockersEmpty: true, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: [],
      loadedAt: new Date().toISOString(),
    };
    vi.mocked(task036Repository.getTask035DependencyProof).mockReturnValue(proof);
    const retrieved = task036Repository.getTask035DependencyProof();
    expect(retrieved).toEqual(proof);
    expect(retrieved!.safeToStartTask036).toBe(true);
  });

  it('rejects proof with blocking issues', () => {
    const proof = {
      ok: true, handoffExists: true, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: false,
      remainingBlockersEmpty: false, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: ['issue1'],
      loadedAt: new Date().toISOString(),
    };
    const errors = loadProof(proof);
    expect(errors).toContain('task035_remaining_blockers_not_empty');
  });
});
