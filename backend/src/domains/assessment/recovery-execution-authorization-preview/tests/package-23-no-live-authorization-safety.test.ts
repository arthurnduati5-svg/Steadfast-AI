import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryExecutionAuthorizationSafetyService } from '../services/recoveryExecutionAuthorizationSafetyService';
import { RECOVERY_EXECUTION_AUTHORIZATION_PREVIEW_POLICIES } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';

describe('Package 23 - No Live Authorization Safety', () => {
  const safety = new RecoveryExecutionAuthorizationSafetyService();

  const package23SourceFiles = [
    '../contracts/recoveryExecutionAuthorizationPreviewContracts.ts',
    '../contracts/recoveryExecutionAuthorizationReadinessContracts.ts',
    '../contracts/recoveryExecutionAuthorizationRequestContracts.ts',
    '../contracts/recoveryExecutionAuthorizationEligibilityContracts.ts',
    '../contracts/recoveryExecutionAuthorityMatrixContracts.ts',
    '../contracts/recoveryExecutionApprovalChainContracts.ts',
    '../contracts/recoveryExecutionRiskAttestationContracts.ts',
    '../contracts/recoveryExecutionConsentBoundaryContracts.ts',
    '../contracts/recoveryExecutionVetoContracts.ts',
    '../contracts/recoveryExecutionPreflightChecklistContracts.ts',
    '../contracts/recoveryExecutionAuthorizationDryRunContracts.ts',
    '../contracts/recoveryExecutionPreLiveDecisionPacketContracts.ts',
    '../contracts/recoveryExecutionMockAuthorizationReceiptContracts.ts',
    '../contracts/recoveryExecutionAuthorizationSummaryContracts.ts',
    '../services/recoveryExecutionAuthorizationReadinessService.ts',
    '../services/recoveryExecutionAuthorizationRequestService.ts',
    '../services/recoveryExecutionAuthorizationEligibilityService.ts',
    '../services/recoveryExecutionAuthorityMatrixService.ts',
    '../services/recoveryExecutionApprovalChainService.ts',
    '../services/recoveryExecutionRiskAttestationService.ts',
    '../services/recoveryExecutionConsentBoundaryService.ts',
    '../services/recoveryExecutionVetoService.ts',
    '../services/recoveryExecutionPreflightChecklistService.ts',
    '../services/recoveryExecutionAuthorizationDryRunService.ts',
    '../services/recoveryExecutionPreLiveDecisionPacketService.ts',
    '../services/recoveryExecutionMockAuthorizationReceiptService.ts',
    '../services/recoveryExecutionAuthorizationSummaryService.ts',
    '../services/recoveryExecutionAuthorizationAuditBridge.ts',
    '../services/recoveryExecutionAuthorizationIdempotencyService.ts',
  ];

  it('assertNoLiveAuthorization throws for all roles', () => {
    const roles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'student', 'parent', 'guest', 'unknown'];
    for (const role of roles) {
      expect(() => safety.assertNoLiveAuthorization(role)).toThrow('Safety check failed: no_live_authorization');
    }
  });

  it('assertNoLiveExecution throws for all roles', () => {
    const roles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'student', 'parent', 'guest', 'unknown'];
    for (const role of roles) {
      expect(() => safety.assertNoLiveExecution(role)).toThrow('Safety check failed: no_live_execution');
    }
  });

  it('assertNoLiveClosure throws for all roles', () => {
    const roles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'student', 'parent', 'guest', 'unknown'];
    for (const role of roles) {
      expect(() => safety.assertNoLiveClosure(role)).toThrow('Safety check failed: no_live_closure');
    }
  });

  it('assertNoScoreMutation throws for all roles', () => {
    const roles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'student', 'parent', 'guest', 'unknown'];
    for (const role of roles) {
      expect(() => safety.assertNoScoreMutation(role)).toThrow('Safety check failed: no_score_mutation');
    }
  });

  it('assertNoMasteryMutation throws for all roles', () => {
    const roles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'student', 'parent', 'guest', 'unknown'];
    for (const role of roles) {
      expect(() => safety.assertNoMasteryMutation(role)).toThrow('Safety check failed: no_mastery_mutation');
    }
  });

  it('no live authorization, execution, closure in any Package 23 file', () => {
    for (const file of package23SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('liveAuthorizationPayload');
      expect(content).not.toContain('liveExecutionPayload');
      expect(content).not.toContain('liveClosurePayload');
    }
  });

  it('no live activation in any Package 23 file', () => {
    for (const file of package23SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('liveActivationPayload');
    }
  });

  it('no score mutation or mastery mutation in any Package 23 file', () => {
    for (const file of package23SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('scoreMutationPayload');
      expect(content).not.toContain('masteryMutationPayload');
    }
  });

  it('no AI, OCR, PDF, external sync in any Package 23 file', () => {
    for (const file of package23SourceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      expect(content).not.toContain('aiNarrative');
      expect(content).not.toContain('generatedQuestionText');
      expect(content).not.toContain('ocrText');
      expect(content).not.toContain('pdfBinary');
    }
  });

  it('no-live-authorization policy families have empty allowedRoles', () => {
    const noLivePolicies = [
      'RECOVERY_EXECUTION_NO_LIVE_AUTHORIZATION',
      'RECOVERY_EXECUTION_NO_LIVE_EXECUTION',
      'RECOVERY_EXECUTION_NO_LIVE_CLOSURE',
      'RECOVERY_EXECUTION_NO_LIVE_ACTIVATION',
      'RECOVERY_EXECUTION_NO_SCORE_MUTATION',
      'RECOVERY_EXECUTION_NO_MASTERY_MUTATION',
    ];
    for (const policyName of noLivePolicies) {
      const policy = RECOVERY_EXECUTION_AUTHORIZATION_PREVIEW_POLICIES[policyName];
      expect(policy).toBeDefined();
      expect(policy.allowedRoles.length).toBe(0);
    }
  });
});
