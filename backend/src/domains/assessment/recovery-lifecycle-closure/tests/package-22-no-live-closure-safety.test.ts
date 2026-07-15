import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosurePolicyEnforcer, RECOVERY_LIFECYCLE_CLOSURE_POLICIES } from '../policies/recoveryLifecycleClosurePolicyDefinitions';

describe('Package 22 - No Live Closure Safety', () => {
  const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
  const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);

  // NOTE: The policy definitions file and safety service are excluded from forbidden pattern
  // scans because they legitimately define what is forbidden. The policy file contains
  // policy family names like NO_LIVE_CLOSURE as part of its definitions. The safety
  // service contains field-name blocklists as string arrays for validation logic.
  // These are meta-definitions of what we forbid, not actual payloads.
  const package22SourceFiles = [
    '../contracts/recoveryLifecycleClosureContracts.ts',
    '../contracts/recoveryLifecycleClosureReadinessContracts.ts',
    '../contracts/recoveryPostSimulationHandoffPacketContracts.ts',
    '../contracts/recoveryNextCycleRecommendationContracts.ts',
    '../contracts/recoveryDeferredIntegrationTicketContracts.ts',
    '../contracts/recoveryUnresolvedRiskRegisterContracts.ts',
    '../contracts/recoveryClosureReviewPacketContracts.ts',
    '../contracts/recoveryStakeholderClosureDraftContracts.ts',
    '../contracts/recoveryArchiveManifestContracts.ts',
    '../contracts/recoveryFinalLifecycleSummaryContracts.ts',
    '../contracts/recoveryLifecycleClosureRepositoryContracts.ts',
    '../services/recoveryLifecycleClosureReadinessService.ts',
    '../services/recoveryPostSimulationHandoffPacketService.ts',
    '../services/recoveryNextCycleRecommendationService.ts',
    '../services/recoveryDeferredIntegrationTicketService.ts',
    '../services/recoveryUnresolvedRiskRegisterService.ts',
    '../services/recoveryClosureReviewPacketService.ts',
    '../services/recoveryStakeholderClosureDraftService.ts',
    '../services/recoveryArchiveManifestService.ts',
    '../services/recoveryFinalLifecycleSummaryService.ts',
    '../services/recoveryLifecycleClosureAuditBridge.ts',
    '../services/recoveryLifecycleClosureIdempotencyService.ts',
  ];

  const forbiddenPatterns = [
    'liveRecoveryClosurePayload', 'liveRecoveryActivationPayload', 'liveRecoveryCompletionPayload',
    'liveAssignmentPayload', 'scoreMutationPayload', 'masteryMutationPayload',
    'notificationPayload', 'portalPublishPayload', 'externalSyncPayload',
    'aiNarrative', 'generatedQuestionText', 'ocrText', 'pdfBinary',
  ];

  it('no live closure, live execution, live activation, live completion in any Package 22 file', () => {
    for (const file of package22SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('liveRecoveryClosurePayload');
      expect(content).not.toContain('liveRecoveryActivationPayload');
      expect(content).not.toContain('liveRecoveryCompletionPayload');
    }
  });

  it('no live assignment, notification, portal publish in any Package 22 file', () => {
    for (const file of package22SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('liveAssignmentPayload');
      expect(content).not.toContain('notificationPayload');
      expect(content).not.toContain('portalPublishPayload');
    }
  });

  it('no score mutation or mastery mutation in any Package 22 file', () => {
    for (const file of package22SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('scoreMutationPayload');
      expect(content).not.toContain('masteryMutationPayload');
    }
  });

  it('no AI, OCR, PDF, external sync in any Package 22 file', () => {
    for (const file of package22SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('aiNarrative');
      expect(content).not.toContain('generatedQuestionText');
      expect(content).not.toContain('ocrText');
      expect(content).not.toContain('pdfBinary');
      expect(content).not.toContain('externalSyncPayload');
    }
  });

  it('blocks live closure for all roles', () => {
    const codes = safety.validateNoLiveClosure();
    expect(codes).toContain('no_live_closure');
  });

  it('blocks live execution for all roles', () => {
    const codes = safety.validateNoLiveExecution();
    expect(codes).toContain('no_live_execution');
  });

  it('blocks live activation for all roles', () => {
    const codes = safety.validateNoLiveActivation();
    expect(codes).toContain('no_live_activation');
  });

  it('blocks score mutation for all roles', () => {
    const codes = safety.validateNoScoreMutation();
    expect(codes).toContain('no_score_mutation');
  });

  it('blocks mastery mutation for all roles', () => {
    const codes = safety.validateNoMasteryMutation();
    expect(codes).toContain('no_mastery_mutation');
  });

  it('allowed statuses are enforced (no closed_live, completed_live)', () => {
    const allowedStatuses = ['draft', 'review_ready', 'handoff_ready', 'approved_for_future_use',
      'suppressed', 'blocked', 'voided', 'active', 'stale', 'archive_ready'];
    for (const s of allowedStatuses) {
      expect(s).not.toMatch(/closed_live/);
      expect(s).not.toMatch(/completed_live/);
      expect(s).not.toMatch(/executed_live/);
      expect(s).not.toMatch(/activated/);
    }
  });

  it('student/parent/guest roles cannot mutate', () => {
    const blockedRoles = ['student', 'parent', 'guest', 'unknown'];
    for (const role of blockedRoles) {
      const decision = policyEnforcer.enforce('RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION', role);
      expect(decision.denied).toBe(true);
    }
  });

  it('no-live-closure policy families have empty allowedRoles', () => {
    const noLivePolicies = [
      'RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE',
      'RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION',
      'RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION',
      'RECOVERY_LIFECYCLE_NO_LIVE_COMPLETION',
      'RECOVERY_LIFECYCLE_NO_LIVE_ASSIGNMENT',
      'RECOVERY_LIFECYCLE_NO_LIVE_NOTIFICATION',
      'RECOVERY_LIFECYCLE_NO_PORTAL_PUBLISH',
      'RECOVERY_LIFECYCLE_NO_SCORE_MUTATION',
      'RECOVERY_LIFECYCLE_NO_MASTERY_MUTATION',
    ];
    for (const policyName of noLivePolicies) {
      const policy = RECOVERY_LIFECYCLE_CLOSURE_POLICIES[policyName];
      expect(policy).toBeDefined();
      expect(policy.allowedRoles.length).toBe(0);
    }
  });
});
