# Learning Evidence Ledger Event Store

## Canonical Ownership Decision

The canonical learning evidence event store lives at `backend/src/domains/learning-evidence/`. This is the single source of truth for all learning evidence events.

### Reused Components
- `lib/prisma.ts` — Prisma client
- Existing middleware (`schoolAuthMiddleware`, `requireVerifiedSchoolContext`)

### Extended Components
- `prisma/schema.prisma` — Added 6 models for event store

### Deprecated Duplicate Ownership
- `learningEvidenceLedgerService.ts` — In-memory only, no school scope, no event sourcing. Superseded by the canonical event store.
- `learningEvidenceLedgerContracts.ts` — Superseded by canonical contracts.

### Keep as Specialized Adapters
- `domains/assessment/result-learning-evidence/` — Assessment-result-specific evidence
- Task-specific evidence ledgers (task026-036) — Task-specific implementations

## Event-Store Source-of-Truth Rule

The immutable event ledger is canonical historical truth. Relational current-state records and read models are projections. Historical event rows must never be edited to represent a new decision. Changes happen through new event types.

## Immutable Event Truth

- Events are append-only. No update, delete, replace, or upsert of historical events.
- Event hashes are computed from canonical normalized fields: event type, stream ID, stream sequence, safe payload hash, previous event hash, school ID, learner ID, recorded timestamp, correlation ID.
- No hidden `Date.now()` value inside hash construction.
- The stored event contains the exact values used to generate its hash.

## Projection Model

- Events are immutable historical truth.
- Streams own sequence and latest hash.
- Candidate and committed projections are derived read models rebuilt from events.
- Projection checkpoints track last-processed sequence and hash.
- `clearProjectionsOnly()` is a test-only helper on `InMemoryLearningEvidenceEventStoreRepository`; the production repository contract does not expose it.

## Evidence State Machine

```
candidate → validating → ineligible
                         → review_required
                         → usable → committed → superseded
                                               → retained
```

Only these transitions are valid. Every invalid transition creates no durable or in-memory mutation.

## Event and Projection Contracts

See `contracts/` directory for full type definitions:
- `learningEvidenceEventStoreContracts.ts` — Event types, source taxonomy, state machine, valid transitions
- `learningEvidenceCommandContracts.ts` — Command definitions, typed command results, error codes
- `learningEvidenceProjectionContracts.ts` — Projection state types, rebuild report
- `learningEvidencePrivacyContracts.ts` — Privacy guard rules

## Role Matrix

| Role | Create candidate | Start validation | Commit | Supersede/Retain | Read safe projections | Rebuild/integrity |
|------|-----------------|------------------|--------|-----------------|----------------------|-------------------|
| Student | Self only | ❌ | ❌ | ❌ | Own | ❌ |
| Teacher | ✓ (same school) | ✓ (same school) | ✓ (same school) | ❌ | Same-school learners | ❌ |
| School admin / internal operator | ✓ | ✓ | ✓ | ✓ | Same-school learners | ✓ |
| Parent | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Unknown | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## School and Learner Isolation

Before every mutation, the following are validated:
- `actor.schoolId` matches the source lineage, candidate, committed evidence, and stream schoolId
- `command.learnerId` matches the candidate, committed evidence, and stream learnerId

Cross-school or cross-learner access:
- Fails safely with `EVIDENCE_NOT_FOUND`
- Appends no event
- Modifies no stream
- Modifies no projection
- Reveals no foreign record details

Student self-service authorization compares the requested learner with the verified learner identity in actor context (`actor.learnerId === command.learnerId`). Does not assume `actorId` always equals `learnerId`.

## Privacy Payload Rules

Forbidden fields (rejected recursively):
rawChat, rawConversation, rawStudentAnswer, answerKey, markingScheme,
teacherOnlyNotes, hiddenReasoning, chainOfThought, prompt, providerPayload,
token, password, secret, safeguardingRaw, privateDeenText, parentContact, peerData

## Idempotency and Concurrency

- Idempotency identity: `schoolId + commandType + idempotencyKey`
- Same request hash on replay: returns the original event ID, resource ID, stream sequence; appends no duplicate event.
- Different request hash on same key: returns `EVIDENCE_IDEMPOTENCY_CONFLICT`; appends no event; updates no projection.
- The Prisma idempotency table uses `@@unique([schoolId, commandType, idempotencyKey])`. The repository uses `create` (not `upsert`) to prevent overwriting a conflicting idempotency record.
- Optimistic concurrency: `expectedStreamSequence` must match current stream head. Every mutation, including `CreateEvidenceCandidate`, enforces this. For a new stream, `expectedStreamSequence` must be 0.
- Stale or incorrect sequence returns `EVIDENCE_STREAM_CONCURRENCY_CONFLICT` with no durable or in-memory mutation.

## Event Hashing

Event hash is computed from canonical normalized event fields:
- event type
- stream ID
- stream sequence
- safe payload hash (SHA-256 of canonical JSON)
- previous event hash (empty string for first event)
- school ID
- learner ID
- recorded timestamp (ISO string, generated once per event)
- correlation ID

No hidden `Date.now()` value. The stored event `recordedAt` is the exact value used in hash computation.

## Explicit Dependency Injection

- Route factory `createLearningEvidenceRouter(repo)` requires explicit `LearningEvidenceEventStoreRepository`.
- Routes do not create PrismaClient, repositories, or select persistence mode.
- Routes do not append events, calculate hashes, or assign stream sequences.
- Test composition (`createApp`) explicitly injects `InMemoryLearningEvidenceEventStoreRepository`.
- Production composition (`index.ts`) explicitly injects `PrismaLearningEvidenceEventStoreRepository(prisma)`.
- Missing production persistence configuration fails closed (the function has no default).

## Production Prisma Requirement

- Production uses `PrismaLearningEvidenceEventStoreRepository` wired in `index.ts`.
- No silent fallback to in-memory mode.
- Every mutation uses one Prisma `$transaction` containing:
  1. Event creation (append-only)
  2. Conditional stream advancement (upsert)
  3. Projection update (upsert)
  4. Checkpoint update when applicable
  5. Idempotency record creation (create, not upsert — prevents overwriting conflicting requests)

## Transaction Boundary

Each atomic mutation (`appendEventAtomically`) contains:
1. Create immutable event record
2. Upsert stream (conditional on unique constraint)
3. Upsert candidate projection (when provided)
4. Upsert committed projection (when provided)
5. Upsert checkpoint (when provided)
6. Create idempotency record (fails with unique violation if conflicting key+commandType+hash exists)

If any step fails, the entire Prisma transaction rolls back — no partial state is committed.

## Memory/Prisma Equivalence

Both `InMemoryLearningEvidenceEventStoreRepository` and `PrismaLearningEvidenceEventStoreRepository` implement the same `LearningEvidenceEventStoreRepository` interface. The shared contract proves:
1. First event receives sequence 1
2. Sequence increments correctly
3. Stale expected sequence is rejected
4. Events remain append-only
5. Events returned in sequence order
6. Event hashes and previous hashes form a valid chain
7. Original command events can be retrieved
8. Identical idempotent replay returns the original result
9. Conflicting idempotency reuse fails
10. School isolation works
11. Learner isolation works
12. Candidate projections persist
13. Committed projections persist
14. Projection checkpoints persist
15. Projection replay reconstructs the expected state

## Projection Replay and Repair

The `rebuildProjections` method:
1. Loads learner stream events in order
2. Verifies sequence continuity (no gaps)
3. Verifies hash continuity (previous event hash matches)
4. If sequence or hash gaps exist, returns `blocked`
5. Applies pure reducers to reconstruct candidate and committed projections
6. Compares reconstructed state with stored state
7. Reports `consistent`, `divergence_detected` (read-only), or `repaired` (after write)
8. Authorized repair writes only projections — historical events remain unchanged

## Internal API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/copilot/evidence/candidates | Create evidence candidate |
| POST | /api/copilot/evidence/candidates/:id/validate | Start validation |
| POST | /api/copilot/evidence/candidates/:id/review-required | Require review |
| POST | /api/copilot/evidence/candidates/:id/usable | Mark usable |
| POST | /api/copilot/evidence/candidates/:id/commit | Commit evidence |
| POST | /api/copilot/evidence/evidence/:id/supersede | Supersede evidence |
| POST | /api/copilot/evidence/evidence/:id/retain | Retain evidence |
| GET | /api/copilot/evidence/learners/:id/evidence | List safe projections (requires student/teacher/admin role) |
| GET | /api/copilot/evidence/learners/:id/evidence/:eid | Get one safe projection (requires student/teacher/admin role) |
| POST | /api/copilot/evidence/internal/projections/rebuild | Rebuild projections |
| GET | /api/copilot/evidence/internal/streams/:id/integrity | Verify stream integrity |
| POST | /api/copilot/evidence/internal/seeds | Seed deterministic data |

## Deterministic Seed Strategy

Seed cases cover: independent correct recall, correct after heavy hints, partial with misconception, skipped, teach-back strong, reflection insufficient, provisional assessment, final assessment, integrity review required, teacher observation, cross-school denial, duplicate idempotent, superseded evidence.

## Fifteen-Suite Inventory

1. `learning-evidence-contracts.test.ts` — Type system, transitions, error codes, privacy keys
2. `learning-evidence-privacy.test.ts` — Privacy guard validate/sanitize
3. `learning-evidence-state-machine.test.ts` — Full paths, alternative paths, invalid transitions
4. `learning-evidence-append-only.test.ts` — Sequence increment, event immutability
5. `learning-evidence-idempotency.test.ts` — Same key+hash replay, same key+different hash conflict
6. `learning-evidence-concurrency.test.ts` — New stream sequence=0, stale sequence rejection
7. `learning-evidence-atomicity.test.ts` — Consistent create, rejected command leaves no partial state
8. `learning-evidence-school-isolation.test.ts` — School-A not visible in B, cross-school not found, separate streams
9. `learning-evidence-replay.test.ts` — Empty, after create, after commit, clearing+rebuild repairs
10. `learning-evidence-reconciliation.test.ts` — Missing projection repaired, divergence detection, integrity check
11. `learning-evidence-seed.test.ts` — All scenarios, events readable, per-school isolation
12. `learning-evidence-routes.test.ts` — 400/201/200 HTTP codes, valid data round-trip
13. `learning-evidence-projection-safety.test.ts` — Rebuild repairs, divergence detection, event preservation
14. `learning-evidence-roles.test.ts` — Student self/other, teacher validation, unknown/parent denied, admin rebuild
15. `learning-evidence-no-false-pass.test.ts` — Empty school, failures leave no events, non-existent candidate, invalid transition

## Direct Regression Inventory

No test files outside `src/tests/learning-evidence-domain` directly import from the canonical event store (`domains/learning-evidence/`). External references to `learningEvidenceLedgerService` or `learningEvidenceLedgerContracts` import the deprecated Phase 2 ledger, not the canonical event store.

## Verification Commands

```bash
# Task-scoped TypeScript
cd backend && npx tsc -p tsconfig.learning-evidence-event-store.json --noEmit --incremental false

# All fifteen Learning Evidence suites
cd backend && npx vitest run src/tests/learning-evidence-domain --pool=threads

# Prisma
cd backend && npx prisma validate --schema prisma/schema.prisma
cd backend && npx prisma generate --schema prisma/schema.prisma

# Integrity scans
Get-ChildItem -Recurse -File src/domains/learning-evidence | Select-String -Pattern "\.skip|\.todo|\.only"
Get-ChildItem -Recurse -File src/domains/learning-evidence | Select-String -Pattern "@ts-ignore|@ts-nocheck"
```

## Deferred Live Integrations

- Real tutor, Question Bank, Revision, Growth, AI, and school system connections
- Probabilistic mastery calculation (future mastery engine will consume committed evidence)
- Retention duration policy
- Physical deletion policy
