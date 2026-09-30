# STDF-REAL-CHAT-BACKEND-CONTRACT-024A — Frontend Handoff (frozen)

Task: STDF-REAL-CHAT-BACKEND-CONTRACT-024A
Status: BACKEND CONTRACT FROZEN. Implement 024B against this document only.

- BACKEND COMMIT: `PENDING_STAMP` (stamped in the follow-up docs commit; verify with `git log --oneline -3`)
- Branch at implementation time: `main` (worktree was dirty; work applied in place, task hunks only)
- MIGRATIONS:
  - `backend/prisma/migrations/20260925120000_chat_durability_v1` (pre-existing: ChatTurn table, allocator columns)
  - `backend/prisma/migrations/20260930000004_chat_history_integration_024` (durable conversation contract columns + turn ledger; additive only)
- Base path for all routes below: `/api/copilot`
- Owner of canonical logic:
  - `backend/src/services/chatDurableContract024.ts` (projection, cursor, fingerprint, tenant scope; read-pure)
  - `backend/src/services/chatDurablePersistence024.ts` (turn ledger, atomic append, title helper, projection rebuild)
  - `backend/src/services/chatDurableBackfillFixture024A.ts` (backfill + guarded fixture)
  - `backend/src/routes/ai.ts` (HTTP contract)

## AUTH REQUIREMENTS

Every conversation route requires BOTH, in order:

1. `schoolAuthMiddleware` — Bearer JWT. Missing/invalid → `401 { message }`.
2. `requireVerifiedSchoolContext` — verified school context. Missing → `401 { code: 'SCHOOL_CONTEXT_REQUIRED', message }`. Invalid scope → `403 { code: 'SCHOOL_CONTEXT_INVALID' | 'SCHOOL_SCOPE_MISMATCH' | ... }`.

Frontend rules:

- NEVER send `schoolId` in body/query. School comes from verified auth context only.
- Authenticated identity: `req.user.id` = studentId.
- Cross-tenant or legacy null-school access returns `404 { message, code: 'SESSION_NOT_FOUND' }` (never 403, never leaks existence).
- Message limit everywhere: 4000 chars → `413 { message, code: 'MESSAGE_TOO_LONG' }`.

## TYPES (exact)

```ts
type ChatMessageDto = {
  id: string;
  sessionId: string;
  role: 'user' | 'model' | string;
  content: string;
  timestamp: string; // ISO
  messageNumber: number; // stable transcript cursor, 1-based
  turnId?: string | null;
};

type ChatSessionProjection = {
  id: string;
  title: string;                    // stored topic or display fallback
  displayTitle: string;             // == title; use this for UI
  titleVersion: number;             // reject stale title updates against this
  createdAt: string;                // ISO, conversation creation
  updatedAt: string;                // ISO, metadata/storage mutation
  lastMessageAt: string | null;     // ISO, canonical conversation activity
  lastOpenedAt: string | null;      // ISO, navigation/resume activity
  latestVisibleMessagePreview: string | null; // literal latest message text, <=280 chars
  messageCount: number;
};

type TranscriptPage = {
  returnedCount: number;
  hasEarlier: boolean;
  nextBeforeMessageNumber: number | null; // pass as ?before= to page earlier
};

type RecoverableTurn = {
  turnId: string;
  userMessageId: string | null;
  status: 'failed' | 'interrupted';
  retryable: true;
};
```

## CHAT BOOTSTRAP

`GET /api/copilot/chat-bootstrap?limit=60` — read-pure. No Revision/Media/Growth payloads.

Response `200`:

```json
{
  "identity": { "studentId": "u_123", "schoolId": "sch_9" },
  "activeSession": { "<...ChatSessionProjection>": true },
  "transcript": [{ "<...ChatMessageDto>": true }],
  "transcriptPage": { "returnedCount": 42, "hasEarlier": false, "nextBeforeMessageNumber": null },
  "recentSessions": [{ "<...ChatSessionProjection>": true }],
  "hasMoreHistory": false
}
```

- `activeSession`: null when none. `transcript`: latest `<=limit` messages ASC for the resolved session. `recentSessions`: first history page (<=30).
- Errors: `401` auth/school, `500`.

## NEW SESSION

`POST /api/copilot/new-session` — body `{}` (no fields required; any `schoolId` in body is ignored).

Response `200`:

```json
{
  "sessionId": "sess_abc",
  "topic": null,
  "createdAt": "2026-09-30T05:00:00.000Z",
  "updatedAt": "2026-09-30T05:00:00.000Z",
  "conversationState": {},
  "tutorState": {}
}
```

New row records verified `schoolId`. Other sessions for the same school+student are deactivated.

## HISTORY (Recent Study cursor)

`GET /api/copilot/history?limit=30&cursor=<opaque>` — read-pure.

- `limit` default 30, max 100. `cursor` is opaque base64url; never construct it client-side; pass back `nextCursor` verbatim.
- Ordering: `lastMessageAt DESC, id DESC` (null `lastMessageAt` sorts deterministically server-side).
- Title-only changes never move a conversation (recency = `lastMessageAt` only).

Response `200`:

```json
{
  "sessions": [{ "<...ChatSessionProjection>": true }],
  "hasMore": true,
  "nextCursor": "eyJ0IjoiMjAyNi0wMS0xNVQwMDowMDowMC4wMDBaIiwiaWQiOiJzZXNzXzkifQ",
  "pagination": { "page": 1, "limit": 30 }
}
```

- `nextCursor`: null when `hasMore` is false. Cursor is tuple-stable: inserts above the boundary do not duplicate/shift page 2.
- Errors: `400 { message, code: 'INVALID_HISTORY_CURSOR' }` on malformed cursor; `401`; `500`.

## SESSION OPEN (explicit navigation mutation)

`POST /api/copilot/session/:id/open` — the ONLY writer for resume/navigation state.

- Sets `lastOpenedAt` (+ `isActive` resume preference). NEVER changes `lastMessageAt`, title, `titleVersion`, messages, `messageCount`, preview.
- Response `200`: `{ "ok": true, "session": { "<...ChatSessionProjection>": true } }`.
- Errors: `404 { message, code?: 'SESSION_NOT_FOUND' }`; `401`.

Do NOT treat any GET as "open". Call this when the user opens/resumes a conversation.

## SESSION LATEST PAGE (bounded cold load)

`GET /api/copilot/session/:id?limit=60` — read-pure. Default 60, max 100. NEVER returns the full transcript.

Response `200` (session payload + bounded transcript):

```json
{
  "<...ChatSessionProjection>": true,
  "messages": [{ "<...ChatMessageDto>": true }],
  "transcriptPage": { "returnedCount": 60, "hasEarlier": true, "nextBeforeMessageNumber": 941 },
  "recoverableTurn": { "turnId": "turn_7", "userMessageId": "m_100", "status": "interrupted", "retryable": true },
  "conversationState": {},
  "tutorState": {},
  "continuationStatus": null
}
```

- `messages` ASC. `recoverableTurn`: null when no failed/interrupted turn; at most one.
- Errors: `404`; `401`.

## SESSION EARLIER PAGE

`GET /api/copilot/session/:id/messages?before=<messageNumber>&limit=60` — read-pure.

- Returns exact messages with `messageNumber < before`, latest previous page, ASC. No summaries, no timestamp paging.

Response `200`:

```json
{
  "messages": [{ "<...ChatMessageDto>": true }],
  "transcriptPage": { "returnedCount": 60, "hasEarlier": true, "nextBeforeMessageNumber": 881 }
}
```

## SESSION TITLE PATCH

`PATCH /api/copilot/session/:id` — body `{ "title": "New title", "titleVersion": 3 }`.

- `titleVersion` in body is optional; if present and older than stored, server returns `200 { message: 'Stale title ignored', session }` without writing.
- Same-title no-op never increments. Real change increments `titleVersion` exactly once, updates `updatedAt`, NEVER touches `lastMessageAt`.
- Response `200`: `{ "message": "Session updated", "session": { "<...ChatSessionProjection>": true } }`.
- Frontend MUST send last-seen `titleVersion` and MUST ignore/reject responses whose `titleVersion` is older than local.
- Errors: `404`; `401`.

## STREAM CHAT (keep /chat path)

`POST /api/copilot/chat?stream=true` — contract stays on `/chat`. Do NOT use `/live-chat`.

Request body:

```json
{
  "sessionId": "sess_abc",
  "message": "Explain photosynthesis",
  "turnId": "client-stable-uuid-per-turn",
  "editedMessageId": "optional-message-id-when-regenerating-after-edit"
}
```

- `turnId`: REQUIRED, client-generated, stable per turn. Reuse the SAME `turnId` for retries of the same turn. New user sends get a NEW `turnId`.
- `message` max 4000 chars.
- Non-streaming (`?stream` absent/false) returns `200` JSON completion (see done fields below, plus `response`, `topic`, `conversationState`, `videoData`, `sources`, `tutorState`, `assistantMetadata`).
- Conflicts BEFORE generation: `409 { message, code: 'TURN_ID_REUSE_CONFLICT', turnId, retryable: false }` (same turnId, different content) or `409 { message, code: 'SESSION_TURN_IN_PROGRESS', turnId, retryable: true }` (another live turn owns the session; send nothing new, show busy, retry later).
- Completed-turn replay (`200` non-stream): `{ turnId, replayed: true, userMessageId, assistantMessageId }` — no AI call, no new messages.

### SSE ACCEPTED (learner message durable)

```
event: accepted
data: {"type":"accepted","turnId":"...","sessionId":"...","userMessageId":"...","userMessageNumber":101,"requestId":"..."}
```

Emitted only AFTER the learner message is persisted. After this, the learner message survives backend restart.

### SSE STATUS (optional progress)

```
event: status
data: {"type":"status","turnId":"...","status":{"phase":"progress","label":"Working...","timestamp":"..."}}
```

May appear zero or more times. Safe to ignore; never treat as completion.

### SSE TOKEN (incremental)

```
event: token
data: {"type":"token","turnId":"...","content":"..."}
```

Real incremental chunks. Do NOT persist tokens; do NOT treat the last token as completion. Never log contents.

### SSE DONE (durability barrier — completion)

```
event: done
data: {"type":"done","turnId":"...","userMessageId":"...","assistantMessageId":"...","assistantMessageNumber":102,"sessionId":"...","displayTitle":"...","titleVersion":4,"lastMessageAt":"...","latestVisibleMessagePreview":"...","messageCount":102,"metadata":{"messageId":"...","sessionId":"...","topic":"...","state":{},"video":null,"sources":[],"tutorState":{},"assistantMetadata":{}}}
```

INVARIANT: receiving `done` means learner message + assistant message + completed turn ledger + updated projection are ALL committed. Refreshing the transcript MUST show the same completed turn.

### SSE ERROR

```
event: error
data: {"type":"error","turnId":"...","code":"PROVIDER_FAILURE","message":"The study service could not complete that turn. Your message is kept — please retry.","retryable":true}
```

No stack, no private content. Semantic failures never arrive as `done`. Heartbeat `: heartbeat` comments every ~15s carry no JSON.

### Completed-replay stream

Retrying a COMPLETED `turnId` with `?stream=true` returns a minimal stream: replay `done` with `{ type:'done', turnId, sessionId, userMessageId, assistantMessageId, replayed: true }`. No tokens. Reconcile IDs, do not duplicate UI bubbles.

## RECOVERABLE TURN (session response shape)

`recoverableTurn: { turnId, userMessageId, status: 'failed'|'interrupted', retryable: true } | null` on `GET session/:id`. When non-null, show Retry for that turn; retry with the SAME `turnId` (reuses the persisted learner message; never creates a second one).

## EDIT (latest learner turn only)

`POST /api/copilot/messages/:id/edit` — body `{ "content": "revised text" }`.

- Only the latest valid learner turn is editable. Historical edits → `409 { message, code: 'LATEST_LEARNER_EDIT_ONLY' }`.
- Non-user targets → `400`. Attachment messages → `409` (not editable in place yet).
- Success `200`: bounded session snapshot (same shape as SESSION LATEST PAGE: projection + `messages` <=60 ASC + `transcriptPage`). The edited learner message is ALWAYS in `messages`; downstream assistant messages are removed per existing edit semantics. If the server cannot confirm the edit, it returns `500` (never claims success).
- After confirmed persistence, regenerate by sending a NEW `turnId` via `/chat` per the existing regenerate flow.

## DELETE

`POST /api/copilot/session/:id/delete` — response `200 { message: 'Session deleted' }`.

After success: session GET → `404`; absent from history and search; turn-ledger rows removed/inaccessible; messages cascade-deleted; session cache evicted; session-scoped vector delete attempted (best-effort — see gaps).

## SEARCH (learner-safe keyword)

`GET /api/copilot/search?q=<term>&limit=10&cursor=<optional>` — read-pure. Searches display titles + literal message content only. NEVER hidden metadata/checkpoints/teacher fields.

Response `200`:

```json
{
  "results": [{ "<...ChatSessionProjection>": true, "source": "keyword", "relevance": 0.5 }],
  "hasMore": false,
  "nextCursor": null
}
```

- `limit` default 10, max 50. Cursor is the same opaque tuple codec as history; malformed → `400 { message, code: 'INVALID_HISTORY_CURSOR' }`.
- `mode=semantic|hybrid` → `400 { message, code: 'SEMANTIC_SEARCH_UNAVAILABLE' }` (vectors not proven school+student scoped — DB keyword path is canonical).
- Missing `q` → `400 { message, code: 'SEARCH_QUERY_REQUIRED' }`.

## CAPABILITY FIELDS

- `continuationStatus`: SUPPORTED (`string | null` on session payload; null = no gate).
- `canSend`: NOT_SUPPORTED (no such field; send is allowed unless a 409 turn conflict says busy).
- `canContinueInNewChat`: NOT_SUPPORTED.
- `branchCount` / `maxBranches`: NOT_SUPPORTED (lineage columns exist in storage for future use; no API).
- Fixed conversation cap: NONE (do not invent one).

## CLOCK SEMANTICS (frozen)

- `createdAt` = conversation creation. `updatedAt` = metadata/storage mutation. `lastMessageAt` = canonical learner/tutor message activity ONLY. `lastOpenedAt` = navigation/resume ONLY.
- Title update / session open / checkpoint-tutor-state update NEVER change `lastMessageAt`. Only message appends change it.

## TITLE VERSION LAW

Every stored title mutation increments `titleVersion` exactly once. GETs never persist titles. Display fallbacks (`displayTitle` derived from first user message when topic is a placeholder) are response-only. Frontend rejects stale title writes/updates using `titleVersion`.

## PAGING LAW

- History: cursor tuple `(lastMessageAt, id)`, opaque to frontend, `limit`<=100.
- Transcript: `messageNumber` cursor (`?before=`), `limit`<=100, ASC display order. `hasEarlier=false` + `nextBeforeMessageNumber=null` means top reached.

## IDEMPOTENCY LAW

One `turnId` = one learner message + at most one assistant completion. Same `turnId`+same content → deterministic acquire/replay. Same `turnId`+different content → `409 TURN_ID_REUSE_CONFLICT` (generate a new `turnId`). Different `turnId` while one is live → `409 SESSION_TURN_IN_PROGRESS` (nothing persisted for B).

## INTERRUPTION LAW

Client Stop/disconnect before assistant persistence marks the turn `interrupted`, clears session ownership, keeps the single learner message, persists NO assistant message, and blocks any late completion from writing. Retry the SAME `turnId` to resume; it reuses the learner message and can complete exactly once.

## TENANT LAW

Ownership = verified `schoolId` + authenticated `studentId` + resource id on every lookup/mutation. Legacy `schoolId=null` rows are invisible to live endpoints until backfilled. `req.user.id` is NOT assumed globally unique across schools.

## KNOWN BACKEND GAPS (truthful, 024B must not depend on these)

1. `REAL_MODEL_STREAM = BLOCKED_CREDENTIALS` in this environment: streaming contract is implemented and unit/source-proven, but no live model-backed SSE turn was exercised here (no provider credentials configured in this worktree). 024B must run the live-stream check with credentials.
2. Session-scoped Pinecone vector purge on delete is best-effort: attempted with `{ sessionId }` filter; if the vector client cannot prove deletion, backend reports success of canonical deletion only. `SEMANTIC SEARCH = BLOCKED_TENANT_SCOPE` (chat vectors carry studentId only).
3. Concurrent-append DB race proof and multi-process turn-race proof were verified by code/contract tests, not against a live Postgres in this task (no test database provisioned). Unique `(sessionId, messageNumber)` + `(sessionId, clientTurnId)` constraints are the runtime defense.
4. `GET /preload` remains for older clients (read-pure) — 024B MUST use `/chat-bootstrap`.
5. Legacy `GET /session/:id/tutor-state` and `PUT /session/:id/tutor-state` exist without the verified-school guard (pre-existing paths, outside the frozen 024A family). 024B must not use them for chat-critical state.

## 024B FRONTEND MIGRATION CHECKLIST

1. Replace `/preload` boot with `GET chat-bootstrap`; render `transcript` + `transcriptPage`; keep `nextBeforeMessageNumber` for scroll-up paging via `GET session/:id/messages?before=`.
2. Replace offset/page history with cursor history (`sessions/hasMore/nextCursor`); order UI by `lastMessageAt`; never move rows on title updates; gate title renders on `titleVersion`.
3. Generate a stable `turnId` (uuid) per user send; persist it with the pending bubble until `done`/`error`; reuse it for Stop-retry; mint a new one per new send.
4. SSE parser: handle named events `accepted/status/token/done/error` with JSON `type` fields; `accepted` → mark learner bubble durable (`userMessageId/userMessageNumber`); `token` → append; `done` → commit both IDs + projection (`displayTitle/titleVersion/lastMessageAt/preview/messageCount`); `error` → mark retryable per `code`.
5. On `409 SESSION_TURN_IN_PROGRESS`: keep composer locked-busy, persist nothing, offer retry. On `409 TURN_ID_REUSE_CONFLICT`: mint a fresh `turnId` (do not auto-resend same id).
6. Surface `recoverableTurn` as Retry (same `turnId`). After edit success, regenerate with a NEW `turnId` via `/chat`.
7. Call `POST session/:id/open` on conversation open (not a GET side effect). PATCH titles with last-seen `titleVersion`; ignore stale.
8. Search UI uses `results/hasMore/nextCursor`; never request `mode=semantic`.
9. Previews use `latestVisibleMessagePreview` verbatim; never summarization/checkpoint fields.
