# Backend Engineering Intelligence Report (DIAG)

Diagnosis of the Steadfast backend as an engineering system at the accepted
remote baseline. No production behavior was changed in this task. Every
weakness below is OBSERVED, MEASURED where practical, CLASSIFIED, and
PRIORITIZED — not repaired.

- Baseline: `d9eb8618ceb582db467261e5d559cc4322da7763`
  (`docs(integration): freeze backend integration handoff`)
- Diagnosis worktree (isolated, detached HEAD, owner primary worktree untouched):
  `C:\Users\HP\AppData\Local\Temp\steadfast-backend-intelligence-d9eb861`
- Diagnostic date: 2026-09-16/17. Task identity:
  `BACKEND-ENGINEERING-INTELLIGENCE-DIAGNOSIS` (diagnostic only).
- Prior canonical evidence reused as-is (not regenerated, not rewritten):
  `01` inventory, `02` dependency graph, `03` route map, `04` data ownership,
  `05` logic register, `06` algorithm register (+ R8-H appendix), `07`
  completeness, `08` gaps, `09` performance, `10` reliability, `11` dead code,
  `13` acceptance, `14` integration handoff.

> OWNER SUMMARY (one page, no marketing language)
>
> How strong is this backend? Mixed-to-strong on correctness and durability
> for the paths that are proven; weak on proven scalability beyond one
> process and one school; unproven on educational quality and on production
> traffic of any kind.
>
> What makes it strong? Verified school identity on 76/113 mounts with
> spoof-rejection proof; exactly-once settlement semantics proven for
> mastery evidence, daily objectives, and result-release approval (the last
> after a real repaired race); voice quota locking proven under real
> PostgreSQL contention; bounded retries/capped backoff/circuit breaker
> proven without live providers; two measured algorithmic optimizations
> (rate-limit window, daily-feed rank) with digest-equal equivalence proof.
>
> What makes it weak? The canonical media-scoring module throws `TypeError`
> on every call (production survives only via triplicated route-local
> copies); the route-level Redis token bucket fails OPEN when Redis is down
> (observed live in this diagnosis); the AI runtime limiter is process-local
> (no cross-instance guarantee); the question-bank family still derives actor
> context from a MOCK/DEV-ONLY extractor; one 570 KB route file concentrates
> risk; learning/memory/tutor-turn domains have no source-verified algorithm
> records (85 UNRESOLVED logic capabilities in R8-C).
>
> Is it fast? Yes at measured scales on a dev machine: rate-limit checks
> ~1-3 microseconds; daily-feed rank 1 ms at 1,000 items, 15 ms at 10,000;
> mastery commits ~13 ms on test PostgreSQL; steady-state guarded HTTP
> ~10 ms in-process. None of these are production SLAs.
>
> Is it scalable? Single process, one school: adequate with bounds to add.
> Multiple processes: NOT proven — process-local limiter, maps, and jobs do
> not coordinate. Many schools: NOT proven — no multi-school traffic
> evidence; first bottlenecks are identifiable (see §25).
>
> Is it reliable? For covered failure modes: yes (bounded degradation,
> explicit conflicts, no fake success). For uncovered modes (Redis loss on
> the route limiter, provider production latency, restart under load):
> partially proven or unproven.
>
> Which parts are proven? Mastery atomicity, daily-objective exactly-once,
> approval atomic commit, voice quota, AI retry/breaker boundedness, roster
> reconcile linearity (post-R8-F), two R8-H optimizations, auth spoof
> rejection, idempotency replay semantics.
>
> Which parts only look good on paper? Anything whose evidence is
> TESTED_NOT_MEASURED or SOURCE_CONFIRMED_ONLY (§8); all educational scoring
> weights (no calibration dataset exists); all multi-instance behavior; all
> DATABASE PERFORMANCE claims beyond the isolated test DB.
>
> What will fail first? 1) Cross-instance rate/quota guarantees under a
> second backend replica. 2) Route-limiter Redis outage (fail-open =
> unenforced limits). 3) Unbounded whole-school roster payloads (no input
> cap). 4) Idempotency-table growth without a retention policy. 5) The
> 570 KB route file under continued edits.
>
> What should we fix first? P0 items in §29: replace the question-bank MOCK
> actor extractor with verified context; repair-or-remove the throwing
> canonical media scorer; decide Redis-backed global limiting vs documented
> per-instance limits; close the Redis fail-open on the route limiter;
> set roster payload bounds; decide idempotency retention.

---

## 1. Executive Diagnosis

The backend at `d9eb861` is a large Express + TypeScript + Prisma system
(441 Prisma models, 113 production mounts per `14`, ~134 route modules per
`01`/`06`) whose **durable-transactional core is genuinely strong** and whose
**scale story is mostly unproven**. This diagnosis confirms the accepted
R8-series evidence, re-measures the two R8-H optimized algorithms at this
SHA with digest-equal results, adds new measurements for media-scoring
helpers, fingerprint hashing, and HTTP-layer overhead, and records two new
material observations: (a) the canonical `media-stream/scoring.ts` exports
throw `TypeError: getMediaKindGroup is not a function` on every call
(production ranking survives via route-local copies — triplication, not an
outage); (b) the route-level Redis token bucket logs fail-open
(`[TokenBucket] Redis unavailable — allowing request`) with a ~5 s cold
penalty on first guarded request and ~10 ms steady state.

Measurement environment for all NEW figures in this report: Windows 11
(win32 10.0.26200), Node v24.14.1, Intel i5-8365U 8 logical, 15.8 GB RAM,
commit `d9eb8618ceb582db467261e5d559cc4322da7763`, in-memory synthetic
fixtures unless stated otherwise, warmup >= 10, samples >= 30, p50/p95 /
min / max (no p99 claimed), heap deltas, sha256 correctness digests. All
figures are DEVELOPMENT BASELINE measurements, not production SLAs. No live
provider (OpenAI, Pinecone, YouTube, Vimeo, school systems, webhooks) was
called. Command/test budget honored: 3 grouped benchmark campaigns, 1
focused failure/equivalence test invocation (25/25), 1 final tsc, 1 final
prisma validate, 1 final build. Reused accepted R8-E/R8-H measurements are
labeled as such and were NOT rerun except the two R8-H digest checks, which
matched exactly (`4ff6f5476dd6f430`, `297be19ee8a5ea75`).

Architecture grades (evidence in referenced sections):
CORRECTNESS MIXED (proven core, 85 unresolved capabilities) · DURABILITY
ADEQUATE (proven canonical writers; retention policies undecided) ·
SECURITY ADEQUATE (proven identity/spoof rejection; MOCK extractor remains
in question-bank) · PERFORMANCE ADEQUATE (fast at measured scales; STRESS
knees mapped) · SCALABILITY MIXED (single-process adequate; horizontal
UNPROVEN) · RELIABILITY ADEQUATE (covered modes proven; Redis fail-open +
unmeasured modes) · OBSERVABILITY MIXED (telemetry exists; aggregation
unproven) · MAINTAINABILITY WEAK (570 KB route file; triplication; throwing
canonical module) · ALGORITHM MATURITY MIXED (2 BENCHMARKED, 9 TESTED, rest
SOURCE_CONFIRMED_ONLY or UNRESOLVED) · EDUCATIONAL CALIBRATION UNPROVEN
(no dataset) · INTEGRATION READINESS ADEQUATE (handoff V1 frozen; D1-D9
deferred).

## 2. How The Backend Works

End-to-end, a normal request executes:

```text
REQUEST
→ GLOBAL SECURITY (helmet → CORS allowlist → global rate limiter
  10,000 req / 15 min NAT-aware → express.json 10 MB → requestId →
  requestCorrelation → requestTelemetry → httpLogger)
→ IDENTITY (schoolAuthMiddleware: Bearer JWT only; HS JWT_SECRET →
  COPILOT_JWT_SECRET → RS256 COPILOT_PUBLIC_KEY; startup is FATAL with no
  key — observed directly: import throws without JWT_SECRET)
→ SCHOOL VERIFICATION (requireVerifiedSchoolContext on 76 mounts: derives
  school/user/role from claims only, stamps req.verifiedSchoolIdentity,
  overwrites req.schoolId; 401 SCHOOL_CONTEXT_REQUIRED / 403
  SCHOOL_CONTEXT_INVALID)
→ ROLE / RELATIONSHIP (lib/rbac resolveRequestRole — note: `teacher`
  collapses to `student`, school_admin resolves to student; governance
  families use local requireRole-style gates, NOT lib/rbac)
→ VALIDATION (zod contracts, manual parsePositiveInt, pagination clamp
  MAX 100, body limits, 413 mapping)
→ DOMAIN SERVICE (pure decision logic + policy gates, e.g.
  generationPolicyGate before any provider call)
→ STATE / ALGORITHM (ranking, scoring, reconciliation, settlement —
  §7/§8; canonical media scorer THROWS — §23 defect D-NEW-01)
→ TRANSACTION / REPOSITORY (Prisma $transaction + row locks / conditional
  updateMany / unique receipts — §13; in-memory fakes in dev/test paths)
→ AUDIT / EVENT (audit writers inside the same transaction on repaired
  paths; hash-chained evidence events; projection checkpoints)
→ RESPONSE (safe envelopes; { message }-only global errors; requestId /
  correlationId echo)
```

Important deviations from the normal path (all source-confirmed):
(a) 32 mounts are auth-only (no verified school context) and 5 are public
(health/ops/readiness). (b) The entire question-bank family
(`/api/question-bank`, `/marking`, `/exam-*`, `/result-*`, `/recovery-*`)
uses auth WITHOUT verified context and derives actor context from the
explicitly MOCK/DEV-ONLY `extractMockAssessmentActorContext`
(x-school-id/body) — deferred item D2 in `14`, P0 in §29. (c) Voice/ledger
mounts are auth + rate-limit without verified context (ledger identity is
per-student/day inside the transaction). (d) Media ranking executes
route-local scorer copies, never the canonical module (§23 D-NEW-01).
(e) AI-lane Genkit flows run in-process; the governed gateway defaults to a
deterministic mock, with a legacy direct-OpenAI path live only where
configured.

## 3. System Architecture

Entrypoint `backend/src/index.ts`; `backend/tsconfig.json` keeps
`rootDir: ".."` with `files: ["src/index.ts"]` (REQUIRED_RUNTIME_CONTRACT);
build emits `backend/dist/backend/src/index.js` (proven emitted, then
restored post-proof; dist changes excluded from this task's commit).
Middleware order verified in source: helmet → cors → global limiter →
express.json/urlencoded (10 MB) → requestId → requestCorrelation →
requestTelemetry → httpLogger → 100 `app.use('/api…')` mount lines
(`14` canonical count: 113 production mounts = 76 auth+verified, 32
auth-only, 5 public; delta is router-composed sub-mounts) →
errorTelemetryMiddleware → global error handler. Server timeouts:
REQUEST_TIMEOUT_MS 120 s default (also server.timeout/requestTimeout),
keep-alive 65 s, headers 66 s; graceful SIGTERM/SIGINT shutdown with 10 s
forced-close backstop. Backpressure: maxConcurrent 100, maxQueueDepth 200,
process-local counters (`task019BackpressureMiddleware.ts`). Persistence:
PostgreSQL via Prisma (441 models, 48 @@unique, 2358 @@index — diag-scan
measured); Redis client with cooldown degradation (`src/lib/redis.ts`);
AI/provider boundary: governed mock gateway default + legacy direct OpenAI
+ Genkit in-process flows; Pinecone/YouTube/Vimeo/safety-webhook all
LIVE_DISABLED without config (per `14` port classification). No
`setInterval` anywhere in `backend/src` (0 files); 18 `setTimeout` sites
(timeouts, cooldowns, debounced decrements) — there is no background
worker-loop infrastructure; "workers" are request-scoped or in-memory jobs
(e.g. roster sync in-memory job Map). Shutdown/recovery: stateless process
+ durable DB; restart behavior per state owner in §16 (durable writers
recover; process-local maps/jobs do not).

## 4. End-to-End Data Flows

Primary value chain (student learning):

```text
student request (verified school identity)
→ learning session (transactional state machine + event store +
  idempotency fingerprint: replay vs conflict)
→ learning evidence (append-only hash-chained events; idempotency rows;
  projection checkpoints for resume/replay)
→ mastery (probabilistic stack: evidence aggregation → score ladder →
  spaced-review planner; canonical writer applyEvidenceAtomically:
  receipt claim + revision-conditional write + change log, one txn)
→ growth (topic-inference signal counts over ≤40 events; progress/mistake
  snapshots; page/feed adapters)
→ recommendations (priority-policy table; media rank scores)
→ revision (living-revision node/edge/due/audit records, transactional
  edge/count maintenance; required audits awaited and gating)
```

Assessment chain:

```text
assessment answer → deterministic marking batch (sequential, per-item
isolation, truthful terminal states completed/partially_completed/failed)
→ result (release-approval atomic committer: approval draft→approved +
  packet ready_for_approval→approved_for_internal_release + audit, ONE txn;
  active Package-11 HTTP route still uses in-memory composition — 09
  closure truth: mechanism PROVEN, route wiring deferred)
→ evidence → mastery impact → recovery lifecycle (preparation-only
  boundary: Package 20 durability does NOT mean live execution)
```

School-identity chain:

```text
JWT claims → schoolAuthMiddleware (req.schoolId/req.user.id/role) →
requireVerifiedSchoolContext (verifiedSchoolIdentity, schoolId overwrite)
→ roster (dry-run conflict scan + reconcile diff → mapping actions) →
  authorized learner context (role/scope validators, teacher-scope
  policies, student-self rules)
```

Source-of-truth rule: canonical writers own truth (mastery repo, evidence
event store, session repo, voice ledger, approval committer, governance
records); everything else is a DERIVED_VIEW (growth pages, feeds,
projections, recommendations), an EVENT (audit, evidence chain), a CACHE
(TTL/policy-scoped, e.g. video recommendation `cacheAllowed=false`), or
PROCESS-LOCAL ephemeral state (limiter windows, breaker counters,
backpressure gauges, maps-mode stores — test-only). Duplicate
representations exist and are flagged: media scoring ×3 (canonical +
two route copies), pagination clamp inline at call sites, RBAC role mapping
(lib/rbac vs local gates).

## 5. Capability Map

(Entry → service → persistence → algorithm → dependency → state →
failure → recovery → scale driver → evidence. Condensed; full detail in
`03`/`04`/`05`/`14`.)

- Authentication/identity: Bearer JWT multi-secret; `schoolAuthMiddleware`;
  no persistence; ALG-safety-task020-auth-jwt-claim-extract (O(1),
  deterministic); no external dep; stateless; failure = 401 fail-closed;
  recovery n/a; scale = CPU O(1); evidence: spoof-rejection contract test
  23/23 handoff suite.
- Verified school identity: `schoolContextGuardMiddleware`; stateless
  stamp; O(1); failure 401/403; evidence: handoff contract tests.
- Student learning sessions: `/api/copilot/learning-sessions`,
  `/api/learner`, `/api/tutor`; transition service + event store +
  fingerprint idempotency; Prisma session/event/idempotency rows;
  guarded transitions + replay/conflict logic; no external dep;
  transactional state; failure = 422/409 explicit; restart = durable
  resume; scale = per-session O(1); evidence: R1 atomic suites 14/14,
  R8-G.5R regression.
- Study Chat backend: `/api/copilot` aiRoutes; liveChat pipeline adapter;
  session/message/artifact stores; ALG_DELEGATED (provider) + policy gate
  ALG-safety-tutorpolicy-generation-policy-gate (O(1)); governed mock
  gateway; failure = safe fallback chain; evidence: contract tests.
- Tutor state: `/api/copilot/tutor-state`; `tutorStateService` Prisma
  fail-closed in production (DEF-R8G3A-01 repair); snapshots durable;
  restart = durable rows survive, outage fails loudly.
- Learner memory: `/api/copilot/learner-memory`; memory/event stores;
  UNRESOLVED algorithm record (no verified procedure); zod validation.
- Learning evidence: `/api/copilot/evidence`; command service; event
  store + idempotency + checkpoints; concurrency via sequence uniqueness;
  failure = explicit conflict errors; evidence: concurrency/idempotency
  focused tests.
- Mastery: probabilistic stack (`probabilisticMasteryRepository`,
  `masteryEvidenceAggregationService`, `spacedReviewPlanner`,
  `masteryInferenceService`); canonical rows + receipts + change logs;
  ladder/score/interval algorithms O(1)-O(n≤40); failure = AtomicAbort;
  evidence: real-PostgreSQL 2-way/20-chain/5-race proofs.
- Practice: adaptive/next-practice priority O(n≤10); evidence DIRECT test.
- Revision: living-revision durable records; due prioritization;
  UNRESOLVED R8-C record (graph service exists, no verified algorithm).
- Growth: growth-page service + topic inference (signal counts, O(n≤40),
  3-query shape); derived view, not canonical.
- Daily objectives: settle + idempotency record; exactly-once PROVEN
  50/50; retention POLICY DECISION REQUIRED.
- Study planning / Phase3 surfaces: `/api/phase3/*`; plan/objective/feed
  stores; feed rank-dedupe BENCHMARKED (R8-H).
- Media/artifacts: triplicated scorers; asset stores; canonical scorer
  THROWS (D-NEW-01); route copies serve production; external-video dedupe
  O(n); YouTube/Vimeo adapters gated-off without key.
- Video/voice: voice ledger transactional + FOR UPDATE locks; quota
  PROVEN under contention (60 s quota, 120 s requested → 60 debited);
  STT/TTS live only where configured.
- Teacher insight/intervention: reports/interventions routes; scope
  validators; reads + audit writes; NO live UI consumer (per `14`).
- Question bank / exam lifecycle / marking / result governance / recovery:
  assessment domain packages 4-26; guarded `transitionStatusFrom` pattern;
  marking batch linear + isolated; MOCK actor-context constraint (P0).
- Content/source governance: ApprovedSource/ContentGap/ModerationDecision
  DURABLE_CANONICAL + audit DURABLE_EVENT; fail-closed unreviewed.
- Privacy/safeguarding: governance routes + redaction services; student
  privacy proven in R8-G integrity suite 11/11.
- Operations/rate limiting/quotas/deployment: global limiter, route
  limiter (Redis token bucket, fail-open — D-NEW-02), AI process-local
  limiter (30/500/1000 per min), backpressure 100/200, quotas (voice
  ledger), readiness/health governors, canary state machine.

## 6. Persistence & Source-of-Truth Map

441 Prisma models; 48 @@unique constraints (idempotency/conflict
authority); 2358 @@index entries (heavily school-scoped composite
coverage — healthy sign, see §11). Canonical writers (durable truth):
`probabilisticMasteryRepository` (mastery state/receipts/change logs),
`prismaLearningEvidenceEventStoreRepository` (events+stream+idempotency,
one txn), `studentLearningSessionRepository` (state+events),
`voiceLedgerService` (grants/sessions/ledger, row-locked txn),
`PrismaResultReleaseApprovalAtomicCommitter` (approval+packet+audit, one
txn — mechanism proven; HTTP route still in-memory composition),
`phase3DailyObjectiveCheckRepository` (ownership + idempotency),
governance Prisma records, Package-20 atomic stores, TutorState/snapshots,
living-revision records. Derived views (recomputable, never authoritative):
growth pages, feeds, recommendations, projections, analytics. Event stores:
evidence chain (hash-linked), audit writers, checkpoints
(`lastProcessedSequence`). Caches: TTL/policy-scoped (socratic cache
policy, video `cacheAllowed=false`, scope policies); all safe-ephemeral or
bounded. Process-local (lost on restart, uncoordinated across instances):
AI limiter `windows` Map (bounded sweep ≤1 full iteration per 60 s),
breaker counters, backpressure gauges, roster sync job Map, maps-mode
stores (test-only), module dedupe caches (external-video candidate cache
flagged MEMORY_HOTSPOT_CANDIDATE). Duplicate representations: media
scoring ×3, pagination clamp inline, role mapping dual
(rbac-vs-local-gates), result-release dual composition (Prisma mechanism +
in-memory route). Growth accounting: evidence events 1 row/operation
(append-only, NOT prunable — correctness/legal); idempotency rows 1
row/command or check-session (redundant post-commit — prune candidates
pending policy); limiter entries per actor key (swept); daily-objective
rows 1/learner/check-session/day.

## 7. Algorithm Master Table

26 of 30 R8-C records resolve to live source at `d9eb861` (verified by
path inspection); 4 are non-current exactly as the accepted R8-H appendix
maps them (3 SUPERSEDED-evolved + 1 unreachable). Theoretical complexity
from `06`; measured flags from `09` + this diagnosis (NEW = measured in
this task at d9eb861).

| # | Algorithm (owner-readable) | Domain | Complexity | Measured? | Correctness proof | Quality calibration | Scale risk | Decision |
| - | - | - | - | - | - | - | - | - |
| 1 | AI sliding-window rate limiter | ops | amortized O(1) ordered / O(w) fallback | YES (R8-H + NEW digest-equal) | 12/12 equivalence + 6/6 guard | n/a (control) | LOW (per-instance by design) | ACCEPTED_OPTIMIZATION |
| 2 | Daily-feed rank-dedupe | mastery | O(n log n) sort + O(n) dedupe | YES (R8-H + NEW digest-equal) | 13/13 equivalence + DIRECT test | UNCALIBRATED (weights heuristic) | MEDIUM (100k→275 ms; unbounded input) | ACCEPTED_OPTIMIZATION |
| 3 | Media relevance scorer (canonical) | artifacts | O(w) weak topics | NEW helpers only (canonical THROWS) | NONE (throws TypeError) | UNCALIBRATED | HIGH (dead canonical + ×3 copies) | CRITICAL REPAIR REQUIRED (§29 P0) |
| 4 | Study-stream rank scorer | artifacts | O(n) bounded sets + base | NEW helpers only (canonical THROWS) | NONE (throws TypeError) | UNCALIBRATED | HIGH (same as 3) | CRITICAL REPAIR REQUIRED (§29 P0) |
| 5 | Recency decay | artifacts | O(1) | YES NEW (4.3 µs/op) | NONE_FOUND | UNCALIBRATED (22·e^-d/18) | LOW | KEEP (calibrate later) |
| 6 | Mastery score-threshold ladder | mastery | O(T) T=6 | NO (SUPERSEDED: probabilistic stack) | legacy DIRECT (predecessor) | UNCALIBRATED | LOW (bounded) | SUPERSEDED — monitor successor |
| 7 | Mastery score compute 0-100 | mastery | O(1) | NO (SUPERSEDED) | legacy DIRECT (predecessor) | UNCALIBRATED | LOW | SUPERSEDED — monitor successor |
| 8 | Evidence-level ladder | mastery | O(1) | NO | INDIRECT integration | UNCALIBRATED | LOW | KEEP |
| 9 | Next-practice priority | mastery | O(n≤10) | NO | DIRECT behavior | UNCALIBRATED (+random) | LOW | KEEP |
| 10 | Spaced-review interval [1,90] | mastery | O(1) | NO | DIRECT behavior | UNCALIBRATED | LOW | KEEP |
| 11 | Growth topic inference (≤40 events) | mastery | O(n≤40) | NO | NONE_FOUND | UNCALIBRATED | LOW (bounded) | KEEP (needs dataset) |
| 12 | Video-effectiveness score [0,1] | mastery | O(1) | NO | DIRECT behavior | UNCALIBRATED | LOW | KEEP (needs dataset) |
| 13 | Confidence mismatch rank-dedupe | mastery | O(n log n) | NO (SUPERSEDED: calibration service O(n) Set) | NONE_FOUND (predecessor) | UNCALIBRATED | LOW (small vocab) | SUPERSEDED |
| 14 | Roster dry-run conflict scan | school | O(n) post-R8-F (was quadratic) | YES (R8-E/R8-F: 5000→5.2 ms) | DIRECT behavior | n/a (correctness) | MEDIUM (no input cap) | KEEP + BOUND INPUT (§29 P1) |
| 15 | Roster reconciliation | school | O(n) | YES (R8-E: 5000→0.5-1.3 ms) | INDIRECT integration | n/a | MEDIUM (whole-payload) | KEEP + BOUND INPUT (§29 P1) |
| 16 | Daily-objective idempotency settle | mastery | O(1) map ops | YES (R8-E: 50/50, p50 0.48 ms) | DIRECT + contention | n/a | LOW (1 row/session/day; retention open) | KEEP |
| 17 | AI retry backoff+jitter | ops | O(1), ≤3 attempts, ≤30 s cap | YES (R8-E matrix) | DIRECT behavior | n/a | LOW | KEEP |
| 18 | AI circuit breaker | ops | O(1) | YES (R8-E matrix) | DIRECT behavior | n/a | LOW (process-local) | KEEP |
| 19 | Canary state transition | ops | O(1) | NO | NONE_FOUND | n/a | LOW | KEEP (add tests §29 P2) |
| 20 | JWT claim extract | safety | O(1) | NO (perf n/a — security) | INDIRECT + contract spoof tests | n/a | LOW | KEEP |
| 21 | Tutor generation policy gate | safety | O(1) | NO (perf n/a — security) | DIRECT behavior | UNCALIBRATED (policy) | LOW | KEEP |
| 22 | Learner-recommendation priority table | school | O(1) lookup | NO | INDIRECT integration | UNCALIBRATED | LOW | KEEP |
| 23 | Voice quota ledger loop | voice | O(g) grants FIFO | YES (R8-E real-PG contention) | DIRECT + contention PROVEN | n/a | LOW (ledger tail 10) | KEEP |
| 24 | Express AI rate-limit stack | voice | library | NO (delegated) | INDIRECT integration | n/a | MEDIUM (Redis fail-open D-NEW-02) | HARDEN (§29 P0) |
| 25 | Content fingerprint sha256/16 | artifacts | O(bytes) library | YES NEW (1KB 0.013 ms … 1MB 11 ms) | INDIRECT integration | n/a | LOW | KEEP |
| 26 | Media dedupe key | artifacts | O(parts) library | NO | INDIRECT integration | n/a | LOW | KEEP |
| 27 | Artifact replay idempotency | artifacts | O(bytes) hash | NO | DIRECT behavior | n/a | LOW | KEEP |
| 28 | External-video dedupe | artifacts | O(n) single pass | NO | NONE_FOUND | UNCALIBRATED | LOW (+module cache hotspot) | KEEP (bound cache §29 P2) |
| 29 | Marking batch sweep | qbank | O(b) sequential | YES (R8-E: 500→5.5 ms mem) | DIRECT + isolation | n/a | MEDIUM (unbounded b; DB-bound in prod) | KEEP + DECLARE MAX (§29 P1) |
| 30 | Pagination cursor clamp (≤100) | ops | O(1) | NO (NO_LONGER_RUNTIME_REACHABLE as unit; inline at sites) | DIRECT (predecessor unit) | n/a | LOW | PATTERN kept inline; no unit to fix |

Counts: confirmed-current 26 · measured (this or accepted evidence)
11 · quality-calibrated 0 · heuristic/unvalidated 9 (Class C + media
weights) · high-scale-risk 2 (rows 3/4 via dead-code risk; 24 via
fail-open). Plus 85 UNRESOLVED logic capabilities with no verified record
— the largest algorithm-coverage gap, concentrated in learning-core,
memory/evidence, and question-bank domains.

## 8. Algorithm Deep Dive

Type classification (primary) + maturity per record (PROVEN = measured +
behavioral proof at/before this SHA; MEASURED = timed with digest;
TESTED_NOT_MEASURED = behavioral tests only; SOURCE_CONFIRMED_ONLY =
inspected, no behavioral test; QUALITY_UNCALIBRATED = weights/thresholds
without empirical grounding; UNRESOLVED = no verified record):

- PERFORMANCE (1, 2): limiter RESOURCE_CONTROL/MEASURED→PROVEN-equivalent
  (digest-equal at d9eb861, 25/25 equivalence); feed
  RANKING/MEASURED + QUALITY_UNCALIBRATED (order proven, weights not).
- CORRECTNESS (6, 7 superseded; 8, 10 DETERMINISTIC_RULE_SET/TESTED;
  9 SELECTION/TESTED with randomness; 16 IDEMPOTENCY/PROVEN 50/50;
  27 IDEMPOTENCY/TESTED; 29 BATCHING/PROVEN isolation).
- SECURITY (20, 21 DETERMINISTIC_RULE_SET/TESTED + contract proof;
  never benchmarked for show — correct decision).
- RELIABILITY (17 RETRY/PROVEN-bounded; 18 CIRCUIT_BREAKER/PROVEN;
  19 STATE_MACHINE/SOURCE_CONFIRMED_ONLY — no test evidence found,
  P2 to add).
- LEARNING_QUALITY (8, 9, 10, 11 AGGREGATION/TESTED-or-unproven,
  12 SCORE/TESTED, 22 SCHEDULING/INDIRECT): all
  QUALITY_UNCALIBRATED — deterministic code ≠ educationally good.
- RANKING (2 measured; 3, 4 BROKEN canonical; media copies
  SOURCE_CONFIRMED_ONLY at route level).
- STATE_TRANSITION (19 unproven; approval/canary/session transitions
  PROVEN elsewhere — §13).
- RECONCILIATION (15 O(n) PROVEN-shape; INDIRECT test).
- RESOURCE_CONTROL (1, 18, 23 PROVEN; 24 library-delegated with
  fail-open weakness D-NEW-02).
- DEDUPLICATION/HASH (25 MEASURED NEW; 26, 28 SOURCE_CONFIRMED_ONLY;
  28 has module-local cache without proven bound).
- DECAY (5 MEASURED NEW micro; formula confirmed
  `22·exp(-days/18)`, output [0,22]; calibration absent).
- PAGINATION (30: unit unreachable; pattern alive inline — healthy
  outcome, no action).

Determinism: all ranking/scoring/settlement records are deterministic
except 9 (random tie-break) and 17 (jitter — intentional). Bounded: yes
except 2 (no explicit cap — caller-bounded in practice), 14/15 (no route
cap), 29 (no max batch). Stateful: 1, 16, 18, 23, 24 (explicit stores);
the rest pure per-call.

## 9. Heuristics & Calibration

Audited constants (source, purpose, range — none changed):

- Media score weights (`scoring.ts:111-141`, mirrored in route copies):
  base 20; +14 not-completed; +10 helpful; +34 active-topic match; weak-topic
  boost; +12 kind preference; +6 transcript; +8 language; +10 learning-need;
  +24 exam relevance; +12 focus-short; +8 audio/video; +6 collection; +12
  revision-due; −90 creative-external-video penalty; +10 youtube / +8 vimeo;
  +4 no-external-source. Classification: DOMAIN_HEURISTIC (coherent
  product intent, zero empirical calibration evidence) → remediate by
  dataset, not by tuning (§29 P3).
- Recency decay: `22·exp(-days/18)`, plateau 12 for days 1.5–8, output
  [0,22]. Classification: ENGINEERING_DEFAULT with domain flavor —
  half-life 18 days unexplained. Sensitivity: HIGH at the 1.5/8-day
  kinks (discontinuities) — worth a calibration note before any change.
- Study spacing/media trust/kind boosts: small integer tables;
  DOMAIN_HEURISTIC.
- Mastery ladder/thresholds (evidence counts, ratios, confidence buckets,
  score caps 0–100, interval clamp [1,90]): PRODUCT_RULE + DOMAIN_HEURISTIC
  mix; behavioral tests pin current values (good — change is detectable),
  but no learning-outcome data grounds them. QUALITY_UNCALIBRATED.
- Priority tables (DEDUPE_ORDER, recommendation 10-type order, mismatch
  severities): PRODUCT_RULE, tested for order-stability (13/13 feed
  equivalence pins `[b,c,e]` digest `297be19ee8a5ea75`).
- Rate/quota numbers: AI scopes 30/500/1000 per min, global 10,000/15 min,
  voice per-student/day ledger, pagination MAX 100, retry ≤3 / backoff
  ≤30 s / breaker 5 failures / cooldown+1 probe+2 close, backpressure
  100 concurrent / 200 queue, timeouts 120/65/66 s, JSON 10 MB.
  Classification: EVIDENCE_CALIBRATED for reliability bounds (failure
  matrices prove boundedness); ENGINEERING_DEFAULT for product fit
  (limits vs real school traffic unmeasured).
- UNEXPLAINED_MAGIC_CONSTANT candidates: the −90 creative-video penalty
  scale vs +10-scale siblings (order-of-magnitude outlier — likely a veto
  masquerading as a weight); the 1.5/8-day recency kinks; `teacher→student`
  role collapse (policy, not math, but load-bearing and surprising).

Verdict: the backend's numbers are honest heuristics with pinned behavior
(tests will catch drift) but zero educational calibration. Do not tune;
build the dataset first (§29 P3).

## 10. Performance Results

Campaign A — pure algorithms, `r8-h-workload.ts` at d9eb861 (digests match
R8-H exactly: implementation unchanged since optimization):

- Rate limiter per check+record op (30 samples): SMALL w=30
  0.0011/0.0021 ms; REPRESENTATIVE 3-scope 0.0029/0.0041; LARGE w=1000
  denial 0.0012/0.0022; STRESS w=2000 0.0010/0.0021. Flat across window
  sizes — amortized-O(1) holds. Verdict FAST.
- Daily-feed rank (30 samples): 100 → 0.107/0.3246 ms; 1,000 →
  1.0705/2.1432; 10,000 → 15.0135/23.5448; 100,000 → 275.08/515.78
  (heap −15 MB on STRESS = major GC during sweep, noted not hidden).
  Growth ≈ O(n log n), ~10× cost per 10× input with a rising constant
  above 10k. Verdict: FAST ≤1k, ACCEPTABLE ≤10k, WATCH at 100k (half-second
  feeds need pagination/bounding before multi-school use).

Campaign B — algorithm micro-costs, `diag-algo-bench.ts` (NEW):
composed media-helper sweep per corpus: 100 → 0.3552/0.5115 ms; 1,000 →
2.6695/4.3808; 10,000 → 30.019/49.2353 — linear; per-asset ≈ 3 µs.
Micro: recency 4.30 µs/op; trust 0.73 µs/op; spacing 7.26 µs/op (spacing
pays for Date parse — matches the R8-H finding that motivated
single-parse decoration). Fingerprint sha256/16: 1 KB 0.0126/0.0203 ms;
100 KB 0.5338/0.9815; 1 MB 11.1651/15.7926 — linear in bytes, negligible
at evidence sizes. Verdict FAST. (Canonical full scorers unmeasurable —
they throw; §23.)

Campaign C — HTTP layer, `diag-http-probe.ts` + `diag-warm-guard.ts`
(NEW, supertest in-process, real middleware, stub JWT, Date.now
resolution — coarse but truthful relatively): health-live-public 200
p50 128/p95 258 ms (cold process incl. first-hit init — NOT a service
budget); auth-missing 401 p50 98; auth-malformed 401 p50 88; auth-ok
lightweight 200 p50 89 (cold); verified-context 200; malformed JSON 400.
Guarded stack (auth+backpressure+route-limit): first request 4957 ms
(cold Redis connection timeout path), then 64, 10, 8, 12, 11, 11 ms
steady — framework/middleware overhead ≈ 10 ms warm in-process, domain
work excluded. Verdict: ACCEPTABLE with the cold-Redis caveat (D-NEW-02).

Service-layer (reused accepted R8-E evidence, not rerun): roster
reconcile 5000 → 0.5–1.3 ms linear; dry-run 5000 → 5.2 ms post-R8-F
(O(n)-shape restored); marking 500 in-mem → 5.5 ms (DB-bound in prod:
~0.5–2.5 s/500); mastery commit p50 13.4/p95 25.7 ms test PG;
daily-objective settle p50 0.48/p95 0.92 ms 50/50 exactly-once.

DATABASE PERFORMANCE beyond the isolated test DB: NOT EMPIRICALLY PROVEN
(no production-like volume, pooling, or multi-instance contention data).

## 11. Database Efficiency

Access-shape inventory (source + accepted proofs): mastery commit = 1 txn
(receipt claim + conditional state write + change log); voice settle = 1
txn + 2 row locks; approval = 1 txn (3 writes + audit); evidence append =
1 txn; daily settle = ownership updateMany + idempotent insert; reads
bounded (`listStates` take 500, `listChangeLogs` take 200, ledger tail 10,
feeds rank in memory). Queries/request: 1–3 on hot paths (mastery
inference 3-query shape, no N+1 — R8-H). N+1 risk: none demonstrated in
measured paths; unmeasured list endpoints (teacher reports with
classId/subject/window filters, no cursor) are candidates for review, not
verdicts. Full-history scan risk: evidence/idempotency tables grow
linearly and unbounded (retention undecided — §16 P1); stream reads are
sequence-bounded; projections checkpointed. Write amplification: 3–4 rows
per canonical mutation (state + receipt + log + audit) — justified and
constant. Row-lock usage: voice (2 locks), mastery (optimistic revision,
no locks), approval (conditional writes, no locks). Unique-index
dependency: correct — receipts, idempotency keys, stream sequences are the
concurrency authorities. Index review: 2358 @@index entries suggest
thorough scoped coverage; candidate checks for future work
(INDEX_REVIEW_CANDIDATE, no change made): pagination-without-cursor lists
(teacher reports, session events `limit`-only default 50 no max);
schoolId-scope coverage on newest Package-20 families; redundant-index
candidates where single-column and composite overlap (tooling pass
recommended, §29 P2). No index added in this task.

## 12. Memory Behavior

Process-state census (diag-scan measured): `new Map/Set` at 412 sites in
163 files — top holders `routes/ai.ts` (35), curriculum-graph in-memory
repo (13), daily-objective repo (12), expansion/pilot repos, role-scope
service (11), curriculum registry (9). Classified: BOUNDED_PROCESS_CACHE
— AI limiter windows (per-actor, 60 s window, + bounded sweep ≤1 full
scan/window; STRESS heap Δ 0.05–0.37 MB); breaker counters (reset on
transition); backpressure gauges (scalars); pagination outputs (≤100).
SAFE_EPHEMERAL_STATE — request telemetry/correlation, dedupe caches per
request, jitter state. DURABLE_STATE_WRONGLY_PROCESS_LOCAL — none found
in canonical paths post-R8-G.3A (tutorstate/snapshots, revision,
governance, Package-20 all Prisma-backed fail-closed). UNBOUNDED_MEMORY_RISK
— (a) roster sync in-memory job Map + whole-payload diff (bounded only by
caller; P1 cap in §29); (b) external-video module-local candidate cache
(no proven bound/TTL — P2); (c) AI limiter key growth under one-time-actor
streams (mitigated by sweep; residual multi-instance duplication — P1
architecture decision); (d) daily-objective/durable idempotency Maps in
test-maps mode (test-only, no production action). Restart behavior:
process-local state is cold after restart (limiter windows empty =
permissive start; breaker closed = optimistic start; jobs lost — roster
sync must be re-driven by caller); durable state resumes from rows +
checkpoints. Growth units: per-student (ledger, sessions), per-school
(objectives, evidence, roster), per-process (limiter, breaker,
backpressure) — the per-process class is the horizontal-scale fault line
(§14).

## 13. Concurrency

Mechanism inventory (source-verified): database transaction (21 files,
38 sites — mastery, voice, evidence, sessions, exam-paper, recovery
stores); row lock FOR UPDATE (voice ×2 + 1 route); optimistic version
(mastery `stateRevision` conditional updateMany; daily-objective
`acquireCompletingOwnership` status/version WHERE); unique constraint
(evidence receipts, idempotency keys, stream sequence → explicit conflict
errors); idempotency key (sessions header+hash, evidence key+sha256,
result writes x-key, roster sync locks); guarded updateMany
(approval `transitionStatusFrom`, packet conditional, daily ownership);
process mutex: NONE (no in-process locks — stated, not missing: DB/unique
keys are the authorities); no-control-required (pure scorers, reads);
unproven (remaining Exam*/Marking* transitions — same-pattern adoption
outstanding, R8-F handoff). Domain verdicts: learning-session transition
PROVEN (R1 atomic 14/14); daily-objective settlement PROVEN (50/50 +
retry-identical); voice quota PROVEN (real-PG 3-way contention);
assessment/result release PROVEN for the representative transition
(2-concurrent + sabotaged-packet rollback) WITH LIMIT (adoption + route
wiring outstanding); roster sync guarded by idempotency locks (source);
mastery mutation PROVEN (2-way/20-chain/5-race real PG); evidence append
PROVEN (source + focused tests); recovery actions PROVEN within Package-20
atomic stores (12/12 + 22/22 composition locks); question-bank bulk ops
UNPROVEN beyond the representative (P1 adoption). Contention cost: mastery
~13–26 ms/commit; approval ~154 ms guarded pair; voice 3-way within quota
— all acceptable for low-frequency high-value writes.

## 14. Horizontal Scalability

Direct answer: running 2, 5, or 20 instances is SAFE for stateless
verified-identity reads and durable-transactional writes (DB/unique keys
coordinate correctly), but rate/quota/backpressure semantics silently
degrade to per-instance, and process-local jobs/caches diverge. Per owner:

- HORIZONTALLY_SAFE: JWT verification (stateless, shared secrets);
  verified-context derivation; pure scorers/rankers; Prisma transactional
  writers (mastery, evidence, sessions, voice, approval, objectives);
  retry/backoff/circuit logic per instance (safe, just duplicated);
  audit/event appends.
- SAFE_WITH_SHARED_REDIS (required, not present): AI runtime limiter
  (30/500/1000 per min become per-instance — 20 instances = 20×
  effective quota and 20× provider cost exposure); route token bucket
  (same multiplication + fail-open on Redis loss); backpressure gauges
  (100/200 per instance).
- SAFE_WITH_DATABASE_COORDINATION: roster sync (idempotency locks exist;
  whole-payload jobs should be single-driver + bounded); marking batches
  (per-item isolation holds; throughput scales, duplicate drivers need
  key discipline); Package-20 preparation stores (transactional).
- SINGLE_PROCESS_ONLY (today): in-memory job Maps; module-local video
  candidate cache; maps-mode stores (test-only by design).
- UNKNOWN: Genkit in-process flow state under replicas; telemetry
  aggregation across instances (no collector proven).

Multi-process proof: NONE exists (no 2-instance test) — the central
horizontal-scale unknown (§24). First replica does not crash anything;
it quietly multiplies every limit by the replica count.

## 15. Multi-Tenant Scalability

Cost-shape analysis: per-user O(1) — session ops, settle, quota checks,
limit checks, scoring per asset; per-user O(n) bounded — inference ≤40
events, practice windows ≤10, pagination ≤100; per-school O(n) unbounded
input — roster dry-run/reconcile (whole payload), evidence/idempotency
tables (linear, unpruned), revision/media/attempt collections (caller
scans); global O(n) — none found in hot paths. Quadratic: none remaining
in production paths post-R8-F (dry-run O(n·m) repaired to Set-indexed
O(n); feed O(n·m) dedupe repaired to O(n)). Cardinality ceilings tested:
feed 100k (275 ms), roster 5k (5 ms), marking 500 (5.5 ms mem).
Extrapolated first multi-school bottlenecks (§25): per-instance limiter
multiplication → provider cost/quota breach; unbounded roster payloads →
request latency + memory per sync; idempotency/event table growth →
storage + vacuum load without retention; unpaginated list endpoints →
response bloat as school history grows; 100k-scale feeds →sub-second but
GB-class heap churn under concurrent schools. Single-learner and
single-class shapes are comfortable; single-school is adequate with the
P1 bounds; many-schools is UNPROVEN and needs the §29 P0/P1 items plus a
production-like traffic trial.

## 16. Reliability & Failure Recovery

Restart question answered per state owner: durable-before-response
(mastery/evidence/session/voice/approval/audit writes commit inside the
response transaction — crash after commit = safe; crash before = explicit
error, retry replays idempotently); durable-after-response (projection
checkpoints, telemetry flushes — replayable from sequence); transactional
(all canonical mutations — all-or-nothing proven by sabotage tests);
replayable (evidence streams, daily checkpoints CASE 1–5, idempotent
replays return recorded results); lost (process-local windows/counters/
gauges/jobs — by design; limiter restarts permissive, breaker optimistic,
roster jobs re-driven). Dependency posture: PostgreSQL REQUIRED
(fail-closed everywhere in canonical paths; no silent memory fallback
post-R8-G.3A); Redis OPTIONAL-by-design but DANGEROUS-in-effect (route
limiter fails open — D-NEW-02); AI provider OPTIONAL (bounded retries,
capped backoff, breaker, budget guard, safe fallbacks — PROVEN matrix);
Pinecone/YouTube/Vimeo/school-adapters/webhooks DISABLED-or-mock
(explicit offline behavior, no fake success). Partial-batch safety:
marking isolates poisoned items with truthful terminal states; daily
settle checkpoints partial progress and never fabricates completion.
Duplicate-request safety: replay-identical vs conflict-distinct is the
system-wide contract (fingerprints + key+hash), proven 50/50 on daily
objectives and by R1 session suites.

## 17. Dependency Failure Behavior

Matrix (source + controlled proof; no live providers touched):

| Dependency | Failure | Detection | Retry | Recovery | Durable? | Partial safe? | Verdict |
| - | - | - | - | - | - | - | - |
| PostgreSQL (mastery) | conflicting writes | AtomicAbort/unique → false | caller retry | revision re-read | yes | yes (no mutation) | STRONG |
| PostgreSQL (evidence) | stream/idempotency conflict | explicit Concurrency/Idempotency errors | replay/checkpoint | resume from sequence | yes | yes | STRONG |
| PostgreSQL (voice) | concurrent settle | row-lock serialization | serialized | balance clamp | yes | yes (60/120→60/0) | STRONG |
| PostgreSQL (approval) | packet failure mid-txn | txn abort | explicit conflict | stays draft, 0 audits | yes | yes | STRONG |
| AI provider transient | timeout/500/unavailable | category classifier | ≤3, exp+jitter ≤30 s | breaker probe, 2-close | n/a | yes (explicit failure) | STRONG |
| AI provider fatal | auth/budget/invalid | classifier | never | fail fast + fallback | n/a | yes | STRONG |
| AI provider repeated | storm | breaker opens @5 | refused | half-open probe | n/a | yes | STRONG |
| Redis (route limiter) | unavailable | warn + ALLOW (fail-open) | reconnect cooldown | permissive until back | no | NO (limits unenforced) | WEAK (D-NEW-02) |
| Redis (AI limiter/breaker) | unavailable | none (process-local) | n/a | unaffected | n/a | yes (semantics hold) | ADEQUATE (per-instance) |
| Pinecone | unavailable | gated-off without config | none | explicit offline | n/a | yes | ADEQUATE |
| YouTube/Vimeo | unavailable/no key | adapter gate | none | empty candidates + needs_review | n/a | yes | ADEQUATE |
| School adapter | unavailable | mock_only/disabled-live | none | explicit disabled | n/a | yes | ADEQUATE (pre-live) |
| Notification webhook | n/a (guard tests only) | no live send | none | n/a | n/a | yes | NOT_LIVE |
| Clock rollback | out-of-order stamps | order-independent fallback | n/a | semantics preserved | n/a | yes (12/12 equiv) | STRONG |
| Duplicate request | replay | fingerprint/key+hash | identical cached | n/a | yes | yes | STRONG |
| Conflicting duplicate | changed hash | conflict error | non-retryable | explicit 400/409 | yes | yes | STRONG |
| Stale version | revision mismatch | 0-row conditional | retryable conflict | re-read + retry | yes | yes | STRONG |
| Rate exhausted | over quota | 429 + retryAfterMs | after window | pruned + swept | no (ephemeral) | yes | ADEQUATE (×N instances) |
| Quota exhausted | voice 402 | ledger balance | next grant/day | clamped debit | yes | yes | STRONG |
| Malformed request | bad JSON/shape | 400 + safe envelope | caller fix | n/a | no-op | yes (measured 400) | STRONG |
| Cross-school request | forged scope | verified-context overwrite | never honored | empty reads | n/a | yes (contract proof) | STRONG |

Failure-injection simulations run in this task (deterministic, mocked):
malformed JSON → 400; missing/malformed auth → 401; cross-context verified
request → 200 in-scope; Redis-down guarded request → 200 fail-open with
warn (weakness, not crash); clock-rollback limiter cases → 12/12
reference parity. DB-conflict/stale-version/duplicate paths: reused
accepted real-PostgreSQL proofs (not rerun per budget).

## 18. Backpressure & Overload

Controls inventoried: global Express limiter (10k/15 min, NAT-aware,
health/ops/ready exempt); route limiter (AI/voice mounts + roster sync
with backpressure+abuse+quota options); AI limiter (30/500/1000/min,
process-local); voice ledger quotas; request timeout 120 s; body 10 MB
(413 mapped); backpressure middleware (100 concurrent / 200 queue,
process-local, 429 + rejection-rate signal); provider budget guard
(blocks retries when budgetAllowed=false); DB pool (default Prisma
behavior — unmeasured under load). Overload behavior: requests > capacity
→ 429 shedding at two layers (global + backpressure) — strength; provider
latency spike → bounded retries + breaker + budget guard — strength;
school traffic burst → per-instance limiters absorb locally but global
guarantee absent — weakness (§29 P0 decision); many schools behind NAT →
generous 10k window is shared — acceptable but unmeasured; large uploads
→ 10 MB cap + 413 — strength. Load-shedding gaps: backpressure state is
per-instance (20 replicas shed 20× late); no priority lane for
verified-school reads vs bulk syncs; no DB-pool saturation signal wired
to shedding; cold-Redis first-hit adds ~5 s to guarded requests (measured
D-NEW-02 tail). Verdict: single-instance shedding ADEQUATE; multi-instance
shedding UNPROVEN.

## 19. Observability

Capability audit: request latency — LOGGED_ONLY (requestTelemetry +
httpLogger emit per-request; no aggregation/SLO proof → AVAILABLE_NOT_AGGREGATED);
error rate — LOGGED_ONLY (errorTelemetry middleware; no cardinality-safe
rollup proven); provider latency — AVAILABLE_NOT_AGGREGATED (latency
service + AI telemetry exist; no dashboard proof); DB latency — MISSING
(no query-timing aggregation found); queue depth — LOGGED_ONLY
(backpressure state endpoint exposes, not aggregated); rate-limit denials
— LOGGED_ONLY; quota exhaustion — LOGGED_ONLY (402/429 paths + ledger);
retry count — AVAILABLE_NOT_AGGREGATED (bounded by construction ≤3, not
counted centrally); circuit state — LOGGED_ONLY (transitions logged);
memory growth — MISSING (no heap/event-loop telemetry in production
paths); event-loop delay — MISSING; slow endpoints — MISSING (no
slow-query/endpoint budget enforcement); school-scoped failures —
AVAILABLE_NOT_AGGREGATED (schoolId present in telemetry; cross-school
denial observations exist in canary services, not a unified view).
Dedicated observability services exist (~40: health aggregators, latency
budgets, canary observations, safe redaction) but read as governance
surfaces, not a metrics pipeline. Production problems today would be
visible in logs (with requestId/correlationId/schoolId) but NOT in
alerts — MISSING aggregation is the honest grade. (§29 P1/P2.)

## 20. Security/Privacy Under Scale

Scale-concurrency interaction review (not a re-audit): tenant isolation
holds under concurrency (conditional writes + verified overwrite; spoof
tests 23/23) — STRONG; verified identity is stateless → scales safely —
STRONG; RBAC collapses (`teacher→student`, local gates vs lib/rbac
duality) behave identically under load (pure functions) but the DUALITY
is a review burden — MIXED; student privacy (no raw payloads in logs/
envelopes, redaction services) is volume-independent — STRONG; source
governance fail-closed is concurrency-safe (conditional writes) —
ADEQUATE; idempotency isolation is per-(school,key) — scales by design —
STRONG; quota isolation is per-(student,day) ledger — STRONG single
instance, MULTIPLIED across instances (same P0 as limiting); rate-limit
isolation per actor key — same multiplication caveat; audit completeness
inside repaired transactions is atomic — STRONG, but unaudited paths
(remaining Exam*/Marking*) inherit the adoption gap. New scale-specific
risks: fail-open route limiter under Redis loss removes abuse protection
exactly when traffic is abnormal (D-NEW-02, HIGH); per-instance AI
limiter lets provider-cost abuse scale with replicas (P0 decision);
no evidence of timing oracles introduced by the R8-H fast paths
(constant-shape branches preserved; digests equal). No catastrophic
data-loss/security defect found requiring immediate CRITICAL REPAIR
beyond the P0 backlog (the MOCK extractor is pre-live-gated by D2).

## 21. Architecture & Maintainability

Measured: largest production file `routes/ai.ts` 570 KB (next largest
87 KB) — a concentration of scoring copies, route handlers, and repository
wiring; high fan-out by construction. Largest modules: assessment Prisma
repositories (60–82 KB each — mechanical, acceptable); growth/revision/
session services (67–87 KB — review load). Fan-in/fan-out/cycles: per
`02` (5 cycles accepted in R8-C scope; no new cycle analysis in this
task — reuse). Duplicated business logic (source-confirmed): media
scoring ×3 (canonical + 2 route copies) with the canonical copy THROWING
(D-NEW-01); pagination clamp inline everywhere (benign); role resolution
dual (lib/rbac vs local gates — benign but confusing); result-release
dual composition (mechanism vs route — tracked debt). Route/service
boundary: generally clean (route guards + service-owned decisions);
route-layer persistence exists in assessment in-memory composition
(tracked). Legacy surfaces: `/task020`, `/task021`, test-only mounts —
documented, untouched. Dead code: per `11` register (reused); plus NEW:
canonical `computeMediaStreamScore/computeStudyStreamScore` and
`metadata.ts:buildMediaStream` are runtime-dead (throw on any call, no
production caller reaches them — every production call site uses route
copies). No refactor performed (diagnostic law). Maintainability grade:
WEAK — the system is correct but expensive to change safely in media,
assessment-composition, and governance-gate areas.

## 22. Strongest Parts

1. Verified school identity + spoof rejection — WHY: claims-only identity,
   context overwrite, 401/403 closures on 76 mounts. EVIDENCE: 23/23
   handoff contract tests + 11/11 integrity suite. MATTERS: every
   tenant-sensitive flow. LIMIT: question-bank MOCK extractor excluded.
2. Exactly-once settlement family (mastery/daily/approval) — WHY: unique
   receipts + conditional writes + single transactions. EVIDENCE: real-PG
   2-way/20-chain/5-race, 50/50 settle, approval atomic commit + sabotage
   rollback. MATTERS: learning truth + money-like quotas. LIMIT:
   Exam*/Marking* adoption + route wiring outstanding.
3. Voice quota locking — WHY: row locks + clamped debit inside txn.
   EVIDENCE: real-PG 3-way contention (120 s asked, 60 debited, 0 left).
   MATTERS: billable-adjacent resource. LIMIT: single-DB row contention
   unmeasured at high concurrency.
4. Bounded AI failure handling — WHY: ≤3 retries, ≤30 s caps, breaker
   5/probe/2-close, budget guard, no fake success. EVIDENCE: R8-E matrix +
   12/12 rollback-parity equivalence. MATTERS: provider incidents.
   LIMIT: process-local; live latency unknown.
5. Measured optimization discipline — WHY: digest-equal equivalence,
   no-contract-change, asymptotic + latency wins. EVIDENCE: 25/25 suites,
   digests match at d9eb861. MATTERS: proves the team can speed up without
   breaking. LIMIT: only 2 of ~30 records.

## 23. Weakest Parts

1. D-NEW-01 canonical media scorer throws (HIGH) — EVIDENCE:
   `diag-media-verify.ts`: both exports `THROW TypeError:
   getMediaKindGroup is not a function` (scoring.ts:71 requires it from
   `./metadata.js`, which never exported it — it lives in
   `validation.js`). CONSEQUENCE now: dead canonical module + forced
   triplication; any future caller of the "official" API gets a runtime
   throw that tsc cannot catch (untyped require). FUTURE: silent outage if
   route copies are ever "deduplicated" toward the broken canonical.
   TRIGGER: any import of `media-stream/scoring` compute fns (already true
   for `metadata.ts:buildMediaStream`). REPAIR CLASS: P0 surgical fix or
   delete (decision in §29).
2. D-NEW-02 route rate limiter fails open on Redis loss (HIGH) —
   EVIDENCE: observed `[TokenBucket] Redis unavailable — allowing request`
   + 4957 ms cold guarded request vs ~10 ms warm. CONSEQUENCE now:
   limits unenforced during Redis incidents; 5 s tail on cold paths.
   FUTURE: abuse/cost exposure scales with traffic precisely when
   protection is needed. TRIGGER: any Redis outage/blip. REPAIR CLASS:
   P0 policy + engineering (fail-closed vs bounded-grace decision).
3. Question-bank MOCK actor context (HIGH) — EVIDENCE: `14` §6/§7 + source
   `extractMockAssessmentActorContext`. CONSEQUENCE: assessment writes
   trust headers/body pre-live. TRIGGER: any live-school use. REPAIR: P0
   verified-context replacement (deferred D2 — must precede pilot).
4. Per-instance AI/route limiting (HIGH at scale) — EVIDENCE: process-local
   windows + sweep design + `10` classification. CONSEQUENCE: N replicas =
   N× quota/cost. TRIGGER: second replica. REPAIR: P0 Redis-backed global
   limiter or documented per-instance acceptance.
5. Unbounded inputs without caps (MEDIUM) — EVIDENCE: no max on roster
   payloads, marking batches, some list limits. CONSEQUENCE: graceful
   linear degradation today; cliff risk under whole-school bursts.
   TRIGGER: large-school syncs. REPAIR: P1 declarative bounds.
   (Plus structural MEDIUMs: 570 KB `routes/ai.ts`; 85 UNRESOLVED logic
   capabilities; retention policies undecided; observability unaggregated.)

## 24. What We Do Not Yet Know

Explicit unknowns (neither PASS nor FAIL): no representative DB benchmark
(volumes, pooling, production query plans); no multi-process proof (2+
replicas never run); no educational calibration dataset (all learning
weights ungrounded); no provider production latency (mock only);
no multi-school production traffic (burst/NAT/shared-pool behavior);
no DB-pool saturation behavior; no Genkit replica-state behavior; no
heap/event-loop production telemetry; no slow-endpoint budget signal;
no retention-period decisions (evidence/daily idempotency growth is
quantified: 1 row/op or /session/day, but the purge age is a product/legal
unknown); no cold-start production budget (first-hit init + Redis
reconnect measured only in-process); full fan-in/fan-out/cycle evolution
since `02` (reused, not re-scanned per budget); remaining Exam*/Marking*
transition adoption state beyond the representative.

## 25. What Will Fail First

Evidence-ranked (measured problems above speculative ones):

1. Cross-instance quota/cost multiplication — RESOURCE: AI/provider
   budget. TRIGGER: 2nd replica. SYMPTOM: provider spend ×N, quotas
   unenforced globally. WHY: process-local windows. EVIDENCE: design +
   `10` classification. MITIGATION: shared-Redis limiter or explicit
   per-instance acceptance.
2. Route-limiter fail-open during Redis incident — RESOURCE: abuse
   protection. TRIGGER: Redis blip. SYMPTOM: 429s stop, cold 5 s tails.
   WHY: allow-on-unavailable + reconnect cost on hot path. EVIDENCE:
   observed warn + 4957 ms cold sample. MITIGATION: fail-closed or
   bounded-grace + warm standby client.
3. Unbounded whole-school roster sync — RESOURCE: request latency/memory.
   TRIGGER: large-school payload. SYMPTOM: seconds-scale syncs, heap
   pressure (linear now, was quadratic). WHY: no input cap. EVIDENCE:
   R8-E/R8-F + NEW context. MITIGATION: payload cap + chunked sync.
4. Idempotency/event table growth — RESOURCE: storage/vacuum. TRIGGER:
   sustained operation without retention. SYMPTOM: slow bloat, never a
   cliff (reads stay keyed/bounded). WHY: append-only + no purge policy.
   EVIDENCE: growth math in `09`. MITIGATION: retention policy + prune
   job (product/legal first).
5. Media-ranking integrity under edits — RESOURCE: correctness. TRIGGER:
   well-meaning "dedup" toward canonical scorer. SYMPTOM: runtime
   TypeErrors in production ranking. WHY: D-NEW-01. EVIDENCE: direct
   throw proof. MITIGATION: §29 P0.
6. Observability gap at first incident — RESOURCE: detection. TRIGGER:
   any production anomaly. SYMPTOM: logs exist, alerts don't. WHY: §19.
   MITIGATION: aggregate + alert on latency/errors/breaker/quota first.

## 26. Scale Readiness Matrix

| Concern | Current State | 1 Process | Multi Process | One School | Many Schools | Evidence | Risk |
| - | - | - | - | - | - | - | - |
| HTTP/middleware | shedding works locally | READY | UNPROVEN (per-instance gauges) | READY | UNPROVEN | NEW probe + source | MEDIUM |
| Auth/identity | stateless, strict | READY | READY | READY | READY | 23/23 contracts | LOW |
| Sessions/evidence/mastery writes | transactional | READY | READY (DB coordinates) | READY | NEEDS DB PROOF | real-PG proofs | MEDIUM |
| Rate limiting (AI) | process-local, measured | READY | NOT READY (×N) | READY | NOT READY | NEW digest run | HIGH |
| Route limiter (Redis) | fail-open observed | DEGRADED on Redis loss | NOT READY | DEGRADED on loss | NOT READY | NEW warn+5 s sample | HIGH |
| Redis/cache | cooldown, TTL-scoped | READY | DIVERGES (local caches) | READY | UNPROVEN | source + probe | MEDIUM |
| DB reads/writes | bounded shapes, indexed | READY | READY (add pool proof) | READY | NEEDS VOLUME PROOF | 441/48/2358 + takes | MEDIUM |
| Learning evidence | append-only, checkpointed | READY | READY | READY (retention open) | RETENTION REQUIRED | `09` math | MEDIUM |
| Mastery | atomic, bounded | READY | READY | READY | READY (low-freq writes) | real-PG | LOW |
| Revision/growth | derived, bounded windows | READY | READY | READY | WATCH (100k feed 275 ms) | NEW 100k run | MEDIUM |
| Media ranking | works via copies; canonical throws | READY (copies) | READY (copies) | READY | WATCH (corpus scans) | NEW linear sweep | HIGH (D-NEW-01) |
| Assessment/marking | isolated, linear | READY | NEEDS key discipline | READY | NEEDS max-batch | R8-E | MEDIUM |
| Voice quota | row-locked, proven | READY | READY | READY | NEEDS contention proof | real-PG | LOW |
| School integration | mock_only + dry-run O(n) | READY | SINGLE-DRIVER | READY (cap needed) | CAP REQUIRED | R8-F + NEW | MEDIUM |
| External providers | gated/mock/offline | READY (offline-safe) | READY | READY | LIVE TRIAL REQUIRED | `14` ports | MEDIUM |

## 27. Performance Matrix

Labels refer ONLY to the recorded workload (dev machine, synthetic).

| Capability | Workload | p50 | p95 | Throughput | Memory | Complexity | Verdict |
| - | - | - | - | - | - | - | - |
| AI limit check | w=30 / 3-scope / w=1000 / w=2000 | 0.001–0.003 ms | 0.002–0.004 ms | ~300–900k ops/s | +0.05–0.37 MB | amortized O(1) | FAST |
| Daily-feed rank | 100 / 1k / 10k / 100k items | 0.11 / 1.07 / 15.0 / 275 ms | 0.32 / 2.14 / 23.5 / 516 ms | ~360–930 items/ms | GC churn at 100k | O(n log n) | FAST/FAST/ACCEPTABLE/WATCH |
| Media helper sweep | 100 / 1k / 10k assets | 0.36 / 2.67 / 30.0 ms | 0.51 / 4.38 / 49.2 ms | ~330 assets/ms | linear small | O(n) | FAST |
| Recency/trust/spacing micro | 20k ops each | 4.30 / 0.73 / 7.26 µs/op | n/a (bulk) | 140k–1.4M ops/s | negligible | O(1) | FAST |
| Fingerprint sha256/16 | 1 KB / 100 KB / 1 MB | 0.013 / 0.53 / 11.2 ms | 0.020 / 0.98 / 15.8 ms | ~90 MB/s | negligible | O(bytes) | FAST |
| Canonical media scorer | any asset | THROWS | THROWS | 0 | n/a | n/a | BOTTLENECK (correctness) |
| Roster reconcile | 5,000 entries | 0.5–1.3 ms | (R8-F) | ~4–10k entries/ms | 1.2 MB | O(n) | FAST |
| Roster dry-run | 5,000 entries | 5.2 ms | 9.5 ms | ~1k entries/ms | linear | O(n) post-fix | FAST (cap still open) |
| Marking batch (mem) | 500 items | 5.5 ms total | n/a | ~90 items/ms | GC noise | O(b) | FAST (DB-bound in prod) |
| Mastery commit (test PG) | single evidence | 13.4 ms | 25.7 ms | ~40–75/s | n/a | O(1)+txn | ACCEPTABLE |
| Daily settle (maps) | 50 sessions | 0.48 ms | 0.92 ms | ~1–2k/s | 2.4 MB/50 | O(1) | FAST |
| Guarded HTTP (warm) | auth+backpressure+limit | ~10 ms | ~12 ms | ~80–100/s serial | n/a | O(1) | ACCEPTABLE |
| Guarded HTTP (cold Redis) | first hit, Redis down | 4957 ms observed | n/a | n/a | n/a | reconnect-bound | BOTTLENECK (tail) |
| Health/auth cold (supertest) | 30 samples | 88–128 ms | 103–258 ms | n/a (harness-bound) | n/a | init-bound | UNMEASURED (harness overhead dominates) |
| DB production volumes | any | — | — | — | — | — | UNMEASURED |

## 28. Reliability Matrix

See §17 for the full dependency matrix (verdicts STRONG/ADEQUATE/WEAK/
NOT_LIVE per row). Capability rollup:

| Capability | Failure | Detection | Retry | Recovery | Durable? | Partial safe? | Verdict |
| - | - | - | - | - | - | - | - |
| Mastery apply | conflict | AtomicAbort | replay | re-read revision | yes | yes | STRONG |
| Evidence append | conflict | explicit error | replay | checkpoint resume | yes | yes | STRONG |
| Daily settle | bridge/mastery fail | explicit error + release | checkpoint retry | CASE 1–5 paths | yes | yes | STRONG |
| Approval release | packet fail | txn abort | conflict envelope | stays draft | yes | yes (0 audits) | STRONG (mechanism) |
| Voice settle | contention | serialization | serialized | clamp | yes | yes | STRONG |
| AI calls | transient/fatal/storm | classifier/breaker | bounded/none/refused | probe+close/fallback | n/a | yes | STRONG |
| Route limiting | Redis down | warn (not enforcement) | reconnect | permissive | no | NO | WEAK |
| Marking items | poisoned item | per-item failed | batch continues | truthful terminal | yes | yes | STRONG |
| Sessions | stale transition | 422/409 | retryable | re-read | yes | yes | STRONG |
| Restart | mid-op crash | txn atomicity | idempotent replay | rows+checkpoints | yes | yes | STRONG (durable) / LOST-BY-DESIGN (ephemeral) |

## 29. Prioritized Remediation Map

P0 — must fix before meaningful production/pilot (6):

1. P0-1 Question-bank verified context: PROBLEM MOCK actor extractor on
   all assessment writes. EVIDENCE `14` §6/§7. AFFECTS exam/marking/result/
   recovery. BENEFIT closes pre-live auth hole. CONCEPT replace extractor
   with `requireVerifiedSchoolContext` + relationship gates (D2).
   VERIFY rerun handoff spoof suite + per-package scope tests.
2. P0-2 Canonical media scorer: PROBLEM module throws on every call;
   production on triplicated copies. EVIDENCE `diag-media-verify.ts` throw
   proof. CONCEPT EITHER one-line-correct import from `validation.js`
   (+equivalence tests pinning route-copy parity) OR delete canonical +
   `metadata.ts:buildMediaStream` and bless one owner. VERIFY throw-proof
   becomes parity-proof; tsc still 0.
3. P0-3 Global rate-limit decision: PROBLEM per-instance windows multiply
   quotas ×N. EVIDENCE design + §14. CONCEPT Redis-backed shared limiter
   (sliding window primitive exists — reusability upgrade) or documented
   per-instance acceptance with lowered per-instance caps. VERIFY 2-instance
   contention proof + provider-cost math.
4. P0-4 Redis fail-open: PROBLEM allow-on-unavailable + 5 s cold tail.
   EVIDENCE NEW warn + sample. CONCEPT fail-closed-or-bounded-grace policy
   + warm standby client + connect off hot path. VERIFY Redis-kill harness:
   429-or-grace (never silent allow), p95 tail budget.
5. P0-5 Roster input bound: PROBLEM whole-payload, no cap. EVIDENCE R8-E
   super-linear history + current linearity. CONCEPT declarative max +
   chunked-sync contract (decision already framed in `09`). VERIFY
   over-cap 413 + 5k benchmark unchanged.
6. P0-6 Retention policies: PROBLEM unbounded idempotency/event growth.
   EVIDENCE `09` growth math. CONCEPT product/legal purge ages + prune
   job (canonical evidence NEVER purged). VERIFY growth test + policy doc.

P1 — should fix before scale (6): marking max-batch declaration; Exam*/
Marking* guarded-writer adoption; observability aggregation (latency/error/
breaker/quota alerts first); teacher-report/session-event pagination
cursors; external-video cache bound/TTL; canary-transition tests (19 has
none). P2 — optimization/hardening (4): redundant-index tooling pass;
role-gate unification (rbac vs local); route-file decomposition plan
(570 KB ai.ts — plan only, no rewrite here); memory/heap telemetry. P3 —
research (3): educational calibration dataset + weight grounding; School
lane SSO/SIS design; load/traffic trial design (production-like env).

## 30. Tarzan Algorithm Research Candidates

Reusable-pattern classification (no novelty or patent claims; standard
techniques named as such):

- Exactly-once settlement via receipt-claim + conditional-write + audit in
  one transaction (mastery, approval, Package-20 stores) — REUSABLE_PRIMITIVE
  (transactional outbox/idempotency pattern, well-executed).
- Head-offset sliding window with order-independent fallback (AI limiter
  R8-H) — REUSABLE_PRIMITIVE (amortized-O(1) window with clock-rollback
  safety is a genuinely careful variant; kept local for now).
- Decorate-sort-undecorate with single-parse + rank-table dedupe (feed
  R8-H) — REUSABLE_PRIMITIVE (textbook, cleanly applied).
- Indexed reconciliation (roster Set-indexing R8-F) — REUSABLE_PRIMITIVE
  (standard; notable for the measured ×77 win).
- Guarded `transitionStatusFrom` conditional-write pattern — REUSABLE_PRIMITIVE
  (optimistic-concurrency staple; good shared owner).
- Quota ledger with row-locked clamped debit (voice) — STEADFAST_SPECIFIC
  (ledger-tail + grant-FIFO shape is domain-flavored).
- Rank/dedupe/decay media scoring family — RESEARCH_CANDIDATE (structure
  is standard; the weight set needs calibration research, not reuse).
- Confidence-calibration alignment model (successor of mismatch dedupe) —
  RESEARCH_CANDIDATE (educational validity unknown).
- Bounded opportunistic sweep (limiter stale-key cleanup) — REUSABLE_PRIMITIVE
  (amortized bounded maintenance without per-request scans).

## 31. Recommended Next Engineering Sequence

1. Decide P0-3/P0-4 policy (global limits + Redis failure mode) — owners +
   backend, 1 session; everything scale-shaped follows from it.
2. Execute P0-1 (verified context for question-bank) — the only auth hole;
   blocks pilot honestly.
3. Execute P0-2 (media scorer single owner + parity tests) — removes the
   only known runtime-throwing module.
4. Execute P0-5/P0-6 bounds (roster cap, retention ages) — cheap, high
   leverage, mostly decisions.
5. P1 adoption + observability aggregation (guarded writers, alerts on the
   §19 MISSING rows) — makes the first incident survivable.
6. 2-instance contention proof + production-like traffic trial design —
   converts §24 unknowns into measurements.
7. Calibration dataset program (P3) — only then revisit any learning
   weight; until then weights are frozen heuristics.
8. Re-run this diagnosis (same harnesses, same digests) after 1–7 to
   confirm the baseline moved for the better. Do not push; do not repair
   production inside diagnosis; do not begin frontend/backend integration
   until P0 closes.

---

*End of report. Methods: static scans (`diag-scan.js`), register
reconciliation (`diag-verify-register.py`: 26/30 paths resolve; 4 =
accepted R8-H non-current set), Campaign A `r8-h-workload.ts` (rate-limit
+ daily-feed, digests `4ff6f5476dd6f430` / `297be19ee8a5ea75`),
Campaign B `diag-algo-bench.ts` (media helpers + fingerprint),
Campaign C `diag-http-probe.ts` + `diag-warm-guard.ts` (middleware
overhead + Redis fail-open observation), `diag-media-verify.ts` (throw
proof), one vitest invocation (25/25 equivalence), final `npx tsc -p
backend/tsconfig.json --noEmit` 0 diagnostics (client regenerated from
tracked schema; root node_modules junctioned read-only; primary
node_modules client backed up pre-generate and restored post-proof),
`prisma validate` valid (stub env; bare-shell P1012 pre-existing),
`npm run build` PASS with `dist/backend/src/index.js` emitted (tracked
dist outputs left unstaged and excluded from commit). No files changed
under `backend/src/**`, `backend/prisma/**`, `AI/**`, `frontend/**`.*
