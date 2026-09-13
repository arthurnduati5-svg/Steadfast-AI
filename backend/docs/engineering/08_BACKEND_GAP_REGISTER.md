# Backend Gap Register

R8-D gap classification. Evidence classifications only — no refactoring, no destructive dispositions, no R8-F cleanup. Every gap carries exactly one disposition per §16 of the frozen task.

## Baseline

- Repository: `arthurnduati5-svg/Steadfast-AI`, backend at `backend/`, branch `main`
- Accepted remote HEAD: `acef586928765f4073227df2681b27c129045e6f` (R8-C accepted)
- Source fingerprint: `sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0`
- Inputs: `04_BACKEND_DATA_OWNERSHIP_MATRIX.md`, `05_BACKEND_LOGIC_REGISTER.md`, `06_BACKEND_ALGORITHM_REGISTER.md`, `07_BACKEND_COMPLETENESS_MATRIX.md`
- Production backend files changed in R8-D: 0

## Classification Law

- Gap types (§15): MISSING_LOGIC, PARTIAL_LOGIC, OWNERSHIP_AMBIGUITY, AUTHENTICATION_GAP, AUTHORIZATION_GAP, TENANT_ISOLATION_GAP, DURABILITY_GAP, RESTART_GAP, RETRY_IDEMPOTENCY_GAP, CONCURRENCY_GAP, TRANSACTIONALITY_GAP, FAILURE_SEMANTICS_GAP, RECOVERY_GAP, DEPENDENCY_DEGRADATION_GAP, DATA_LIFECYCLE_GAP, STATIC_SCALE_BOUND_GAP, OBSERVABILITY_GAP, CONTRACT_GAP, EXTERNAL_BOUNDARY_GAP, DUPLICATION_CANDIDATE, TRANSITIONAL_IMPLEMENTATION, LEGACY_OR_OBSOLETE_CANDIDATE, UNKNOWN.
- Dispositions (§16): REQUIRED NOW (current established-requirement violation only) | REQUIRED BEFORE PRODUCTION | FUTURE | NOT REQUIRED | UNKNOWN. UNKNOWN is never downgraded to FUTURE for cleanliness.
- Absence claims require evidence; where writer/behavior evidence is unresolved, the gap type is UNKNOWN with the unresolved question recorded.
- Duplication/legacy findings remain candidates; R8-F owns any structural action.
- No performance claims: scale gaps describe static bounds only.

## Gap Summary

| Disposition | Count |
| --- | --- |
| REQUIRED NOW | 1 |
| REQUIRED BEFORE PRODUCTION | 11 |
| FUTURE | 4 |
| NOT REQUIRED | 2 |
| UNKNOWN | 4 |

Gap counts by type (a gap may carry multiple types; exact per-gap audit): DURABILITY_GAP 6, CONCURRENCY_GAP 5, DATA_LIFECYCLE_GAP 4, OWNERSHIP_AMBIGUITY 4, UNKNOWN (as gap type) 10, AUTHENTICATION_GAP 1, AUTHORIZATION_GAP 3, STATIC_SCALE_BOUND_GAP 3, DUPLICATION_CANDIDATE 2, TRANSITIONAL_IMPLEMENTATION 1, CONTRACT_GAP 1, FAILURE_SEMANTICS_GAP 1, TRANSACTIONALITY_GAP 1, OBSERVABILITY_GAP 1. RETRY_IDEMPOTENCY_GAP 0 (retry protection was proven present where required: daily-objective settle, evidence idempotency, AI runtime backoff; remaining retry unknowns are carried under DURABILITY/UNKNOWN types).

Domains with no proven gap: Parent-Facing Backend Data (only shared UNKNOWN dimensions), Artifacts beyond input-bound question (1 gap registered — noted here that no security/privacy gap was proven).

## REQUIRED NOW

One gap: `GAP-evidence-header-identity` — an existing authorization/identity-provenance defect in an active production path (record below). Mount authentication itself is present; no other inspected evidence showed a current violation of an established correctness/security/privacy/safeguarding/data-integrity requirement in accepted product behavior. Specifically:

- Mount authentication is present on production learner/teacher/governance/assessment surfaces (R8A_STRUCTURAL + SOURCE_INSPECTION `src/index.ts:360-414,540-553`).
- The question-bank/marking/exam-paper in-memory repositories are fail-closed gated against production (SOURCE_INSPECTION `questionBankRepositoryMode.ts:33-35` throws in production without `QUESTION_BANK_REPOSITORY_MODE=prisma`).
- Voice quota settlement is transactional with row locks (SOURCE_INSPECTION `voiceLedgerService.ts:144,216-220,472`).
- Learning-evidence commands enforce role allow-lists and same-learner writes in-service (SOURCE_INSPECTION `learningEvidenceCommandService.ts:202-206,320,363,372`) — but they enforce against an actor role sourced from caller-controlled headers, not the verified `req.user.role` (see GAP-evidence-header-identity).
- Beyond GAP-evidence-header-identity, no additional catastrophic security/privacy/data-loss defect whose mere continued existence creates immediate risk was discovered; per §23 no contradiction return was triggered.

### GAP-evidence-header-identity
- LINKED LOGIC ID(S): LOGIC-memory-api-copilot-evidence, LOGIC-memory-api-copilot-learning-evidence
- GAP TYPE: AUTHORIZATION_GAP; CONTRACT_GAP
- CURRENT BEHAVIOR: `/api/copilot/evidence` IS mounted behind `schoolAuthMiddleware` + `requireVerifiedSchoolContext` (src/index.ts:545); `schoolAuthMiddleware` verifies JWT claims and assigns verified identity/role to `req.user.id`, `req.user.role`, and `req.schoolId`. The evidence router does NOT derive actor identity from that verified context: it builds actor identity from caller-controlled `x-actor-id`/`x-actor-role` headers with fallbacks (`learningEvidenceRoutes.ts:11-17`). The resulting `actorRole` is passed into `LearningEvidenceCommandService`.
- MISSING/PARTIAL: actor role/id trust the client-supplied header instead of the verified `req.user` role; in-service role allow-lists (`learningEvidenceCommandService.ts:202-206,320,363,372`) then authorize teacher/admin/internal-operator-only transitions against that caller-controlled value.
- WHY IT MATTERS: a caller can claim `internal_operator` or `school_admin` via `x-actor-role`, elevating evidence operations (commit/approve restricted ops) within their verified school context. Authentication is NOT absent — authenticated JWT identity, verified school context, and a verified role on `req.user.role` all exist; the defect is that the evidence router ignores the verified role.
- EVIDENCE: SOURCE_INSPECTION `src/domains/learning-evidence/routes/learningEvidenceRoutes.ts:11-17` + `learningEvidenceCommandService.ts:187-206,320,363,372`; mount evidence src/index.ts:545; verified identity assignment `src/middleware/schoolAuthMiddleware.ts:18-77`. CONFIDENCE: high (exploitability structurally proven: the verified role exists on `req.user.role` and the router demonstrably consumes the header value instead).
- SECURITY/PRIVACY IMPACT: privilege spoofing within tenant scope (role-provenance defect). DATA INTEGRITY: moderate (evidence commits). RESTART/CONCURRENCY/LONG-HISTORY: none.
- CONSUMERS AFFECTED: evidence event store API. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED NOW. REASON: existing authorization/identity-provenance defect in an active production path — verified JWT identity and role exist, the router ignores them in favor of caller-controlled `x-actor-role`, and command authorization consumes the resulting actor role; exploitability is structurally proven, not merely a future production-readiness concern.
- R8-E RESOLUTION STATUS (current state): **RESOLVED**. This entry preserves the original R8-D DISCOVERED DISPOSITION above; the CURRENT RESOLUTION STATUS is that the finding no longer exists in production source. Resolved by production commits `89c00419571d325efe9c03ede5db865ab2617e62` and `87ab25b3b36cc052ddf4e9f3d165f7b8adef82cb`, which removed all caller-controlled identity-header fallbacks from `learningEvidenceRoutes.ts` and now derive authoritative identity exclusively from the verified server-side context (`req.schoolId`, `req.user.id`, `req.user.role`) with a route-local fail-closed guard, and restricted internal Learning Evidence operations to privileged verified roles (`school_admin`, `internal_operator`). Verified identity provenance now derives from server-side context only; internal Learning Evidence operations are restricted to privileged verified roles. No R8-D historical counts were altered.

## REQUIRED BEFORE PRODUCTION

### GAP-identity-rolecheck-coverage
- LINKED LOGIC ID(S): cross-cutting (R8-B Authentication/Authorization law); all 103 capabilities where role scope = UNRESOLVED
- GAP TYPE: AUTHORIZATION_GAP
- CURRENT BEHAVIOR: mounts enforce authentication and (on most) verified school context; role checks proven only at cited sites (deploymentReadiness.ts:15, voice.ts:36, contentGovernance.ts:28-47, rbac.ts:44-60, learningEvidenceCommandService.ts:202-372).
- MISSING/PARTIAL: role-level authorization unproven for the majority of capability groups (R8-B law: never inferred from URL shape).
- WHY IT MATTERS: a teacher/learner could invoke capabilities reserved for another role if any unproven group lacks in-route/in-service checks.
- EVIDENCE: 05 §Authentication/Authorization; 07 §Identity. EVIDENCE CONFIDENCE: high (that it is unproven — the gap is proven-unknown, not proven-missing enforcement).
- SECURITY/PRIVACY IMPACT: potential cross-role access on unproven groups. DATA INTEGRITY: moderate. RESTART/RETRY/CONCURRENCY: none. LONG-HISTORY: none.
- CONSUMERS AFFECTED: all HTTP surfaces. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: production launch would be unsafe without establishing role enforcement for every group; not provably a current violation (middleware may be present but unproven).

### GAP-identity-mountless-authz
- LINKED LOGIC ID(S): LOGIC-learning-core-api-copilot-copilothandoffroutes
- GAP TYPE: AUTHENTICATION_GAP; AUTHORIZATION_GAP
- CURRENT BEHAVIOR: `/api/copilot` handoff mount (src/index.ts:197) has no middleware recorded in R8-A evidence; capability recorded AUTHENTICATION=UNRESOLVED in R8-B.
- MISSING/PARTIAL: no proven authentication/authorization gate on this surface.
- WHY IT MATTERS: copilot handoff touches `TutorLearnerIdentityMap` (external student identity mapping) — an unauthenticated identity-mapping surface is a cross-tenant identity risk.
- EVIDENCE: 05 LOGIC-learning-core-api-copilot-copilothandoffroutes (AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts; src/index.ts:197). EVIDENCE CONFIDENCE: medium (middleware absence is per R8-A mount evidence; a nested guard inside the router is not disproven).
- SECURITY/PRIVACY IMPACT: high if truly open. DATA INTEGRITY: low. RESTART/CONCURRENCY/LONG-HISTORY: none.
- CONSUMERS AFFECTED: copilot handoff client. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: identity-mapping surface must prove its gate before launch; not REQUIRED NOW because actual exposure is unproven (nested guards UNKNOWN).

### GAP-tutorcore-persistence-unresolved
- LINKED LOGIC ID(S): LOGIC-learning-core-api-copilot-copilothandoffroutes, -tutor-actions, -tutor-turn, LOGIC-learning-core-api-tutor-tutorconversationroutes
- GAP TYPE: DURABILITY_GAP; UNKNOWN
- CURRENT BEHAVIOR: canonical tutor-core capabilities are L3 (structurally connected) with REPOSITORY/DATA OWNER and PERSISTENCE EFFECT = UNRESOLVED in accepted evidence.
- MISSING/PARTIAL: no proven persistence or restart behavior for handoff/actions/turn/conversation state.
- WHY IT MATTERS: if tutor decisions/turns are process-local, a restart silently loses state the product treats as canonical.
- EVIDENCE: 05 Learning Core rows (all UNRESOLVED fields); 07 §Tutor State. CONFIDENCE: medium.
- SECURITY/PRIVACY: none proven. DATA INTEGRITY: potential loss. RESTART IMPACT: direct. RETRY/CONCURRENCY: unknown. LONG-HISTORY: n/a.
- CONSUMERS AFFECTED: copilot client, teacher insights. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: durability of core learning state must be established pre-launch.

### GAP-sessions-chatmessage-writer-duplication
- LINKED LOGIC ID(S): LOGIC-voice-api-copilot-airoutes (chat write paths)
- LINKED ALGORITHM ID(S): none
- GAP TYPE: OWNERSHIP_AMBIGUITY; DUPLICATION_CANDIDATE; CONCURRENCY_GAP
- CURRENT BEHAVIOR: `ChatMessage` has single canonical persistence owner `src/repositories/chatMessageRepository.ts` (R8-F) — confirmed live writes in `src/routes/ai.ts`, `src/services/aiService.ts` and `src/services/revisionLearningService.ts` (raw `INSERT INTO "ChatMessage"` proven same canonical object via schema) now delegate to `createChatMessage`/`updateChatMessage` with preserved sessionId/role/content/messageNumber/metadata/id/timestamp semantics and no role normalization. Unmounted untracked segmentation stub `src/routes/ai/ai-chat.routes.ts` is not live and was deliberately left untouched.
- MISSING/PARTIAL: lock/version semantics for concurrent canonical writes remain unproven.
- WHY IT MATTERS: chat history is learner-facing evidence; divergent writers can produce inconsistent histories.
- EVIDENCE: 04 §Canonical Writers `ChatMessage` row (R8-F); R8-F focused repository test (6/6). CONFIDENCE: high.
- SECURITY/PRIVACY: none. DATA INTEGRITY: moderate. RESTART: none. RETRY/CONCURRENCY: moderate. LONG-HISTORY: none.
- CONSUMERS AFFECTED: tutor client, growth reader. R8-E HANDOFF: none. R8-F HANDOFF: consolidated through canonical writer.
- DISPOSITION: RESOLVED (R8-F). REASON: all confirmed live canonical ChatMessage writes now pass through one persistence owner.

### GAP-evidence-idempotency-lifecycle
- LINKED LOGIC ID(S): LOGIC-memory-api-copilot-learning-evidence, LOGIC-memory-api-copilot-evidence
- LINKED ALGORITHM ID(S): none (idempotency models, not curated algorithm)
- GAP TYPE: DATA_LIFECYCLE_GAP; STATIC_SCALE_BOUND_GAP
- CURRENT BEHAVIOR: `LearningEvidenceIdempotency` + `ResultLearningEvidenceIdempotencyRecord` grow with every evidenced operation; no retention/compaction evidence; event stream retention ABSENT evidence.
- MISSING/PARTIAL: no archival/compaction path.
- WHY IT MATTERS: unbounded idempotency and stream tables degrade long-history operation; projections/checkpoints mitigate reads but not storage.
- EVIDENCE: 04 learning-evidence family (models + single writers); 07 §Learning Evidence long-history. CONFIDENCE: high (absence of any lifecycle code in accepted evidence; writer set is fully enumerated).
- SECURITY/PRIVACY: none. DATA INTEGRITY: none. RESTART: none. RETRY/CONCURRENCY: none. LONG-HISTORY IMPACT: direct.
- CONSUMERS AFFECTED: evidence pipeline, mastery. R8-E HANDOFF: storage growth analysis. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: event-sourced canonical evidence without any retention policy is unsafe for production-longevity.

### GAP-mastery-canonical-concurrency
- LINKED LOGIC ID(S): LOGIC-mastery-api-copilot-practice-mastery, LOGIC-mastery-api-phase3-objectives, result-learning-evidence capability
- LINKED ALGORITHM ID(S): ALG-mastery-practicemastery-evidence-level-ladder, ALG-mastery-practicemastery-score-threshold-ladder
- GAP TYPE: CONCURRENCY_GAP; TRANSACTIONALITY_GAP; UNKNOWN
- CURRENT BEHAVIOR: `probabilisticMasteryRepository.ts` is the single canonical writer (create/updateMany rows proven); no lock/version/transaction boundary evidence for concurrent evidence applications.
- MISSING/PARTIAL: no proven serialization or optimistic-version semantics for concurrent canonical mastery updates.
- WHY IT MATTERS: two concurrent evidence applications (e.g., parallel practice + result bridge) could interleave into an incorrect canonical mastery state — the highest-value learning truth.
- EVIDENCE: 04 mastery family + Canonical* writer rows (no transaction boundary noted); 07 §Mastery. CONFIDENCE: medium (absence of evidence, not evidence of absence — Prisma interactive transactions may exist unrecorded).
- SECURITY/PRIVACY: none. DATA INTEGRITY IMPACT: high. RESTART: none. RETRY/CONCURRENCY IMPACT: direct. LONG-HISTORY: none.
- CONSUMERS AFFECTED: mastery, growth, recommendations, revision. R8-E HANDOFF: concurrency load shape. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: canonical-state integrity under concurrency must be proven before launch.

### GAP-mastery-growth-writers
- LINKED LOGIC ID(S): LOGIC-mastery-api-phase3-growth-page, LOGIC-mastery-api-copilot-growth
- LINKED ALGORITHM ID(S): ALG-mastery-growth-topic-inference-signal-count
- GAP TYPE: DURABILITY_GAP; OWNERSHIP_AMBIGUITY; UNKNOWN
- CURRENT BEHAVIOR: all five `Growth*` state models (GrowthMasteryTrendState, GrowthMistakePatternState, GrowthProofRecord, GrowthRecommendationState, GrowthWeakTopicState) have no production writer in R8-A evidence; inference algorithm computes from bounded signals (n<=40).
- MISSING/PARTIAL: growth truth persistence path unknown — may be computed-only or written via unrecorded paths.
- WHY IT MATTERS: growth page durability and consistency claims cannot be made; if computed-only, restart/consistency is fine (NOT_APPLICABLE) but that is unproven.
- EVIDENCE: 04 §Canonical Writers Growth* rows ("No R8-A modelWriterGroups entry"); 06 inference record (MASTERY_SENSITIVITY, P0). CONFIDENCE: medium.
- SECURITY/PRIVACY: none. DATA INTEGRITY: unknown. RESTART IMPACT: unknown. RETRY/CONCURRENCY: unknown. LONG-HISTORY: unknown.
- CONSUMERS AFFECTED: learner growth page. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: persistence semantics of a learner-facing truth surface must be established pre-launch.

### GAP-questionbank-model-writers
- LINKED LOGIC ID(S): LOGIC-question-bank-api-question-bank-exam-delivery, -marking-invocation, -result-delivery, -result-release, and related unresolved candidates
- GAP TYPE: DURABILITY_GAP; OWNERSHIP_AMBIGUITY; UNKNOWN
- CURRENT BEHAVIOR: the majority of Exam*/Marking* canonical models (ExamAttemptRecord, ExamDeliverySessionRecord/State, MarkingRunRecord, MarkingBatchRecord, Marking*Version/Link records, FollowUp* records, etc.) have no production writer group in R8-A evidence; prisma repository implementations exist and are mode-gated into production.
- MISSING/PARTIAL: writer-level completeness for the assessment state chain is unproven; durable repositories exist but whether all writes flow through them is UNKNOWN.
- WHY IT MATTERS: assessment is the highest-integrity domain; any state record silently unwritten breaks recovery, audit and result-release truth.
- EVIDENCE: 04 §Canonical Writers (rows marked "No R8-A modelWriterGroups entry"); SOURCE_INSPECTION composition/resolver proving prisma-mode wiring exists. CONFIDENCE: medium.
- SECURITY/PRIVACY: none. DATA INTEGRITY IMPACT: high. RESTART IMPACT: unknown. RETRY/CONCURRENCY: unknown. LONG-HISTORY: none.
- CONSUMERS AFFECTED: teacher, student, parent projections. R8-E HANDOFF: none. R8-F HANDOFF: Package 11 result-release active HTTP durable composition = RESOLVED (mounted router defaults to Prisma repositories + PrismaResultReleaseApprovalAtomicCommitter; InMemory for explicit test injection only); other Exam*/Marking*/question-bank writer unknowns = REMAIN.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: exam/marking state durability must be writer-proven before launch.

### GAP-questionbank-concurrency-locks
- LINKED LOGIC ID(S): LOGIC-question-bank-api-question-bank-exam-delivery, -marking, -result-release
- GAP TYPE: CONCURRENCY_GAP; UNKNOWN
- CURRENT BEHAVIOR: no lock/version/transaction semantics proven for concurrent exam delivery submissions, marking state transitions, or result release toggles.
- MISSING/PARTIAL: concurrent canonical writes unguarded as far as evidence shows.
- WHY IT MATTERS: concurrent submits/marks/releases can violate assessment integrity (double-release, split-brain delivery state).
- EVIDENCE: 04 question-bank family TRANSACTION BOUNDARY UNRESOLVED rows; 07 §Question Bank. CONFIDENCE: medium.
- SECURITY/PRIVACY: none. DATA INTEGRITY IMPACT: high. RESTART/RETRY: none directly. CONCURRENCY IMPACT: direct. LONG-HISTORY: none.
- CONSUMERS AFFECTED: students, teachers, parents. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: assessment concurrency protection is a launch-critical durability property.

### GAP-school-roster-unbounded
- LINKED LOGIC ID(S): LOGIC-school-api-task021-school-integration, LOGIC-school-api-schoolintegrationroutes
- LINKED ALGORITHM ID(S): ALG-school-schoolintegration-roster-reconcile, ALG-school-schoolintegration-roster-dryrun-conflict-scan
- GAP TYPE: STATIC_SCALE_BOUND_GAP; FAILURE_SEMANTICS_GAP
- CURRENT BEHAVIOR: roster reconcile and dry-run scan process whole-school payloads in single passes (O(n), POTENTIALLY_UNBOUNDED input flagged by R8-C); no batching or chunking evidence.
- MISSING/PARTIAL: bounded degradation for very large rosters; partial-failure resume within a roster sync.
- WHY IT MATTERS: a large-school sync could exhaust request resources and leave a partial mapping state; dry-run exists (mitigation) but execution path is single-pass.
- EVIDENCE: 06 roster algorithm records (UNBOUNDED_DATA flags, "flagged for R8-E batching review"); 07 §Teacher/School. CONFIDENCE: high.
- SECURITY/PRIVACY: none. DATA INTEGRITY: moderate. RESTART: none. RETRY/CONCURRENCY: moderate. LONG-HISTORY: none.
- CONSUMERS AFFECTED: school admins. R8-E HANDOFF: yes — batching/memory review (primary). R8-F HANDOFF: REPAIRED (hotspot) — Task 039 provenance omission reconciled into Git. The demonstrated roster dry-run quadratic membership-scan hotspot was repaired in R8-F using pre-indexed membership lookup. No hard roster-size limit was invented. Whole-roster payloads remain potentially unbounded, and any future batching/recovery/partial-resume policy remains a separate R8-G acceptance/policy question.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: production launch with school-wide syncs needs bounded degradation; the mechanism is a static bound, not a performance claim.

### GAP-dailyobjectives-idempotency-lifecycle
- LINKED LOGIC ID(S): LOGIC-mastery-api-phase3-daily-objective-checks
- LINKED ALGORITHM ID(S): ALG-mastery-dailyobjective-idempotency-settle
- GAP TYPE: DATA_LIFECYCLE_GAP
- CURRENT BEHAVIOR: durable idempotency records (`dailyObjectiveCheckCompletionIdempotencyRecord`) are upserted per settlement and deleted only in bulk test-mode path (`:830 deleteMany` gated by test maps mode); no production retention/compaction.
- MISSING/PARTIAL: production purge/archive for completed idempotency keys.
- WHY IT MATTERS: table grows once per check session per learner per day — durable correctness mechanism with unbounded retention.
- EVIDENCE: SOURCE_INSPECTION `phase3DailyObjectiveCheckCompletionService.ts:40,63,114,830`; 04 orphan-writer rows. CONFIDENCE: high.
- SECURITY/PRIVACY: none. DATA INTEGRITY: none. RESTART/CONCURRENCY: none. LONG-HISTORY IMPACT: direct.
- CONSUMERS AFFECTED: daily objective pipeline. R8-E HANDOFF: storage growth. R8-F HANDOFF: none.
- DISPOSITION: REQUIRED BEFORE PRODUCTION. REASON: long-history hygiene for a correctness-critical table before years of accumulation.

## FUTURE

### GAP-curriculum-lifecycle-unbounded
- LINKED LOGIC ID(S): LOGIC-question-bank-api-content-governance-contentgovernanceroutes
- GAP TYPE: DATA_LIFECYCLE_GAP; STATIC_SCALE_BOUND_GAP
- CURRENT BEHAVIOR: curriculum raw-SQL reads (`artifactCurriculumReferenceService.ts:80-104`) have no visible bounds; no retention for content reviews/gaps/audits.
- WHY IT MATTERS: curriculum tables are comparatively low-churn; growth is slow.
- EVIDENCE: 04 Raw SQL ownership rows; 07 §Curriculum. CONFIDENCE: medium.
- DISPOSITION: FUTURE. REASON: low-churn tables; useful hygiene, not launch-critical.

### GAP-voice-ledger-fullhistory-lifecycle
- LINKED LOGIC ID(S): LOGIC-voice-api-voice-voiceroutes
- LINKED ALGORITHM ID(S): ALG-voice-voice-ledger-billing-quota
- GAP TYPE: DATA_LIFECYCLE_GAP
- CURRENT BEHAVIOR: ledger tail read is bounded (take 10); full ledger history per student grows indefinitely; no archival.
- WHY IT MATTERS: auditability of billing history is valuable; growth per student is modest (bounded by usage).
- EVIDENCE: SOURCE_INSPECTION `voiceLedgerService.ts:222-231`; 06 quota record. CONFIDENCE: high.
- DISPOSITION: FUTURE. REASON: per-student volume is naturally bounded by usage time; archival is good practice, not launch-critical.

### GAP-practice-cycle-concurrency-unknown
- LINKED LOGIC ID(S): LOGIC-mastery-api-copilot-adaptive-challenges, LOGIC-mastery-api-copilot-quiz-mode
- GAP TYPE: CONCURRENCY_GAP; DUPLICATION_CANDIDATE (cycle, not duplication)
- CURRENT BEHAVIOR: dependency cycle `nextPracticeService.ts ↔ practiceAttemptService.ts` (R8-B accepted cycle f-34ebf97e1b6c); no concurrency semantics proven for simultaneous attempts.
- WHY IT MATTERS: attempt records are additive; interleaving risk is low-severity but should be understood before hard correctness claims.
- EVIDENCE: 05 dependency cycles; 04 practice family. CONFIDENCE: low.
- DISPOSITION: FUTURE. REASON: additive-record domains tolerate modest race windows; resolve with R8-E concurrency review.

### GAP-intel-recommendation-concurrency-unknown
- LINKED LOGIC ID(S): LOGIC-school-api-learner-learnerrecommendationroutes
- GAP TYPE: CONCURRENCY_GAP
- CURRENT BEHAVIOR: `adaptiveRecommendationProfileRepository.ts` uses deleteMany/upsert replace semantics; concurrent regenerations could transiently empty a profile.
- WHY IT MATTERS: recommendation profiles are regenerable; transient emptiness self-heals.
- EVIDENCE: 04 `AdaptiveRecommendationProfileRecord` writer row (deleteMany/upsert ops). CONFIDENCE: medium.
- DISPOSITION: FUTURE. REASON: regenerable derived state; not integrity-critical.

## NOT REQUIRED

### GAP-dailyobjectives-naming-drift-orphans
- LINKED LOGIC ID(S): LOGIC-mastery-api-phase3-daily-objective-checks
- GAP TYPE: OWNERSHIP_AMBIGUITY; TRANSITIONAL_IMPLEMENTATION
- CURRENT BEHAVIOR: writer-group keys `dailyObjectiveCheck*Record` match no canonical Prisma model name (naming drift); 04 carries them as orphans.
- WHY IT MATTERS: naming consistency only; ownership is CLEAR (single writer) and behavior is proven.
- EVIDENCE: 04 §Canonical Writers orphan notes. CONFIDENCE: high.
- DISPOSITION: NOT REQUIRED (as a completeness gap). REASON: no behavioral incompleteness; naming/structure belongs to R8-F.

### GAP-media-asset-writer-unresolved (narrowed)
- LINKED LOGIC ID(S): LOGIC-artifacts-api-copilot-videorecommendationroutes
- GAP TYPE: UNKNOWN (narrowed candidate)
- CURRENT BEHAVIOR: `MediaAsset` has no production writer group; dedupe-key algorithm exists implying an ingestion path.
- WHY IT MATTERS: if the ingestion path is test-only today, the durability gap is hypothetical until the media pipeline is product-active.
- EVIDENCE: 04 `MediaAsset` row; 06 dedupe record. CONFIDENCE: low.
- DISPOSITION: NOT REQUIRED until media ingestion is confirmed product-active. REASON: no proven current consumer path breaks; revisit if media pipeline activates. (Primary MediaAsset concern remains tracked under GAP-questionbank-model-writers' class of writer-unknowns and the FUTURE/UNKNOWN set; see GAP-media-writer-unknown below.)

## UNKNOWN

### GAP-media-writer-unknown
- LINKED LOGIC ID(S): LOGIC-artifacts-api-copilot-videolearningsessionroutes, LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes
- GAP TYPE: DURABILITY_GAP; UNKNOWN
- CURRENT BEHAVIOR: no production writer proven for `MediaAsset`; dedupe-key algorithm (mediaAssetService.ts:330-336) implies writes occur somewhere.
- MISSING/PARTIAL: unknown whether media truth is durable, process-local, or unwritten.
- WHY IT MATTERS: if the video learning session path writes media truth process-local, restarts lose it; if durable, no gap.
- EVIDENCE: 04 `MediaAsset` UNRESOLVED row; 06 dedupe record with DATABASE_HOTSPOT_CANDIDATE flag (implying DB writes). CONFIDENCE: medium.
- SECURITY/PRIVACY: none proven. DATA INTEGRITY: unknown. RESTART IMPACT: unknown. RETRY/CONCURRENCY: unknown. LONG-HISTORY: unknown.
- CONSUMERS AFFECTED: video learning sessions, analytics. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: UNKNOWN. REASON: writer path unproven in both directions; does not meet REQUIRED BEFORE PRODUCTION without proof that durable truth is missing.

### GAP-revision-writer-durability-unknown
- LINKED LOGIC ID(S): LOGIC-mastery-api-phase3-living-revision
- GAP TYPE: DURABILITY_GAP; UNKNOWN
- CURRENT BEHAVIOR: revision family writer verdicts UNRESOLVED in accepted evidence; revision raw SQL confined to TEST_PROOF files; production writer set unknown.
- MISSING/PARTIAL: durability/restart semantics of revision truth unknown.
- WHY IT MATTERS: revision is a core learner surface; if computed-only by design that is acceptable — unproven either way.
- EVIDENCE: 04 revision family; 05 LOGIC-mastery-api-phase3-living-revision; 05 dependency cycle f-4590df85597b. CONFIDENCE: low.
- SECURITY/PRIVACY: none. DATA INTEGRITY: unknown. RESTART/CONCURRENCY/LONG-HISTORY: unknown.
- CONSUMERS AFFECTED: learner revision UI. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: UNKNOWN. REASON: evidence insufficient in both directions.

### GAP-studyplanning-ownership-unknown
- LINKED LOGIC ID(S): LOGIC-mastery-api-phase3-study-plans
- GAP TYPE: UNKNOWN
- CURRENT BEHAVIOR: study-plan writer/link unproven; algorithm coverage UNRESOLVED; mount auth proven.
- WHY IT MATTERS: cannot assess completeness of a domain whose persistence ownership is unknown.
- EVIDENCE: 04 route-surface rows; 06 coverage row. CONFIDENCE: low.
- SECURITY/PRIVACY: none. DATA INTEGRITY: unknown. RESTART/CONCURRENCY/LONG-HISTORY: unknown.
- CONSUMERS AFFECTED: learner planner. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: UNKNOWN. REASON: insufficient evidence; needs one targeted ownership trace in a later stage.

### GAP-safety-audit-writers
- LINKED LOGIC ID(S): LOGIC-safety-api-task020-security-privacy-governance, LOGIC-safety-api-governance-privacygovernanceroutes
- GAP TYPE: DURABILITY_GAP; OBSERVABILITY_GAP; UNKNOWN
- CURRENT BEHAVIOR: governance audit models (ContentGovernanceAuditRecord, ApprovedSourceRecord, ContentGapRecord, ModerationDecisionRecord) writers TEST_PROOF only; fail-closed approval behavior proven at test level.
- MISSING/PARTIAL: durable audit trail for governance decisions unproven in production path.
- WHY IT MATTERS: safeguarding decisions without a proven durable audit trail weaken accountability; alternatively audits may flow through a path R8-A did not record.
- EVIDENCE: 04 §Canonical Writers TEST_PROOF rows; accepted task-022 contract tests (supporting). CONFIDENCE: medium.
- SECURITY/PRIVACY IMPACT: accountability gap potential. DATA INTEGRITY: unknown. RESTART: unknown. RETRY/CONCURRENCY: none. LONG-HISTORY: none.
- CONSUMERS AFFECTED: governance UI. R8-E HANDOFF: none. R8-F HANDOFF: none.
- DISPOSITION: UNKNOWN. REASON: writer path unproven in both directions; escalation to REQUIRED BEFORE PRODUCTION requires proving audits are truly unwritten.

## Security / Privacy / Safeguarding Gaps

- GAP-evidence-header-identity (REQUIRED NOW — proven authorization/identity-provenance defect: verified JWT role ignored in favor of caller-controlled `x-actor-role`)
- GAP-identity-rolecheck-coverage (REQUIRED BEFORE PRODUCTION)
- GAP-identity-mountless-authz (REQUIRED BEFORE PRODUCTION)
- GAP-safety-audit-writers (RESOLVED — R8-G.3A final reconciliation: durable governance record families, Prisma fail-closed production default, no environment memory fallback; the R8-D UNKNOWN disposition above is preserved as history).
No other REQUIRED NOW security/privacy/safeguarding gap was proven; GAP-evidence-header-identity is the single proven current violation.

## Data Integrity / Durability Gaps

- GAP-tutorcore-persistence-unresolved, GAP-sessions-chatmessage-writer-duplication, GAP-mastery-canonical-concurrency, GAP-mastery-growth-writers, GAP-questionbank-model-writers, GAP-questionbank-concurrency-locks (all REQUIRED BEFORE PRODUCTION); GAP-revision-writer-durability-unknown, GAP-media-writer-unknown, GAP-studyplanning-ownership-unknown (UNKNOWN). — CURRENT: GAP-tutorcore-persistence-unresolved RESOLVED, GAP-revision-writer-durability-unknown RESOLVED, GAP-media-writer-unknown RESOLVED, GAP-studyplanning-ownership-unknown RESOLVED, GAP-mastery-growth-writers PROVEN NOT A GAP for the growth-page path (R8-G.3A final reconciliation; see below). The R8-D dispositions remain as history.

## Retry / Concurrency / Recovery Gaps

- GAP-mastery-canonical-concurrency, GAP-questionbank-concurrency-locks, GAP-intel-recommendation-concurrency-unknown, GAP-practice-cycle-concurrency-unknown. Recovery: proven present for evidence (event-sourced rebuildable projections), operations expansion (rollback records), assessment batches (failure isolation); proven absent nowhere.

## Long-History / Scale-Bound Gaps

- GAP-evidence-idempotency-lifecycle, GAP-dailyobjectives-idempotency-lifecycle (REQUIRED BEFORE PRODUCTION); GAP-curriculum-lifecycle-unbounded, GAP-voice-ledger-fullhistory-lifecycle (FUTURE); GAP-school-roster-unbounded (REQUIRED BEFORE PRODUCTION, static bound).

## Ownership / Contract Gaps

- GAP-sessions-chatmessage-writer-duplication, GAP-mastery-growth-writers, GAP-questionbank-model-writers, GAP-dailyobjectives-naming-drift-orphans (NOT REQUIRED), GAP-evidence-header-identity (contract), GAP-studyplanning-ownership-unknown.

## Duplication / Transitional Candidates

Classified per §21; no destructive action taken; no completeness impact assigned beyond candidate status:
- GAP-sessions-chatmessage-writer-duplication (DUPLICATION_CANDIDATE with integrity impact → REQUIRED BEFORE PRODUCTION)
- GAP-practice-cycle-concurrency-unknown (cycle, not duplication; FUTURE)
- R8-B's 30+ DUPLICATE_SERVICE/REPOSITORY_CANDIDATE entries remain classified: in-memory/prisma pairs = SHARED_BY_DESIGN test doubles (proven by fail-closed mode resolver, SOURCE_INSPECTION); task-numbered service families (task033/034/035 governance review services, task031/034/036/040 diagnostics) = DUPLICATION_CANDIDATE / TRANSITIONAL_IMPLEMENTATION with NO_COMPLETENESS_IMPACT proven where single mounts consume single services; R8-F owns consolidation.

## Cross-Domain Chain Gaps

- LEARNER ACTION → ... → GROWTH: GAP-mastery-canonical-concurrency, GAP-mastery-growth-writers (chain terminus durability).
- ARTIFACT → PRACTICE/EVIDENCE: GAP-artifacts-input-bound-unresolved is recorded in 07 (UNKNOWN dimension, not escalated — parse bound is R8-E adjacent); media sub-chain GAP-media-writer-unknown.
- DAILY OBJECTIVE → SETTLEMENT → ... : GAP-dailyobjectives-idempotency-lifecycle.
- ASSESSMENT → MARKING → RESULT → RELEASE: GAP-questionbank-model-writers, GAP-questionbank-concurrency-locks.
- VOICE REQUEST → LEDGER: GAP-voice-ledger-fullhistory-lifecycle (FUTURE).

## R8-E Handoff

- Static bounds to measure: AI rate-limit window arrays, roster payloads, marking batch size, daily-objective process Map, external video cache, unbounded feed input (R8-C P0=14 P1=14 P2=2 queue unchanged).
- R8-D additions: storage-growth families (evidence idempotency, objective idempotency, voice ledger, curriculum reads) for long-run load analysis; concurrency-unknown surfaces (mastery canonical updates, question-bank state) for race-shape review. No latency/throughput claims made.

## R8-F Handoff

- Duplication candidates preserved: ChatMessage writers, task-numbered service families, in-memory/prisma pairs (latter classified SHARED_BY_DESIGN), adaptivechallengeaudit and sibling repository/service pairs, dependency cycles f-a8dba5e5eb52/f-f15ee3746717/f-46c16965c23c/f-4590df85597b/f-34ebf97e1b6c.
- Naming-drift orphans (`dailyObjectiveCheck*Record`) flagged for structural normalization.
- No destructive disposition performed in R8-D; no winner selected in any duplication candidate.

## R8-G.3A Reconciliation (2026-09-12, HEAD a0a3feac1e545f383a36f4b7bf73c1635ce61154)

> SUPERSEDED BY R8-G.3A FINAL RECONCILIATION (final section below). The intermediate closure statuses below — in particular the CONTRADICTION verdicts for GAP-tutorcore-persistence-unresolved remainder, GAP-revision-writer-durability-unknown, and GAP-safety-audit-writers — were repaired by D1/D1C/D2/D2C (commits `4f0a6d2`, `449d17b`, `bcf9fb4`, `7b2e404`) and are historical evidence, not current truth.

Append-only record. R8-D dispositions above are preserved; the statuses below are R8-G.3A closure states per that task's §40 (RESOLVED | PROVEN NOT A GAP | NOT ACTIVE | CONTRADICTION). No UNKNOWN remains for the six R8-G.3A families' active critical paths.

- GAP-tutorcore-persistence-unresolved → PARTIALLY RESOLVED, REMAINDER CONTRADICTION (provenance). Handoff DURABLE_CANONICAL (TutorLearnerIdentityMap + TutorSession, Prisma, no memory). Tutor actions stateless decision compute — PROVEN NOT A GAP (no invented TutorAction writer). Tutor-turn orchestration stateless; telemetry array CACHE_ONLY — PROVEN NOT A GAP (no invented TutorTurn records; downstream durable owner is TutorState/session state). Tutor conversation session state DURABLE_CANONICAL (StudentLearningSessionState/Event, Prisma raw SQL; R8-F chatMessageRepository consolidation untouched). TutorState + video session/analytics durability REPAIRED: `tutorStateService.ts` production default is now Prisma-backed fail-closed (silent Prisma→memory success removed; memory fallback is explicit test/dev injection only). Remainder: `tutorState.ts`, `tutorStateEndpoint.ts`, `tutorConversation.ts` route provenance exceeds the 15-file restoration budget (30/39/148 untracked value-closure files) — STOP surfaces, tracked import closure NOT restored, CONTRADICTION reported for provenance (R8G3A-R27-contradiction).
- GAP-mastery-growth-writers → PROVEN NOT A GAP for the `/api/phase3/growth-page` path. Growth page is a DERIVED_VIEW (feed + study-plan + evidence adapters, one hop from canonical mastery via DailyFeed; zero Growth* model references in the 13-file chain; canonical Growth* writers remain solely in `growthIntelligenceService`, untouched). No Growth* writer invented; no competing mastery truth introduced. Growth-page route provenance exceeds budget (33 untracked files) — STOP surface, CONTRADICTION reported for provenance only.
- GAP-revision-writer-durability-unknown → CONTRADICTION. Living-revision nodes/edges/due-items/graphs/audit are DEFECT_PROCESS_LOCAL_CANONICAL (Map/Set heap stores, `rev_Date.now_Math.random` IDs, no Prisma import, total loss on restart) while the mounted route accepts canonical mutations (create/pin/complete/snooze/archive). No suitable existing schema backs these shapes (RevisionItem is a different userId-keyed content domain; mapping would be surprise schema / competing truth, forbidden). Durability repair is architecture work for ChatGPT. Route + 10-file value closure provenance RESTORED (ACCEPTED_PROVENANCE_OMISSION).
- GAP-studyplanning-ownership-unknown → RESOLVED. Study plans are DURABLE_CANONICAL persistent authored snapshots (`studySupportService`: INSERT/SELECT/UPDATE on StudyPlan/StudyGoal via Prisma raw SQL; stable IDs for GET/update/completion/lifecycle). `GET /priorities` is the single DERIVED_VIEW exception (read-only intelligence projection).
- GAP-media-writer-unknown → RESOLVED with separation. MediaAsset DURABLE_CANONICAL owned by `mediaAssetService` (Prisma); gap label was stale for video paths — video routes never owned MediaAsset creation (proven: no import) and none was invented. VideoLearningSession DURABLE_CANONICAL (TutorState row `videoLearningSession` object + LearningEvent mirror; inherits R8-G.3A TutorState fail-closed repair). VideoLearningAnalytics DERIVED_VIEW (bounded 200-event store + pure aggregation/scoring; no materialized metric persistence invented).
- GAP-safety-audit-writers → CONTRADICTION on durable composition; fail-closed behavior PROVEN preserved. ApprovedSourceRecord/ContentGapRecord/ContentGovernanceAuditRecord task022 singletons and ModerationDecision default composition remain process-local (sync Map APIs consumed codebase-wide; Prisma repos exist but wiring them is redesign, not mechanical). Fail-closed direction proven and locked by test (`pending_review`/unknown never approved; grounding emits gap/denied). `privacyGovernance` + `task020` routes proven disjoint from the four models (no duplicate writers invented). Provenance RESTORED for `privacyGovernance.ts` + 14-file value closure.

Provenance (R8-G.3A §26–§28): remote HEAD imports 10 route files it does not track. RESTORED as ACCEPTED_PROVENANCE_OMISSION (62-file union, each surface ≤15 untracked value-closure files): copilotHandoff(5), tutorActionRoutes(12), phase3LivingRevisionRoutes(11), videoLearningSessions(10), videoLearningAnalytics(10), privacyGovernance(15). STOPPED (tracked closure not restored; contradiction): tutorState(30), tutorStateEndpoint(39), tutorConversation(148), phase3GrowthPageRoutes(33). No historical tests/docs/features bulk-staged.

## R8-G.3A FINAL RECONCILIATION (2026-09-13, HEAD 7b2e4047cf9f3a1ecd82afed73255021f35e2a3b)

Supersedes every intermediate R8-G.3A closure status above. Final gap statuses — no UNKNOWN, no PARTIALLY RESOLVED, no active CONTRADICTION remains for the six R8-G.3A ownership/durability gaps:

- GAP-tutorcore-persistence-unresolved → RESOLVED. Handoff, Tutor State, Tutor State Snapshots/History, and Conversation are DURABLE_CANONICAL; Actions and Turn are REQUEST_EPHEMERAL by design (telemetry CACHE_ONLY). Snapshots/history durable via `TutorStateSnapshotRecord` (D1, restart-proven real PostgreSQL 10/10).
- GAP-mastery-growth-writers → PROVEN NOT A GAP for the `/api/phase3/growth-page` path. Growth page is a DERIVED_VIEW over canonical mastery/evidence/study inputs; no Growth* writer required; canonical Growth* writers remain solely in `growthIntelligenceService` (unchanged); no competing mastery truth.
- GAP-revision-writer-durability-unknown → RESOLVED. Revision Nodes/Edges/Due State are DURABLE_CANONICAL (`Phase3RevisionNodeRecord`/`EdgeRecord`/`DueItemRecord`), Revision Audit is DURABLE_EVENT (`Phase3RevisionAuditRecord`, append-only, awaited), Revision Graph is DERIVED_VIEW. Restart-proven in D1 (real PostgreSQL 10/10); production route composition proven in D1C (HTTP→PostgreSQL 1/1).
- GAP-studyplanning-ownership-unknown → RESOLVED. Study Plans/Goals DURABLE_CANONICAL (Prisma `StudyPlan`/`StudyGoal` via `studySupportService`); Study Priority View DERIVED_VIEW.
- GAP-media-writer-unknown → RESOLVED. MediaAsset DURABLE_CANONICAL (`mediaAssetService`/Prisma); Video Learning Session DURABLE_CANONICAL (TutorState-backed session state + LearningEvent mirror); Video Learning Analytics DERIVED_VIEW.
- GAP-safety-audit-writers → RESOLVED. ApprovedSourceRecord, ContentGapRecord, ModerationDecisionRecord are DURABLE_CANONICAL; ContentGovernanceAuditRecord is DURABLE_EVENT. Production default is Prisma fail-closed; `new ModerationService()` → `PrismaModerationDecisionRepository`/`PrismaMarkingResultVersionRepository` with NO environment-controlled memory fallback (D2C removed `ASSESSMENT_MODERATION_ALLOW_MEMORY`); memory is explicit constructor/flag opt-in only. Required audit failure cannot be reported as successful governance completion.

Accepted durability evidence — PREVIOUSLY EXECUTED / REUSED ACCEPTED EVIDENCE, not rerun: D1 (`4f0a6d2`) 10/10 real PostgreSQL; D1C (`449d17b`) 16/16 focused composition/strict-history + 1/1 real-PostgreSQL HTTP route; D2 (`bcf9fb4`) final 16/16 real PostgreSQL (run 1 15/16 was a test-expectation defect, not production); D2C (`7b2e404`) composition lock 8/8 + package-5 teacher review/moderation 11/11.

Provenance (R8-G.4 compile/provenance input — NOT an ownership verdict): `src/routes/tutorState.ts`, `src/routes/tutorStateEndpoint.ts`, `src/routes/tutorConversation.ts`, `src/routes/phase3GrowthPageRoutes.ts` remain Git-untracked while directly imported by `src/index.ts` (re-verified 2026-09-13 against the current local chain: `git ls-files` empty for all four; import sites src/index.ts:12-13,36,584). These are carried as R8-G.4 compile/provenance inputs and do NOT reopen the six ownership/durability gaps.
