import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import {
  RecoveryOutcomeActionAuditEvent,
  RecoveryOutcomeActionAuditRepository,
  RecoveryOutcomeActionIdempotencyRepository,
} from '../contracts/recoveryOutcomeActionRepositoryContracts';
import {
  RecoveryOutcomeActionReadiness,
  RecoveryOutcomeActionReadinessStatus,
} from '../contracts/recoveryOutcomeActionReadinessContracts';
import {
  PrismaRecoveryOutcomeActionAuditRepository,
  PrismaRecoveryOutcomeActionIdempotencyRepository,
  PrismaRecoveryOutcomeActionReadinessRepository,
} from './prismaRecoveryOutcomeActionRepositories';

/**
 * R8-G.2 atomic coordinator for the Action Readiness durable chain.
 *
 * Scope is deliberately narrow: Action Readiness mutation + Package-20
 * idempotency + Package-20 audit inside ONE Prisma transaction. No generic
 * transaction framework, no locks, no event bus. PostgreSQL uniqueness on
 * (schoolId, operation, idempotencyKey) wins concurrency races.
 *
 * Idempotency semantics:
 * - new key: create in_progress claim, mutate resource, write audit,
 *   mark completed, commit;
 * - existing key + same operation/requestHash + completed: deterministic
 *   duplicate referencing the original resource (no second mutation);
 * - existing key + different operation/requestHash: explicit conflict;
 * - existing in_progress key: fail closed, no second mutation.
 */

export const R8G2_CREATE_OPERATION = 'createActionReadiness';
export const R8G2_TRANSITION_OPERATIONS: Record<RecoveryOutcomeActionReadinessStatus, string> = {
  draft: 'createActionReadiness',
  review_ready: 'markActionReadinessReviewReady',
  approved_for_future_use: 'approveActionReadinessForFutureUse',
  suppressed: 'suppressActionReadiness',
  blocked: 'blockActionReadiness',
  voided: 'voidActionReadiness',
};

export class RecoveryOutcomeActionIdempotencyConflictError extends Error {
  readonly status = 409;
  readonly code = 'IDEMPOTENCY_CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'RecoveryOutcomeActionIdempotencyConflictError';
  }
}

export class RecoveryOutcomeActionIdempotencyInProgressError extends Error {
  readonly status = 409;
  readonly code = 'IDEMPOTENCY_IN_PROGRESS';
  constructor(message: string) {
    super(message);
    this.name = 'RecoveryOutcomeActionIdempotencyInProgressError';
  }
}

export class RecoveryOutcomeActionReadinessNotFoundError extends Error {
  readonly status = 404;
  readonly code = 'ACTION_READINESS_NOT_FOUND';
  constructor(message = 'Action readiness not found') {
    super(message);
    this.name = 'RecoveryOutcomeActionReadinessNotFoundError';
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002';
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Established Package-20 request hash semantics: sha256 over the operation
 * plus the canonical mutation input. For status transitions the canonical
 * input includes the target resource ID.
 */
export function buildRecoveryOutcomeActionRequestHash(
  operation: string,
  canonicalInput: Record<string, unknown>,
): string {
  return createHash('sha256').update(stableStringify({ operation, input: canonicalInput })).digest('hex');
}

export interface AtomicReadinessAuditInput {
  auditEventId?: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  actorId: string;
  actorRole: string;
  correlationId?: string;
  actionReadinessId?: string;
}

export interface AtomicReadinessCreateParams {
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  canonicalInput: Record<string, unknown>;
  readiness: RecoveryOutcomeActionReadiness;
  audit: AtomicReadinessAuditInput;
}

export interface AtomicReadinessTransitionParams {
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  readinessId: string;
  targetStatus: RecoveryOutcomeActionReadinessStatus;
  statusTimestampField:
    | 'reviewReadyAt'
    | 'approvedForFutureUseAt'
    | 'suppressedAt'
    | 'blockedAt'
    | 'voidedAt';
  canonicalInput: Record<string, unknown>;
  audit: AtomicReadinessAuditInput;
}

export interface AtomicReadinessResult {
  duplicate: boolean;
  readiness: RecoveryOutcomeActionReadiness;
  resourceId: string;
}

function toAuditEvent(schoolId: string, audit: AtomicReadinessAuditInput): RecoveryOutcomeActionAuditEvent {
  return {
    auditEventId: audit.auditEventId && audit.auditEventId.trim() !== '' ? audit.auditEventId : randomUUID(),
    schoolId,
    actionReadinessId: audit.actionReadinessId,
    actorId: audit.actorId,
    actorRole: audit.actorRole,
    eventType: audit.eventType,
    decision: audit.decision,
    safeSummary: audit.safeSummary,
    reasonCodesJson: {},
    metadataJson: {},
    correlationId: audit.correlationId,
    createdAt: new Date(),
  };
}

export class PrismaRecoveryOutcomeActionReadinessAtomicStore {
  constructor(private prisma: PrismaClient) {}

  async createWithGuards(params: AtomicReadinessCreateParams): Promise<AtomicReadinessResult> {
    const requestHash = buildRecoveryOutcomeActionRequestHash(params.operation, params.canonicalInput);
    try {
      return await this.prisma.$transaction(async (tx: unknown) => {
        const txClient = tx as PrismaClient;
        const readinessRepo = new PrismaRecoveryOutcomeActionReadinessRepository(txClient);
        const auditRepo: RecoveryOutcomeActionAuditRepository = new PrismaRecoveryOutcomeActionAuditRepository(txClient);
        const idempotencyRepo: RecoveryOutcomeActionIdempotencyRepository =
          new PrismaRecoveryOutcomeActionIdempotencyRepository(txClient);

        const existing = await idempotencyRepo.getByKey(params.schoolId, params.idempotencyKey);
        if (existing) {
          return await this.resolveExistingClaim(txClient, readinessRepo, existing, params.operation, requestHash);
        }

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

        const created = await readinessRepo.create(params.readiness);
        await auditRepo.create(
          toAuditEvent(params.schoolId, { ...params.audit, actionReadinessId: created.actionReadinessId }),
        );
        await idempotencyRepo.markCompleted(claimId, 'RecoveryOutcomeActionReadiness', created.actionReadinessId);
        return { duplicate: false, readiness: created, resourceId: created.actionReadinessId };
      });
    } catch (err) {
      if (
        err instanceof RecoveryOutcomeActionIdempotencyConflictError &&
        err.message.startsWith('Concurrent idempotency claim race lost')
      ) {
        return await this.resolveRaceLoser(params.schoolId, params.idempotencyKey, params.operation, requestHash);
      }
      throw err;
    }
  }

  async transitionWithGuards(params: AtomicReadinessTransitionParams): Promise<AtomicReadinessResult> {
    const requestHash = buildRecoveryOutcomeActionRequestHash(params.operation, {
      ...params.canonicalInput,
      actionReadinessId: params.readinessId,
    });
    try {
      return await this.prisma.$transaction(async (tx: unknown) => {
        const txClient = tx as PrismaClient;
        const readinessRepo = new PrismaRecoveryOutcomeActionReadinessRepository(txClient);
        const auditRepo: RecoveryOutcomeActionAuditRepository = new PrismaRecoveryOutcomeActionAuditRepository(txClient);
        const idempotencyRepo: RecoveryOutcomeActionIdempotencyRepository =
          new PrismaRecoveryOutcomeActionIdempotencyRepository(txClient);

        const existing = await idempotencyRepo.getByKey(params.schoolId, params.idempotencyKey);
        if (existing) {
          return await this.resolveExistingClaim(txClient, readinessRepo, existing, params.operation, requestHash);
        }

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

        const now = new Date();
        const scoped = await txClient.recoveryOutcomeActionReadinessRecord.updateMany({
          where: { actionReadinessId: params.readinessId, schoolId: params.schoolId },
          data: {
            readinessStatus: params.targetStatus,
            [params.statusTimestampField]: now,
            updatedAt: now,
          } as never,
        });
        if (scoped.count === 0) {
          throw new RecoveryOutcomeActionReadinessNotFoundError();
        }
        const updated = await readinessRepo.getById(params.readinessId);
        if (!updated || updated.schoolId !== params.schoolId) {
          throw new RecoveryOutcomeActionReadinessNotFoundError();
        }
        await auditRepo.create(
          toAuditEvent(params.schoolId, { ...params.audit, actionReadinessId: updated.actionReadinessId }),
        );
        await idempotencyRepo.markCompleted(claimId, 'RecoveryOutcomeActionReadiness', updated.actionReadinessId);
        return { duplicate: false, readiness: updated, resourceId: updated.actionReadinessId };
      });
    } catch (err) {
      if (
        err instanceof RecoveryOutcomeActionIdempotencyConflictError &&
        err.message.startsWith('Concurrent idempotency claim race lost')
      ) {
        return await this.resolveRaceLoser(params.schoolId, params.idempotencyKey, params.operation, requestHash);
      }
      throw err;
    }
  }

  private async resolveExistingClaim(
    txClient: PrismaClient,
    readinessRepo: PrismaRecoveryOutcomeActionReadinessRepository,
    existing: { status: string; operation: string; requestHash: string; resourceId?: string },
    operation: string,
    requestHash: string,
  ): Promise<AtomicReadinessResult> {
    if (existing.status !== 'completed') {
      throw new RecoveryOutcomeActionIdempotencyInProgressError(
        'Idempotency key already in progress; refusing second mutation',
      );
    }
    if (existing.operation !== operation || existing.requestHash !== requestHash) {
      throw new RecoveryOutcomeActionIdempotencyConflictError(
        'Idempotency key reuse with different operation or request payload',
      );
    }
    if (!existing.resourceId) {
      throw new RecoveryOutcomeActionIdempotencyConflictError('Completed claim references no resource');
    }
    const resource = await readinessRepo.getById(existing.resourceId);
    if (!resource) {
      throw new RecoveryOutcomeActionIdempotencyConflictError('Completed claim references missing resource');
    }
    return { duplicate: true, readiness: resource, resourceId: resource.actionReadinessId };
  }

  private async resolveRaceLoser(
    schoolId: string,
    idempotencyKey: string,
    operation: string,
    requestHash: string,
  ): Promise<AtomicReadinessResult> {
    const idempotencyRepo = new PrismaRecoveryOutcomeActionIdempotencyRepository(this.prisma);
    const readinessRepo = new PrismaRecoveryOutcomeActionReadinessRepository(this.prisma);
    const existing = await idempotencyRepo.getByKey(schoolId, idempotencyKey);
    if (
      existing &&
      existing.status === 'completed' &&
      existing.operation === operation &&
      existing.requestHash === requestHash &&
      existing.resourceId
    ) {
      const resource = await readinessRepo.getById(existing.resourceId);
      if (resource) {
        return { duplicate: true, readiness: resource, resourceId: resource.actionReadinessId };
      }
    }
    throw new RecoveryOutcomeActionIdempotencyConflictError(
      'Idempotency key already claimed by a concurrent mutation',
    );
  }
}
