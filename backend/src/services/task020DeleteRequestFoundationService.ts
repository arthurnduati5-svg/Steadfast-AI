import {
  type Task020DeleteRequest, type Task020DeleteStatus,
  type Task020ActorRole,
} from '../contracts/task020SecurityPrivacyGovernanceContracts';

export class Task020DeleteRequestFoundationService {
  private requestCounter = 0;

  createDeleteRequest(
    requesterRole: Task020ActorRole,
    schoolId: string,
    targetLearnerId: string | undefined,
    deleteType: 'learner_self' | 'school_admin' | 'data_retention_policy',
  ): Task020DeleteRequest {
    this.requestCounter++;
    const now = new Date().toISOString();
    return {
      requestId: `del_${Date.now()}_${this.requestCounter}`,
      requesterRole,
      schoolId,
      targetLearnerId,
      deleteType,
      status: 'requested',
      createdAt: now,
      updatedAt: now,
      redactionRequired: true,
      safeguardingHold: false,
      auditHold: false,
      reasonCodes: ['T020_DEL_REQUEST_CREATED'],
    };
  }

  approveDeleteRequest(request: Task020DeleteRequest): Task020DeleteRequest {
    return { ...request, status: 'approved', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_DEL_APPROVED'] };
  }

  denyDeleteRequest(request: Task020DeleteRequest): Task020DeleteRequest {
    return { ...request, status: 'denied', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_DEL_DENIED'] };
  }

  blockDeleteForSafeguardingHold(request: Task020DeleteRequest): Task020DeleteRequest {
    return { ...request, status: 'blocked_by_safeguarding_hold', safeguardingHold: true, updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_DEL_SAFEGUARDING_HOLD'] };
  }

  blockDeleteForAuditHold(request: Task020DeleteRequest): Task020DeleteRequest {
    return { ...request, status: 'blocked_by_audit_hold', auditHold: true, updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_DEL_AUDIT_HOLD'] };
  }

  completeDeleteRequest(request: Task020DeleteRequest): Task020DeleteRequest {
    return { ...request, status: 'completed', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_DEL_COMPLETED'] };
  }

  buildDeleteSafeSummary(request: Task020DeleteRequest): Record<string, unknown> {
    return {
      requestId: request.requestId,
      status: request.status,
      deleteType: request.deleteType,
      redactionRequired: request.redactionRequired,
      safeguardingHold: request.safeguardingHold,
      auditHold: request.auditHold,
      createdAt: request.createdAt,
      reasonCodes: request.reasonCodes,
    };
  }
}

export const task020DeleteRequestFoundationService = new Task020DeleteRequestFoundationService();
