import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { MasteryState, MasteryChangeLog, MasteryTarget } from './probabilisticMasteryContracts';
import prisma from '../lib/prisma';

export interface AtomicUpdate {
  state: MasteryState;
  changeLog: MasteryChangeLog;
  evidenceId: string;
}

export interface MasteryRepository {
  saveState(state: MasteryState): Promise<void>;
  readState(target: MasteryTarget): Promise<MasteryState | null>;
  listStates(schoolId: string, learnerId: string): Promise<MasteryState[]>;
  saveChangeLog(log: MasteryChangeLog): Promise<void>;
  listChangeLogs(schoolId: string, learnerId: string, targetNodeId: string): Promise<MasteryChangeLog[]>;
  hasEvidenceBeenApplied(evidenceId: string): Promise<boolean>;
  recordEvidenceApplication(evidenceId: string, target: MasteryTarget): Promise<void>;
  resetForTest?(): void | Promise<void>;
  applyEvidenceAtomically(update: AtomicUpdate): Promise<boolean>;
  getAtomicSnapshot(target: MasteryTarget): Promise<{
    state: MasteryState | null;
    evidenceSeen: boolean;
  }>;
}

export type MasteryDbClient = typeof prisma;

const LIST_STATES_LIMIT = 500;
const LIST_CHANGE_LOGS_LIMIT = 200;

const VALID_TARGET_NODE_TYPES = new Set(['concept', 'skill', 'learning_objective']);
const VALID_VISIBLE_LABELS = new Set([
  'not_started',
  'introduced',
  'attempted',
  'developing',
  'near_mastery',
  'mastered',
  'needs_revisit',
]);

function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((entry) => typeof entry === 'string')) return null;
  return [...value];
}

/**
 * Fail-closed conversion: a durable canonical record that is corrupted or
 * incomplete must throw, never silently coerce into a plausible state.
 */
function recordToState(record: {
  schoolId: unknown;
  learnerId: unknown;
  targetNodeId: unknown;
  targetNodeType: unknown;
  curriculumVersionId: unknown;
  probabilityOfMastery: unknown;
  confidence: unknown;
  evidenceCount: unknown;
  lastEvidenceAt: unknown;
  decayRisk: unknown;
  misconceptionTags: unknown;
  independenceScore: unknown;
  hintDependencyScore: unknown;
  retentionScore: unknown;
  transferScore: unknown;
  visibleLabel: unknown;
  policyVersion: unknown;
  strategyId: unknown;
  strategyVersion: unknown;
  stateRevision: unknown;
  updatedAt: unknown;
  consecutiveMissCountSinceMastered: unknown;
}): MasteryState {
  const tags = toStringArray(record.misconceptionTags);
  const lastEvidenceAt =
    record.lastEvidenceAt === null || record.lastEvidenceAt === undefined
      ? null
      : parseDate(record.lastEvidenceAt);
  const updatedAt = parseDate(record.updatedAt);
  const corrupt = (field: string): Error =>
    new Error(`canonical mastery record corrupt: invalid ${field}`);
  if (typeof record.schoolId !== 'string') throw corrupt('schoolId');
  if (typeof record.learnerId !== 'string') throw corrupt('learnerId');
  if (typeof record.targetNodeId !== 'string') throw corrupt('targetNodeId');
  if (typeof record.targetNodeType !== 'string' || !VALID_TARGET_NODE_TYPES.has(record.targetNodeType)) {
    throw corrupt('targetNodeType');
  }
  if (typeof record.curriculumVersionId !== 'string') throw corrupt('curriculumVersionId');
  if (!isFiniteNumber(record.probabilityOfMastery)) throw corrupt('probabilityOfMastery');
  if (!isFiniteNumber(record.confidence)) throw corrupt('confidence');
  if (typeof record.evidenceCount !== 'number' || !Number.isInteger(record.evidenceCount)) {
    throw corrupt('evidenceCount');
  }
  if (record.lastEvidenceAt !== null && record.lastEvidenceAt !== undefined && lastEvidenceAt === null) {
    throw corrupt('lastEvidenceAt');
  }
  if (!isFiniteNumber(record.decayRisk)) throw corrupt('decayRisk');
  if (tags === null) throw corrupt('misconceptionTags');
  if (!isFiniteNumber(record.independenceScore)) throw corrupt('independenceScore');
  if (!isFiniteNumber(record.hintDependencyScore)) throw corrupt('hintDependencyScore');
  if (!isFiniteNumber(record.retentionScore)) throw corrupt('retentionScore');
  if (!isFiniteNumber(record.transferScore)) throw corrupt('transferScore');
  if (typeof record.visibleLabel !== 'string' || !VALID_VISIBLE_LABELS.has(record.visibleLabel)) {
    throw corrupt('visibleLabel');
  }
  if (typeof record.policyVersion !== 'string') throw corrupt('policyVersion');
  if (typeof record.strategyId !== 'string') throw corrupt('strategyId');
  if (typeof record.strategyVersion !== 'string') throw corrupt('strategyVersion');
  if (typeof record.stateRevision !== 'number' || !Number.isInteger(record.stateRevision)) {
    throw corrupt('stateRevision');
  }
  if (updatedAt === null) throw corrupt('updatedAt');
  if (
    typeof record.consecutiveMissCountSinceMastered !== 'number' ||
    !Number.isInteger(record.consecutiveMissCountSinceMastered)
  ) {
    throw corrupt('consecutiveMissCountSinceMastered');
  }
  return {
    schoolId: record.schoolId,
    learnerId: record.learnerId,
    targetNodeId: record.targetNodeId,
    targetNodeType: record.targetNodeType as MasteryState['targetNodeType'],
    curriculumVersionId: record.curriculumVersionId,
    probabilityOfMastery: record.probabilityOfMastery,
    confidence: record.confidence,
    evidenceCount: record.evidenceCount,
    lastEvidenceAt,
    decayRisk: record.decayRisk,
    misconceptionTags: tags,
    independenceScore: record.independenceScore,
    hintDependencyScore: record.hintDependencyScore,
    retentionScore: record.retentionScore,
    transferScore: record.transferScore,
    visibleLabel: record.visibleLabel as MasteryState['visibleLabel'],
    policyVersion: record.policyVersion,
    strategyId: record.strategyId,
    strategyVersion: record.strategyVersion,
    stateRevision: record.stateRevision,
    updatedAt,
    consecutiveMissCountSinceMastered: record.consecutiveMissCountSinceMastered,
  };
}

function stateToRecordData(state: MasteryState): {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: string;
  curriculumVersionId: string;
  probabilityOfMastery: number;
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: Date | null;
  decayRisk: number;
  misconceptionTags: string[];
  independenceScore: number;
  hintDependencyScore: number;
  retentionScore: number;
  transferScore: number;
  visibleLabel: string;
  policyVersion: string;
  strategyId: string;
  strategyVersion: string;
  stateRevision: number;
  consecutiveMissCountSinceMastered: number;
  updatedAt: Date;
} {
  return {
    schoolId: state.schoolId,
    learnerId: state.learnerId,
    targetNodeId: state.targetNodeId,
    targetNodeType: state.targetNodeType,
    curriculumVersionId: state.curriculumVersionId,
    probabilityOfMastery: state.probabilityOfMastery,
    confidence: state.confidence,
    evidenceCount: state.evidenceCount,
    lastEvidenceAt: state.lastEvidenceAt ? new Date(state.lastEvidenceAt) : null,
    decayRisk: state.decayRisk,
    misconceptionTags: [...state.misconceptionTags],
    independenceScore: state.independenceScore,
    hintDependencyScore: state.hintDependencyScore,
    retentionScore: state.retentionScore,
    transferScore: state.transferScore,
    visibleLabel: state.visibleLabel,
    policyVersion: state.policyVersion,
    strategyId: state.strategyId,
    strategyVersion: state.strategyVersion,
    stateRevision: state.stateRevision,
    consecutiveMissCountSinceMastered: state.consecutiveMissCountSinceMastered,
    updatedAt: new Date(state.updatedAt),
  };
}

function recordToChangeLog(record: {
  id: unknown;
  schoolId: unknown;
  learnerId: unknown;
  targetNodeId: unknown;
  targetNodeType: unknown;
  curriculumVersionId: unknown;
  previousState: unknown;
  newState: unknown;
  contributingEvidenceIds: unknown;
  policyVersion: unknown;
  strategyId: unknown;
  strategyVersion: unknown;
  reasonCodes: unknown;
  correlationId: unknown;
  createdAt: unknown;
}): MasteryChangeLog {
  const corrupt = (field: string): Error =>
    new Error(`canonical mastery change record corrupt: invalid ${field}`);
  if (typeof record.id !== 'string') throw corrupt('id');
  if (typeof record.schoolId !== 'string') throw corrupt('schoolId');
  if (typeof record.learnerId !== 'string') throw corrupt('learnerId');
  if (typeof record.targetNodeId !== 'string') throw corrupt('targetNodeId');
  if (typeof record.policyVersion !== 'string') throw corrupt('policyVersion');
  if (typeof record.strategyId !== 'string') throw corrupt('strategyId');
  const evidenceIds = toStringArray(record.contributingEvidenceIds);
  if (evidenceIds === null) throw corrupt('contributingEvidenceIds');
  const reasonCodes = toStringArray(record.reasonCodes);
  if (reasonCodes === null) throw corrupt('reasonCodes');
  const createdAt = parseDate(record.createdAt);
  if (createdAt === null) throw corrupt('createdAt');
  if (record.newState === null || record.newState === undefined || typeof record.newState !== 'object') {
    throw corrupt('newState');
  }
  const newState = recordToState(record.newState as Parameters<typeof recordToState>[0]);
  const previousState =
    record.previousState === null || record.previousState === undefined
      ? null
      : recordToState(record.previousState as Parameters<typeof recordToState>[0]);
  return {
    changeId: record.id,
    schoolId: record.schoolId,
    learnerId: record.learnerId,
    targetNodeId: record.targetNodeId,
    previousState,
    newState,
    contributingEvidenceIds: evidenceIds,
    policyVersion: record.policyVersion,
    strategyId: record.strategyId,
    reasonCodes: reasonCodes as MasteryChangeLog['reasonCodes'],
    createdAt,
    correlationId: typeof record.correlationId === 'string' ? record.correlationId : '',
  };
}

function identityOf(target: MasteryTarget): {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: string;
  curriculumVersionId: string;
} {
  return {
    schoolId: target.schoolId,
    learnerId: target.learnerId,
    targetNodeId: target.targetNodeId,
    targetNodeType: target.targetNodeType,
    curriculumVersionId: target.curriculumVersionId,
  };
}

function identityOfState(state: MasteryState): {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: string;
  curriculumVersionId: string;
} {
  return {
    schoolId: state.schoolId,
    learnerId: state.learnerId,
    targetNodeId: state.targetNodeId,
    targetNodeType: state.targetNodeType,
    curriculumVersionId: state.curriculumVersionId,
  };
}

class AtomicAbort extends Error {
  constructor() {
    super('canonical mastery atomic commit aborted');
    this.name = 'AtomicAbort';
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export class PrismaMasteryRepository implements MasteryRepository {
  private readonly db: MasteryDbClient;

  constructor(db: MasteryDbClient = prisma) {
    this.db = db;
  }

  async saveState(state: MasteryState): Promise<void> {
    const data = stateToRecordData(state);
    await this.db.canonicalMasteryStateRecord.upsert({
      where: {
        schoolId_learnerId_targetNodeId_targetNodeType_curriculumVersionId: identityOfState(state),
      },
      create: { id: newId('cmst'), ...data },
      update: { ...data },
    });
  }

  async readState(target: MasteryTarget): Promise<MasteryState | null> {
    const record = await this.db.canonicalMasteryStateRecord.findUnique({
      where: {
        schoolId_learnerId_targetNodeId_targetNodeType_curriculumVersionId: identityOf(target),
      },
    });
    if (!record) return null;
    return recordToState(record);
  }

  async listStates(schoolId: string, learnerId: string): Promise<MasteryState[]> {
    const records = await this.db.canonicalMasteryStateRecord.findMany({
      where: { schoolId, learnerId },
      orderBy: { updatedAt: 'desc' },
      take: LIST_STATES_LIMIT,
    });
    return records.map((record) => recordToState(record));
  }

  async saveChangeLog(log: MasteryChangeLog): Promise<void> {
    await this.db.canonicalMasteryChangeRecord.create({
      data: {
        id: log.changeId,
        schoolId: log.schoolId,
        learnerId: log.learnerId,
        targetNodeId: log.targetNodeId,
        targetNodeType: log.newState.targetNodeType,
        curriculumVersionId: log.newState.curriculumVersionId,
        previousState: log.previousState
          ? (stateToRecordData(log.previousState) as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        newState: stateToRecordData(log.newState) as unknown as Prisma.InputJsonValue,
        contributingEvidenceIds: [...log.contributingEvidenceIds],
        policyVersion: log.policyVersion,
        strategyId: log.strategyId,
        strategyVersion: log.newState.strategyVersion,
        reasonCodes: [...log.reasonCodes],
        correlationId: log.correlationId,
      },
    });
  }

  async listChangeLogs(
    schoolId: string,
    learnerId: string,
    targetNodeId: string,
  ): Promise<MasteryChangeLog[]> {
    const records = await this.db.canonicalMasteryChangeRecord.findMany({
      where: { schoolId, learnerId, targetNodeId },
      orderBy: { createdAt: 'asc' },
      take: LIST_CHANGE_LOGS_LIMIT,
    });
    return records.map((record) =>
      recordToChangeLog({
        ...record,
        previousState: record.previousState as unknown,
        newState: record.newState as unknown,
      }),
    );
  }

  async hasEvidenceBeenApplied(evidenceId: string): Promise<boolean> {
    const record = await this.db.canonicalMasteryEvidenceApplicationRecord.findUnique({
      where: { evidenceId },
    });
    return record !== null;
  }

  async recordEvidenceApplication(evidenceId: string, target: MasteryTarget): Promise<void> {
    try {
      await this.db.canonicalMasteryEvidenceApplicationRecord.create({
        data: {
          id: newId('cmea'),
          evidenceId,
          ...identityOf(target),
        },
      });
    } catch (error) {
      // Duplicate evidenceId means already applied: safe non-commit, never an exception.
      if (isUniqueViolation(error)) return;
      throw error;
    }
  }

  async resetForTest(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('canonicalMasteryRepository.resetForTest refuses outside NODE_ENV=test');
    }
    await this.db.canonicalMasteryChangeRecord.deleteMany({});
    await this.db.canonicalMasteryEvidenceApplicationRecord.deleteMany({});
    await this.db.canonicalMasteryStateRecord.deleteMany({});
  }

  async applyEvidenceAtomically(update: AtomicUpdate): Promise<boolean> {
    const state = update.state;
    const expectedPreviousRevision = state.stateRevision - 1;
    if (!Number.isInteger(state.stateRevision) || state.stateRevision < 1) {
      return false;
    }
    const targetIdentity = identityOfState(state);
    try {
      await this.db.$transaction(async (tx) => {
        // 1. Claim the evidence idempotency receipt first.
        const existingClaim = await tx.canonicalMasteryEvidenceApplicationRecord.findUnique({
          where: { evidenceId: update.evidenceId },
        });
        if (existingClaim) throw new AtomicAbort();
        try {
          await tx.canonicalMasteryEvidenceApplicationRecord.create({
            data: {
              id: newId('cmea'),
              evidenceId: update.evidenceId,
              ...targetIdentity,
            },
          });
        } catch (error) {
          // Same-evidence concurrency loser: exactly one receipt may exist.
          throw new AtomicAbort();
        }

        // 2 + 3. Verify expected revision, then write canonical state.
        if (expectedPreviousRevision <= 0) {
          if (state.stateRevision !== 1) throw new AtomicAbort();
          try {
            await tx.canonicalMasteryStateRecord.create({
              data: { id: newId('cmst'), ...stateToRecordData(state) },
            });
          } catch (error) {
            // Concurrent first writer already inserted this canonical target.
            throw new AtomicAbort();
          }
        } else {
          const updated = await tx.canonicalMasteryStateRecord.updateMany({
            where: { ...targetIdentity, stateRevision: expectedPreviousRevision },
            data: { ...stateToRecordData(state) },
          });
          if (updated.count === 0) throw new AtomicAbort();
        }

        // 4. Append the canonical change record inside the same transaction.
        const log = update.changeLog;
        await tx.canonicalMasteryChangeRecord.create({
          data: {
            id: log.changeId,
            schoolId: log.schoolId,
            learnerId: log.learnerId,
            targetNodeId: log.targetNodeId,
            targetNodeType: state.targetNodeType,
            curriculumVersionId: state.curriculumVersionId,
            previousState: log.previousState
              ? (stateToRecordData(log.previousState) as unknown as Prisma.InputJsonValue)
              : Prisma.DbNull,
            newState: stateToRecordData(state) as unknown as Prisma.InputJsonValue,
            contributingEvidenceIds: [...log.contributingEvidenceIds],
            policyVersion: log.policyVersion,
            strategyId: log.strategyId,
            strategyVersion: state.strategyVersion,
            reasonCodes: [...log.reasonCodes],
            correlationId: log.correlationId,
          },
        });
      });
      return true;
    } catch (error) {
      if (error instanceof AtomicAbort || isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async getAtomicSnapshot(target: MasteryTarget): Promise<{
    state: MasteryState | null;
    evidenceSeen: boolean;
  }> {
    const state = await this.readState(target);
    const receipt = await this.db.canonicalMasteryEvidenceApplicationRecord.findFirst({
      where: identityOf(target),
      select: { id: true },
    });
    return { state, evidenceSeen: receipt !== null };
  }
}

/**
 * TEST / FIXTURE ONLY.
 *
 * In-memory MasteryRepository for isolated unit tests. Never the production
 * owner: all state is process-local and lost on restart.
 */
export class InMemoryMasteryRepository implements MasteryRepository {
  private readonly states = new Map<string, MasteryState>();
  private readonly changeLogs: MasteryChangeLog[] = [];
  private readonly appliedEvidence = new Map<string, MasteryTarget>();

  private static stateKey(target: {
    schoolId: string;
    learnerId: string;
    targetNodeId: string;
    targetNodeType: string;
    curriculumVersionId: string;
  }): string {
    return [
      target.schoolId,
      target.learnerId,
      target.targetNodeId,
      target.targetNodeType,
      target.curriculumVersionId,
    ].join('|');
  }

  private cloneState(state: MasteryState): MasteryState {
    return {
      ...state,
      misconceptionTags: [...state.misconceptionTags],
      lastEvidenceAt: state.lastEvidenceAt ? new Date(state.lastEvidenceAt) : null,
      updatedAt: new Date(state.updatedAt),
    };
  }

  async saveState(state: MasteryState): Promise<void> {
    InMemoryMasteryRepository.assertValidState(state);
    this.states.set(InMemoryMasteryRepository.stateKey(state), this.cloneState(state));
  }

  async readState(target: MasteryTarget): Promise<MasteryState | null> {
    const stored = this.states.get(InMemoryMasteryRepository.stateKey(target));
    return stored ? this.cloneState(stored) : null;
  }

  async listStates(schoolId: string, learnerId: string): Promise<MasteryState[]> {
    return [...this.states.values()]
      .filter((state) => state.schoolId === schoolId && state.learnerId === learnerId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, LIST_STATES_LIMIT)
      .map((state) => this.cloneState(state));
  }

  async saveChangeLog(log: MasteryChangeLog): Promise<void> {
    this.changeLogs.push({
      ...log,
      contributingEvidenceIds: [...log.contributingEvidenceIds],
      reasonCodes: [...log.reasonCodes],
      previousState: log.previousState ? this.cloneState(log.previousState) : null,
      newState: this.cloneState(log.newState),
      createdAt: new Date(log.createdAt),
    });
  }

  async listChangeLogs(
    schoolId: string,
    learnerId: string,
    targetNodeId: string,
  ): Promise<MasteryChangeLog[]> {
    return this.changeLogs
      .filter(
        (log) =>
          log.schoolId === schoolId &&
          log.learnerId === learnerId &&
          log.targetNodeId === targetNodeId,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, LIST_CHANGE_LOGS_LIMIT);
  }

  async hasEvidenceBeenApplied(evidenceId: string): Promise<boolean> {
    return this.appliedEvidence.has(evidenceId);
  }

  async recordEvidenceApplication(evidenceId: string, target: MasteryTarget): Promise<void> {
    if (!this.appliedEvidence.has(evidenceId)) {
      this.appliedEvidence.set(evidenceId, { ...target });
    }
  }

  resetForTest(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('InMemoryMasteryRepository.resetForTest refuses outside NODE_ENV=test');
    }
    this.states.clear();
    this.changeLogs.length = 0;
    this.appliedEvidence.clear();
  }

  async applyEvidenceAtomically(update: AtomicUpdate): Promise<boolean> {
    if (this.appliedEvidence.has(update.evidenceId)) return false;
    InMemoryMasteryRepository.assertValidState(update.state);
    const key = InMemoryMasteryRepository.stateKey(update.state);
    const stored = this.states.get(key);
    const expectedPreviousRevision = update.state.stateRevision - 1;
    if (expectedPreviousRevision <= 0) {
      if (update.state.stateRevision !== 1 || stored) return false;
    } else if (!stored || stored.stateRevision !== expectedPreviousRevision) {
      return false;
    }
    this.appliedEvidence.set(update.evidenceId, {
      schoolId: update.state.schoolId,
      learnerId: update.state.learnerId,
      targetNodeId: update.state.targetNodeId,
      targetNodeType: update.state.targetNodeType,
      curriculumVersionId: update.state.curriculumVersionId,
    });
    this.states.set(key, this.cloneState(update.state));
    await this.saveChangeLog(update.changeLog);
    return true;
  }

  async getAtomicSnapshot(target: MasteryTarget): Promise<{
    state: MasteryState | null;
    evidenceSeen: boolean;
  }> {
    const state = await this.readState(target);
    const key = InMemoryMasteryRepository.stateKey(target);
    const evidenceSeen = [...this.appliedEvidence.values()].some(
      (applied) => InMemoryMasteryRepository.stateKey(applied) === key,
    );
    return { state, evidenceSeen };
  }

  private static assertValidState(state: MasteryState): void {
    recordToState({ ...state });
  }
}

/**
 * Durable production owner for canonical Probabilistic Mastery.
 * R7.1 creates this owner; R7.2 wires Revision, Practice, Daily Objectives
 * and Learning Intelligence callers to it.
 */
export const canonicalMasteryRepository = new PrismaMasteryRepository(prisma);
