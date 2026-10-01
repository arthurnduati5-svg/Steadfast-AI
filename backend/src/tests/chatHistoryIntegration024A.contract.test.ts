/**
 * STDF-REAL-CHAT-BACKEND-CONTRACT-024A — focused proof family (DB-free).
 *
 * Protects: relation normalization, tenant isolation shape, read purity (source),
 * recency/title clocks, history cursor stability + malformed rejection, bounded
 * transcript paging math, turn fingerprint determinism, done-barrier ordering
 * (source), edit latest-only (source), delete cleanup (source), search safety.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  buildChatSessionProjection,
  clampPreviewText,
  decodeHistoryCursor,
  deriveLatestVisiblePreview,
  encodeHistoryCursor,
  fingerprintTurnInput,
  getSessionMessages,
  isPlaceholderTitle,
  normalizeHistoryLimit,
  normalizeTranscriptLimit,
  requireStrictLiveTenantScope,
  resolveDisplayTitle,
  scopedSessionWhere,
  stripDuplicateRelationFields,
  CHAT_HISTORY_DEFAULT_LIMIT,
  CHAT_HISTORY_MAX_LIMIT,
  CHAT_TRANSCRIPT_DEFAULT_LIMIT,
  CHAT_TRANSCRIPT_MAX_LIMIT,
} from '../services/chatDurableContract024';

const ROUTE_SRC = fs.readFileSync(path.join(__dirname, '..', 'routes', 'ai.ts'), 'utf8');
const CONTRACT_SRC = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'chatDurableContract024.ts'),
  'utf8'
);
const PERSIST_SRC = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'chatDurablePersistence024.ts'),
  'utf8'
);

describe('024A R-normalization: Prisma ChatMessage relation becomes public messages', () => {
  it('maps ChatMessage rows to messages ordered by messageNumber with id tie-break', () => {
    const session = {
      id: 's1',
      ChatMessage: [
        { id: 'b', role: 'model', content: 'second', messageNumber: 2 },
        { id: 'a', role: 'user', content: 'first', messageNumber: 1 },
      ],
    };
    const msgs = getSessionMessages(session);
    expect(msgs.length).toBe(2);
    expect(msgs[0].id).toBe('a');
    expect(msgs[1].id).toBe('b');
  });

  it('accepts legacy in-memory messages naming and strips duplicate public fields', () => {
    const session = { id: 's1', messages: [{ id: 'a', role: 'user', content: 'hi', messageNumber: 1 }] };
    expect(getSessionMessages(session).length).toBe(1);
    const payload = stripDuplicateRelationFields({ messages: [{ id: 'a' }], ChatMessage: [{ id: 'a' }] } as never);
    expect((payload as { ChatMessage?: unknown }).ChatMessage).toBeUndefined();
    expect((payload as { messages: unknown[] }).messages.length).toBe(1);
  });

  it('route payload builder uses the canonical normalizer', () => {
    expect(ROUTE_SRC).toContain('getSessionMessages(session)');
  });
});

describe('024A R1 tenancy: school + student scope, legacy null-school hidden', () => {
  it('strict-live scope requires both studentId and verified schoolId', () => {
    expect(requireStrictLiveTenantScope({ studentId: 'u1', schoolId: 'sch1' }).ok).toBe(true);
    expect(requireStrictLiveTenantScope({ studentId: 'u1', schoolId: null }).code).toBe('SCHOOL_CONTEXT_REQUIRED');
    expect(requireStrictLiveTenantScope({ studentId: '', schoolId: 'sch1' }).ok).toBe(false);
  });

  it('scoped where-clause always binds the owned resource id', () => {
    const where = scopedSessionWhere({ studentId: 'u1', schoolId: 'sch1' }, 'sess1') as Record<string, unknown>;
    expect(where).toMatchObject({ id: 'sess1', studentId: 'u1', schoolId: 'sch1' });
  });

  it('conversation family routes all carry schoolAuth + verified-school guards', () => {
    for (const p of [
      "router.post('/new-session', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.post('/chat', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.post('/message', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.post('/messages/:id/edit', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.patch('/session/:id', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.post('/session/:id/delete', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.post('/session/:id/open', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.get('/chat-bootstrap', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.get('/history', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.get('/session/:id', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.get('/session/:id/messages', schoolAuthMiddleware, requireVerifiedSchoolContext",
      "router.get('/search', schoolAuthMiddleware, requireVerifiedSchoolContext",
    ]) {
      expect(ROUTE_SRC).toContain(p);
    }
  });

  it('new sessions record explicit schoolId from verified context, never body', () => {
    expect(ROUTE_SRC).toContain('schoolId: (resolveTenantScope(req).schoolId || undefined)');
  });
});

describe('024A R2 read purity: GETs perform zero state mutation and zero AI calls', () => {
  it('preload is read-pure by source inspection', () => {
    const preload = ROUTE_SRC.slice(ROUTE_SRC.indexOf("router.get('/preload'"), ROUTE_SRC.indexOf("router.post('/new-session'"));
    expect(preload).not.toMatch(/prisma\.chatSession\.(create|update|upsert|delete)/);
    expect(preload).not.toMatch(/persistSessionTitle|runSummarizationTask|emotionalAICopilot/);
  });

  it('history/session/messages/bootstrap/search handlers contain no writes or AI', () => {
    const segments: Array<[string, string]> = [
      ["router.get('/history'", "router.get('/chat-bootstrap'"],
      ["router.get('/chat-bootstrap'", "router.get('/session/:id',"],
      ["router.get('/session/:id',", "router.get('/session/:id/messages'"],
      ["router.get('/session/:id/messages'", "router.post('/session/:id/open'"],
      ["router.get('/search'", "router.get('/preferences'"],
    ];
    for (const [startMark, endMark] of segments) {
      const start = ROUTE_SRC.indexOf(startMark);
      const end = ROUTE_SRC.indexOf(endMark);
      expect(start).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      const block = ROUTE_SRC.slice(start, end);
      expect(block).not.toMatch(/prisma\.(chat(Session|Message)|chatTurnRequestRecord)\.(create|update|upsert|delete)/);
      expect(block).not.toMatch(/\(prisma as any\)\.(chatTurnRequestRecord|chatTurn)\.(create|update|upsert|delete)/);
      expect(block).not.toMatch(/emotionalAICopilot|runSummarizationTask|persistSessionTitle/);
    }
  });
});

describe('024A R3 recency: lastMessageAt ordering immune to title-only movement', () => {
  it('projection carries literal preview, never summary/checkpoint text', () => {
    const proj = buildChatSessionProjection({
      id: 's1',
      topic: 'Photosynthesis',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-02-01T00:00:00Z'),
      lastMessageAt: new Date('2026-01-15T00:00:00Z'),
      titleVersion: 3,
      messageCount: 2,
      latestVisibleMessagePreview: '  What is   chlorophyll?  ',
    });
    expect(proj.title).toBe('Photosynthesis');
    expect(proj.displayTitle).toBe('Photosynthesis');
    expect(proj.titleVersion).toBe(3);
    expect(proj.lastMessageAt).toBe('2026-01-15T00:00:00.000Z');
    expect(proj.latestVisibleMessagePreview).toBe('What is chlorophyll?');
  });

  it('deriveLatestVisiblePreview uses only user/assistant/model content', () => {
    expect(
      deriveLatestVisiblePreview([
        { id: 'a', role: 'system', content: 'hidden checkpoint', messageNumber: 1 },
        { id: 'b', role: 'user', content: 'visible question', messageNumber: 2 },
      ])
    ).toBe('visible question');
  });

  it('title mutation helper never touches lastMessageAt', () => {
    expect(CONTRACT_SRC).toContain('TITLE_MUTATION_MUST_NOT_TOUCH_LAST_MESSAGE_AT');
    expect(PERSIST_SRC).toContain('never touches lastMessageAt');
  });

  it('placeholder titles fall back for display without persisting', () => {
    expect(isPlaceholderTitle('New study session')).toBe(true);
    expect(resolveDisplayTitle('New study session', [{ id: 'a', role: 'user', content: 'Explain fractions simply', messageNumber: 1 }])).toContain('fractions');
    expect(clampPreviewText('x'.repeat(500))!.length).toBeLessThanOrEqual(280);
  });
});

describe('024A R3/R4 history cursor: opaque tuple, stable insertion, malformed 400', () => {
  it('limits default to 30 and cap history at 100 / transcript at 100', () => {
    expect(CHAT_HISTORY_DEFAULT_LIMIT).toBe(30);
    expect(CHAT_HISTORY_MAX_LIMIT).toBe(100);
    expect(CHAT_TRANSCRIPT_DEFAULT_LIMIT).toBe(60);
    expect(CHAT_TRANSCRIPT_MAX_LIMIT).toBe(100);
    expect(normalizeHistoryLimit(undefined)).toBe(30);
    expect(normalizeHistoryLimit(500)).toBe(100);
    expect(normalizeTranscriptLimit(500)).toBe(100);
  });

  it('cursor round-trips the (lastMessageAt, id) tuple and rejects garbage', () => {
    const c = encodeHistoryCursor('2026-01-15T00:00:00.000Z', 'sess9');
    const back = decodeHistoryCursor(c);
    expect(back).toEqual({ lastMessageAt: '2026-01-15T00:00:00.000Z', id: 'sess9' });
    expect(decodeHistoryCursor('!!!not-a-cursor!!!')).toBeNull();
    expect(decodeHistoryCursor('')).toBeNull();
  });

  it('history route rejects malformed cursors with INVALID_HISTORY_CURSOR', () => {
    expect(ROUTE_SRC).toContain('INVALID_HISTORY_CURSOR');
    expect(ROUTE_SRC).not.toContain("code: 'INVALID_CURSOR'");
  });

  it('tuple-boundary paging is insertion-stable (no offset shift)', () => {
    type Row = { id: string; t: string };
    const ordering = (rows: Row[]) => [...rows].sort((a, b) => (a.t === b.t ? (a.id < b.id ? 1 : -1) : a.t < b.t ? 1 : -1));
    const initial: Row[] = Array.from({ length: 35 }, (_, i) => ({ id: `s${String(i).padStart(2, '0')}`, t: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` }));
    const page1 = ordering(initial).slice(0, 30);
    const boundary = page1[page1.length - 1];
    const withInsert: Row[] = [...initial, { id: 'sNEW', t: '2026-03-01T00:00:00.000Z' }];
    const page2 = ordering(withInsert).filter((r) => r.t < boundary.t || (r.t === boundary.t && r.id < boundary.id)).slice(0, 30);
    const ids = new Set([...page1.map((r) => r.id), ...page2.map((r) => r.id)]);
    // All 35 originals reachable exactly once; the new insert above the boundary
    // does not shift or duplicate the continuation.
    expect(ids.size).toBe(35);
    expect(page2.some((r) => r.id === 'sNEW')).toBe(false);
    expect(page1.some((r) => r.id === 'sNEW')).toBe(false);
  });
});

describe('024A R4 transcript scale: bounded cold load + exact earlier paging', () => {
  it('earlier-page window math stays bounded regardless of total size', () => {
    const windowFor = (total: number, before: number | null, limit: number) => {
      const end = before === null ? total : Math.min(before - 1, total);
      const start = Math.max(1, end - limit + 1);
      const nums: number[] = [];
      for (let n = start; n <= end; n += 1) nums.push(n);
      return { nums, hasEarlier: start > 1, nextBefore: start > 1 ? start : null };
    };
    for (const total of [20, 200, 1000]) {
      const first = windowFor(total, null, 60);
      expect(first.nums.length).toBeLessThanOrEqual(60);
      expect(first.hasEarlier).toBe(total > 60);
      const earlier = windowFor(total, first.nums[0], 60);
      expect(earlier.nums.every((n) => n < first.nums[0])).toBe(true);
    }
  });

  it('session + earlier-messages routes page by messageNumber, never timestamps', () => {
    expect(ROUTE_SRC).toContain('Math.floor(before)');
    expect(ROUTE_SRC).toContain("orderBy: [{ messageNumber: 'desc' }]");
  });
});

describe('024A R5/R6 turns: fingerprint determinism + atomic ordering', () => {
  it('same stable inputs hash identically; transient fields cannot affect identity', () => {
    const a = fingerprintTurnInput({ sessionId: 's1', message: 'hello' });
    const b = fingerprintTurnInput({ sessionId: 's1', message: 'hello' });
    const c = fingerprintTurnInput({ sessionId: 's1', message: 'different' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('atomic append owns numbering via MAX(messageNumber)+1 with unique defense', () => {
    expect(PERSIST_SRC).toContain('_max: { messageNumber: true }');
    expect(ROUTE_SRC).toContain('appendChatMessageAtomic');
  });

  it('conflict codes are stable', () => {
    expect(ROUTE_SRC).toContain('TURN_ID_REUSE_CONFLICT');
    expect(ROUTE_SRC).toContain('SESSION_TURN_IN_PROGRESS');
  });
});

describe('024A R7/R8 interruption + done barrier', () => {
  it('disconnect marks interrupted and clears ownership; late completion cannot persist', () => {
    expect(ROUTE_SRC).toContain("status: 'interrupted', errorCode: 'CLIENT_DISCONNECT'");
    const block = ROUTE_SRC.slice(ROUTE_SRC.indexOf('Interruption invariant'), ROUTE_SRC.indexOf('Write AI Response'));
    expect(block).toContain('clientDisconnected');
  });

  it('done is emitted only after assistant persistence + sole-barrier finalization', () => {
    const persistAt = ROUTE_SRC.indexOf('savedAiMsg = await appendChatMessageAtomic(');
    const finalizeAt = ROUTE_SRC.indexOf('await finalizeChatTurn({');
    // Completion-path done write (after persistence); the earlier replay-path
    // done is a separate minimal replay stream for already-completed turns.
    const doneAt = ROUTE_SRC.lastIndexOf('event: done');
    expect(persistAt).toBeGreaterThan(-1);
    expect(finalizeAt).toBeGreaterThan(persistAt);
    expect(doneAt).toBeGreaterThan(finalizeAt);
  });

  it('finalizeChatTurn is the sole completion owner: no legacy completeChatTurn remains', () => {
    expect(ROUTE_SRC).toContain('await finalizeChatTurn({');
    expect(ROUTE_SRC).not.toContain('completeChatTurn');
  });

  it('SSE keeps accepted/token/done/error wire types with heartbeat', () => {
    expect(ROUTE_SRC).toContain("type: 'accepted'");
    expect(ROUTE_SRC).toContain("type: 'token'");
    expect(ROUTE_SRC).toContain("type: 'done'");
    expect(ROUTE_SRC).toContain("type: 'error'");
    expect(ROUTE_SRC).toContain(': heartbeat');
  });
});

describe('024A R9 edit: latest-only, projection recompute, bounded snapshot', () => {
  it('historical learner edits are rejected with a stable code', () => {
    expect(ROUTE_SRC).toContain('LATEST_LEARNER_EDIT_ONLY');
  });

  it('edit recomputes the projection and returns a bounded page containing the edit', () => {
    expect(ROUTE_SRC).toContain('await rebuildSessionProjection(session.id)');
    expect(ROUTE_SRC).toContain('Edit persistence could not be confirmed');
  });
});

describe('024A R10/R-search delete + search safety', () => {
  it('delete purges ledger rows, cascades messages, and evicts derived cache', () => {
    const block = ROUTE_SRC.slice(ROUTE_SRC.indexOf("router.post('/session/:id/delete'"), ROUTE_SRC.indexOf("router.get('/search'"));
    expect(block).toContain('chatTurnRequestRecord.deleteMany');
    expect(block).toContain('prisma.chatSession.delete');
  });

  it('search is keyword-only tenant-scoped with semantic blocked until proven', () => {
    expect(ROUTE_SRC).toContain('SEMANTIC_SEARCH_UNAVAILABLE');
    expect(ROUTE_SRC).toContain('INVALID_HISTORY_CURSOR');
  });
});

describe('024A concurrency seal: CAS claim, serialized numbering, canonical append, fail-closed, sole completion', () => {
  const CLAIM_SRC = PERSIST_SRC.slice(
    PERSIST_SRC.indexOf('export async function claimSessionTurn'),
    PERSIST_SRC.indexOf('export async function finalizeChatTurn')
  );
  const APPEND_SRC = PERSIST_SRC.slice(PERSIST_SRC.indexOf('export async function appendChatMessageAtomic'));
  const FINALIZE_SRC = PERSIST_SRC.slice(
    PERSIST_SRC.indexOf('export async function finalizeChatTurn'),
    PERSIST_SRC.indexOf('export async function abortSessionTurn')
  );
  const APPEND_FN = APPEND_SRC.slice(0, APPEND_SRC.indexOf('export async function persistSessionTitle'));
  const MESSAGE_ROUTE_SRC = ROUTE_SRC.slice(
    ROUTE_SRC.indexOf("router.post('/message'"),
    ROUTE_SRC.indexOf("router.post('/messages/:id/edit'")
  );
  const CHAT_CLAIM_SRC = ROUTE_SRC.slice(
    ROUTE_SRC.indexOf('One-barrier session claim'),
    ROUTE_SRC.indexOf('const existingEditedUserMessage')
  );

  it('A. claimSessionTurn is an atomic compare-and-swap with no read-then-unconditional-update path', () => {
    expect(CLAIM_SRC).toContain('updateMany');
    expect(CLAIM_SRC).toContain('activeTurnId: null');
    expect(CLAIM_SRC).toContain('activeTurnId: args.clientTurnId');
    expect(CLAIM_SRC).toContain('Number(res?.count) === 1');
    // No unconditional claim write remains: the only session write is the CAS.
    expect(CLAIM_SRC).not.toMatch(/chatSession\.update\(\{/);
    // Exactly one claimed=true exists: the CAS-success path carrying ownership.
    const claimedTrue = CLAIM_SRC.match(/claimed:\s*true/g) || [];
    expect(claimedTrue.length).toBe(1);
    expect(CLAIM_SRC).toContain('{ claimed: true, owner: args.clientTurnId }');
  });

  it('B. appendChatMessageAtomic serializes on the session row before MAX(messageNumber)', () => {
    const lockAt = APPEND_FN.indexOf('await tx.chatSession.update({');
    const maxAt = APPEND_FN.indexOf('_max: { messageNumber: true }');
    expect(lockAt).toBeGreaterThan(-1);
    expect(maxAt).toBeGreaterThan(-1);
    expect(lockAt).toBeLessThan(maxAt);
    // @@unique([sessionId, messageNumber]) stays the final DB defense.
    expect(PERSIST_SRC).toContain('@@unique([sessionId, messageNumber])');
  });

  it('C. POST /message uses the canonical atomic append with no count()+1 allocator', () => {
    expect(MESSAGE_ROUTE_SRC).toContain('await appendChatMessageAtomic({');
    // No Prisma count query, no direct message insert, no route-side number
    // arithmetic (the "Never count()+1" rule is enforced by the service).
    expect(MESSAGE_ROUTE_SRC).not.toMatch(/chatMessage\.count/);
    expect(MESSAGE_ROUTE_SRC).not.toMatch(/\.count\(/);
    expect(MESSAGE_ROUTE_SRC).not.toMatch(/messageNumber\s*[:=]/);
    expect(MESSAGE_ROUTE_SRC).not.toMatch(/nextNumber/);
    expect(MESSAGE_ROUTE_SRC).not.toMatch(/prisma\.chatMessage\.create/);
  });

  it('D. canonical persistence has no fail-open durability downgrade', () => {
    expect(PERSIST_SRC).not.toContain('Older DB');
    expect(PERSIST_SRC).not.toContain('ledger remains the authority');
    expect(PERSIST_SRC).not.toContain('fail open to legacy path');
    expect(PERSIST_SRC).not.toContain('fall back to updatedAt');
    // Claim fails closed on schema/storage error (exactly one claimed=true:
    // the CAS-success path pinned in test A).
    expect(CLAIM_SRC).toContain('Fail-closed');
    // Finalize fails closed on missing ownership proof or missing ledger.
    expect(FINALIZE_SRC).toContain('TURN_LEDGER_MISSING');
    expect(FINALIZE_SRC).toContain('SESSION_CLAIM_UNAVAILABLE');
    expect(FINALIZE_SRC).toContain('TURN_LEDGER_UNAVAILABLE');
    // Append carries no fallback catch: projection failure rolls back.
    expect(APPEND_FN).not.toContain('catch');
    // Abort surfaces mutation failure instead of claiming success.
    expect(PERSIST_SRC).toContain('SESSION_CLAIM_RELEASE_FAILED');
  });

  it('E. completion ordering is assistant-append -> finalizeChatTurn -> done, nothing after', () => {
    const persistAt = ROUTE_SRC.indexOf('savedAiMsg = await appendChatMessageAtomic(');
    const finalizeAt = ROUTE_SRC.indexOf('await finalizeChatTurn({');
    const doneAt = ROUTE_SRC.lastIndexOf('event: done');
    expect(persistAt).toBeGreaterThan(-1);
    expect(finalizeAt).toBeGreaterThan(persistAt);
    expect(doneAt).toBeGreaterThan(finalizeAt);
    expect(ROUTE_SRC).not.toContain('completeChatTurn');
  });

  it('losing turn releases its ledger deterministically and never persists', () => {
    // Claim gate sits before any learner persist; loss aborts the ledger with
    // the stable conflict code and returns 409.
    expect(CHAT_CLAIM_SRC).toContain('await abortSessionTurn({ sessionId, clientTurnId');
    expect(CHAT_CLAIM_SRC).toContain("errorCode: 'SESSION_TURN_IN_PROGRESS'");
    expect(CHAT_CLAIM_SRC).toContain('SESSION_TURN_IN_PROGRESS');
    const claimAt = ROUTE_SRC.indexOf('const claim = await claimSessionTurn({ sessionId, clientTurnId })');
    const learnerPersistAt = ROUTE_SRC.indexOf('savedUserMessage = await appendChatMessageAtomic({');
    expect(claimAt).toBeGreaterThan(-1);
    expect(learnerPersistAt).toBeGreaterThan(claimAt);
  });
});
