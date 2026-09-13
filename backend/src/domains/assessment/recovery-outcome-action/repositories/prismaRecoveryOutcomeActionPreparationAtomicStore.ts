import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  RecoveryOutcomeActionAuditEvent,
  RecoveryOutcomeActionAuditRepository,
  RecoveryOutcomeActionIdempotencyRepository,
} from '../contracts/recoveryOutcomeActionRepositoryContracts';
import {
  PrismaRecoveryOutcomeActionAuditRepository,
  PrismaRecoveryOutcomeActionIdempotencyRepository,
} from './prismaRecoveryOutcomeActionRepositories';
import {
  buildRecoveryOutcomeActionRequestHash,
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
} from './prismaRecoveryOutcomeActionReadinessAtomicStore';

// R8-G.3B-A re-exports the accepted R8-G.2 idempotency primitives so Package-20
// services catch the SAME error classes the preparation atomic store throws.
export {
  buildRecoveryOutcomeActionRequestHash,
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
};

/**
 * R8-G.3B-A Package-20 preparation atomic store.
 *
 * One small production primitive (NOT a generic UnitOfWork): coordinates
 * { resource mutation, Package-20 audit event, Package-20 idempotency claim }
 * for the five target draft/bundle families inside ONE Prisma transaction.
 *
 * Reuses the accepted R8-G.2 idempotency primitives (request hash, conflict
 * and in-progress errors) and the existing UNIQUE(schoolId, idempotencyKey)
 * constraint as the concurrency lock. No process locks, no Redis.
 */

export type Package20ResourceType =
  | 'RecoveryOutcomeActionBundle'
  | 'RecoveryContinuationActionDraft'
  | 'RecoveryIntensificationActionDraft'
  | 'RecoveryPauseActionDraft'
  | 'RecoveryClosureActionDraft';

export interface Package20PreparationAuditInput {
  eventType: string;
  decision: string;
  safeSummary: string;
  actorId: string;
  actorRole: string;
  correlationId?: string;
}

export interface Package20MutateWithGuardsParams<TResource> {
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  canonicalInput: Record<string, unknown>;
  resourceType: Package20ResourceType;

  /** Must perform exactly the resource mutation inside the transaction. */
  mutate: (tx: PrismaClient) => Promise<{ resource: TResource; resourceId: string }>;
  /** Deterministic replay load for a completed claim. */
  load: (tx: PrismaClient, resourceId: string) => Promise<TResource | null>;
  /** Optional resource ref written onto the audit row. */
  auditResourceRef?: Record<string, string>;
  audit: Package20PreparationAuditInput;
}

export interface Package20MutateWithGuardsResult<TResource> {
  duplicate: boolean;
  resource: TResource;
  resourceId: string;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002';
}

function toAuditEvent(
  schoolId: string,
  audit: Package20PreparationAuditInput,
  refs: Record<string, string> | undefined,
): RecoveryOutcomeActionAuditEvent {
  return {
    auditEventId: randomUUID(),
    schoolId,
    actorId: audit.actorId,
    actorRole: audit.actorRole,
    eventType: audit.eventType,
    decision: audit.decision,
    safeSummary: audit.safeSummary,
    reasonCodesJson: {},
    metadataJson: {},
    requestId: audit.correlationId,
    correlationId: audit.correlationId,
    ...(refs?.actionBundleId ? { actionBundleId: refs.actionBundleId } : {}),
    ...(refs?.continuationActionDraftId ? { continuationActionDraftId: refs.continuationActionDraftId } : {}),
    ...(refs?.intensificationActionDraftId ? { intensificationActionDraftId: refs.intensificationActionDraftId } : {}),
    ...(refs?.pauseActionDraftId ? { pauseActionDraftId: refs.pauseActionDraftId } : {}),
    ...(refs?.closureActionDraftId ? { closureActionDraftId: refs.closureActionDraftId } : {}),
    createdAt: new Date(),
  };
}

export class PrismaRecoveryOutcomeActionPreparationAtomicStore {
  constructor(private prisma: PrismaClient) {}

  async mutateWithGuards<TResource>(
    params: Package20MutateWithGuardsParams<TResource>,
  ): Promise<Package20MutateWithGuardsResult<TResource>> {
    const requestHash = buildRecoveryOutcomeActionRequestHash(params.operation, params.canonicalInput);
    try {
      return await this.prisma.$transaction(async (tx: unknown) => {
        const txClient = tx as PrismaClient;
        const auditRepo: RecoveryOutcomeActionAuditRepository = new PrismaRecoveryOutcomeActionAuditRepository(txClient);
        const idempotencyRepo: RecoveryOutcomeActionIdempotencyRepository =
          new PrismaRecoveryOutcomeActionIdempotencyRepository(txClient);

        // 1-2. existing claim: duplicate / conflict / in-progress resolution
        const existing = await idempotencyRepo.getByKey(params.schoolId, params.idempotencyKey);
        if (existing) {
          return await this.resolveExistingClaim(txClient, params, existing, requestHash);
        }

        // 3. create in_progress claim; UNIQUE(schoolId, idempotencyKey) is the lock
        let claimId: string;
        try {
          const claim = await idempotencyRepo.create({
            idempotencyId: randomUUID(),
            schoolId: params.schoolId,
            operation: params.operation,
            idempotencyKey: params.idempotencyKey,
            requestHash,
            status: 'in_progress',
            createdAt: new Date(),
          });
          claimId = claim.idempotencyId;
        } catch (err) {
          if (isUniqueViolation(err)) {
            throw new RecoveryOutcomeActionIdempotencyConflictError(
              'Concurrent idempotency claim race lost; retry resolves deterministically',
            );
          }
          throw err;
        }

        // 4. resource mutation (includes in-transaction tenant verification)
        const { resource, resourceId } = await params.mutate(txClient);

        // 5. Package-20 audit event
        await auditRepo.create(
          toAuditEvent(params.schoolId, params.audit, {
            ...params.auditResourceRef,
            [auditRefFieldFor(params.resourceType)]: resourceId,
          }),
        );

        // 6. mark claim completed
        await idempotencyRepo.markCompleted(claimId, params.resourceType, resourceId);

        // 7. commit
        return { duplicate: false, resource, resourceId };
      });
    } catch (err) {
      if (
        err instanceof RecoveryOutcomeActionIdempotencyConflictError &&
        err.message.startsWith('Concurrent idempotency claim race lost')
      ) {
        return await this.resolveRaceLoser(params, requestHash);
      }
      throw err;
    }
  }

  private async resolveExistingClaim<TResource>(
    txClient: PrismaClient,
    params: Package20MutateWithGuardsParams<TResource>,
    existing: { status: string; operation: string; requestHash: string; resourceId?: string },
    requestHash: string,
  ): Promise<Package20MutateWithGuardsResult<TResource>> {
    if (existing.status !== 'completed') {
      throw new RecoveryOutcomeActionIdempotencyInProgressError(
        'Idempotency key already in progress; refusing second mutation',
      );
    }
    if (existing.operation !== params.operation || existing.requestHash !== requestHash) {
      throw new RecoveryOutcomeActionIdempotencyConflictError(
        'Idempotency key reuse with different operation or request payload',
      );
    }
    if (!existing.resourceId) {
      throw new RecoveryOutcomeActionIdempotencyConflictError('Completed claim references no resource');
    }
    const resource = await params.load(txClient, existing.resourceId);
    if (!resource) {
      throw new RecoveryOutcomeActionIdempotencyConflictError('Completed claim references missing resource');
    }
    return { duplicate: true, resource, resourceId: existing.resourceId };
  }

  private async resolveRaceLoser<TResource>(
    params: Package20MutateWithGuardsParams<TResource>,
    requestHash: string,
  ): Promise<Package20MutateWithGuardsResult<TResource>> {
    const idempotencyRepo = new PrismaRecoveryOutcomeActionIdempotencyRepository(this.prisma);
    const existing = await idempotencyRepo.getByKey(params.schoolId, params.idempotencyKey);
    if (
      existing &&
      existing.status === 'completed' &&
      existing.operation === params.operation &&
      existing.requestHash === requestHash &&
      existing.resourceId
    ) {
      const resource = await params.load(this.prisma, existing.resourceId);
      if (resource) {
        return { duplicate: true, resource, resourceId: existing.resourceId };
      }
    }
    throw new RecoveryOutcomeActionIdempotencyConflictError(
      'Idempotency key already claimed by a concurrent mutation',
    );
  }
}

function auditRefFieldFor(resourceType: Package20ResourceType): string {
  switch (resourceType) {
    case 'RecoveryOutcomeActionBundle':
      return 'actionBundleId';
    case 'RecoveryContinuationActionDraft':
      return 'continuationActionDraftId';
    case 'RecoveryIntensificationActionDraft':
      return 'intensificationActionDraftId';
    case 'RecoveryPauseActionDraft':
      return 'pauseActionDraftId';
    case 'RecoveryClosureActionDraft':
      return 'closureActionDraftId';
  }
}
