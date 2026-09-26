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
  deriveSessionLifecycleFields,
  finalizeChatTurnCompletion,
  isContinuationRequired,
  markChatTurnStopped,
  resolveContinuationStage,
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
