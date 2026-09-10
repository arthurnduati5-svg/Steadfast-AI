# Backend Algorithm Register

R8-C evidence-backed register of non-trivial computation inside the Steadfast backend. Truth mapping only: no optimization, no refactoring, no benchmarks, no novelty claims, no dispositions.

## Baseline

- Scanner source fingerprint: `sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0` (accepted R8-A fingerprint `sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0`)
- R8-A accepted structural snapshot: files=5398 typescriptFiles=5319 routeModules=134 routeMounts=167 routeEndpoints=3312 prismaModels=432 unresolvedInternalImports=1 cycles=5 findings=9610
- Accepted R8-B baseline: data families=17 (15 confirmed), Prisma models=432/432, writer groups=154/154, canonical mutation groups=139, route-surface groups=110, confirmed logic capabilities=103, unresolved logic candidates=7, route modules=134/134, completeness L2=7 L3=99 L4=4
- Inventory git: branch=main head=87df12783eb0283d4b24963879f8a632b315e8cf
- R8-C generated at: 2026-09-10T03:00:54.386Z
- Production source files analyzed: 587
- Test files scanned for evidence: 3443; benchmark-mention hits repository-wide: 22
- R8-C scope: classification/understanding only. No production behavior was changed and no finding below carries a final disposition.

## Method and Evidence Law

- Substrate: accepted R8-B confirmed LOGIC IDs with their linked route/service files (05_BACKEND_LOGIC_REGISTER.md); R8-A dependency/structural evidence; R8-B data-family ownership; existing focused tests.
- Source-of-truth hierarchy: (1) production source body, (2) R8-B logic/data ownership, (3) R8-A structural evidence, (4) focused tests, (5) architecture docs, (6) labelled inference. Names alone never prove an algorithm.
- Automated pass: for each confirmed LOGIC, the linked production route module + primary services were read (tests, generated code, dist, node_modules excluded). Per-file signals follow §44 (loops, sort/filter/map/reduce, min/max, threshold compares, weighted arithmetic, exp/log/pow, clock, random, Map/Set, hash, prisma/raw-SQL, switch, state/retry/idempotency/reconcile tokens). Functions were extracted via the TypeScript compiler API for counting and fingerprinting.
- Coverage rule (deterministic, see decideCoverage): curated source-verified link => ALGORITHM_PRESENT; R8-B unresolved => UNRESOLVED (preserved, never upgraded); AI-lane/provider markers (aiGateway-owned paths or provider-SDK import/call shapes; comments, config checks, contract-type imports and labels never count) without backend decision logic => ALGORITHM_DELEGATED; strong signals without inspection => UNRESOLVED structural candidate for R8-D; otherwise NO_DISTINCT_ALGORITHM (a valid finding, not a failure).
- Detailed records: only source-verified curated procedures (30). Structural candidates are listed with file/symbol/signal evidence in Unresolved Algorithms, never promoted without inspection.
- Complexity is theoretical/static only with HIGH/MEDIUM/LOW/UNRESOLVED confidence. Database work is DB_QUERY_BOUND with bounded/unbounded, filter, take/limit, ordering and query counts where visible; query-plan complexity is never inferred from Prisma syntax. Provider work is PROVIDER_BOUND.
- Fingerprints normalize whitespace/comments (sha256, 16 hex) and are duplication evidence only, never final equivalence.
- Test evidence (grounded R8-C repair): test files are parsed with the TypeScript compiler API into real it(...)/test(...) blocks. DIRECT_BEHAVIOR_TEST requires the recorded algorithm symbol (or owning class method via conservative alias tracking: in-block construction, receiver statically imported from the recorded module, or case-folded singleton receiver) to be invoked inside the SAME test callback that asserts on its outcome (result variable, direct expect wrap, throw/reject path, or post-invocation state assertion for methods). INDIRECT_INTEGRATION_TEST requires a higher-level production-path invocation plus a same-block assertion plus structural import-graph reachability from the invoked production module to the algorithm module. CONTRACT_ONLY covers static shape/contract assertions without behavioral invocation. Filenames, stems, imports alone, comments, type names, and cross-block expects never prove evidence; uncertain cases downgrade (false negatives preferred). Benchmark evidence is grounded likewise: BENCHMARK_EVIDENCED requires actual target invocation inside a bench/benchmark harness or timing-measured repeated invocation; PERFORMANCE_TEST_ONLY covers real perf/load tests without a measured benchmark. Measured performance is uniformly NOT MEASURED IN R8-C.
- Prior art was NOT researched in R8-C; novelty/superiority claims are prohibited and gated.
- The Authentication / Authorization capability is prose-only in R8-B (section-table count 1, no LOGIC header); it is carried as PROSE-authentication-authorization-capability with identical coverage semantics and never invents a LOGIC ID.

## Coverage Summary

- Confirmed R8-B logic capabilities accounted: 103 / 103
- Unresolved R8-B logic candidates represented: 7 / 7
- ALGORITHM_PRESENT: 18 | NO_DISTINCT_ALGORITHM: 4 | ALGORITHM_DELEGATED: 3 | UNRESOLVED: 85
- Confirmed algorithm records: 30 | Structural candidates for R8-D: 78 | Exact-duplicate fingerprint groups: 61
- R8-E queue: P0=14 P1=14 P2=2

Logic ID | Domain | Coverage | Records / Notes
--- | --- | --- | ---
LOGIC-artifacts-api-copilot-artifacts | artifacts | ALGORITHM_PRESENT | ALG-artifacts-artifacts-media-stream-rank-score, ALG-artifacts-artifacts-study-stream-rank-score, ALG-artifacts-artifacts-recency-decay, ALG-artifacts-artifacts-content-fingerprint, ALG-artifacts-artifacts-replay-idempotency, ALG-artifacts-artifacts-media-dedupe-key
LOGIC-artifacts-api-copilot-videoawarepracticeroutes | artifacts | UNRESOLVED | —
LOGIC-artifacts-api-copilot-videolearningsessionroutes | artifacts | UNRESOLVED | —
LOGIC-artifacts-api-copilot-videorecommendationroutes | artifacts | ALGORITHM_PRESENT | ALG-artifacts-videoaware-external-video-dedupe
LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes | artifacts | ALGORITHM_PRESENT | ALG-mastery-growth-video-effectiveness-score
LOGIC-learning-core-api-copilot-copilothandoffroutes | learning-core | UNRESOLVED | —
LOGIC-learning-core-api-copilot-live-chat | learning-core | ALGORITHM_DELEGATED | —
LOGIC-learning-core-api-copilot-tutor-actions | learning-core | UNRESOLVED | —
LOGIC-learning-core-api-copilot-tutor-state | learning-core | UNRESOLVED | —
LOGIC-learning-core-api-copilot-tutor-turn | learning-core | UNRESOLVED | —
LOGIC-learning-core-api-tutor-tutorconversationroutes | learning-core | UNRESOLVED | —
LOGIC-mastery-api-copilot-adaptive-challenges | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-adaptive-recommendations | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-exam-mode | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-focus-mode | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-growth | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-practice-mastery | mastery | ALGORITHM_PRESENT | ALG-mastery-practicemastery-spaced-review-interval, ALG-mastery-practicemastery-evidence-level-ladder, ALG-mastery-practicemastery-next-practice-priority, ALG-mastery-practicemastery-score-threshold-ladder, ALG-mastery-practicemastery-score-compute
LOGIC-mastery-api-copilot-quiz-mode | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-remediation | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-revision-mode | mastery | UNRESOLVED | —
LOGIC-mastery-api-copilot-teach-back-mode | mastery | UNRESOLVED | —
LOGIC-mastery-api-learner-adaptivechallengeroutes | mastery | UNRESOLVED | —
LOGIC-mastery-api-phase3-confidence-recovery | mastery | ALGORITHM_PRESENT | ALG-mastery-confidencerecovery-mismatch-rank-dedupe
LOGIC-mastery-api-phase3-daily-learning-feed | mastery | ALGORITHM_PRESENT | ALG-mastery-dailyfeed-feed-rank-dedupe
LOGIC-mastery-api-phase3-daily-objective-checks | mastery | ALGORITHM_PRESENT | ALG-mastery-dailyobjective-idempotency-settle
LOGIC-mastery-api-phase3-growth-page | mastery | ALGORITHM_PRESENT | ALG-mastery-growth-topic-inference-signal-count
LOGIC-mastery-api-phase3-living-revision | mastery | UNRESOLVED | —
LOGIC-mastery-api-phase3-objectives | mastery | UNRESOLVED | —
LOGIC-mastery-api-phase3-study-plans | mastery | UNRESOLVED | —
LOGIC-memory-api-copilot-evidence | memory | UNRESOLVED | —
LOGIC-memory-api-copilot-learner-memory | memory | UNRESOLVED | —
LOGIC-memory-api-copilot-learner-transparency | memory | UNRESOLVED | —
LOGIC-memory-api-copilot-learning-evidence | memory | UNRESOLVED | —
LOGIC-memory-api-copilot-teacher-insights | memory | UNRESOLVED | —
LOGIC-memory-api-question-bank-result-learning-evidence | memory | UNRESOLVED | —
LOGIC-operations-api-deploymentreadinessroutes | operations | UNRESOLVED | —
LOGIC-operations-api-health-healthroutes | operations | UNRESOLVED | —
LOGIC-operations-api-ops-diagnostics | operations | ALGORITHM_PRESENT | ALG-operations-shared-pagination-cursor
LOGIC-operations-api-ops-opspublicrouter | operations | UNRESOLVED | —
LOGIC-operations-api-readinessroutes | operations | NO_DISTINCT_ALGORITHM | —
LOGIC-operations-api-task023-deployment-readiness | operations | UNRESOLVED | —
LOGIC-operations-api-task024-operations-readiness | operations | ALGORITHM_PRESENT | ALG-operations-reliability-ai-retry-backoff-jitter, ALG-operations-reliability-ai-circuit-breaker, ALG-operations-reliability-ai-rate-limit-window
LOGIC-operations-api-task024operationsroutes | operations | ALGORITHM_DELEGATED | —
LOGIC-operations-api-task025-pilot-readiness | operations | UNRESOLVED | —
LOGIC-operations-api-task025pilotroutes | operations | UNRESOLVED | —
LOGIC-operations-api-task026pilotexecutionroutes | operations | UNRESOLVED | —
LOGIC-operations-api-task027pilotexpansionroutes | operations | UNRESOLVED | —
LOGIC-operations-api-task028-controlled-expansion-execution | operations | UNRESOLVED | —
LOGIC-operations-api-task028expansionexecutionroutes | operations | UNRESOLVED | —
LOGIC-operations-api-task029expansionoperationsroutes | operations | UNRESOLVED | —
LOGIC-operations-api-task030-controlled-staging-rehearsal | operations | UNRESOLVED | —
LOGIC-operations-api-task031-staging-smoke-canary-readiness | operations | UNRESOLVED | —
LOGIC-operations-api-task032-controlled-canary-activation | operations | ALGORITHM_PRESENT | ALG-operations-canary-state-transition
LOGIC-operations-api-task033-controlled-canary-observation | operations | UNRESOLVED | —
LOGIC-operations-api-task034-controlled-limited-rollout | operations | UNRESOLVED | —
LOGIC-operations-api-task035-school-wide-readiness | operations | UNRESOLVED | —
LOGIC-operations-api-task036-live-school-launch | operations | UNRESOLVED | —
LOGIC-operations-api-task040-backend-freeze | operations | NO_DISTINCT_ALGORITHM | —
LOGIC-question-bank-api-content-governance-contentgovernanceroutes | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-learningmoderoutes | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-exam-delivery | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-exam-papers | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-examblueprintroutes | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-marking | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-marking-invocation | question-bank | UNRESOLVED | ALG-questionbank-markinginvocation-batch-mark-sweep
LOGIC-question-bank-api-question-bank-questionbankroutes | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-case-adjudication | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-case-triage | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-execution-authorization-preview | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome-action | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome-execution-simulation | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-progress | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-delivery | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-follow-up | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-governance | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-recovery | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-release | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-report-card-access | question-bank | NO_DISTINCT_ALGORITHM | —
LOGIC-question-bank-api-question-bank-result-report-card-export | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-report-cards | question-bank | UNRESOLVED | —
LOGIC-question-bank-api-task022-curriculum-governance | question-bank | UNRESOLVED | —
LOGIC-safety-api-copilot-no-ai-bypass | safety | UNRESOLVED | —
LOGIC-safety-api-copilot-tutorpolicyevaluateroutes | safety | ALGORITHM_PRESENT | ALG-safety-tutorpolicy-generation-policy-gate
LOGIC-safety-api-copilot-tutorsafechatroutes | safety | ALGORITHM_DELEGATED | —
LOGIC-safety-api-governance-privacygovernanceroutes | safety | UNRESOLVED | —
LOGIC-safety-api-learner-privacygovernanceroutes | safety | UNRESOLVED | —
LOGIC-safety-api-task020-security-privacy-governance | safety | ALGORITHM_PRESENT | ALG-safety-task020-auth-jwt-claim-extract
LOGIC-safety-api-task027-pilot-expansion-governance | safety | UNRESOLVED | —
LOGIC-school-api-copilot-learning-sessions | school | UNRESOLVED | —
LOGIC-school-api-copilot-learningprofileroutes | school | UNRESOLVED | —
LOGIC-school-api-learner-learnerpreferenceroutes | school | UNRESOLVED | —
LOGIC-school-api-learner-learnerrecommendationroutes | school | ALGORITHM_PRESENT | ALG-school-learnerrecommendation-priority-policy
LOGIC-school-api-learner-learnersessionroutes | school | UNRESOLVED | —
LOGIC-school-api-phase3-parent-support | school | UNRESOLVED | —
LOGIC-school-api-phase3-peer-learning | school | UNRESOLVED | —
LOGIC-school-api-profileroutes | school | NO_DISTINCT_ALGORITHM | —
LOGIC-school-api-schoolintegrationroutes | school | UNRESOLVED | —
LOGIC-school-api-task021-school-integration | school | ALGORITHM_PRESENT | ALG-school-schoolintegration-roster-reconcile, ALG-school-schoolintegration-roster-dryrun-conflict-scan
LOGIC-school-api-teacherinterventionroutes | school | UNRESOLVED | —
LOGIC-school-api-teacherreportroutes | school | UNRESOLVED | —
LOGIC-voice-api-copilot-airoutes | voice | ALGORITHM_PRESENT | ALG-voice-airoutes-express-rate-limit
LOGIC-voice-api-copilot-anomalies | voice | UNRESOLVED | —
LOGIC-voice-api-copilot-chat-pipeline | voice | UNRESOLVED | —
LOGIC-voice-api-copilot-intent | voice | UNRESOLVED | —
LOGIC-voice-api-copilot-latency | voice | UNRESOLVED | —
LOGIC-voice-api-voice-voiceroutes | voice | ALGORITHM_PRESENT | ALG-voice-voice-ledger-billing-quota
PROSE-authentication-authorization-capability | auth | ALGORITHM_PRESENT | ALG-safety-task020-auth-jwt-claim-extract

## Algorithm Taxonomy

Primary category distribution (curated records):

- AGGREGATION_OR_REDUCTION: 1
- BATCHING_OR_CHUNKING: 1
- CIRCUIT_BREAKER: 1
- DECAY_OR_RETENTION: 1
- DEDUPLICATION: 2
- DETERMINISTIC_RULE_SET: 4
- HASH_OR_FINGERPRINT: 1
- IDEMPOTENCY: 2
- PAGINATION_OR_CURSOR: 1
- RANKING_OR_TOP_K: 3
- RATE_LIMIT_OR_QUOTA: 3
- RECONCILIATION: 1
- RETRY_OR_BACKOFF: 1
- SCHEDULING_OR_PRIORITY: 2
- SCORE_OR_WEIGHTED_SCORE: 3
- SELECTION_OR_FILTERING: 2
- STATE_MACHINE: 1

Implementation-class distribution (curated records):

- EXTERNAL_LIBRARY_DELEGATED: 1
- PROJECT_DETERMINISTIC_POLICY: 15
- PROJECT_HEURISTIC: 9
- STANDARD_LIBRARY_DELEGATED: 2
- STANDARD_METHOD: 3

## Critical Algorithm Index

Algorithm ID | Domain | Purpose | Category | Source | Complexity | Bound | Risk flags | Test evidence | Benchmark | R8-E
--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---
ALG-artifacts-artifacts-content-fingerprint | artifacts | Derive a stable short identity for artifact content used by dedupe and replay detection. | HASH_OR_FINGERPRINT | `src/services/artifactService.ts:130-132` | O(n) in content bytes (library) (MEDIUM) | BOUNDED output; input size bounded by upload/parse limits upstream (UNRESOLVED here) | DATA_INTEGRITY+DUPLICATION_CANDIDATE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-artifacts-artifacts-media-dedupe-key | artifacts | Give each ingested media asset a stable identity so re-ingestion resolves to one row. | DEDUPLICATION | `src/services/mediaAssetService.ts:330-336` | O(n) in parts length (library) (MEDIUM) | BOUNDED output; key space per user | DATA_INTEGRITY+RETRY_IDEMPOTENCY+DATABASE_HOTSPOT_CANDIDATE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-artifacts-artifacts-media-stream-rank-score | artifacts | Score a media asset against learner context so the best study/creative asset can be selected. | SCORE_OR_WEIGHTED_SCORE | `src/media-stream/scoring.ts:65-149` | O(w), w = weak-topic count (small); else O(1) (MEDIUM) | BOUNDED per asset; corpus scan bound lives with caller (UNRESOLVED here) | MAGIC_CONSTANTS+SCALE_SENSITIVE+TIME_SENSITIVE+DUPLICATION_CANDIDATE | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P1
ALG-artifacts-artifacts-recency-decay | artifacts | Convert asset age into a decaying relevance bonus. | DECAY_OR_RETENTION | `src/media-stream/scoring.ts:37-42` | O(1) (HIGH) | BOUNDED output [0,22] | TIME_SENSITIVE+MAGIC_CONSTANTS | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P2
ALG-artifacts-artifacts-replay-idempotency | artifacts | Decide whether an incoming re-parse is a same-content replay that must not disturb stored truth. | IDEMPOTENCY | `src/services/artifactService.ts:476-483` | O(n) in incoming content bytes (hash) (MEDIUM) | BOUNDED per call | DATA_INTEGRITY+RETRY_IDEMPOTENCY | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-artifacts-artifacts-study-stream-rank-score | artifacts | Extend the base media score with revision-lane signals (due-now, needs-attention, spacing) for study ranking. | RANKING_OR_TOP_K | `src/media-stream/scoring.ts:168-221` | O(n) over bounded revision-id sets + base score (HIGH) | BOUNDED per asset | MAGIC_CONSTANTS+TIME_SENSITIVE+DUPLICATION_CANDIDATE | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P1
ALG-artifacts-videoaware-external-video-dedupe | artifacts | Merge YouTube/Vimeo candidate lists into one deduped set keeping the stronger record per video. | DEDUPLICATION | `src/services/externalVideoCandidateService.ts:38-56` | O(n) single pass (HIGH) | BOUNDED per request by provider limits; cache is module-local (MEMORY_HOTSPOT_CANDIDATE for R8-E) | NETWORK_COST+PROVIDER_COST+MEMORY_HOTSPOT_CANDIDATE+MAGIC_CONSTANTS | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P1
ALG-mastery-confidencerecovery-mismatch-rank-dedupe | mastery | Collapse duplicate mismatch detections and order them for recovery follow-up. | RANKING_OR_TOP_K | `src/services/phase3ConfidenceMismatchDetectionService.ts:186-218` | application CPU: O(n log n) sort + O(n) dedupe (HIGH) | BOUNDED in practice; small fixed type vocabulary | ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P1
ALG-mastery-dailyfeed-feed-rank-dedupe | mastery | Collapse duplicate objective items, derive urgency-aware priorities, and order the learner feed. | RANKING_OR_TOP_K | `src/services/phase3DailyLearningFeedRankingService.ts:14-176` | application CPU: O(n log n) sort + O(n) dedupe; database: none in unit (MEDIUM) | BOUNDED in practice by daily item volume; no explicit cap in unit — POTENTIALLY_UNBOUNDED input noted | TIME_SENSITIVE+SCALE_SENSITIVE+UNBOUNDED_DATA | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-mastery-dailyobjective-idempotency-settle | mastery | Guarantee exactly-once settlement of a check session across retries, races and partial failures. | IDEMPOTENCY | `src/services/phase3DailyObjectiveCheckCompletionService.ts:25-115` | O(1) map operations (HIGH) | BOUNDED per session; module Map growth across sessions is a MEMORY_HOTSPOT_CANDIDATE for R8-E | DATA_INTEGRITY+CONCURRENCY_SENSITIVE+RETRY_IDEMPOTENCY+MEMORY_HOTSPOT_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-mastery-growth-topic-inference-signal-count | mastery | Infer a topic label and next step from bounded recent learning-effect signals plus progress/mistake snapshots. | AGGREGATION_OR_REDUCTION | `src/services/masteryInferenceService.ts:61-129` | O(n), n<=40 events, plus fixed signal-vocabulary Sets (HIGH) | BOUNDED | MASTERY_SENSITIVITY+ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS+DATABASE_HOTSPOT_CANDIDATE | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P0
ALG-mastery-growth-video-effectiveness-score | mastery | Score whether a video actually improves learning (not just gets watched) and gate continued recommendation. | SCORE_OR_WEIGHTED_SCORE | `src/services/videoEffectivenessScoringService.ts:26-52` | O(1) (HIGH) | BOUNDED output [0,1] | ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-mastery-practicemastery-evidence-level-ladder | mastery | Map accumulated evidence counts, correctness ratio and confidence into a mastery ladder level. | DETERMINISTIC_RULE_SET | `src/services/mastery/masteryEvidenceAggregationService.ts:13-40` | O(1) (HIGH) | BOUNDED | MASTERY_SENSITIVITY+ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS+DUPLICATION_CANDIDATE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-mastery-practicemastery-next-practice-priority | mastery | Decide what the tutor should do next from misconceptions, recent attempts and review state. | SELECTION_OR_FILTERING | `src/services/nextPracticeService.ts:36-121` | O(n) over bounded windows (n<=10) (HIGH) | BOUNDED | MASTERY_SENSITIVITY+ACADEMIC_CORRECTNESS+RANDOMNESS_SENSITIVE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-mastery-practicemastery-score-compute | mastery | Convert a mastery level plus confidence into a capped 0-100 score. | SCORE_OR_WEIGHTED_SCORE | `src/services/masteryScoringService.ts:101-119` | O(1) (HIGH) | BOUNDED | ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-mastery-practicemastery-score-threshold-ladder | mastery | Derive a bounded mastery level from attempt history while detecting regression and blocking one-shot mastery. | DETERMINISTIC_RULE_SET | `src/services/masteryScoringService.ts:20-80` | O(T), T=6 table rows (HIGH) | BOUNDED | MASTERY_SENSITIVITY+ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS+DUPLICATION_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-mastery-practicemastery-spaced-review-interval | mastery | Compute when a skill must next be reviewed from priority, mastery level, mistakes and independent successes. | SCHEDULING_OR_PRIORITY | `src/services/mastery/spacedReviewPlanner.ts:24-63` | O(1) (HIGH) | BOUNDED (interval clamped [1,90]) | MASTERY_SENSITIVITY+ACADEMIC_CORRECTNESS+TIME_SENSITIVE+MAGIC_CONSTANTS | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-operations-canary-state-transition | operations | Admit or block canary lifecycle transitions with role and path guards, recording an auditable transition. | STATE_MACHINE | `src/services/task032CanaryActivationStateMachine.ts:16-66` | O(1) (HIGH) | BOUNDED | AUTHORIZATION_SENSITIVE+DATA_INTEGRITY+SECURITY_SENSITIVE+DUPLICATION_CANDIDATE | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P0
ALG-operations-reliability-ai-circuit-breaker | operations | Stop calling failing providers fast and probe recovery without manual intervention. | CIRCUIT_BREAKER | `src/services/aiRuntimeCircuitBreakerService.ts:5-80` | O(1) map operations (HIGH) | BOUNDED key space; counters reset on transitions | RETRY_IDEMPOTENCY+TIME_SENSITIVE+CONCURRENCY_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-operations-reliability-ai-rate-limit-window | operations | Enforce per-minute quotas at three scopes before provider calls are admitted. | RATE_LIMIT_OR_QUOTA | `src/services/aiRuntimeRateLimitGuardService.ts:21-107` | O(w) filter scan per scope check, w = events in window (MEDIUM) | POTENTIALLY_UNBOUNDED timestamp arrays under burst (prune only on check) — flagged UNBOUNDED_DATA for R8-E | SCALE_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE+UNBOUNDED_DATA+CONCURRENCY_SENSITIVE+PROVIDER_COST+MAGIC_CONSTANTS | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-operations-reliability-ai-retry-backoff-jitter | operations | Decide whether a failed provider call may retry and how long to wait, without retry storms. | RETRY_OR_BACKOFF | `src/services/aiRuntimeRetryPolicyService.ts:8-107` | O(1) (HIGH) | BOUNDED attempts and capped delay | RETRY_IDEMPOTENCY+PROVIDER_COST+RANDOMNESS_SENSITIVE+TIME_SENSITIVE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-operations-shared-pagination-cursor | operations | Clamp client pagination input and describe page position so list endpoints cannot request unbounded pages. | PAGINATION_OR_CURSOR | `src/services/apiPaginationService.ts:15-63` | O(1) (HIGH) | BOUNDED (limit ≤ 100 enforced) | SCALE_SENSITIVE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P2
ALG-questionbank-markinginvocation-batch-mark-sweep | question-bank | Mark all deterministic-mode batch items while isolating failures and tracking batch lifecycle. | BATCHING_OR_CHUNKING | `src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts:14-56` | O(b) sequential items, b = batch size (MEDIUM) | POTENTIALLY_UNBOUNDED batch size — flagged for R8-E chunking review | ASSESSMENT_INTEGRITY+SCALE_SENSITIVE+UNBOUNDED_DATA+DATABASE_HOTSPOT_CANDIDATE+CPU_HOTSPOT_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-safety-task020-auth-jwt-claim-extract | safety | Prove caller identity from JWT and derive a normalized user/role/school triple without trusting URL shape. | DETERMINISTIC_RULE_SET | `src/middleware/schoolAuthMiddleware.ts:18-77` | O(1) (HIGH) | BOUNDED | SECURITY_SENSITIVE+AUTHORIZATION_SENSITIVE+PRIVACY_SENSITIVE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-safety-tutorpolicy-generation-policy-gate | safety | Decide whether the tutor may generate, in which safe mode, before any provider call. | DETERMINISTIC_RULE_SET | `src/services/aiGateway/generationPolicyGate.ts:10-70` | O(1) (HIGH) | BOUNDED | SECURITY_SENSITIVE+PRIVACY_SENSITIVE+ACADEMIC_CORRECTNESS+ASSESSMENT_INTEGRITY+DUPLICATION_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-school-learnerrecommendation-priority-policy | school | Fix the display order and explanation contract for every learner recommendation type. | SCHEDULING_OR_PRIORITY | `src/services/learnerTransparencyContracts.ts:172-183` | O(1) table lookup (HIGH) | BOUNDED (10-type vocabulary) | ACADEMIC_CORRECTNESS+MAGIC_CONSTANTS | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-school-schoolintegration-roster-dryrun-conflict-scan | school | Preview a roster payload for duplicate ids and school-scope mismatches before any write. | SELECTION_OR_FILTERING | `src/services/rosterSyncDryRunService.ts:9-70` | O(n) three passes (HIGH) | POTENTIALLY_UNBOUNDED input (whole-school payloads) — flagged for R8-E | DATA_INTEGRITY+PRIVACY_SENSITIVE+UNBOUNDED_DATA+SCALE_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE | DIRECT_BEHAVIOR_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-school-schoolintegration-roster-reconcile | school | Turn an external roster diff into safe per-entry mapping actions without losing learning history. | RECONCILIATION | `src/services/task021RosterReconciliationService.ts:19-90` | O(n) single pass over entries (HIGH) | POTENTIALLY_UNBOUNDED input (school-size rosters) — flagged for R8-E batching review | DATA_INTEGRITY+PRIVACY_SENSITIVE+UNBOUNDED_DATA+SCALE_SENSITIVE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P0
ALG-voice-airoutes-express-rate-limit | voice | Cap per-user AI, speech-to-text, text-to-speech and general request rates to bound provider cost and abuse. | RATE_LIMIT_OR_QUOTA | `src/routes/ai/ai-middleware.ts:24-46` | library-dependent / UNRESOLVED (LOW) | window-bounded counters; redis keys expire (60s) | PROVIDER_COST+NETWORK_COST+SCALE_SENSITIVE+MAGIC_CONSTANTS+DUPLICATION_CANDIDATE+SECURITY_SENSITIVE | INDIRECT_INTEGRATION_TEST | NO_BENCHMARK_EVIDENCE | P1
ALG-voice-voice-ledger-billing-quota | voice | Enforce per-student voice time quotas with auditable double-entry style ledger updates. | RATE_LIMIT_OR_QUOTA | `src/services/voiceLedgerService.ts:105-213` | application CPU: O(g), g = active grants (FIFO loop) (MEDIUM) | BOUNDED per student by grant volume; ledger tail fixed at 10 | DATA_INTEGRITY+CONCURRENCY_SENSITIVE+DATABASE_HOTSPOT_CANDIDATE+AUTHORIZATION_SENSITIVE | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | P0

## Authentication / Authorization

Authentication is enforced mount-globally via schoolAuthMiddleware (R8-A mount evidence) with school-context and role layers; there is no standalone auth LOGIC capability in R8-B. The source-verified procedure is recorded under Safety / Privacy / Governance (ALG-safety-task020-auth-jwt-claim-extract) and referenced here without duplication.

## Learning Core

No source-verified independent algorithm record in this domain. Evaluated capabilities and their states appear below; unsupported detail is omitted rather than invented.

Evaluated capabilities in this domain (6):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-learning-core-api-copilot-copilothandoffroutes | UNRESOLVED | —
LOGIC-learning-core-api-copilot-live-chat | ALGORITHM_DELEGATED | —
LOGIC-learning-core-api-copilot-tutor-actions | UNRESOLVED | —
LOGIC-learning-core-api-copilot-tutor-state | UNRESOLVED | —
LOGIC-learning-core-api-copilot-tutor-turn | UNRESOLVED | —
LOGIC-learning-core-api-tutor-tutorconversationroutes | UNRESOLVED | —

## Memory / Evidence

No source-verified independent algorithm record in this domain. Evaluated capabilities and their states appear below; unsupported detail is omitted rather than invented.

Evaluated capabilities in this domain (6):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-memory-api-copilot-evidence | UNRESOLVED | —
LOGIC-memory-api-copilot-learner-memory | UNRESOLVED | —
LOGIC-memory-api-copilot-learner-transparency | UNRESOLVED | —
LOGIC-memory-api-copilot-learning-evidence | UNRESOLVED | —
LOGIC-memory-api-copilot-teacher-insights | UNRESOLVED | —
LOGIC-memory-api-question-bank-result-learning-evidence | UNRESOLVED | —

## Mastery / Objectives / Practice / Revision

### ALG-mastery-confidencerecovery-mismatch-rank-dedupe

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-phase3-confidence-recovery (linkage: CURATED_AFFINITY — Mismatch ranking serves confidence-recovery flow; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Confidence-mismatch dedupe and priority ranking

PURPOSE / PROBLEM

Collapse duplicate mismatch detections and order them for recovery follow-up.

SOURCE
- path: `src/services/phase3ConfidenceMismatchDetectionService.ts`
- symbol: `rankConfidenceMismatches/dedupeConfidenceMismatches`
- relevant lines: 186-218

PRIMARY CATEGORY

RANKING_OR_TOP_K

SECONDARY TAGS

DEDUPLICATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

Phase3ConfidenceMismatch[] (studentId, mismatchType, objectiveId).

OUTPUTS

deduped, priority-sorted mismatch array.

DATA STRUCTURES

- Set<string> composite key (student-mismatch-objective)
- priority Record table
- Array sort (library)

DECISION / COMPUTATION METHOD

Set-key dedupe (first occurrence wins); fixed numeric priority table (source_required=0 … none=7, unknown=99); ascending numeric sort.

KEY PARAMETERS
- priority table 0-7 + 99 fallback (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none (library sort delegated)

THEORETICAL TIME COMPLEXITY

application CPU: O(n log n) sort + O(n) dedupe

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

number of detected mismatches per evaluation

BOUND STATUS

BOUNDED in practice; small fixed type vocabulary

CORRECTNESS INVARIANTS
- dedupe key is total over (student, type, objective)
- escalation types (0) always surface first

EDGE CASES

unknown mismatchType sorts last (99)

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

learner confidence data; scoped upstream

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P1 — Orders recovery follow-ups learners see; small unit but user-facing and policy-table driven.

RISK FLAGS

ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-dailyfeed-feed-rank-dedupe

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-phase3-daily-learning-feed (linkage: CURATED_AFFINITY — Feed ranking serves the daily-learning-feed capability; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Daily-learning-feed dedupe, priority derivation and ranking

PURPOSE / PROBLEM

Collapse duplicate objective items, derive urgency-aware priorities, and order the learner feed.

SOURCE
- path: `src/services/phase3DailyLearningFeedRankingService.ts`
- symbol: `Phase3DailyLearningFeedRankingService.rankDailyLearningFeedItems/dedupeFeedItemsByObjective/sortFeedItemsForLearner/deriveFeedItemPriority`
- relevant lines: 14-176

PRIMARY CATEGORY

RANKING_OR_TOP_K

SECONDARY TAGS

DEDUPLICATION, SCHEDULING_OR_PRIORITY

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

Phase3DailyLearningFeedItem[] (objectiveId, itemType, priority, dueAt, createdAt).

OUTPUTS

deduped, priority-sorted, optionally sliced feed array.

DATA STRUCTURES

- Map<objectiveId, item> (dedupe)
- priority/type order Record tables
- Array sort (library)

DECISION / COMPUTATION METHOD

Map-collapse per objective keeping the lowest DEDUPE_ORDER rank; priority derivation switch with due-date escalation (overdue => urgent/high); stable multi-key sort priority => type => dueAt => createdAt desc; optional slice limit.

KEY PARAMETERS
- PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER table (NAMED_POLICY_CONSTANT)
- priorityOrder urgent=0/high=1/medium=2/low=3/blocked=0 (NAMED_POLICY_CONSTANT)
- typeOrder 12-entry table (NAMED_POLICY_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none (pure over input array)

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none (library sort delegated)

THEORETICAL TIME COMPLEXITY

application CPU: O(n log n) sort + O(n) dedupe; database: none in unit

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

number of feed items per learner per day

BOUND STATUS

BOUNDED in practice by daily item volume; no explicit cap in unit — POTENTIALLY_UNBOUNDED input noted

CORRECTNESS INVARIANTS
- one item per objective survives dedupe
- urgent always precedes lower priorities

EDGE CASES

unknown itemType/priority fall back to 99/9; missing dueAt handled by comparator branches

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

learner feed content; scoped upstream

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/phase3-daily-learning-feed-ranking-service.test.ts::"teacher_support is urgent"::L28::invokes deriveFeedItemPriority::assert L29`, `src/tests/phase3-daily-learning-feed-ranking-service.test.ts::"source_required is urgent when due today"::L32::invokes deriveFeedItemPriority::assert L34`, `src/tests/phase3-daily-learning-feed-ranking-service.test.ts::"source_required is high when not due"::L37::invokes deriveFeedItemPriority::assert L39`, `src/tests/phase3-daily-learning-feed-ranking-service.test.ts::"objective_rescue is high"::L42::invokes deriveFeedItemPriority::assert L43`, `src/tests/phase3-daily-learning-feed-ranking-service.test.ts::"continue_check is high"::L46::invokes deriveFeedItemPriority::assert L47`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — User-facing daily ordering; sort/dedupe cost grows with feed size and priority-table quality is heuristic.

RISK FLAGS

TIME_SENSITIVE, SCALE_SENSITIVE, UNBOUNDED_DATA

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-dailyobjective-idempotency-settle

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-phase3-daily-objective-checks (linkage: CURATED_AFFINITY — Completion idempotency serves the daily-objective-check capability; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Daily-objective-check completion idempotency and settlement

PURPOSE / PROBLEM

Guarantee exactly-once settlement of a check session across retries, races and partial failures.

SOURCE
- path: `src/services/phase3DailyObjectiveCheckCompletionService.ts`
- symbol: `idempotencyStore/idempotencyKeyForSession/getIdempotencyRecord/upsertIdempotencyRecord`
- relevant lines: 25-115

PRIMARY CATEGORY

IDEMPOTENCY

SECONDARY TAGS

CONCURRENCY_COORDINATION, RECONCILIATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

checkSessionId (+ school/student context); IdempotencyRecord checkpoints (weakSignalRef, completion state).

OUTPUTS

settled completion result; completed retries return the prior result without duplication.

DATA STRUCTURES

- module Map<string, IdempotencyRecord> (fast path)
- prisma DailyObjectiveCheckCompletionIdempotencyRecord (durable path, upsert by idempotencyKey)

DECISION / COMPUTATION METHOD

Stable key per session; check-before-act on read path and before ownership acquisition; checkpointed multi-step settlement with reconcile-on-version-conflict reload; already-completed retries short-circuit to stored result.

KEY PARAMETERS
- key = session-scoped stable string (NAMED policy: idempotencyKeyForSession)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none in verified unit

STATE READ

module Map + durable idempotency table

STATE WRITE

checkpoints + final record (Map and Prisma upsert/update)

EXTERNAL / LIBRARY DEPENDENCIES
- prisma (findUnique/upsert/update on idempotency record)

THEORETICAL TIME COMPLEXITY

O(1) map operations

THEORETICAL SPACE COMPLEXITY

O(k) module entries; durable rows O(sessions)

I/O / DATABASE / NETWORK COMPLEXITY

database: bounded idempotency reads/writes per settlement (DB_QUERY_BOUND); network: none

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

number of concurrent settlements per session

BOUND STATUS

BOUNDED per session; module Map growth across sessions is a MEMORY_HOTSPOT_CANDIDATE for R8-E

CORRECTNESS INVARIANTS
- same checkSessionId yields one settlement
- completed work is never duplicated on retry
- lost races reconcile by reload, not overwrite

EDGE CASES

version conflict mid-settlement; weak-signal partial state; retry after completion

FAILURE BEHAVIOR

conflicts resolve via reload-and-reconcile; failures leave checkpoints for resume

CONCURRENCY / ORDERING ASSUMPTIONS

CONCURRENCY_SENSITIVE: check-then-act guarded by durable upsert + reconcile loop

SECURITY / PRIVACY IMPLICATIONS

scoped by school/student keys

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (idempotency pattern recurs in marking-invocation and roster intake as DOMAIN_SPECIFIC_VARIANTs — equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/task-021-final-restart-read-behavior.contract.test.ts::"idempotency store can be cleared and re-created"::L87::invokes getIdempotencyRecord::assert L97`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Exactly-once settlement guards evidence/mastery writes against duplication under retry and concurrency.

RISK FLAGS

DATA_INTEGRITY, CONCURRENCY_SENSITIVE, RETRY_IDEMPOTENCY, MEMORY_HOTSPOT_CANDIDATE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, symbol/line evidence via structural grep + R8-B service linkage)

### ALG-mastery-growth-topic-inference-signal-count

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-phase3-growth-page (linkage: CURATED_AFFINITY — Topic mastery inference feeds growth reporting; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Topic mastery-state inference from learning-effect events

PURPOSE / PROBLEM

Infer a topic label and next step from bounded recent learning-effect signals plus progress/mistake snapshots.

SOURCE
- path: `src/services/masteryInferenceService.ts`
- symbol: `getTopicMasteryState/buildNextBestStep`
- relevant lines: 61-129

PRIMARY CATEGORY

AGGREGATION_OR_REDUCTION

SECONDARY TAGS

PROBABILITY_OR_INFERENCE, SELECTION_OR_FILTERING

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

userId/topic/subject. Reads: latest progress row, latest mistake row, last 40 learning-effect events.

OUTPUTS

TopicMasteryState|null with label and next-best-step string.

DATA STRUCTURES

- Set (positive/negative signal vocabularies)
- Array filter/count passes

DECISION / COMPUTATION METHOD

Three parallel bounded reads; Set-membership counting of positive vs negative event types over ≤40 events; rate thresholds pick remediation vs confirmation next steps (0.34 repeated-mistake, 0.45 support-dependence).

KEY PARAMETERS
- take=40 events (INLINE_MAGIC_CONSTANT)
- repeatedMistakeRate>=0.34 (INLINE_MAGIC_CONSTANT)
- supportDependenceLevel>=0.45 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

progress, mistake, learningEffectEvent tables

STATE WRITE

none (ensureLearningEffectEventTable DDL guard may create)

EXTERNAL / LIBRARY DEPENDENCIES
- prisma (bounded reads)

THEORETICAL TIME COMPLEXITY

O(n), n<=40 events, plus fixed signal-vocabulary Sets

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

database: 3 bounded queries (2 findFirst + 1 findMany take 40); network: none

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

fixed window of 40 events per call

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- empty topic returns null (no inference without subject)
- fixed signal vocabularies bound classification

EDGE CASES

no events; mixed signals; missing progress row

FAILURE BEHAVIOR

UNRESOLVED statically beyond verified prefix

CONCURRENCY / ORDERING ASSUMPTIONS

read-only inference; safe

SECURITY / PRIVACY IMPLICATIONS

scoped by userId; learner-data sensitive

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P0 — Produces the mastery label learners and teachers see; rate-threshold quality is heuristic.

RISK FLAGS

MASTERY_SENSITIVITY, ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS, DATABASE_HOTSPOT_CANDIDATE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, verified prefix lines 61-129)

### ALG-mastery-growth-video-effectiveness-score

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes (linkage: CURATED_AFFINITY — Effectiveness scoring serves video-learning analytics consumed by growth reporting; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Video-effectiveness weighted scoring with learner-count confidence

PURPOSE / PROBLEM

Score whether a video actually improves learning (not just gets watched) and gate continued recommendation.

SOURCE
- path: `src/services/videoEffectivenessScoringService.ts`
- symbol: `calculateScore/scoreVideoEffectiveness`
- relevant lines: 26-52

PRIMARY CATEGORY

SCORE_OR_WEIGHTED_SCORE

SECONDARY TAGS

AGGREGATION_OR_REDUCTION

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

Six rates (open, meaningful-progress, reflection, practice-completion, improvement, no-weakness) + totalLearners.

OUTPUTS

{ score 0..1 (2dp), confidence low|medium|high } + shouldContinueRecommending downstream.

DATA STRUCTURES

- WEIGHTS record (sums to 1.0)
- scalars

DECISION / COMPUTATION METHOD

Convex combination with weights 0.05/0.10/0.15/0.25/0.30/0.15 (improvement dominant; passive open-rate minimal by design); confidence by learner count (<3 low, <10 medium, else high); zero learners short-circuits to 0/low.

KEY PARAMETERS
- WEIGHTS 0.05/0.10/0.15/0.25/0.30/0.15 (NAMED_POLICY_CONSTANT)
- confidence cutoffs 3/10 learners (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

aggregated analytics events passed in

STATE WRITE

none in unit

EXTERNAL / LIBRARY DEPENDENCIES
- videoLearningAnalyticsContracts (types; internal)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit; aggregation upstream is event-count bounded (UNRESOLVED here)

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per video scoring call

BOUND STATUS

BOUNDED output [0,1]

CORRECTNESS INVARIANTS
- weights sum to 1.0 (convex)
- no data yields 0/low with explicit warnings, never a mid score
- watch rate alone cannot produce high effectiveness

EDGE CASES

totalLearners=0; all-zero rates

FAILURE BEHAVIOR

no failure path (pure); insufficient-data warnings are data

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

aggregated counts only in unit; no learner rows

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/video-effectiveness-scoring-service.test.ts::"returns low score for empty events"::L24::invokes scoreVideoEffectiveness::assert L26`, `src/tests/video-effectiveness-scoring-service.test.ts::"does not count passive watching as effectiveness"::L30::invokes scoreVideoEffectiveness::assert L40`, `src/tests/video-effectiveness-scoring-service.test.ts::"scores higher with improvement after practice"::L43::invokes scoreVideoEffectiveness::assert L53`, `src/tests/video-effectiveness-scoring-service.test.ts::"flags low improvement rate with warning"::L57::invokes scoreVideoEffectiveness::assert L67`, `src/tests/video-effectiveness-scoring-service.test.ts::"recommends continuing for effective videos"::L70::invokes scoreVideoEffectiveness::assert L86`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Decides which videos keep being recommended; weight quality and confidence cutoffs are heuristic.

RISK FLAGS

ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-practicemastery-evidence-level-ladder

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-copilot-practice-mastery (linkage: CURATED_AFFINITY — Evidence aggregation feeds the practice/mastery snapshot; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Mastery-level inference from attempt evidence

PURPOSE / PROBLEM

Map accumulated evidence counts, correctness ratio and confidence into a mastery ladder level.

SOURCE
- path: `src/services/mastery/masteryEvidenceAggregationService.ts`
- symbol: `computeMasteryLevel`
- relevant lines: 13-40

PRIMARY CATEGORY

DETERMINISTIC_RULE_SET

SECONDARY TAGS

PROBABILITY_OR_INFERENCE

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

evidenceCount; independentCorrectCount; hintDependentCorrectCount; incorrectCount; confidenceScore.

OUTPUTS

MasterySignalLevel (not_started|emerging|developing|secure|strong).

DATA STRUCTURES

- scalars only

DECISION / COMPUTATION METHOD

Ordered threshold ladder evaluated top-down: zero-evidence guard; correctness ratio; anti-inflation floor (ratio<=0.2 or confidence<0.1 blocks progress); strong (5 independent, 0.85, 0.7); secure (3 evidence, 0.75, 0.5); developing (2, 0.5, 0.3); emerging (1, 0.2).

KEY PARAMETERS
- ratio floors 0.2/0.5/0.75/0.85 (INLINE_MAGIC_CONSTANT)
- evidence floors 1/2/3/5 (INLINE_MAGIC_CONSTANT)
- confidence floors 0.1/0.3/0.5/0.7 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

snapshot counters passed in

STATE WRITE

none in this unit (caller persists)

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in this unit; caller performs bounded snapshot read/write

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

per-attempt; constant work

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- no evidence yields not_started
- low ratio or confidence can never promote
- ladder order is total: first match wins

EDGE CASES

totalAttempts=0; hint-only correct counts toward ratio but not independence

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

learning-outcome sensitive; no PII handling in unit

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (distinct from masteryScoringService ladder; different level vocabulary — DOMAIN_SPECIFIC_VARIANT, equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/task-011-deen-evidence-safety.contract.test.ts::"should store learning process only for Deen evidence"::L27::invokes task011TutorTurnIntegrationService.processValidatedTutorTurn→src/services/mastery/masteryEvidenceAggregationService.ts::assert L42`, `src/tests/task-011-deen-evidence-safety.contract.test.ts::"should not create mastery aggregation for Deen turns that would store religious facts"::L82::invokes task011TutorTurnIntegrationService.processValidatedTutorTurn→src/services/mastery/masteryEvidenceAggregationService.ts::assert L98`, `src/tests/task-011-tutor-turn-integration.contract.test.ts::"should process a validated correct practice turn"::L29::invokes task011TutorTurnIntegrationService.processValidatedTutorTurn→src/services/mastery/masteryEvidenceAggregationService.ts::assert L50`, `src/tests/task-011-tutor-turn-integration.contract.test.ts::"should skip learning persistence for safety turns"::L56::invokes task011TutorTurnIntegrationService.processValidatedTutorTurn→src/services/mastery/masteryEvidenceAggregationService.ts::assert L66`, `src/tests/task-011-tutor-turn-integration.contract.test.ts::"should not create normal mastery evidence for integrity-blocked turns"::L73::invokes task011TutorTurnIntegrationService.processValidatedTutorTurn→src/services/mastery/masteryEvidenceAggregationService.ts::assert L85`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Directly decides reported mastery; anti-inflation thresholds need correctness proof under scale.

RISK FLAGS

MASTERY_SENSITIVITY, ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-practicemastery-next-practice-priority

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-copilot-practice-mastery (linkage: CURATED_AFFINITY — Next-practice recommendation serves practice/mastery flow; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Next-practice recommendation cascade

PURPOSE / PROBLEM

Decide what the tutor should do next from misconceptions, recent attempts and review state.

SOURCE
- path: `src/services/nextPracticeService.ts`
- symbol: `NextPracticeService.recommendNextPractice`
- relevant lines: 36-121

PRIMARY CATEGORY

SELECTION_OR_FILTERING

SECONDARY TAGS

SCHEDULING_OR_PRIORITY

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

ResolvedTutorIdentity; NextPracticeRequest (subject/topic/skillIds/artifactIds). Live reads: active misconceptions (limit 5), recent attempts (limit 10).

OUTPUTS

NextPracticeRecommendation[] with action/priority/difficulty/source/evidence links.

DATA STRUCTURES

- Array scan with find()
- Set (uniqueStrings dedupe)

DECISION / COMPUTATION METHOD

Documented 7-step priority cascade: active misconception > recent incorrect > review due > developing > proficient > strong > no-data fallback. Earlier steps suppress later ones (misconception presence blocks reteach branch).

KEY PARAMETERS
- misconception limit=5 (INLINE_MAGIC_CONSTANT)
- attempt window limit=10 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

recommendationId uses Math.random identity suffix (lines 26-28); decision path unaffected

STATE READ

misconception + attempt stores via services

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- masteryService, misconceptionService, spacedReviewService, practiceAttemptService (internal)

THEORETICAL TIME COMPLEXITY

O(n) over bounded windows (n<=10)

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

database: two bounded reads (limits 5 and 10); network: none

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

bounded windows; constant per call

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- misconception remediation precedes reteach
- no-data input yields clarifying question, never a blind advance

EDGE CASES

empty misconceptions and attempts; partially_correct vs incorrect branching

FAILURE BEHAVIOR

service read failures propagate as exceptions (no silent fallback in verified prefix)

CONCURRENCY / ORDERING ASSUMPTIONS

read-only assembly; safe

SECURITY / PRIVACY IMPLICATIONS

scoped by ResolvedTutorIdentity (school/student)

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/practice-mastery-route.test.ts::"POST next returns recommendations"::L62::invokes NextPracticeService.recommendNextPractice::assert L71`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Governs the learning path after every attempt; cascade order errors directly change outcomes.

RISK FLAGS

MASTERY_SENSITIVITY, ACADEMIC_CORRECTNESS, RANDOMNESS_SENSITIVE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, verified prefix lines 36-121)

### ALG-mastery-practicemastery-score-compute

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-copilot-practice-mastery (linkage: CURATED_AFFINITY — Display-score derivation for mastery reporting; domain affinity only.)

CAPABILITY

Mastery display-score computation

PURPOSE / PROBLEM

Convert a mastery level plus confidence into a capped 0-100 score.

SOURCE
- path: `src/services/masteryScoringService.ts`
- symbol: `MasteryScoringService.computeScore`
- relevant lines: 101-119

PRIMARY CATEGORY

SCORE_OR_WEIGHTED_SCORE

SECONDARY TAGS

none

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

level (8 states); confidence (low|medium|high).

OUTPUTS

integer score 0-100.

DATA STRUCTURES

- Record lookup tables (baseScore, confMultiplier)

DECISION / COMPUTATION METHOD

Base score per level (0/15/30/50/70/90/25/10) times confidence multiplier (0.8/1.0/1.1), rounded and capped at 100.

KEY PARAMETERS
- baseScore table (INLINE_MAGIC_CONSTANT)
- confMultiplier 0.8/1.0/1.1 (INLINE_MAGIC_CONSTANT)
- cap 100 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per call

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- output always within [0,100]
- regressing/needs_remediation score below emerging

EDGE CASES

unknown level defaults to 0 via fallback

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

reported-score sensitive (learner-facing)

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/mastery-scoring-confidence.test.ts::"computeScore returns higher for mastered + high confidence"::L58::invokes MasteryScoringService.computeScore::assert L60`, `src/tests/mastery-scoring-confidence.test.ts::"computeScore returns lower for unknown + low confidence"::L63::invokes MasteryScoringService.computeScore::assert L65`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Derived display score; the level decision (P0 ladder above) owns correctness, but score mapping shapes learner/teacher perception.

RISK FLAGS

ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-practicemastery-score-threshold-ladder

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-copilot-practice-mastery (linkage: CURATED_AFFINITY — Mastery scoring serves practice/mastery flow; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Mastery-level derivation with regression guard

PURPOSE / PROBLEM

Derive a bounded mastery level from attempt history while detecting regression and blocking one-shot mastery.

SOURCE
- path: `src/services/masteryScoringService.ts`
- symbol: `MasteryScoringService.deriveMasteryLevel`
- relevant lines: 20-80

PRIMARY CATEGORY

DETERMINISTIC_RULE_SET

SECONDARY TAGS

PROBABILITY_OR_INFERENCE

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

attemptCount; correctCount; incorrectCount; streakIncorrect. Threshold table MASTERY_LEVEL_THRESHOLDS (6 rows).

OUTPUTS

MasteryLevel (unknown|introduced|emerging|developing|proficient|mastered|regressing|needs_remediation).

DATA STRUCTURES

- threshold table Array (reverse scan)

DECISION / COMPUTATION METHOD

Guards first (zero attempts; zero evaluated), regression check (streak>=3 with history), remediation check, then reverse table scan: first row whose minAttempts/minCorrectRatio/maxIncorrectStreak all hold wins.

KEY PARAMETERS
- MASTERY_LEVEL_THRESHOLDS rows: (0,0,99) (1,0.5,2) (2,0.4,3) (3,0.5,2) (5,0.7,1) (8,0.85,0) (NAMED_POLICY_CONSTANT)
- regression gate streak>=3/attempts>=5/ratio>=0.5 (INLINE_MAGIC_CONSTANT)
- remediation gate streak>=2/ratio<0.4 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

counters passed in

STATE WRITE

none in this unit

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(T), T=6 table rows

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in this unit

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per call

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- never mastered from one correct answer (minAttempts=8, streak 0)
- regression detectable only with history>=5

EDGE CASES

all-incorrect history; hint-inflated correct counts handled upstream

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

learning-outcome sensitive

DUPLICATION / EQUIVALENCE STATUS

DOMAIN_SPECIFIC_VARIANT vs computeMasteryLevel (different level vocabulary; equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/mastery-scoring-confidence.test.ts::"returns unknown for 0 attempts"::L5::invokes MasteryScoringService.deriveMasteryLevel::assert L7`, `src/tests/mastery-scoring-confidence.test.ts::"one correct answer does not create mastered state"::L10::invokes MasteryScoringService.deriveMasteryLevel::assert L12`, `src/tests/mastery-scoring-confidence.test.ts::"one wrong answer does not create permanent misconception"::L16::invokes MasteryScoringService.deriveMasteryLevel::assert L18`, `src/tests/mastery-scoring-confidence.test.ts::"repeated correct answers increase mastery"::L21::invokes MasteryScoringService.deriveMasteryLevel::assert L25`, `src/tests/mastery-scoring-confidence.test.ts::"high correct ratio with enough attempts reaches mastered"::L28::invokes MasteryScoringService.deriveMasteryLevel::assert L30`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Core mastery truth with anti-inflation guarantees; threshold table needs correctness proof.

RISK FLAGS

MASTERY_SENSITIVITY, ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-mastery-practicemastery-spaced-review-interval

DOMAIN

mastery

LINKED LOGIC ID(S)

LOGIC-mastery-api-copilot-practice-mastery (linkage: CURATED_AFFINITY — Spaced-review planning serves practice/mastery revision; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Spaced-review interval planning per skill

PURPOSE / PROBLEM

Compute when a skill must next be reviewed from priority, mastery level, mistakes and independent successes.

SOURCE
- path: `src/services/mastery/spacedReviewPlanner.ts`
- symbol: `SpacedReviewPlanner.planReview`
- relevant lines: 24-63

PRIMARY CATEGORY

SCHEDULING_OR_PRIORITY

SECONDARY TAGS

DECAY_OR_RETENTION

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

priority (high|medium|low|none); masteryLevel; confidenceScore; mistakeCount; independentSuccessCount.

OUTPUTS

SpacedReviewPlan { intervalDays, dueAt ISO, priority, reason }.

DATA STRUCTURES

- Record<RevisionPriority, number> lookup table

DECISION / COMPUTATION METHOD

Priority base interval, then ordered overrides: secure/strong mastery floors via max(); mistake>=3 collapses to 1 day; success>=5 stretches into [14,60]; final clamp to [1,90]; dueAt = now + intervalDays.

KEY PARAMETERS
- DEFAULT_INTERVALS high=1/medium=3/low=7/none=30 (NAMED_POLICY_CONSTANT)
- SECURE_MAINTENANCE_INTERVAL=14 (NAMED_POLICY_CONSTANT)
- STRONG_MAINTENANCE_INTERVAL=30 (NAMED_POLICY_CONSTANT)
- mistakeCount>=3, successCount>=5, clamp [1,90] (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none (pure function of params)

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O; batch wrapper planBatchReviews maps O(n) over items

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

number of skills planned per call (batch map)

BOUND STATUS

BOUNDED (interval clamped [1,90])

CORRECTNESS INVARIANTS
- intervalDays always within [1,90]
- secure/strong mastery never reviewed sooner than maintenance floor
- 3+ mistakes force next-day review

EDGE CASES

unknown priority falls back to 7; zero counts skip overrides

FAILURE BEHAVIOR

no failure path (pure); invalid input degrades to defaults

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

none directly; learning-outcome sensitive

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/task-011-spaced-review-planner.test.ts::"should plan 1 day interval for high priority"::L5::invokes SpacedReviewPlanner.planReview::assert L18`, `src/tests/task-011-spaced-review-planner.test.ts::"should plan 3 day interval for medium priority"::L22::invokes SpacedReviewPlanner.planReview::assert L35`, `src/tests/task-011-spaced-review-planner.test.ts::"should plan 14 day interval for secure maintenance"::L38::invokes SpacedReviewPlanner.planReview::assert L51`, `src/tests/task-011-spaced-review-planner.test.ts::"should plan 30 day interval for strong maintenance"::L54::invokes SpacedReviewPlanner.planReview::assert L67`, `src/tests/task-011-spaced-review-planner.test.ts::"should shorten interval after repeated mistakes"::L70::invokes SpacedReviewPlanner.planReview::assert L83`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Drives revision timing and therefore mastery outcomes; interval quality is heuristic and unmeasured.

RISK FLAGS

MASTERY_SENSITIVITY, ACADEMIC_CORRECTNESS, TIME_SENSITIVE, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

Evaluated capabilities in this domain (18):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-mastery-api-copilot-adaptive-challenges | UNRESOLVED | —
LOGIC-mastery-api-copilot-adaptive-recommendations | UNRESOLVED | —
LOGIC-mastery-api-copilot-exam-mode | UNRESOLVED | —
LOGIC-mastery-api-copilot-focus-mode | UNRESOLVED | —
LOGIC-mastery-api-copilot-growth | UNRESOLVED | —
LOGIC-mastery-api-copilot-practice-mastery | ALGORITHM_PRESENT | ALG-mastery-practicemastery-spaced-review-interval, ALG-mastery-practicemastery-evidence-level-ladder, ALG-mastery-practicemastery-next-practice-priority, ALG-mastery-practicemastery-score-threshold-ladder, ALG-mastery-practicemastery-score-compute
LOGIC-mastery-api-copilot-quiz-mode | UNRESOLVED | —
LOGIC-mastery-api-copilot-remediation | UNRESOLVED | —
LOGIC-mastery-api-copilot-revision-mode | UNRESOLVED | —
LOGIC-mastery-api-copilot-teach-back-mode | UNRESOLVED | —
LOGIC-mastery-api-learner-adaptivechallengeroutes | UNRESOLVED | —
LOGIC-mastery-api-phase3-confidence-recovery | ALGORITHM_PRESENT | ALG-mastery-confidencerecovery-mismatch-rank-dedupe
LOGIC-mastery-api-phase3-daily-learning-feed | ALGORITHM_PRESENT | ALG-mastery-dailyfeed-feed-rank-dedupe
LOGIC-mastery-api-phase3-daily-objective-checks | ALGORITHM_PRESENT | ALG-mastery-dailyobjective-idempotency-settle
LOGIC-mastery-api-phase3-growth-page | ALGORITHM_PRESENT | ALG-mastery-growth-topic-inference-signal-count
LOGIC-mastery-api-phase3-living-revision | UNRESOLVED | —
LOGIC-mastery-api-phase3-objectives | UNRESOLVED | —
LOGIC-mastery-api-phase3-study-plans | UNRESOLVED | —

## Artifacts / Media

### ALG-artifacts-artifacts-content-fingerprint

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Fingerprinting underpins artifact identity and replay checks; domain affinity only.)

CAPABILITY

SHA-256 content fingerprint (16-hex truncation)

PURPOSE / PROBLEM

Derive a stable short identity for artifact content used by dedupe and replay detection.

SOURCE
- path: `src/services/artifactService.ts`
- symbol: `computeFingerprint`
- relevant lines: 130-132

PRIMARY CATEGORY

HASH_OR_FINGERPRINT

SECONDARY TAGS

DEDUPLICATION

IMPLEMENTATION CLASS

STANDARD_LIBRARY_DELEGATED

INPUTS

content string (empty-safe).

OUTPUTS

16-char hex digest.

DATA STRUCTURES

- string buffer (library)

DECISION / COMPUTATION METHOD

crypto.createHash(sha256).update(content||"").digest(hex).slice(0,16). Twin implementations exist in artifactParserService.ts:30 and artifactStructuredRepository.ts:39.

KEY PARAMETERS
- sha256 algorithm + 16-char truncation (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- EXTERNAL_LIBRARY_DELEGATED: node crypto sha256 (library-dependent complexity)

THEORETICAL TIME COMPLEXITY

O(n) in content bytes (library)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

artifact content size

BOUND STATUS

BOUNDED output; input size bounded by upload/parse limits upstream (UNRESOLVED here)

CORRECTNESS INVARIANTS
- same content yields same fingerprint (empty-safe)
- truncation is fixed width

EDGE CASES

empty/null content fingerprints to hash of empty string

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

fingerprints are content-derived identifiers, not secrets; no raw content stored by this unit

DUPLICATION / EQUIVALENCE STATUS

PARALLEL_VARIANT_CANDIDATE across artifactService / artifactParserService / artifactStructuredRepository (same sha256-hex-slice shape; normalized bodies differ by symbol/signature so analyzer fingerprints do not confirm exact duplication; behavioral equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/artifact-learner-memory-integration.test.ts::"builds safe memory signals without raw text"::L5::invokes artifactLearnerMemoryBridge.buildArtifactMemorySignals→src/services/artifactService.ts::assert L9`, `src/tests/artifact-learner-memory-integration.test.ts::"returns bounded number of signals"::L16::invokes artifactLearnerMemoryBridge.buildArtifactMemorySignals→src/services/artifactService.ts::assert L20`, `src/tests/artifact-live-chat-integration.test.ts::"runs artifact reasoning pipeline for explain question"::L14::invokes artifactReasoningContextResolver.resolveContext→src/services/artifactService.ts::assert L22`, `src/tests/artifact-live-chat-integration.test.ts::"handles clarification path without AI"::L55::invokes artifactReasoningContextResolver.resolveContext→src/services/artifactService.ts::assert L61`, `src/tests/artifact-live-chat-integration.test.ts::"handles unsafe artifact instruction path"::L65::invokes artifactReasoningContextResolver.resolveContext→src/services/artifactService.ts::assert L86`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Identity primitive for dedupe/idempotency; the 16-hex truncation collision margin deserves one measurement, not redesign.

RISK FLAGS

DATA_INTEGRITY, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-artifacts-media-dedupe-key

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Media-asset dedupe key supports idempotent ingestion; domain affinity only.)

CAPABILITY

Media-asset dedupe-key derivation and lookup

PURPOSE / PROBLEM

Give each ingested media asset a stable identity so re-ingestion resolves to one row.

SOURCE
- path: `src/services/mediaAssetService.ts`
- symbol: `buildMediaAssetDedupeKey`
- relevant lines: 330-336

PRIMARY CATEGORY

DEDUPLICATION

SECONDARY TAGS

HASH_OR_FINGERPRINT, IDEMPOTENCY

IMPLEMENTATION CLASS

STANDARD_LIBRARY_DELEGATED

INPUTS

ordered string parts (ids, urls, titles).

OUTPUTS

sha1 hex digest; consumed by findMediaAssetByDedupeKey with a partial uniqueness constraint on (userId, dedupeKey).

DATA STRUCTURES

- normalized joined string
- database uniqueness constraint (raw SQL lines 388-390)

DECISION / COMPUTATION METHOD

Trim/lowercase/filter/join with | separator, then sha1 hex. Lookup and insert paths key on (userId, dedupeKey) with WHERE dedupeKey IS NOT NULL.

KEY PARAMETERS
- separator | (INLINE_MAGIC_CONSTANT)
- sha1 algorithm choice (project decision; non-security dedupe use)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

MediaAsset rows by key

STATE WRITE

dedupeKey column on insert

EXTERNAL / LIBRARY DEPENDENCIES
- EXTERNAL_LIBRARY_DELEGATED: node crypto sha1
- prisma raw SQL for table/index (runtime DDL guard)

THEORETICAL TIME COMPLEXITY

O(n) in parts length (library)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

database: bounded keyed lookup/insert (DB_QUERY_BOUND); network: none

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

ingestion volume per user

BOUND STATUS

BOUNDED output; key space per user

CORRECTNESS INVARIANTS
- normalization order is fixed (case/space-insensitive identity)
- null key never collides (partial index)

EDGE CASES

all-empty parts yield hash of empty string; separator collision across part splits (accepted, unmeasured)

FAILURE BEHAVIOR

DB failure surfaces to caller; no silent double-insert (constraint)

CONCURRENCY / ORDERING ASSUMPTIONS

uniqueness constraint is the arbiter under races

SECURITY / PRIVACY IMPLICATIONS

key components may include user content; digest is not reversible by this unit

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/r6-learning-intelligence-integration.test.ts::"Growth with Progress.mastery=100 and no canonical evidence does NOT project confident mastery"::L277::invokes getGrowthOverview→src/services/mediaAssetService.ts::assert L319`, `src/r6-learning-intelligence-integration.test.ts::"due revision with canonical incorrect evidence produces high-priority recommendation with real target"::L343::invokes getLearningIntelligenceSnapshot→src/services/mediaAssetService.ts::assert L379`, `src/r6-learning-intelligence-integration.test.ts::"growth read issues no writes against LearningEvidence or Mastery stores"::L401::invokes getGrowthOverview→src/services/mediaAssetService.ts::assert L424`, `src/r6-learning-intelligence-integration.test.ts::"clearing process cache rebuilds the same weak-topic projection"::L433::invokes getGrowthWeakTopics→src/services/mediaAssetService.ts::assert L474`, `src/r6-learning-intelligence-integration.test.ts::"canonical weak target outranks contradictory self-reported weak area"::L670::invokes generateAdaptiveStudyPlan→src/services/mediaAssetService.ts::assert L721`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Ingestion identity primitive; separator-collision margin and index behavior under volume deserve measurement.

RISK FLAGS

DATA_INTEGRITY, RETRY_IDEMPOTENCY, DATABASE_HOTSPOT_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-artifacts-media-stream-rank-score

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Media-stream scoring serves artifact/media recommendation; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Media-stream weighted relevance scoring

PURPOSE / PROBLEM

Score a media asset against learner context so the best study/creative asset can be selected.

SOURCE
- path: `src/media-stream/scoring.ts`
- symbol: `computeMediaStreamScore`
- relevant lines: 65-149

PRIMARY CATEGORY

SCORE_OR_WEIGHTED_SCORE

SECONDARY TAGS

DECAY_OR_RETENTION, SIMILARITY_OR_MATCHING

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

MediaAsset (topic/subject/kind/scores/trust/language/duration/completion/helpfulness) + MediaStreamRankingContext (activeTopic, weakTopics, preferences, exam/focus mode).

OUTPUTS

rounded integer score.

DATA STRUCTURES

- normalized topic strings (substring match)
- scalar accumulators

DECISION / COMPUTATION METHOD

Base 20 plus ~20 additive boosts: recommended score passthrough, exponential recency decay, completion/helpfulness, active/weak topic matches (+34/+36), kind preference, source-trust table, transcript/language/level/need matches, exam/focus bonuses, creative-mode external-source and clamped composite terms.

KEY PARAMETERS
- base=20 (INLINE_MAGIC_CONSTANT)
- topic boosts 34/36, exam 24, recency 22*exp(-days/18) (INLINE_MAGIC_CONSTANT)
- trust table 16/14/10/6/2 (INLINE_MAGIC_CONSTANT)
- creative clamp weights 16/16/14/10/18 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- ./metadata getMediaKindGroup (require)
- ./validation helpers (internal)

THEORETICAL TIME COMPLEXITY

O(w), w = weak-topic count (small); else O(1)

THEORETICAL SPACE COMPLEXITY

O(w)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

weak-topic list length; number of assets scored per request (caller-side loop)

BOUND STATUS

BOUNDED per asset; corpus scan bound lives with caller (UNRESOLVED here)

CORRECTNESS INVARIANTS
- score is a pure function of (asset, ctx) at time t
- study/creative branches are exclusive

EDGE CASES

missing metadata degrades each term to neutral; unparseable dates yield zero recency

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

topic/subject matching over learner context; scoped upstream

DUPLICATION / EQUIVALENCE STATUS

DOMAIN_SPECIFIC_VARIANT vs computeStudyStreamScore (study layer extends this base; equivalence UNPROVEN, consolidation FORBIDDEN in R8-C)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P1 — Core recommendation quality function; ~20 heuristic weights unmeasured and caller-side corpus size unknown.

RISK FLAGS

MAGIC_CONSTANTS, SCALE_SENSITIVE, TIME_SENSITIVE, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-artifacts-recency-decay

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Recency term consumed by media scoring; domain affinity only.)

CAPABILITY

Exponential recency boost

PURPOSE / PROBLEM

Convert asset age into a decaying relevance bonus.

SOURCE
- path: `src/media-stream/scoring.ts`
- symbol: `getRecencyBoost`
- relevant lines: 37-42

PRIMARY CATEGORY

DECAY_OR_RETENTION

SECONDARY TAGS

none

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

updatedAt ISO string|null.

OUTPUTS

integer bonus 0..22.

DATA STRUCTURES

- scalars only

DECISION / COMPUTATION METHOD

Age in days from Date.now; bonus = max(0, round(22 * exp(-days/18))); unparseable date yields 0.

KEY PARAMETERS
- amplitude 22, time constant 18 days (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

system clock

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per call

BOUND STATUS

BOUNDED output [0,22]

CORRECTNESS INVARIANTS
- monotone non-increasing in age
- never negative

EDGE CASES

future dates clamp to 0 days (full bonus); null input yields 0

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

none

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (getStudySpacingBoost is a separate windowed variant — DOMAIN_SPECIFIC_VARIANT, equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P2 — Tiny pure function; decay shape worth confirming once against engagement data, not on a critical path.

RISK FLAGS

TIME_SENSITIVE, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-artifacts-replay-idempotency

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Replay guard protects artifact truth; domain affinity only.)

CAPABILITY

Artifact re-parse replay guard

PURPOSE / PROBLEM

Decide whether an incoming re-parse is a same-content replay that must not disturb stored truth.

SOURCE
- path: `src/services/artifactService.ts`
- symbol: `isReplayWithSameFingerprint`
- relevant lines: 476-483

PRIMARY CATEGORY

IDEMPOTENCY

SECONDARY TAGS

DEDUPLICATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

existing LearningArtifact (contentFingerprint, blockCount, parseStatus); incomingContent string.

OUTPUTS

boolean replay verdict.

DATA STRUCTURES

- scalar comparison

DECISION / COMPUTATION METHOD

Recompute fingerprint of incoming content; replay iff fingerprints match AND blockCount>0 AND parseStatus is parsed. Empty content is never a replay.

KEY PARAMETERS
- blockCount>0, status==parsed gate (INLINE policy)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

existing artifact row passed in

STATE WRITE

none in this unit (caller skips write on true)

EXTERNAL / LIBRARY DEPENDENCIES
- computeFingerprint (same module)

THEORETICAL TIME COMPLEXITY

O(n) in incoming content bytes (hash)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

re-parse content size

BOUND STATUS

BOUNDED per call

CORRECTNESS INVARIANTS
- failed/partial projections can never be confirmed as replays
- empty content never matches

EDGE CASES

fingerprint collision (sha256-truncated; accepted risk, unmeasured)

FAILURE BEHAVIOR

false verdict falls through to guarded update path (last-known-good preserved per updateArtifactParseResult)

CONCURRENCY / ORDERING ASSUMPTIONS

pure predicate; safe

SECURITY / PRIVACY IMPLICATIONS

none in unit

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/r3-structured-artifact.test.ts::"TEST7: repeated parse with same content fingerprint does not duplicate truth (stable projection)"::L402::invokes isReplayWithSameFingerprint::assert L420`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Guards stored artifact truth against re-parse corruption; paired with the atomic update path.

RISK FLAGS

DATA_INTEGRITY, RETRY_IDEMPOTENCY

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-artifacts-study-stream-rank-score

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-artifacts (linkage: CURATED_AFFINITY — Study-stream scoring serves artifact/media recommendation; domain affinity only.)

CAPABILITY

Study-stream revision-aware ranking score

PURPOSE / PROBLEM

Extend the base media score with revision-lane signals (due-now, needs-attention, spacing) for study ranking.

SOURCE
- path: `src/media-stream/scoring.ts`
- symbol: `computeStudyStreamScore`
- relevant lines: 168-221

PRIMARY CATEGORY

RANKING_OR_TOP_K

SECONDARY TAGS

SCORE_OR_WEIGHTED_SCORE, SCHEDULING_OR_PRIORITY

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

MediaAsset + context extended with dueNow/needsAttention/continue/recent revision id sets, seed topics, active revision id.

OUTPUTS

rounded integer score.

DATA STRUCTURES

- 4 revision-id Sets (O(1) membership)
- scalar accumulators

DECISION / COMPUTATION METHOD

Base study-mode score plus revision boosts: +18 revision link, +56 active item, +34 due-now, +30 needs-attention, +18 continue, +10 recent; interaction/completion caps; spacing boost; -18 penalty for context-free non-revision items.

KEY PARAMETERS
- revision boosts 56/34/30/18/18/10 (INLINE_MAGIC_CONSTANT)
- interaction cap 8, completion cap 6 (INLINE_MAGIC_CONSTANT)
- spacing windows [1.5,8]/[8,21]/<0.35 days (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- computeMediaStreamScore (same file)
- ./metadata (internal)

THEORETICAL TIME COMPLEXITY

O(n) over bounded revision-id sets + base score

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

revision-set sizes per learner

BOUND STATUS

BOUNDED per asset

CORRECTNESS INVARIANTS
- revision-linked items dominate context-free items
- penalty applies only when no signal matches

EDGE CASES

empty revision sets; duration 0 skips duration bonus

FAILURE BEHAVIOR

no failure path (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

revision linkage over learner data; scoped upstream

DUPLICATION / EQUIVALENCE STATUS

DOMAIN_SPECIFIC_VARIANT vs computeMediaStreamScore (layered extension, not duplicate)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P1 — Final study ordering function; revision-boost magnitudes are heuristic and drive what learners open.

RISK FLAGS

MAGIC_CONSTANTS, TIME_SENSITIVE, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-artifacts-videoaware-external-video-dedupe

DOMAIN

artifacts

LINKED LOGIC ID(S)

LOGIC-artifacts-api-copilot-videorecommendationroutes (linkage: CURATED_AFFINITY — External candidate merge serves video recommendation; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

Cross-provider external video candidate merge with quality preference

PURPOSE / PROBLEM

Merge YouTube/Vimeo candidate lists into one deduped set keeping the stronger record per video.

SOURCE
- path: `src/services/externalVideoCandidateService.ts`
- symbol: `dedupeCandidates`
- relevant lines: 38-56

PRIMARY CATEGORY

DEDUPLICATION

SECONDARY TAGS

CACHE_OR_COALESCING

IMPLEMENTATION CLASS

PROJECT_HEURISTIC

INPUTS

ExternalVideoCandidate[] from parallel provider fetches (merged at line 101).

OUTPUTS

deduped candidate array.

DATA STRUCTURES

- Map<sourceType:sourceVideoId, candidate>
- SERVICE_CACHE Map with TTL (lines 61-63)

DECISION / COMPUTATION METHOD

Single pass keyed on stable provider id; on collision keep the higher composite (educationalConfidence + clarityScore + 0.25 captions bonus). Served behind a TTL cache keyed on normalized request (limit default 12).

KEY PARAMETERS
- captions bonus 0.25 (INLINE_MAGIC_CONSTANT)
- default limit 12 (INLINE_MAGIC_CONSTANT)
- SERVICE_CACHE_TTL_MS (NAMED_POLICY_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none in this unit

STATE READ

SERVICE_CACHE module Map

STATE WRITE

SERVICE_CACHE module Map

EXTERNAL / LIBRARY DEPENDENCIES
- provider fetchers (YouTube/Vimeo; network-bound, not decomposed here)

THEORETICAL TIME COMPLEXITY

O(n) single pass

THEORETICAL SPACE COMPLEXITY

O(n)

I/O / DATABASE / NETWORK COMPLEXITY

network: provider-bound fan-out (callers); cache short-circuits repeats within TTL

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

candidates per provider per request; request rate vs TTL

BOUND STATUS

BOUNDED per request by provider limits; cache is module-local (MEMORY_HOTSPOT_CANDIDATE for R8-E)

CORRECTNESS INVARIANTS
- one record per stable video id
- quality comparison is total and deterministic

EDGE CASES

empty merge yields noticed empty deck (line 102); single-provider degradation noticed (line 105)

FAILURE BEHAVIOR

provider failure degrades to partial deck with notices, not an exception (verified lines 100-107)

CONCURRENCY / ORDERING ASSUMPTIONS

module cache shared across requests; TTL check-then-use is best-effort (UNRESOLVED ordering under race)

SECURITY / PRIVACY IMPLICATIONS

external provider data; no learner PII in key

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P1 — Provider-cost and latency hinge on this merge + cache; TTL and quality-weight behavior unmeasured.

RISK FLAGS

NETWORK_COST, PROVIDER_COST, MEMORY_HOTSPOT_CANDIDATE, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

Evaluated capabilities in this domain (5):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-artifacts-api-copilot-artifacts | ALGORITHM_PRESENT | ALG-artifacts-artifacts-media-stream-rank-score, ALG-artifacts-artifacts-study-stream-rank-score, ALG-artifacts-artifacts-recency-decay, ALG-artifacts-artifacts-content-fingerprint, ALG-artifacts-artifacts-replay-idempotency, ALG-artifacts-artifacts-media-dedupe-key
LOGIC-artifacts-api-copilot-videoawarepracticeroutes | UNRESOLVED | —
LOGIC-artifacts-api-copilot-videolearningsessionroutes | UNRESOLVED | —
LOGIC-artifacts-api-copilot-videorecommendationroutes | ALGORITHM_PRESENT | ALG-artifacts-videoaware-external-video-dedupe
LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes | ALGORITHM_PRESENT | ALG-mastery-growth-video-effectiveness-score

## Curriculum / Assessment / Question Bank

### ALG-questionbank-markinginvocation-batch-mark-sweep

DOMAIN

question-bank

LINKED LOGIC ID(S)

LOGIC-question-bank-api-question-bank-marking-invocation (linkage: CURATED_AFFINITY — Service names match the marking-invocation capability mount; the R8-B capability stays UNRESOLVED (no importOrigin) — this record proves the procedure, not the route link.)

CAPABILITY

Deterministic marking batch sweep with per-item failure isolation

PURPOSE / PROBLEM

Mark all deterministic-mode batch items while isolating failures and tracking batch lifecycle.

SOURCE
- path: `src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts`
- symbol: `DeterministicMarkingInvocationService.executeDeterministicBatch`
- relevant lines: 14-56

PRIMARY CATEGORY

BATCHING_OR_CHUNKING

SECONDARY TAGS

STATE_MACHINE, SELECTION_OR_FILTERING

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

markingBatchId; markingRunId; policy defaults MARKING_INVOCATION_POLICY_DEFAULTS.

OUTPUTS

{ batch (running|completed + timestamps), markedItems[], failedItems[] }.

DATA STRUCTURES

- filtered item Array
- marked/failed accumulator Arrays

DECISION / COMPUTATION METHOD

Policy gate first (missingDecision may POLICY_BLOCK); filter items to deterministic|rubric_deterministic modes; sequential per-item execution with try/catch isolation (failures marked failed with timestamp, batch continues); batch flips to completed only when failedItems is empty.

KEY PARAMETERS
- itemMode vocabulary deterministic|rubric_deterministic|unsupported_deferred (project policy)
- completion rule: zero failures (project policy)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

batch + item repositories (in-memory default; prisma twins exist)

STATE WRITE

item statuses, batch lifecycle timestamps

EXTERNAL / LIBRARY DEPENDENCIES
- markingInvocationPolicyDefinitions, repository contracts (internal); in-memory vs prisma repository twins (SHARED_BY_DESIGN per R8-B)

THEORETICAL TIME COMPLEXITY

O(b) sequential items, b = batch size

THEORETICAL SPACE COMPLEXITY

O(b) accumulators

I/O / DATABASE / NETWORK COMPLEXITY

database: O(b) repository reads/writes via injected repos (DB_QUERY_BOUND); network: none

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

batch size; per-item execution cost

BOUND STATUS

POTENTIALLY_UNBOUNDED batch size — flagged for R8-E chunking review

CORRECTNESS INVARIANTS
- non-deterministic modes are never marked here (filtered + guarded)
- completed requires zero failures
- failed items keep timestamps, batch stays running

EDGE CASES

missing batch throws NOT_FOUND; unsupported items route to markUnsupportedItemDeferred (skip, not fail)

FAILURE BEHAVIOR

per-item isolation: one failure cannot fail the sweep; policy block aborts before any write

CONCURRENCY / ORDERING ASSUMPTIONS

sequential loop; parallel marking UNRESOLVED (no concurrency here — safe but slow at scale)

SECURITY / PRIVACY IMPLICATIONS

ASSESSMENT_INTEGRITY sensitive: marking outcomes; audit via repository writes

DUPLICATION / EQUIVALENCE STATUS

SHARED_CANONICAL_UTILITY pattern for repos (in-memory/prisma twins by design)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/domains/assessment/marking-invocation/tests/package-8-deterministic-marking-bridge.test.ts::"deterministic marking can execute on eligible batch items"::L19::invokes DeterministicMarkingInvocationService.executeDeterministicBatch::assert L37`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Assessment pipeline sweep; batch-size scaling and per-item cost unmeasured (correctness of mode gating already policy-clear).

RISK FLAGS

ASSESSMENT_INTEGRITY, SCALE_SENSITIVE, UNBOUNDED_DATA, DATABASE_HOTSPOT_CANDIDATE, CPU_HOTSPOT_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

Evaluated capabilities in this domain (26):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-question-bank-api-content-governance-contentgovernanceroutes | UNRESOLVED | —
LOGIC-question-bank-api-learningmoderoutes | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-exam-delivery | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-exam-papers | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-examblueprintroutes | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-marking | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-marking-invocation | UNRESOLVED | ALG-questionbank-markinginvocation-batch-mark-sweep
LOGIC-question-bank-api-question-bank-questionbankroutes | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-case-adjudication | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-case-triage | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-execution-authorization-preview | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome-action | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-outcome-execution-simulation | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-recovery-progress | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-delivery | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-follow-up | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-governance | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-recovery | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-release | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-report-card-access | NO_DISTINCT_ALGORITHM | —
LOGIC-question-bank-api-question-bank-result-report-card-export | UNRESOLVED | —
LOGIC-question-bank-api-question-bank-result-report-cards | UNRESOLVED | —
LOGIC-question-bank-api-task022-curriculum-governance | UNRESOLVED | —

## Teacher / School / Administration

### ALG-school-learnerrecommendation-priority-policy

DOMAIN

school

LINKED LOGIC ID(S)

LOGIC-school-api-learner-learnerrecommendationroutes (linkage: CURATED_AFFINITY — Recommendation priority policy serves learner-recommendation surfaces; R8-B structural route link UNRESOLVED, name+domain affinity only.)

CAPABILITY

Learner-recommendation type priority and reason policy

PURPOSE / PROBLEM

Fix the display order and explanation contract for every learner recommendation type.

SOURCE
- path: `src/services/learnerTransparencyContracts.ts`
- symbol: `RECOMMENDATION_TYPE_PRIORITY/getRecommendationPriority`
- relevant lines: 172-183

PRIMARY CATEGORY

SCHEDULING_OR_PRIORITY

SECONDARY TAGS

DETERMINISTIC_RULE_SET

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

LearnerRecommendationType (10 types).

OUTPUTS

priority 1-10 + reason policy (reasonCode, templates, confidenceLabel).

DATA STRUCTURES

- Record-type lookup tables (priority + reason policy)

DECISION / COMPUTATION METHOD

Total-order table: revision_due=1, mistake/spaced-review=2, foundation=3, mastery/continue=4, similar=5, teacher_help=6, challenge=7, deen_referral=8. Accessor getRecommendationPriority (line 308) reads the table.

KEY PARAMETERS
- priority values 1-8 over 10 types (NAMED_POLICY_CONSTANT)
- reason templates per type (project policy content)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none (static tables)

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(1) table lookup

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per recommendation

BOUND STATUS

BOUNDED (10-type vocabulary)

CORRECTNESS INVARIANTS
- every known type has exactly one priority and one reason policy
- revision/mistake signals outrank challenge content

EDGE CASES

unknown type lookup behavior UNRESOLVED (accessor past line 308 not inspected here)

FAILURE BEHAVIOR

no failure path in table

CONCURRENCY / ORDERING ASSUMPTIONS

static; safe

SECURITY / PRIVACY IMPLICATIONS

templates are student-facing; deen-referral type is sensitivity-relevant

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/learner-agency-options.test.ts::"builds recommended option first - first option has recommended: true"::L10::invokes buildLearnerAgencyOptions→src/services/learnerTransparencyContracts.ts::assert L13`, `src/tests/learner-agency-options.test.ts::"provides safe alternatives"::L17::invokes buildLearnerAgencyOptions→src/services/learnerTransparencyContracts.ts::assert L21`, `src/tests/learner-agency-options.test.ts::"limits options to reasonable number - not empty"::L24::invokes buildLearnerAgencyOptions→src/services/learnerTransparencyContracts.ts::assert L27`, `src/tests/learner-agency-options.test.ts::"includes ask_for_hint option when appropriate - for non-deen types"::L31::invokes buildLearnerAgencyOptions→src/services/learnerTransparencyContracts.ts::assert L35`, `src/tests/learner-agency-options.test.ts::"includes ask_teacher_for_help when appropriate - for teacher_help_suggested"::L39::invokes buildLearnerAgencyOptions→src/services/learnerTransparencyContracts.ts::assert L43`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — User-facing order of learning guidance; priority-table quality shapes what learners do next.

RISK FLAGS

ACADEMIC_CORRECTNESS, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-school-schoolintegration-roster-dryrun-conflict-scan

DOMAIN

school

LINKED LOGIC ID(S)

LOGIC-school-api-task021-school-integration (linkage: CURATED_AFFINITY — Dry-run conflict scan serves school-integration intake; name+domain affinity only.)

CAPABILITY

Roster-sync dry-run conflict scan

PURPOSE / PROBLEM

Preview a roster payload for duplicate ids and school-scope mismatches before any write.

SOURCE
- path: `src/services/rosterSyncDryRunService.ts`
- symbol: `performRosterSyncDryRun`
- relevant lines: 9-70

PRIMARY CATEGORY

SELECTION_OR_FILTERING

SECONDARY TAGS

DEDUPLICATION, RECONCILIATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

RosterSyncInput { schoolId, students[], teachers[], classes[] }.

OUTPUTS

RosterSyncDryRunResult { conflicts[] (type, externalId, severity, safeDetails), summary, warnings }.

DATA STRUCTURES

- 3 Sets (seenStudentIds, seenTeacherIds, seenClassIds)
- conflicts Array

DECISION / COMPUTATION METHOD

Three linear passes (students, teachers, classes): Set-membership duplicate detection plus per-record schoolId equality check; every hit appends a high-severity typed conflict with safe details.

KEY PARAMETERS
- severity high for duplicates and school mismatches (project policy)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none (randomUUID import at line 7 is for result ids, not decisions)

STATE READ

none (pure over input)

STATE WRITE

none (dry-run by contract)

EXTERNAL / LIBRARY DEPENDENCIES
- contracts/schoolSystemBridgeContracts (types)
- crypto randomUUID (ids only)

THEORETICAL TIME COMPLEXITY

O(n) three passes

THEORETICAL SPACE COMPLEXITY

O(n) Sets + conflicts

I/O / DATABASE / NETWORK COMPLEXITY

no I/O (dry-run)

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

roster payload size

BOUND STATUS

POTENTIALLY_UNBOUNDED input (whole-school payloads) — flagged for R8-E

CORRECTNESS INVARIANTS
- dry-run never writes
- duplicate and school-mismatch are always high severity
- conflict order is input order (deterministic)

EDGE CASES

empty lists; cross-school records; repeated ids across batches (batch-scoped only)

FAILURE BEHAVIOR

no failure path in unit (pure)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

processes raw roster PII in memory; outputs use safeDetails only

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (complements reconcileRosterDiff: preview vs apply — DOMAIN_SPECIFIC_VARIANT pair, equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/task-039-roster-sync-dry-run-service.test.ts::"valid roster passes dry run"::L5::invokes performRosterSyncDryRun::assert L10`, `src/tests/task-039-roster-sync-dry-run-service.test.ts::"detects duplicate students"::L17::invokes performRosterSyncDryRun::assert L22`, `src/tests/task-039-roster-sync-dry-run-service.test.ts::"detects school mismatch in roster"::L26::invokes performRosterSyncDryRun::assert L31`, `src/tests/task-039-roster-sync-dry-run-service.test.ts::"detects enrollment missing student"::L36::invokes performRosterSyncDryRun::assert L48`, `src/tests/task-039-roster-sync-dry-run-service.test.ts::"detects enrollment missing class"::L51::invokes performRosterSyncDryRun::assert L63`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Last gate before school-size identity writes; scan completeness and PII handling need proof.

RISK FLAGS

DATA_INTEGRITY, PRIVACY_SENSITIVE, UNBOUNDED_DATA, SCALE_SENSITIVE, MEMORY_HOTSPOT_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-school-schoolintegration-roster-reconcile

DOMAIN

school

LINKED LOGIC ID(S)

LOGIC-school-api-task021-school-integration (linkage: CURATED_AFFINITY — Roster reconciliation names match the task021 capability; R8-B structural service link UNRESOLVED, name+domain affinity only.)

CAPABILITY

Roster-diff reconciliation into identity-mapping decisions

PURPOSE / PROBLEM

Turn an external roster diff into safe per-entry mapping actions without losing learning history.

SOURCE
- path: `src/services/task021RosterReconciliationService.ts`
- symbol: `reconcileRosterDiff/makeReconciliationDecision`
- relevant lines: 19-90

PRIMARY CATEGORY

RECONCILIATION

SECONDARY TAGS

DETERMINISTIC_RULE_SET

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

RosterDiffEntry[] (category: new|unchanged|inactivated|reactivated|…); schoolId.

OUTPUTS

ReconciliationResult { decisions[], appliedCount, quarantinedCount, skipCount } with per-decision reasonCodes + preserveHistory flags.

DATA STRUCTURES

- Array scan + switch dispatch
- counter accumulators

DECISION / COMPUTATION METHOD

Single pass: category switch maps to create/update/reactivate/inactivate/quarantine/skip with safe summaries; history-preserving categories set preserveHistory=true; counts accumulated by action class.

KEY PARAMETERS
- category vocabulary (project policy, contracts file)
- preserveHistory per category (project policy)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

diff entries passed in (identity mapping updates delegated to task021SchoolIdentityMappingService)

STATE WRITE

none in this unit (caller applies via runtime + durable bridge)

EXTERNAL / LIBRARY DEPENDENCIES
- task021SchoolIdentityMappingService, logger (internal)

THEORETICAL TIME COMPLEXITY

O(n) single pass over entries

THEORETICAL SPACE COMPLEXITY

O(n) decisions

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit; caller performs per-entry persistence (DB_QUERY_BOUND, batching UNRESOLVED)

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

roster batch size (whole-school syncs)

BOUND STATUS

POTENTIALLY_UNBOUNDED input (school-size rosters) — flagged for R8-E batching review

CORRECTNESS INVARIANTS
- unchanged entries always skip with history preserved
- inactivation preserves history (never deletes)
- every decision carries reasonCodes + safeSummary

EDGE CASES

unknown categories (tail past line 90, UNRESOLVED here); empty batch yields zero counts

FAILURE BEHAVIOR

no failure path in unit (pure); application errors owned by caller runtime

CONCURRENCY / ORDERING ASSUMPTIONS

pure decision; application ordering owned by processRosterSync runtime

SECURITY / PRIVACY IMPLICATIONS

student identity mapping; school-scoped; summaries are safe (no raw PII in verified prefix)

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/task-021-final-enforcement-patch.contract.test.ts::"roster sync runtime durable persistence error propagates when durable mode is on"::L74::invokes processRosterSync→src/services/task021RosterReconciliationService.ts::assert L91`, `src/tests/task-021-final-enforcement-patch.contract.test.ts::"processRosterSync works without durable flag (no DB dependency)"::L289::invokes processRosterSync→src/services/task021RosterReconciliationService.ts::assert L303`, `src/tests/task-021-final-restart-read-behavior.contract.test.ts::"sync jobs survive clearSyncJobStore only if recreated"::L55::invokes processRosterSync→src/services/task021RosterReconciliationService.ts::assert L67`, `src/tests/task-021-role-scope-and-integration.test.ts::"denies diagnostics for learner role"::L349::invokes getSchoolIntegrationDiagnostics→src/services/task021RosterReconciliationService.ts::assert L351`, `src/tests/task-021-role-scope-and-integration.test.ts::"allows diagnostics for admin role"::L357::invokes getSchoolIntegrationDiagnostics→src/services/task021RosterReconciliationService.ts::assert L359`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — School-size identity writes; category coverage and caller batching need correctness proof.

RISK FLAGS

DATA_INTEGRITY, PRIVACY_SENSITIVE, UNBOUNDED_DATA, SCALE_SENSITIVE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, verified prefix lines 19-90)

Evaluated capabilities in this domain (12):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-school-api-copilot-learning-sessions | UNRESOLVED | —
LOGIC-school-api-copilot-learningprofileroutes | UNRESOLVED | —
LOGIC-school-api-learner-learnerpreferenceroutes | UNRESOLVED | —
LOGIC-school-api-learner-learnerrecommendationroutes | ALGORITHM_PRESENT | ALG-school-learnerrecommendation-priority-policy
LOGIC-school-api-learner-learnersessionroutes | UNRESOLVED | —
LOGIC-school-api-phase3-parent-support | UNRESOLVED | —
LOGIC-school-api-phase3-peer-learning | UNRESOLVED | —
LOGIC-school-api-profileroutes | NO_DISTINCT_ALGORITHM | —
LOGIC-school-api-schoolintegrationroutes | UNRESOLVED | —
LOGIC-school-api-task021-school-integration | ALGORITHM_PRESENT | ALG-school-schoolintegration-roster-reconcile, ALG-school-schoolintegration-roster-dryrun-conflict-scan
LOGIC-school-api-teacherinterventionroutes | UNRESOLVED | —
LOGIC-school-api-teacherreportroutes | UNRESOLVED | —

## Safety / Privacy / Governance

### ALG-safety-task020-auth-jwt-claim-extract

DOMAIN

safety

LINKED LOGIC ID(S)

LOGIC-safety-api-task020-security-privacy-governance, PROSE-authentication-authorization-capability (linkage: CURATED_AFFINITY — schoolAuthMiddleware is mount-global (R8-A mount evidence, src/index.ts); closest confirmed owning capability is the security/privacy governance runtime. Affinity linkage only.)

CAPABILITY

Bearer-token authentication and identity-claim normalization for backend mounts

PURPOSE / PROBLEM

Prove caller identity from JWT and derive a normalized user/role/school triple without trusting URL shape.

SOURCE
- path: `src/middleware/schoolAuthMiddleware.ts`
- symbol: `readBearerToken/extractUserId/extractSchoolId/extractRole`
- relevant lines: 18-77

PRIMARY CATEGORY

DETERMINISTIC_RULE_SET

SECONDARY TAGS

PARSING_OR_TRANSFORMATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

Authorization header string; decoded JWT payload (jsonwebtoken). Configured secrets JWT_SECRET / COPILOT_JWT_SECRET / COPILOT_PUBLIC_KEY.

OUTPUTS

userId string; schoolId string|undefined; normalized role (admin|counselor|student|teacher|school_admin|raw-lowercased).

DATA STRUCTURES

- plain objects
- Array (roles list scan)

DECISION / COMPUTATION METHOD

Ordered claim extraction: Bearer prefix check and slice; candidate-key cascade (userId|studentId|id|sub; schoolId|school_id|orgId|organizationId); role allow-list normalization with roles-array fallback. Signature verification itself delegated to jsonwebtoken (see schoolAuthBridgeService.ts:1 import).

KEY PARAMETERS
- JWT_SECRET / COPILOT_JWT_SECRET / COPILOT_PUBLIC_KEY (CONFIGURED_VALUE)
- Bearer prefix literal (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none in this unit

STATE READ

process.env secrets only

STATE WRITE

none (attaches claims to request object)

EXTERNAL / LIBRARY DEPENDENCIES
- EXTERNAL_LIBRARY_DELEGATED: jsonwebtoken verify (library-dependent complexity)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

per-request; workload grows with request rate only

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- never derive identity from URL shape
- at least one auth key configured or boot fails (lines 22-26)
- unknown roles pass through lowercased, never escalated

EDGE CASES

missing/expired token; string payload; absent school claim; roles array vs scalar

FAILURE BEHAVIOR

fail-closed at boot with no keys; per-request failures reject with 401 paths downstream

CONCURRENCY / ORDERING ASSUMPTIONS

stateless pure functions; safe under concurrent requests

SECURITY / PRIVACY IMPLICATIONS

SECURITY_SENSITIVE AUTHORIZATION_SENSITIVE PRIVACY_SENSITIVE: identity spoofing would break school isolation

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (claim tables live here only)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/intent-resolver-route.test.ts::"router has POST resolve route"::L18::invokes router.find→src/middleware/schoolAuthMiddleware.ts::assert L24`, `src/tests/intent-resolver-route.test.ts::"router has GET history route"::L27::invokes router.find→src/middleware/schoolAuthMiddleware.ts::assert L33`, `src/tests/intent-resolver-route.test.ts::"routes have schoolAuthMiddleware"::L36::invokes router.find→src/middleware/schoolAuthMiddleware.ts::assert L40`, `src/tests/task-023-no-private-data-leak.contract.test.ts::"smoke test results exclude raw chat"::L49::invokes runReleaseSmokeTests→src/middleware/schoolAuthMiddleware.ts::assert L52`, `src/tests/task-023-no-private-data-leak.contract.test.ts::"smoke test results exclude private memory"::L55::invokes runReleaseSmokeTests→src/middleware/schoolAuthMiddleware.ts::assert L58`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Authentication/authorization correctness gates every learner-data boundary.

RISK FLAGS

SECURITY_SENSITIVE, AUTHORIZATION_SENSITIVE, PRIVACY_SENSITIVE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task) + R8A_STRUCTURAL mount evidence

### ALG-safety-tutorpolicy-generation-policy-gate

DOMAIN

safety

LINKED LOGIC ID(S)

LOGIC-safety-api-copilot-tutorpolicyevaluateroutes (linkage: CURATED_AFFINITY — Generation policy gate serves tutor-policy evaluation; R8-B structural route link UNRESOLVED, name+domain affinity only.)

CAPABILITY

Ordered generation-policy gate (block/refer/clarify/safety/integrity)

PURPOSE / PROBLEM

Decide whether the tutor may generate, in which safe mode, before any provider call.

SOURCE
- path: `src/services/aiGateway/generationPolicyGate.ts`
- symbol: `evaluateGenerationPolicy`
- relevant lines: 10-70

PRIMARY CATEGORY

DETERMINISTIC_RULE_SET

SECONDARY TAGS

STATE_MACHINE

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

SafeGenerationRequest.policyPacket { decision, blockReasons, safety flags, academicIntegrity, noFinalAnswer }.

OUTPUTS

GenerationPolicyResult { allowedToGenerate, generationMode, blockedReason?, safeFallbackMessage? }.

DATA STRUCTURES

- ordered if-chain (priority-encoded)
- safe fallback message strings

DECISION / COMPUTATION METHOD

Priority-ordered gate: block => refer => clarify_first => seriousRisk => safeguardingCandidate => direct-answer-without-attempt (hint_only) => final-answer-blocked (attempt? feedback : hint_only). First match wins; every refusal carries a student-safe fallback.

KEY PARAMETERS
- decision vocabulary block|refer|clarify_first (project policy)
- fallback message strings (project policy content)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none (pure over packet)

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- safeGenerationContracts (types; internal)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit; sits before provider calls (EXTERNAL boundary)

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

per generation request; constant

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- block-class decisions always refuse with a safe message
- direct answers require a learner attempt present
- ordering is total: safety precedes integrity

EDGE CASES

missing blockReasons degrades to unknown label; absent attempt forces hint_only

FAILURE BEHAVIOR

refusal is data (no exception); tail past line 70 UNRESOLVED here

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

SECURITY_SENSITIVE PRIVACY_SENSITIVE: safeguarding and safety routing; fallback wording is policy content

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (sibling policy gates — tutorTurnRuntimePolicyGate, no-ai-bypass — are DOMAIN_SPECIFIC_VARIANTs, equivalence UNPROVEN)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/ai-provider-gateway.test.ts::"blocks when policy decision is block"::L458::invokes evaluateGenerationPolicy::assert L461`, `src/tests/ai-provider-gateway.test.ts::"returns clarify when policy decision is clarify_first"::L465::invokes evaluateGenerationPolicy::assert L468`, `src/tests/ai-provider-gateway.test.ts::"blocks for serious safety risk"::L472::invokes evaluateGenerationPolicy::assert L484`, `src/tests/ai-provider-gateway.test.ts::"allows normal Socratic tutoring"::L487::invokes evaluateGenerationPolicy::assert L490`, `src/tests/ai-provider-gateway.test.ts::"returns hint_only for direct answer request without attempt"::L494::invokes evaluateGenerationPolicy::assert L515`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Safety/academic-integrity enforcement before generation; gate-order errors have safeguarding consequences.

RISK FLAGS

SECURITY_SENSITIVE, PRIVACY_SENSITIVE, ACADEMIC_CORRECTNESS, ASSESSMENT_INTEGRITY, DUPLICATION_CANDIDATE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, verified prefix lines 10-70)

Evaluated capabilities in this domain (7):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-safety-api-copilot-no-ai-bypass | UNRESOLVED | —
LOGIC-safety-api-copilot-tutorpolicyevaluateroutes | ALGORITHM_PRESENT | ALG-safety-tutorpolicy-generation-policy-gate
LOGIC-safety-api-copilot-tutorsafechatroutes | ALGORITHM_DELEGATED | —
LOGIC-safety-api-governance-privacygovernanceroutes | UNRESOLVED | —
LOGIC-safety-api-learner-privacygovernanceroutes | UNRESOLVED | —
LOGIC-safety-api-task020-security-privacy-governance | ALGORITHM_PRESENT | ALG-safety-task020-auth-jwt-claim-extract
LOGIC-safety-api-task027-pilot-expansion-governance | UNRESOLVED | —

## Operations / Reliability / Observability

### ALG-operations-canary-state-transition

DOMAIN

operations

LINKED LOGIC ID(S)

LOGIC-operations-api-task032-controlled-canary-activation (linkage: CURATED_AFFINITY — Canary state machine names match the task032 capability mount; R8-B structural service link UNRESOLVED, name+domain affinity only.)

CAPABILITY

Controlled-canary activation state transition gate

PURPOSE / PROBLEM

Admit or block canary lifecycle transitions with role and path guards, recording an auditable transition.

SOURCE
- path: `src/services/task032CanaryActivationStateMachine.ts`
- symbol: `transitionTask032CanaryState`
- relevant lines: 16-66

PRIMARY CATEGORY

STATE_MACHINE

SECONDARY TAGS

DETERMINISTIC_RULE_SET

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

currentState; targetState; actorRole; actorHash; reasonCode. Allowed-transition table ALLOWED_CANARY_STATE_TRANSITIONS + isAllowedTransition (contracts:618-622).

OUTPUTS

Task032StateTransition { from/to, allowed, blockingIssues[], reasonCode, timestamp, safeSummary }.

DATA STRUCTURES

- blockingIssues string[] accumulator
- allowed-transition lookup table

DECISION / COMPUTATION METHOD

Table lookup plus ordered role guards (unknown/student/teacher blocked) and activation-path guard (active only from armed|paused); any issue blocks with first-issue reason code; terminal states per table (UNRESOLVED detail — table body not inspected here).

KEY PARAMETERS
- role allow-list admin|operator (project policy)
- activation sources armed|paused (project policy)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none (timestamp only)

STATE READ

transition table (static)

STATE WRITE

none in this unit (caller persists via Service twin — DUPLICATE_SERVICE_CANDIDATE per R8-B line 3267, coverage UNRESOLVED)

EXTERNAL / LIBRARY DEPENDENCIES
- contracts/task032ControlledCanaryContracts (table + types)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per transition

BOUND STATUS

BOUNDED

CORRECTNESS INVARIANTS
- blocked transitions carry machine-readable blockingIssues
- student/teacher can never transition
- allowed transitions always recorded with actor hash + reason

EDGE CASES

rollback_in_progress from kill_switch_active explicitly permitted branch (lines 45-47)

FAILURE BEHAVIOR

blocking is data, not exception (allowed=false + reasons)

CONCURRENCY / ORDERING ASSUMPTIONS

pure evaluation; persistence ordering owned by caller service

SECURITY / PRIVACY IMPLICATIONS

AUTHORIZATION_SENSITIVE: rollout control; actor hashed not raw

DUPLICATION / EQUIVALENCE STATUS

PARALLEL_VARIANT_CANDIDATE vs task032CanaryActivationStateMachineService and task034ControlledRolloutStateMachine pair (R8-B lines 3267/3271) — equivalence UNPROVEN

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P0 — Rollout safety gate with role enforcement; table completeness and twin-service divergence need proof.

RISK FLAGS

AUTHORIZATION_SENSITIVE, DATA_INTEGRITY, SECURITY_SENSITIVE, DUPLICATION_CANDIDATE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-operations-reliability-ai-circuit-breaker

DOMAIN

operations

LINKED LOGIC ID(S)

LOGIC-operations-api-task024-operations-readiness (linkage: CURATED_AFFINITY — AI reliability runtime underpins operations readiness posture; domain affinity only.)

CAPABILITY

AI provider circuit breaker with half-open probing

PURPOSE / PROBLEM

Stop calling failing providers fast and probe recovery without manual intervention.

SOURCE
- path: `src/services/aiRuntimeCircuitBreakerService.ts`
- symbol: `getOrCreateBreaker/beforeAiProviderCall`
- relevant lines: 5-80

PRIMARY CATEGORY

CIRCUIT_BREAKER

SECONDARY TAGS

STATE_MACHINE, CACHE_OR_COALESCING

IMPLEMENTATION CLASS

STANDARD_METHOD

INPUTS

provider; operation; nowMs (injectable); CircuitBreakerConfig (DEFAULT_CIRCUIT_BREAKER_CONFIG).

OUTPUTS

{ allowed, snapshot, reason: allowed|circuit_open|half_open_probe_allowed }.

DATA STRUCTURES

- module Map<provider:operation, CircuitBreakerEntry> (R8-A runtime-state class: module cache)
- entry { state, failureCount, successCount, openedAt, halfOpenProbeCount, lastFailureCategory }

DECISION / COMPUTATION METHOD

Closed allows; open blocks until cooldownMs elapses then flips to half_open with probe counter reset; half-open admits bounded probes (verified prefix through line 80; success/failure recording continues to line 174).

KEY PARAMETERS
- DEFAULT_CIRCUIT_BREAKER_CONFIG cooldownMs/thresholds (NAMED_POLICY_CONSTANT, contracts file)
- key = provider:operation (project policy)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

module breakers Map

STATE WRITE

module breakers Map (state flips, counters)

EXTERNAL / LIBRARY DEPENDENCIES
- contracts/aiRuntimeCircuitBreakerContracts (config)
- contracts/aiRuntimeReliabilityContracts (types)

THEORETICAL TIME COMPLEXITY

O(1) map operations

THEORETICAL SPACE COMPLEXITY

O(k) breaker entries

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

provider×operation cardinality (small fixed set)

BOUND STATUS

BOUNDED key space; counters reset on transitions

CORRECTNESS INVARIANTS
- open never allows before cooldown
- half-open always resets probe count on entry
- nowMs injectable for deterministic tests

EDGE CASES

unknown provider creates closed breaker on first use; clock skew affects cooldown only

FAILURE BEHAVIOR

closed on virgin keys (fail-open initial); probe failures re-open (per record/failure paths past line 80, UNRESOLVED detail here)

CONCURRENCY / ORDERING ASSUMPTIONS

single-process Map; multi-instance coherence UNRESOLVED (R8-E reliability review)

SECURITY / PRIVACY IMPLICATIONS

none in unit

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

circuit breaker with half-open probe (conventional method; exact identity UNRESOLVED per §11)

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/ai-runtime-circuit-breaker.test.ts::"closed state allows calls"::L15::invokes beforeAiProviderCall::assert L17`, `src/tests/ai-runtime-circuit-breaker.test.ts::"open state fails fast"::L30::invokes beforeAiProviderCall::assert L35`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Standard reliability shape but process-local state; multi-instance and threshold behavior need reliability review.

RISK FLAGS

RETRY_IDEMPOTENCY, TIME_SENSITIVE, CONCURRENCY_SENSITIVE, MEMORY_HOTSPOT_CANDIDATE

CONFIDENCE

MEDIUM

EVIDENCE KIND

SOURCE_INSPECTION (this task, verified prefix lines 5-80)

### ALG-operations-reliability-ai-rate-limit-window

DOMAIN

operations

LINKED LOGIC ID(S)

LOGIC-operations-api-task024-operations-readiness (linkage: CURATED_AFFINITY — AI reliability runtime underpins operations readiness posture; domain affinity only.)

CAPABILITY

Sliding-window AI rate-limit guard (student/school/provider)

PURPOSE / PROBLEM

Enforce per-minute quotas at three scopes before provider calls are admitted.

SOURCE
- path: `src/services/aiRuntimeRateLimitGuardService.ts`
- symbol: `checkAiRateLimit/recordAiRateLimitUsage/pruneWindow`
- relevant lines: 21-107

PRIMARY CATEGORY

RATE_LIMIT_OR_QUOTA

SECONDARY TAGS

CACHE_OR_COALESCING

IMPLEMENTATION CLASS

STANDARD_METHOD

INPUTS

actorType/actorId/schoolId/provider/operation; nowMs (injectable).

OUTPUTS

{ allowed, reason, retryAfterMs? }.

DATA STRUCTURES

- module Map<key, RateWindow> with timestamps number[] (R8-A runtime-state class: module cache)
- key = scope:id(sliding 60s window)

DECISION / COMPUTATION METHOD

Three-scope check (student => school => provider), each prune-then-count over a 60s window; usage recorded as timestamp pushes only after admission upstream; test reset clears the Map.

KEY PARAMETERS
- WINDOW_MS=60000 (NAMED_POLICY_CONSTANT)
- student 30/min, school 500/min, provider 1000/min (NAMED_POLICY_CONSTANT)
- retryAfterMs = WINDOW_MS on refuse (project policy)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

module windows Map

STATE WRITE

module windows Map (push/prune)

EXTERNAL / LIBRARY DEPENDENCIES
- none

THEORETICAL TIME COMPLEXITY

O(w) filter scan per scope check, w = events in window

THEORETICAL SPACE COMPLEXITY

O(w) timestamps per key

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

request rate × key cardinality; prune cost grows with w

BOUND STATUS

POTENTIALLY_UNBOUNDED timestamp arrays under burst (prune only on check) — flagged UNBOUNDED_DATA for R8-E

CORRECTNESS INVARIANTS
- refuse reasons name the exact scope
- counts always reflect the trailing 60s at check time

EDGE CASES

missing actorId/schoolId skips that scope (provider scope always applies)

FAILURE BEHAVIOR

no failure path (pure memory ops)

CONCURRENCY / ORDERING ASSUMPTIONS

single-process Map; check/record split across two calls (TOCTOU window UNRESOLVED — R8-E reliability review)

SECURITY / PRIVACY IMPLICATIONS

keyed on actor/school ids; counts only

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (distinct mechanism from express/redis limiters — DOMAIN_SPECIFIC_VARIANT for AI runtime)

KNOWN BASELINE

fixed/sliding window counter (conventional method; exact identity UNRESOLVED per §11)

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/ai-runtime-rate-limit-guard.test.ts::"allows requests under limit"::L9::invokes checkAiRateLimit::assert L16`, `src/tests/ai-runtime-rate-limit-guard.test.ts::"blocks after student rate limit"::L20::invokes checkAiRateLimit::assert L36`, `src/tests/ai-runtime-rate-limit-guard.test.ts::"returns retryAfterMs when blocked"::L40::invokes checkAiRateLimit::assert L56`, `src/tests/ai-runtime-rate-limit-guard.test.ts::"resets after resetAiRateLimitStateForTests"::L59::invokes checkAiRateLimit::assert L76`, `src/tests/ai-runtime-rate-limit-guard.test.ts::"does not expose raw IDs in public output"::L79::invokes checkAiRateLimit::assert L84`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Abuse/cost boundary on the AI path; window-memory growth and check/record race need measurement.

RISK FLAGS

SCALE_SENSITIVE, MEMORY_HOTSPOT_CANDIDATE, UNBOUNDED_DATA, CONCURRENCY_SENSITIVE, PROVIDER_COST, MAGIC_CONSTANTS

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-operations-reliability-ai-retry-backoff-jitter

DOMAIN

operations

LINKED LOGIC ID(S)

LOGIC-operations-api-task024-operations-readiness (linkage: CURATED_AFFINITY — AI reliability runtime underpins operations readiness posture; R8-B structural route link UNRESOLVED, domain affinity only.)

CAPABILITY

AI provider retry delay and retry gate

PURPOSE / PROBLEM

Decide whether a failed provider call may retry and how long to wait, without retry storms.

SOURCE
- path: `src/services/aiRuntimeRetryPolicyService.ts`
- symbol: `calculateRetryDelayMs/decideAiRetry`
- relevant lines: 8-107

PRIMARY CATEGORY

RETRY_OR_BACKOFF

SECONDARY TAGS

DETERMINISTIC_RULE_SET

IMPLEMENTATION CLASS

STANDARD_METHOD

INPUTS

attempt; baseDelayMs; maxDelayMs; jitterRatio; retryAfterMs; error category; retryable; budgetAllowed; circuitState; operationIdempotent.

OUTPUTS

AiRetryDecision { shouldRetry, reason, attempt, maxAttempts, delayMs? }.

DATA STRUCTURES

- scalars only

DECISION / COMPUTATION METHOD

Ordered gate: budget => circuit-open => max-attempts => retryable => idempotent-safety; delay = min(cap, jitter(base * 2^(attempt-1))) with symmetric uniform jitter; Retry-After header honored when sane (<120s).

KEY PARAMETERS
- DEFAULT_BASE_DELAY_MS=1000 (NAMED_POLICY_CONSTANT)
- DEFAULT_MAX_DELAY_MS=30000 (NAMED_POLICY_CONSTANT)
- DEFAULT_JITTER_RATIO=0.25 (NAMED_POLICY_CONSTANT)
- DEFAULT_MAX_ATTEMPTS=3 (NAMED_POLICY_CONSTANT)
- retryAfter sanity cap 120000ms (INLINE_MAGIC_CONSTANT)

DETERMINISM

RANDOMIZED

RANDOMNESS / SEED BEHAVIOR

Math.random symmetric jitter around base (line 10); delay distribution uniform ±25%; no seed; reproducibility UNRESOLVED

STATE READ

none in unit (caller supplies attempt/circuit/budget)

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- none (Math only)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O; caller loop bounded by maxAttempts with awaits between

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

attempt count (≤3); provider failure rate (caller loop)

BOUND STATUS

BOUNDED attempts and capped delay

CORRECTNESS INVARIANTS
- never retries on open circuit, exhausted budget, or non-idempotent ops
- delay never exceeds maxDelayMs
- idempotent=false forces single attempt upstream (reliability service line 102)

EDGE CASES

retryAfterMs 0/negative/huge falls back to exponential; attempt>=max refuses

FAILURE BEHAVIOR

refusal reasons are terminal codes (budget_exceeded/circuit_open/max_attempts/non_retryable/not_idempotent)

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe (attempt counting owned by caller loop)

SECURITY / PRIVACY IMPLICATIONS

none in unit

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

exponential backoff with jitter (conventional method; exact identity UNRESOLVED per §11)

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/ai-runtime-no-raw-telemetry.contract.test.ts::"retry decision does not include raw prompt data"::L22::invokes decideAiRetry::assert L30`, `src/tests/ai-runtime-retry-policy.test.ts::"returns increasing delay for higher attempts"::L6::invokes calculateRetryDelayMs::assert L10`, `src/tests/ai-runtime-retry-policy.test.ts::"respects retry-after-ms when provided and sane"::L15::invokes calculateRetryDelayMs::assert L17`, `src/tests/ai-runtime-retry-policy.test.ts::"caps at maxDelayMs"::L21::invokes calculateRetryDelayMs::assert L23`, `src/tests/ai-runtime-retry-policy.test.ts::"allows retry for retryable transient error within budget"::L34::invokes decideAiRetry::assert L42`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P0 — Retry/idempotency gate for every provider call; jitter distribution and storm behavior need proof.

RISK FLAGS

RETRY_IDEMPOTENCY, PROVIDER_COST, RANDOMNESS_SENSITIVE, TIME_SENSITIVE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

### ALG-operations-shared-pagination-cursor

DOMAIN

operations

LINKED LOGIC ID(S)

LOGIC-operations-api-ops-diagnostics (linkage: CURATED_AFFINITY — Shared pagination primitive consumed by operational/audit read surfaces (e.g. durableAuditRepository.ts:126-190 cursor usage); domain affinity only.)

CAPABILITY

Bounded cursor/offset pagination parsing and metadata

PURPOSE / PROBLEM

Clamp client pagination input and describe page position so list endpoints cannot request unbounded pages.

SOURCE
- path: `src/services/apiPaginationService.ts`
- symbol: `parsePaginationInput/buildPaginationMeta`
- relevant lines: 15-63

PRIMARY CATEGORY

PAGINATION_OR_CURSOR

SECONDARY TAGS

DETERMINISTIC_RULE_SET

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

ApiPaginationInput { limit?, cursor?, offset?, sort? }.

OUTPUTS

parse result (limit, cursor, offset, sort) or typed error; meta { limit, hasMore, nextCursor?, totalCount? }.

DATA STRUCTURES

- scalars only

DECISION / COMPUTATION METHOD

Default-then-clamp: limit defaults 20, rejects non-finite/<1, caps at MAX; cursor/offset/sort type-checked; offset defaults 0; floor applied to limit.

KEY PARAMETERS
- DEFAULT_PAGINATION_LIMIT=20 (NAMED_POLICY_CONSTANT)
- MAX_PAGINATION_LIMIT=100 (NAMED_POLICY_CONSTANT)

DETERMINISM

DETERMINISTIC

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

none

STATE WRITE

none

EXTERNAL / LIBRARY DEPENDENCIES
- contracts/apiPaginationContracts (types + constants)

THEORETICAL TIME COMPLEXITY

O(1)

THEORETICAL SPACE COMPLEXITY

O(1)

I/O / DATABASE / NETWORK COMPLEXITY

no I/O in unit; callers pair with take/limit + cursor+skip:1 queries (durableAuditRepository pattern)

COMPLEXITY CONFIDENCE

HIGH

SCALE DRIVER

constant per request; page size capped at 100

BOUND STATUS

BOUNDED (limit ≤ 100 enforced)

CORRECTNESS INVARIANTS
- limit always within [1,100] on success
- invalid input is a typed error, never a silent clamp (except floor)

EDGE CASES

non-numeric/NaN/Infinite limits rejected; cursor must be string; negative offset rejected

FAILURE BEHAVIOR

typed { ok:false, error } results

CONCURRENCY / ORDERING ASSUMPTIONS

stateless; safe

SECURITY / PRIVACY IMPLICATIONS

bounds data-exfiltration page size; no content handling

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

DIRECT_BEHAVIOR_TEST: `src/tests/api-pagination-contracts.test.ts::"applies default limit when none specified"::L6::invokes parsePaginationInput::assert L8`, `src/tests/api-pagination-contracts.test.ts::"enforces max limit"::L14::invokes parsePaginationInput::assert L16`, `src/tests/api-pagination-contracts.test.ts::"rejects invalid limit (negative)"::L22::invokes parsePaginationInput::assert L24`, `src/tests/api-pagination-contracts.test.ts::"rejects invalid limit (zero)"::L27::invokes parsePaginationInput::assert L29`, `src/tests/api-pagination-contracts.test.ts::"rejects invalid limit (non-numeric)"::L32::invokes parsePaginationInput::assert L34`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P2 — Small shared guard; worth a contract test but not a measurement campaign.

RISK FLAGS

SCALE_SENSITIVE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task)

Evaluated capabilities in this domain (23):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-operations-api-deploymentreadinessroutes | UNRESOLVED | —
LOGIC-operations-api-health-healthroutes | UNRESOLVED | —
LOGIC-operations-api-ops-diagnostics | ALGORITHM_PRESENT | ALG-operations-shared-pagination-cursor
LOGIC-operations-api-ops-opspublicrouter | UNRESOLVED | —
LOGIC-operations-api-readinessroutes | NO_DISTINCT_ALGORITHM | —
LOGIC-operations-api-task023-deployment-readiness | UNRESOLVED | —
LOGIC-operations-api-task024-operations-readiness | ALGORITHM_PRESENT | ALG-operations-reliability-ai-retry-backoff-jitter, ALG-operations-reliability-ai-circuit-breaker, ALG-operations-reliability-ai-rate-limit-window
LOGIC-operations-api-task024operationsroutes | ALGORITHM_DELEGATED | —
LOGIC-operations-api-task025-pilot-readiness | UNRESOLVED | —
LOGIC-operations-api-task025pilotroutes | UNRESOLVED | —
LOGIC-operations-api-task026pilotexecutionroutes | UNRESOLVED | —
LOGIC-operations-api-task027pilotexpansionroutes | UNRESOLVED | —
LOGIC-operations-api-task028-controlled-expansion-execution | UNRESOLVED | —
LOGIC-operations-api-task028expansionexecutionroutes | UNRESOLVED | —
LOGIC-operations-api-task029expansionoperationsroutes | UNRESOLVED | —
LOGIC-operations-api-task030-controlled-staging-rehearsal | UNRESOLVED | —
LOGIC-operations-api-task031-staging-smoke-canary-readiness | UNRESOLVED | —
LOGIC-operations-api-task032-controlled-canary-activation | ALGORITHM_PRESENT | ALG-operations-canary-state-transition
LOGIC-operations-api-task033-controlled-canary-observation | UNRESOLVED | —
LOGIC-operations-api-task034-controlled-limited-rollout | UNRESOLVED | —
LOGIC-operations-api-task035-school-wide-readiness | UNRESOLVED | —
LOGIC-operations-api-task036-live-school-launch | UNRESOLVED | —
LOGIC-operations-api-task040-backend-freeze | NO_DISTINCT_ALGORITHM | —

## Voice / External Integrations

### ALG-voice-airoutes-express-rate-limit

DOMAIN

voice

LINKED LOGIC ID(S)

LOGIC-voice-api-copilot-airoutes (linkage: R8B_STRUCTURAL — R8-B mount evidence records rateLimitMiddleware on /api/copilot aiRoutes (05 line 3055); limiters verified in ai-middleware.ts:24-46 and redis middleware rateLimiter.ts.)

CAPABILITY

AI/voice route rate limiting (library + redis counter)

PURPOSE / PROBLEM

Cap per-user AI, speech-to-text, text-to-speech and general request rates to bound provider cost and abuse.

SOURCE
- path: `src/routes/ai/ai-middleware.ts`
- symbol: `aiLimiter/sttLimiter/ttsLimiter`
- relevant lines: 24-46

PRIMARY CATEGORY

RATE_LIMIT_OR_QUOTA

SECONDARY TAGS

none

IMPLEMENTATION CLASS

EXTERNAL_LIBRARY_DELEGATED

INPUTS

request identity (req.user.id or ip); per-limiter window and max.

OUTPUTS

allow with headers or 429 with wait message.

DATA STRUCTURES

- library-owned counters; redis key rate:{studentId} with TTL (second implementation)

DECISION / COMPUTATION METHOD

express-rate-limit fixed windows: AI 30/min, STT 15/min, TTS 20/min keyed user-or-ip. Parallel project implementation rateLimiter.ts: redis INCR with 60s expiry, limit 20/min, Retry-After headers, fail-open on redis outage (lines 42-44).

KEY PARAMETERS
- windowMs=60000 all (INLINE_MAGIC_CONSTANT)
- max 30/15/20 (INLINE_MAGIC_CONSTANT)
- redis RATE_LIMIT=20, WINDOW=60s (INLINE_MAGIC_CONSTANT)
- keyGenerator user-or-ip (project policy)

DETERMINISM

DETERMINISTIC_GIVEN_TIME

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

library counters / redis key

STATE WRITE

library counters / redis INCR+EXPIRE

EXTERNAL / LIBRARY DEPENDENCIES
- EXTERNAL_LIBRARY_DELEGATED: express-rate-limit (library-dependent complexity)
- redis via getRedisClient (second implementation)

THEORETICAL TIME COMPLEXITY

library-dependent / UNRESOLVED

THEORETICAL SPACE COMPLEXITY

UNRESOLVED

I/O / DATABASE / NETWORK COMPLEXITY

redis: O(1) counter ops per request (second implementation); network: none in unit

COMPLEXITY CONFIDENCE

LOW

SCALE DRIVER

request rate per user/ip; redis key cardinality

BOUND STATUS

window-bounded counters; redis keys expire (60s)

CORRECTNESS INVARIANTS
- limits are per identity, not global
- redis outage fails open (availability over enforcement — recorded, not judged)

EDGE CASES

missing user id => 401 in redis path, anon-ip key in library path (DIVERGENT identity handling noted for R8-E)

FAILURE BEHAVIOR

fail-open on limiter error (lines 42-44)

CONCURRENCY / ORDERING ASSUMPTIONS

redis INCR is atomic; library counters are process-local (multi-instance fan-out UNRESOLVED)

SECURITY / PRIVACY IMPLICATIONS

keyed on user id; Retry-After headers only

DUPLICATION / EQUIVALENCE STATUS

PARALLEL_VARIANT_CANDIDATE: two rate-limit mechanisms (library trio + redis middleware) with divergent identity/fail behavior — equivalence UNPROVEN, consolidation FORBIDDEN in R8-C

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

INDIRECT_INTEGRATION_TEST: `src/tests/intent-resolver-route.test.ts::"router has POST resolve route"::L18::invokes router.find→src/routes/ai/ai-middleware.ts::assert L24`, `src/tests/intent-resolver-route.test.ts::"router has GET history route"::L27::invokes router.find→src/routes/ai/ai-middleware.ts::assert L33`, `src/tests/intent-resolver-route.test.ts::"routes have schoolAuthMiddleware"::L36::invokes router.find→src/routes/ai/ai-middleware.ts::assert L40`

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED, TEST_EVIDENCED

R8-E BENCHMARK PRIORITY

P1 — Provider-cost and abuse boundary; dual mechanisms and fail-open/multi-instance behavior need reliability review.

RISK FLAGS

PROVIDER_COST, NETWORK_COST, SCALE_SENSITIVE, MAGIC_CONSTANTS, DUPLICATION_CANDIDATE, SECURITY_SENSITIVE

CONFIDENCE

HIGH

EVIDENCE KIND

SOURCE_INSPECTION (this task) + R8A_STRUCTURAL mount evidence

### ALG-voice-voice-ledger-billing-quota

DOMAIN

voice

LINKED LOGIC ID(S)

LOGIC-voice-api-voice-voiceroutes (linkage: R8B_STRUCTURAL — R8-B SOURCE_INSPECTION confirms route voice.ts:3-10,36-48 with voiceLedgerService transactional persistence (05 lines 3205-3222).)

CAPABILITY

Voice quota ledger: authorize, bill and settle voice sessions

PURPOSE / PROBLEM

Enforce per-student voice time quotas with auditable double-entry style ledger updates.

SOURCE
- path: `src/services/voiceLedgerService.ts`
- symbol: `computeBilledSeconds/consumeFromGrants/ensureStudentRowLocked/getCurrentBalanceInTx`
- relevant lines: 105-213

PRIMARY CATEGORY

RATE_LIMIT_OR_QUOTA

SECONDARY TAGS

CONCURRENCY_COORDINATION, RECONCILIATION

IMPLEMENTATION CLASS

PROJECT_DETERMINISTIC_POLICY

INPUTS

studentId; session usage; listening/tts seconds; billing mode (LISTENING_ONLY|LISTENING_PLUS_TTS from VOICE_BILL_MODE).

OUTPUTS

billedSeconds; remainingSeconds; mode; stopReason; timeExhausted flag.

DATA STRUCTURES

- grant rows ordered (grantedAt, id)
- ledger entries (last-10 read)
- row lock via SELECT FOR UPDATE (line 144)

DECISION / COMPUTATION METHOD

Ceil-to-int non-negative billing; FIFO consumption oldest-grant-first with partial deduction; row lock + grant aggregate + dev-bootstrap guard inside one Prisma transaction; last-10 ledger tail for display.

KEY PARAMETERS
- SERVER_BILLING_GRACE_SECONDS default 1 (CONFIGURED_VALUE)
- VOICE_DEV_BOOTSTRAP_MINUTES default 10 non-production (CONFIGURED_VALUE)
- ceil rounding (project policy)
- last-10 ledger tail take=10 (INLINE_MAGIC_CONSTANT)

DETERMINISM

DETERMINISTIC_GIVEN_CONFIG

RANDOMNESS / SEED BEHAVIOR

none

STATE READ

StudentProfile, VoicePackageGrant, VoiceLedgerEntry, VoiceSessionUsage

STATE WRITE

grant deductions, ledger entries, session rows — all inside $transaction

EXTERNAL / LIBRARY DEPENDENCIES
- prisma ($transaction, aggregate, raw FOR UPDATE lock)

THEORETICAL TIME COMPLEXITY

application CPU: O(g), g = active grants (FIFO loop)

THEORETICAL SPACE COMPLEXITY

O(g)

I/O / DATABASE / NETWORK COMPLEXITY

database: one transaction with N statements (aggregate + findMany + updates + creates); query plans UNRESOLVED — DB_QUERY_BOUND

COMPLEXITY CONFIDENCE

MEDIUM

SCALE DRIVER

active grants per student; session stop rate

BOUND STATUS

BOUNDED per student by grant volume; ledger tail fixed at 10

CORRECTNESS INVARIANTS
- balance never negative (max(0,…))
- consumption order is FIFO by (grantedAt, id)
- every deduction pairs with a ledger entry carrying balanceAfterSeconds

EDGE CASES

zero/negative usage bills 0; expired grants excluded (expiresAt null or future); dev bootstrap only when no entries exist

FAILURE BEHAVIOR

transactional: partial billing cannot persist; lock contention surfaces to caller

CONCURRENCY / ORDERING ASSUMPTIONS

CONCURRENCY_SENSITIVE: FOR UPDATE row lock + transactional deduction is the correctness mechanism

SECURITY / PRIVACY IMPLICATIONS

student quota data; admin grant path requireRole(admin) per R8-B inspection

DUPLICATION / EQUIVALENCE STATUS

SINGLE_IMPLEMENTATION (voice CLEAR writer family per R8-B)

KNOWN BASELINE

UNRESOLVED

PRIOR-ART STATUS

NOT RESEARCHED IN R8-C

TEST EVIDENCE

NO_TEST_EVIDENCE_FOUND

BENCHMARK EVIDENCE

NO_BENCHMARK_EVIDENCE

MEASURED PERFORMANCE

NOT MEASURED IN R8-C

MATURITY EVIDENCE

SOURCE_CONFIRMED

R8-E BENCHMARK PRIORITY

P0 — Money-like quota correctness under concurrency; FIFO + lock behavior needs reliability proof.

RISK FLAGS

DATA_INTEGRITY, CONCURRENCY_SENSITIVE, DATABASE_HOTSPOT_CANDIDATE, AUTHORIZATION_SENSITIVE

CONFIDENCE

HIGH

EVIDENCE KIND

R8B_SOURCE_INSPECTION + SOURCE_INSPECTION (this task)

Evaluated capabilities in this domain (6):

Logic ID | Coverage | Records
--- | --- | ---
LOGIC-voice-api-copilot-airoutes | ALGORITHM_PRESENT | ALG-voice-airoutes-express-rate-limit
LOGIC-voice-api-copilot-anomalies | UNRESOLVED | —
LOGIC-voice-api-copilot-chat-pipeline | UNRESOLVED | —
LOGIC-voice-api-copilot-intent | UNRESOLVED | —
LOGIC-voice-api-copilot-latency | UNRESOLVED | —
LOGIC-voice-api-voice-voiceroutes | ALGORITHM_PRESENT | ALG-voice-voice-ledger-billing-quota

## Data Structures and Complexity Hotspots

Structures observed across records: Array scans, Map/Set membership and dedupe tables, priority/order lookup Records, threshold tables, sliding-window timestamp arrays, FIFO grant orderings, revision-id Sets, ledger/decision accumulators, module-local caches (Map), Prisma relations with take/limit/cursor.

Algorithm ID | Time | Space | I/O | Confidence | Hotspot flags
--- | --- | --- | --- | --- | ---
ALG-artifacts-artifacts-content-fingerprint | O(n) in content bytes (library) | O(1) | no I/O | MEDIUM | —
ALG-artifacts-artifacts-media-dedupe-key | O(n) in parts length (library) | O(1) | database: bounded keyed lookup/insert (DB_QUERY_BOUND); network: none | MEDIUM | DATABASE_HOTSPOT_CANDIDATE
ALG-artifacts-artifacts-media-stream-rank-score | O(w), w = weak-topic count (small); else O(1) | O(w) | no I/O in unit | MEDIUM | SCALE_SENSITIVE
ALG-artifacts-artifacts-recency-decay | O(1) | O(1) | no I/O | HIGH | —
ALG-artifacts-artifacts-replay-idempotency | O(n) in incoming content bytes (hash) | O(1) | no I/O in unit | MEDIUM | —
ALG-artifacts-artifacts-study-stream-rank-score | O(n) over bounded revision-id sets + base score | O(n) | no I/O in unit | HIGH | —
ALG-artifacts-videoaware-external-video-dedupe | O(n) single pass | O(n) | network: provider-bound fan-out (callers); cache short-circuits repeats within TTL | HIGH | MEMORY_HOTSPOT_CANDIDATE
ALG-mastery-confidencerecovery-mismatch-rank-dedupe | application CPU: O(n log n) sort + O(n) dedupe | O(n) | no I/O in unit | HIGH | —
ALG-mastery-dailyfeed-feed-rank-dedupe | application CPU: O(n log n) sort + O(n) dedupe; database: none in unit | O(n) | no I/O in unit | MEDIUM | SCALE_SENSITIVE+UNBOUNDED_DATA
ALG-mastery-dailyobjective-idempotency-settle | O(1) map operations | O(k) module entries; durable rows O(sessions) | database: bounded idempotency reads/writes per settlement (DB_QUERY_BOUND); network: none | HIGH | CONCURRENCY_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE
ALG-mastery-growth-topic-inference-signal-count | O(n), n<=40 events, plus fixed signal-vocabulary Sets | O(n) | database: 3 bounded queries (2 findFirst + 1 findMany take 40); network: none | HIGH | DATABASE_HOTSPOT_CANDIDATE
ALG-mastery-growth-video-effectiveness-score | O(1) | O(1) | no I/O in unit; aggregation upstream is event-count bounded (UNRESOLVED here) | HIGH | —
ALG-mastery-practicemastery-evidence-level-ladder | O(1) | O(1) | no I/O in this unit; caller performs bounded snapshot read/write | HIGH | —
ALG-mastery-practicemastery-next-practice-priority | O(n) over bounded windows (n<=10) | O(n) | database: two bounded reads (limits 5 and 10); network: none | HIGH | —
ALG-mastery-practicemastery-score-compute | O(1) | O(1) | no I/O | HIGH | —
ALG-mastery-practicemastery-score-threshold-ladder | O(T), T=6 table rows | O(1) | no I/O in this unit | HIGH | —
ALG-mastery-practicemastery-spaced-review-interval | O(1) | O(1) | no I/O; batch wrapper planBatchReviews maps O(n) over items | HIGH | —
ALG-operations-canary-state-transition | O(1) | O(1) | no I/O in unit | HIGH | —
ALG-operations-reliability-ai-circuit-breaker | O(1) map operations | O(k) breaker entries | no I/O in unit | HIGH | CONCURRENCY_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE
ALG-operations-reliability-ai-rate-limit-window | O(w) filter scan per scope check, w = events in window | O(w) timestamps per key | no I/O in unit | MEDIUM | SCALE_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE+UNBOUNDED_DATA+CONCURRENCY_SENSITIVE
ALG-operations-reliability-ai-retry-backoff-jitter | O(1) | O(1) | no I/O; caller loop bounded by maxAttempts with awaits between | HIGH | —
ALG-operations-shared-pagination-cursor | O(1) | O(1) | no I/O in unit; callers pair with take/limit + cursor+skip:1 queries (durableAuditRepository pattern) | HIGH | SCALE_SENSITIVE
ALG-questionbank-markinginvocation-batch-mark-sweep | O(b) sequential items, b = batch size | O(b) accumulators | database: O(b) repository reads/writes via injected repos (DB_QUERY_BOUND); network: none | MEDIUM | SCALE_SENSITIVE+UNBOUNDED_DATA+DATABASE_HOTSPOT_CANDIDATE+CPU_HOTSPOT_CANDIDATE
ALG-safety-task020-auth-jwt-claim-extract | O(1) | O(1) | no I/O | HIGH | —
ALG-safety-tutorpolicy-generation-policy-gate | O(1) | O(1) | no I/O in unit; sits before provider calls (EXTERNAL boundary) | HIGH | —
ALG-school-learnerrecommendation-priority-policy | O(1) table lookup | O(1) | no I/O | HIGH | —
ALG-school-schoolintegration-roster-dryrun-conflict-scan | O(n) three passes | O(n) Sets + conflicts | no I/O (dry-run) | HIGH | UNBOUNDED_DATA+SCALE_SENSITIVE+MEMORY_HOTSPOT_CANDIDATE
ALG-school-schoolintegration-roster-reconcile | O(n) single pass over entries | O(n) decisions | no I/O in unit; caller performs per-entry persistence (DB_QUERY_BOUND, batching UNRESOLVED) | HIGH | UNBOUNDED_DATA+SCALE_SENSITIVE
ALG-voice-airoutes-express-rate-limit | library-dependent / UNRESOLVED | UNRESOLVED | redis: O(1) counter ops per request (second implementation); network: none in unit | LOW | SCALE_SENSITIVE
ALG-voice-voice-ledger-billing-quota | application CPU: O(g), g = active grants (FIFO loop) | O(g) | database: one transaction with N statements (aggregate + findMany + updates + creates); query plans UNRESOLVED — DB_QUERY_BOUND | MEDIUM | CONCURRENCY_SENSITIVE+DATABASE_HOTSPOT_CANDIDATE

R8-A runtime-state note: module-local Maps/Sets in this register (circuit breakers, rate windows, idempotency store, service cache) are algorithm coordination state, not data ownership; the exhaustive 1,246-allocation enumeration remains 01_BACKEND_SYSTEM_INVENTORY.json.

## Time-Dependent Algorithms

- `ALG-artifacts-artifacts-media-stream-rank-score` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-artifacts-artifacts-recency-decay` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-artifacts-artifacts-study-stream-rank-score` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-artifacts-videoaware-external-video-dedupe` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none in this unit
- `ALG-mastery-dailyfeed-feed-rank-dedupe` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-mastery-practicemastery-spaced-review-interval` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-operations-canary-state-transition` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none (timestamp only)
- `ALG-operations-reliability-ai-circuit-breaker` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-operations-reliability-ai-rate-limit-window` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-operations-reliability-ai-retry-backoff-jitter` (RANDOMIZED): clock source Date.now/new Date (server-local); randomness: Math.random symmetric jitter around base (line 10); delay distribution uniform ±25%; no seed; reproducibility UNRESOLVED
- `ALG-questionbank-markinginvocation-batch-mark-sweep` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none
- `ALG-voice-airoutes-express-rate-limit` (DETERMINISTIC_GIVEN_TIME): clock source Date.now/new Date (server-local); randomness: none

Timezone assumptions: none visible in inspected units (ISO strings, epoch millis). Deterministic-test clock support: nowMs injectable in circuit-breaker and rate-guard units; other units read the live clock. No time behavior was repaired in R8-C.

## Database-Bound Algorithms

- `ALG-artifacts-artifacts-media-dedupe-key`: database: bounded keyed lookup/insert (DB_QUERY_BOUND); network: none
- `ALG-mastery-dailyobjective-idempotency-settle`: database: bounded idempotency reads/writes per settlement (DB_QUERY_BOUND); network: none
- `ALG-mastery-growth-topic-inference-signal-count`: database: 3 bounded queries (2 findFirst + 1 findMany take 40); network: none
- `ALG-mastery-practicemastery-next-practice-priority`: database: two bounded reads (limits 5 and 10); network: none
- `ALG-questionbank-markinginvocation-batch-mark-sweep`: database: O(b) repository reads/writes via injected repos (DB_QUERY_BOUND); network: none
- `ALG-voice-voice-ledger-billing-quota`: database: one transaction with N statements (aggregate + findMany + updates + creates); query plans UNRESOLVED — DB_QUERY_BOUND

Analyzer counts over the R8-B-linked source set: files with Prisma calls=138, files with raw-SQL/transaction markers=19. No query-plan complexity is inferred; all database work is DB_QUERY_BOUND. No pagination, index, or SQL change was made in R8-C.

## Retry / Rate-Limit / Concurrency Algorithms

- `ALG-artifacts-artifacts-replay-idempotency` [IDEMPOTENCY]: Decide whether an incoming re-parse is a same-content replay that must not disturb stored truth. (R8-E P0)
- `ALG-mastery-dailyobjective-idempotency-settle` [IDEMPOTENCY]: Guarantee exactly-once settlement of a check session across retries, races and partial failures. (R8-E P0)
- `ALG-operations-reliability-ai-circuit-breaker` [CIRCUIT_BREAKER]: Stop calling failing providers fast and probe recovery without manual intervention. (R8-E P1)
- `ALG-operations-reliability-ai-rate-limit-window` [RATE_LIMIT_OR_QUOTA]: Enforce per-minute quotas at three scopes before provider calls are admitted. (R8-E P1)
- `ALG-operations-reliability-ai-retry-backoff-jitter` [RETRY_OR_BACKOFF]: Decide whether a failed provider call may retry and how long to wait, without retry storms. (R8-E P0)
- `ALG-operations-shared-pagination-cursor` [PAGINATION_OR_CURSOR]: Clamp client pagination input and describe page position so list endpoints cannot request unbounded pages. (R8-E P2)
- `ALG-voice-airoutes-express-rate-limit` [RATE_LIMIT_OR_QUOTA]: Cap per-user AI, speech-to-text, text-to-speech and general request rates to bound provider cost and abuse. (R8-E P1)
- `ALG-voice-voice-ledger-billing-quota` [RATE_LIMIT_OR_QUOTA]: Enforce per-student voice time quotas with auditable double-entry style ledger updates. (R8-E P0)

## Duplicate / Parallel Algorithm Candidates

Exact-duplicate fingerprint groups (normalized bodies, evidence only):

- 61 group(s) total; first 15 shown. Groups are predominantly small route/service helpers (error envelopes, identity extractors); R8-D must separate trivial-helper repetition from algorithmic duplication. All remain candidates; equivalence UNPROVEN.
- fp=15b624edaf2169ce: `src/domains/assessment/result-release/services/parentSafeResultSummaryService.ts:18 (envelope)`, `src/domains/assessment/result-release/services/resultAudienceProjectionService.ts:18 (envelope)`, `src/domains/assessment/result-release/services/resultReleaseApprovalService.ts:26 (envelope)`, `src/domains/assessment/result-release/services/resultReleaseDeliveryIntentService.ts:18 (envelope)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=1a82708c012bd5e9: `src/routes/examModeRoutes.ts:68 (getStudentId)`, `src/routes/focusModeRoutes.ts:37 (getStudentId)`, `src/routes/quizModeRoutes.ts:76 (getStudentId)`, `src/routes/revisionModeRoutes.ts:90 (getStudentId)`, `src/routes/teachBackModeRoutes.ts:72 (getStudentId)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=1c760f08fc76f91c: `src/routes/task035SchoolWideReadinessRoutes.ts:462 (anonymous)`, `src/routes/task035SchoolWideReadinessRoutes.ts:479 (anonymous)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=20560ab3867ee6fd: `src/routes/teacherInterventions.ts:41 (sendError)`, `src/routes/videoLearningAnalytics.ts:46 (sendError)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=2219648e2fd3b310: `src/routes/task029ExpansionOperationsRoutes.ts:498 (anonymous)`, `src/routes/task029ExpansionOperationsRoutes.ts:1104 (anonymous)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=24a9cbafb9d031e7: `src/services/artifactAwareAnswerEvaluator.ts:17 (normalize)`, `src/services/videoAwareAnswerEvaluator.ts:19 (normalize)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=2502a55882875d3b: `src/routes/task025ControlledPilotReadinessRoutes.ts:40 (safeErrorEnvelope)`, `src/routes/task025PilotRoutes.ts:45 (safeErrorEnvelope)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=2bfbe1d2abe930b7: `src/routes/task032ControlledCanaryActivationRoutes.ts:33 (safeError)`, `src/routes/task033ControlledCanaryObservationRoutes.ts:32 (safeError)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=2fa082d1b6ab5f73: `src/routes/resultReportCard.ts:64 (sendEnvelope)`, `src/routes/resultReportCardExport.ts:67 (sendEnvelope)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=30e7f0307172acf5: `src/routes/recoveryProgress.ts:623 (anonymous)`, `src/routes/resultFollowUp.ts:566 (anonymous)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=371c175dfba764fa: `src/routes/task025ControlledPilotReadinessRoutes.ts:24 (getSchoolId)`, `src/routes/task025PilotRoutes.ts:25 (getSchoolId)`, `src/routes/task026PilotExecutionRoutes.ts:28 (getSchoolId)`, `src/routes/task027PilotExpansionGovernanceRoutes.ts:90 (getSchoolId)`, `src/routes/task027PilotExpansionRoutes.ts:28 (getSchoolId)`, `src/routes/task028ControlledExpansionExecutionRoutes.ts:46 (getSchoolId)`, `src/routes/task028ExpansionExecutionRoutes.ts:40 (getSchoolId)`, `src/routes/task029ExpansionOperationsRoutes.ts:57 (getSchoolId)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=39ac752514176245: `src/domains/assessment/result-recovery/services/resultRecoveryCheckpointService.ts:70 (envelope)`, `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts:34 (envelope)`, `src/domains/assessment/result-recovery/services/resultRecoveryParentSupportNoteDraftService.ts:68 (envelope)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=3ac10d253b126e30: `src/routes/adaptiveChallengeRoutes.ts:19 (resolveIdentity)`, `src/routes/remediationRoutes.ts:15 (resolveIdentity)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=3cae636b2735e86f: `src/routes/recoveryExecutionAuthorizationPreview.ts:60 (sendResponse)`, `src/routes/recoveryOutcomeExecutionSimulation.ts:88 (sendResponse)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)
- fp=3d7d35e77e950076: `src/domains/assessment/result-report-card-export/services/resultReportCardArchiveManifestService.ts:18 (envelope)`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportEnvelopeService.ts:18 (envelope)`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportJobService.ts:17 (envelope)`, `src/domains/assessment/result-report-card/services/resultReportCardAudienceProjectionService.ts:21 (envelope)`, `src/domains/assessment/result-report-card/services/resultReportCardEvidenceLinkService.ts:27 (envelope)`, `src/domains/assessment/result-report-card/services/resultReportCardExportIntentService.ts:25 (envelope)` => EXACT_DUPLICATE_CANDIDATE (equivalence of behavior still UNPROVEN)

Curated parallel/exact-duplicate assessments (candidates, never verdicts; no consolidation in R8-C):

- `ALG-artifacts-artifacts-content-fingerprint`: PARALLEL_VARIANT_CANDIDATE across artifactService / artifactParserService / artifactStructuredRepository (same sha256-hex-slice shape; normalized bodies differ by symbol/signature so analyzer fingerprints do not confirm exact duplication; behavioral equivalence UNPROVEN)
- `ALG-operations-canary-state-transition`: PARALLEL_VARIANT_CANDIDATE vs task032CanaryActivationStateMachineService and task034ControlledRolloutStateMachine pair (R8-B lines 3267/3271) — equivalence UNPROVEN
- `ALG-voice-airoutes-express-rate-limit`: PARALLEL_VARIANT_CANDIDATE: two rate-limit mechanisms (library trio + redis middleware) with divergent identity/fail behavior — equivalence UNPROVEN, consolidation FORBIDDEN in R8-C

R8-B duplication context (05_BACKEND_LOGIC_REGISTER.md gap notes): DUPLICATE_SERVICE_CANDIDATE pairs (task032 canary twin, task034 rollout twin, task033/034/035 review-service triples, diagnostics quad) and inMemory/prisma repository twins (SHARED_BY_DESIGN test doubles) are carried as review input, not re-decided here.

## External / Library-Delegated Algorithms

Backend owns the boundary; library internals are not reverse-engineered.

- `ALG-artifacts-artifacts-content-fingerprint` [STANDARD_LIBRARY_DELEGATED]: Derive a stable short identity for artifact content used by dedupe and replay detection. — deps: EXTERNAL_LIBRARY_DELEGATED: node crypto sha256 (library-dependent complexity)
- `ALG-artifacts-artifacts-media-dedupe-key` [STANDARD_LIBRARY_DELEGATED]: Give each ingested media asset a stable identity so re-ingestion resolves to one row. — deps: EXTERNAL_LIBRARY_DELEGATED: node crypto sha1; prisma raw SQL for table/index (runtime DDL guard)
- `ALG-voice-airoutes-express-rate-limit` [EXTERNAL_LIBRARY_DELEGATED]: Cap per-user AI, speech-to-text, text-to-speech and general request rates to bound provider cost and abuse. — deps: EXTERNAL_LIBRARY_DELEGATED: express-rate-limit (library-dependent complexity); redis via getRedisClient (second implementation)

Capabilities at the EXTERNAL / AI-LANE DECISION BOUNDARY (algorithm decomposition stops here):

- LOGIC-learning-core-api-copilot-live-chat: Analyzed sources delegate the decision to the AI lane / provider SDK; backend owns the boundary only.
- LOGIC-operations-api-task024operationsroutes: Analyzed sources delegate the decision to the AI lane / provider SDK; backend owns the boundary only.
- LOGIC-safety-api-copilot-tutorsafechatroutes: Analyzed sources delegate the decision to the AI lane / provider SDK; backend owns the boundary only.

## Existing Test and Benchmark Evidence

Test corpus: 3443 files. Benchmark mentions repository-wide: 22.

Benchmark vocabulary: BENCHMARK_EVIDENCED | PERFORMANCE_TEST_ONLY | NO_BENCHMARK_EVIDENCE. BENCHMARK_EVIDENCED requires actual target invocation inside a measurement harness; PERFORMANCE_TEST_ONLY requires a real perf/load test exercising the unit without a measured benchmark. Repository scan: benchmark evidence for 0 record(s), performance-test-only for 0 record(s); all other records are NO_BENCHMARK_EVIDENCE and every measured-performance field is NOT MEASURED IN R8-C.

Algorithm ID | Test evidence | Benchmark evidence | Measured | Maturity
--- | --- | --- | --- | ---
ALG-artifacts-artifacts-content-fingerprint | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-artifacts-artifacts-media-dedupe-key | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-artifacts-artifacts-media-stream-rank-score | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-artifacts-artifacts-recency-decay | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-artifacts-artifacts-replay-idempotency | DIRECT_BEHAVIOR_TEST (1 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-artifacts-artifacts-study-stream-rank-score | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-artifacts-videoaware-external-video-dedupe | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-mastery-confidencerecovery-mismatch-rank-dedupe | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-mastery-dailyfeed-feed-rank-dedupe | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-dailyobjective-idempotency-settle | DIRECT_BEHAVIOR_TEST (1 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-growth-topic-inference-signal-count | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-mastery-growth-video-effectiveness-score | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-practicemastery-evidence-level-ladder | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-practicemastery-next-practice-priority | DIRECT_BEHAVIOR_TEST (1 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-practicemastery-score-compute | DIRECT_BEHAVIOR_TEST (2 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-practicemastery-score-threshold-ladder | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-mastery-practicemastery-spaced-review-interval | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-operations-canary-state-transition | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED
ALG-operations-reliability-ai-circuit-breaker | DIRECT_BEHAVIOR_TEST (2 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-operations-reliability-ai-rate-limit-window | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-operations-reliability-ai-retry-backoff-jitter | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-operations-shared-pagination-cursor | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-questionbank-markinginvocation-batch-mark-sweep | DIRECT_BEHAVIOR_TEST (1 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-safety-task020-auth-jwt-claim-extract | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-safety-tutorpolicy-generation-policy-gate | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-school-learnerrecommendation-priority-policy | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-school-schoolintegration-roster-dryrun-conflict-scan | DIRECT_BEHAVIOR_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-school-schoolintegration-roster-reconcile | INDIRECT_INTEGRATION_TEST (5 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-voice-airoutes-express-rate-limit | INDIRECT_INTEGRATION_TEST (3 ref(s)) | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED+TEST_EVIDENCED
ALG-voice-voice-ledger-billing-quota | NO_TEST_EVIDENCE_FOUND | NO_BENCHMARK_EVIDENCE | NOT MEASURED IN R8-C | SOURCE_CONFIRMED

## Tarzan Algorithm Lab Candidates

No invention, no novelty, no branding. Classification only: what is worth later measurement and why.

- `ALG-artifacts-artifacts-content-fingerprint` => STANDARD_METHOD_KEEP
- `ALG-artifacts-artifacts-media-dedupe-key` => STANDARD_METHOD_KEEP
- `ALG-artifacts-artifacts-media-stream-rank-score` => LAB_RESEARCH_CANDIDATE
  - problem: Score a media asset against learner context so the best study/creative asset can be selected.
  - current method: Base 20 plus ~20 additive boosts: recommended score passthrough, exponential recency decay, completion/helpfulness, active/weak topic matches (+34/+36), kind preference, source-trust table, transcript/language/level/need matches, exam/focus bonuses, creative-mode external-source and clamped composite terms.
  - why measurement may matter: Core recommendation quality function; ~20 heuristic weights unmeasured and caller-side corpus size unknown.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Core recommendation quality function; ~20 heuristic weights unmeasured and caller-side corpus size unknown.
- `ALG-artifacts-artifacts-recency-decay` => MEASURE_FIRST
  - required future benchmark: Tiny pure function; decay shape worth confirming once against engagement data, not on a critical path.
- `ALG-artifacts-artifacts-replay-idempotency` => LAB_RESEARCH_CANDIDATE
  - problem: Decide whether an incoming re-parse is a same-content replay that must not disturb stored truth.
  - current method: Recompute fingerprint of incoming content; replay iff fingerprints match AND blockCount>0 AND parseStatus is parsed. Empty content is never a replay.
  - why measurement may matter: Guards stored artifact truth against re-parse corruption; paired with the atomic update path.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Guards stored artifact truth against re-parse corruption; paired with the atomic update path.
- `ALG-artifacts-artifacts-study-stream-rank-score` => LAB_RESEARCH_CANDIDATE
  - problem: Extend the base media score with revision-lane signals (due-now, needs-attention, spacing) for study ranking.
  - current method: Base study-mode score plus revision boosts: +18 revision link, +56 active item, +34 due-now, +30 needs-attention, +18 continue, +10 recent; interaction/completion caps; spacing boost; -18 penalty for context-free non-revision items.
  - why measurement may matter: Final study ordering function; revision-boost magnitudes are heuristic and drive what learners open.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Final study ordering function; revision-boost magnitudes are heuristic and drive what learners open.
- `ALG-artifacts-videoaware-external-video-dedupe` => LAB_RESEARCH_CANDIDATE
  - problem: Merge YouTube/Vimeo candidate lists into one deduped set keeping the stronger record per video.
  - current method: Single pass keyed on stable provider id; on collision keep the higher composite (educationalConfidence + clarityScore + 0.25 captions bonus). Served behind a TTL cache keyed on normalized request (limit default 12).
  - why measurement may matter: Provider-cost and latency hinge on this merge + cache; TTL and quality-weight behavior unmeasured.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Provider-cost and latency hinge on this merge + cache; TTL and quality-weight behavior unmeasured.
- `ALG-mastery-confidencerecovery-mismatch-rank-dedupe` => LAB_RESEARCH_CANDIDATE
  - problem: Collapse duplicate mismatch detections and order them for recovery follow-up.
  - current method: Set-key dedupe (first occurrence wins); fixed numeric priority table (source_required=0 … none=7, unknown=99); ascending numeric sort.
  - why measurement may matter: Orders recovery follow-ups learners see; small unit but user-facing and policy-table driven.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Orders recovery follow-ups learners see; small unit but user-facing and policy-table driven.
- `ALG-mastery-dailyfeed-feed-rank-dedupe` => LAB_RESEARCH_CANDIDATE
  - problem: Collapse duplicate objective items, derive urgency-aware priorities, and order the learner feed.
  - current method: Map-collapse per objective keeping the lowest DEDUPE_ORDER rank; priority derivation switch with due-date escalation (overdue => urgent/high); stable multi-key sort priority => type => dueAt => createdAt desc; optional slice limit.
  - why measurement may matter: User-facing daily ordering; sort/dedupe cost grows with feed size and priority-table quality is heuristic.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: User-facing daily ordering; sort/dedupe cost grows with feed size and priority-table quality is heuristic.
- `ALG-mastery-dailyobjective-idempotency-settle` => LAB_RESEARCH_CANDIDATE
  - problem: Guarantee exactly-once settlement of a check session across retries, races and partial failures.
  - current method: Stable key per session; check-before-act on read path and before ownership acquisition; checkpointed multi-step settlement with reconcile-on-version-conflict reload; already-completed retries short-circuit to stored result.
  - why measurement may matter: Exactly-once settlement guards evidence/mastery writes against duplication under retry and concurrency.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Exactly-once settlement guards evidence/mastery writes against duplication under retry and concurrency.
- `ALG-mastery-growth-topic-inference-signal-count` => LAB_RESEARCH_CANDIDATE
  - problem: Infer a topic label and next step from bounded recent learning-effect signals plus progress/mistake snapshots.
  - current method: Three parallel bounded reads; Set-membership counting of positive vs negative event types over ≤40 events; rate thresholds pick remediation vs confirmation next steps (0.34 repeated-mistake, 0.45 support-dependence).
  - why measurement may matter: Produces the mastery label learners and teachers see; rate-threshold quality is heuristic.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Produces the mastery label learners and teachers see; rate-threshold quality is heuristic.
- `ALG-mastery-growth-video-effectiveness-score` => LAB_RESEARCH_CANDIDATE
  - problem: Score whether a video actually improves learning (not just gets watched) and gate continued recommendation.
  - current method: Convex combination with weights 0.05/0.10/0.15/0.25/0.30/0.15 (improvement dominant; passive open-rate minimal by design); confidence by learner count (<3 low, <10 medium, else high); zero learners short-circuits to 0/low.
  - why measurement may matter: Decides which videos keep being recommended; weight quality and confidence cutoffs are heuristic.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Decides which videos keep being recommended; weight quality and confidence cutoffs are heuristic.
- `ALG-mastery-practicemastery-evidence-level-ladder` => LAB_RESEARCH_CANDIDATE
  - problem: Map accumulated evidence counts, correctness ratio and confidence into a mastery ladder level.
  - current method: Ordered threshold ladder evaluated top-down: zero-evidence guard; correctness ratio; anti-inflation floor (ratio<=0.2 or confidence<0.1 blocks progress); strong (5 independent, 0.85, 0.7); secure (3 evidence, 0.75, 0.5); developing (2, 0.5, 0.3); emerging (1, 0.2).
  - why measurement may matter: Directly decides reported mastery; anti-inflation thresholds need correctness proof under scale.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Directly decides reported mastery; anti-inflation thresholds need correctness proof under scale.
- `ALG-mastery-practicemastery-next-practice-priority` => LAB_RESEARCH_CANDIDATE
  - problem: Decide what the tutor should do next from misconceptions, recent attempts and review state.
  - current method: Documented 7-step priority cascade: active misconception > recent incorrect > review due > developing > proficient > strong > no-data fallback. Earlier steps suppress later ones (misconception presence blocks reteach branch).
  - why measurement may matter: Governs the learning path after every attempt; cascade order errors directly change outcomes.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Governs the learning path after every attempt; cascade order errors directly change outcomes.
- `ALG-mastery-practicemastery-score-compute` => LAB_RESEARCH_CANDIDATE
  - problem: Convert a mastery level plus confidence into a capped 0-100 score.
  - current method: Base score per level (0/15/30/50/70/90/25/10) times confidence multiplier (0.8/1.0/1.1), rounded and capped at 100.
  - why measurement may matter: Derived display score; the level decision (P0 ladder above) owns correctness, but score mapping shapes learner/teacher perception.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Derived display score; the level decision (P0 ladder above) owns correctness, but score mapping shapes learner/teacher perception.
- `ALG-mastery-practicemastery-score-threshold-ladder` => LAB_RESEARCH_CANDIDATE
  - problem: Derive a bounded mastery level from attempt history while detecting regression and blocking one-shot mastery.
  - current method: Guards first (zero attempts; zero evaluated), regression check (streak>=3 with history), remediation check, then reverse table scan: first row whose minAttempts/minCorrectRatio/maxIncorrectStreak all hold wins.
  - why measurement may matter: Core mastery truth with anti-inflation guarantees; threshold table needs correctness proof.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Core mastery truth with anti-inflation guarantees; threshold table needs correctness proof.
- `ALG-mastery-practicemastery-spaced-review-interval` => LAB_RESEARCH_CANDIDATE
  - problem: Compute when a skill must next be reviewed from priority, mastery level, mistakes and independent successes.
  - current method: Priority base interval, then ordered overrides: secure/strong mastery floors via max(); mistake>=3 collapses to 1 day; success>=5 stretches into [14,60]; final clamp to [1,90]; dueAt = now + intervalDays.
  - why measurement may matter: Drives revision timing and therefore mastery outcomes; interval quality is heuristic and unmeasured.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Drives revision timing and therefore mastery outcomes; interval quality is heuristic and unmeasured.
- `ALG-operations-canary-state-transition` => LAB_RESEARCH_CANDIDATE
  - problem: Admit or block canary lifecycle transitions with role and path guards, recording an auditable transition.
  - current method: Table lookup plus ordered role guards (unknown/student/teacher blocked) and activation-path guard (active only from armed|paused); any issue blocks with first-issue reason code; terminal states per table (UNRESOLVED detail — table body not inspected here).
  - why measurement may matter: Rollout safety gate with role enforcement; table completeness and twin-service divergence need proof.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Rollout safety gate with role enforcement; table completeness and twin-service divergence need proof.
- `ALG-operations-reliability-ai-circuit-breaker` => STANDARD_METHOD_KEEP
- `ALG-operations-reliability-ai-rate-limit-window` => STANDARD_METHOD_KEEP
- `ALG-operations-reliability-ai-retry-backoff-jitter` => STANDARD_METHOD_KEEP
- `ALG-operations-shared-pagination-cursor` => MEASURE_FIRST
  - required future benchmark: Small shared guard; worth a contract test but not a measurement campaign.
- `ALG-questionbank-markinginvocation-batch-mark-sweep` => LAB_RESEARCH_CANDIDATE
  - problem: Mark all deterministic-mode batch items while isolating failures and tracking batch lifecycle.
  - current method: Policy gate first (missingDecision may POLICY_BLOCK); filter items to deterministic|rubric_deterministic modes; sequential per-item execution with try/catch isolation (failures marked failed with timestamp, batch continues); batch flips to completed only when failedItems is empty.
  - why measurement may matter: Assessment pipeline sweep; batch-size scaling and per-item cost unmeasured (correctness of mode gating already policy-clear).
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Assessment pipeline sweep; batch-size scaling and per-item cost unmeasured (correctness of mode gating already policy-clear).
- `ALG-safety-task020-auth-jwt-claim-extract` => LAB_RESEARCH_CANDIDATE
  - problem: Prove caller identity from JWT and derive a normalized user/role/school triple without trusting URL shape.
  - current method: Ordered claim extraction: Bearer prefix check and slice; candidate-key cascade (userId|studentId|id|sub; schoolId|school_id|orgId|organizationId); role allow-list normalization with roles-array fallback. Signature verification itself delegated to jsonwebtoken (see schoolAuthBridgeService.ts:1 import).
  - why measurement may matter: Authentication/authorization correctness gates every learner-data boundary.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Authentication/authorization correctness gates every learner-data boundary.
- `ALG-safety-tutorpolicy-generation-policy-gate` => LAB_RESEARCH_CANDIDATE
  - problem: Decide whether the tutor may generate, in which safe mode, before any provider call.
  - current method: Priority-ordered gate: block => refer => clarify_first => seriousRisk => safeguardingCandidate => direct-answer-without-attempt (hint_only) => final-answer-blocked (attempt? feedback : hint_only). First match wins; every refusal carries a student-safe fallback.
  - why measurement may matter: Safety/academic-integrity enforcement before generation; gate-order errors have safeguarding consequences.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Safety/academic-integrity enforcement before generation; gate-order errors have safeguarding consequences.
- `ALG-school-learnerrecommendation-priority-policy` => LAB_RESEARCH_CANDIDATE
  - problem: Fix the display order and explanation contract for every learner recommendation type.
  - current method: Total-order table: revision_due=1, mistake/spaced-review=2, foundation=3, mastery/continue=4, similar=5, teacher_help=6, challenge=7, deen_referral=8. Accessor getRecommendationPriority (line 308) reads the table.
  - why measurement may matter: User-facing order of learning guidance; priority-table quality shapes what learners do next.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: User-facing order of learning guidance; priority-table quality shapes what learners do next.
- `ALG-school-schoolintegration-roster-dryrun-conflict-scan` => LAB_RESEARCH_CANDIDATE
  - problem: Preview a roster payload for duplicate ids and school-scope mismatches before any write.
  - current method: Three linear passes (students, teachers, classes): Set-membership duplicate detection plus per-record schoolId equality check; every hit appends a high-severity typed conflict with safe details.
  - why measurement may matter: Last gate before school-size identity writes; scan completeness and PII handling need proof.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Last gate before school-size identity writes; scan completeness and PII handling need proof.
- `ALG-school-schoolintegration-roster-reconcile` => LAB_RESEARCH_CANDIDATE
  - problem: Turn an external roster diff into safe per-entry mapping actions without losing learning history.
  - current method: Single pass: category switch maps to create/update/reactivate/inactivate/quarantine/skip with safe summaries; history-preserving categories set preserveHistory=true; counts accumulated by action class.
  - why measurement may matter: School-size identity writes; category coverage and caller batching need correctness proof.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: School-size identity writes; category coverage and caller batching need correctness proof.
- `ALG-voice-airoutes-express-rate-limit` => STANDARD_METHOD_KEEP
- `ALG-voice-voice-ledger-billing-quota` => LAB_RESEARCH_CANDIDATE
  - problem: Enforce per-student voice time quotas with auditable double-entry style ledger updates.
  - current method: Ceil-to-int non-negative billing; FIFO consumption oldest-grant-first with partial deduction; row lock + grant aggregate + dev-bootstrap guard inside one Prisma transaction; last-10 ledger tail for display.
  - why measurement may matter: Money-like quota correctness under concurrency; FIFO + lock behavior needs reliability proof.
  - strong known baseline: UNRESOLVED (source does not identify one)
  - required future benchmark: Money-like quota correctness under concurrency; FIFO + lock behavior needs reliability proof.

## Unresolved Algorithms

Preserved R8-B unresolved logic candidates (status NOT upgraded):

Logic ID | Mount | Note
--- | --- | ---
LOGIC-memory-api-copilot-evidence | /api/copilot/evidence | UNRESOLVED CAPABILITY; no procedure claimed
LOGIC-question-bank-api-question-bank-exam-papers | /api/question-bank/exam-papers | UNRESOLVED CAPABILITY; no procedure claimed
LOGIC-question-bank-api-question-bank-marking | /api/question-bank/marking | UNRESOLVED CAPABILITY; no procedure claimed
LOGIC-question-bank-api-question-bank-marking-invocation | /api/question-bank/marking-invocation | UNRESOLVED CAPABILITY; procedure recorded (ALG-questionbank-markinginvocation-batch-mark-sweep) without status change
LOGIC-question-bank-api-question-bank-recovery-case-adjudication | /api/question-bank/recovery-case-adjudication | UNRESOLVED CAPABILITY; no procedure claimed
LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board | /api/question-bank/recovery-execution-readiness-board | UNRESOLVED CAPABILITY; no procedure claimed
LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure | /api/question-bank/recovery-lifecycle-closure | UNRESOLVED CAPABILITY; no procedure claimed

Structural candidates for R8-D review (78): signals present, inspection pending.

Logic ID | Top files | Top signals
--- | --- | ---
LOGIC-artifacts-api-copilot-videoawarepracticeroutes | src/routes/videoAwarePractice.ts, src/services/learnerMemoryResolver.ts, src/services/learningEventService.ts, src/services/masteryResolver.ts | loops×10, sort×2, filter+map×22, min/max×2, threshold-compare×37, weighted-arith×1, clock×11, random×4
LOGIC-artifacts-api-copilot-videolearningsessionroutes | src/routes/videoLearningSessions.ts, src/services/learningEventService.ts, src/services/tutorStateContracts.ts, src/services/tutorStateService.ts | loops×3, sort×1, filter+map×11, min/max×3, threshold-compare×23, clock×8, random×2, Map/Set×4
LOGIC-learning-core-api-copilot-copilothandoffroutes | src/routes/copilotHandoff.ts, src/services/copilotHandoffContracts.ts, src/services/copilotHandoffService.ts, src/services/copilotSessionContinuityContracts.ts | loops×1, filter+map×1, threshold-compare×10, clock×3, random×1, prisma×6, retry-tokens×9
LOGIC-learning-core-api-copilot-tutor-actions | src/routes/tutorActionRoutes.ts, src/services/learnerNeedClassifierService.ts, src/services/tutorActionAccessPolicy.ts, src/services/tutorActionContextBuilder.ts | loops×2, filter+map×5, threshold-compare×9, clock×3, Map/Set×1, prisma×45, switch×4, retry-tokens×11
LOGIC-learning-core-api-copilot-tutor-state | src/routes/tutorState.ts, src/services/artifactAwarePracticeResolver.ts, src/services/artifactContracts.ts, src/services/artifactService.ts | loops×1, sort×2, filter+map×16, min/max×1, threshold-compare×41, clock×13, random×3, Map/Set×6
LOGIC-learning-core-api-copilot-tutor-turn | src/routes/tutorTurnRuntimeRoutes.ts, src/services/tutorTurnRuntimeAccessPolicy.ts, src/services/tutorTurnRuntimeContextBuilder.ts, src/services/tutorTurnRuntimeDispatcher.ts | filter+map×4, threshold-compare×14, clock×6, Map/Set×1, switch×6, retry-tokens×4, idempotency/dedupe×2
LOGIC-learning-core-api-tutor-tutorconversationroutes | src/routes/tutorConversation.ts, src/services/backendHealthService.ts, src/services/backendReadinessService.ts, src/services/endToEndLearningLoopRuntime.ts | filter+map×5, min/max×1, threshold-compare×25, clock×16, Map/Set×1, raw-sql×5, state-tokens×76, retry-tokens×15
LOGIC-mastery-api-copilot-adaptive-challenges | src/routes/adaptiveChallengeRoutes.ts, src/services/adaptiveChallengeAccessPolicy.ts, src/services/adaptiveChallengeAuditRepository.ts, src/services/adaptiveChallengeAuditService.ts | loops×7, filter+map×6, threshold-compare×12, clock×6, prisma×21, retry-tokens×22
LOGIC-mastery-api-copilot-adaptive-recommendations | src/routes/adaptiveRecommendationTuningRoutes.ts, src/services/adaptiveRecommendationProfileService.ts, src/services/adaptiveRecommendationSourceTruthPolicy.ts, src/services/adaptiveRecommendationTuningAccessPolicy.ts | loops×5, filter+map×10, min/max×6, threshold-compare×18, clock×9, Map/Set×2, prisma×3, switch×1
LOGIC-mastery-api-copilot-exam-mode | src/routes/examModeRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiErrorService.ts, src/services/examModeAccessPolicy.ts | loops×3, filter+map×7, threshold-compare×9, clock×8, Map/Set×1, prisma×6, switch×1, retry-tokens×91
LOGIC-mastery-api-copilot-focus-mode | src/routes/focusModeRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiErrorService.ts, src/services/focusModeAccessPolicy.ts | loops×3, filter+map×6, threshold-compare×8, clock×7, Map/Set×1, prisma×4, switch×1, retry-tokens×70
LOGIC-mastery-api-copilot-growth | src/routes/growthActionRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiMetadataService.ts, src/services/dataSourceTruthService.ts | loops×3, filter+map×5, threshold-compare×4, clock×6, Map/Set×1, switch×1, retry-tokens×2
LOGIC-mastery-api-copilot-quiz-mode | src/routes/quizModeRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiErrorService.ts, src/services/learningAttemptService.ts | loops×1, filter+map×18, threshold-compare×9, clock×11, Map/Set×3, prisma×43, retry-tokens×83, idempotency/dedupe×2
LOGIC-mastery-api-copilot-remediation | src/routes/remediationRoutes.ts, src/services/adaptiveChallengeAccessPolicy.ts, src/services/adaptiveChallengeAuditRepository.ts, src/services/adaptiveChallengeAuditService.ts | loops×7, filter+map×3, threshold-compare×12, clock×3, prisma×4, retry-tokens×2
LOGIC-mastery-api-copilot-revision-mode | src/routes/revisionModeRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiErrorService.ts, src/services/revisionModeAccessPolicy.ts | loops×1, filter+map×9, threshold-compare×21, clock×9, prisma×20, switch×1, retry-tokens×63, idempotency/dedupe×4
LOGIC-mastery-api-copilot-teach-back-mode | src/routes/teachBackModeRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiErrorService.ts, src/services/learningAttemptService.ts | loops×1, filter+map×6, threshold-compare×4, clock×8, prisma×33, switch×1, retry-tokens×58, reconcile×5
LOGIC-mastery-api-learner-adaptivechallengeroutes | src/routes/adaptiveChallenges.ts, src/services/adaptiveChallengeAuditRepository.ts, src/services/adaptiveChallengeAuditService.ts, src/services/adaptiveChallengeGenerationRuntime.ts | filter+map×4, min/max×3, threshold-compare×16, weighted-arith×1, clock×7, random×1, prisma×21, retry-tokens×41
LOGIC-mastery-api-phase3-living-revision | src/routes/phase3LivingRevisionRoutes.ts, src/services/phase3LivingRevisionRepository.ts, src/services/phase3RevisionAuditService.ts, src/services/phase3RevisionDueResolverService.ts | loops×23, sort×10, filter+map×9, min/max×2, threshold-compare×11, clock×34, random×2, Map/Set×10
LOGIC-mastery-api-phase3-objectives | src/domains/learning-evidence/services/learningEvidenceCommandService.ts, src/domains/learning-evidence/services/learningEvidencePrivacyGuard.ts, src/routes/phase3ObjectiveMasteryRoutes.ts, src/services/phase3DailyObjectiveSeedService.ts | loops×1, filter+map×8, threshold-compare×21, clock×8, random×2, hash×2, prisma×1, switch×10
LOGIC-mastery-api-phase3-study-plans | src/routes/phase3StudyPlanRoutes.ts, src/services/apiEnvelopeService.ts, src/services/apiMetadataService.ts, src/services/learningIntelligenceIntegrationService.ts | loops×10, sort×4, filter+map×71, min/max×19, threshold-compare×88, clock×37, random×7, Map/Set×19
LOGIC-memory-api-copilot-learner-memory | src/routes/learnerMemory.ts, src/services/learnerMemoryContracts.ts, src/services/learnerMemoryReducer.ts, src/services/learnerMemoryResolver.ts | loops×10, sort×3, filter+map×21, min/max×8, threshold-compare×32, weighted-arith×1, clock×14, random×3
LOGIC-memory-api-copilot-learner-transparency | src/routes/learnerTransparencyRoutes.ts, src/services/learnerDeenReferralExplanationService.ts, src/services/learnerHiddenReasoningBoundaryGuard.ts, src/services/learnerSafeguardingBoundaryNoticeService.ts | loops×11, filter+map×5, threshold-compare×13, clock×17, Map/Set×3
LOGIC-memory-api-copilot-learning-evidence | src/routes/safeLearningEvidenceRoutes.ts, src/services/safeLearningEvidenceAccessPolicy.ts, src/services/safeLearningEvidenceAggregateService.ts, src/services/safeLearningEvidenceIdempotencyService.ts | loops×6, filter+map×12, reduce×1, min/max×1, threshold-compare×16, clock×1, Map/Set×3, prisma×34
LOGIC-memory-api-copilot-teacher-insights | src/routes/teacherSafeInsightRoutes.ts, src/services/teacherSafeClassSummaryService.ts, src/services/teacherSafeDashboardEvidenceService.ts, src/services/teacherSafeInsightAccessPolicy.ts | loops×5, sort×1, filter+map×4, min/max×1, threshold-compare×21, clock×3, random×1, Map/Set×2
LOGIC-memory-api-question-bank-result-learning-evidence | src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts, src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts, src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts, src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts | loops×2, filter+map×1, threshold-compare×44, clock×12, random×17, prisma×19, idempotency/dedupe×29, reconcile×2
LOGIC-operations-api-deploymentreadinessroutes | src/routes/deploymentReadiness.ts, src/services/backendHealthService.ts, src/services/task021SchoolContextVerificationService.ts, src/services/task022ApprovedSourceRegistryService.ts | loops×1, filter+map×19, min/max×1, threshold-compare×16, clock×7, Map/Set×4, raw-sql×1, retry-tokens×1
LOGIC-operations-api-health-healthroutes | src/routes/health.ts, src/services/backendAuditEventService.ts, src/services/backendDependencyCheckService.ts, src/services/backendEnvSchema.ts | loops×5, filter+map×17, min/max×1, threshold-compare×16, clock×22, random×1, Map/Set×1, raw-sql×2
LOGIC-operations-api-ops-opspublicrouter | src/routes/task018OperationsDiagnostics.ts, src/services/durableAuditEventService.ts, src/services/task018AdminDiagnosticsScopePolicyService.ts, src/services/task018ComponentHealthMonitorService.ts | loops×1, sort×1, filter+map×38, min/max×3, threshold-compare×11, clock×16, random×6, Map/Set×4
LOGIC-operations-api-task023-deployment-readiness | src/routes/task023DeploymentReadinessRoutes.ts, src/services/noAiBypassRuntimeGuard.ts, src/services/phase3ConfidenceCalibrationService.ts, src/services/phase3DailyLearningFeedService.ts | loops×7, sort×1, filter+map×36, reduce×4, min/max×8, threshold-compare×51, weighted-arith×2, clock×25
LOGIC-operations-api-task025-pilot-readiness | src/routes/task025ControlledPilotReadinessRoutes.ts, src/services/task025CandidateCohortReadinessService.ts, src/services/task025DataPrivacyReadinessService.ts, src/services/task025MonitoringGateReadinessService.ts | min/max×1, threshold-compare×13, clock×1, prisma×89
LOGIC-operations-api-task025pilotroutes | src/routes/task025PilotRoutes.ts, src/services/task025PilotAccessGateService.ts, src/services/task025PilotDryRunService.ts, src/services/task025PilotReadinessService.ts | loops×9, filter+map×14, threshold-compare×21, clock×6, random×1, Map/Set×3, switch×2
LOGIC-operations-api-task026pilotexecutionroutes | src/routes/task026PilotExecutionRoutes.ts, src/services/task025PilotReadinessService.ts, src/services/task026PilotExecutionControlService.ts, src/services/task026PilotExecutionEventService.ts | loops×3, filter+map×11, threshold-compare×18, clock×1, Map/Set×3, switch×2, state-tokens×49, retry-tokens×2
LOGIC-operations-api-task027pilotexpansionroutes | src/routes/task027PilotExpansionRoutes.ts, src/services/task027PilotExpansionAuditService.ts, src/services/task027PilotExpansionCohortChangeService.ts, src/services/task027PilotExpansionDecisionService.ts | loops×2, filter+map×21, threshold-compare×23, clock×4, Map/Set×3
LOGIC-operations-api-task028-controlled-expansion-execution | src/routes/task028ControlledExpansionExecutionRoutes.ts, src/services/task028ApprovedExpansionPlanService.ts, src/services/task028ControlledExpansionRunService.ts, src/services/task028DailyExpansionSummaryService.ts | filter+map×15, threshold-compare×31, clock×5, random×1, state-tokens×65
LOGIC-operations-api-task028expansionexecutionroutes | src/routes/task028ExpansionExecutionRoutes.ts, src/services/task028ExpandedRuntimeGuardService.ts, src/services/task028ExpansionCompletionReviewService.ts, src/services/task028ExpansionExecutionAuditService.ts | loops×1, filter+map×23, threshold-compare×44, clock×2, random×1, switch×1, state-tokens×20
LOGIC-operations-api-task029expansionoperationsroutes | src/routes/task029ExpansionOperationsRoutes.ts, src/services/task028ExpansionCompletionReviewService.ts, src/services/task028ExpansionExecutionAuditService.ts, src/services/task028ExpansionExecutionStateMachine.ts | filter+map×29, threshold-compare×24, clock×2, random×1, switch×1, state-tokens×38
LOGIC-operations-api-task030-controlled-staging-rehearsal | src/routes/task030ControlledStagingRehearsalRoutes.ts, src/services/task030AdminOperatorJourneyService.ts, src/services/task030ControlActionRehearsalService.ts, src/services/task030ControlledStagingDiagnosticsService.ts | loops×2, filter+map×5, threshold-compare×11, clock×4, random×1, state-tokens×3
LOGIC-operations-api-task031-staging-smoke-canary-readiness | src/routes/task031StagingSmokeCanaryReadinessRoutes.ts, src/services/task031AdminOperatorMonitoringSmokeService.ts, src/services/task031BackendRouteSmokeService.ts, src/services/task031CanaryReadinessDecisionService.ts | loops×1, filter+map×3, threshold-compare×7, Map/Set×1, state-tokens×1
LOGIC-operations-api-task033-controlled-canary-observation | src/routes/task033ControlledCanaryObservationRoutes.ts, src/services/task033CanaryDriftDetectionService.ts, src/services/task033CanaryHealthObservationService.ts, src/services/task033ContentGovernanceObservationService.ts | loops×2, filter+map×9, threshold-compare×29, clock×1, state-tokens×3, retry-tokens×19
LOGIC-operations-api-task034-controlled-limited-rollout | src/routes/task034ControlledLimitedRolloutRoutes.ts, src/services/task034ContentGovernanceReviewService.ts, src/services/task034ControlledLimitedRolloutReportService.ts, src/services/task034ControlledRolloutCommandService.ts | loops×1, filter+map×1, threshold-compare×15, clock×2, random×1, switch×1, state-tokens×19, retry-tokens×6

Further unknowns carried explicitly (not hidden): provider/library internals behind delegation boundaries; Prisma query-plan complexity; twin-service behavioral divergence (task032/task034 state machines); module-Map growth under burst (rate guard, idempotency store, service cache); multi-instance coherence of process-local limiters/breakers; batch-size bounds for roster and marking sweeps; caller-side corpus sizes for scoring loops.

## R8-D / R8-E / R8-F Handoff Signals

Allowed signals only: COMPLETENESS_REVIEW, PERFORMANCE_MEASUREMENT, RELIABILITY_REVIEW, DUPLICATION_REVIEW, STRUCTURAL_CONSOLIDATION_REVIEW, NAMING_REVIEW, DEAD_CODE_REVIEW, NONE. No action is taken in R8-C.

- SIGNAL: DUPLICATION_REVIEW — ALG-artifacts-artifacts-content-fingerprint (P1; HASH_OR_FINGERPRINT)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-artifacts-content-fingerprint (P1; HASH_OR_FINGERPRINT)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-artifacts-media-dedupe-key (P1; DEDUPLICATION)
- SIGNAL: RELIABILITY_REVIEW — ALG-artifacts-artifacts-media-dedupe-key (P1; DEDUPLICATION)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-artifacts-media-stream-rank-score (P1; SCORE_OR_WEIGHTED_SCORE)
- SIGNAL: RELIABILITY_REVIEW — ALG-artifacts-artifacts-media-stream-rank-score (P1; SCORE_OR_WEIGHTED_SCORE)
- SIGNAL: RELIABILITY_REVIEW — ALG-artifacts-artifacts-recency-decay (P2; DECAY_OR_RETENTION)
- SIGNAL: COMPLETENESS_REVIEW — ALG-artifacts-artifacts-replay-idempotency (P0; IDEMPOTENCY)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-artifacts-replay-idempotency (P0; IDEMPOTENCY)
- SIGNAL: RELIABILITY_REVIEW — ALG-artifacts-artifacts-replay-idempotency (P0; IDEMPOTENCY)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-artifacts-study-stream-rank-score (P1; RANKING_OR_TOP_K)
- SIGNAL: RELIABILITY_REVIEW — ALG-artifacts-artifacts-study-stream-rank-score (P1; RANKING_OR_TOP_K)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-artifacts-videoaware-external-video-dedupe (P1; DEDUPLICATION)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-confidencerecovery-mismatch-rank-dedupe (P1; RANKING_OR_TOP_K)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-dailyfeed-feed-rank-dedupe (P1; RANKING_OR_TOP_K)
- SIGNAL: RELIABILITY_REVIEW — ALG-mastery-dailyfeed-feed-rank-dedupe (P1; RANKING_OR_TOP_K)
- SIGNAL: COMPLETENESS_REVIEW — ALG-mastery-dailyobjective-idempotency-settle (P0; IDEMPOTENCY)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-dailyobjective-idempotency-settle (P0; IDEMPOTENCY)
- SIGNAL: RELIABILITY_REVIEW — ALG-mastery-dailyobjective-idempotency-settle (P0; IDEMPOTENCY)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-growth-topic-inference-signal-count (P0; AGGREGATION_OR_REDUCTION)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-growth-video-effectiveness-score (P1; SCORE_OR_WEIGHTED_SCORE)
- SIGNAL: COMPLETENESS_REVIEW — ALG-mastery-practicemastery-evidence-level-ladder (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-practicemastery-evidence-level-ladder (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: COMPLETENESS_REVIEW — ALG-mastery-practicemastery-next-practice-priority (P0; SELECTION_OR_FILTERING)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-practicemastery-next-practice-priority (P0; SELECTION_OR_FILTERING)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-practicemastery-score-compute (P1; SCORE_OR_WEIGHTED_SCORE)
- SIGNAL: COMPLETENESS_REVIEW — ALG-mastery-practicemastery-score-threshold-ladder (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-practicemastery-score-threshold-ladder (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-mastery-practicemastery-spaced-review-interval (P0; SCHEDULING_OR_PRIORITY)
- SIGNAL: RELIABILITY_REVIEW — ALG-mastery-practicemastery-spaced-review-interval (P0; SCHEDULING_OR_PRIORITY)
- SIGNAL: COMPLETENESS_REVIEW — ALG-operations-canary-state-transition (P0; STATE_MACHINE)
- SIGNAL: DUPLICATION_REVIEW — ALG-operations-canary-state-transition (P0; STATE_MACHINE)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-operations-canary-state-transition (P0; STATE_MACHINE)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-operations-reliability-ai-circuit-breaker (P1; CIRCUIT_BREAKER)
- SIGNAL: RELIABILITY_REVIEW — ALG-operations-reliability-ai-circuit-breaker (P1; CIRCUIT_BREAKER)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-operations-reliability-ai-rate-limit-window (P1; RATE_LIMIT_OR_QUOTA)
- SIGNAL: RELIABILITY_REVIEW — ALG-operations-reliability-ai-rate-limit-window (P1; RATE_LIMIT_OR_QUOTA)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-operations-reliability-ai-retry-backoff-jitter (P0; RETRY_OR_BACKOFF)
- SIGNAL: RELIABILITY_REVIEW — ALG-operations-reliability-ai-retry-backoff-jitter (P0; RETRY_OR_BACKOFF)
- SIGNAL: NONE — ALG-operations-shared-pagination-cursor (P2; PAGINATION_OR_CURSOR)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-questionbank-markinginvocation-batch-mark-sweep (P1; BATCHING_OR_CHUNKING)
- SIGNAL: COMPLETENESS_REVIEW — ALG-safety-task020-auth-jwt-claim-extract (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-safety-task020-auth-jwt-claim-extract (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: COMPLETENESS_REVIEW — ALG-safety-tutorpolicy-generation-policy-gate (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-safety-tutorpolicy-generation-policy-gate (P0; DETERMINISTIC_RULE_SET)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-school-learnerrecommendation-priority-policy (P1; SCHEDULING_OR_PRIORITY)
- SIGNAL: COMPLETENESS_REVIEW — ALG-school-schoolintegration-roster-dryrun-conflict-scan (P0; SELECTION_OR_FILTERING)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-school-schoolintegration-roster-dryrun-conflict-scan (P0; SELECTION_OR_FILTERING)
- SIGNAL: COMPLETENESS_REVIEW — ALG-school-schoolintegration-roster-reconcile (P0; RECONCILIATION)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-school-schoolintegration-roster-reconcile (P0; RECONCILIATION)
- SIGNAL: DUPLICATION_REVIEW — ALG-voice-airoutes-express-rate-limit (P1; RATE_LIMIT_OR_QUOTA)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-voice-airoutes-express-rate-limit (P1; RATE_LIMIT_OR_QUOTA)
- SIGNAL: COMPLETENESS_REVIEW — ALG-voice-voice-ledger-billing-quota (P0; RATE_LIMIT_OR_QUOTA)
- SIGNAL: PERFORMANCE_MEASUREMENT — ALG-voice-voice-ledger-billing-quota (P0; RATE_LIMIT_OR_QUOTA)
- SIGNAL: RELIABILITY_REVIEW — ALG-voice-voice-ledger-billing-quota (P0; RATE_LIMIT_OR_QUOTA)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-copilot-evidence (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-exam-papers (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-marking (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-marking-invocation (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-recovery-case-adjudication (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure (UNRESOLVED CAPABILITY)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-artifacts-api-copilot-videoawarepracticeroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-artifacts-api-copilot-videolearningsessionroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-learning-core-api-copilot-copilothandoffroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-learning-core-api-copilot-tutor-actions (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-learning-core-api-copilot-tutor-state (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-learning-core-api-copilot-tutor-turn (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-learning-core-api-tutor-tutorconversationroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-adaptive-challenges (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-adaptive-recommendations (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-exam-mode (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-focus-mode (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-growth (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-quiz-mode (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-remediation (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-revision-mode (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-copilot-teach-back-mode (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-learner-adaptivechallengeroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-phase3-living-revision (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-phase3-objectives (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-mastery-api-phase3-study-plans (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-copilot-learner-memory (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-copilot-learner-transparency (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-copilot-learning-evidence (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-copilot-teacher-insights (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-memory-api-question-bank-result-learning-evidence (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-deploymentreadinessroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-health-healthroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-ops-opspublicrouter (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task023-deployment-readiness (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task025-pilot-readiness (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task025pilotroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task026pilotexecutionroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task027pilotexpansionroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task028-controlled-expansion-execution (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task028expansionexecutionroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task029expansionoperationsroutes (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task030-controlled-staging-rehearsal (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task031-staging-smoke-canary-readiness (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task033-controlled-canary-observation (structural candidate)
- SIGNAL: COMPLETENESS_REVIEW — LOGIC-operations-api-task034-controlled-limited-rollout (structural candidate)

