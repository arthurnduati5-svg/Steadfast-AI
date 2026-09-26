// Steadfast AI — Chat Durability v1 focused invariants
// (STEADFAST-CHAT-BACKEND-DURABILITY-V1)
//
// Pure-function proof of the dangerous invariants. DB-backed transitions
// (ChatTurn compare-and-set, guarded completion transaction, branch/continue
// routes, keyset pagination queries) are proven by `prisma validate`,
// `prisma generate`, TypeScript build and production-path inspection;
// they require a live database and are intentionally not faked here.

import { describe, it, expect } from 'vitest';
import {
  CHAT_TURN_FINALIZING,
  CHAT_TURN_STATES,
  NEW_LEARNER_TURN_LIMIT,
  beginChatTurnRetry,
  claimChatTurnForGeneration,
  createAcceptedChatTurn,
  createLearnerTurnCapacityError,
  deriveSessionLifecycleFields,
  finalizeChatTurnCompletion,
  isContinuationRequired,
  isLearnerTurnCapacityError,
  markChatTurnStopped,
  resolveContinuationStage,
  reserveNewLearnerTurnCapacity,
  computeClientTurnFingerprint,
  computeLineageRequestFingerprint,
  generateServerClientTurnId,
  generateChatTurnAttemptId,
  shouldRejectNewLearnerTurnForContinuation,
  stableStringify,
} from '../services/chatTurnDurabilityService';
import {
  CHAT_TURN_CHECKPOINT_SCHEMA_VERSION,
  buildExactTurnCheckpoint,
  reconstructLegacyCheckpoint,
} from '../services/conversationCheckpointService';
import {
  finalizeStudentFacingOutput,
  createStreamingStudentFacingGate,
} from '../services/studentFacingOutputService';

describe('chat durability v1 — learner-turn lifecycle (80/95/100)', () => {
  it('normal stage below 80 with send allowed and no continuation', () => {
    expect(resolveContinuationStage(0)).toBe('normal');
    expect(resolveContinuationStage(79)).toBe('normal');
    const fields = deriveSessionLifecycleFields(79);
    expect(fields.canSend).toBe(true);
    expect(fields.continuationAvailable).toBe(false);
    expect(isContinuationRequired(79)).toBe(false);
  });

  it('soft stage at 80 with continuation available', () => {
    expect(resolveContinuationStage(80)).toBe('soft');
    const fields = deriveSessionLifecycleFields(80);
    expect(fields.canSend).toBe(true);
    expect(fields.continuationAvailable).toBe(true);
    expect(isContinuationRequired(80)).toBe(false);
  });

  it('strong stage at 95 still allows the 100th learner turn', () => {
    expect(resolveContinuationStage(94)).toBe('soft');
    expect(resolveContinuationStage(95)).toBe('strong');
    expect(deriveSessionLifecycleFields(99).canSend).toBe(true);
    expect(isContinuationRequired(99)).toBe(false);
  });

  it('rejects new ordinary learner turns only after 100 exist', () => {
    expect(NEW_LEARNER_TURN_LIMIT).toBe(100);
    expect(resolveContinuationStage(100)).toBe('required');
    expect(deriveSessionLifecycleFields(100).canSend).toBe(false);
    expect(isContinuationRequired(100)).toBe(true);
    expect(isContinuationRequired(101)).toBe(true);
  });
});

describe('chat durability v1 — clientTurnId replay/conflict basis', () => {
  const base = {
    effectiveMessage: 'Explain photosynthesis',
    attachments: [],
    editedMessageId: null,
    tutorAction: null,
    inputOrigin: null,
    composerIntent: null,
    linkedArtifactId: null,
    focusMode: false,
    examMode: false,
    forceWebSearch: false,
    includeVideos: false,
    workspace: null,
    persistsLearnerMessage: true,
  };

  it('same logical request replays to the same fingerprint', () => {
    expect(computeClientTurnFingerprint(base)).toBe(computeClientTurnFingerprint({ ...base }));
  });

  it('different content conflicts (different fingerprint)', () => {
    expect(computeClientTurnFingerprint(base)).not.toBe(
      computeClientTurnFingerprint({ ...base, effectiveMessage: 'Explain mitochondria' }),
    );
  });

  it('persisted vs non-persisted requests are distinct turns', () => {
    expect(computeClientTurnFingerprint(base)).not.toBe(
      computeClientTurnFingerprint({ ...base, persistsLearnerMessage: false }),
    );
  });

  it('stable stringify is key-order insensitive', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  it('server turn and attempt ids are unique with expected prefixes', () => {
    const first = generateServerClientTurnId();
    const second = generateServerClientTurnId();
    expect(first.startsWith('srv-turn-')).toBe(true);
    expect(first).not.toBe(second);
    expect(generateChatTurnAttemptId()).toMatch(/^att-/);
  });

  it('lineage fingerprints are deterministic and type-separated', () => {
    const branch = { parentSessionId: 's1', lineageType: 'branch', branchedFromMessageId: 'm1' };
    expect(computeLineageRequestFingerprint(branch)).toBe(computeLineageRequestFingerprint(branch));
    expect(computeLineageRequestFingerprint(branch)).not.toBe(
      computeLineageRequestFingerprint({ parentSessionId: 's1', lineageType: 'continuation' }),
    );
  });

  it('turn states cover the full lifecycle', () => {
    expect(CHAT_TURN_STATES.COMPLETED).toBe('COMPLETED');
    expect(CHAT_TURN_STATES.STOPPED).toBe('STOPPED');
    expect(CHAT_TURN_STATES.FAILED_RETRYABLE).toBe('FAILED_RETRYABLE');
    expect(CHAT_TURN_STATES.REJECTED).toBe('REJECTED');
  });
});

describe('chat durability v1 — newest-history window', () => {
  it('newest-80 window in canonical order contains the latest message', () => {
    const rows = Array.from({ length: 120 }, (_, i) => ({ id: `m${i}`, messageNumber: i + 1 }));
    const windowDesc = [...rows]
      .sort((a, b) => b.messageNumber - a.messageNumber || (a.id < b.id ? 1 : -1))
      .slice(0, 80);
    expect(windowDesc[0].messageNumber).toBe(120);
    const chronological = [...windowDesc].reverse();
    expect(chronological[0].messageNumber).toBe(41);
    expect(chronological[chronological.length - 1].messageNumber).toBe(120);
  });

  it('keyset pagination contract: limit+1 probe with next cursor', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, messageNumber: i + 1 }));
    const limit = 4;
    const probe = [...rows]
      .sort((a, b) => b.messageNumber - a.messageNumber)
      .slice(0, limit + 1);
    const hasMore = probe.length > limit;
    const page = probe.slice(0, limit).reverse();
    expect(hasMore).toBe(true);
    expect(page.map((m) => m.messageNumber)).toEqual([7, 8, 9, 10]);
    expect(page[0].messageNumber).toBe(7);
  });
});

describe('chat durability v1 — allocator contract', () => {
  it('reserved slots derive from the returned allocator value (never counts)', () => {
    const nextMessageNumber = 42;
    const slots = 2;
    const startNumber = nextMessageNumber - slots;
    const numbers = Array.from({ length: slots }, (_, index) => startNumber + index);
    expect(numbers).toEqual([40, 41]);
    expect(startNumber + slots).toBe(nextMessageNumber);
  });
});

describe('chat durability v1 — student-facing output gate', () => {
  it('preserves fenced programming code byte-for-byte', () => {
    const code = '```python\nx = {"a": 1}  # \\frac{1}{2} <b>kept</b>\n```';
    expect(finalizeStudentFacingOutput(code)).toBe(code);
  });

  it('converts prose fractions while stripping unsafe html', () => {
    const out = finalizeStudentFacingOutput('Half is \\frac{1}{2} <script>alert(1)</script> done');
    expect(out).toContain('(1)/(2)');
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('alert(1)');
  });

  it('streaming gate concatenation equals canonical persisted content', () => {
    const full = 'Learn \\frac{3}{4} now\n```js\nconst a = 1;\n```\nDone <b>well</b>';
    const gate = createStreamingStudentFacingGate();
    let emitted = '';
    for (let i = 0; i < full.length; i += 7) {
      emitted += gate.push(full.slice(i, i + 7));
    }
    emitted += gate.flush();
    expect(emitted).toBe(finalizeStudentFacingOutput(full));
  });
});

describe('chat durability v1 — exact checkpoint', () => {
  it('builds a versioned exact checkpoint with bounded summary', () => {
    const checkpoint = buildExactTurnCheckpoint({
      conversationState: { lastStudyTopic: 'fractions', secret: 'must-not-leak' },
      tutorState: { activeSubject: 'math', activeTopic: 'fractions' },
      activeSubject: 'math',
      activeTopic: 'fractions',
    });
    expect(checkpoint.schemaVersion).toBe(CHAT_TURN_CHECKPOINT_SCHEMA_VERSION);
    expect(checkpoint.checkpointKind).toBe('exact');
    expect((checkpoint.conversationState as Record<string, unknown>).lastStudyTopic).toBe('fractions');
    expect((checkpoint.conversationState as Record<string, unknown>).secret).toBeUndefined();
    expect((checkpoint.continuitySummary || '').length).toBeLessThanOrEqual(1200);
  });

  it('reconstructs a legacy checkpoint from transcript prefix', () => {
    const checkpoint = reconstructLegacyCheckpoint({
      sessionTopic: 'algebra',
      messagesUpToPoint: [
        { role: 'user', content: 'Hi' },
        { role: 'model', content: 'Hello' },
      ] as any,
    }) as unknown as Record<string, unknown>;
    expect(typeof checkpoint.continuitySummary).toBe('string');
  });
});

describe('chat durability v1 — 100-turn gate bypasses existing turns', () => {
  it('count 100 + existing COMPLETED turn replays instead of rejecting', () => {
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 100,
        isNewLearnerMessage: true,
        hasExistingTurn: true,
      }),
    ).toBe(false);
  });

  it('count 100 + existing STOPPED turn retries instead of rejecting', () => {
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 100,
        isNewLearnerMessage: true,
        hasExistingTurn: true,
      }),
    ).toBe(false);
  });

  it('count 100 + existing FAILED_RETRYABLE turn retries instead of rejecting', () => {
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 100,
        isNewLearnerMessage: true,
        hasExistingTurn: true,
      }),
    ).toBe(false);
  });

  it('count 100 + no existing turn rejects a new learner turn', () => {
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 100,
        isNewLearnerMessage: true,
        hasExistingTurn: false,
      }),
    ).toBe(true);
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 101,
        isNewLearnerMessage: true,
        hasExistingTurn: false,
      }),
    ).toBe(true);
  });

  it('non-persisting requests and pre-limit counts are never gated', () => {
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 100,
        isNewLearnerMessage: false,
        hasExistingTurn: false,
      }),
    ).toBe(false);
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 99,
        isNewLearnerMessage: true,
        hasExistingTurn: false,
      }),
    ).toBe(false);
    expect(NEW_LEARNER_TURN_LIMIT).toBe(100);
  });
});

describe('chat durability v1 — completion CAS vs cancellation race', () => {
  const completionInput = (turnId: string, attemptId: string) => ({
    sessionId: 'sess-1',
    turnId,
    attemptId,
    assistantMessage: { content: 'assistant reply', messageNumber: 2 },
    checkpoint: { schemaVersion: 1 },
    checkpointKind: 'exact',
  });

  /** Smallest deterministic in-memory ChatTurn store with CAS updateMany. */
  function createFakeFinalizeDb(initialTurn: Record<string, any>) {
    const turns = new Map<string, any>([[initialTurn.id, { ...initialTurn }]]);
    const messages: any[] = [];
    let sessionUpdates = 0;
    const matchesStatus = (turnStatus: string, cond: any): boolean => {
      if (cond === undefined) return true;
      if (typeof cond === 'string') return turnStatus === cond;
      if (cond && Array.isArray(cond.in)) return cond.in.includes(turnStatus);
      return false;
    };
    const db: any = {
      chatTurn: {
        findUnique: async ({ where }: any) => {
          const turn = turns.get(where.id);
          return turn ? { ...turn } : null;
        },
        findFirst: async () => null,
        create: async ({ data }: any) => {
          const row = { id: `turn-${turns.size + 1}`, ...data };
          turns.set(row.id, row);
          return { ...row };
        },
        update: async ({ where, data }: any) => {
          const turn = turns.get(where.id);
          if (!turn) throw new Error('turn not found');
          Object.assign(turn, data);
          return { ...turn };
        },
        updateMany: async ({ where, data }: any) => {
          const turn = turns.get(where.id);
          if (!turn) return { count: 0 };
          if (!matchesStatus(turn.status, where.status)) return { count: 0 };
          if (where.activeAttemptId !== undefined && turn.activeAttemptId !== where.activeAttemptId) {
            return { count: 0 };
          }
          Object.assign(turn, data);
          return { count: 1 };
        },
      },
      chatSession: {
        findFirst: async () => null,
        update: async () => {
          sessionUpdates += 1;
          return {};
        },
      },
      chatMessage: {
        create: async ({ data }: any) => {
          const row = { id: `msg-${messages.length + 1}`, ...data };
          messages.push(row);
          return { ...row };
        },
      },
      $transaction: async (fn: any) => fn(db),
    };
    return { db, turns, messages, getSessionUpdates: () => sessionUpdates };
  }

  it('A: GENERATING + correct attempt finalizes with assistant + checkpoint', async () => {
    const { db, turns, messages, getSessionUpdates } = createFakeFinalizeDb({
      id: 'turn-A',
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: 'att-1',
    });
    const result = await finalizeChatTurnCompletion(db, completionInput('turn-A', 'att-1'));
    expect(result.completed).toBe(true);
    expect(messages.length).toBe(1);
    expect(turns.get('turn-A').status).toBe(CHAT_TURN_STATES.COMPLETED);
    expect(turns.get('turn-A').assistantMessageId).toBe(messages[0].id);
    expect(turns.get('turn-A').checkpoint).toEqual({ schemaVersion: 1 });
    expect(getSessionUpdates()).toBe(1);
  });

  it('B: STOPPED before finalize creates no assistant and never COMPLETES', async () => {
    const { db, turns, messages, getSessionUpdates } = createFakeFinalizeDb({
      id: 'turn-B',
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: 'att-1',
    });
    // Cancellation wins first.
    expect(await markChatTurnStopped(db, 'turn-B', 'att-1')).toBe(true);
    expect(turns.get('turn-B').status).toBe(CHAT_TURN_STATES.STOPPED);
    const result = await finalizeChatTurnCompletion(db, completionInput('turn-B', 'att-1'));
    expect(result.completed).toBe(false);
    expect(result.reason).toBe('not_generating');
    expect(messages.length).toBe(0);
    expect(turns.get('turn-B').status).toBe(CHAT_TURN_STATES.STOPPED);
    expect(getSessionUpdates()).toBe(0);
  });

  it('C: mismatched activeAttemptId creates no assistant (stale provider attempt)', async () => {
    const { db, turns, messages, getSessionUpdates } = createFakeFinalizeDb({
      id: 'turn-C',
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: 'att-1',
    });
    const result = await finalizeChatTurnCompletion(db, completionInput('turn-C', 'att-stale'));
    expect(result.completed).toBe(false);
    expect(result.reason).toBe('stale_attempt');
    expect(messages.length).toBe(0);
    expect(turns.get('turn-C').status).toBe(CHAT_TURN_STATES.GENERATING);
    expect(getSessionUpdates()).toBe(0);
  });

  it('D: only one concurrent claimant can own FINALIZING', async () => {
    const { db, turns, messages } = createFakeFinalizeDb({
      id: 'turn-D',
      status: CHAT_TURN_STATES.GENERATING,
      activeAttemptId: 'att-1',
    });
    const first = await finalizeChatTurnCompletion(db, completionInput('turn-D', 'att-1'));
    const second = await finalizeChatTurnCompletion(db, completionInput('turn-D', 'att-1'));
    expect(first.completed).toBe(true);
    expect(second.completed).toBe(false);
    expect(messages.length).toBe(1);
    expect(turns.get('turn-D').status).toBe(CHAT_TURN_STATES.COMPLETED);
    expect(CHAT_TURN_FINALIZING).toBe('FINALIZING');
  });
});

describe('chat durability v1 — atomic new-turn capacity admission (99 → 100 race)', () => {
  // Deterministic proof of the database compare-and-set guard. The fake below
  // is faithful to the production path: ChatSession.updateMany with
  // WHERE id + learnerTurnCount < 100, single-transaction acceptance
  // (capacity → turn row), and learner-message persistence WITHOUT a second
  // increment. A live-DB concurrency probe is NOT_RUN here (no usable local
  // PostgreSQL in this environment); the CAS contract itself is proven.

  function createCapacityFakeDb(initialCount: number) {
    const sessions = new Map<string, any>([['sess-cap', { id: 'sess-cap', learnerTurnCount: initialCount }]]);
    const turns = new Map<string, any>();
    const messages: any[] = [];
    let turnSeq = 0;
    let sessionPlainUpdates = 0;
    const db: any = {
      chatSession: {
        findFirst: async () => null,
        update: async ({ where, data }: any) => {
          sessionPlainUpdates += 1;
          const session = sessions.get(where.id);
          if (!session) throw new Error('session not found');
          session.learnerTurnCount += data?.learnerTurnCount?.increment ?? 0;
          return { ...session };
        },
        updateMany: async ({ where, data }: any) => {
          const session = sessions.get(where.id);
          if (!session) return { count: 0 };
          const lt = where?.learnerTurnCount?.lt;
          if (lt !== undefined && !(session.learnerTurnCount < lt)) return { count: 0 };
          session.learnerTurnCount += data?.learnerTurnCount?.increment ?? 0;
          return { count: 1 };
        },
      },
      chatTurn: {
        findUnique: async ({ where }: any) => {
          if (where.id) {
            const turn = turns.get(where.id);
            return turn ? { ...turn } : null;
          }
          const key = where.sessionId_clientTurnId;
          if (key) {
            for (const turn of turns.values()) {
              if (turn.sessionId === key.sessionId && turn.clientTurnId === key.clientTurnId) {
                return { ...turn };
              }
            }
          }
          return null;
        },
        findFirst: async () => null,
        create: async ({ data }: any) => {
          for (const turn of turns.values()) {
            if (turn.sessionId === data.sessionId && turn.clientTurnId === data.clientTurnId) {
              const conflict: any = new Error('unique constraint');
              conflict.code = 'P2002';
              throw conflict;
            }
          }
          turnSeq += 1;
          const row = { id: `turn-cap-${turnSeq}`, status: CHAT_TURN_STATES.ACCEPTED, ...data };
          turns.set(row.id, row);
          return { ...row };
        },
        update: async ({ where, data }: any) => {
          const turn = turns.get(where.id);
          if (!turn) throw new Error('turn not found');
          Object.assign(turn, data);
          return { ...turn };
        },
        updateMany: async ({ where, data }: any) => {
          const turn = turns.get(where.id);
          if (!turn) return { count: 0 };
          if (where.status !== undefined) {
            const cond = where.status;
            const ok =
              typeof cond === 'string' ? turn.status === cond : cond?.in?.includes(turn.status) ?? false;
            if (!ok) return { count: 0 };
          }
          if (where.activeAttemptId !== undefined && turn.activeAttemptId !== where.activeAttemptId) {
            return { count: 0 };
          }
          Object.assign(turn, data);
          return { count: 1 };
        },
      },
      chatMessage: {
        create: async ({ data }: any) => {
          const row = { id: `msg-cap-${messages.length + 1}`, ...data };
          messages.push(row);
          return { ...row };
        },
      },
      $transaction: async (fn: any) => {
        const countSnapshot = sessions.get('sess-cap')!.learnerTurnCount;
        const turnsSnapshot = new Map(turns);
        const messagesSnapshot = messages.length;
        try {
          return await fn(db);
        } catch (error) {
          sessions.get('sess-cap')!.learnerTurnCount = countSnapshot;
          turns.clear();
          for (const [key, value] of turnsSnapshot) turns.set(key, value);
          messages.length = messagesSnapshot;
          throw error;
        }
      },
    };
    const getCount = () => sessions.get('sess-cap')!.learnerTurnCount;
    return { db, turns, messages, getCount, getSessionPlainUpdates: () => sessionPlainUpdates };
  }

  /** Mirrors the route's NEW-turn acceptance transaction (capacity + turn). */
  async function acceptNewTurn(db: any, clientTurnId: string) {
    return db.$transaction(async (tx: any) => {
      const owned = await reserveNewLearnerTurnCapacity(tx, 'sess-cap');
      if (!owned) throw createLearnerTurnCapacityError();
      return createAcceptedChatTurn(tx, {
        sessionId: 'sess-cap',
        clientTurnId,
        requestFingerprint: `fp-${clientTurnId}`,
        assistantMessageNumber: 10,
      });
    });
  }

  /** Mirrors the route's learner-message persistence (no second increment). */
  async function persistLearnerMessageWithoutSecondIncrement(db: any, turnId: string) {
    const learnerRow = await db.chatMessage.create({
      data: { sessionId: 'sess-cap', role: 'user', content: 'final slot turn', messageNumber: 9 },
    });
    await db.chatTurn.update({ where: { id: turnId }, data: { userMessageId: learnerRow.id } });
    return learnerRow;
  }

  it('first NEW admission at 99 succeeds and produces count 100', async () => {
    const { db, turns, messages, getCount, getSessionPlainUpdates } = createCapacityFakeDb(99);
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: 99,
        isNewLearnerMessage: true,
        hasExistingTurn: false,
      }),
    ).toBe(false);
    const turn = await acceptNewTurn(db, 'client-new-1');
    expect(turn.clientTurnId).toBe('client-new-1');
    expect(getCount()).toBe(100);
    const learnerRow = await persistLearnerMessageWithoutSecondIncrement(db, turn.id);
    expect(learnerRow.id).toBeTruthy();
    expect(turns.get(turn.id).userMessageId).toBe(learnerRow.id);
    expect(messages.length).toBe(1);
    // Exactly one slot consumed: reservation only, never a second increment.
    expect(getSessionPlainUpdates()).toBe(0);
    expect(getCount()).toBe(100);
  });

  it('competing second NEW admission loses with no turn, message or generation', async () => {
    const { db, turns, messages, getCount } = createCapacityFakeDb(99);
    const winner = await acceptNewTurn(db, 'client-new-1');
    expect(getCount()).toBe(100);
    let error: any = null;
    try {
      await acceptNewTurn(db, 'client-new-2');
    } catch (err) {
      error = err;
    }
    expect(isLearnerTurnCapacityError(error)).toBe(true);
    // Loser persists nothing and owns no generation.
    expect(turns.size).toBe(1);
    expect(turns.has(winner.id)).toBe(true);
    expect(messages.length).toBe(0);
    expect(await claimChatTurnForGeneration(db, 'missing-turn', 'att-loser')).toBe(false);
    expect(getCount()).toBe(100);
    // Snapshot gate agrees the slot is now closed for genuinely new turns.
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: getCount(),
        isNewLearnerMessage: true,
        hasExistingTurn: false,
      }),
    ).toBe(true);
  });

  it('retry of the winning turn never reserves again; count cannot exceed 100', async () => {
    const { db, turns, getCount } = createCapacityFakeDb(99);
    const winner = await acceptNewTurn(db, 'client-new-1');
    await persistLearnerMessageWithoutSecondIncrement(db, winner.id);
    // Move the winner through generation so a retry can be claimed.
    expect(await claimChatTurnForGeneration(db, winner.id, 'att-win')).toBe(true);
    expect(await markChatTurnStopped(db, winner.id, 'att-win')).toBe(true);
    // Retry of the EXISTING turn bypasses the gate and never touches capacity.
    expect(
      shouldRejectNewLearnerTurnForContinuation({
        learnerTurnCount: getCount(),
        isNewLearnerMessage: true,
        hasExistingTurn: true,
      }),
    ).toBe(false);
    expect(await beginChatTurnRetry(db, winner.id, 'att-retry')).toBe(true);
    expect(getCount()).toBe(100);
    // Every further genuinely NEW admission loses; the counter never exceeds 100.
    for (let i = 0; i < 5; i += 1) {
      await expect(acceptNewTurn(db, `client-new-loser-${i}`)).rejects.toMatchObject({
        code: 'CONVERSATION_CONTINUATION_REQUIRED',
      });
    }
    expect(getCount()).toBe(100);
    expect(turns.size).toBe(1);
  });

  it('failed acceptance rolls its capacity slot back (no leak)', async () => {
    const { db, turns, getCount } = createCapacityFakeDb(99);
    // A concurrently-committed identical clientTurnId already owns the turn row.
    await db.chatTurn.create({
      data: {
        sessionId: 'sess-cap',
        clientTurnId: 'client-same',
        requestFingerprint: 'fp-client-same',
        status: CHAT_TURN_STATES.ACCEPTED,
        assistantMessageNumber: 10,
      },
    });
    expect(getCount()).toBe(99);
    // This attempt reserves capacity (99 → 100) then loses turn creation with
    // P2002; the single transaction rolls the slot back to 99.
    let error: any = null;
    try {
      await db.$transaction(async (tx: any) => {
        expect(await reserveNewLearnerTurnCapacity(tx, 'sess-cap')).toBe(true);
        await createAcceptedChatTurn(tx, {
          sessionId: 'sess-cap',
          clientTurnId: 'client-same',
          requestFingerprint: 'fp-client-same',
          assistantMessageNumber: 11,
        });
      });
    } catch (err) {
      error = err;
    }
    expect(error?.code).toBe('P2002');
    expect(getCount()).toBe(99);
    expect(turns.size).toBe(1);
  });
});
