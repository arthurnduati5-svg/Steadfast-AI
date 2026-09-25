// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Turn Durability Service v1
// (STEADFAST-CHAT-BACKEND-DURABILITY-V1)
//
// Owns the durable logical turn (ChatTurn): idempotent resolution of
// sessionId + clientTurnId, deterministic request fingerprints,
// compare-and-set state transitions (ACCEPTED → GENERATING →
// COMPLETED | STOPPED | FAILED_RETRYABLE | REJECTED), retry bookkeeping,
// and the guarded short completion transaction. This is NOT a second
// learning-session/tutor-state/learner-memory owner: ChatTurn records only
// the lifecycle of one logical generation turn and its exact as-of-turn
// checkpoint reference.
// Never stores chain-of-thought, provider raw payloads, secrets, prompts
// or safeguarding raw content.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import prisma from '../lib/prisma';

// ── Public turn states (externally meaningful) ──

export const CHAT_TURN_STATES = {
  ACCEPTED: 'ACCEPTED',
  GENERATING: 'GENERATING',
  COMPLETED: 'COMPLETED',
  STOPPED: 'STOPPED',
  FAILED_RETRYABLE: 'FAILED_RETRYABLE',
  REJECTED: 'REJECTED',
} as const;

export type ChatTurnState = (typeof CHAT_TURN_STATES)[keyof typeof CHAT_TURN_STATES];

/**
 * Internal transient finalization state used only to make the completion
 * transaction race-safe. It never escapes to the frontend as a terminal
 * state: callers treat any non-GENERATING turn during finalization as
 * "not owned by this attempt".
 */
export const CHAT_TURN_FINALIZING = 'FINALIZING';

// ── Learner-turn lifecycle (server-authoritative ChatSession.learnerTurnCount) ──

export const NEW_LEARNER_TURN_LIMIT = 100;

export type ContinuationStage = 'normal' | 'soft' | 'strong' | 'required';

export function resolveContinuationStage(learnerTurnCount: number): ContinuationStage {
  const count = Number.isFinite(learnerTurnCount) ? Math.max(0, Math.floor(learnerTurnCount)) : 0;
  if (count >= 100) return 'required';
  if (count >= 95) return 'strong';
  if (count >= 80) return 'soft';
  return 'normal';
}

export interface ChatSessionLifecycleFields {
  learnerTurnCount: number;
  continuationStage: ContinuationStage;
  canSend: boolean;
  continuationAvailable: boolean;
}

export function deriveSessionLifecycleFields(learnerTurnCount: number): ChatSessionLifecycleFields {
  const count = Number.isFinite(learnerTurnCount) ? Math.max(0, Math.floor(learnerTurnCount)) : 0;
  const continuationStage = resolveContinuationStage(count);
  return {
    learnerTurnCount: count,
    continuationStage,
    // At count 99 the learner may still create turn 100; only after the
    // 100th learner message exists are NEW ordinary learner turns rejected.
    canSend: count < NEW_LEARNER_TURN_LIMIT,
    continuationAvailable: count >= 80,
  };
}

export function isContinuationRequired(learnerTurnCount: number): boolean {
  // The 100th learner message itself is allowed; a NEW learner turn after it is not.
  return Math.max(0, Math.floor(learnerTurnCount)) >= NEW_LEARNER_TURN_LIMIT;
}

// ── Identity helpers ──

export function generateServerClientTurnId(): string {
  return `srv-turn-${crypto.randomUUID()}`;
}

export function generateChatTurnAttemptId(): string {
  return `att-${crypto.randomUUID()}`;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Deterministic JSON rendering with recursively sorted object keys. */
export function stableStringify(value: unknown): string {
  const encode = (input: unknown): Json => {
    if (input === null || input === undefined) return null;
    if (typeof input === 'number') return Number.isFinite(input) ? input : String(input);
    if (typeof input === 'boolean' || typeof input === 'string') return input;
    if (Array.isArray(input)) return input.map(encode);
    if (typeof input === 'object') {
      const record = input as Record<string, unknown>;
      const keys = Object.keys(record).filter((key) => typeof record[key] !== 'function').sort();
      const out: { [key: string]: Json } = {};
      for (const key of keys) out[key] = encode(record[key]);
      return out;
    }
    return String(input);
  };
  return JSON.stringify(encode(value));
}

export interface ClientTurnFingerprintParts {
  /** The effective learner message text (already trimmed/defaults applied). */
  effectiveMessage: string;
  /** Attachment identity/content entries (name, kind, mimeType, content hash). */
  attachments?: Array<Record<string, unknown>>;
  editedMessageId?: string | null;
  tutorAction?: Record<string, unknown> | null;
  inputOrigin?: string | null;
  composerIntent?: string | null;
  linkedArtifactId?: string | null;
  focusMode?: boolean;
  examMode?: boolean;
  forceWebSearch?: boolean;
  includeVideos?: boolean;
  workspace?: Record<string, unknown> | null;
  /** Whether this request persists a new learner message. */
  persistsLearnerMessage: boolean;
}

/**
 * Deterministic SHA-256 fingerprint over the semantic learner action.
 * Excludes clientTurnId itself, latency telemetry turnId, timestamps,
 * transport (stream vs non-stream) and pure telemetry.
 * Equivalent stream/non-stream retries resolve to the same logical request.
 */
export function computeClientTurnFingerprint(parts: ClientTurnFingerprintParts): string {
  const attachmentIdentity = (parts.attachments || []).map((attachment) => ({
    name: typeof attachment?.name === 'string' ? attachment.name : '',
    kind: typeof attachment?.kind === 'string' ? attachment.kind : '',
    mimeType: typeof attachment?.mimeType === 'string' ? attachment.mimeType : '',
    contentHash:
      typeof attachment?.contentHash === 'string' && attachment.contentHash
        ? attachment.contentHash
        : crypto
            .createHash('sha256')
            .update(String(attachment?.text ?? attachment?.base64 ?? ''))
            .digest('hex'),
  }));

  const tutorActionSemantic = parts.tutorAction
    ? {
        id: parts.tutorAction.id,
        sourceMessageId: parts.tutorAction.sourceMessageId,
        selectedText: parts.tutorAction.selectedText,
        linkedArtifactId: parts.tutorAction.linkedArtifactId,
        inputOrigin: parts.tutorAction.inputOrigin,
        composerIntent: parts.tutorAction.composerIntent,
      }
    : null;

  return crypto
    .createHash('sha256')
    .update(
      stableStringify({
        version: 1,
        effectiveMessage: parts.effectiveMessage || '',
        attachments: attachmentIdentity,
        editedMessageId: parts.editedMessageId || null,
        tutorAction: tutorActionSemantic,
        inputOrigin: parts.inputOrigin || null,
        composerIntent: parts.composerIntent || null,
        linkedArtifactId: parts.linkedArtifactId || null,
        focusMode: parts.focusMode === true,
        examMode: parts.examMode === true,
        forceWebSearch: parts.forceWebSearch === true,
        includeVideos: parts.includeVideos === true,
        workspace: parts.workspace || null,
        persistsLearnerMessage: parts.persistsLearnerMessage,
      }),
    )
    .digest('hex');
}

// ── Lineage (branch / continue) request idempotency ──

export function computeLineageRequestFingerprint(parts: {
  parentSessionId: string;
  lineageType: 'branch' | 'continuation';
  branchedFromMessageId?: string | null;
}): string {
  return crypto
    .createHash('sha256')
    .update(
      stableStringify({
        version: 1,
        parentSessionId: parts.parentSessionId,
        lineageType: parts.lineageType,
        branchedFromMessageId: parts.branchedFromMessageId || null,
      }),
    )
    .digest('hex');
}

// ── ChatTurn data access / compare-and-set transitions ──

export interface ChatTurnDb {
  chatTurn: {
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    updateMany(args: any): Promise<{ count: number }>;
  };
  chatSession: {
    update(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
  };
  chatMessage: {
    create(args: any): Promise<any>;
  };
  $transaction?: (fn: (tx: any) => Promise<any>) => Promise<any>;
}

export const defaultChatTurnDb: ChatTurnDb = prisma as unknown as ChatTurnDb;

export async function findChatTurnByClientTurnId(
  db: ChatTurnDb,
  sessionId: string,
  clientTurnId: string,
): Promise<any | null> {
  if (!clientTurnId) return null;
  return db.chatTurn.findUnique({
    where: { sessionId_clientTurnId: { sessionId, clientTurnId } },
  });
}

/**
 * Locates the COMPLETED, non-invalidated ChatTurn that produced a given
 * assistant message (branch-point resolution).
 */
export async function findCompletedTurnForAssistantMessage(
  db: ChatTurnDb,
  sessionId: string,
  assistantMessageId: string,
): Promise<any | null> {
  return db.chatTurn.findFirst({
    where: {
      sessionId,
      status: CHAT_TURN_STATES.COMPLETED,
      assistantMessageId,
      invalidatedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Latest accepted exact completed-turn checkpoint for continuation.
 */
export async function findLatestExactCompletedTurn(
  db: ChatTurnDb,
  sessionId: string,
): Promise<any | null> {
  return db.chatTurn.findFirst({
    where: {
      sessionId,
      status: CHAT_TURN_STATES.COMPLETED,
      invalidatedAt: null,
      checkpointKind: 'exact',
      NOT: { checkpoint: null },
    },
    orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export interface CreateAcceptedChatTurnInput {
  sessionId: string;
  clientTurnId: string;
  requestFingerprint: string;
  assistantMessageNumber: number;
}

/**
 * Creates the durable turn row in ACCEPTED state with its already-reserved
 * assistant slot. Duplicate (sessionId, clientTurnId) is rejected by the
 * database unique invariant; callers resolve conflicts through
 * findChatTurnByClientTurnId before calling this.
 */
export async function createAcceptedChatTurn(
  db: ChatTurnDb,
  input: CreateAcceptedChatTurnInput,
): Promise<any> {
  return db.chatTurn.create({
    data: {
      sessionId: input.sessionId,
      clientTurnId: input.clientTurnId,
      requestFingerprint: input.requestFingerprint,
      status: CHAT_TURN_STATES.ACCEPTED,
      assistantMessageNumber: input.assistantMessageNumber,
    },
  });
}

/**
 * §8.7 ACCEPTED recovery: conditional claim so only one caller can move a
 * turn into GENERATING. Returns true when this caller owns execution.
 */
export async function claimChatTurnForGeneration(
  db: ChatTurnDb,
  turnId: string,
  attemptId: string,
): Promise<boolean> {
  const result = await db.chatTurn.updateMany({
    where: { id: turnId, status: CHAT_TURN_STATES.ACCEPTED },
    data: {
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: attemptId,
      startedAt: new Date(),
    },
  });
  return result.count === 1;
}

/**
 * §8.6 STOPPED / FAILED_RETRYABLE retry: same logical turn, new attempt,
 * the reserved assistant slot is reused, no second learner row.
 * Returns true when this caller owns the new attempt.
 */
export async function beginChatTurnRetry(
  db: ChatTurnDb,
  turnId: string,
  attemptId: string,
): Promise<boolean> {
  const result = await db.chatTurn.updateMany({
    where: {
      id: turnId,
      status: { in: [CHAT_TURN_STATES.STOPPED, CHAT_TURN_STATES.FAILED_RETRYABLE] },
      invalidatedAt: null,
    },
    data: {
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: attemptId,
      retryCount: { increment: 1 },
      errorCode: null,
      stoppedAt: null,
      failedAt: null,
      completedAt: null,
    },
  });
  return result.count === 1;
}

/**
 * §13 cancellation: atomically transition the matching active attempt from
 * GENERATING to STOPPED. Returns true when this attempt was the owner.
 */
export async function markChatTurnStopped(
  db: ChatTurnDb,
  turnId: string,
  attemptId: string,
): Promise<boolean> {
  const result = await db.chatTurn.updateMany({
    where: {
      id: turnId,
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: attemptId,
    },
    data: {
      status: CHAT_TURN_STATES.STOPPED,
      stoppedAt: new Date(),
    },
  });
  return result.count === 1;
}

/**
 * Marks a GENERATING attempt owned by attemptId as retryable-failed.
 */
export async function markChatTurnFailedRetryable(
  db: ChatTurnDb,
  turnId: string,
  attemptId: string,
  errorCode?: string,
): Promise<boolean> {
  const result = await db.chatTurn.updateMany({
    where: {
      id: turnId,
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: attemptId,
    },
    data: {
      status: CHAT_TURN_STATES.FAILED_RETRYABLE,
      failedAt: new Date(),
      ...(errorCode ? { errorCode } : {}),
    },
  });
  return result.count === 1;
}

/**
 * §8.8 / §21 edit compatibility: when the established message-edit operation
 * deletes/invalidate a generated assistant response, its owning COMPLETED
 * turn can never replay the deleted content again.
 */
export async function invalidateChatTurnForEditedAssistantMessage(
  db: ChatTurnDb,
  assistantMessageId: string,
): Promise<number> {
  const result = await db.chatTurn.updateMany({
    where: {
      assistantMessageId,
      status: CHAT_TURN_STATES.COMPLETED,
      invalidatedAt: null,
    },
    data: { invalidatedAt: new Date() },
  });
  return result.count;
}

export interface ChatTurnCompletionInput {
  sessionId: string;
  turnId: string;
  attemptId: string;
  assistantMessage: {
    content: string;
    metadata?: unknown;
    messageNumber: number;
    timestamp?: Date;
    role?: string;
  };
  checkpoint: unknown;
  checkpointKind: string;
  /** Conversation-level continuity/lifecycle patch applied in the same transaction. */
  sessionPatch?: {
    summarization?: string | null;
    metadata?: unknown;
    topic?: string;
  };
}

export interface ChatTurnCompletionResult {
  completed: boolean;
  reason?: 'stale_attempt' | 'not_generating';
  assistantMessage?: any;
  turn?: any;
}

/**
 * §12 guarded completion transaction. Generation itself never holds a
 * transaction open; this short transaction:
 *   1. verifies the turn is still GENERATING owned by this attempt,
 *   2. persists the assistant message at its reserved sequence,
 *   3. persists the exact checkpoint,
 *   4. updates session rolling continuity metadata,
 *   5. marks the turn COMPLETED with assistantMessageId + completedAt.
 * Invariant: COMPLETED never exists without its canonical assistant row
 * and checkpoint. Late/stale attempts (STOPPED, mismatched attempt id)
 * are discarded — never resurrected.
 */
export async function finalizeChatTurnCompletion(
  db: ChatTurnDb,
  input: ChatTurnCompletionInput,
): Promise<ChatTurnCompletionResult> {
  const runInTransaction = async (tx: ChatTurnDb): Promise<ChatTurnCompletionResult> => {
    const turn = await tx.chatTurn.findUnique({ where: { id: input.turnId } });
    if (!turn) return { completed: false, reason: 'not_generating' };
    if (turn.activeAttemptId !== input.attemptId) return { completed: false, reason: 'stale_attempt' };
    if (turn.status !== CHAT_TURN_STATES.GENERATING) return { completed: false, reason: 'not_generating' };

    const assistantMessage = await tx.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        role: input.assistantMessage.role || 'model',
        content: input.assistantMessage.content,
        timestamp: input.assistantMessage.timestamp || new Date(),
        messageNumber: input.assistantMessage.messageNumber,
        metadata: (input.assistantMessage.metadata ?? undefined) as any,
      },
    });

    const turnUpdate = await tx.chatTurn.update({
      where: { id: input.turnId },
      data: {
        status: CHAT_TURN_STATES.COMPLETED,
        assistantMessageId: assistantMessage.id,
        completedAt: new Date(),
        checkpoint: input.checkpoint as any,
        checkpointKind: input.checkpointKind,
      },
    });

    if (input.sessionPatch) {
      await tx.chatSession.update({
        where: { id: input.sessionId },
        data: {
          ...(input.sessionPatch.topic !== undefined ? { topic: input.sessionPatch.topic } : {}),
          ...(input.sessionPatch.summarization !== undefined
            ? { summarization: input.sessionPatch.summarization }
            : {}),
          ...(input.sessionPatch.metadata !== undefined ? { metadata: input.sessionPatch.metadata as any } : {}),
          updatedAt: new Date(),
        },
      });
    } else {
      await tx.chatSession.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date() },
      });
    }

    return { completed: true, assistantMessage, turn: turnUpdate };
  };

  if (typeof db.$transaction === 'function') {
    return db.$transaction((tx: ChatTurnDb) => runInTransaction(tx));
  }
  return runInTransaction(db);
}

// ── Branch / continue lineage-request idempotency ──

export async function findLineageChildByRequest(
  db: ChatTurnDb,
  parentSessionId: string,
  lineageType: 'branch' | 'continuation',
  clientRequestId: string,
): Promise<any | null> {
  if (!clientRequestId) return null;
  return db.chatSession.findFirst({
    where: {
      parentSessionId,
      lineageType,
      lineageRequestId: clientRequestId,
    },
  });
}

/**
 * Resolves branch/continue idempotency:
 *  - same parent + operation + request id + same fingerprint → same child,
 *  - same request id with a different payload → deterministic conflict.
 */
export async function resolveLineageRequestReuse(
  db: ChatTurnDb,
  args: {
    parentSessionId: string;
    lineageType: 'branch' | 'continuation';
    clientRequestId?: string | null;
    fingerprint: string;
  },
): Promise<{ reuse: boolean; conflict: boolean; child?: any }> {
  if (!args.clientRequestId) return { reuse: false, conflict: false };
  const existing = await findLineageChildByRequest(
    db,
    args.parentSessionId,
    args.lineageType,
    args.clientRequestId,
  );
  if (!existing) return { reuse: false, conflict: false };
  if (existing.lineageRequestFingerprint === args.fingerprint) {
    return { reuse: true, conflict: false, child: existing };
  }
  return { reuse: false, conflict: true };
}
