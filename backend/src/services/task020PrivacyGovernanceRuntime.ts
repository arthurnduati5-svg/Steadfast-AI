// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Privacy Governance Runtime v1
// End-to-end orchestration runtime for governance checks.
// ─────────────────────────────────────────────────────────────

import type {
  TutorRole,
  DataCategory,
  AccessAction,
  GovernanceRuntimeRequest,
  GovernanceRuntimeResult,
  PrivacyBoundaryDecision,
  RoleAccessDecision,
  RetentionDecision,
} from '../contracts/task020GovernanceContracts';
import { roleAccessMatrixService } from './task020RoleAccessMatrixService';
import { privacyBoundaryEnforcementService } from './task020PrivacyBoundaryEnforcementService';
import { dataRetentionGovernanceService } from './task020DataRetentionGovernanceService';
import { governanceAuditService } from './task020GovernanceAuditService';

export class PrivacyGovernanceRuntime {
  async evaluate(request: GovernanceRuntimeRequest): Promise<GovernanceRuntimeResult> {
    const reasonCodes: string[] = [];

    // 1. Check role access matrix
    const roleDecision: RoleAccessDecision = roleAccessMatrixService.hasAccess({
      role: request.role,
      schoolId: request.schoolId,
      tutorLearnerId: request.tutorLearnerId,
      resourceCategory: request.resourceCategory,
      resourceOwner: 'learner',
      requestedAction: request.action,
      safeguardingRestricted: request.context?.safeguardingRestricted === true,
      deenSensitive: request.context?.deenSensitive === true,
      teacherVisible: request.context?.teacherVisible !== false,
      adminVisible: request.context?.adminVisible !== false,
      learnerVisible: request.context?.learnerVisible !== false,
    });

    if (!roleDecision.allowed) {
      await governanceAuditService.recordEvent({
        actorRole: request.role,
        schoolId: request.schoolId,
        tutorLearnerId: request.tutorLearnerId,
        resourceCategory: request.resourceCategory,
        action: 'role_access_denied',
        decision: 'denied',
        reasonCodes: roleDecision.reasonCodes,
        privacyMetadata: { decisionType: 'role_access_denied' },
        requestId: request.context?.requestId as string,
        createdAt: new Date().toISOString(),
      });

      return {
        allowed: false,
        privacyBoundary: {
          allowed: false,
          blocked: true,
          redactionApplied: true,
          safeFields: [],
          removedFields: [],
          reasonCodes: roleDecision.reasonCodes,
          privacyMetadata: { failClosed: true },
        },
        roleDecision,
        auditRecorded: true,
        reasonCodes: roleDecision.reasonCodes,
      };
    }

    // 2. Apply privacy boundary
    const contextFields = Object.keys(request.context || {});
    const privacyDecision: PrivacyBoundaryDecision = privacyBoundaryEnforcementService.enforcePrivacy({
      role: request.role,
      schoolId: request.schoolId,
      resourceCategory: request.resourceCategory,
      action: request.action,
      payloadFields: contextFields,
      context: request.context || {},
    });

    if (privacyDecision.blocked) {
      await governanceAuditService.recordEvent({
        actorRole: request.role,
        schoolId: request.schoolId,
        tutorLearnerId: request.tutorLearnerId,
        resourceCategory: request.resourceCategory,
        action: 'privacy_access_decision',
        decision: 'blocked',
        reasonCodes: privacyDecision.reasonCodes,
        privacyMetadata: { decisionType: 'privacy_blocked' },
        requestId: request.context?.requestId as string,
        createdAt: new Date().toISOString(),
      });

      return {
        allowed: false,
        privacyBoundary: privacyDecision,
        roleDecision,
        auditRecorded: true,
        reasonCodes: privacyDecision.reasonCodes,
      };
    }

    // 3. Get retention decision
    const retentionDecision: RetentionDecision = dataRetentionGovernanceService.getRetentionDecision(request.resourceCategory);

    // 4. Record governance audit
    await governanceAuditService.recordEvent({
      actorRole: request.role,
      schoolId: request.schoolId,
      tutorLearnerId: request.tutorLearnerId,
      resourceCategory: request.resourceCategory,
      action: 'role_access_allowed',
      decision: 'allowed',
      reasonCodes: ['governance-runtime-allowed'],
      privacyMetadata: {
        decisionType: 'governance_runtime_allowed',
        privacyFieldCount: privacyDecision.safeFields.length,
        retentionCategory: retentionDecision.category,
      },
      requestId: request.context?.requestId as string,
      createdAt: new Date().toISOString(),
    });

    return {
      allowed: true,
      privacyBoundary: privacyDecision,
      roleDecision,
      retentionDecision,
      auditRecorded: true,
      reasonCodes: ['governance-runtime-allowed'],
    };
  }

  async checkAccess(
    role: TutorRole,
    schoolId: string,
    resourceCategory: DataCategory,
    action: AccessAction,
    context?: Record<string, unknown>,
  ): Promise<GovernanceRuntimeResult> {
    return this.evaluate({
      role,
      schoolId,
      resourceCategory,
      action,
      context: context || {},
    });
  }
}

export const privacyGovernanceRuntime = new PrivacyGovernanceRuntime();
