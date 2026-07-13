import { describe, it, expect } from 'vitest';
import {
  TASK040_ACCEPTED_TASK_IDS,
  TASK040_REQUIRED_DEPENDENCY_TASK_IDS,
  TASK040_REQUIRED_TASK036_COMMIT_PREFIXES,
  TASK040_REQUIRED_REPORTS,
  TASK040_REQUIRED_SCRIPTS,
  TASK040_REQUIRED_BACKEND_FREEZE_DOCS,
  TASK040_ALLOWED_FREEZE_SCOPES,
  TASK040_FORBIDDEN_SCOPES,
  TASK040_ALLOWED_ACTOR_ROLES,
  TASK040_DENIED_ACTOR_ROLES,
  TASK040_FORBIDDEN_OUTPUT_FIELDS,
  TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK040_FORBIDDEN_MUTATION_PATTERNS,
  TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS,
  TASK040_ALLOWED_STAGED_PATH_PATTERNS,
  TASK040_FORBIDDEN_STAGED_PATH_PATTERNS,
  TASK040_FINAL_BACKEND_FREEZE_VERSION,
  resolveTask040ActorRole,
  isTask040AllowedActorRole,
  isTask040DeniedActorRole,
  createTask040SafeId,
  createTask040SafeTimestamp,
  isTask040AcceptedTaskId,
  calculateTask040FreezeDecision,
  calculateTask040SafeToStartNextPhase,
  isTask040ForbiddenStagedPath,
  isTask040AllowedStagedPath,
  redactTask040UnsafePath,
  task040SafeJsonKeys,
} from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - Contracts', () => {
  describe('TASK040_ACCEPTED_TASK_IDS', () => {
    it('contains tasks 020 through 036', () => {
      expect(TASK040_ACCEPTED_TASK_IDS.includes('020')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('021')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('022')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('023')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('024')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('025')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('026')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('027')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('028')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('029')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('030')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('031')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('032')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('033')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('034')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('035')).toBe(true);
      expect(TASK040_ACCEPTED_TASK_IDS.includes('036')).toBe(true);
    });

    it('has exactly 17 entries', () => {
      expect(TASK040_ACCEPTED_TASK_IDS.length).toBe(17);
    });
  });

  describe('TASK040_REQUIRED_DEPENDENCY_TASK_IDS', () => {
    it('contains task 036', () => {
      expect(TASK040_REQUIRED_DEPENDENCY_TASK_IDS.includes('036')).toBe(true);
    });
  });

  describe('TASK040_REQUIRED_TASK036_COMMIT_PREFIXES', () => {
    it('contains the expected commit prefix', () => {
      expect(TASK040_REQUIRED_TASK036_COMMIT_PREFIXES.length).toBeGreaterThan(0);
      expect(TASK040_REQUIRED_TASK036_COMMIT_PREFIXES[0]).toBe('45f361c');
    });
  });

  describe('TASK040_REQUIRED_REPORTS', () => {
    it('has at least 5 required reports', () => {
      expect(TASK040_REQUIRED_REPORTS.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('TASK040_REQUIRED_SCRIPTS', () => {
    it('has exactly 5 required scripts', () => {
      expect(TASK040_REQUIRED_SCRIPTS.length).toBe(5);
    });
  });

  describe('TASK040_REQUIRED_BACKEND_FREEZE_DOCS', () => {
    it('has at least 9 required docs', () => {
      expect(TASK040_REQUIRED_BACKEND_FREEZE_DOCS.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('TASK040_ALLOWED_FREEZE_SCOPES', () => {
    it('includes freeze_contract', () => {
      expect(TASK040_ALLOWED_FREEZE_SCOPES.includes('freeze_contract')).toBe(true);
    });

    it('includes freeze_test', () => {
      expect(TASK040_ALLOWED_FREEZE_SCOPES.includes('freeze_test')).toBe(true);
    });

    it('has no forbidden scopes', () => {
      for (const scope of TASK040_ALLOWED_FREEZE_SCOPES) {
        expect(scope).toMatch(/^freeze_/);
      }
    });
  });

  describe('TASK040_FORBIDDEN_SCOPES', () => {
    it('includes new_product_feature', () => {
      expect(TASK040_FORBIDDEN_SCOPES.includes('new_product_feature')).toBe(true);
    });

    it('includes frontend_ui', () => {
      expect(TASK040_FORBIDDEN_SCOPES.includes('frontend_ui')).toBe(true);
    });

    it('includes production_deployment', () => {
      expect(TASK040_FORBIDDEN_SCOPES.includes('production_deployment')).toBe(true);
    });
  });

  describe('TASK040_ALLOWED_ACTOR_ROLES', () => {
    it('includes admin', () => {
      expect(TASK040_ALLOWED_ACTOR_ROLES.includes('admin')).toBe(true);
    });

    it('includes internal_operator', () => {
      expect(TASK040_ALLOWED_ACTOR_ROLES.includes('internal_operator')).toBe(true);
    });

    it('includes privacy_owner', () => {
      expect(TASK040_ALLOWED_ACTOR_ROLES.includes('privacy_owner')).toBe(true);
    });
  });

  describe('TASK040_DENIED_ACTOR_ROLES', () => {
    it('includes student', () => {
      expect(TASK040_DENIED_ACTOR_ROLES.includes('student')).toBe(true);
    });

    it('includes parent', () => {
      expect(TASK040_DENIED_ACTOR_ROLES.includes('parent')).toBe(true);
    });

    it('includes teacher', () => {
      expect(TASK040_DENIED_ACTOR_ROLES.includes('teacher')).toBe(true);
    });
  });

  describe('TASK040_FORBIDDEN_OUTPUT_FIELDS', () => {
    it('includes rawLearnerData', () => {
      expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawLearnerData')).toBe(true);
    });

    it('includes hiddenReasoning', () => {
      expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('hiddenReasoning')).toBe(true);
    });

    it('includes privateDeenText', () => {
      expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('privateDeenText')).toBe(true);
    });
  });

  describe('TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS', () => {
    it('includes fetch()', () => {
      expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('fetch(')).toBe(true);
    });

    it('includes openai', () => {
      expect(TASK040_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('openai')).toBe(true);
    });
  });

  describe('TASK040_FORBIDDEN_MUTATION_PATTERNS', () => {
    it('includes prisma migrate deploy', () => {
      expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('prisma migrate deploy')).toBe(true);
    });

    it('includes DROP TABLE', () => {
      expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('DROP TABLE')).toBe(true);
    });
  });

  describe('TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS', () => {
    it('includes task041', () => {
      expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('task041')).toBe(true);
    });

    it('includes task042', () => {
      expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('task042')).toBe(true);
    });
  });

  describe('TASK040_FINAL_BACKEND_FREEZE_VERSION', () => {
    it('is 1.0.0', () => {
      expect(TASK040_FINAL_BACKEND_FREEZE_VERSION).toBe('1.0.0');
    });
  });

  describe('resolveTask040ActorRole', () => {
    it('resolves admin correctly', () => {
      expect(resolveTask040ActorRole('admin')).toBe('admin');
    });

    it('resolves case-insensitively', () => {
      expect(resolveTask040ActorRole('ADMIN')).toBe('admin');
    });

    it('resolves student as denied', () => {
      expect(resolveTask040ActorRole('student')).toBe('student');
    });

    it('returns unknown for unrecognized roles', () => {
      expect(resolveTask040ActorRole('superuser')).toBe('unknown');
    });
  });

  describe('isTask040AllowedActorRole', () => {
    it('returns true for admin', () => {
      expect(isTask040AllowedActorRole('admin')).toBe(true);
    });

    it('returns false for student', () => {
      expect(isTask040AllowedActorRole('student')).toBe(false);
    });
  });

  describe('isTask040DeniedActorRole', () => {
    it('returns true for student', () => {
      expect(isTask040DeniedActorRole('student')).toBe(true);
    });

    it('returns false for admin', () => {
      expect(isTask040DeniedActorRole('admin')).toBe(false);
    });
  });

  describe('createTask040SafeId', () => {
    it('creates an id with the given prefix', () => {
      const id = createTask040SafeId('test');
      expect(id.startsWith('test_')).toBe(true);
    });

    it('creates unique ids', () => {
      const id1 = createTask040SafeId('test');
      const id2 = createTask040SafeId('test');
      expect(id1).not.toBe(id2);
    });
  });

  describe('createTask040SafeTimestamp', () => {
    it('creates a valid ISO timestamp', () => {
      const ts = createTask040SafeTimestamp();
      expect(() => new Date(ts)).not.toThrow();
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });

  describe('isTask040AcceptedTaskId', () => {
    it('returns true for 020', () => {
      expect(isTask040AcceptedTaskId('020')).toBe(true);
    });

    it('returns true for 036', () => {
      expect(isTask040AcceptedTaskId('036')).toBe(true);
    });

    it('returns false for 041', () => {
      expect(isTask040AcceptedTaskId('041')).toBe(false);
    });

    it('returns false for 001', () => {
      expect(isTask040AcceptedTaskId('001')).toBe(false);
    });
  });

  describe('calculateTask040FreezeDecision', () => {
    const makeProof = (overrides?: any) => ({
      verified: true,
      taskId: '036',
      commitHash: '45f361c',
      handoffPath: 'handoff.md',
      reportPath: 'report.md',
      jsonReportPath: 'report.json',
      acceptanceVerdict: 'ACCEPTED_READY_YES',
      safeToStartTask040: true,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040',
      remainingBlockersEmpty: true,
      dependencyProof: { ok: true, taskId: '036', commitExists: true, commitHash: '45f361c', commitMessage: '', handoffExists: true, reportExists: true, jsonReportExists: true, verdictIsAcceptedReadyYes: true, safeToStartTask040: true, finalDecision: '', remainingBlockersEmpty: true, focusedTestsPassed: true, focusedTestFileCount: 70, focusedAssertionCount: 650, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, safetyScansPassed: true, noFrontendUiCommitted: true, noAiFilesCommitted: true, noTask040ImplementationCommitted: true, noBackendDistCommitted: true, noLogsCommitted: true, noGeneratedCacheTempCommitted: true, verificationScriptPassed: true, notes: '' },
      checkedAt: new Date().toISOString(),
      notes: '',
      ...overrides,
    });

    const makeManifest = (overrides?: any) => ({
      taskId: '040',
      taskName: 'Final Backend Logic Freeze',
      freezeVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      scope: 'backend_freeze_only',
      task036DependencyVerified: true,
      acceptedTaskLedgerCreated: true,
      acceptedTaskLedgerTaskCount: 17,
      backendSurfaceManifestCreated: true,
      contractInventoryCreated: true,
      serviceInventoryCreated: true,
      repositoryInventoryCreated: true,
      testInventoryCreated: true,
      scriptInventoryCreated: true,
      reportInventoryCreated: true,
      dirtyWorkspaceClassified: true,
      futureTaskContaminationClassified: true,
      outOfScopeManifestCreated: true,
      noDriftCheckPassed: true,
      regressionCheckPassed: true,
      safetyScansPassed: true,
      changeControlPolicyCreated: true,
      ...overrides,
    });

    const makeNoDrift = (overrides?: any) => ({
      ok: true,
      task036ReportStillAccepted: true,
      task036SafeToStartTask040StillTrue: true,
      task040ModifiedTask036Runtime: false,
      task040ModifiedFrontend: false,
      task040ModifiedAiRuntime: false,
      task040ModifiedDeploymentLogic: false,
      task040IntroducedLiveIntegrations: false,
      details: [],
      ...overrides,
    });

    const makeRegression = (overrides?: any) => ({
      ok: true,
      task020To036RegressionPassed: true,
      phase3RegressionPassed: true,
      fullBackendSuitePassed: true,
      typeScriptPassed: true,
      backendBuildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      details: [],
      ...overrides,
    });

    const makeSafetyResults = () => [
      { scanName: 'privacy', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] },
      { scanName: 'production_mutation', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] },
    ];

    it('returns ACCEPTED when all gates pass', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 400, true,
      );
      expect(decision.backendFreezeCreated).toBe(true);
      expect(decision.backendFrozenThroughTask036).toBe(true);
      expect(decision.finalDecision).toBe('TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED');
      expect(decision.remainingBlockers).toEqual([]);
    });

    it('returns BLOCKED when task 036 proof is not verified', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof({ verified: false }),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 400, true,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
      expect(decision.remainingBlockers.length).toBeGreaterThan(0);
    });

    it('returns BLOCKED when focused tests fail', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        false, 45, 400, true,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
    });

    it('returns BLOCKED when test file count is below 45', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 30, 400, true,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
    });

    it('returns BLOCKED when assertion count is below 400', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 100, true,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
    });

    it('sets safeToModifyBackendWithoutChangeControl to false always', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 400, true,
      );
      expect(decision.safeToModifyBackendWithoutChangeControl).toBe(false);
    });

    it('returns BLOCKED when verification script fails', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift(),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 400, false,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
    });

    it('returns BLOCKED when no-drift check fails', () => {
      const decision = calculateTask040FreezeDecision(
        makeManifest(),
        makeProof(),
        makeNoDrift({ ok: false }),
        makeRegression(),
        makeSafetyResults(),
        true, 45, 400, true,
      );
      expect(decision.finalDecision).toBe('TASK_040_BLOCKED');
    });
  });

  describe('calculateTask040SafeToStartNextPhase', () => {
    it('returns true for an accepted decision', () => {
      const decision = {
        backendFreezeCreated: true,
        backendFrozenThroughTask036: true,
        safeToStartFrontendIntegrationOrNextPhase: true,
        safeToModifyBackendWithoutChangeControl: false,
        finalDecision: 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED' as const,
        remainingBlockers: [],
        proof: [],
      };
      expect(calculateTask040SafeToStartNextPhase(decision)).toBe(true);
    });

    it('returns false when blocked', () => {
      const decision = {
        backendFreezeCreated: false,
        backendFrozenThroughTask036: false,
        safeToStartFrontendIntegrationOrNextPhase: false,
        safeToModifyBackendWithoutChangeControl: false,
        finalDecision: 'TASK_040_BLOCKED' as const,
        remainingBlockers: ['test blocker'],
        proof: [],
      };
      expect(calculateTask040SafeToStartNextPhase(decision)).toBe(false);
    });
  });

  describe('isTask040ForbiddenStagedPath', () => {
    it('detects AI/ paths as forbidden', () => {
      expect(isTask040ForbiddenStagedPath('AI/ai/flows/test.ts')).toBe(true);
    });

    it('detects frontend/ paths as forbidden', () => {
      expect(isTask040ForbiddenStagedPath('frontend/app/page.tsx')).toBe(true);
    });

    it('allows valid contract path', () => {
      expect(isTask040ForbiddenStagedPath('backend/src/contracts/task040BackendFreezeContracts.ts')).toBe(false);
    });

    it('detects .env as forbidden', () => {
      expect(isTask040ForbiddenStagedPath('.env')).toBe(true);
    });
  });

  describe('isTask040AllowedStagedPath', () => {
    it('allows contracts file', () => {
      expect(isTask040AllowedStagedPath('backend/src/contracts/task040BackendFreezeContracts.ts')).toBe(true);
    });

    it('allows routes file', () => {
      expect(isTask040AllowedStagedPath('backend/src/routes/task040BackendFreezeRoutes.ts')).toBe(true);
    });

    it('does not allow frontend files', () => {
      expect(isTask040AllowedStagedPath('frontend/app/page.tsx')).toBe(false);
    });
  });

  describe('redactTask040UnsafePath', () => {
    it('redacts AI paths', () => {
      expect(redactTask040UnsafePath('AI/ai/flows/test.ts')).toContain('REDACTED');
    });

    it('passes through valid paths', () => {
      expect(redactTask040UnsafePath('backend/src/contracts/task040BackendFreezeContracts.ts')).not.toContain('REDACTED');
    });
  });

  describe('task040SafeJsonKeys', () => {
    it('contains expected keys', () => {
      expect(task040SafeJsonKeys.has('status')).toBe(true);
      expect(task040SafeJsonKeys.has('backendFreezeCreated')).toBe(true);
      expect(task040SafeJsonKeys.has('finalDecision')).toBe(true);
      expect(task040SafeJsonKeys.has('verdict')).toBe(true);
    });

    it('does not contain forbidden output keys', () => {
      expect(task040SafeJsonKeys.has('rawLearnerData')).toBe(false);
      expect(task040SafeJsonKeys.has('hiddenReasoning')).toBe(false);
    });
  });
});
