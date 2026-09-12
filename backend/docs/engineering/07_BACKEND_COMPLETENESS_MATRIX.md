# Backend Completeness Matrix

R8-D domain completeness assessment. Mode: ACCEPTED-EVIDENCE SYNTHESIS + TARGETED SOURCE INSPECTION. Production backend source was read-only in R8-D. No completeness claim below is inferred from names alone; every claim cites accepted R8-B/R8-C evidence (artifact + line/section) or targeted SOURCE_INSPECTION (backend/src path, files unchanged).

## Baseline

- Repository: `arthurnduati5-svg/Steadfast-AI` (local `C:\Users\HP\Steadfast-AI`), backend at `backend/`
- Branch: `main`
- Accepted remote HEAD at start: `acef586928765f4073227df2681b27c129045e6f` (R8-C: `chore(r8-c): ground algorithm test evidence`)
- R8-A source fingerprint: `sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0`
- Accepted structural snapshot: files=5398 routeModules=134 routeMounts=167 routeEndpoints=3312 prismaModels=432
- Accepted R8-B accounting: 103 confirmed logic capabilities (L2=7, L3=99, L4=4, L5+ not awarded), 7 unresolved route-group candidates
- Accepted R8-C accounting: 30 algorithm records (18 ALGORITHM_PRESENT, 4 NO_DISTINCT_ALGORITHM, 3 ALGORITHM_DELEGATED, 85 UNRESOLVED), 78 structural completeness-review candidates
- R8-D scope: completeness truth + gap classification only. No production behavior changed; no R8-E/F/G work started.

## Method and Evidence Law

1. Artifact-first: 04 (data ownership) → 05 (logic register) → 06 (algorithm register) → targeted source inspection only where unresolved or high-risk. 01/02/03 not opened.
2. R8-B L0–L7 definitions are preserved verbatim; R8-D may aggregate but never relabel accepted evidence.
3. Completeness dimension values: `PROVEN` | `PRESENT_BUT_PARTIAL` | `ABSENT` | `NOT_APPLICABLE` | `UNKNOWN`. Absence requires evidence; `UNKNOWN` is never converted to `ABSENT`.
4. Domain readiness where accepted artifacts lack sufficient information: `DOMAIN READINESS = UNKNOWN` — no invented level.
5. Targeted inspections performed in R8-D (smallest chain per §11):
   - `src/index.ts:376-383` + `src/domains/assessment/runtime/questionBankRuntimeComposition.ts:420-446` + `src/domains/assessment/runtime/questionBankRepositoryMode.ts:7-64` — resolves how the question-bank/marking/exam-paper routers pick durable vs in-memory repositories (fail-closed resolver).
   - `src/routes/marking.ts:1-40`, `src/routes/examPaper.ts:1-30` — router construction is dependency-injected repository-driven, with SafeResponseEnvelope output.
   - `src/routes/phase3DailyObjectiveCheckRoutes.ts:6,401` + `src/services/phase3DailyObjectiveCheckCompletionService.ts:40,63,114,138,830` — daily-objective settlement idempotency (durable idempotency record plus process-local `Map` fast path).
   - `src/services/voiceLedgerService.ts:144,216-220,472` — `prisma.$transaction` + `SELECT ... FOR UPDATE` row locks on `StudentProfile` and `VoiceSessionUsage`.
   - `src/domains/learning-evidence/routes/learningEvidenceRoutes.ts:11-17` — actor identity is taken from request headers (`x-school-id`, `x-actor-id`, `x-actor-role`).
   - `src/domains/learning-evidence/services/learningEvidenceCommandService.ts:187-206,254,320,363,372` — role allow-lists and same-learner enforcement inside the command service.
   - `src/lib/redis.ts:16-65` — Redis client degrades with cooldown rather than crashing the process.
   - `src/index.ts:540-553` — `/api/copilot/evidence`, `/api/copilot/teacher-insights`, `/api/copilot/learner-transparency` mounts carry `schoolAuthMiddleware` + `requireVerifiedSchoolContext`.
6. No repository-wide scanner was written or rerun; no full-test parse; no benchmark run.

## Completeness Vocabulary

R8-B capability levels (preserved exactly from `05_BACKEND_LOGIC_REGISTER.md`): L0 ABSENT, L1 SCAFFOLD, L2 PARTIAL, L3 CONNECTED (route/module → downstream service/repository/data proven), L4 FUNCTIONALLY COMPLETE (source-verified input/validation + decision + persistence/output + failure/result path), L5 RELIABLE / L6 PRODUCTION-READY CANDIDATE / L7 OPTIMIZED (require runtime proof; never awarded in R8-B).

R8-B distribution (unchanged): L2 = 7, L3 = 99, L4 = 4. R8-D does not upgrade or downgrade any L-rating; it adds R8-D completeness assessments per domain using the dimension vocabulary in §Method.

## Executive Domain Summary

Domains without accepted R8-B capability mappings (Parent-Facing, Growth as a distinct domain) are folded into their owning domains per §6 of the task; their product capabilities remain visible in the owning domain sections.

| Domain | Capabilities (R8-B) | Current completeness | Auth/Tenant | Canonical truth | Durability | Retry | Concurrency | Failure/Recovery | Long-history | Consumers | Gap count | Highest gap disposition | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity / Auth / School Context | middleware layer (ALG-safety-task020-auth-jwt-claim-extract) | PRESENT_BUT_PARTIAL | PROVEN (mount-level) | middleware `schoolAuthMiddleware` | N/A stateless gate | NOT_APPLICABLE | UNKNOWN | PROVEN fail-closed in source-verified paths | NOT_APPLICABLE | all routes | 2 | REQUIRED BEFORE PRODUCTION | high |
| Curriculum / Knowledge Graph | 26 (question-bank section incl. curriculum governance) | PARTIALLY_BOUNDED; many writer UNRESOLVED | PROVEN on mounts | `difficultyCalibrationRepository.ts` (1 model CLEAR); curriculum records writers UNRESOLVED (TEST_PROOF only) | PARTIALLY_BOUNDED | UNKNOWN | UNKNOWN | UNKNOWN | POTENTIALLY_UNBOUNDED (raw-SQL reads) | learner feed, governance UI | 3 | REQUIRED BEFORE PRODUCTION | medium |
| Student Learning Sessions | chat-session family + LOGIC-learning-core group | PRESENT_BUT_PARTIAL | PROVEN on mounts | CLEAR: `src/repositories/chatMessageRepository.ts` single ChatMessage persistence owner (R8-F; live callers delegate, semantics preserved) | PROVEN (PostgreSQL via Prisma) | UNKNOWN | UNKNOWN (single owner; no lock/version semantics proven) | UNKNOWN | PARTIALLY_BOUNDED | tutor UI, archives | 3 | REQUIRED BEFORE PRODUCTION | medium |
| Tutor State / Learning Core | 6 LOGIC-learning-core capabilities | L3 (no L4) | PROVEN on 4 of 6 mounts; `/api/copilot` handoff has no middleware | UNRESOLVED for most capabilities | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT_APPLICABLE | copilot client | 2 | REQUIRED BEFORE PRODUCTION | medium |
| Learning Evidence | 6 LOGIC-memory capabilities + 19-model family | PRESENT_BUT_PARTIAL | authentication PROVEN; tenant/school isolation PROVEN; actor-role authorization provenance RESOLVED in current production source (R8-D discovery preserved in 08; resolved by commits `89c00419…`, `87ab25b3…`: identity now derives exclusively from verified server-side context `req.user`; internal operations restricted to privileged verified roles) | CLEAR for event-store models (`prismaLearningEvidenceEventStoreRepository.ts`); AMBIGUOUS family-wide | PROVEN ($transaction event store) | PROVEN idempotency records exist | PROVEN $transaction; role allow-lists PROVEN in-service and now sourced from verified server-side role identity | PROVEN transactional | PARTIALLY_BOUNDED (idempotency records grow unbounded) | mastery, memory, teacher insights | 2 | REQUIRED BEFORE PRODUCTION (GAP-evidence-header-identity resolved; remaining gap GAP-evidence-idempotency-lifecycle) | high |
| Mastery | 18 LOGIC-mastery capabilities | PRESENT_BUT_PARTIAL (5 source-verified ALGORITHM_PRESENT for practice-mastery) | PROVEN on phase3 mounts; `requireVerifiedSchoolContext` on copilot tutor-turn/actions only | CLEAR: `probabilisticMasteryRepository.ts` writes all 3 Canonical models | PROVEN | UNKNOWN (except daily-objective idempotency PROVEN) | UNKNOWN | UNKNOWN | PARTIALLY_BOUNDED (n<=40 event windows in inference) | growth, recommendations, revision | 2 | REQUIRED BEFORE PRODUCTION | medium |
| Learner Memory | LOGIC-memory-api-copilot-learner-memory (L4) | PROVEN L4 capability; family DUPLICATE_WRITER_CANDIDATE | PROVEN (mount + in-route validation, R8-B L4 source evidence) | `learnerMemoryService.ts` CLEAR for LearnerMemoryItem/LearningEvent | PROVEN | UNKNOWN | DUPLICATE_WRITER_CANDIDATE (studentExitArchiveService also writes family) | UNKNOWN | UNKNOWN | tutor, transparency | 1 | REQUIRED BEFORE PRODUCTION | high |
| Artifacts | 5 LOGIC-artifacts capabilities + 3-model family | PRESENT_BUT_PARTIAL | PROVEN (mount evidence) | SHARED_BY_DESIGN `artifactService.ts`/`artifactStructuredRepository.ts` | PROVEN | PROVEN replay-idempotency algorithm | UNKNOWN | PROVEN replay-detection algorithm | UNKNOWN (input-size bound UNRESOLVED per R8-C) | tutor-state, practice | 1 | REQUIRED BEFORE PRODUCTION | high |
| Media | family `artifacts-media` (MediaAsset writer UNRESOLVED) + ALG-artifacts-* records | PRESENT_BUT_PARTIAL | inherited mounts | MediaAsset writer UNRESOLVED | UNKNOWN | PROVEN dedupe-key algorithm | UNKNOWN | UNKNOWN | UNKNOWN | media stream UI | 1 | REQUIRED BEFORE PRODUCTION | medium |
| Practice | LOGIC-mastery practice/adaptive group + `practice` family | PRESENT_BUT_PARTIAL | PROVEN on phase3/learner mounts | CLEAR: `adaptiveChallengeRepository.ts`, `learningAttemptService.ts` and sibling single-writer services | PROVEN | UNKNOWN | UNKNOWN (dependency cycle nextPractice↔practiceAttempt flagged by R8-B) | UNKNOWN | UNKNOWN | tutor, learner | 1 | REQUIRED BEFORE PRODUCTION | medium |
| Revision | LOGIC-mastery revision capabilities + `revision` family | PRESENT_BUT_PARTIAL | PROVEN on phase3 mounts | writer evidence UNRESOLVED in accepted matrix family | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | learner revision UI | 1 | REQUIRED BEFORE PRODUCTION | low |
| Daily Objectives | LOGIC-mastery phase3 objectives/checks/feed | PRESENT_BUT_PARTIAL (daily-objective settle is source-verified idempotent) | PROVEN on phase3 mounts | CLEAR with naming-drift orphans (`dailyObjectiveCheck*Record` writers, 04 §Canonical Writers) | PROVEN ($transaction not verified but durable idempotency record PROVEN) | PROVEN (ALG-mastery-dailyobjective-idempotency-settle, DIRECT_BEHAVIOR_TEST) | PROVEN exactly-once settle across retries/races (source + test evidence) | PROVEN partial-failure handling in settle algorithm | PARTIALLY_BOUNDED (process-local Map growth flagged; durable record retained) | learner feed, growth | 1 | REQUIRED BEFORE PRODUCTION | high |
| Growth | LOGIC-mastery phase3-growth-page + ALG-mastery-growth-* | PRESENT_BUT_PARTIAL | PROVEN on phase3 mounts | Growth* model writers UNRESOLVED (04 §Canonical Writers) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PARTIALLY_BOUNDED (topic inference bounded n<=40) | learner growth page | 1 | REQUIRED BEFORE PRODUCTION | low |
| Learning Intelligence / Recommendations | LOGIC-school learner-recommendation + adaptive challenge capabilities | PRESENT_BUT_PARTIAL | PROVEN on learner/phase3 mounts | CLEAR: `adaptiveRecommendationProfileRepository.ts` (single writer) | PROVEN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | learner UI, tutor | 1 | REQUIRED BEFORE PRODUCTION | medium |
| Study Planning | LOGIC-mastery phase3-study-plans | PRESENT_BUT_PARTIAL | PROVEN on phase3 mount | writer link UNRESOLVED in accepted artifacts | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | learner planner | 1 | REQUIRED BEFORE PRODUCTION | low |
| Question Bank / Assessment | 26 LOGIC-question-bank capabilities | PRESENT_BUT_PARTIAL; durable mode fail-closed PROVEN | PROVEN (`schoolAuthMiddleware` + `requireVerifiedSchoolContext` on all question-bank mounts, src/index.ts:360-414) | CLEAR for exam-paper persistence, exam-mode services; UNRESOLVED for many Exam*/Marking* models (writer TEST_PROOF only or none) | PROVEN in prisma mode; IN-MEMORY stores exist but are gated fail-closed; R8-F: Package 11 result-release HTTP mount defaults to durable Prisma composition (InMemory retained for explicit test injection only); other Exam*/Marking*/question-bank writer unknowns REMAIN | PROVEN idempotency records for exam delivery/marking (models exist); behavior UNKNOWN | UNKNOWN | PROVEN SafeResponseEnvelope in routes; marking batch failure isolation algorithm | PARTIALLY_BOUNDED (batch size POTENTIALLY_UNBOUNDED per R8-C) | teacher, student, parent projections | 4 | REQUIRED BEFORE PRODUCTION | high |
| Safeguarding / Privacy / Governance | 7 LOGIC-safety capabilities | PRESENT_BUT_PARTIAL | PROVEN on governance mounts; role allow-lists in evidence command service | governance audit writers UNRESOLVED (TEST_PROOF only) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | governance UI, teacher, learner | 2 | REQUIRED BEFORE PRODUCTION | medium |
| Teacher / School Administration | 12 LOGIC-school capabilities | PRESENT_BUT_PARTIAL | PROVEN on most mounts; role checks UNRESOLVED statically for most groups | CLEAR: `learnerPreferenceFeedbackRepository.ts`; roster sync services | PROVEN | UNKNOWN | UNKNOWN | UNKNOWN | POTENTIALLY_UNBOUNDED roster payloads (R8-C flag) | teacher/admin UI | 2 | REQUIRED BEFORE PRODUCTION | medium |
| Parent-Facing Backend Data | capabilities inside question-bank result-release + readiness-board parent projections | PRESENT_BUT_PARTIAL | PROVEN on result-release mount; PARENT_FORBIDDEN projection guard PROVEN (04 Runtime State) | CLEAR: `prismaResultReleaseRepositories.ts` writes ParentSafeResultSummaryRecord | PROVEN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | parent UI | 0 | — | medium |
| Voice / External Integrations | 6 LOGIC-voice capabilities | PRESENT_BUT_PARTIAL (voice routes L4 source-verified) | PROVEN (`voice.ts:36` role check, R8-B L4 evidence) | `voiceLedgerService.ts` PROVEN transactional | PROVEN | PROVEN (FOR UPDATE session lock; transactional settle) | PROVEN (row-lock serialization) | UNKNOWN | PARTIALLY_BOUNDED (ledger tail take:10; grants bounded per student) | voice client | 1 | REQUIRED BEFORE PRODUCTION | high |
| Operations / Reliability / Observability | 23 LOGIC-operations capabilities | PRESENT_BUT_PARTIAL | mixed (several ops mounts carry no middleware by design) | CLEAR: `task028ExpansionExecutionRepository.ts`, `latencyService.ts`; Ops* models writer TEST_PROOF only | PROVEN for expansion/canary repos | PROVEN AI retry/backoff + circuit breaker algorithms | UNKNOWN | PROVEN state machines for canary/rollout | UNKNOWN | ops dashboards | 2 | REQUIRED BEFORE PRODUCTION | medium |

## Capability Accounting

All 110 R8-B entries remain represented; none upgraded, downgraded, or relabeled.

- Confirmed R8-B logic capabilities accounted: **103 / 103** (mapped to domains in the Executive Domain Summary via the section mapping in `05_BACKEND_LOGIC_REGISTER.md` §Logic Taxonomy: Artifacts/Media 5, Auth 1 middleware layer, Curriculum/Assessment/Question Bank 26, Learning Core 6, Mastery/Objectives/Practice/Revision 18, Memory/Evidence 6, Operations 23, Safety/Privacy/Governance 7, Teacher/School/Admin 12, Voice/External 6).
- Unresolved R8-B candidates represented: **7 / 7** (`LOGIC-memory-api-copilot-evidence`, `LOGIC-question-bank-api-question-bank-exam-papers`, `-marking`, `-marking-invocation`, `-recovery-case-adjudication`, `-recovery-execution-readiness-board`, `-recovery-lifecycle-closure`). R8-D targeted inspection resolved their mount/auth frame (all seven mount under `schoolAuthMiddleware` + `requireVerifiedSchoolContext` per `src/index.ts:380-503`; marking/exam-papers routers are factory routers fed by the fail-closed repository composition) while their core decision logic remains UNKNOWN — consistent with R8-B's unresolved status.
- Algorithm coverage states from R8-C (18 ALGORITHM_PRESENT / 4 NO_DISTINCT_ALGORITHM / 3 ALGORITHM_DELEGATED / 85 UNRESOLVED) are carried as inputs; no state was re-decided.

### Deep-inspected capabilities in R8-D

Per §10, deep inspection was limited to unresolved/high-risk cases:

1. The 7 unresolved route-group candidates (mount/auth frame resolved above; core logic UNKNOWN preserved).
2. Question-bank/marking/exam-paper repository-mode chain (resolves a production-relevant ambiguity: whether in-memory stores could serve production traffic — they cannot, resolver throws, SOURCE_INSPECTION `questionBankRepositoryMode.ts:33-35`).
3. Daily-objective settlement chain (retry/idempotency dimension for a P0 algorithm).
4. Voice ledger chain (concurrency dimension for a P0 algorithm).
5. Learning-evidence route + command-service chain (authentication/authorization dimension for a high-risk domain).

All other capabilities were assessed from accepted R8-B/R8-C evidence without re-inspection, per §10.

## Identity / Authentication / School Context

- ENTRY/TRIGGER: every HTTP mount in `src/index.ts` (167 mounts, R8-A). REQUEST VALIDATION: route-body validation proven only for L4 capabilities and tutor validation libs; otherwise UNKNOWN. AUTHENTICATION: `schoolAuthMiddleware` mount-globally (R8A_STRUCTURAL); source-verified JWT claim extraction `src/middleware/schoolAuthMiddleware.ts:18-77` (ALG-safety-task020-auth-jwt-claim-extract). AUTHORIZATION: role checks proven only via `requireRole`/`resolveRequestRole` sites (R8-B Authentication section); elsewhere UNRESOLVED. TENANT ISOLATION: `requireVerifiedSchoolContext` on learner/session/evidence/teacher/governance/readiness mounts (R8A_STRUCTURAL).
- CANONICAL LOGIC/DATA OWNER: middleware files `src/middleware/schoolAuthMiddleware.ts`, `src/lib/rbac.ts:44-60` (SOURCE_INSPECTION cited in R8-B). No durable state owned.
- PERSISTENCE/RESTART/RECOVERY: NOT_APPLICABLE — stateless middleware gate.
- RETRY/IDEMPOTENCY: NOT_APPLICABLE. CONCURRENCY: UNKNOWN (JWT verification assumed standard; no runtime proof). PARTIAL FAILURE: fail-closed behavior proven in source-verified paths (401/403 with stable error shapes). DEPENDENCY FAILURE: JWT/Redis dependency behavior UNKNOWN at middleware level; `src/lib/redis.ts:16` degrades without crashing (SOURCE_INSPECTION).
- LONG-HISTORY: NOT_APPLICABLE. OBSERVABILITY: UNKNOWN. EXTERNAL/AI BOUNDARY: NOT_APPLICABLE.
- CONSUMERS: all routes. HTTP SURFACE: none of its own. INTERNAL-ONLY: yes.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL (authorization role checks unproven for most capability groups — R8-B law, not R8-D inference).
- KNOWN GAPS: GAP-identity-rolecheck-coverage, GAP-identity-mountless-authz.
- EVIDENCE: R8-B Authentication/Authorization section; ALG-safety-task020-auth-jwt-claim-extract (P0). CONFIDENCE: high.

## Curriculum / Knowledge Graph

- ENTRY/TRIGGER: `/api/learner#adaptiveChallengeRoutes`, `/api/phase3/daily-learning-feed`, `/api/phase3/objectives`, content-governance and task022 curriculum-governance mounts (04 family row). VALIDATION: UNKNOWN outside L4 capabilities. AUTH/TENANT: PROVEN on mounts.
- CANONICAL LOGIC OWNER: content-governance route (L4, R8-B source-verified `src/routes/contentGovernance.ts:25-210`); difficulty calibration via `src/services/difficultyCalibrationRepository.ts`. CANONICAL DATA OWNER: `DifficultyCalibrationRecord` CLEAR; `Curriculum*Record`, `ContentItemRecord`, `ContentReviewRecord`, `AnswerKeyVersionRecord` writers UNRESOLVED (TEST_PROOF only) — 04 §Canonical Writers. This is the single largest writer-evidence hole in the backend.
- STATE WRITTEN: difficulty calibration upserts (PROVEN). Curriculum content writes: UNKNOWN (no production writer proven).
- PERSISTENCE: PostgreSQL via Prisma where writers exist; curriculum truth itself DURABILITY=UNKNOWN. RESTART/RECOVERY: UNKNOWN. RETRY: UNKNOWN. CONCURRENCY: UNKNOWN. PARTIAL FAILURE: content governance persistence-failure fails closed per accepted contract tests (TEST_PROOF, supporting only).
- LONG-HISTORY: curriculum reads via `$queryRawUnsafe` in `src/services/artifactCurriculumReferenceService.ts:80-104` and `src/routes/ai.ts` — POTENTIALLY_UNBOUNDED unless bounded in SQL (UNKNOWN). DATA_LIFECYCLE: ABSENT (no retention/archive evidence).
- CONSUMERS: learner feed, tutor context, artifact curriculum references, governance UI. HTTP: mounts above. INTERNAL: difficulty calibration, curriculum reference resolution.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-curriculum-writer-ownership, GAP-curriculum-lifecycle-unbounded.
- EVIDENCE: 04 family + canonical writers; 05 LOGIC-question-bank-api-content-governance (L4); 06 ALG records. CONFIDENCE: medium.

## Student Learning Sessions

- ENTRY/TRIGGER: `/api/copilot#aiRoutes` (chat), `/api/copilot/learning-sessions`, `/api/voice` session usage; learner session routes. VALIDATION: chat pipeline validation services present (`src/services/chatPipelineValidation.ts`, DEPENDENCY_GRAPH). AUTH/TENANT: PROVEN on mounts (04 route surfaces + 05).
- CANONICAL LOGIC OWNER: `src/routes/ai/ai-chat.routes.ts` (ChatSession canonical writer SHARED_BY_DESIGN with proven dependency-edge coordination); CANONICAL DATA OWNER: family `chat-session` — STATUS DUPLICATE_WRITER_CANDIDATE. `ChatMessage` has DUPLICATE_WRITER_CANDIDATE (`src/routes/ai.ts` 10 write rows vs `ai-chat.routes.ts`, `aiService.ts`) with no proven coordination boundary.
- STATE READ/WRITTEN: sessions, messages, session events, tutor state, archives (04 family, 9 models). PERSISTENCE: PROVEN PostgreSQL via Prisma.
- RESTART: PROVEN durable sessions survive restart. RETRY/IDEMPOTENCY: UNKNOWN. CONCURRENCY: UNKNOWN under simultaneous writes from duplicated writer files. PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: Redis optional with cooldown (SOURCE_INSPECTION `src/lib/redis.ts`); AI provider failure handled at gateway layer (ALGORITHM_DELEGATED live-chat, 06).
- LONG-HISTORY: archive services exist (`conversationArchiveService.ts`, `studentExitArchiveService.ts`) → PARTIALLY_BOUNDED; DATA_LIFECYCLE PRESENT for archives, UNKNOWN for raw messages.
- CONSUMERS: tutor client, growth reader, voice ledger. HTTP: mounts above. INTERNAL: session state repository.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-sessions-chatmessage-writer-duplication, GAP-sessions-retry-unknown.
- EVIDENCE: 04 chat-session family; 05 LOGIC-learning-core + voice; 06 ALG-voice records. CONFIDENCE: medium.

## Tutor State / Learning Core

- ENTRY/TRIGGER: 6 LOGIC-learning-core capabilities: `/api/copilot` (handoff), `/api/copilot/live-chat`, `/api/copilot/tutor-actions`, `/api/copilot/tutor-state` (2 mounts), `/api/copilot/tutor-turn`, `/api/tutor` (05). VALIDATION: `src/lib/tutorActionValidation.ts`, `src/lib/tutorTurnRuntimeValidation.ts` imported by routes (DEPENDENCY_GRAPH); deeper schemas UNKNOWN. AUTH: PROVEN on live-chat/tutor-state/tutor-actions/tutor-turn/tutor mounts; **`/api/copilot` handoff mount has NO middleware recorded** (05 LOGIC-learning-core-api-copilot-copilothandoffroutes, src/index.ts:197).
- CANONICAL LOGIC OWNER: per-capability services (tutorAction*, tutorTurnRuntime*, aiGateway). CANONICAL DATA OWNER: UNRESOLVED for 5 of 6; tutor-state writes `LearningArtifact`/`LearningArtifactBlock` (AMBIGUOUS family link).
- PERSISTENCE: UNKNOWN for handoff/actions/turn; PROVEN artifact link for tutor-state. RESTART: UNKNOWN. RETRY: UNKNOWN. CONCURRENCY: UNKNOWN (R8-B notes accepted R1–R7 architecture governs canonical paths, referenced not re-proven). PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: AI provider via aiGateway (ALGORITHM_DELEGATED; generation policy gate P0 algorithm proven pre-provider).
- LONG-HISTORY: NOT_APPLICABLE (stateless decision layer mostly). OBSERVABILITY: UNRESOLVED per R8-B.
- CONSUMERS: copilot client. HTTP: mounts above. INTERNAL: context builders, privacy guards, access policies.
- EXTERNAL / AI-LANE DECISION BOUNDARY: backend owns validated request, identity, context assembly, policy gate, safe-response assembly; model reasoning is delegated to the AI lane (06 ALGORITHM_DELEGATED states). Backend contract evaluated only here.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-tutorcore-handoff-unauthenticated, GAP-tutorcore-persistence-unresolved.
- EVIDENCE: 05 Learning Core section (all 6 capabilities); 06 coverage rows; SOURCE_INSPECTION `src/index.ts:197` via 05 citation. CONFIDENCE: medium.

## Learning Evidence

- ENTRY/TRIGGER: `/api/copilot/evidence` (event store, mount src/index.ts:545), `/api/copilot/learning-evidence` (safe evidence), `/api/question-bank/result-learning-evidence`, result-report-card evidence links; LOGIC-memory capabilities evidence/learning-evidence/result-learning-evidence (05). VALIDATION: evidence command contracts + privacy guard (SOURCE_INSPECTION). AUTH: `schoolAuthMiddleware` + `requireVerifiedSchoolContext` (SOURCE_INSPECTION src/index.ts:540-545).
- AUTHORIZATION DEEP-PROOF (R8-D targeted inspection): `learningEvidenceCommandService.ts:202` create allowed for `['student','teacher','school_admin','internal_operator']`; `:206` student may only act on own learnerId; `:320,363,372` commit/approve/restricted operations restricted to `['teacher','school_admin','internal_operator']`. This is in-service role enforcement — the allow-lists themselves are PROVEN. HOWEVER, the role identity feeding these allow-lists comes from an unsafe route-level source: the router builds actor role from the caller-controlled `x-actor-role` header (`learningEvidenceRoutes.ts:11-17`) rather than the verified `req.user.role` assigned by `schoolAuthMiddleware` — a proven authorization/identity-provenance defect (GAP-evidence-header-identity, REQUIRED NOW).
- TENANT ISOLATION: actor context built from schoolId header/session with privacy guard; school-scoped repository access (route body + guard, SOURCE_INSPECTION). Header-trusted identity fields (`x-actor-id`, `x-actor-role` fallbacks) are recorded as a gap below.
- CANONICAL LOGIC OWNER: `learningEvidenceCommandService`/`ProjectionService`/`SeedService` inside `src/domains/learning-evidence/`. CANONICAL DATA OWNER: `prismaLearningEvidenceEventStoreRepository.ts` CLEAR single writer for 8 of 19 family models (04 §Canonical Writers: stream, event, candidate projection, committed projection, checkpoint, idempotency).
- STATE: append event stream + projections + idempotency records + checkpoints. PERSISTENCE: PROVEN (`$transaction` in repository, SOURCE_INSPECTION line 23). RESTART: PROVEN — event-sourced with checkpoints; projections rebuildable from stream (model set proves design; runtime proof belongs to R8-G).
- RETRY/IDEMPOTENCY: PROVEN — `LearningEvidenceIdempotency` + `ResultLearningEvidenceIdempotencyRecord` models with single canonical writers (04). CONCURRENCY: PROVEN transactional append. PARTIAL FAILURE: transaction boundary around append+project (SOURCE_INSPECTION). DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: event stream and idempotency records have no retention/compaction evidence → DATA_LIFECYCLE ABSENT; reads bounded by capability (projections by checkpoint) → PARTIALLY_BOUNDED.
- CONSUMERS: mastery (probabilisticMasteryRepository), learner memory, teacher insights, result bridges. HTTP: mounts above. INTERNAL: privacy guard, seed service.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-evidence-header-identity, GAP-evidence-idempotency-lifecycle.
- EVIDENCE: 04 learning-evidence family + canonical writers; 05 LOGIC-memory rows; SOURCE_INSPECTION cited above. CONFIDENCE: high.

## Mastery

- ENTRY/TRIGGER: 18 LOGIC-mastery capabilities across `/api/copilot/*` (practice-mastery L4, adaptive challenges/recommendations, exam/quiz/focus/revision/teach-back modes, growth, remediation) and `/api/phase3/*` (objectives, checks, feed, study plans, growth page, confidence recovery) (05). VALIDATION: PROVEN for practice-mastery (L4 source evidence); UNKNOWN elsewhere. AUTH/TENANT: PROVEN on phase3 mounts; copilot practice-mastery mount per L4 evidence; role scope UNRESOLVED for most groups (R8-B).
- CANONICAL LOGIC OWNER: practice-mastery algorithm cluster (5 source-verified records: evidence ladder, score thresholds, spaced review, next-practice priority, score compute — all P0/P1 with DIRECT_BEHAVIOR_TEST); daily-objective settle (ALG-mastery-dailyobjective-idempotency-settle, P0, DIRECT_BEHAVIOR_TEST); growth inference (bounded n<=40).
- CANONICAL DATA OWNER: `probabilisticMasteryRepository.ts` — single CLEAR writer for `CanonicalMasteryStateRecord`, `CanonicalMasteryChangeRecord`, `CanonicalMasteryEvidenceApplicationRecord` (04). Growth* model writers UNRESOLVED (04 §Canonical Writers: GrowthMasteryTrendState, GrowthMistakePatternState, GrowthProofRecord, GrowthRecommendationState, GrowthWeakTopicState — no writer group).
- STATE READ/Written: mastery states + change records from evidence application; growth states UNKNOWN writers.
- PERSISTENCE: PROVEN for canonical mastery. RESTART: PROVEN durable. RETRY: PROVEN for daily-objective settlement (idempotency record + service logic); UNKNOWN for mastery mutation from result bridges. CONCURRENCY: UNKNOWN for canonical state updates (no lock/version evidence in accepted artifacts). PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: mastery inference bounded (n<=40 events, R8-C); spaced-review interval clamped [1,90] (BOUNDED). Growth trend states accumulation over years: UNKNOWN lifecycle.
- CONSUMERS: growth page, recommendations, revision, study plans, tutor next-action. HTTP: mounts above. INTERNAL: mastery aggregation, weak-topic detection, spaced review planner.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-mastery-canonical-concurrency, GAP-mastery-growth-writers.
- EVIDENCE: 04 mastery family + canonical writers; 05 Mastery section; 06 algorithm records. CONFIDENCE: medium.

## Learner Memory

- ENTRY/TRIGGER: `/api/copilot/learner-memory` (L4), `/api/copilot/practice-mastery` memory linkage, learner-transparency (05). VALIDATION: L4 source-verified route validation (`src/routes/learnerMemory.ts:53-112`). AUTH/TENANT: PROVEN (L4 evidence: middleware + in-route checks + service scoping).
- CANONICAL LOGIC/DATA OWNER: `learnerMemoryService.ts` CLEAR writer for `LearnerMemoryItem` + `LearningEvent`; `safeMemorySummaryService.ts` for `SafeMemorySummary`; `GlobalMemory` writer UNRESOLVED (04). Family STATUS DUPLICATE_WRITER_CANDIDATE (studentExitArchiveService additional writer).
- STATE: memory items, learning events, safe summaries. PERSISTENCE: PROVEN. RESTART: PROVEN durable. RETRY/IDEMPOTENCY: UNKNOWN. CONCURRENCY: UNKNOWN. PARTIAL FAILURE: L4 evidence includes failure/result path for capability (R8-B). DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: memory items accumulate per learner; no retention evidence → UNKNOWN lifecycle.
- CONSUMERS: tutor context, growth reader, transparency. HTTP: mounts above. INTERNAL: memory summarization.
- CURRENT COMPLETENESS: PROVEN at capability level (L4), PRESENT_BUT_PARTIAL at family level. KNOWN GAPS: GAP-memory-family-writer-duplication.
- EVIDENCE: R8-B L4 source-evidence index (`learnerMemory.ts`, `learnerMemoryService.ts:503-767`); 04 learner-memory family. CONFIDENCE: high.

## Artifacts

- ENTRY/TRIGGER: `/api/copilot/artifacts` (L4-capable group per 06 ALGORITHM_PRESENT with 6 algorithm records), `/api/copilot/tutor-state` writes artifacts. VALIDATION: fingerprint/replay logic implies content hashing upstream; input-size bound UNRESOLVED (06 ALG-artifacts-artifacts-content-fingerprint). AUTH/TENANT: PROVEN on mounts.
- CANONICAL LOGIC/DATA OWNER: `artifactService.ts` + `artifactStructuredRepository.ts` SHARED_BY_DESIGN (proven dependency edge, 04). `MediaAsset` writer UNRESOLVED (belongs to Media below but same family).
- STATE: artifacts + blocks. PERSISTENCE: PROVEN. RESTART: PROVEN durable. RETRY/IDEMPOTENCY: PROVEN — replay idempotency (ALG-artifacts-artifacts-replay-idempotency, DIRECT_BEHAVIOR_TEST, P0): same-content re-parse does not disturb stored truth. CONCURRENCY: UNKNOWN. PARTIAL FAILURE: replay detection covers duplicate ingestion; other failure modes UNKNOWN.
- LONG-HISTORY: input size bound UNRESOLVED → UNKNOWN; corpus scan bound lives with caller (06) → UNKNOWN.
- CONSUMERS: tutor-state, practice resolver, study stream. HTTP: `/api/copilot/artifacts`. INTERNAL: structured block repository, curriculum reference service (raw SQL reads flagged).
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-artifacts-input-bound-unresolved.
- EVIDENCE: 04 artifacts-media family + writer verdicts; 06 artifacts algorithm records; R8-B L4 index for artifacts group. CONFIDENCE: high.

## Media

- ENTRY/TRIGGER: media asset ingestion + `/api/copilot#videoAwarePracticeRoutes|videoLearningSessionRoutes|videoRecommendationRoutes` + `/api/video-learning-analytics` (04 family routes). VALIDATION: UNKNOWN. AUTH/TENANT: inherited from mounting (PROVEN on copilot mounts).
- CANONICAL LOGIC OWNER: `mediaAssetService.ts` (dedupe key, 06), `media-stream/scoring.ts` (rank/recency), `externalVideoCandidateService.ts` (external dedupe), `videoEffectivenessScoringService.ts` (effectiveness gate). CANONICAL DATA OWNER: `MediaAsset` writer UNRESOLVED in R8-A evidence (04 §Canonical Writers) — production ingestion path UNKNOWN.
- PERSISTENCE: UNKNOWN (no writer proven). RESTART: UNKNOWN. RETRY: PROVEN dedupe-key intent (re-ingestion resolves to one row) but writer unknown → PRESENT_BUT_PARTIAL. CONCURRENCY: UNKNOWN. PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: external video providers involved (NETWORK_COST+PROVIDER_COST flags, 06).
- LONG-HISTORY: module-local cache in external candidate service flagged MEMORY_HOTSPOT_CANDIDATE for R8-E (06) — process-local only.
- CONSUMERS: study/creative selection, recommendations, analytics. HTTP: video/analytics mounts. INTERNAL: scoring, dedupe.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-media-asset-writer-unresolved.
- EVIDENCE: 04 artifacts-media family (MediaAsset row); 06 ALG-artifacts-* records. CONFIDENCE: medium.

## Practice

- ENTRY/TRIGGER: LOGIC-mastery adaptive-challenge/quiz/exam/focus modes + `/api/learner#adaptiveChallengeRoutes` + `practice` family routes (04/05). VALIDATION: UNKNOWN outside L4s. AUTH/TENANT: PROVEN on mounts.
- CANONICAL LOGIC OWNER: `nextPracticeService.ts` (next-practice priority, P0, DIRECT_BEHAVIOR_TEST), `adaptiveChallengeRepository.ts` (CLEAR writer). CANONICAL DATA OWNER: single-writer CLEAR services for `AdaptiveChallengeRecord`, `LearningModeAttempt`, `LearningModeSignal`, `LearningModeHintEvent`, `FocusMode*` records (04).
- PERSISTENCE: PROVEN. RESTART: PROVEN durable. RETRY/IDEMPOTENCY: UNKNOWN. CONCURRENCY: UNKNOWN; R8-B flagged dependency cycle `nextPracticeService.ts ↔ practiceAttemptService.ts` (05) — control-flow relevance UNKNOWN statically. PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: attempt windows bounded in next-practice (n<=10, 06) → PARTIALLY_BOUNDED for decisioning; raw attempt accumulation UNKNOWN.
- CONSUMERS: tutor, learner, mastery. HTTP: mode routes. INTERNAL: hint tracking, signals.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-practice-cycle-concurrency-unknown.
- EVIDENCE: 04 practice family + canonical writers; 05 cycle note; 06 ALG-mastery-practicemastery-next-practice-priority. CONFIDENCE: medium.

## Revision

- ENTRY/TRIGGER: `/api/phase3/living-revision` + revision family models (04 `revision` family, 05 LOGIC-mastery-api-phase3-living-revision UNRESOLVED algorithm coverage). VALIDATION: UNKNOWN. AUTH/TENANT: PROVEN on phase3 mount.
- CANONICAL LOGIC/DATA OWNER: accepted 04 family row for revision records writer verdicts UNRESOLVED; revision learning service flagged in dependency cycle with learningEffectivenessService (05). R8-D targeted inspection of revision raw-SQL usage found it confined to TEST_PROOF files (`src/r5-canonical-closure.test.ts`, `src/r5-revision-runtime-completion.test.ts`) — no production raw-SQL writer proven.
- PERSISTENCE: PostgreSQL via Prisma where writers exist; production writer set UNKNOWN → DURABILITY UNKNOWN. RESTART/RETRY/CONCURRENCY/FAILURE: UNKNOWN.
- LONG-HISTORY: revision items per learner accumulate; lifecycle UNKNOWN.
- CONSUMERS: learner revision UI, study planning. HTTP: living-revision route. INTERNAL: revision learning service.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL with several UNKNOWN dimensions (per §8, UNKNOWN preserved, not ABSENT). KNOWN GAPS: GAP-revision-writer-durability-unknown.
- EVIDENCE: 04 revision family; 05 LOGIC-mastery-api-phase3-living-revision; 05 dependency cycle. CONFIDENCE: low.

## Daily Objectives

- ENTRY/TRIGGER: `/api/phase3/objectives`, `/api/phase3/daily-objective-checks`, `/api/phase3/daily-learning-feed` (04/05). VALIDATION: UNKNOWN at route schema level; settle path internally validated (P0 algorithm). AUTH/TENANT: PROVEN on phase3 mounts.
- CANONICAL LOGIC OWNER: `phase3DailyObjectiveCheckCompletionService.ts` — exactly-once settlement across retries, races and partial failures (ALG-mastery-dailyobjective-idempotency-settle, O(1) bounded, DIRECT_BEHAVIOR_TEST). CANONICAL DATA OWNER: `phase3DailyObjectiveCheckRepository.ts` CLEAR writer with naming-drift orphans (`dailyObjectiveCheck*Record` keys match no canonical Prisma model — 04 flags "carried as an orphan for later review").
- RETRY/IDEMPOTENCY (R8-D targeted inspection): durable idempotency via `dailyObjectiveCheckCompletionIdempotencyRecord` upsert/update (`phase3DailyObjectiveCheckCompletionService.ts:63,114,138`) with a process-local `Map` fast path (`:40`) gated by `isTestMapsMode()` (`:12,60,82`) — PROVEN dual-mode. CONCURRENCY: PROVEN for settlement (idempotency upsert + test evidence). PARTIAL FAILURE: PROVEN within settle algorithm.
- PERSISTENCE: PROVEN durable. RESTART: PROVEN (durable idempotency record survives; process Map rebuilds from DB).
- LONG-HISTORY: durable idempotency rows retained with no compaction evidence → DATA_LIFECYCLE ABSENT for idempotency records; feed input POTENTIALLY_UNBOUNDED (06 flag) → PARTIALLY_BOUNDED. Process Map growth across sessions flagged MEMORY_HOTSPOT_CANDIDATE (R8-E).
- CONSUMERS: learner feed, growth, evidence. HTTP: phase3 routes. INTERNAL: objective repository.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-dailyobjectives-idempotency-lifecycle, GAP-dailyobjectives-naming-drift-orphans.
- EVIDENCE: 04 canonical-writer rows + orphan notes; 06 P0 algorithm; SOURCE_INSPECTION lines cited. CONFIDENCE: high.

## Growth

- ENTRY/TRIGGER: `/api/phase3/growth-page`, `/api/copilot/growth`, `/api/video-learning-analytics` effectiveness scoring (05/06). VALIDATION: UNKNOWN. AUTH/TENANT: PROVEN on phase3 mount; copilot growth mount auth per mount evidence.
- CANONICAL LOGIC OWNER: `masteryInferenceService.ts` (topic inference from bounded signals, P0), `videoEffectivenessScoringService.ts` (effectiveness gate, P1, DIRECT_BEHAVIOR_TEST). CANONICAL DATA OWNER: ALL `Growth*` model writers UNRESOLVED (04: GrowthMasteryTrendState, GrowthMistakePatternState, GrowthProofRecord, GrowthRecommendationState, GrowthWeakTopicState) — growth truth durability is UNKNOWN.
- PERSISTENCE: UNKNOWN. RESTART: UNKNOWN. RETRY/CONCURRENCY/FAILURE: UNKNOWN. DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: inference bounded (n<=40 events, fixed vocabulary, 06) → STATICALLY_BOUNDED decisioning; underlying trend history UNKNOWN.
- CONSUMERS: learner growth page, recommendations. HTTP: mounts above. INTERNAL: growth data reader.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL with UNKNOWN durability. KNOWN GAPS: GAP-mastery-growth-writers (shared with Mastery domain).
- EVIDENCE: 04 canonical writers; 06 growth algorithm records; 05 phase3-growth-page row. CONFIDENCE: low.

## Learning Intelligence / Recommendations

- ENTRY/TRIGGER: `/api/learner#learnerrecommendationroutes` (priority policy algorithm present), `/api/copilot/adaptive-recommendations` (tuning routes), `/api/copilot/adaptive-challenges`, remediation (05). VALIDATION: UNKNOWN. AUTH/TENANT: PROVEN on learner + adaptive-recommendations mounts (school context SOURCE_INSPECTION src/index.ts:552-556 for adjacent mounts; mount evidence per 05).
- CANONICAL LOGIC OWNER: `learnerTransparencyContracts.ts:172-183` priority policy (bounded 10-type vocabulary, INDIRECT_INTEGRATION_TEST); adaptive recommendation profile services. CANONICAL DATA OWNER: `adaptiveRecommendationProfileRepository.ts` CLEAR single writer (`deleteMany/upsert` — replace-style semantics, 04).
- PERSISTENCE: PROVEN. RESTART: PROVEN. RETRY: UNKNOWN. CONCURRENCY: UNKNOWN (upsert semantics suggest idempotent replace; not proven). PARTIAL FAILURE: UNKNOWN. DEPENDENCY FAILURE: UNKNOWN.
- LONG-HISTORY: profile-per-learner replace semantics → STATICALLY_BOUNDED.
- CONSUMERS: learner UI, tutor, growth. HTTP: mounts above. INTERNAL: profile services, audit repository (CLEAR writer `personalizationAuditRepository.ts`).
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-intel-recommendation-concurrency-unknown.
- EVIDENCE: 04 canonical writers; 05 LOGIC-school learner recommendation rows; 06 priority-policy record. CONFIDENCE: medium.

## Study Planning

- ENTRY/TRIGGER: `/api/phase3/study-plans` (05; appears in evidence + mastery family route surfaces). VALIDATION: UNKNOWN. AUTH/TENANT: PROVEN on phase3 mount (family route surface 04).
- CANONICAL LOGIC/DATA OWNER: UNRESOLVED in accepted artifacts — study-plan writer/link not proven; algorithm coverage UNRESOLVED (06 LOGIC-mastery-api-phase3-study-plans).
- PERSISTENCE/RESTART/RETRY/CONCURRENCY/FAILURE/LONG-HISTORY: UNKNOWN (all dimensions; per §7/§8 these are recorded UNKNOWN, not ABSENT).
- CONSUMERS: learner planner UI (consumer inferred from route surface; product consumer UNKNOWN).
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL; DOMAIN READINESS = UNKNOWN. KNOWN GAPS: GAP-studyplanning-ownership-unknown.
- EVIDENCE: 04 evidence/mastery family route surfaces; 06 coverage row. CONFIDENCE: low.

## Question Bank / Assessment

- ENTRY/TRIGGER: 26 LOGIC-question-bank capabilities — question bank, exam blueprints, exam papers, exam delivery, marking, marking invocation, result governance/delivery/release/recovery/follow-up/report-cards, recovery case triage/adjudication/readiness-board/lifecycle-closure/outcome chains, curriculum governance (05). VALIDATION: SafeResponseEnvelope pattern in composed routers (SOURCE_INSPECTION `src/routes/marking.ts:26-40`, `src/routes/examPaper.ts:21-30`).
- AUTH/TENANT: PROVEN — every `/api/question-bank/*` mount carries `schoolAuthMiddleware` + `requireVerifiedSchoolContext` (SOURCE_INSPECTION `src/index.ts:360-414`); includes the 7 unresolved R8-B candidates' mounts.
- REPOSITORY MODE (R8-D targeted inspection, key completeness fact): `questionBankRuntimeComposition.ts` builds either in-memory Maps or Prisma repositories via `questionBankRepositoryModeResolver.resolve()` (`questionBankRepositoryMode.ts:7-64`): production without `QUESTION_BANK_REPOSITORY_MODE=prisma` **throws at startup**; memory mode outside test additionally requires `QUESTION_BANK_ALLOW_IN_MEMORY=true`. Fail-closed — in-memory stores cannot silently serve production. In-memory stores are therefore SHARED_BY_DESIGN test/dev doubles (per R8-B classification), with restart loss bounded to non-production modes.
- CANONICAL DATA OWNER: CLEAR — `prismaExamPaperAssemblyPersistence.ts` (5 exam-paper models), exam-mode/focus-mode single-writer services, `prismaResultReleaseRepositories.ts` (ParentSafeResultSummaryRecord). UNRESOLVED — the majority of Exam*/Marking* canonical models have no production writer group in R8-A evidence (04 §Canonical Writers: ExamAttemptRecord, ExamDeliverySessionRecord, MarkingRunRecord, MarkingBatchRecord, Marking* version/link records, etc.). Marking repositories have prisma implementations (`prismaMarkingRepositories.ts`) whose wiring is mode-gated; writer-row absence means access may occur via alternate paths — recorded UNKNOWN, not ABSENT.
- PERSISTENCE: PROVEN in prisma mode (composition + CLEAR writers). RESTART: PROVEN durable in prisma mode. RETRY/IDEMPOTENCY: idempotency models exist (ExamDeliveryIdempotencyRecord, MarkingInvocationIdempotencyRecord, batch-mark-sweep P1 algorithm isolates failures); end-to-end retry semantics UNKNOWN. CONCURRENCY: UNKNOWN (no lock/version evidence). PARTIAL FAILURE: PROVEN batch item failure isolation (ALG-questionbank-markinginvocation-batch-mark-sweep, DIRECT_BEHAVIOR_TEST); batch size POTENTIALLY_UNBOUNDED (R8-E flag).
- LONG-HISTORY: attempt/timing/result accumulation over terms with no retention evidence → POTENTIALLY_UNBOUNDED; list endpoints use shared pagination cursor algorithm (ALG-operations-shared-pagination-cursor, limit ≤ 100) where wired.
- CONSUMERS: teacher queues, student result views, parent safe summaries, projections with role-based forbidden-field guards (`assessmentProjectionGuard.ts` STUDENT/PARENT/TEACHER/SYSTEM_MARKING/ADMIN FORBIDDEN sets — 04 Runtime State). HTTP: question-bank mounts. INTERNAL: marking services, moderation, projection safety services.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-questionbank-model-writers, GAP-questionbank-concurrency-locks, GAP-questionbank-marking-retry-e2e, GAP-questionbank-longhistory-lifecycle.
- EVIDENCE: 04 question-bank family + canonical writers + Runtime State guards; 05 question-bank section; 06 marking/batch/pagination records; SOURCE_INSPECTION index.ts + composition + resolver. CONFIDENCE: high (for mount/auth/mode facts), medium overall.

## Safeguarding / Privacy / Governance

- ENTRY/TRIGGER: 7 LOGIC-safety capabilities — no-ai-bypass, tutor policy evaluate, tutor safe chat, governance/learner privacy governance, task020 security-privacy-governance, task027 pilot expansion governance (05). VALIDATION: policy gate algorithm proven pre-generation (ALG-safety-tutorpolicy-generation-policy-gate P0). AUTH/TENANT: PROVEN on governance mounts; role checks per R8-B only where cited.
- CANONICAL LOGIC OWNER: aiGateway policy services (generation gate, safe response assembler), JWT claim middleware. CANONICAL DATA OWNER: governance audit writers UNRESOLVED (ContentGovernanceAuditRecord, ApprovedSourceRecord, ContentGapRecord, ModerationDecisionRecord — TEST_PROOF only, 04).
- PERSISTENCE: UNKNOWN for audit records. RETRY/CONCURRENCY: UNKNOWN. PARTIAL FAILURE: persistence-failure blocks source approval per accepted contract tests (TEST_PROOF, supporting only) → fail-closed intent PROVEN_AT_TEST_LEVEL.
- LONG-HISTORY: audit/decision records lifecycle UNKNOWN.
- CONSUMERS: governance UI, tutor runtime, teacher. HTTP: safety mounts. INTERNAL: privacy guards (evidence, tutor action), moderation.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-safety-audit-writers, GAP-evidence-header-identity (cross-linked, Learning Evidence domain).
- EVIDENCE: 04 safeguarding-privacy family + canonical writers; 05 safety section; 06 safety algorithm records. CONFIDENCE: medium.

## Teacher / School Administration

- ENTRY/TRIGGER: 12 LOGIC-school capabilities — learning sessions view, learning profile, learner preference/recommendation/session routes, parent support, peer learning, profile routes, school integration, task021 school integration, teacher intervention/report routes (05). VALIDATION: UNKNOWN generally. AUTH/TENANT: PROVEN on mounts; role scope UNRESOLVED for most groups (R8-B law).
- CANONICAL LOGIC OWNER: roster reconciliation (`task021RosterReconciliationService.ts`, RECONCILIATION algorithm preserving learning history) + dry-run conflict scan (P0). CANONICAL DATA OWNER: `learnerPreferenceFeedbackRepository.ts` CLEAR; school-integration writer set per 04 family row.
- PERSISTENCE: PROVEN for roster/integration models (04 CLEAR writer groups for Expansion* are ops; school family writers per family row). RESTART: PROVEN durable. RETRY: UNKNOWN. CONCURRENCY: UNKNOWN. PARTIAL FAILURE: dry-run preview before write PROVEN (algorithm). DEPENDENCY FAILURE: external roster source failure behavior UNKNOWN.
- LONG-HISTORY: roster payloads POTENTIALLY_UNBOUNDED (whole-school, R8-C flags on both algorithms) → PARTIALLY_BOUNDED with explicit R8-E batching review.
- CONSUMERS: teacher/admin UI, parent support. HTTP: school/learner/phase3 mounts. INTERNAL: intervention services, reporting.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-school-rolecheck-coverage, GAP-school-roster-unbounded.
- EVIDENCE: 04 school-integration family; 05 school section; 06 roster algorithms. CONFIDENCE: medium.

## Parent-Facing Backend Data

- ENTRY/TRIGGER: result-release parent summary, readiness-board parent safe status drafts, phase3 parent support (05/04). VALIDATION: projection guards. AUTH/TENANT: PROVEN on result-release mount; parent projection guard PARENT_FORBIDDEN field set PROVEN (04 Runtime State: `assessmentProjectionGuard.ts:16`).
- CANONICAL LOGIC/DATA OWNER: `prismaResultReleaseRepositories.ts` CLEAR writer for ParentSafeResultSummaryRecord (5 write rows, 04). PERSISTENCE: PROVEN. RESTART: PROVEN.
- RETRY/CONCURRENCY/FAILURE: UNKNOWN. LONG-HISTORY: summary-per-student replace-style → STATICALLY_BOUNDED (per-row), history UNKNOWN.
- CONSUMERS: parent UI. HTTP: result-release + readiness-board mounts. INTERNAL: safe summary computation.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: none proven (domain has no proven gap beyond shared UNKNOWN dimensions).
- EVIDENCE: 04 canonical writers + Runtime State; 05 result-release/parent-support rows. CONFIDENCE: medium.

## Voice / External Integrations

- ENTRY/TRIGGER: `/api/voice` voiceRoutes (L4), `/api/copilot#aiRoutes` (rate-limited AI/speech endpoints), chat-pipeline, intent, latency, anomalies (05). VALIDATION: L4 source-verified (`src/routes/voice.ts:3-48`). AUTH/TENANT: PROVEN — voice routes carry explicit role check (R8-B L4 evidence `voice.ts:36`).
- CANONICAL LOGIC/DATA OWNER: `voiceLedgerService.ts` — billing/quota ledger with double-entry style updates (ALG-voice-voice-ledger-billing-quota P0).
- RETRY/CONCURRENCY (R8-D targeted inspection): quota/settle operations run in `prisma.$transaction` with `SELECT ... FOR UPDATE` row locks on `StudentProfile` (`:144`) and `VoiceSessionUsage` (`:472`) — concurrent double-spend serialized per student; PROVEN. Balance summary reads bounded (`take: 10` ledger tail, `:227`).
- PARTIAL FAILURE: transactional settle — partial failure rolls back within transaction (PROVEN shape); cross-service failure UNKNOWN. DEPENDENCY FAILURE: provider rate limits at three scopes before provider calls (ALG-operations-reliability-ai-rate-limit-window) + retry/backoff + circuit breaker algorithms (all DIRECT_BEHAVIOR_TEST); express-rate-limit at route layer (ALG-voice-airoutes-express-rate-limit, redis-backed with 60s expiry).
- LONG-HISTORY: ledger bounded per student (grant volume; ledger tail fixed at 10 in summary); full ledger history growth UNKNOWN lifecycle → PARTIALLY_BOUNDED.
- CONSUMERS: voice client, billing/quota surfaces. HTTP: voice + AI mounts. INTERNAL: ledger, quota resolution, bill mode.
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-voice-ledger-fullhistory-lifecycle.
- EVIDENCE: 04 voice family; R8-B L4 voice evidence; 06 voice/reliability records; SOURCE_INSPECTION `voiceLedgerService.ts` lines cited. CONFIDENCE: high.

## Operations / Reliability / Observability

- ENTRY/TRIGGER: 23 LOGIC-operations capabilities — health, readiness, diagnostics, ops-public, deployment readiness (task023/024), pilot readiness/execution (task025–027), controlled expansion execution (task028), staging rehearsal/smoke/canary (task030–036), backend freeze (task040) (05). VALIDATION: UNKNOWN generally. AUTH: PROVEN mount-level per R8-A; several ops mounts intentionally carry no school middleware (R8-B notes health/readiness/ops-public/deployment-readiness/task024 ops mount without middleware) — these are infrastructure surfaces.
- CANONICAL LOGIC/DATA OWNER: `task028ExpansionExecutionRepository.ts` CLEAR single writer for 12 Expansion* models; `latencyService.ts` CLEAR for LatencyThresholdAlert; canary/rollout state machines (STATE_MACHINE algorithm, auditable transitions). Ops* models (OpsIncident, OpsBackupCheck, OpsMetricSnapshot, OpsReport, OpsRestoreDrill) writers TEST_PROOF only — UNRESOLVED.
- PERSISTENCE: PROVEN for expansion/canary/latency; UNKNOWN for Ops* incident/backup records. RESTART: PROVEN durable for expansion; state machines resume from persisted state (model-backed) — UNKNOWN runtime.
- RETRY/IDEMPOTENCY: PROVEN AI runtime reliability cluster (retry/backoff+jitter P0, circuit breaker, rate-limit window; all DIRECT_BEHAVIOR_TEST). Rate-limit window arrays POTENTIALLY_UNBOUNDED under burst (prune only on check — R8-C flag, R8-E). CONCURRENCY: state-machine transitions guarded (role+path); cross-instance concurrency UNKNOWN. PARTIAL FAILURE: canary transition audit; rehearsed rollback records (ExpansionRollbackRecord CLEAR).
- LONG-HISTORY: readiness-board snapshot stores bounded per package design; Ops metric snapshots accumulate UNKNOWN lifecycle.
- OBSERVABILITY: latency service + threshold alerts PROVEN; logger util used across routes (DEPENDENCY_GRAPH e.g. copilotHandoff imports logger); distributed tracing UNKNOWN.
- CONSUMERS: ops dashboards, launch pipeline. HTTP: ops/task mounts. INTERNAL: diagnostics services (multiple task-numbered duplicates flagged by R8-B — DUPLICATION_CANDIDATE, no completeness impact assigned here).
- CURRENT COMPLETENESS: PRESENT_BUT_PARTIAL. KNOWN GAPS: GAP-operations-opsmodel-writers, GAP-operations-ratelimit-window-unbounded.
- EVIDENCE: 04 operations-readiness family + canonical writers; 05 operations section; 06 operations algorithm records. CONFIDENCE: medium.

## Cross-Domain Chains

### LEARNER ACTION → SESSION → EVIDENCE → MASTERY → REVISION / PRACTICE → GROWTH / RECOMMENDATION

- PROVEN links: learner session events persisted (chat-session family, PROVEN writers); evidence captured through learnerMemoryService (`LearningEvent` CLEAR) and learning-evidence event store (PROVEN transactional append + idempotency); mastery updated by `probabilisticMasteryRepository` applying evidence to canonical state (CLEAR writer, `CanonicalMasteryEvidenceApplicationRecord`); practice/revision driven by bounded next-practice + spaced-review algorithms; growth inferred from bounded effect signals; recommendations persisted via adaptive profile upsert.
- MISSING/UNKNOWN links: whether every session path writes evidence (evidence capture from tutor-turn/chat UNKNOWN — no structural writer link); result-bridge → mastery mutation retry semantics UNKNOWN; growth state writers UNRESOLVED → chain terminus durability UNKNOWN.
- EXTERNAL/AI boundaries: tutor generation via aiGateway policy gate (backend-owned side proven: validation, policy, safe assembly).
- PERSISTENCE boundaries: session/evidence/mastery each durable; recommendation profile durable.
- FAILURE boundaries: evidence append transactional; mastery concurrency UNKNOWN (GAP-mastery-canonical-concurrency); downstream consumer retry UNKNOWN.

### ARTIFACT → PARSE / STRUCTURE → LEARNING USE → PRACTICE / EVIDENCE

- PROVEN links: artifact ingestion with content fingerprint + replay idempotency (P0, DIRECT_BEHAVIOR_TEST); structured blocks persisted by `artifactStructuredRepository` (SHARED_BY_DESIGN with artifactService); tutor-state consumes artifacts (05 route→family link).
- MISSING/UNKNOWN links: parse input-size bound UNRESOLVED; artifact→practice resolver (`artifactAwarePracticeResolver`) downstream persistence UNKNOWN; media asset writer UNRESOLVED breaks media-artifact sub-chain durability.
- FAILURE boundaries: replay detection prevents duplicate truth disturbance; parse failure semantics UNKNOWN.

### DAILY OBJECTIVE → CHECK → SETTLEMENT → EVIDENCE → MASTERY → NEXT ACTION

- PROVEN links: check sessions persisted by objective repository (CLEAR with orphan naming drift); settlement exactly-once via durable idempotency (P0 algorithm, source + test evidence); settlement feeds evidence (`LearningEffectEvent` CLEAR writer via learningEffectivenessService) and mastery; next-practice priority algorithm produces next action (P0, bounded).
- MISSING/UNKNOWN links: objective→evidence write failure retry UNKNOWN; mastery update concurrency UNKNOWN (shared gap).
- FAILURE boundaries: settle isolates partial failure (proven); idempotency record lifecycle unbounded (GAP-dailyobjectives-idempotency-lifecycle).

### ASSESSMENT → MARKING → RESULT → RELEASE / RECOVERY → LEARNING EVIDENCE

- PROVEN links: exam paper persistence chain (5 CLEAR models); marking batch mark-sweep with per-item failure isolation (P1, DIRECT_BEHAVIOR_TEST); result release repositories write parent-safe summaries + result evidence bridges (`ResultLearningEvidenceBridgeRecord` family writers CLEAR for prismaResultLearningEvidenceRepositories); result evidence idempotency model present.
- MISSING/UNKNOWN links: many Exam*/Marking* canonical models lack proven production writers (GAP-questionbank-model-writers) — the marking→result chain is proven at service level (source-verified algorithm) but writer-level completeness for state records is UNKNOWN; result-release → evidence bridge retry semantics UNKNOWN.
- FAILURE boundaries: batch isolation proven; release gating/recovery behavior UNKNOWN beyond models existing.
- EXTERNAL/AI boundary: AI-lane marking not claimed; deterministic marker is backend-owned.

### VOICE REQUEST → AUTH / QUOTA → USAGE → LEDGER → RESPONSE

- PROVEN links: route-level role check + validation (L4); per-user express-rate-limit; quota admission via ledger grants; usage settled in transaction with FOR UPDATE row locks; ledger double-entry style records; bounded summary response (take 10).
- MISSING/UNKNOWN links: provider outage mid-session settlement behavior UNKNOWN; ledger full-history lifecycle ABSENT evidence.
- FAILURE boundaries: transactional rollback proven within settle; quota exhaustion fail-closed shape per L4 evidence.

## Long-History / Data Lifecycle Summary

| Domain | Bound class | Lifecycle |
| --- | --- | --- |
| Learning Evidence | PARTIALLY_BOUNDED | DATA_LIFECYCLE_ABSENT (idempotency/stream rows) |
| Mastery | PARTIALLY_BOUNDED (decisioning) | UNKNOWN (trend states) |
| Daily Objectives | PARTIALLY_BOUNDED | DATA_LIFECYCLE_ABSENT (idempotency rows) |
| Question Bank / Assessment | PARTIALLY_BOUNDED (pagination) | UNKNOWN (attempt/result retention) |
| Voice | PARTIALLY_BOUNDED (take 10 summary) | UNKNOWN (full ledger) |
| Curriculum | POTENTIALLY_UNBOUNDED (raw-SQL reads) | DATA_LIFECYCLE_ABSENT |
| School / Roster | POTENTIALLY_UNBOUNDED (payload size, R8-C flag) | UNKNOWN |
| Student Sessions | PARTIALLY_BOUNDED (archive services) | DATA_LIFECYCLE_PRESENT (archives) |
| Recommendations | STATICALLY_BOUNDED (replace-per-learner) | NOT_APPLICABLE |
| Parent Data | STATICALLY_BOUNDED (per-row summaries) | UNKNOWN |
| Artifacts | UNKNOWN (input bound) | UNKNOWN |
| Operations | PARTIALLY_BOUNDED | UNKNOWN (Ops snapshots) |

No retention/archive/compaction policy was found for high-write event/idempotency families (evidence, objectives, voice, assessment). This is a static completeness finding; throughput impact belongs to R8-E.

## Unresolved Completeness Questions

1. Production writers for ~40 canonical models (curriculum content family, Exam*/Marking* state records, Growth* states, Ops* records, GlobalMemory, MediaAsset) are UNRESOLVED in accepted R8-A writer-group evidence. R8-D could not prove them without re-running forbidden scanners; whether these models are written through alternate production paths (raw SQL, dynamic access) or are unwritten remains UNKNOWN. This dominates the UNKNOWN gap class.
2. Role-level authorization for capability groups beyond the L4/source-verified set remains UNRESOLVED under R8-B law (never inferred from URL shape).
3. Concurrency semantics for canonical mastery updates and question-bank state machines (cross-instance) are UNKNOWN.
4. Whether header-fallback actor identity in learning-evidence routes is reachable in production (behind schoolAuthMiddleware) or only a dev convenience — UNKNOWN.
5. Study planning domain readiness is UNKNOWN end-to-end beyond mount/auth.

## R8-E Handoff

- Static scale flags carried from R8-C unchanged: AI rate-limit window arrays, roster payload size, marking batch size, daily-objective process Map growth, external video cache, unbounded feed input (P0=14 P1=14 P2=2 queue preserved).
- R8-D adds: unbounded event/idempotency/ledger growth families (07 §Long-History) as scale-observability input; no latency/throughput claim is made anywhere in this artifact.
- Dependency cycles (5 accepted) and memory-hotspot candidates remain inputs to R8-E load/reliability analysis.

## R8-G.3A Reconciliation (2026-09-12, HEAD a0a3feac1e545f383a36f4b7bf73c1635ce61154)

Append-only; prior questions preserved. Resolutions proven by focused R8-G.3A traces and `src/tests/r8g3a-*` suites (17 tests, 0 real-DB executions):

1. Growth* writer UNKNOWN (question 1, partial): for the `/api/phase3/growth-page` path the question is closed — growth page is a DERIVED_VIEW with no Growth* writes; no Growth* writer is required on this path (GAP-mastery-growth-writers PROVEN NOT A GAP). Canonical Growth* writers remain solely in `growthIntelligenceService` (unchanged). No competing mastery truth introduced.
2. MediaAsset writer UNKNOWN (question 1, partial): closed — durable canonical owner is `mediaAssetService` (Prisma); video learning routes proven to be consumers, not owners.
3. Study planning readiness UNKNOWN (question 5): closed — study plans are DURABLE_CANONICAL persistent authored snapshots (StudyPlan/StudyGoal Prisma rows via `studySupportService`); only `GET /priorities` is derived.
4. Tutor-state durability (GAP-tutorcore-persistence-unresolved, partial): closed for the state object — `tutorStateService` production default is Prisma-backed fail-closed (R8-G.3A repair); snapshots/history remain process-local (CONTRADICTION, needs schema decision).
5. Living-revision and governance-audit durability UNKNOWNs: NOT closed — recorded CONTRADICTION (process-local canonical state with no mechanically completable durable composition; architecture decisions required). No fake durability claimed.
6. Provenance: remote HEAD imports 10 R8-G.3A route files it does not track; 6 surfaces restored (62-file union), 4 stopped as provenance CONTRADICTION. Full tracked import closure for all active target routes is therefore NOT established — R8-G.4 compile-integrity input.
