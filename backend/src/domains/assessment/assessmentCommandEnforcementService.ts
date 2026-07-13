import type {
  AssessmentCommandContext,
  AssessmentGovernedCommand,
} from './contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily, AssessmentPolicyDecision } from './contracts/assessmentPolicyContracts';
import type { ProjectionRole, ProjectionPolicyDecision } from './contracts/assessmentProjectionContracts';
import type { AssessmentIdempotencyResult } from './contracts/assessmentIdempotencyContracts';
import type { AssessmentConcurrencyResult } from './contracts/assessmentConcurrencyContracts';
import type { AssessmentPolicyRegistry } from './policies/assessmentPolicyRegistry';
import type { AssessmentIdempotencyService } from './idempotency/assessmentIdempotencyService';
import type { AssessmentAuditService } from './audit/assessmentAuditService';
import type { AssessmentOutboxService } from './outbox/assessmentOutboxService';
import { assertExpectedVersion } from './concurrency/assessmentConcurrencyService';
import { assertProjectionAllowed } from './projections/assessmentProjectionGuard';

export type EnforcementStage =
  | 'context_validated'
  | 'policy_checked'
  | 'projection_checked'
  | 'idempotency_checked'
  | 'version_checked'
  | 'audit_written'
  | 'outbox_published'
  | 'blocked';

export interface AssessmentEnforcementResult {
  ok: boolean;
  stage: EnforcementStage;
  blocked: boolean;
  safeMessage: string;
  reasonCode: string;
  policyDecisions?: AssessmentPolicyDecision[];
  projectionDecision?: ProjectionPolicyDecision;
  idempotencyResult?: AssessmentIdempotencyResult;
  concurrencyResult?: AssessmentConcurrencyResult;
  dryRun: boolean;
}

export interface AssessmentEnforcementServices {
  policyRegistry: AssessmentPolicyRegistry;
  idempotencyService: AssessmentIdempotencyService;
  auditService: AssessmentAuditService;
  outboxService?: AssessmentOutboxService;
}

function validateContext(context: AssessmentCommandContext): string | undefined {
  if (!context.schoolId) return 'schoolId is required';
  if (!context.actorId) return 'actorId is required';
  if (!context.actorRole) return 'actorRole is required';
  if (!context.correlationId) return 'correlationId is required';
  if (context.source === 'api' && !context.idempotencyKey) return 'idempotencyKey is required for api-source mutating commands';
  return undefined;
}

export class AssessmentCommandEnforcementService {
  constructor(
    private services: AssessmentEnforcementServices,
    private requireIdempotency = true,
    private requireAudit = true,
    private requireOutbox = false,
  ) {}

  async enforceGovernedCommand(
    command: AssessmentGovernedCommand,
    options?: {
      dryRun?: boolean;
      requiredPolicies?: AssessmentPolicyFamily[];
      projectionRole?: ProjectionRole;
      requireVersion?: boolean;
    },
  ): Promise<AssessmentEnforcementResult> {
    const dryRun = options?.dryRun ?? false;
    const context = command.context;

    const contextError = validateContext(context);
    if (contextError) {
      return {
        ok: false,
        stage: 'context_validated',
        blocked: true,
        safeMessage: contextError,
        reasonCode: 'invalid_command_context',
        dryRun,
      };
    }

    if (options?.requiredPolicies && options.requiredPolicies.length > 0) {
      const policyResult = this.services.policyRegistry.assertAllAllowed(options.requiredPolicies);
      if (!policyResult.ok) {
        return {
          ok: false,
          stage: 'policy_checked',
          blocked: true,
          safeMessage: `Policy block: ${policyResult.blocked.map(b => b.policyFamily).join(', ')}`,
          reasonCode: 'policy_blocked',
          policyDecisions: policyResult.decisions,
          dryRun,
        };
      }
    }

    if (options?.projectionRole) {
      const projectionDecision = this.assertProjection(options.projectionRole, command.body);
      if (!projectionDecision.allowed) {
        return {
          ok: false,
          stage: 'projection_checked',
          blocked: true,
          safeMessage: projectionDecision.safeMessage,
          reasonCode: projectionDecision.reasonCode,
          projectionDecision,
          dryRun,
        };
      }
    }

    if (this.requireIdempotency && context.idempotencyKey) {
      const idempotencyResult = await this.services.idempotencyService.checkOrCreate(
        context,
        command.commandType,
        command.commandFingerprint,
      );
      if (idempotencyResult.status === 'conflict') {
        return {
          ok: false,
          stage: 'idempotency_checked',
          blocked: true,
          safeMessage: idempotencyResult.safeMessage,
          reasonCode: idempotencyResult.reasonCode,
          idempotencyResult,
          dryRun,
        };
      }
    }

    if (options?.requireVersion && command.expectedVersion !== undefined) {
      const concurrencyResult = assertExpectedVersion({
        aggregateType: command.aggregateType ?? '',
        aggregateId: command.aggregateId ?? '',
        expectedVersion: command.expectedVersion,
        actualVersion: command.expectedVersion,
        commandId: command.context.correlationId,
        conflictReason: 'OK',
      });
      if (!concurrencyResult.ok) {
        return {
          ok: false,
          stage: 'version_checked',
          blocked: true,
          safeMessage: concurrencyResult.safeMessage,
          reasonCode: concurrencyResult.conflictReason,
          concurrencyResult,
          dryRun,
        };
      }
    }

    if (!dryRun && this.requireAudit) {
      const auditResult = await this.services.auditService.writeAuditEvent({
        eventType: 'assessment_command_executed',
        context,
        aggregateType: command.aggregateType ?? 'unknown',
        aggregateId: command.aggregateId ?? 'unknown',
        reasonCode: 'enforcement_passed',
        safeSummary: `Command ${command.commandType} enforced successfully`,
        metadata: { commandType: command.commandType },
      });

      if (!auditResult.ok) {
        return {
          ok: false,
          stage: 'audit_written',
          blocked: true,
          safeMessage: 'Audit write required but failed',
          reasonCode: 'audit_write_failed',
          dryRun,
        };
      }
    }

    if (!dryRun && this.requireOutbox && this.services.outboxService) {
      const outboxResult = await this.services.outboxService.publish({
        eventType: `${command.commandType}.executed`,
        schemaVersion: '1.0',
        context,
        aggregateType: command.aggregateType ?? 'unknown',
        aggregateId: command.aggregateId ?? 'unknown',
        payload: { commandType: command.commandType },
      });

      if (!outboxResult.ok) {
        return {
          ok: false,
          stage: 'outbox_published',
          blocked: true,
          safeMessage: 'Outbox write required but failed',
          reasonCode: 'outbox_write_failed',
          dryRun,
        };
      }
    }

    return {
      ok: true,
      stage: 'audit_written',
      blocked: false,
      safeMessage: 'Governed command enforcement passed',
      reasonCode: 'enforcement_passed',
      dryRun,
    };
  }

  private assertProjection(role: ProjectionRole, body: unknown): ProjectionPolicyDecision {
    if (!body || typeof body !== 'object') {
      return {
        role,
        allowed: true,
        forbiddenFieldsFound: [],
        strippedFields: [],
        safeMessage: 'No body to project',
        reasonCode: 'projection_not_needed',
      };
    }
    return assertProjectionAllowed(role, body as Record<string, unknown>);
  }
}
