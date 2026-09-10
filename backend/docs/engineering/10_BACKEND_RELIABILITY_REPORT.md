# Backend Reliability Report

R8-E — Performance, Scale & Reliability. Every claim cites source inspection, runtime measurement (see `09_BACKEND_PERFORMANCE_REPORT.md` for methodology/environment), or a rerunnable proof. Dispositions use the frozen vocabulary: PROVEN / PROVEN WITH LIMIT / FAILED — REPAIRED / FAILED — REMAINS / BLOCKED / NOT APPLICABLE.

## Baseline

- Repository: `arthurnduati5-svg/Steadfast-AI`, backend at `backend/`
- Branch: `main`; starting local/remote HEAD `87ab25b3b36cc052ddf4e9f3d165f7b8adef82cb`
- Inputs: accepted R8-A/B/C/D artifacts (08 gap register, 07 completeness matrix, 06 algorithm register) + targeted production source + bounded runtime proofs
- R8-D reconciliation: `GAP-evidence-header-identity` marked RESOLVED in `08_BACKEND_GAP_REGISTER.md` with the original discovery preserved; resolution commits `89c00419571d325efe9c03ede5db865ab2617e62`, `87ab25b3b36cc052ddf4e9f3d165f7b8adef82cb`
- One reproduced defect repaired in R8-E (result-release approval concurrency); before/after evidence in §Resolved R8-E Defects

## Reliability Invariants

| Invariant | Where | Status |
| --- | --- | --- |
| No duplicate/split canonical mastery state | `PrismaMasteryRepository.applyEvidenceAtomically` | PROVEN (concurrent same-evidence 2-way: 1 commit, 1 receipt, revision 1) |
| No lost mastery update under interleaving | revision-conditional `updateMany` | PROVEN (20-revision chain: 20 commits, 20 change logs, final revision 20) |
| Exactly-once evidence application | `canonicalMasteryEvidenceApplicationRecord` unique `evidenceId` | PROVEN (insert-conflict → `AtomicAbort` → `false`; 5-way create race: exactly 1 winner) |
| Assessment canonical transition cannot double-fire | result-release approval `draft → approved` | FAILED — REPAIRED (was read-check-write; guarded transition, then final atomic approval+packet+audit transaction, see Resolved R8-E Defects) |
| Daily-objective settle exactly once | idempotency record + `acquireCompletingOwnership` | PROVEN (50/50 settle, 50/50 retry-identical result) |
| Quota cannot be overspent | `voiceLedgerService` transaction + `FOR UPDATE` row locks | PROVEN (real PostgreSQL contention: 3 concurrent settlements, 120 s requested vs 60 s quota → 60 s debited, 0 s final, ledger reconciled; see 09 §Voice Ledger Contention) |
| No fake success on dependency failure | AI runtime fallback chain | PROVEN (breaker opens; retry stops at max attempts; non-retryable categories never retried) |
| No cross-tenant state | canonical writers key on `schoolId`; evidence identity from verified server context | PROVEN (mastery tenant isolation T5 in existing R7.1 proof; evidence identity server-side post-`87ab25b3`) |

## Critical-State Matrix

| State | Writer/Owner | Concurrency mechanism | Status |
| --- | --- | --- | --- |
| Canonical mastery state | `probabilisticMasteryRepository.ts` (single canonical writer) | `$transaction` + evidence-receipt uniqueness + `stateRevision` conditional write | PROVEN |
| Mastery evidence application | same | unique `evidenceId` receipt claimed first inside the transaction | PROVEN |
| Result-release approval | `resultReleaseApprovalService.ts` → `PrismaResultReleaseApprovalAtomicCommitter` | ONE `$transaction`: conditional approval write + conditional packet write + audit insert; packet failure aborts all | FAILED — REPAIRED |
| Release packet status | same atomic committer | conditional `ready_for_approval → approved_for_internal_release` write inside the same transaction; zero matches abort | PROVEN |
| Daily-objective check session | `phase3DailyObjectiveCheckRepository` | version-checked `acquireCompletingOwnership` (sync maps mode + async Prisma `updateMany` with status/version WHERE) | PROVEN |
| Voice quota settlement | `voiceLedgerService.ts` | `prisma.$transaction` + `SELECT … FOR UPDATE` row locks | PROVEN |
| Learning evidence event stream | `prismaLearningEvidenceEventStoreRepository.appendEventAtomically` | `$transaction` + stream-sequence uniqueness; conflicts surface as `LearningEvidenceConcurrencyError` | PROVEN (source + existing focused tests `learning-evidence-concurrency.test.ts`) |
| Exam delivery / marking transitions | Prisma repositories (mode-gated fail-closed) | same guarded-writer pattern to be adopted (R8-F) | PROVEN WITH LIMIT — representative transition proven/ repaired; full chain adoption outstanding (R8-F) |

## Dependency-Failure Matrix

| Dependency | Failure | Behavior (source + controlled proof) | Invariant held |
| --- | --- | --- | --- |
| AI provider | transient error (`provider_unavailable`, `timeout`, `network_error`) | retry policy: max 3 attempts, exponential + jitter capped at 30 s; breaker opens after 5 failures | bounded degradation; no fake success (PROVEN, `--target ai-reliab`) |
| AI provider | non-retryable (`invalid_request`, `auth_error`, `budget_exceeded`) | never retried; breaker does not open for caller-error categories | no pointless provider load (PROVEN) |
| AI provider | repeated failure across cooldown | breaker `open` → calls refused; after cooldown one half-open probe; 2 successes close | stop-the-bleeding + recovery probe (PROVEN) |
| Database (mastery) | concurrent conflicting writes | transaction aborts (`AtomicAbort` / unique violation → `false`), canonical state unchanged | no impossible mastery state (PROVEN) |
| Database (evidence) | stream/idempotency conflict | unique violation mapped to `LearningEvidenceConcurrencyError` / `IdempotencyConflictError` — explicit conflict, never silent overwrite | no duplicate canonical evidence (source + focused tests) |
| Redis | unavailable | client degrades with cooldown, does not crash the process (R8-D source evidence `src/lib/redis.ts`); AI limiter/breaker are process-local and unaffected in semantics | bounded degradation (PROVEN WITH LIMIT — multi-instance rate limiting is process-local by classification) |
| Downstream evidence bridge (daily objectives) | persistence/mastery failure | settle returns explicit error, releases ownership, checkpoint records partial progress; retry recovers from checkpoint (CASE 1–5 paths) | safe retry, no fake completion (source + 50/50 retry-identical proof) |
| Marking batch item | single item failure | item marked `failed`, batch not falsely completed, other items marked | partial failure isolated (PROVEN, `--target marking`) |

## Retry / Idempotency

| Path | Mechanism | Status |
| --- | --- | --- |
| Canonical mastery evidence | unique `evidenceId` receipt inside the commit transaction; duplicate → `false` with no mutation | PROVEN (T4 duplicate-evidence proof + concurrent W1) |
| Learning evidence commands | `LearningEvidenceIdempotency` unique (school, commandType, key); conflict → `LearningEvidenceIdempotencyConflictError` | PROVEN (source + existing focused idempotency tests) |
| Daily-objective settle | durable `DailyObjectiveCheckCompletionIdempotencyRecord` keyed by `daily_obj_check_<session>`; ownership acquisition prevents double settle; retry returns cached result | PROVEN (50/50 exactly-once, retry-identical) |
| Result-release approval | idempotency start/complete/fail around create; guarded transition for approve (R8-E) | PROVEN (new regression test) |
| AI runtime calls | retry policy refuses non-idempotent operations (`not_idempotent_or_unsafe`) and budget-exceeded calls | PROVEN |

## Concurrency

- Canonical mastery: 2-way same-evidence, 20-revision chain, and 5-way create race all measured against real PostgreSQL — exactly-once, no lost update, no split state (see 09 §Canonical Mastery Concurrency). GAP-mastery-canonical-concurrency: **PROVEN**.
- Result-release approval: pre-repair race reproduced (both actors approved; side-effects double-fired); first repaired with status-conditional transition, then finally with the atomic approval+packet+audit transaction (see Resolved R8-E Defects); post-repair exactly one winner and one audit event. GAP-questionbank-concurrency-locks (representative transition): **FAILED — REPAIRED**.
- Daily objectives: concurrent settle serialized by ownership acquisition (`COMPLETING` status + version check); loser receives a retryable conflict or the completed result — never a duplicate settle. **PROVEN**.
- Voice ledger: row-lock serialization inside `prisma.$transaction`; concurrent settlements cannot both debit the same remaining seconds. **PROVEN** (real PostgreSQL contention: 60 s quota, 120 s requested, 60 s debited, 0 s final).

## Restart / Recovery

- Canonical mastery: durable PostgreSQL records; state, receipts, and change logs survive repository reconstruction (R7.1 T1/T2 proofs remain in the tree and were not invalidated).
- Daily objectives: production path reads the durable idempotency table by key; a restart resumes from durable checkpoints (`COMPLETING` + checkpoint CASE 1–5 recovery paths). The process-local Map exists only in test-maps mode.
- Learning evidence: event store is durable and hash-chained; projection checkpoints record `lastProcessedSequence` for replay/resume.
- Marking invocation: durable mode (Prisma repositories, fail-closed resolver in production) persists batch/item state; restart recovery follows persisted item statuses.

## Database Failure

- Transactional paths (mastery atomic commit, evidence event append, voice settle) abort atomically on write failure — no partial canonical state (mastery: all-three-truths transaction; evidence: event+stream+idempotency single transaction).
- Conflict vs failure distinction preserved: unique/constraint violations surface as explicit concurrency/idempotency errors, not swallowed successes.
- Daily-objective settle releases ownership and returns an explicit error on bridge/mastery failure; no fake completion is written.
- Isolated test DB used for all concurrency proofs; no production DB touched.

## Redis Failure

- Existing intended policy (source `src/lib/redis.ts`): client operations degrade with a cooldown period rather than crashing the process; the process continues serving non-Redis paths.
- AI runtime limiter/breaker are process-local services and are not Redis-dependent; Redis loss does not alter their semantics.
- Classification: process-local rate limiting means per-instance limits. In a multi-instance deployment, global rate limits are NOT enforced by this service — explicit PROVEN WITH LIMIT / architecture note, no repair invented.

## Provider Failure

- Controlled provider failures (injected categories, no real provider load): transient categories retry ≤ 3 attempts with ≤ 30 s capped backoff; non-retryable categories fail fast; repeated transient failures open the circuit and refuse calls; single half-open probe after cooldown; 2 successes close.
- Budget guard (`budgetAllowed=false`) blocks retries — cost ceiling respected during incidents.
- No misleading success: exhausted retries/budget/circuit produce explicit failure outcomes feeding the existing safe-fallback chain.

## Partial Batch Failure

- Deterministic marking batch (10-item batch, 1 poisoned item): failed item marked `failed` and reported in `failedItems`; other 9 marked; batch terminates as `partially_completed` (closure correction — history preserved: the original text called the pre-repair `running` remainder honest; it was a defect, now repaired); all-failed batch terminates as `failed`. No misleading success (R8E-R16).
- Daily-objective settle: step failures (evidence, mastery, weak-signal) return explicit errors with checkpointed progress for bounded retry; never a fabricated completion.

## Long-History Degradation

| Table | Growth | Degradation risk | Disposition |
| --- | --- | --- | --- |
| `LearningEvidenceEvent` | linear in operations; canonical, hash-chained | storage growth only; reads bounded | NOT APPLICABLE for pruning — retention is a correctness/legal requirement (R8E-R20 respected; no deletion performed or proposed) |
| `LearningEvidenceIdempotency` | 1 row per idempotent command; redundant post-commit | unbounded table growth | POLICY DECISION REQUIRED (retention period not invented) |
| `DailyObjectiveCheckCompletionIdempotencyRecord` | 1 row per settled check session; no production purge | unbounded table growth | POLICY DECISION REQUIRED |
| Process-local maps (daily objectives, breaker) | bounded by usage/window pruning (production paths) | none demonstrated in production mode | NOT APPLICABLE (maps-mode growth is test-only) |
| Process-local AI limiter `windows` Map | 1 entry per distinct actor key; closure correction: expired inactive keys were retained indefinitely (original "already bounded" claim was wrong) | unbounded key growth under one-time-actor streams | FAILED — REPAIRED (bounded opportunistic sweep: ≤1 full key iteration per 60 s window; ordinary limiter behavior unchanged) |

## Bounded Degradation

- AI runtime: bounded retries, capped backoff, circuit breaker, budget guard — provider incidents degrade with explicit failure outcomes, bounded provider load.
- Rate limiter: per-key timestamp pruning plus the closure sweep that removes expired inactive keys (≤1 full key iteration per window; no per-request scan).
- Marking batch: linear time growth; isolated item failures; truthful terminal states.
- Roster dry-run: super-linear CPU growth on very large payloads — bounded degradation NOT established at arbitrary scale; see 09 §School Roster (`DECISION REQUIRED / REQUIRED BEFORE PRODUCTION`).
- Redis: cooldown degradation, no crash.

## Resolved R8-E Defects

### DEF-R8E-01 Result-release approval concurrent duplicate approve (GAP-questionbank-concurrency-locks representative transition)

- Root cause: `ResultReleaseApprovalService.approveReleasePacket` checked `approvalStatus !== 'draft'` against a stale read and then called the unconditional `updateStatus` writer. Two concurrent approvers could both pass the check; the packet side-effect and audit event double-fired.
- Reproduction: real-PostgreSQL workload with an interleaved read-check-write — both actors wrote `approved` (see 09 §Question-Bank Concurrency, W2 before-repair).
- Repair: added `transitionStatusFrom(approvalId, fromStatus, toStatus, safeSummary)` to the approval repository contract (status-conditional `updateMany` in Prisma; guarded check-and-set in-memory); service now performs the guarded transition, returns a stable `INVALID_STATUS`/`conflict` envelope to the loser, and fires packet/audit side-effects only for the winner.
- Before: 2 approvals written, side-effects/audit double-fire. After (guarded): 1 winner, 1 conflict, 1 audit event, single status transition (winnerCounts [1,0]).
- Final closure (history preserved, not erased): the guarded transition still left approval and packet as separate steps, so `packetRepo.updateStatus()` returning `null` could leave `approval = approved` with the packet unapproved and API success. Repair: `ResultReleaseApprovalAtomicCommitter` port (`resultReleaseRepositoryContracts.ts`) + `PrismaResultReleaseApprovalAtomicCommitter` (ONE `prisma.$transaction`: conditional `draft → approved` school-scoped approval write, conditional `ready_for_approval → approved_for_internal_release` school-scoped packet write, in-transaction `RELEASE_PACKET_APPROVED` audit; packet failure aborts all). Service delegates the canonical mutation to the committer; composition wires it in `routes/resultRelease.ts`; in-memory tests use the small fake committer.
- Regression guards: `package-11-approval-workflow.test.ts` keeps the concurrent-duplicate assertion (extended: 1 canonical approval, 1 packet approval, 1 audit) and adds the dependency-failure assertion (injected packet failure → operation fails, approval stays `draft`, packet unchanged, `RELEASE_PACKET_APPROVED` count = 0). Real-DB proof: `assessment-approval-atomic-commit` invariant PROVEN (commit path + sabotaged-packet rollback path). Full file 17/17 passing.

### DEF-R8E-02 Marking partial-batch terminal state

- Root cause: `executeDeterministicBatch` only handled the zero-failure case; any partial failure returned with the batch left `running`.
- Repair: `failedItems.length === 0` → `completed`; some failed + some marked → `partially_completed`; all failed → `failed`, terminal timestamps set consistently.
- Regression guard: new assertions in `package-8-deterministic-marking-bridge.test.ts` (9 marked + 1 failed → `partially_completed`; 3 failed + 0 marked → `failed`).

### DEF-R8E-03 AI limiter stale-key retention

- Root cause: window pruning removed expired timestamps per active window but never deleted inactive keys from the process-local `windows` Map.
- Repair: bounded opportunistic sweep — at most one full key iteration per `WINDOW_MS`, expired empty windows deleted; no per-request scan, no per-actor timer, no new dependency; test reset clears sweep state.
- Regression guard: new assertion in `ai-runtime-rate-limit-guard.test.ts` (50 stale keys → one post-window operation → stale removed, fresh semantics intact).

### DEF-R8E-04 Voice ledger required-field defect (found by the live contention proof)

- Root cause: durable writes omitted required fields (`StudentProfile.updatedAt`, `id` on `VoicePackageGrant` / `VoiceSessionUsage` / `VoiceLedgerEntry`), so the first real-PostgreSQL contention run failed with `PrismaClientValidationError` (the mocked focused test could never surface this).
- Repair: minimal same-file additions only (`voiceLedgerService.ts`); no logic change.
- Proof: `voice-quota-contention` PROVEN — REAL POSTGRESQL CONTENTION (60 s quota, 120 s requested across 3 concurrent settlements → 60 s debited, ledger reconciled, 0 s final, 3 settled, no duplicate).

## Remaining Required-Before-Production Risks

Carried from the accepted R8-D register (unchanged dispositions, not re-audited in R8-E per §19):

- `GAP-evidence-idempotency-lifecycle` — retention policy decision required (quantified in 09; no period invented).
- `GAP-dailyobjectives-idempotency-lifecycle` — retention policy decision required (quantified in 09).
- `GAP-school-roster-unbounded` — bounded-degradation decision required: input cap and/or bounded-scan repair (super-linear growth measured; no current-scale failure reproduced).
- `GAP-identity-rolecheck-coverage`, `GAP-identity-mountless-authz`, `GAP-tutorcore-persistence-unresolved`, `GAP-sessions-chatmessage-writer-duplication`, `GAP-mastery-growth-writers`, `GAP-questionbank-model-writers`, remaining `GAP-questionbank-concurrency-locks` adoption across Exam*/Marking* transitions — outside R8-E measurement scope per §19; R8-F/R8-G consume these.

New risks identified by R8-E measurement:

- Multi-instance AI rate limiting is process-local by classification — global limits require an architecture decision (Redis-backed limiter) if cross-instance guarantees are required.
- Voice ledger live concurrent contention now measured in the final closure (see 09 §Voice Ledger Contention) — no longer outstanding.

## R8-F Handoff

- Roster boundedness repair candidate (Set-based scans or route-level payload cap — decision required first).
- Declarative marking max batch size.
- Adopt `transitionStatusFrom` guarded-writer pattern across remaining Exam*/Marking* durable transitions (common owner pattern established; no new infrastructure added).
- All structural/duplication candidates remain untouched per §24.

## R8-G Handoff

- Behavioral acceptance of repaired approval concurrency under realistic multi-actor flows.
- Retention policy decisions (evidence idempotency, daily-objective idempotency) require product/legal approval before any purge behavior is built or accepted.
