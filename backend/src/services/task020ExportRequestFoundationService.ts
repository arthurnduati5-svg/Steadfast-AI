import {
  type Task020ExportRequest, type Task020ExportStatus,
  type Task020ActorRole, type Task020DataCategory,
} from '../contracts/task020SecurityPrivacyGovernanceContracts';

const EXPORT_BLOCKED_CATEGORIES = new Set<string>([
  'safeguarding_raw', 'deen_private_text', 'credential', 'provider_prompt',
  'provider_response', 'hidden_reasoning', 'answer_key', 'model_answer', 'marking_scheme',
]);

const EXPORT_METADATA_ONLY_CATEGORIES = new Set<string>([
  'peer_identity', 'audit_metadata', 'operational_metric',
]);

export class Task020ExportRequestFoundationService {
  private requestCounter = 0;

  createExportRequest(
    requesterRole: Task020ActorRole,
    schoolId: string,
    targetLearnerId: string | undefined,
    exportType: 'learner_self' | 'school_admin' | 'safeguarding_review',
  ): Task020ExportRequest {
    this.requestCounter++;
    const now = new Date().toISOString();
    const redactionRequired = exportType !== 'safeguarding_review';
    return {
      requestId: `exp_${Date.now()}_${this.requestCounter}`,
      requesterRole,
      schoolId,
      targetLearnerId,
      exportType,
      status: 'requested',
      createdAt: now,
      updatedAt: now,
      redactionRequired,
      reasonCodes: ['T020_EXP_REQUEST_CREATED'],
    };
  }

  approveRedactedExportRequest(request: Task020ExportRequest): Task020ExportRequest {
    return { ...request, status: 'approved_redacted', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_EXP_APPROVED_REDACTED'] };
  }

  denyExportRequest(request: Task020ExportRequest): Task020ExportRequest {
    return { ...request, status: 'denied', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_EXP_DENIED'] };
  }

  completeMetadataOnlyExportRequest(request: Task020ExportRequest): Task020ExportRequest {
    return { ...request, status: 'completed_metadata_only', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_EXP_COMPLETED_METADATA'] };
  }

  completeRedactedExportRequest(request: Task020ExportRequest): Task020ExportRequest {
    return { ...request, status: 'completed_redacted', updatedAt: new Date().toISOString(), reasonCodes: [...request.reasonCodes, 'T020_EXP_COMPLETED_REDACTED'] };
  }

  isCategoryExportBlocked(category: Task020DataCategory | string): boolean {
    return EXPORT_BLOCKED_CATEGORIES.has(category);
  }

  isCategoryMetadataOnly(category: Task020DataCategory | string): boolean {
    return EXPORT_METADATA_ONLY_CATEGORIES.has(category);
  }

  buildExportSafeSummary(request: Task020ExportRequest): Record<string, unknown> {
    return {
      requestId: request.requestId,
      status: request.status,
      exportType: request.exportType,
      redactionRequired: request.redactionRequired,
      createdAt: request.createdAt,
      reasonCodes: request.reasonCodes,
    };
  }
}

export const task020ExportRequestFoundationService = new Task020ExportRequestFoundationService();
