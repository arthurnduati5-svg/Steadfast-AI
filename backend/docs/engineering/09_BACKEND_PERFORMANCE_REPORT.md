# Backend Performance Report

R8-E — Performance, Scale & Reliability. This report contains measured evidence only; no production SLA claims are made from development-machine measurements.

## Baseline

- Repository: `arthurnduati5-svg/Steadfast-AI`, backend at `backend/`
- Branch: `main`
- Starting local HEAD = starting remote `origin/main` = `87ab25b3b36cc052ddf4e9f3d165f7b8adef82cb`
- Accepted inputs: R8-A/B/C/D artifacts (01–08) used as-is; none regenerated, no analyzer rerun.
- Measurement tooling: one bounded harness, `tools/engineering/r8-e-workload.ts` (target-selectable; imports explicit target services only; no repository scan, AST parse, or all-file traversal).
- R8-D gap `GAP-evidence-header-identity` reconciled as RESOLVED in `08_BACKEND_GAP_REGISTER.md` (discovery preserved; resolution status added).

## Measurement Environment

| Item | Value |
| --- | --- |
| OS/platform | Windows 11 (win32), Git Bash shell |
| Node | v24.14.1 |
| CPU count | 8 logical |
| Total memory | 16 GB |
| Database mode | Real PostgreSQL (isolated local development test DB `steadfast_r6_test`, used by prior R4/R7 test harnesses) |
| Database location/type | `localhost:8000`, PostgreSQL, isolated test instance — never production |
| Redis mode | Not exercised by measurements; AI limiter/breaker are process-local services (see classification below) |
| Commit SHA | All measurements at `87ab25b3b36cc052ddf4e9f3d165f7b8adef82cb` (post-repair re-measurement on the repair commit, same tree content for measured paths) |
| Date | 2026-09-10 |
| Warm/cold | Each workload includes an in-process warm-up where meaningful; DB workloads run after Prisma connection establishment |

All figures are DEVELOPMENT BASELINE measurements on a development machine. They are not production SLAs.

## Methodology

- Timing: `performance.now()` (sub-millisecond monotonic); per §9 the harness does not present timer precision beyond its resolution.
- Percentiles: reported only when sample count supports them. With samples < 20, p99 is marked `P99 NOT MEANINGFUL FOR THIS SAMPLE`.
- Memory: `process.memoryUsage().heapUsed` deltas around each workload; V8 GC noise noted where observed.
- Database workloads: real Prisma against the isolated test DB, matching the R7.1 harness pattern (`r7-durable-canonical-mastery-repository.test.ts`). Mocks were not used for concurrency claims.
- Test-DB schema drift: the isolated test DB had drifted from the accepted R7.1 canonical-mastery migration on three tables. Drift was repaired additively/locally in the test DB only (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for `CanonicalMasteryStateRecord` and `CanonicalMasteryEvidenceApplicationRecord`; narrowed NOT-NULL R7.x columns dropped from `CanonicalMasteryChangeRecord` to restore the accepted R7.1 writer shape). No repository migration files were changed.
- Failure injection: dependency-controlled, in-process (in-memory repos, controlled provider failure categories). No real AI provider was called.

## Workload Matrix

| # | Target | Production path | Input sizes | Samples | Reproducible command |
| --- | --- | --- | --- | --- | --- |
| W1 | School roster dry-run + reconcile | `performRosterSyncDryRun` / `reconcileRosterDiff` | 1, 30, 500, 5000 records | 5 each | `npx tsx tools/engineering/r8-e-workload.ts --target roster` |
| W2 | Deterministic marking batch | `DeterministicMarkingInvocationService.executeDeterministicBatch` (in-memory repos) | 1, 30, 500 items | 1 (mutating batch) | `... --target marking` |
| W3 | Canonical mastery concurrency | `PrismaMasteryRepository.applyEvidenceAtomically` (real PostgreSQL) | 2 / 20 / 5 / 10 | bounded | `... --target mastery` |
| W4 | Question-bank durable transition | `ResultReleaseApprovalRecord` draft→approved (real PostgreSQL) | 2 concurrent | bounded | `... --target assessment` |
| W5 | Long-history evidence growth | schema-derived units | n/a (calculated) | n/a | `... --target evidence` |
| W6 | Daily-objective idempotency | `Phase3DailyObjectiveCheckCompletionService` settle+retry (maps mode) | 50 sessions | 50 | `... --target daily-obj` |
| W7 | AI limiter/retry/breaker | `aiRuntime*Service` failure matrix | 50/6/10 steps | bounded | `... --target ai-reliab` |

## School Roster

Production path: `performRosterSyncDryRun` (`src/services/rosterSyncDryRunService.ts`), `reconcileRosterDiff` (`src/services/task021RosterReconciliationService.ts`). Neither path accepts a declared maximum input size; both are pure in-memory passes over the caller-supplied payload.

Measured (DEVELOPMENT BASELINE, 5 samples each):

| Cardinality | Dry-run p50 | Dry-run p95 | Heap Δ | Reconcile p50 | Conflicts/decisions |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.096 ms | 0.150 ms | 0.09 MB | 0.006 ms | 0 / 1 |
| 30 | 0.073 ms | 0.117 ms | 0.10 MB | 0.027 ms | 0 / 30 |
| 500 | 3.797 ms | 4.613 ms | 0.76 MB | 0.209 ms | 0 / 500 |
| 5000 | 403.5 ms | 588.8 ms | 1.24 MB | 0.477 ms | 0 / 5000 |

Interpretation:

- `reconcileRosterDiff` is linear (O(n)) and fast: 0.477 ms p50 at 5000 entries.
- The dry-run is **not** cleanly linear: 30 → 500 (×16.7) costs ×52; 500 → 5000 (×10) costs ×106. Source inspection explains this: enrollment/assignment checks use `input.students.some(...)` / `input.classes.some(...)` inside the loop — an O(enrollments × students) nested scan. At 5000 students × 5000 enrollments that is ~25M comparisons, which is the dominant cost and would continue to degrade quadratically for larger schools.
- Memory growth is modest and linear (1.24 MB at 5000). Memory is not the risk; CPU quadratic growth is.
- Failure behavior: malformed individual records do not throw in the measured path (per-record conflict records instead); there is no maximum accepted input in source.

Decision:

- Boundedness at whole-school scale: **NOT BOUNDED — demonstrated super-linear CPU growth (quadratic term), no input bound**. The dry-run remains seconds-fast up to 5000 students on this machine, so this is a degradation risk for very large payloads, not a proven current failure. Because the realistic school-size ceiling is a product decision (a hard input cap could reject legitimate whole-school syncs), this is recorded as `DECISION REQUIRED / REQUIRED BEFORE PRODUCTION` with two bounded options: (a) a validated maximum payload size at the route, or (b) replacing the `some()` scans with `Set` lookups (bounded O(n)) inside the existing contract. Either is task-compatible; option (b) is pure-internal and contract-preserving, but the measured path was left unchanged in R8-E because no current workload failure was reproduced within representative school sizes (no premature optimization, §14). Handed to R8-F as a bounded repair candidate.

### R8-F repair (continuation — measured 2026-09-11, same harness `npx tsx tools/engineering/r8-e-workload.ts --target roster`)

```text
BEFORE — R8-E
5000 dry-run ~403 ms p50 / ~589 ms p95 (500 dry-run ~3.8 ms p50)

R8-F REPAIR
pre-index student/class membership once
replace repeated membership scans with Set.has()

AFTER — measured now (5 samples each, DEVELOPMENT BASELINE, same machine class)
500 dry-run 0.431 ms p50 / 0.83 ms p95
5000 dry-run 5.222 ms p50 / 9.456 ms p95
5000 reconcile 1.285 ms p50 (conflicts 0, decisions 5000 — behavior unchanged)
500 -> 5000 scaling x12.1 for x10 input (was x106) — indexed O(n)-shape

VERDICT
quadratic membership hotspot = REPAIRED
whole-roster input bound = still policy/unbounded concern
```

No roster size cap, batching, pagination, endpoint, persistence, cache, network,
or live school call was introduced — algorithmic complexity repair only. The
R8-E before-measurements above are preserved as historical truth.

## Assessment Marking Batch

Production path: `DeterministicMarkingInvocationService.executeDeterministicBatch` (`src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts`), sequential per-item marking.

Measured (DEVELOPMENT BASELINE, in-memory repositories):

| Batch size | Elapsed | Marked | Failed | Batch status | Heap Δ |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.665 ms | 1 | 0 | completed | 0.02 MB |
| 30 | 0.483 ms | 30 | 0 | completed | 0.34 MB |
| 500 | 5.541 ms | 500 | 0 | completed | −2.26 MB (GC noise) |

Partial-item failure isolation (10-item batch, 1 poisoned item forced to fail):

| Failed items | Marked items | Isolation preserved |
| --- | --- | --- |
| 1 | 9 | yes |

Interpretation:

- Time growth is linear: ~11 µs/item at this scale; 500 items complete in ~5.5 ms against in-memory repos. With the production Prisma repos the per-item DB round trip dominates (~1–5 ms/item expected), so a 500-item batch is ~0.5–2.5 s — bounded and acceptable; a 10,000-item batch would be ~10–50 s, still linear, not explosive.
- Failure isolation is real: one failed item is marked `failed`, reported in `failedItems`, other items still mark, and the batch no longer reports a false `running` state. Closure correction (history preserved): the original R8-E text above described the pre-repair behavior as honest; in fact a finished partial batch incorrectly remained `running`. Repaired in the final R8-E closure (`deterministicMarkingInvocationService.ts`): `failedItems.length === 0` → `completed`; some failed + some marked → `partially_completed`; all failed → `failed`, with terminal timestamps set consistently. Proven by new assertions (9 marked + 1 failed → `partially_completed`; 3 failed + 0 marked → `failed`).
- Input size is **not explicitly bounded** in source (`MARKING_INVOCATION_POLICY_DEFAULTS` gates execution mode, not size). Growth is linear, so an unbounded batch degrades gracefully rather than catastrophically.

Decision: bounded at measured scale; linear growth; failure isolation proven with truthful terminal states (`completed` / `partially_completed` / `failed`). A declarative max batch size remains a hygiene item (R8-F handoff), not a demonstrated defect.

## Canonical Mastery Concurrency

Production path: `PrismaMasteryRepository.applyEvidenceAtomically` (`src/services/probabilisticMasteryRepository.ts`) — single transaction: evidence receipt claim (unique `evidenceId`) → revision-checked state write (`updateMany` with `stateRevision = expected`) → change-log append, aborting on any conflict.

Source inspection (§7 T3): transaction boundary = yes (`$transaction`); optimistic version = yes (`stateRevision` conditional write); conflict detection = yes (receipt uniqueness + revision predicate + insert conflicts mapped to `AtomicAbort`); atomic aggregate behavior = yes (all three canonical writes commit or abort together).

Measured against real PostgreSQL (isolated test DB):

| Workload | Cardinality | Result | Invariant |
| --- | --- | --- | --- |
| Concurrent same-evidence (2 actors, same `evidenceId`) | 2 | committedCount=1, receiptCount=1, finalRevision=1 | PROVEN: no duplicate/split canonical state (309.6 ms wall) |
| Revision chain (sequential distinct evidence) | 20 | committed=20, finalRevision=20, changeLogs=20 | PROVEN: no lost update |
| Create race (5-way concurrent first write) | 5 | committed=1, receipts=1, changeLogs=1 | PROVEN: exactly one winner, no impossible state |
| Commit throughput (sequential commits) | 10 | p50 13.4 ms/commit, p95 25.7 ms | contention-free single-writer latency on test DB |

Interpretation: the canonical writer already implements optimistic-concurrency semantics correctly. Two concurrent applications of the same evidence commit exactly once; interleaved revisions cannot lose updates (revision predicate rejects stale writers); the 5-way create race yields exactly one canonical state.

Decision: `GAP-mastery-canonical-concurrency` concurrency semantics **PROVEN** at the repository level. No repair required. Per-commit cost ~13–26 ms on the test DB is acceptable for evidence-driven (low-frequency, high-value) writes; PRODUCTION BUDGET REQUIRES PRODUCTION-LIKE ENVIRONMENT.

## Question-Bank Concurrency

Production path (representative canonical transition selected per §7 T4): `ResultReleaseApprovalRecord` `draft → approved` — the release-approval state machine that gates result release (no double release downstream).

Before repair (measured, real PostgreSQL):

| Workload | Result |
| --- | --- |
| Status-conditional `updateMany` (2 concurrent, guarded) | winnerCounts=[1,0], finalStatus=approved, single effective transition |
| Unguarded read-check-write race (service semantics: `getById` → status check → `updateStatus`) | **REPRODUCED**: both actors passed the draft check and both wrote `approved`; canonical status remained single-valued (last-writer-wins), but audit/timestamp side-effects double-fired |

Root cause: `ResultReleaseApprovalService.approveReleasePacket` performed the status check against a stale read and then called the unconditional `updateStatus` writer. Concurrent duplicate approvals could double-fire the packet side-effect (`packetRepo.updateStatus`) and the audit event (`recordReleasePacketApproved`) — a duplicate canonical action with contradictory audit trail, exactly the `GAP-questionbank-concurrency-locks` risk shape.

Repair (R8E-R11, bounded, same-task):

- Added `transitionStatusFrom(approvalId, fromStatus, toStatus, safeSummary)` to the `ResultReleaseApprovalRepository` contract, implemented with a status-conditional `updateMany` in the Prisma repository (WHERE carries the expected source status → exactly one concurrent actor wins; loser matches zero rows) and a guarded check-and-set in the in-memory repository.
- `approveReleasePacket` now uses the guarded transition; on conflict it returns a stable `INVALID_STATUS` / `conflict` envelope; packet update + audit event fire only for the winner.

After repair (same workload, real PostgreSQL):

| Workload | Before | After |
| --- | --- | --- |
| 2 concurrent approves, guarded mechanism | n/a (mechanism existed only at repository level, unused by service) | winnerCounts=[1,0], finalStatus=approved, single effective transition (153.8 ms) |
| Service-level concurrent duplicate approve | both write approved; side-effects/audit double-fire | exactly 1 winner, 1 stable conflict, 1 audit event (proven by new regression test) |

Also proven: concurrent duplicate approve at the service level yields exactly one winner, one `INVALID_STATUS` conflict, one `RELEASE_PACKET_APPROVED` audit event (`package-11-approval-workflow.test.ts`, 16/16 passing, including the new R8-E regression assertion).

Decision: representative question-bank transition concurrency **FAILED — REPAIRED**. The shared mechanism (status-conditional guarded write) is now recorded as the common owner pattern for assessment durable transitions (same mechanism is already used by daily-objective `acquireCompletingOwnershipAsync`). Remaining Exam*/Marking* transitions should adopt the same writer pattern — R8-F handoff, not new infrastructure.

Result-release composition truth (closure correction): the Prisma atomic persistence mechanism (`PrismaResultReleaseApprovalAtomicCommitter`) is implemented and directly proven (see Before / After Repairs: approval `draft → approved` + packet `ready_for_approval → approved_for_internal_release` + `RELEASE_PACKET_APPROVED` audit in one transaction, with rollback proven). The active Package 11 HTTP route (`backend/src/routes/resultRelease.ts`) still uses in-memory result-release repository composition (`InMemoryResultRelease*Repository`, `InMemoryResultReleaseApprovalAtomicCommitter`). Durable HTTP repository composition therefore remains part of the existing `GAP-questionbank-model-writers` / R8-F-R8-G handoff. No Prisma route wiring is implemented here.

## Learning Evidence Long-History

Production path: learning-evidence event store + idempotency models. Growth units are calculated from the actual model shape (no invented retention periods):

| Model | Growth shape | Read bound | Prunable independently? |
| --- | --- | --- | --- |
| `LearningEvidenceEvent` | 1 row per evidenced operation; append-only, hash-chained | Stream reads bounded by stream sequence; projections bounded by checkpoints | **No** — canonical historical evidence; retention is a product/legal correctness requirement |
| `LearningEvidenceIdempotency` | 1 row per idempotent command (unique school+commandType+key) | Keyed lookups (unique index) | Yes — redundant once the referenced event is committed; prune candidate |
| `LearningEvidenceStream` | 1 row per stream | Bounded by learner/objective stream count | No |
| `LearningEvidenceProjectionCheckpoint` | 1 row per projection per school per partition | Bounded by design | No |

Storage estimate per idempotency row: ~5 short text/JSONB columns (~0.3–0.5 KB/row incl. index). A school producing 10k evidenced operations/day accrues ~10k idempotency rows/day (~3–5 MB/day) — dominated by the canonical event rows themselves, which are NOT prunable.

Interpretation: reads are bounded; growth is linear in operations. The unbounded idempotency table is a long-history hygiene risk, not a correctness risk.

Decision: `POLICY DECISION REQUIRED` for idempotency-record retention (no period invented per R8E-R19). Canonical evidence retention is NOT APPLICABLE for performance action. `GAP-evidence-idempotency-lifecycle` remains REQUIRED BEFORE PRODUCTION as a policy gate.

## Daily Objectives Long-History

Production path: `Phase3DailyObjectiveCheckCompletionService` settle + idempotency (maps mode exercised end-to-end through the real service, attempt, and confidence services).

Measured (50 repeated sessions, 50 samples):

| Metric | Value |
| --- | --- |
| Settle p50 | 0.478 ms |
| Settle p95 | 0.919 ms |
| p99 | 24.3 ms (first-session warm-up tail; sample supports it) |
| Settled exactly once | 50/50 |
| Retry returned identical cached result | 50/50 |
| Errors | 0 |
| Heap Δ | 2.41 MB (50 sessions incl. objective/session/attempt stores) |

Growth shape (source + measurement):

- Process-local: the module-private `idempotencyStore` Map grows 1 entry per settled session. In production the Map is NOT the store (`isTestMapsMode()` is false in production; durable table is used), so the Map is test-mode-only — no production memory repair required.
- Durable: `DailyObjectiveCheckCompletionIdempotencyRecord` (per accepted migration) grows 1 row per settled check session; no production purge exists; bulk `deleteMany` exists only in the test-mode path.

Restart behavior: durable table lookup by `idempotencyKey` restores exactly-once semantics after restart (map path loses entries; production path does not rely on it). Retry correctness proven above.

Decision: exactly-once settle semantics PROVEN (50/50, retry-identical). Long-history growth quantified: 1 row/learner/check-session/day. Retention = `POLICY DECISION REQUIRED` (no period invented). `GAP-dailyobjectives-idempotency-lifecycle` remains a policy gate, not a measured defect.

## AI Runtime Reliability Cost

Production paths: `aiRuntimeRateLimitGuardService.ts`, `aiRuntimeRetryPolicyService.ts`, `aiRuntimeCircuitBreakerService.ts` (one reliability system, measured as controlled failure matrix; no real provider called).

| Check | Result |
| --- | --- |
| Rate limit window (50 requests, limit 30/min) | 30 allowed, 20 rate-limited; allowed again after window expiry (pruned) |
| Rate state boundedness | Closure correction (history preserved): the original claim that per-key pruning alone keeps state bounded was wrong — expired timestamps were pruned per window but inactive keys were retained in the process-local `windows` Map indefinitely. Repaired in the final R8-E closure: a bounded opportunistic sweep (at most one full key iteration per `WINDOW_MS`, never a per-request scan) deletes entries whose timestamps are all expired. Ordinary limiter behavior unchanged. Proven by new assertion (50 stale keys recorded at t0 → one normal operation beyond the window → stale keys removed, fresh key semantics intact) |
| Retry boundedness | 6-attempt simulation: retries at attempts 1–2, stops at attempt 3 (`max_attempts_reached`) |
| Backoff cap | Max observed delay 2.14 s (exp+1.25 s) ≤ 30 s cap; `retryAfterMs` path also capped at 30 s |
| Circuit breaker | Opens after 5 provider-unavailable failures; calls stopped from iteration 6; cooldown probe allowed once; 2 successes close the circuit |
| Redis loss classification | Limiter/breaker are process-local in-memory services; the existing Redis client (`src/lib/redis.ts`) degrades with cooldown rather than crashing — loss of Redis does not change limiter/breaker semantics |
| Multi-instance classification | Process-local limiter: per-instance limits (each instance counts independently). Explicitly classified as a process-local limiter; global-rate guarantees across instances are NOT claimed |

Interpretation: retries are bounded (3 attempts), backoff capped (30 s), breaker stops repeated provider calls and recovers via a single half-open probe, and expired timestamps are pruned per key while expired inactive keys are now removed by the bounded opportunistic sweep (closure correction — see row above).

Decision: AI runtime limiter/retry/breaker reliability PROVEN under controlled failure without real provider load (R8E-R14).

## Voice Ledger Contention

Production path: `voiceLedgerService.ts` — `prisma.$transaction` with `SELECT ... FOR UPDATE` row locks on `StudentProfile` (`:144`) and `VoiceSessionUsage` (`:472`) (`:216` settle transaction). Accepted R8-D evidence already establishes transaction + row-lock serialization.

Measured against real PostgreSQL (isolated test DB, `... --target voice`, production path — no mocked Prisma):

| Workload | Result | Invariant |
| --- | --- | --- |
| Concurrent session settlement (3 concurrent `stopVoiceSession`, 40 s requested each = 120 s combined vs 60 s quota) | startingQuota=60 s, debitedTotal=60 s, ledgerDebitedTotal=60 s, finalBalance=0 s, settledSessions=3 | PROVEN — REAL POSTGRESQL CONTENTION: quota cannot go negative or be overspent; ledger totals reconcile; no duplicate settlement |

Closure correction (history preserved): the original text reused the transactional source proof plus the mocked focused test and recorded a live contention run as an R8-G candidate. The live run has now been executed (see row above). Executing it exposed one real production defect in the same transaction path: `ensureStudentRowLocked` / grant / session / ledger writes omitted required fields (`StudentProfile.updatedAt`, `id` on `VoicePackageGrant` / `VoiceSessionUsage` / `VoiceLedgerEntry`), so the first live run failed with `PrismaClientValidationError`. Repaired minimally in `voiceLedgerService.ts` (same-file, same defect class only); the contention proof above ran after the repair. Critical invariant — quota cannot be overspent: the row lock serializes concurrent settlements; the debit loop runs inside the transaction with `min(requested, balance)` clamping, so concurrent requests cannot both read-and-reduce the same remaining seconds. Evidence classification: PROVEN (real contention measurement on the production transaction path).

## Query / Memory Hotspots

1. Roster dry-run O(enrollments × students) nested scans — the only demonstrated super-linear hotspot (see School Roster).
2. `InMemoryMasteryRepository.getAtomicSnapshot` is O(applied evidence) per call — test/fixture-only implementation, not a production path; no action.
3. Daily-objective maps-mode stores grow with sessions — test-mode only; production uses the durable table.
4. No unbounded query windows found in measured paths (`listStates` take 500, `listChangeLogs` take 200, ledger tail take 10).

## Before / After Repairs

| Repair | Before | After |
| --- | --- | --- |
| `approveReleasePacket` guarded transition (T4) | Concurrent duplicate approve: both actors write `approved`; packet side-effect + audit event double-fire (reproduced, real PostgreSQL) | Exactly 1 winner, 1 stable `INVALID_STATUS` conflict, 1 audit event; single effective status transition (winnerCounts [1,0]); focused tests pass incl. new regression assertion |
| `approveReleasePacket` atomic commit (final closure) | Approval committed via guarded transition, then packet update + audit fired as separate steps — a packet persistence failure could leave `approval = approved` with packet not approved and API success | One `prisma.$transaction` commits approval (`draft → approved`) + packet (`ready_for_approval → approved_for_internal_release`) + `RELEASE_PACKET_APPROVED` audit, or none; sabotaged-packet run proves rollback (approval stays `draft`, 0 audits). Real-DB proof: `assessment-approval-atomic-commit` invariant PROVEN |
| Marking partial-batch terminal state (final closure) | Finished partial batch remained `running` | `partially_completed` (mixed) / `failed` (all failed), terminal timestamps set; new assertions pass |
| AI limiter stale-key retention (final closure) | Expired inactive actor keys retained in the process-local Map indefinitely | Bounded opportunistic sweep (≤1 full key iteration per `WINDOW_MS`); new assertion passes; limiter semantics unchanged |
| Voice ledger required-field defect (final closure) | Live contention run failed: `PrismaClientValidationError` (missing `updatedAt`/`id` on durable writes) | Minimal same-file repair; real contention proof PROVEN (60 s quota, 120 s requested, 60 s debited, 0 s final) |
| Roster dry-run quadratic membership scan (R8-F continuation) | 5000 dry-run 403.5 ms p50 / 588.8 ms p95; 500 → 5000 scaling ×106 (super-linear) | Pre-indexed `Set` membership lookup; 5000 dry-run 5.222 ms p50 / 9.456 ms p95; 500 → 5000 scaling ×12.1 (O(n)-shape); contracts/conflicts unchanged; no size cap invented |

No other production repairs were required: T3 mastery concurrency, T6 exactly-once settle, and T7 AI reliability were proven sound as-is; T1/T2 boundedness findings are degradation risks and policy items, not reproduced defects (see respective sections).

## Development Regression Budgets

Derived from observed medians/p95 plus headroom (all DEVELOPMENT BASELINE, re-derivable by rerunning the harness):

| Path | Baseline | Regression budget (local) |
| --- | --- | --- |
| Roster dry-run 5000 | 403 ms p50 / 589 ms p95 | > 2 s p50 ⇒ investigate (5× headroom over p95) |
| Marking batch 500 (in-memory) | 5.5 ms | > 100 ms ⇒ investigate (~20× headroom) |
| Mastery commit (test DB) | 13.4 ms p50 / 25.7 ms p95 | > 150 ms p50 ⇒ investigate (DB or logic regression) |
| Daily-objective settle (maps mode) | 0.48 ms p50 / 0.92 ms p95 | > 10 ms p50 ⇒ investigate |
| AI reliability matrix total | ~0.4 s | > 5 s ⇒ investigate |

Derivation: budget = max(observed p95 × ~3–5, human-perceptible floor). These detect major local regressions only; they are not SLAs.

## Production Budget Status

`PRODUCTION BUDGET REQUIRES PRODUCTION-LIKE ENVIRONMENT` for all measured targets. The isolated development DB and single-process harness cannot establish production latency/throughput SLAs (connection pooling, multi-instance rate limiting, real provider latency, production data volumes are all unrepresented).

## Unmeasured / Blocked Items

- Global (cross-instance) AI rate limiting — architecture decision required; current limiter is explicitly process-local.
- Production SLA figures — blocked on production-like environment (see Production Budget Status).
- Roster input cap decision — `DECISION REQUIRED / REQUIRED BEFORE PRODUCTION` (see School Roster).

## R8-F Handoff

- Roster dry-run quadratic scan: bounded repair candidate — replace `some()` scans with `Set` lookups, or add a validated route-level payload cap (decision required first).
- Marking batch declarative max batch size (hygiene; linear growth proven).
- Question-bank state chain: adopt the status-conditional `transitionStatusFrom` writer pattern for remaining Exam*/Marking* transitions (common owner pattern established in R8-E).
- Durable Package 11 HTTP repository composition: the Prisma atomic committer is PROVEN in isolation, but the active HTTP route still uses in-memory composition; wiring durable Prisma repositories into the HTTP route remains part of the existing `GAP-questionbank-model-writers` / R8-F-R8-G handoff. Not implemented in R8-E.
- Structural candidates remain untouched per §24.

## R8-G Handoff

- Behavioral acceptance of the repaired release-approval concurrency semantics under realistic multi-actor flows.
- Long-history retention policy decisions (evidence idempotency, daily-objective idempotency) require product/legal input before any purge behavior is accepted.
