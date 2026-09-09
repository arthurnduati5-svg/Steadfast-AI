# Backend Logic Register

R8-B capability classification. Each capability traces HTTP route → middleware → validation → service/domain logic → repository/data access → state effect → response/error where R8-A structural evidence proves it; unprovable fields are recorded as `UNRESOLVED`, never invented.

## Baseline

- Scanner version: 1.0.0
- Source fingerprint: sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0
- R8-A generated at: 2026-09-08T17:43:59.064Z
- R8-A git: branch=main head=87df12783eb0283d4b24963879f8a632b315e8cf
- Canonical Prisma schema: prisma/schema.prisma
- Accepted structural snapshot: files=5398 routeModules=134 routeMounts=167 routeEndpoints=3312 prismaModels=432 unresolvedInternalImports=1 cycles=5 findings=9610
- R8-B scope: classification/understanding only. No production behavior was changed and no finding below carries a final disposition.

## Logic Taxonomy

Capability IDs are stable and deterministic: `LOGIC-<domain>-<mount-key>`, sorted lexicographically. Completeness scale: L0 ABSENT, L1 SCAFFOLD, L2 PARTIAL, L3 CONNECTED, L4 FUNCTIONALLY COMPLETE, L5 RELIABLE, L6 PRODUCTION-READY CANDIDATE, L7 OPTIMIZED. R8-B awards at most L4: L1 = scaffold/unmounted candidate; L2 = mounted but downstream behavior ownership unresolved; L3 = CONNECTED (route/module → downstream service/repository/data proven via DEPENDENCY_GRAPH / PRISMA_WRITE_ACCESS); L4 = FUNCTIONALLY COMPLETE only when targeted SOURCE_INSPECTION shows input/validation + decision + persistence/output + failure/result path for that capability. Keyword/path matches alone never produce L3 or L4. L5–L7 require runtime proof and are never awarded here.

Route-surface groups: 110 total = 103 CONFIRMED logic capabilities + 7 unresolved route-group candidates (see ## Unresolved Logic). Mount groups are route-surface candidates, not automatically logic units.

Section | Capabilities
--- | ---
Artifacts / Media | 5
Authentication / Authorization | 1
Curriculum / Assessment / Question Bank | 26
Learning Core | 6
Mastery / Objectives / Practice / Revision | 18
Memory / Evidence | 6
Operations / Reliability / Observability | 23
Safety / Privacy / Governance | 7
Teacher / School / Administration | 12
Voice / External Integrations | 6

## Authentication / Authorization

Enforcement observed on production mounts (`src/index.ts` mount middleware, R8-A route evidence) plus targeted route-source inspection (files unchanged):

- AUTHENTICATION: `schoolAuthMiddleware` on near-all production mounts (R8A_STRUCTURAL mount evidence); a small set of mounts (health, readiness, ops-public, copilot handoff, deployment-readiness, task024 operations) carry no mount middleware in R8-A evidence.
- SCHOOL CONTEXT: `requireVerifiedSchoolContext` on learner/session/evidence/teacher/governance/readiness mounts (R8A_STRUCTURAL mount evidence).
- ROLE AUTHORIZATION: NEVER inferred from URL prefix. Proven only by (a) `requireRole`/`resolveRequestRole` middleware or in-route role calls with 403 paths (SOURCE_INSPECTION, e.g. `src/routes/deploymentReadiness.ts:15`, `src/routes/voice.ts:36`, `src/routes/contentGovernance.ts:28-47`, `src/lib/rbac.ts:44-60`), or (b) accepted R1–R7 contracts where directly applicable. All other groups record AUTHORIZATION / ROLE SCOPE = UNRESOLVED.
- RESOURCE OWNERSHIP: UNRESOLVED statically; learner/school scoping is enforced at middleware + service layers per accepted R1–R7 behavior, referenced not re-proven.
- SAFETY/GOVERNANCE CHECK: governance mounts (`content-governance`, `security-privacy-governance`, `privacyGovernance`, `no-ai-bypass`) expose the check surfaces; decision internals are SOURCE_INSPECTION-confirmed only for `/api/content-governance` (proposeSource delegation), otherwise UNRESOLVED.
- URL shape is not authorization proof. The per-capability AUTHORIZATION row below cites its evidence kind.

## Learning Core

### LOGIC-learning-core-api-copilot-copilothandoffroutes

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#copilotHandoffRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `copilotHandoffRoutes` (direct, src/index.ts:197, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/copilotHandoff.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/externalStudentIdentityMapper.ts`, `src/services/schoolAuthBridgeContracts.ts`, `src/services/schoolAuthBridgeService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: `TutorLearnerIdentityMap` (family confirmation pending)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: structural models `TutorLearnerIdentityMap` (family confirmation pending)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryPostSimulationHandoffPacketService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/task031CopilotBootstrapSmokeService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:197); 02 dependency edges (src/routes/copilotHandoff.ts:3 imports src/services/copilotHandoffContracts.ts; src/routes/copilotHandoff.ts:2 imports src/services/copilotHandoffService.ts; src/routes/copilotHandoff.ts:4 imports src/utils/logger.ts; src/services/externalStudentIdentityMapper.ts:32 findUnique TutorLearnerIdentityMap (read/service)); 03 mount table + shared-prefix grouping

### LOGIC-learning-core-api-copilot-live-chat

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/live-chat` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/live-chat` via `liveChatRoutes` (direct, src/index.ts:183, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/liveChat.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/aiProviderGateway.ts`, `src/services/aiGateway/generationOutputValidationContracts.ts`, `src/services/aiGateway/generationOutputValidationService.ts`, `src/services/aiGateway/generationPolicyGate.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`; repos `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:183); 02 dependency edges (src/routes/liveChat.ts:10 imports src/routes/ai/ai-middleware.ts; src/routes/liveChat.ts:14 imports src/services/aiGateway/tutorMessageGenerationService.ts; src/routes/liveChat.ts:16 imports src/services/chatPipelineContracts.ts; src/routes/liveChat.ts:12 imports src/services/chatPipelineValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-learning-core-api-copilot-tutor-actions

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-actions` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/tutor-actions` via `tutorActionRoutes` (direct, src/index.ts:510, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorActionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/learnerNeedClassifierService.ts`, `src/services/tutorActionAccessPolicy.ts`, `src/services/tutorActionContextBuilder.ts`, `src/services/tutorActionDecisionService.ts`, `src/services/tutorActionPolicyService.ts`, `src/services/tutorActionPrivacyGuard.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSafetyService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSummaryService.ts`, `src/services/aiGateway/tutorMessageGenerationService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:510); 02 dependency edges (src/routes/tutorActionRoutes.ts:2 imports src/lib/tutorActionValidation.ts; src/routes/tutorActionRoutes.ts:6 imports src/services/tutorActionAccessPolicy.ts; src/routes/tutorActionRoutes.ts:3 imports src/services/tutorActionDecisionService.ts; src/routes/tutorActionRoutes.ts:5 imports src/services/tutorActionPrivacyGuard.ts); 03 mount table + shared-prefix grouping

### LOGIC-learning-core-api-copilot-tutor-state

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-state` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/tutor-state` via `tutorStateRoutes` (direct, src/index.ts:176, middleware: schoolAuthMiddleware); `/api/copilot/tutor-state` via `tutorStateV2Routes` (direct, src/index.ts:177, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorState.ts`, `src/routes/tutorStateEndpoint.ts`
- PRIMARY SERVICE(S): `src/services/artifactAwarePracticeResolver.ts`, `src/services/artifactContracts.ts`, `src/services/artifactService.ts`, `src/services/cacheScopeContracts.ts`, `src/services/cacheScopePolicyService.ts`, `src/services/intentResolverService.ts`
- REPOSITORY / DATA OWNER: family `artifacts-media` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearningArtifact`, `LearningArtifactBlock` → families `artifacts-media`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningArtifact, LearningArtifactBlock)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactAwarePracticeStateService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:176, src/index.ts:177); 02 dependency edges (src/routes/tutorState.ts:7 imports src/middleware/schoolAuthMiddleware.ts; src/routes/tutorState.ts:8 imports src/routes/ai/ai-middleware.ts; src/routes/tutorState.ts:19 imports src/services/tutorContextResolver.ts; src/routes/tutorState.ts:20 imports src/services/tutorStateContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-learning-core-api-copilot-tutor-turn

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-turn` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/tutor-turn` via `tutorTurnRuntimeRoutes` (direct, src/index.ts:534, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorTurnRuntimeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/tutorTurnRuntimeAccessPolicy.ts`, `src/services/tutorTurnRuntimeContextBuilder.ts`, `src/services/tutorTurnRuntimeDispatcher.ts`, `src/services/tutorTurnRuntimeEvidenceBridge.ts`, `src/services/tutorTurnRuntimeIntentResolver.ts`, `src/services/tutorTurnRuntimeModeRouter.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactReasoningTutorContextBridge.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:534); 02 dependency edges (src/routes/tutorTurnRuntimeRoutes.ts:3 imports src/lib/tutorTurnRuntimeValidation.ts; src/routes/tutorTurnRuntimeRoutes.ts:12 imports src/services/tutorTurnRuntimeAccessPolicy.ts; src/routes/tutorTurnRuntimeRoutes.ts:11 imports src/services/tutorTurnRuntimePrivacyGuard.ts); 03 mount table + shared-prefix grouping

### LOGIC-learning-core-api-tutor-tutorconversationroutes

- DOMAIN: learning-core
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/tutor#tutorConversationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/tutor` via `tutorConversationRoutes` (direct, src/index.ts:201, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorConversation.ts`
- PRIMARY SERVICE(S): `src/services/backendHealthService.ts`, `src/services/backendReadinessService.ts`, `src/services/endToEndLearningLoopRuntime.ts`, `src/services/studentLearningSessionContracts.ts`, `src/services/studentLearningSessionStateRepository.ts`, `src/services/task017Contracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactReasoningTutorContextBridge.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:201); 02 dependency edges (src/routes/tutorConversation.ts:3 imports src/middleware/schoolAuthMiddleware.ts; src/routes/tutorConversation.ts:8 imports src/services/task017Contracts.ts; src/routes/tutorConversation.ts:9 imports src/services/task017ConversationRuntimeErrorMapper.ts; src/routes/tutorConversation.ts:4 imports src/services/task017TutorConversationApiRuntime.ts); 03 mount table + shared-prefix grouping

## Memory / Evidence

### LOGIC-memory-api-copilot-evidence

- DOMAIN: memory
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/evidence` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/evidence` via `createLearningEvidenceRouter` (factory, src/index.ts:545, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseEvidenceBundleService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseEvidenceBundleService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:545); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-memory-api-copilot-learner-memory

- DOMAIN: memory
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learner-memory` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learner-memory` via `learnerMemoryRoutes` (direct, src/index.ts:179, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerMemory.ts`
- PRIMARY SERVICE(S): `src/services/learnerMemoryContracts.ts`, `src/services/learnerMemoryReducer.ts`, `src/services/learnerMemoryResolver.ts`, `src/services/learnerMemoryService.ts`, `src/services/learnerMemoryValidation.ts`, `src/services/learningEventService.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence (structural model link); family `learning-evidence` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearnerMemoryItem`, `LearningEvent` → families `learner-memory`, `learning-evidence`
- INPUT / VALIDATION: SOURCE-CONFIRMED input validation (src/routes/learnerMemory.ts:11-19, src/routes/learnerMemory.ts:53,81,111, src/routes/learnerMemory.ts:64-71,94-101)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: handler consumes verified req.schoolId/req.user set by mount schoolAuthMiddleware + requireVerifiedSchoolContext (src/index.ts:179); identity helper lines 26-38 + `requireVerifiedSchoolContext` school-context enforcement (mount evidence)
- CORE DECISION LOGIC: SOURCE-CONFIRMED: src/routes/learnerMemory.ts:11-19 imports learnerMemoryValidation schemas + learnerMemoryService + learnerMemoryResolver | src/routes/learnerMemory.ts:53,81,111 zod schema.parse input validation per handler (GET query, POST /events body, POST /resolve body) | src/routes/learnerMemory.ts:54,86,112 decision delegation: listLearnerMemory, recordLearningEventAndMemory, resolveLearnerMemoryContext | src/routes/learnerMemory.ts:64-71,94-101 failure paths: ZodError→400 VALIDATION_ERROR, 401 UNAUTHENTICATED, 500 INTERNAL_ERROR | src/services/learnerMemoryService.ts:503,505,731,767 $transaction wrapper; tx.learningEvent.create; tx.learnerMemoryItem.create/update (persistence effect)
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: LearnerMemoryItem); `learning-evidence`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningEvent)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: SOURCE-CONFIRMED failure/result paths (src/routes/learnerMemory.ts:64-71,94-101)
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts`, `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`; repos `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`
- COMPLETENESS: L4 (SOURCE_INSPECTION: src/routes/learnerMemory.ts:11-19; src/routes/learnerMemory.ts:53,81,111; src/routes/learnerMemory.ts:54,86,112; src/routes/learnerMemory.ts:64-71,94-101; src/services/learnerMemoryService.ts:503,505,731,767)
- CONFIDENCE: medium-high (source-confirmed coherent path; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS + SOURCE_INSPECTION; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:179); 02 dependency edges (src/routes/learnerMemory.ts:8 imports src/routes/ai/ai-middleware.ts; src/routes/learnerMemory.ts:19 imports src/services/learnerMemoryResolver.ts; src/routes/learnerMemory.ts:18 imports src/services/learnerMemoryService.ts; src/routes/learnerMemory.ts:11 imports src/services/learnerMemoryValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-memory-api-copilot-learner-transparency

- DOMAIN: memory
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learner-transparency` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learner-transparency` via `learnerTransparencyRoutes` (direct, src/index.ts:553, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerTransparencyRoutes.ts`
- PRIMARY SERVICE(S): `src/services/learnerDeenReferralExplanationService.ts`, `src/services/learnerHiddenReasoningBoundaryGuard.ts`, `src/services/learnerSafeguardingBoundaryNoticeService.ts`, `src/services/learnerTransparencyAccessPolicy.ts`, `src/services/learnerTransparencyAuditService.ts`, `src/services/learnerTransparencyPrivacyGuard.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/copilotHandoffContracts.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:553); 02 dependency edges (src/routes/learnerTransparencyRoutes.ts:39 imports src/contracts/learnerTransparencyContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-memory-api-copilot-learning-evidence

- DOMAIN: memory
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learning-evidence` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learning-evidence` via `safeLearningEvidenceRoutes` (direct, src/index.ts:538, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/safeLearningEvidenceRoutes.ts`
- PRIMARY SERVICE(S): `src/services/safeLearningEvidenceAccessPolicy.ts`, `src/services/safeLearningEvidenceAggregateService.ts`, `src/services/safeLearningEvidenceIdempotencyService.ts`, `src/services/safeLearningEvidenceIngestionService.ts`, `src/services/safeLearningEvidenceLearnerViewService.ts`, `src/services/safeLearningEvidencePrivacyGuard.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseEvidenceBundleService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:538); 02 dependency edges (src/routes/safeLearningEvidenceRoutes.ts:14 imports src/contracts/safeLearningEvidenceContracts.ts; src/routes/safeLearningEvidenceRoutes.ts:13 imports src/lib/safeLearningEvidenceValidation.ts; src/routes/safeLearningEvidenceRoutes.ts:12 imports src/services/safeLearningEvidenceAccessPolicy.ts; src/routes/safeLearningEvidenceRoutes.ts:5 imports src/services/safeLearningEvidenceAggregateService.ts); 03 mount table + shared-prefix grouping

### LOGIC-memory-api-copilot-teacher-insights

- DOMAIN: memory
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/teacher-insights` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/teacher-insights` via `teacherSafeInsightRoutes` (direct, src/index.ts:549, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teacherSafeInsightRoutes.ts`
- PRIMARY SERVICE(S): `src/services/teacherSafeClassSummaryService.ts`, `src/services/teacherSafeDashboardEvidenceService.ts`, `src/services/teacherSafeInsightAccessPolicy.ts`, `src/services/teacherSafeInsightEvidenceReader.ts`, `src/services/teacherSafeInsightNoiseFilter.ts`, `src/services/teacherSafeInsightPrivacyGuard.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:549); 02 dependency edges (src/routes/teacherSafeInsightRoutes.ts:14 imports src/contracts/teacherSafeInsightContracts.ts; src/routes/teacherSafeInsightRoutes.ts:7 imports src/services/teacherSafeClassSummaryService.ts; src/routes/teacherSafeInsightRoutes.ts:11 imports src/services/teacherSafeDashboardEvidenceService.ts; src/routes/teacherSafeInsightRoutes.ts:2 imports src/services/teacherSafeInsightAccessPolicy.ts); 03 mount table + shared-prefix grouping

### LOGIC-memory-api-question-bank-result-learning-evidence

- DOMAIN: memory
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-learning-evidence` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-learning-evidence` via `resultLearningEvidenceRoutes` (direct, src/index.ts:406, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultLearningEvidence.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService.ts`, `src/domains/assessment/result-learning-evidence/services/resultLearningEvidenceAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/contracts/masteryMutationContracts.ts`, `src/domains/assessment/result-learning-evidence/contracts/objectiveImpactContracts.ts`, `src/domains/assessment/result-learning-evidence/contracts/resultEvidenceBridgeContracts.ts`, `src/domains/assessment/result-learning-evidence/contracts/resultLearningEvidenceProjectionContracts.ts`, `src/domains/assessment/result-learning-evidence/contracts/resultLearningEvidenceRepositoryContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:406); 02 dependency edges (src/routes/resultLearningEvidence.ts:12 imports src/domains/assessment/result-learning-evidence/policies/resultLearningEvidencePolicyDefinitions.ts; src/routes/resultLearningEvidence.ts:14 imports src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts); 03 mount table + shared-prefix grouping

## Mastery / Objectives / Practice / Revision

### LOGIC-mastery-api-copilot-adaptive-challenges

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/adaptive-challenges` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/adaptive-challenges` via `adaptiveChallengeTask015Routes` (direct, src/index.ts:562, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveChallengeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengeGenerationRuntime.ts`, `src/services/adaptiveChallengePrivacyGuard.ts`, `src/services/adaptiveChallengeRepository.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `AdaptiveChallengeRecord`, `DurableAuditEvent`, `RemediationPathRecord` → families `practice`, `safeguarding-privacy`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: AdaptiveChallengeRecord, RemediationPathRecord); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: DurableAuditEvent)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/studentChallengeService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:562); 02 dependency edges (src/routes/adaptiveChallengeRoutes.ts:2 imports src/lib/adaptiveChallengeValidation.ts; src/routes/adaptiveChallengeRoutes.ts:4 imports src/services/adaptiveChallengeAccessPolicy.ts; src/routes/adaptiveChallengeRoutes.ts:11 imports src/services/adaptiveChallengeAuditService.ts; src/routes/adaptiveChallengeRoutes.ts:13 imports src/services/adaptiveChallengeGenerationRuntime.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-adaptive-recommendations

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/adaptive-recommendations` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/adaptive-recommendations` via `adaptiveRecommendationTuningRoutes` (direct, src/index.ts:557, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveRecommendationTuningRoutes.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveRecommendationProfileService.ts`, `src/services/adaptiveRecommendationSourceTruthPolicy.ts`, `src/services/adaptiveRecommendationTuningAccessPolicy.ts`, `src/services/adaptiveRecommendationTuningAuditService.ts`, `src/services/adaptiveRecommendationTuningPrivacyGuard.ts`, `src/services/adaptiveRecommendationTuningResponseBuilder.ts`
- REPOSITORY / DATA OWNER: family `student-identity-context` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearnerPreferenceFeedbackRecord` → families `student-identity-context`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `student-identity-context`: SHARED_BY_DESIGN (PRISMA_WRITE_ACCESS structural link: LearnerPreferenceFeedbackRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:557); 02 dependency edges (src/routes/adaptiveRecommendationTuningRoutes.ts:19 imports src/contracts/adaptiveRecommendationTuningContracts.ts; src/routes/adaptiveRecommendationTuningRoutes.ts:4 imports src/lib/adaptiveRecommendationTuningValidation.ts; src/routes/adaptiveRecommendationTuningRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/services/learnerPreferenceFeedbackRepository.ts:60 create LearnerPreferenceFeedbackRecord (write/service)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-exam-mode

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/exam-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/exam-mode` via `examModeRoutes` (direct, src/index.ts:516, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/examModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/examModeAccessPolicy.ts`, `src/services/examModeAnswerProtectionPolicyService.ts`, `src/services/examModeAttemptService.ts`, `src/services/examModePrivacyGuard.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `ExamModeAttemptRecord`, `ExamModeQuestionStateRecord`, `ExamModeSessionRecord`, `ExamModeSummaryRecord`, `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSession` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: ExamModeAttemptRecord, ExamModeQuestionStateRecord, ExamModeSessionRecord, ExamModeSummaryRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`; repos `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:516); 02 dependency edges (src/routes/examModeRoutes.ts:46 imports src/lib/examModeValidation.ts; src/routes/examModeRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/services/examModeAttemptService.ts:27 create ExamModeAttemptRecord (write/service); src/services/examModeAttemptService.ts:104 findMany ExamModeAttemptRecord (read/service)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-focus-mode

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/focus-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/focus-mode` via `focusModeRoutes` (direct, src/index.ts:513, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/focusModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/focusModeAccessPolicy.ts`, `src/services/focusModeAttemptService.ts`, `src/services/focusModeHintBridgeService.ts`, `src/services/focusModePrivacyGuard.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `FocusModeAttemptRecord`, `FocusModeSessionRecord`, `FocusModeStepRecord`, `FocusModeSummaryRecord`, `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSession` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: FocusModeAttemptRecord, FocusModeSessionRecord, FocusModeStepRecord, FocusModeSummaryRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/moderationService.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:513); 02 dependency edges (src/routes/focusModeRoutes.ts:17 imports src/lib/focusModeValidation.ts; src/routes/focusModeRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/focusModeRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts; src/routes/focusModeRoutes.ts:15 imports src/services/apiEnvelopeService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-growth

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/growth` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/growth` via `growthAggregateRoutes` (direct, src/index.ts:193, middleware: schoolAuthMiddleware); `/api/copilot/growth` via `growthActionRoutes` (direct, src/index.ts:530, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/growthActionRoutes.ts`, `src/routes/growthAggregate.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiMetadataService.ts`, `src/services/dataSourceTruthService.ts`, `src/services/growthActionAccessPolicy.ts`, `src/services/growthActionEvidenceService.ts`, `src/services/growthActionExecutionService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:193, src/index.ts:530); 02 dependency edges (src/routes/growthActionRoutes.ts:21 imports src/contracts/growthActionContracts.ts; src/routes/growthActionRoutes.ts:3 imports src/lib/growthActionValidation.ts; src/routes/growthActionRoutes.ts:11 imports src/services/growthActionAccessPolicy.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-practice-mastery

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/practice-mastery` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/practice-mastery` via `practiceMasteryRoutes` (direct, src/index.ts:180, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/practiceMastery.ts`
- PRIMARY SERVICE(S): `src/services/learnerMemoryReducer.ts`, `src/services/learnerMemoryService.ts`, `src/services/learningEventService.ts`, `src/services/masteryResolver.ts`, `src/services/masteryService.ts`, `src/services/misconceptionService.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence (structural model link); family `learning-evidence` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearnerMemoryItem`, `LearningEvent` → families `learner-memory`, `learning-evidence`
- INPUT / VALIDATION: SOURCE-CONFIRMED input validation (src/routes/practiceMastery.ts:14-28, src/routes/practiceMastery.ts:54,84,105,126,148,175,200, src/routes/practiceMastery.ts:67-77)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: SOURCE-CONFIRMED: src/routes/practiceMastery.ts:14-28 imports practiceMasteryValidation schemas + practiceAttemptService + masteryService + masteryResolver + nextPracticeService + spacedReviewService | src/routes/practiceMastery.ts:54,84,105,126,148,175,200 schema.parse input validation per endpoint (attempts, next, mastery, review-due) | src/routes/practiceMastery.ts:56,85,106,127 decision delegation: createPracticeAttempt, listPracticeAttempts, recommendNextPractice, listMasterySnapshots | src/routes/practiceMastery.ts:67-77 failure paths: validation 400 + service 500 per handler
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: LearnerMemoryItem); `learning-evidence`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningEvent)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: SOURCE-CONFIRMED failure/result paths (src/routes/practiceMastery.ts:67-77)
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`; repos none
- COMPLETENESS: L4 (SOURCE_INSPECTION: src/routes/practiceMastery.ts:14-28; src/routes/practiceMastery.ts:54,84,105,126,148,175,200; src/routes/practiceMastery.ts:56,85,106,127; src/routes/practiceMastery.ts:67-77)
- CONFIDENCE: medium-high (source-confirmed coherent path; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS + SOURCE_INSPECTION; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:180); 02 dependency edges (src/routes/practiceMastery.ts:8 imports src/middleware/schoolAuthMiddleware.ts; src/routes/practiceMastery.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/practiceMastery.ts:23 imports src/services/masteryResolver.ts; src/routes/practiceMastery.ts:22 imports src/services/masteryService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-quiz-mode

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/quiz-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/quiz-mode` via `quizModeRoutes` (direct, src/index.ts:519, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/quizModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningModeSessionService.ts`, `src/services/learningSignalService.ts`, `src/services/modeExitSummaryService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSession`, `LearningModeSignal`, `QuizModeAttemptRecord`, `QuizModeQuestionStateRecord`, `QuizModeSessionRecord` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningModeAttempt, LearningModeExitSummary, LearningModeHintEvent, LearningModeSession)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/moderationService.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:519); 02 dependency edges (src/routes/quizModeRoutes.ts:54 imports src/lib/quizModeValidation.ts; src/routes/quizModeRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/services/learningAttemptService.ts:21 create LearningModeAttempt (write/service); src/services/learningAttemptService.ts:41 findMany LearningModeAttempt (read/service)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-remediation

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/remediation` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/remediation` via `remediationTask015Routes` (direct, src/index.ts:563, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/remediationRoutes.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengePrivacyGuard.ts`, `src/services/adaptiveChallengeResponseBuilder.ts`, `src/services/noFakeChallengeReadinessGuard.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `DurableAuditEvent`, `RemediationPathRecord` → families `practice`, `safeguarding-privacy`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: RemediationPathRecord); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: DurableAuditEvent)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:563); 02 dependency edges (src/routes/remediationRoutes.ts:2 imports src/lib/adaptiveChallengeValidation.ts; src/routes/remediationRoutes.ts:4 imports src/services/adaptiveChallengeAccessPolicy.ts; src/routes/remediationRoutes.ts:9 imports src/services/adaptiveChallengeAuditService.ts; src/routes/remediationRoutes.ts:3 imports src/services/adaptiveChallengePrivacyGuard.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-revision-mode

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/revision-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/revision-mode` via `revisionModeRoutes` (direct, src/index.ts:526, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/revisionModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/revisionModeAccessPolicy.ts`, `src/services/revisionModeAttemptService.ts`, `src/services/revisionModeItemStateService.ts`, `src/services/revisionModeModeBridgeService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `RevisionModeAttemptRecord`, `RevisionModeItemStateRecord`, `RevisionModeQueueRecord`, `RevisionModeSessionRecord`, `RevisionModeSummaryRecord` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: RevisionModeAttemptRecord, RevisionModeItemStateRecord, RevisionModeQueueRecord, RevisionModeSessionRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/result-learning-evidence/services/revisionSignalDispatchService.ts`, `src/services/aiGateway/modelProviderContracts.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:526); 02 dependency edges (src/routes/revisionModeRoutes.ts:64 imports src/lib/revisionModeValidation.ts; src/services/revisionModeAttemptService.ts:28 create RevisionModeAttemptRecord (write/service); src/services/revisionModeAttemptService.ts:60 findMany RevisionModeAttemptRecord (read/service); src/services/revisionModeItemStateService.ts:15 create RevisionModeItemStateRecord (write/service)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-copilot-teach-back-mode

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/teach-back-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/teach-back-mode` via `teachBackModeRoutes` (direct, src/index.ts:522, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teachBackModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningModeSessionService.ts`, `src/services/learningSignalService.ts`, `src/services/teachBackModeAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearningModeAttempt`, `LearningModeSession`, `LearningModeSignal`, `TeachBackModeAttemptRecord`, `TeachBackModePromptStateRecord`, `TeachBackModeSessionRecord`, `TeachBackModeSummaryRecord` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningModeAttempt, LearningModeSession, LearningModeSignal, TeachBackModeAttemptRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`; repos `src/repositories/task040BackendFreezeRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:522); 02 dependency edges (src/routes/teachBackModeRoutes.ts:50 imports src/lib/teachBackModeValidation.ts; src/routes/teachBackModeRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/services/learningAttemptService.ts:21 create LearningModeAttempt (write/service); src/services/learningAttemptService.ts:41 findMany LearningModeAttempt (read/service)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-learner-adaptivechallengeroutes

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/learner#adaptiveChallengeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `adaptiveChallengeRoutes` (direct, src/index.ts:202, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveChallenges.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengeGenerationRuntime.ts`, `src/services/adaptiveChallengeRepository.ts`, `src/services/challengeAttemptIntegrationService.ts`, `src/services/challengeBlueprintService.ts`
- REPOSITORY / DATA OWNER: family `curriculum-content` writer evidence (structural model link); family `practice` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `AdaptiveChallengeRecord`, `DifficultyCalibrationRecord`, `DurableAuditEvent`, `RemediationPathRecord` → families `curriculum-content`, `practice`, `safeguarding-privacy`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: DifficultyCalibrationRecord); `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: AdaptiveChallengeRecord, RemediationPathRecord); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: DurableAuditEvent)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/studentChallengeService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengePrivacyGuard.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:202); 02 dependency edges (src/routes/adaptiveChallenges.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/adaptiveChallenges.ts:10 imports src/services/adaptiveChallengeAuditService.ts; src/routes/adaptiveChallenges.ts:3 imports src/services/adaptiveChallengeGenerationRuntime.ts; src/routes/adaptiveChallenges.ts:4 imports src/services/adaptiveChallengeRepository.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-confidence-recovery

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/confidence-recovery` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/confidence-recovery` via `phase3ConfidenceRecoveryRoutes` (direct, src/index.ts:593, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ConfidenceRecoveryRoutes.ts`
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-case-adjudication/services/index.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationAuditBridge.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationIdempotencyService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-case-adjudication/services/index.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationAuditBridge.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationIdempotencyService.ts`; repos `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:593); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-daily-learning-feed

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/daily-learning-feed` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/daily-learning-feed` via `phase3DailyLearningFeedRoutes` (direct, src/index.ts:577, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3DailyLearningFeedRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3DailyLearningFeedAuditService.ts`, `src/services/phase3DailyLearningFeedLearnerResponseService.ts`, `src/services/phase3DailyLearningFeedRankingService.ts`, `src/services/phase3DailyLearningFeedService.ts`, `src/services/phase3DailyLearningFeedSourceTruthService.ts`, `src/services/phase3DailyLearningFeedTeacherOverviewService.ts`
- REPOSITORY / DATA OWNER: family `curriculum-content` writer evidence (structural model link); family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `CurriculumSkillRecord`, `CurriculumTopicRecord`, `LearningObjectiveRecord`, `dailyObjectiveCheckAttemptRecord`, `dailyObjectiveCheckCompletionIdempotencyRecord`, `dailyObjectiveCheckConfidenceRecord`, `dailyObjectiveCheckSessionRecord` → families `curriculum-content`, `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CurriculumSkillRecord, CurriculumTopicRecord); `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningObjectiveRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:577); 02 dependency edges (src/routes/phase3DailyLearningFeedRoutes.ts:5 imports src/lib/phase3DailyLearningFeedValidation.ts; src/routes/phase3DailyLearningFeedRoutes.ts:4 imports src/services/phase3DailyLearningFeedAuditService.ts; src/routes/phase3DailyLearningFeedRoutes.ts:2 imports src/services/phase3DailyLearningFeedService.ts; src/routes/phase3DailyLearningFeedRoutes.ts:3 imports src/services/phase3DailyLearningFeedTeacherOverviewService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-daily-objective-checks

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/daily-objective-checks` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/daily-objective-checks` via `phase3DailyObjectiveCheckRoutes` (direct, src/index.ts:573, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3DailyObjectiveCheckRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3DailyObjectiveCheckAttemptService.ts`, `src/services/phase3DailyObjectiveCheckAuditService.ts`, `src/services/phase3DailyObjectiveCheckCompletionService.ts`, `src/services/phase3DailyObjectiveCheckRepository.ts`, `src/services/phase3DailyObjectiveCheckSessionService.ts`, `src/services/phase3DailyObjectiveConfidenceService.ts`
- REPOSITORY / DATA OWNER: family `curriculum-content` writer evidence (structural model link); family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `CurriculumSkillRecord`, `CurriculumTopicRecord`, `LearningObjectiveRecord`, `dailyObjectiveCheckAttemptRecord`, `dailyObjectiveCheckCompletionIdempotencyRecord`, `dailyObjectiveCheckConfidenceRecord`, `dailyObjectiveCheckSessionRecord` → families `curriculum-content`, `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CurriculumSkillRecord, CurriculumTopicRecord); `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningObjectiveRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts`; repos `src/services/contentGovernance/repositories/prismaLearningObjectiveRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:573); 02 dependency edges (src/routes/phase3DailyObjectiveCheckRoutes.ts:10 imports src/lib/phase3DailyObjectiveCheckValidation.ts; src/routes/phase3DailyObjectiveCheckRoutes.ts:5 imports src/services/phase3DailyObjectiveCheckAttemptService.ts; src/routes/phase3DailyObjectiveCheckRoutes.ts:7 imports src/services/phase3DailyObjectiveCheckAuditService.ts; src/routes/phase3DailyObjectiveCheckRoutes.ts:6 imports src/services/phase3DailyObjectiveCheckCompletionService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-growth-page

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/growth-page` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/growth-page` via `phase3GrowthPageRoutes` (direct, src/index.ts:585, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3GrowthPageRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3GrowthPageAuditService.ts`, `src/services/phase3GrowthPageDailyFeedAdapterService.ts`, `src/services/phase3GrowthPageDueNowService.ts`, `src/services/phase3GrowthPageEvidenceAdapterService.ts`, `src/services/phase3GrowthPageLearnerResponseService.ts`, `src/services/phase3GrowthPageReadModelService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/services/growthActionAccessPolicy.ts`, `src/services/growthActionEvidenceService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:585); 02 dependency edges (src/routes/phase3GrowthPageRoutes.ts:2 imports src/lib/phase3GrowthPageValidation.ts; src/routes/phase3GrowthPageRoutes.ts:11 imports src/middleware/schoolAuthMiddleware.ts; src/routes/phase3GrowthPageRoutes.ts:12 imports src/middleware/schoolContextGuardMiddleware.ts; src/routes/phase3GrowthPageRoutes.ts:9 imports src/services/phase3GrowthPageAuditService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-living-revision

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/living-revision` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/living-revision` via `phase3LivingRevisionRoutes` (direct, src/index.ts:589, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3LivingRevisionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3LivingRevisionRepository.ts`, `src/services/phase3RevisionAuditService.ts`, `src/services/phase3RevisionDueResolverService.ts`, `src/services/phase3RevisionEdgeService.ts`, `src/services/phase3RevisionLearnerResponseService.ts`, `src/services/phase3RevisionNodeService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/revisionSignalDispatchService.ts`, `src/services/mastery/revisionSchedulingRuntime.ts`, `src/services/phase3ConfidenceCalibrationService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:589); 02 dependency edges (src/routes/phase3LivingRevisionRoutes.ts:10 imports src/lib/phase3LivingRevisionValidation.ts; src/routes/phase3LivingRevisionRoutes.ts:2 imports src/services/phase3LivingRevisionRepository.ts; src/routes/phase3LivingRevisionRoutes.ts:9 imports src/services/phase3RevisionAuditService.ts; src/routes/phase3LivingRevisionRoutes.ts:6 imports src/services/phase3RevisionDueResolverService.ts); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-objectives

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/objectives` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/objectives` via `phase3ObjectiveMasteryRoutes` (direct, src/index.ts:569, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ObjectiveMasteryRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/learning-evidence/services/learningEvidenceCommandService.ts`, `src/domains/learning-evidence/services/learningEvidencePrivacyGuard.ts`, `src/services/phase3DailyObjectiveSeedService.ts`, `src/services/phase3LearnerObjectiveProgressService.ts`, `src/services/phase3ObjectiveAuditService.ts`, `src/services/phase3ObjectiveCheckBlueprintService.ts`
- REPOSITORY / DATA OWNER: `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `CanonicalMasteryChangeRecord`, `CanonicalMasteryEvidenceApplicationRecord`, `CanonicalMasteryStateRecord`, `CommittedLearningEvidenceProjection`, `CurriculumSkillRecord`, `CurriculumTopicRecord`, `LearningEvidenceCandidateProjection`, `LearningEvidenceEvent` → families `curriculum-content`, `learning-evidence`, `mastery`, `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CurriculumSkillRecord, CurriculumTopicRecord); `learning-evidence`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CanonicalMasteryEvidenceApplicationRecord, CommittedLearningEvidenceProjection, LearningEvidenceCandidateProjection, LearningEvidenceEvent); `mastery`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CanonicalMasteryChangeRecord, CanonicalMasteryStateRecord); `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningObjectiveRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts`, `src/services/artifactLearningObjectiveService.ts`, `src/services/phase3ConfidenceCalibrationService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:569); 02 dependency edges (src/routes/phase3ObjectiveMasteryRoutes.ts:19 imports src/contracts/phase3ObjectiveMasteryContracts.ts; src/routes/phase3ObjectiveMasteryRoutes.ts:10 imports src/lib/phase3ObjectiveMasteryValidation.ts; src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts:24 create LearningEvidenceEvent (write/repository); src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts:59 upsert LearningEvidenceStream (write/repository)); 03 mount table + shared-prefix grouping

### LOGIC-mastery-api-phase3-study-plans

- DOMAIN: mastery
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/study-plans` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/study-plans` via `phase3StudyPlanRoutes` (direct, src/index.ts:581, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3StudyPlanRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiMetadataService.ts`, `src/services/learningIntelligenceIntegrationService.ts`, `src/services/mediaAssetService.ts`, `src/services/probabilisticMasteryRepository.ts`, `src/services/revisionLearningService.ts`
- REPOSITORY / DATA OWNER: family `learning-evidence` writer evidence (structural model link); family `mastery` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `CanonicalMasteryChangeRecord`, `CanonicalMasteryEvidenceApplicationRecord`, `CanonicalMasteryStateRecord` → families `learning-evidence`, `mastery`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learning-evidence`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CanonicalMasteryEvidenceApplicationRecord); `mastery`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: CanonicalMasteryChangeRecord, CanonicalMasteryStateRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeRollbackPlanService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionSimulationPlanService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryRetryPlanService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:581); 02 dependency edges (src/routes/phase3StudyPlanRoutes.ts:15 imports src/middleware/schoolAuthMiddleware.ts; src/routes/phase3StudyPlanRoutes.ts:29 imports src/services/apiEnvelopeService.ts; src/routes/phase3StudyPlanRoutes.ts:30 imports src/services/apiMetadataService.ts; src/routes/phase3StudyPlanRoutes.ts:28 imports src/services/learningIntelligenceIntegrationService.ts); 03 mount table + shared-prefix grouping

## Artifacts / Media

### LOGIC-artifacts-api-copilot-artifacts

- DOMAIN: artifacts
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/artifacts` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/artifacts` via `artifactRoutes` (direct, src/index.ts:178, middleware: schoolAuthMiddleware); `/api/copilot/artifacts` via `artifactAwarePracticeRoutes` (direct, src/index.ts:190, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/artifactAwarePractice.ts`, `src/routes/artifacts.ts`
- PRIMARY SERVICE(S): `src/services/artifactAwareAnswerEvaluator.ts`, `src/services/artifactAwareMisconceptionService.ts`, `src/services/artifactAwarePracticeContracts.ts`, `src/services/artifactAwarePracticeDecisionService.ts`, `src/services/artifactAwarePracticeEventService.ts`, `src/services/artifactAwarePracticeGenerator.ts`
- REPOSITORY / DATA OWNER: family `artifacts-media` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearningArtifact`, `LearningArtifactBlock` → families `artifacts-media`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningArtifact, LearningArtifactBlock)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/artifactSafeSummaryService.ts`, `src/services/artifactSafetyGuardService.ts`, `src/services/artifactService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:178, src/index.ts:190); 02 dependency edges (src/routes/artifactAwarePractice.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/artifactAwarePractice.ts:26 imports src/services/artifactAwareAnswerEvaluator.ts; src/routes/artifactAwarePractice.ts:29 imports src/services/artifactAwareMisconceptionService.ts; src/routes/artifactAwarePractice.ts:27 imports src/services/artifactAwarePracticeDecisionService.ts); 03 mount table + shared-prefix grouping

### LOGIC-artifacts-api-copilot-videoawarepracticeroutes

- DOMAIN: artifacts
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoAwarePracticeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoAwarePracticeRoutes` (direct, src/index.ts:186, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoAwarePractice.ts`
- PRIMARY SERVICE(S): `src/services/learnerMemoryResolver.ts`, `src/services/learningEventService.ts`, `src/services/masteryResolver.ts`, `src/services/tutorStateContracts.ts`, `src/services/tutorStateService.ts`, `src/services/videoAwareAnswerEvaluator.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-recovery/services/resultRecoveryPracticeDraftService.ts`, `src/services/aiGateway/deenAwareGenerationService.ts`, `src/services/aiGateway/policyAwarePromptBuilder.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:186); 02 dependency edges (src/routes/videoAwarePractice.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/videoAwarePractice.ts:10 imports src/services/tutorStateContracts.ts; src/routes/videoAwarePractice.ts:25 imports src/services/videoAwareAnswerEvaluator.ts; src/routes/videoAwarePractice.ts:28 imports src/services/videoAwareMisconceptionService.ts); 03 mount table + shared-prefix grouping

### LOGIC-artifacts-api-copilot-videolearningsessionroutes

- DOMAIN: artifacts
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoLearningSessionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoLearningSessionRoutes` (direct, src/index.ts:185, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoLearningSessions.ts`
- PRIMARY SERVICE(S): `src/services/learningEventService.ts`, `src/services/tutorStateContracts.ts`, `src/services/tutorStateService.ts`, `src/services/videoLearningCheckpointService.ts`, `src/services/videoLearningFollowUpService.ts`, `src/services/videoLearningSessionContracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:185); 02 dependency edges (src/routes/videoLearningSessions.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/videoLearningSessions.ts:10 imports src/services/tutorStateContracts.ts; src/routes/videoLearningSessions.ts:35 imports src/services/videoLearningCheckpointService.ts; src/routes/videoLearningSessions.ts:40 imports src/services/videoLearningFollowUpService.ts); 03 mount table + shared-prefix grouping

### LOGIC-artifacts-api-copilot-videorecommendationroutes

- DOMAIN: artifacts
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoRecommendationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoRecommendationRoutes` (direct, src/index.ts:184, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoRecommendations.ts`
- PRIMARY SERVICE(S): `src/services/videoAgeSuitabilityService.ts`, `src/services/videoDurationSuitabilityService.ts`, `src/services/videoIslamicAppropriatenessService.ts`, `src/services/videoLanguageSuitabilityService.ts`, `src/services/videoLearnerFitScorer.ts`, `src/services/videoMetadataService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:184); 02 dependency edges (src/routes/videoRecommendations.ts:13 imports src/services/videoPolicyService.ts; src/routes/videoRecommendations.ts:14 imports src/services/videoRankingService.ts; src/routes/videoRecommendations.ts:12 imports src/services/videoRecommendationEventService.ts; src/routes/videoRecommendations.ts:11 imports src/services/videoRecommendationService.ts); 03 mount table + shared-prefix grouping

### LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes

- DOMAIN: artifacts
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/video-learning-analytics#videoLearningAnalyticsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/video-learning-analytics` via `videoLearningAnalyticsRoutes` (direct, src/index.ts:187, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoLearningAnalytics.ts`
- PRIMARY SERVICE(S): `src/services/tutorStateContracts.ts`, `src/services/tutorStateService.ts`, `src/services/videoEffectivenessScoringService.ts`, `src/services/videoLearnerSafeAnalyticsResponseBuilder.ts`, `src/services/videoLearningAnalyticsAggregationService.ts`, `src/services/videoLearningAnalyticsContracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:187); 02 dependency edges (src/routes/videoLearningAnalytics.ts:8 imports src/routes/ai/ai-middleware.ts; src/routes/videoLearningAnalytics.ts:9 imports src/services/tutorStateContracts.ts; src/routes/videoLearningAnalytics.ts:14 imports src/services/videoEffectivenessScoringService.ts; src/routes/videoLearningAnalytics.ts:13 imports src/services/videoLearnerSafeAnalyticsResponseBuilder.ts); 03 mount table + shared-prefix grouping

## Curriculum / Assessment / Question Bank

### LOGIC-question-bank-api-content-governance-contentgovernanceroutes

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/content-governance#contentGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/content-governance` via `contentGovernanceRoutes` (direct, src/index.ts:213, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/contentGovernance.ts`
- PRIMARY SERVICE(S): `src/services/task022ApprovedSourceRegistryService.ts`, `src/services/task022ContentGapDetectionService.ts`, `src/services/task022ContentGovernanceAuditService.ts`, `src/services/task022ContentGovernanceContracts.ts`, `src/services/task022ContentGovernanceDiagnosticsService.ts`, `src/services/task022ContentGroundingService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: SOURCE-CONFIRMED input validation (see paths)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: explicit in-route role check requireRole(req,res,TEACHER_ADMIN_ROLES) → 403; role source req.user.role (line 17-20). Not URL-prefix inference. + `requireVerifiedSchoolContext` school-context enforcement (mount evidence)
- CORE DECISION LOGIC: SOURCE-CONFIRMED: src/routes/contentGovernance.ts:25-31 local requireRole(req,res,allowedRoles) with 403 Forbidden on mismatch; TEACHER_ADMIN_ROLES constant | src/routes/contentGovernance.ts:47,71,87,153,176 per-endpoint TEACHER_ADMIN_ROLES enforcement before any mutation | src/routes/contentGovernance.ts:203-210 decision delegation: sourceApprovalWorkflowService.proposeSource with referralRole output
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: SOURCE-CONFIRMED failure/result paths (src/routes/contentGovernance.ts:25-31)
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/question-bank/services/questionContentSafetyReviewBridge.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- COMPLETENESS: L4 (SOURCE_INSPECTION: src/routes/contentGovernance.ts:25-31; src/routes/contentGovernance.ts:47,71,87,153,176; src/routes/contentGovernance.ts:203-210)
- CONFIDENCE: medium-high (source-confirmed coherent path; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + SOURCE_INSPECTION; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:213); 02 dependency edges (src/routes/contentGovernance.ts:4 imports src/services/task022ApprovedSourceRegistryService.ts; src/routes/contentGovernance.ts:7 imports src/services/task022ContentGapDetectionService.ts; src/routes/contentGovernance.ts:11 imports src/services/task022ContentGovernanceAuditService.ts; src/routes/contentGovernance.ts:12 imports src/services/task022ContentGovernanceContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-learningmoderoutes

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#learningModeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `learningModeRoutes` (direct, src/index.ts:506, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learningModeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/apiScopeGuardService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningHintTrackingService.ts`, `src/services/learningModeAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSession`, `LearningModeSignal` → families `objectives`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningModeAttempt, LearningModeExitSummary, LearningModeHintEvent, LearningModeSession)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:506); 02 dependency edges (src/routes/learningModeRoutes.ts:14 imports src/lib/learningModeValidation.ts; src/routes/learningModeRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/learningModeRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts; src/services/learningAttemptService.ts:21 create LearningModeAttempt (write/service)); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-exam-delivery

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/exam-delivery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/exam-delivery` via `examDeliveryRoutes` (direct, src/index.ts:388, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/examDelivery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryAuditBridge.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/contracts/examAnswerSubmissionContracts.ts`, `src/domains/assessment/exam-delivery/contracts/examAttemptContracts.ts`, `src/domains/assessment/exam-delivery/contracts/examDeliveryContracts.ts`, `src/domains/assessment/exam-delivery/contracts/examDeliveryRepositoryContracts.ts`, `src/domains/assessment/exam-delivery/contracts/examDeliverySessionContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`; repos `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:388); 02 dependency edges (src/routes/examDelivery.ts:14 imports src/domains/assessment/exam-delivery/contracts/examDeliveryContracts.ts; src/routes/examDelivery.ts:3 imports src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts; src/routes/examDelivery.ts:9 imports src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts; src/routes/examDelivery.ts:8 imports src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-exam-papers

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/exam-papers` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/exam-papers` via `composedExamPaperRouter` (factory, src/index.ts:384, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`; repos `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:384); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-examblueprintroutes

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank#examBlueprintRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank` via `examBlueprintRoutes` (direct, src/index.ts:364, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/examBlueprint.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts`, `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/repositories/inMemoryAssessmentRepositories.ts`, `src/domains/assessment/contracts/assessmentAuditContracts.ts`, `src/domains/assessment/contracts/assessmentCommandContext.ts`, `src/domains/assessment/contracts/assessmentConcurrencyContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services none; repos `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:364); 02 dependency edges (src/routes/examBlueprint.ts:3 imports src/domains/assessment/assessmentCommandEnforcementService.ts; src/routes/examBlueprint.ts:6 imports src/domains/assessment/audit/assessmentAuditService.ts; src/routes/examBlueprint.ts:9 imports src/domains/assessment/contracts/assessmentCommandContext.ts; src/routes/examBlueprint.ts:19 imports src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-marking

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/marking` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/marking` via `composedMarkingRouter` (factory, src/index.ts:380, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:380); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-marking-invocation

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/marking-invocation` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/marking-invocation` via `composedMarkingInvocationRouter` (factory, src/index.ts:398, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:398); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-questionbankroutes

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank#questionBankRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank` via `questionBankRoutes` (direct, src/index.ts:360, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/questionBank.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`, `src/domains/assessment/question-bank/services/questionApprovalService.ts`, `src/domains/assessment/question-bank/services/questionDuplicateCandidateService.ts`, `src/domains/assessment/question-bank/services/questionExposureHoldService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/repositories/inMemoryAssessmentRepositories.ts`, `src/domains/assessment/contracts/assessmentAuditContracts.ts`, `src/domains/assessment/contracts/assessmentCommandContext.ts`, `src/domains/assessment/contracts/assessmentConcurrencyContracts.ts`, `src/domains/assessment/contracts/assessmentIdempotencyContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:360); 02 dependency edges (src/routes/questionBank.ts:3 imports src/domains/assessment/assessmentCommandEnforcementService.ts; src/routes/questionBank.ts:6 imports src/domains/assessment/audit/assessmentAuditService.ts; src/routes/questionBank.ts:5 imports src/domains/assessment/idempotency/assessmentIdempotencyService.ts; src/routes/questionBank.ts:4 imports src/domains/assessment/policies/assessmentPolicyRegistry.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-case-adjudication

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-case-adjudication` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-case-adjudication` via `composedRecoveryCaseAdjudicationRouter` (factory, src/index.ts:503, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:503); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-case-triage

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-case-triage` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-case-triage` via `recoveryCaseTriageRoutes` (direct, src/index.ts:483, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryCaseTriage.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-case-triage/services/recoveryCaseAllocationDraftService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseCapacityService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseDuplicateSuppressionService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseEscalationDraftService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseFairnessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCasePriorityAssessmentService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/contracts/index.ts`, `src/domains/assessment/recovery-case-triage/contracts/recoveryCaseAllocationDraftContracts.ts`, `src/domains/assessment/recovery-case-triage/contracts/recoveryCaseCapacityContracts.ts`, `src/domains/assessment/recovery-case-triage/contracts/recoveryCaseDuplicateSuppressionContracts.ts`, `src/domains/assessment/recovery-case-triage/contracts/recoveryCaseEscalationDraftContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:483); 02 dependency edges (src/routes/recoveryCaseTriage.ts:33 imports src/domains/assessment/recovery-case-triage/contracts/recoveryCaseTriageContracts.ts; src/routes/recoveryCaseTriage.ts:16 imports src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-execution-authorization-preview

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-execution-authorization-preview` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-execution-authorization-preview` via `recoveryExecutionAuthorizationPreviewRoutes` (direct, src/index.ts:458, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryExecutionAuthorizationPreview.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationAuditBridge.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationDryRunService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionApprovalChainContracts.ts`, `src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorityMatrixContracts.ts`, `src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorizationDryRunContracts.ts`, `src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorizationEligibilityContracts.ts`, `src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorizationPreviewContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:458); 02 dependency edges (src/routes/recoveryExecutionAuthorizationPreview.ts:23 imports src/domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorizationPreviewContracts.ts; src/routes/recoveryExecutionAuthorizationPreview.ts:20 imports src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts; src/routes/recoveryExecutionAuthorizationPreview.ts:2 imports src/domains/assessment/recovery-execution-authorization-preview/services/index.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-execution-readiness-board` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-execution-readiness-board` via `composedRecoveryExecutionReadinessBoardRouter` (factory, src/index.ts:479, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:479); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure

- DOMAIN: question-bank
- CAPABILITY STATUS: UNRESOLVED route-group candidate (no downstream boundary proven; not counted as logic)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-lifecycle-closure` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-lifecycle-closure` via `composedRecoveryLifecycleClosureRouter` (factory, src/index.ts:454, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L2
- CONFIDENCE: low 
- EVIDENCE KIND: CANDIDATE_SIGNAL + R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:454); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-outcome

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome` via `recoveryOutcomeRoutes` (direct, src/index.ts:442, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcome.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome/services/index.ts`, `src/domains/assessment/recovery-outcome/services/recoveryClosureDecisionDraftService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryContinuationDecisionDraftService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryExitCriteriaEvaluationService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryExitCriteriaService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryIntensificationDecisionDraftService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts`, `src/domains/assessment/recovery-outcome/contracts/recoveryDecisionDraftContracts.ts`, `src/domains/assessment/recovery-outcome/contracts/recoveryExitCriteriaContracts.ts`, `src/domains/assessment/recovery-outcome/contracts/recoveryOutcomeContracts.ts`, `src/domains/assessment/recovery-outcome/contracts/recoveryOutcomeDecisionReadinessContracts.ts`, `src/domains/assessment/recovery-outcome/contracts/recoveryOutcomeParentUpdateDraftContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:442); 02 dependency edges (src/routes/recoveryOutcome.ts:34 imports src/domains/assessment/recovery-outcome/contracts/recoveryOutcomeContracts.ts; src/routes/recoveryOutcome.ts:3 imports src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-outcome-action

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome-action` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome-action` via `recoveryOutcomeActionRoutes` (direct, src/index.ts:446, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcomeAction.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome-action/services/recoveryClosureActionDraftService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryContinuationActionDraftService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryIntensificationActionDraftService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionAuditBridge.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionBundleService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts`, `src/domains/assessment/recovery-outcome-action/contracts/recoveryActionDraftContracts.ts`, `src/domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionBundleContracts.ts`, `src/domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionContracts.ts`, `src/domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionReadinessContracts.ts`, `src/domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionRepositoryContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:446); 02 dependency edges (src/routes/recoveryOutcomeAction.ts:33 imports src/domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionContracts.ts; src/routes/recoveryOutcomeAction.ts:17 imports src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-outcome-execution-simulation

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome-execution-simulation` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome-execution-simulation` via `recoveryOutcomeExecutionSimulationRoutes` (direct, src/index.ts:450, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcomeExecutionSimulation.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome-execution-simulation/services/index.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionBlockedActionDiagnosticService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionEligibilityService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionFailureInjectionService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionPreviewDraftService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionReadinessVerdictService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionBlockedActionDiagnosticContracts.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionEligibilityContracts.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionFailureInjectionContracts.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionPreviewDraftContracts.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionReadinessVerdictContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:450); 02 dependency edges (src/routes/recoveryOutcomeExecutionSimulation.ts:36 imports src/domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionSimulationContracts.ts; src/routes/recoveryOutcomeExecutionSimulation.ts:19 imports src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-recovery-progress

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-progress` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-progress` via `recoveryProgressRoutes` (direct, src/index.ts:438, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryProgress.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-progress/services/index.ts`, `src/domains/assessment/recovery-progress/services/recoveryCheckpointEvaluationService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`, `src/domains/assessment/recovery-progress/services/recoveryParentProgressNoteDraftService.ts`, `src/domains/assessment/recovery-progress/services/recoveryPlanAdjustmentDraftService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts`, `src/domains/assessment/recovery-progress/contracts/recoveryProgressContracts.ts`, `src/domains/assessment/recovery-progress/contracts/recoveryProgressRepositoryContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:438); 02 dependency edges (src/routes/recoveryProgress.ts:30 imports src/domains/assessment/recovery-progress/contracts/recoveryProgressContracts.ts; src/routes/recoveryProgress.ts:3 imports src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-delivery

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-delivery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-delivery` via `resultDeliveryRoutes` (direct, src/index.ts:414, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultDelivery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-delivery/services/resultDeliveryAuditBridge.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryEnvelopeService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryIdempotencyService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryJobService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryMockDispatchService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryProjectionSafetyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/contracts/index.ts`, `src/domains/assessment/result-delivery/contracts/resultDeliveryAttemptContracts.ts`, `src/domains/assessment/result-delivery/contracts/resultDeliveryAuditContracts.ts`, `src/domains/assessment/result-delivery/contracts/resultDeliveryContracts.ts`, `src/domains/assessment/result-delivery/contracts/resultDeliveryEnvelopeContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`; repos `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:414); 02 dependency edges (src/routes/resultDelivery.ts:24 imports src/domains/assessment/result-delivery/contracts/resultDeliveryContracts.ts; src/routes/resultDelivery.ts:2 imports src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-follow-up

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-follow-up` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-follow-up` via `resultFollowUpRoutes` (direct, src/index.ts:430, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultFollowUp.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-follow-up/services/followUpEscalationPlanService.ts`, `src/domains/assessment/result-follow-up/services/followUpReviewWindowService.ts`, `src/domains/assessment/result-follow-up/services/followUpSummaryService.ts`, `src/domains/assessment/result-follow-up/services/index.ts`, `src/domains/assessment/result-follow-up/services/parentGuidanceDraftService.ts`, `src/domains/assessment/result-follow-up/services/resultFollowUpActionPlanService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/contracts/followUpEscalationPlanContracts.ts`, `src/domains/assessment/result-follow-up/contracts/followUpReviewWindowContracts.ts`, `src/domains/assessment/result-follow-up/contracts/followUpSummaryContracts.ts`, `src/domains/assessment/result-follow-up/contracts/index.ts`, `src/domains/assessment/result-follow-up/contracts/parentGuidanceDraftContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:430); 02 dependency edges (src/routes/resultFollowUp.ts:30 imports src/domains/assessment/result-follow-up/contracts/resultFollowUpContracts.ts; src/routes/resultFollowUp.ts:3 imports src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-governance

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-governance` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-governance` via `resultGovernanceRoutes` (direct, src/index.ts:402, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultGovernance.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceProjectionSafetyService.ts`, `src/domains/assessment/result-governance/services/resultRegradeRequestService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/contracts/index.ts`, `src/domains/assessment/result-governance/contracts/releaseReadinessContracts.ts`, `src/domains/assessment/result-governance/contracts/resultGovernanceRepositoryContracts.ts`, `src/domains/assessment/result-governance/policies/resultGovernancePolicyDefinitions.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:402); 02 dependency edges (src/routes/resultGovernance.ts:11 imports src/domains/assessment/result-governance/policies/resultGovernancePolicyDefinitions.ts; src/routes/resultGovernance.ts:13 imports src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-recovery

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-recovery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-recovery` via `resultRecoveryRoutes` (direct, src/index.ts:434, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultRecovery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-recovery/services/index.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryAuditBridge.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryCheckpointService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryIdempotencyService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryParentSupportNoteDraftService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts`, `src/domains/assessment/result-recovery/contracts/index.ts`, `src/domains/assessment/result-recovery/contracts/resultRecoveryCheckpointContracts.ts`, `src/domains/assessment/result-recovery/contracts/resultRecoveryContracts.ts`, `src/domains/assessment/result-recovery/contracts/resultRecoveryObjectiveContracts.ts`, `src/domains/assessment/result-recovery/contracts/resultRecoveryParentSupportNoteDraftContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:434); 02 dependency edges (src/routes/resultRecovery.ts:32 imports src/domains/assessment/result-recovery/contracts/resultRecoveryContracts.ts; src/routes/resultRecovery.ts:3 imports src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-release

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-release` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-release` via `resultReleaseRoutes` (direct, src/index.ts:410, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultRelease.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-release/services/parentSafeResultSummaryService.ts`, `src/domains/assessment/result-release/services/resultAudienceProjectionService.ts`, `src/domains/assessment/result-release/services/resultReleaseApprovalService.ts`, `src/domains/assessment/result-release/services/resultReleaseAuditBridge.ts`, `src/domains/assessment/result-release/services/resultReleaseBoundaryEnforcementService.ts`, `src/domains/assessment/result-release/services/resultReleaseDeliveryIntentService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts`, `src/domains/assessment/result-release/contracts/index.ts`, `src/domains/assessment/result-release/contracts/resultAudienceProjectionContracts.ts`, `src/domains/assessment/result-release/contracts/resultReleaseApprovalContracts.ts`, `src/domains/assessment/result-release/contracts/resultReleaseContracts.ts`, `src/domains/assessment/result-release/contracts/resultReleaseDeliveryIntentContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:410); 02 dependency edges (src/routes/resultRelease.ts:24 imports src/domains/assessment/result-release/contracts/resultReleaseContracts.ts; src/routes/resultRelease.ts:2 imports src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-report-card-access

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-card-access` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-card-access` via `resultReportCardAccessRoutes` (direct, src/index.ts:426, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCardAccess.ts`
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:426); 02 dependency edges (src/routes/resultReportCardAccess.ts:2 imports src/contracts/resultReportCardAccessContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-report-card-export

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-card-export` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-card-export` via `resultReportCardExportRoutes` (direct, src/index.ts:422, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCardExport.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-report-card-export/services/index.ts`, `src/domains/assessment/result-report-card-export/services/resultReportCardArchiveManifestService.ts`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportAuditBridge.ts`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportEnvelopeService.ts`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportIdempotencyService.ts`, `src/domains/assessment/result-report-card-export/services/resultReportCardExportJobService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts`, `src/domains/assessment/result-report-card-export/contracts/index.ts`, `src/domains/assessment/result-report-card/contracts/resultReportCardContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:422); 02 dependency edges (src/routes/resultReportCardExport.ts:3 imports src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-question-bank-result-report-cards

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-cards` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-cards` via `resultReportCardRoutes` (direct, src/index.ts:418, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCard.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-report-card/services/resultReportCardAssemblyService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardAudienceProjectionService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardAuditBridge.ts`, `src/domains/assessment/result-report-card/services/resultReportCardEvidenceLinkService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardExportIntentService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts`, `src/domains/assessment/result-report-card/contracts/index.ts`, `src/domains/assessment/result-report-card/contracts/resultReportCardAssemblyContracts.ts`, `src/domains/assessment/result-report-card/contracts/resultReportCardContracts.ts`, `src/domains/assessment/result-report-card/contracts/resultReportCardEvidenceContracts.ts`, `src/domains/assessment/result-report-card/contracts/resultReportCardExportContracts.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`; repos `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:418); 02 dependency edges (src/routes/resultReportCard.ts:26 imports src/domains/assessment/result-report-card/contracts/resultReportCardContracts.ts; src/routes/resultReportCard.ts:2 imports src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts); 03 mount table + shared-prefix grouping

### LOGIC-question-bank-api-task022-curriculum-governance

- DOMAIN: question-bank
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task022/curriculum-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task022/curriculum-governance` via `task022CurriculumContentGovernanceRoutes` (direct, src/index.ts:214, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task022CurriculumContentGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task022ApprovedSourceRegistryService.ts`, `src/services/task022ContentGapDetectionService.ts`, `src/services/task022ContentGovernanceAuditService.ts`, `src/services/task022ContentGovernanceContracts.ts`, `src/services/task022ContentGovernanceDiagnosticsService.ts`, `src/services/task022ContentGroundingService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:214); 02 dependency edges (src/routes/task022CurriculumContentGovernanceRoutes.ts:19 imports src/contracts/task022CurriculumGovernanceContracts.ts; src/routes/task022CurriculumContentGovernanceRoutes.ts:20 imports src/lib/task022CurriculumGovernanceValidation.ts); 03 mount table + shared-prefix grouping

## Teacher / School / Administration

### LOGIC-school-api-copilot-learning-sessions

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learning-sessions` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learning-sessions` via `studentLearningSessionRoutes` (direct, src/index.ts:203, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/studentLearningSessionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/studentLearningSessionAccessPolicy.ts`, `src/services/studentLearningSessionActionHistoryService.ts`, `src/services/studentLearningSessionAuditService.ts`, `src/services/studentLearningSessionContracts.ts`, `src/services/studentLearningSessionExitSummaryService.ts`, `src/services/studentLearningSessionLifecycleService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `StudentLearningSessionEvent`, `StudentLearningSessionState` → families `chat-session`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: StudentLearningSessionEvent, StudentLearningSessionState)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:203); 02 dependency edges (src/routes/studentLearningSessionRoutes.ts:45 imports src/contracts/studentLearningSessionContracts.ts; src/routes/studentLearningSessionRoutes.ts:24 imports src/lib/studentLearningSessionValidation.ts; src/routes/studentLearningSessionRoutes.ts:15 imports src/services/studentLearningSessionAccessPolicy.ts; src/routes/studentLearningSessionRoutes.ts:25 imports src/services/studentLearningSessionActionHistoryService.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-copilot-learningprofileroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#learningProfileRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `learningProfileRoutes` (direct, src/index.ts:507, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learningProfileRoutes.ts`
- PRIMARY SERVICE(S): `src/services/apiEnvelopeService.ts`, `src/services/apiErrorService.ts`, `src/services/learningProfileAccessPolicy.ts`, `src/services/learningProfileEvidenceService.ts`, `src/services/learningProfilePrivacyGuard.ts`, `src/services/learningProfileResponseBuilder.ts`
- REPOSITORY / DATA OWNER: family `mastery` writer evidence (structural model link); family `objectives` writer evidence (structural model link); family `practice` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `GrowthWeakTopicState`, `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSignal`, `PracticeAttempt`, `SkillMasterySnapshot`, `StudentLearningProfileSnapshot` → families `mastery`, `objectives`, `practice`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: GrowthWeakTopicState, SkillMasterySnapshot); `objectives`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LearningModeAttempt, LearningModeExitSummary, LearningModeHintEvent, LearningModeSignal); `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: PracticeAttempt)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:507); 02 dependency edges (src/routes/learningProfileRoutes.ts:9 imports src/lib/studentLearningProfileValidation.ts; src/routes/learningProfileRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/learningProfileRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts; src/routes/learningProfileRoutes.ts:7 imports src/services/apiEnvelopeService.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-learner-learnerpreferenceroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerPreferenceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerPreferenceRoutes` (direct, src/index.ts:196, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/learnerPreferences.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/adaptiveRecommendationTuningService.ts`, `src/services/closedLoopPersonalizationRuntime.ts`, `src/services/learnerChoicePolicyService.ts`, `src/services/learnerPreferenceFeedbackContracts.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link); family `student-identity-context` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `AdaptiveRecommendationProfileRecord`, `LearnerPreferenceFeedbackRecord`, `PersonalizationAuditRecord`, `RecommendationInteractionRecord` → families `practice`, `safeguarding-privacy`, `student-identity-context`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: AdaptiveRecommendationProfileRecord); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: PersonalizationAuditRecord); `student-identity-context`: SHARED_BY_DESIGN (PRISMA_WRITE_ACCESS structural link: LearnerPreferenceFeedbackRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/copilotPreferenceService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:196); 02 dependency edges (src/routes/learnerPreferences.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/learnerPreferences.ts:5 imports src/services/adaptiveRecommendationProfileService.ts; src/routes/learnerPreferences.ts:6 imports src/services/adaptiveRecommendationTuningService.ts; src/routes/learnerPreferences.ts:7 imports src/services/closedLoopPersonalizationRuntime.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-learner-learnerrecommendationroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerRecommendationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerRecommendationRoutes` (direct, src/index.ts:195, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/learnerRecommendations.ts`
- PRIMARY SERVICE(S): `src/services/learnerAgencyOptionsService.ts`, `src/services/learnerExplanationSafetyGuardService.ts`, `src/services/learnerNextStepRecommendationResolver.ts`, `src/services/learnerPrivacyVisibilityService.ts`, `src/services/learnerProgressNarrativeService.ts`, `src/services/learnerRecommendationAuditService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:195); 02 dependency edges (src/routes/learnerRecommendations.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/learnerRecommendations.ts:3 imports src/services/learnerRecommendationTransparencyRuntime.ts; src/routes/learnerRecommendations.ts:4 imports src/services/tutorStateContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-learner-learnersessionroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerSessionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerSessionRoutes` (direct, src/index.ts:200, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerSessions.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveChallengeRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/difficultyCalibrationRuntime.ts`, `src/services/endToEndLearningLoopRuntime.ts`, `src/services/learnerWhyThisNextExplanationService.ts`, `src/services/masteryService.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `AdaptiveChallengeRecord`, `RemediationPathRecord` → families `practice`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: AdaptiveChallengeRecord, RemediationPathRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/services/artifactLearnerMemoryBridge.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:200); 02 dependency edges (src/routes/learnerSessions.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/learnerSessions.ts:6 imports src/services/endToEndLearningLoopRuntime.ts; src/routes/learnerSessions.ts:8 imports src/services/sessionCompletionSummaryService.ts; src/routes/learnerSessions.ts:4 imports src/services/sessionContextHydrationService.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-phase3-parent-support

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/parent-support` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/parent-support` via `phase3ParentSupportRoutes` (direct, src/index.ts:597, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ParentSupportRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3ParentNotificationPolicyService.ts`, `src/services/phase3ParentNotificationPreferenceService.ts`, `src/services/phase3ParentNotificationQueueService.ts`, `src/services/phase3ParentProgressSummaryService.ts`, `src/services/phase3ParentSupportAuditService.ts`, `src/services/phase3ParentSupportRepository.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-outcome/services/recoveryOutcomeParentUpdateDraftService.ts`, `src/domains/assessment/recovery-progress/services/recoveryParentProgressNoteDraftService.ts`, `src/domains/assessment/result-follow-up/services/parentGuidanceDraftService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:597); 02 dependency edges (src/routes/phase3ParentSupportRoutes.ts:2 imports src/contracts/phase3ParentSupportContracts.ts; src/routes/phase3ParentSupportRoutes.ts:17 imports src/lib/phase3ParentSupportValidation.ts; src/routes/phase3ParentSupportRoutes.ts:11 imports src/services/phase3ParentNotificationPolicyService.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-phase3-peer-learning

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/phase3/peer-learning` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/peer-learning` via `phase3PeerLearningRoutes` (direct, src/index.ts:601, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3PeerLearningRoutes.ts`
- PRIMARY SERVICE(S): `src/services/phase3HealthyChallengeParticipationService.ts`, `src/services/phase3HealthyChallengeService.ts`, `src/services/phase3PeerContentModerationPolicyService.ts`, `src/services/phase3PeerGroupScopeGuardService.ts`, `src/services/phase3PeerHighlightModerationService.ts`, `src/services/phase3PeerHighlightService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`; repos `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:601); 02 dependency edges (src/routes/phase3PeerLearningRoutes.ts:14 imports src/lib/phase3PeerLearningValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-profileroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#profileRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `profileRoutes` (direct, src/index.ts:194, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/profile.ts`
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/learningProfileAccessPolicy.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/learningProfileAccessPolicy.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:194); 02 dependency edges (src/routes/profile.ts:2 imports src/middleware/schoolAuthMiddleware.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-schoolintegrationroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#schoolIntegrationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `schoolIntegrationRoutes` (direct, src/index.ts:210, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/schoolIntegration.ts`
- PRIMARY SERVICE(S): `src/services/schoolIntegrationDurableBootstrap.ts`, `src/services/schoolIntegrationDurableFlag.ts`, `src/services/task021RoleScopeVerificationService.ts`, `src/services/task021RosterDiffService.ts`, `src/services/task021RosterReconciliationService.ts`, `src/services/task021RosterSyncRuntime.ts`
- REPOSITORY / DATA OWNER: `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`
- PRISMA MODEL / DATA FAMILY: `SchoolIntegrationAuditRecord`, `SchoolIntegrationIdempotencyRecord`, `SchoolRosterSyncConflictRecord`, `SchoolRosterSyncJobRecord`, `TutorLearnerIdentityMap` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: SchoolIntegrationAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: SchoolIntegrationIdempotencyRecord, SchoolRosterSyncConflictRecord, SchoolRosterSyncJobRecord)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryDeferredIntegrationTicketService.ts`, `src/services/artifactVideoEvidenceIntegrationService.ts`, `src/services/challengeAttemptIntegrationService.ts`; repos `src/repositories/task035SchoolWideReadinessRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:210); 02 dependency edges (src/routes/schoolIntegration.ts:24 imports src/services/task021RoleScopeVerificationService.ts; src/routes/schoolIntegration.ts:21 imports src/services/task021RosterDiffService.ts; src/routes/schoolIntegration.ts:16 imports src/services/task021RosterSyncRuntime.ts; src/routes/schoolIntegration.ts:3 imports src/services/task021SchoolContextVerificationService.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-task021-school-integration

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task021/school-integration` (1 mount)
- ENTRY ROUTE(S): `/api/task021/school-integration` via `task021SchoolIntegrationRoutes` (direct, src/index.ts:211, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task021SchoolIntegrationRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task021ExternalSchoolIdentityAdapterService.ts`, `src/services/task021ParentLearnerLinkVerificationService.ts`, `src/services/task021RosterSyncIntakeService.ts`, `src/services/task021SchoolIntegrationRepository.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-lifecycle-closure/services/recoveryDeferredIntegrationTicketService.ts`, `src/services/artifactVideoEvidenceIntegrationService.ts`, `src/services/challengeAttemptIntegrationService.ts`; repos `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:211); 02 dependency edges (src/routes/task021SchoolIntegrationRoutes.ts:52 imports src/contracts/task021SchoolIntegrationContracts.ts; src/routes/task021SchoolIntegrationRoutes.ts:58 imports src/contracts/task021SchoolIntegrationContracts.ts; src/routes/task021SchoolIntegrationRoutes.ts:59 imports src/lib/task021SchoolIntegrationValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-teacherinterventionroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#teacherInterventionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `teacherInterventionRoutes` (direct, src/index.ts:188, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/teacherInterventions.ts`
- PRIMARY SERVICE(S): `src/services/learnerSafeInterventionResponseBuilder.ts`, `src/services/teacherInterventionActionPolicyService.ts`, `src/services/teacherInterventionAuditContracts.ts`, `src/services/teacherInterventionAuditRedactionService.ts`, `src/services/teacherInterventionAuditService.ts`, `src/services/teacherInterventionClassMembershipService.ts`
- REPOSITORY / DATA OWNER: family `safeguarding-privacy` writer evidence (structural model link); family `school-integration` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `TeacherInterventionAssignment`, `TeacherInterventionAuditEvent` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: TeacherInterventionAuditEvent); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: TeacherInterventionAssignment)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:188); 02 dependency edges (src/routes/teacherInterventions.ts:25 imports src/services/learnerSafeInterventionResponseBuilder.ts; src/routes/teacherInterventions.ts:17 imports src/services/teacherInterventionActionPolicyService.ts; src/routes/teacherInterventions.ts:23 imports src/services/teacherInterventionAuditService.ts; src/routes/teacherInterventions.ts:11 imports src/services/teacherInterventionContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-school-api-teacherreportroutes

- DOMAIN: school
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#teacherReportRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `teacherReportRoutes` (direct, src/index.ts:189, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teacherReports.ts`
- PRIMARY SERVICE(S): `src/services/learningDashboardEvidenceService.ts`, `src/services/lowWorkloadTeacherInsightService.ts`, `src/services/teacherInterventionContracts.ts`, `src/services/teacherNextActionRecommendationService.ts`, `src/services/teacherReportContracts.ts`, `src/services/teacherReportPrivacyGuardService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-access/repositories/prismaResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`; repos `src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-access/repositories/prismaResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:189); 02 dependency edges (src/routes/teacherReports.ts:19 imports src/services/learningDashboardEvidenceService.ts; src/routes/teacherReports.ts:20 imports src/services/lowWorkloadTeacherInsightService.ts; src/routes/teacherReports.ts:21 imports src/services/teacherNextActionRecommendationService.ts; src/routes/teacherReports.ts:23 imports src/services/teacherReportContracts.ts); 03 mount table + shared-prefix grouping

## Safety / Privacy / Governance

### LOGIC-safety-api-copilot-no-ai-bypass

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/no-ai-bypass` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/no-ai-bypass` via `noAiBypassAuditRoutes` (direct, src/index.ts:565, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/noAiBypassAuditRoutes.ts`
- PRIMARY SERVICE(S): `src/services/noAiBypassApiAuditService.ts`, `src/services/noAiBypassModuleScanner.ts`, `src/services/noAiBypassPrivacyGuard.ts`, `src/services/noAiBypassResponseBuilder.ts`, `src/services/noAiBypassRouteRegistry.ts`, `src/services/noAiBypassRuntimeGuard.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/aiProviderNoBypassAuditService.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:565); 02 dependency edges (src/routes/noAiBypassAuditRoutes.ts:3 imports src/services/noAiBypassApiAuditService.ts; src/routes/noAiBypassAuditRoutes.ts:5 imports src/services/noAiBypassModuleScanner.ts; src/routes/noAiBypassAuditRoutes.ts:6 imports src/services/noAiBypassPrivacyGuard.ts; src/routes/noAiBypassAuditRoutes.ts:4 imports src/services/noAiBypassResponseBuilder.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-copilot-tutorpolicyevaluateroutes

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#tutorPolicyEvaluateRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `tutorPolicyEvaluateRoutes` (direct, src/index.ts:198, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorPolicyEvaluate.ts`
- PRIMARY SERVICE(S): `src/services/tutorTurnPolicy/academicIntegrityContracts.ts`, `src/services/tutorTurnPolicy/academicIntegrityPolicyService.ts`, `src/services/tutorTurnPolicy/index.ts`, `src/services/tutorTurnPolicy/noFinalAnswerContracts.ts`, `src/services/tutorTurnPolicy/noFinalAnswerPolicyService.ts`, `src/services/tutorTurnPolicy/responseBoundaryContracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-paper/services/examAccessPolicyService.ts`, `src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:198); 02 dependency edges (src/routes/tutorPolicyEvaluate.ts:2 imports src/routes/ai/ai-middleware.ts; src/routes/tutorPolicyEvaluate.ts:3 imports src/services/tutorTurnPolicy/index.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-copilot-tutorsafechatroutes

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#tutorSafeChatRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `tutorSafeChatRoutes` (direct, src/index.ts:199, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorSafeChat.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/safeGenerationContracts.ts`, `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/curriculumEngine.ts`, `src/services/curriculumRuntimeContracts.ts`, `src/services/mastery/task011TutorTurnIntegrationService.ts`, `src/services/tutorOrchestration/attemptFeedbackRuntime.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService.ts`, `src/domains/assessment/exam-paper/services/examPaperProjectionSafetyService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:199); 02 dependency edges (src/routes/tutorSafeChat.ts:2 imports src/routes/ai/ai-middleware.ts; src/routes/tutorSafeChat.ts:3 imports src/services/tutorOrchestration/tutorTurnOrchestrationEngine.ts; src/routes/tutorSafeChat.ts:4 imports src/utils/logger.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-governance-privacygovernanceroutes

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/governance#privacyGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/governance` via `privacyGovernanceRoutes` (direct, src/index.ts:207, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/privacyGovernance.ts`
- PRIMARY SERVICE(S): `src/services/task020AiEgressPrivacyGuardService.ts`, `src/services/task020DataClassificationRegistryService.ts`, `src/services/task020DataDeletionGovernanceService.ts`, `src/services/task020DataExportGovernanceService.ts`, `src/services/task020DataRetentionGovernanceService.ts`, `src/services/task020DeenSensitiveDataBoundaryService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:207); 02 dependency edges (src/routes/privacyGovernance.ts:21 imports src/contracts/task020GovernanceContracts.ts; src/routes/privacyGovernance.ts:17 imports src/services/task020AiEgressPrivacyGuardService.ts; src/routes/privacyGovernance.ts:7 imports src/services/task020DataClassificationRegistryService.ts; src/routes/privacyGovernance.ts:16 imports src/services/task020DataDeletionGovernanceService.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-learner-privacygovernanceroutes

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/learner#privacyGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `privacyGovernanceRoutes` (direct, src/index.ts:209, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/privacyGovernance.ts`
- PRIMARY SERVICE(S): `src/services/task020AiEgressPrivacyGuardService.ts`, `src/services/task020DataClassificationRegistryService.ts`, `src/services/task020DataDeletionGovernanceService.ts`, `src/services/task020DataExportGovernanceService.ts`, `src/services/task020DataRetentionGovernanceService.ts`, `src/services/task020DeenSensitiveDataBoundaryService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:209); 02 dependency edges (src/routes/privacyGovernance.ts:21 imports src/contracts/task020GovernanceContracts.ts; src/routes/privacyGovernance.ts:17 imports src/services/task020AiEgressPrivacyGuardService.ts; src/routes/privacyGovernance.ts:7 imports src/services/task020DataClassificationRegistryService.ts; src/routes/privacyGovernance.ts:16 imports src/services/task020DataDeletionGovernanceService.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-task020-security-privacy-governance

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task020/security-privacy-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task020/security-privacy-governance` via `task020SecurityPrivacyGovernanceRoutes` (direct, src/index.ts:208, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task020SecurityPrivacyGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task020AiEgressPrivacyGuardService.ts`, `src/services/task020DataClassificationRegistryService.ts`, `src/services/task020DeenSensitiveDataBoundaryService.ts`, `src/services/task020DeleteRequestFoundationService.ts`, `src/services/task020ExportRequestFoundationService.ts`, `src/services/task020GovernanceAuditService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:208); 02 dependency edges (src/routes/task020SecurityPrivacyGovernanceRoutes.ts:15 imports src/contracts/task020SecurityPrivacyGovernanceContracts.ts; src/routes/task020SecurityPrivacyGovernanceRoutes.ts:14 imports src/lib/task020SecurityPrivacyGovernanceValidation.ts; src/routes/task020SecurityPrivacyGovernanceRoutes.ts:5 imports src/services/task020AiEgressPrivacyGuardService.ts; src/routes/task020SecurityPrivacyGovernanceRoutes.ts:2 imports src/services/task020DataClassificationRegistryService.ts); 03 mount table + shared-prefix grouping

### LOGIC-safety-api-task027-pilot-expansion-governance

- DOMAIN: safety
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task027/pilot-expansion-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task027/pilot-expansion-governance` via `task027PilotExpansionGovernanceRoutes` (direct, src/index.ts:261, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task027PilotExpansionGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task027AcademicIntegrityReviewService.ts`, `src/services/task027CohortExpansionEligibilityService.ts`, `src/services/task027CohortExpansionProposalService.ts`, `src/services/task027DeenContentGovernanceReviewService.ts`, `src/services/task027ExpansionEvidencePackService.ts`, `src/services/task027ExpansionGovernanceReportService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task027PilotExpansionGovernanceRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`; repos `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task025PilotRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:261); 02 dependency edges (src/routes/task027PilotExpansionGovernanceRoutes.ts:4 imports src/lib/rbac.ts; src/routes/task027PilotExpansionGovernanceRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task027PilotExpansionGovernanceRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts; src/routes/task027PilotExpansionGovernanceRoutes.ts:22 imports src/services/task027AcademicIntegrityReviewService.ts); 03 mount table + shared-prefix grouping

## Operations / Reliability / Observability

### LOGIC-operations-api-deploymentreadinessroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#deploymentReadinessRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `deploymentReadinessRoutes` (direct, src/index.ts:217, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/deploymentReadiness.ts`
- PRIMARY SERVICE(S): `src/services/backendHealthService.ts`, `src/services/task021SchoolContextVerificationService.ts`, `src/services/task022ApprovedSourceRegistryService.ts`, `src/services/task022ContentGroundingService.ts`, `src/services/task023DatabaseReadinessService.ts`, `src/services/task023DeploymentReadinessAggregator.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:217); 02 dependency edges (src/routes/deploymentReadiness.ts:11 imports src/lib/rbac.ts; src/routes/deploymentReadiness.ts:10 imports src/middleware/schoolAuthMiddleware.ts; src/routes/deploymentReadiness.ts:9 imports src/services/backendHealthService.ts; src/routes/deploymentReadiness.ts:3 imports src/services/task023DeploymentReadinessAggregator.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-health-healthroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/health#healthRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/health` via `healthRoutes` (direct, src/index.ts:171, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/health.ts`
- PRIMARY SERVICE(S): `src/services/backendAuditEventService.ts`, `src/services/backendDependencyCheckService.ts`, `src/services/backendEnvSchema.ts`, `src/services/backendHealthService.ts`, `src/services/backendReadinessService.ts`, `src/services/backendRouteContractService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: SOURCE-INSPECTED route has no dedicated input-validation step (e.g. GET probe); decision + output + failure paths confirmed instead
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: SOURCE-CONFIRMED: src/routes/health.ts:9-13 imports getBackendLiveness, getBackendReadiness, runBackendDependencyChecks, verifyBackendRouteContracts (services) | src/routes/health.ts:22,36,61,84 GET /live, /ready, /dependencies, /routes handlers with 200/503 result paths and catch-503 failure handlers (lines 42-52, 68-76)
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: SOURCE-CONFIRMED failure/result paths (src/routes/health.ts:22,36,61,84)
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/aiGateway/providerHealthService.ts`, `src/services/constitutionHealthService.ts`, `src/services/phase3HealthyChallengeParticipationService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + SOURCE_INSPECTION; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:171); 02 dependency edges (src/routes/health.ts:11 imports src/services/backendDependencyCheckService.ts; src/routes/health.ts:9 imports src/services/backendHealthService.ts; src/routes/health.ts:10 imports src/services/backendReadinessService.ts; src/routes/health.ts:12 imports src/services/backendRouteContractService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-ops-diagnostics

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/ops/diagnostics` (1 mount)
- ENTRY ROUTE(S): `/api/ops/diagnostics` via `task018DiagnosticsRoutes` (direct, src/index.ts:205, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task018OperationsDiagnostics.ts`
- PRIMARY SERVICE(S): `src/services/durableAuditEventService.ts`, `src/services/task018AdminDiagnosticsScopePolicyService.ts`, `src/services/task018ComponentHealthMonitorService.ts`, `src/services/task018ObservabilityAuditService.ts`, `src/services/task018OperationTraceContextService.ts`, `src/services/task018RuntimeMetricsCollector.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/ops`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionBlockedActionDiagnosticService.ts`, `src/services/activeWorkLoopService.ts`, `src/services/learnerLoopService.ts`; repos `src/repositories/task024OpsRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:205); 02 dependency edges (src/routes/task018OperationsDiagnostics.ts:2 imports src/services/task018AdminDiagnosticsScopePolicyService.ts; src/routes/task018OperationsDiagnostics.ts:3 imports src/services/task018ComponentHealthMonitorService.ts; src/routes/task018OperationsDiagnostics.ts:7 imports src/services/task018ObservabilityAuditService.ts; src/routes/task018OperationsDiagnostics.ts:262 imports src/services/task018ObservabilityAuditService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-ops-opspublicrouter

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/ops#opsPublicRouter` (1 mount)
- ENTRY ROUTE(S): `/api/ops` via `opsPublicRouter` (direct, src/index.ts:204, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/task018OperationsDiagnostics.ts`
- PRIMARY SERVICE(S): `src/services/durableAuditEventService.ts`, `src/services/task018AdminDiagnosticsScopePolicyService.ts`, `src/services/task018ComponentHealthMonitorService.ts`, `src/services/task018ObservabilityAuditService.ts`, `src/services/task018OperationTraceContextService.ts`, `src/services/task018RuntimeMetricsCollector.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/ops`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/activeWorkLoopService.ts`, `src/services/learnerLoopService.ts`, `src/services/task017ProductionLearningLoopSmokeTestHarness.ts`; repos `src/repositories/task024OpsRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:204); 02 dependency edges (src/routes/task018OperationsDiagnostics.ts:2 imports src/services/task018AdminDiagnosticsScopePolicyService.ts; src/routes/task018OperationsDiagnostics.ts:3 imports src/services/task018ComponentHealthMonitorService.ts; src/routes/task018OperationsDiagnostics.ts:7 imports src/services/task018ObservabilityAuditService.ts; src/routes/task018OperationsDiagnostics.ts:262 imports src/services/task018ObservabilityAuditService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-readinessroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#readinessRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `readinessRoutes` (direct, src/index.ts:172, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/readiness.ts`
- PRIMARY SERVICE(S): UNRESOLVED — no structural dependency from the route module to a service (keyword overlap is candidate signal only); CANDIDATE_SIGNAL only: `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:172); 02 dependency edges (no structural edge proven); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task023-deployment-readiness

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task023/deployment-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task023/deployment-readiness` via `task023DeploymentReadinessRoutes` (direct, src/index.ts:220, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task023DeploymentReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/services/noAiBypassRuntimeGuard.ts`, `src/services/phase3ConfidenceCalibrationService.ts`, `src/services/phase3DailyLearningFeedService.ts`, `src/services/phase3GoalBasedStudyPlanService.ts`, `src/services/phase3GrowthPageReadModelService.ts`, `src/services/phase3ObjectiveMasteryService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:220); 02 dependency edges (src/routes/task023DeploymentReadinessRoutes.ts:25 imports src/lib/task023DeploymentReadinessValidation.ts; src/routes/task023DeploymentReadinessRoutes.ts:16 imports src/services/task023DeploymentReadinessRepository.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task024-operations-readiness

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task024/operations-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task024/operations-readiness` via `task024OperationsReadinessRoutes` (direct, src/index.ts:233, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task024OperationsReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task024BackupReadinessService.ts`, `src/services/task024GovernanceGateContinuityService.ts`, `src/services/task024IncidentResponseWorkflowService.ts`, `src/services/task024IncidentSeverityEscalationService.ts`, `src/services/task024LoadSimulationService.ts`, `src/services/task024OperationalAlertPolicyService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task024OpsRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:233); 02 dependency edges (src/routes/task024OperationsReadinessRoutes.ts:4 imports src/lib/task024OperationsReadinessValidation.ts; src/routes/task024OperationsReadinessRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task024OperationsReadinessRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts; src/routes/task024OperationsReadinessRoutes.ts:9 imports src/services/task024BackupReadinessService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task024operationsroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task024OperationsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task024OperationsRoutes` (direct, src/index.ts:229, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/task024OperationsRoutes.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/providerHealthService.ts`, `src/services/backendRequestTelemetryService.ts`, `src/services/contentGovernance/contentGovernanceReadinessService.ts`, `src/services/task021SchoolContextVerificationService.ts`, `src/services/task023DeploymentReadinessAggregator.ts`, `src/services/task024BackupReadinessService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/task018SafeOperationsMonitoringRuntime.ts`, `src/services/task024DataIntegrityVerificationService.ts`, `src/services/task024GovernanceGateContinuityService.ts`; repos `src/repositories/task029ExpansionOperationsRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:229); 02 dependency edges (src/routes/task024OperationsRoutes.ts:9 imports src/contracts/task024OperationsReadinessContracts.ts; src/routes/task024OperationsRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task024OperationsRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task024OperationsRoutes.ts:23 imports src/repositories/task024OpsRepository.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task025-pilot-readiness

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task025/pilot-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task025/pilot-readiness` via `task025ControlledPilotReadinessRoutes` (direct, src/index.ts:245, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task025ControlledPilotReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task025CandidateCohortReadinessService.ts`, `src/services/task025DataPrivacyReadinessService.ts`, `src/services/task025MonitoringGateReadinessService.ts`, `src/services/task025ParentCommunicationReadinessService.ts`, `src/services/task025PauseRollbackReadinessService.ts`, `src/services/task025PilotEligibilityPolicyService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task025PilotRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task025PilotRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:245); 02 dependency edges (src/routes/task025ControlledPilotReadinessRoutes.ts:2 imports src/lib/task025ControlledPilotReadinessValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task025pilotroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task025PilotRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task025PilotRoutes` (direct, src/index.ts:242, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task025PilotRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task025PilotAccessGateService.ts`, `src/services/task025PilotDryRunService.ts`, `src/services/task025PilotReadinessService.ts`, `src/services/task025PilotReportService.ts`, `src/services/task025PilotRollbackService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task025PilotRepository.ts`
- PRISMA MODEL / DATA FAMILY: `PilotAuditRecord`, `PilotCohort`, `PilotDryRun`, `PilotParticipant`, `PilotProgram`, `PilotReadinessCheck` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: PilotAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: PilotCohort, PilotDryRun, PilotParticipant, PilotProgram)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`; repos `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:242); 02 dependency edges (src/routes/task025PilotRoutes.ts:9 imports src/contracts/task025PilotContracts.ts; src/routes/task025PilotRoutes.ts:10 imports src/contracts/task025PilotContracts.ts; src/routes/task025PilotRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task025PilotRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task026pilotexecutionroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task026PilotExecutionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task026PilotExecutionRoutes` (direct, src/index.ts:254, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task026PilotExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task025PilotReadinessService.ts`, `src/services/task026PilotExecutionControlService.ts`, `src/services/task026PilotExecutionEventService.ts`, `src/services/task026PilotExecutionStateMachine.ts`, `src/services/task026PilotFeedbackService.ts`, `src/services/task026PilotIncidentBridgeService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task025PilotRepository.ts`, `src/repositories/task026PilotExecutionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `PilotAuditRecord`, `PilotCohort`, `PilotDryRun`, `PilotParticipant`, `PilotProgram`, `PilotReadinessCheck` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: PilotAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: PilotCohort, PilotDryRun, PilotParticipant, PilotProgram)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`; repos `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:254); 02 dependency edges (src/routes/task026PilotExecutionRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task026PilotExecutionRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task026PilotExecutionRoutes.ts:5 imports src/repositories/task025PilotRepository.ts; src/routes/task026PilotExecutionRoutes.ts:4 imports src/repositories/task026PilotExecutionRepository.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task027pilotexpansionroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task027PilotExpansionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task027PilotExpansionRoutes` (direct, src/index.ts:258, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task027PilotExpansionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task027PilotExpansionAuditService.ts`, `src/services/task027PilotExpansionCohortChangeService.ts`, `src/services/task027PilotExpansionDecisionService.ts`, `src/services/task027PilotExpansionEvidencePackService.ts`, `src/services/task027PilotExpansionReportService.ts`, `src/services/task027PilotExpansionReviewService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`; repos `src/repositories/task025PilotRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:258); 02 dependency edges (src/routes/task027PilotExpansionRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task027PilotExpansionRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task027PilotExpansionRoutes.ts:4 imports src/repositories/task027PilotExpansionRepository.ts; src/routes/task027PilotExpansionRoutes.ts:11 imports src/services/task027PilotExpansionAuditService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task028-controlled-expansion-execution

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task028/controlled-expansion-execution` (1 mount)
- ENTRY ROUTE(S): `/api/task028/controlled-expansion-execution` via `task028ControlledExpansionExecutionRoutes` (direct, src/index.ts:273, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task028ControlledExpansionExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task028ApprovedExpansionPlanService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task028DailyExpansionSummaryService.ts`, `src/services/task028ExecutionAuditService.ts`, `src/services/task028ExecutionDiagnosticsService.ts`, `src/services/task028ExpandedLearnerAccessGateService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task027PilotExpansionRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `ExpandedPilotParticipant`, `ExpansionCompletionReview`, `ExpansionExecutionAuditRecord`, `ExpansionExecutionReport`, `ExpansionExecutionRun`, `ExpansionExecutionStage`, `ExpansionHealthSnapshot`, `ExpansionInterventionRecord` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: ExpansionExecutionAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: ExpandedPilotParticipant, ExpansionCompletionReview, ExpansionExecutionReport, ExpansionExecutionRun)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`; repos `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:273); 02 dependency edges (src/routes/task028ControlledExpansionExecutionRoutes.ts:30 imports src/contracts/task028ControlledExpansionExecutionContracts.ts; src/routes/task028ControlledExpansionExecutionRoutes.ts:4 imports src/lib/rbac.ts; src/routes/task028ControlledExpansionExecutionRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task028ControlledExpansionExecutionRoutes.ts:3 imports src/middleware/schoolContextGuardMiddleware.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task028expansionexecutionroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task028ExpansionExecutionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task028ExpansionExecutionRoutes` (direct, src/index.ts:270, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task028ExpansionExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task028ExpandedRuntimeGuardService.ts`, `src/services/task028ExpansionCompletionReviewService.ts`, `src/services/task028ExpansionExecutionAuditService.ts`, `src/services/task028ExpansionExecutionReportService.ts`, `src/services/task028ExpansionExecutionStateMachine.ts`, `src/services/task028ExpansionHealthSnapshotService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task027PilotExpansionRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `ExpandedPilotParticipant`, `ExpansionCompletionReview`, `ExpansionExecutionAuditRecord`, `ExpansionExecutionReport`, `ExpansionExecutionRun`, `ExpansionExecutionStage`, `ExpansionHealthSnapshot`, `ExpansionInterventionRecord` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: ExpansionExecutionAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: ExpandedPilotParticipant, ExpansionCompletionReview, ExpansionExecutionReport, ExpansionExecutionRun)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`; repos `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:270); 02 dependency edges (src/routes/task028ExpansionExecutionRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task028ExpansionExecutionRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task028ExpansionExecutionRoutes.ts:4 imports src/repositories/task028ExpansionExecutionRepository.ts; src/routes/task028ExpansionExecutionRoutes.ts:8 imports src/services/task028ExpandedRuntimeGuardService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task029expansionoperationsroutes

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api#task029ExpansionOperationsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task029ExpansionOperationsRoutes` (direct, src/index.ts:282, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task029ExpansionOperationsRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task028ExpansionCompletionReviewService.ts`, `src/services/task028ExpansionExecutionAuditService.ts`, `src/services/task028ExpansionExecutionStateMachine.ts`, `src/services/task028ExpansionInterventionService.ts`, `src/services/task028ExpansionRollbackExecutionService.ts`, `src/services/task029CohortOperationsSummaryService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task028ExpansionExecutionRepository.ts`, `src/repositories/task029ExpansionOperationsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `ExpandedPilotParticipant`, `ExpansionCompletionReview`, `ExpansionExecutionAuditRecord`, `ExpansionExecutionReport`, `ExpansionExecutionRun`, `ExpansionExecutionStage`, `ExpansionHealthSnapshot`, `ExpansionInterventionRecord` → families `safeguarding-privacy`, `school-integration`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: ExpansionExecutionAuditRecord); `school-integration`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: ExpandedPilotParticipant, ExpansionCompletionReview, ExpansionExecutionReport, ExpansionExecutionRun)
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/task018SafeOperationsMonitoringRuntime.ts`, `src/services/task024OperationsAuditService.ts`, `src/services/task024OperationsDiagnosticsService.ts`; repos `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:282); 02 dependency edges (src/routes/task029ExpansionOperationsRoutes.ts:16 imports src/contracts/task029ExpansionOperationsContracts.ts; src/routes/task029ExpansionOperationsRoutes.ts:3 imports src/lib/rbac.ts; src/routes/task029ExpansionOperationsRoutes.ts:2 imports src/middleware/schoolAuthMiddleware.ts; src/routes/task029ExpansionOperationsRoutes.ts:15 imports src/repositories/task028ExpansionExecutionRepository.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task030-controlled-staging-rehearsal

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task030/controlled-staging-rehearsal` (1 mount)
- ENTRY ROUTE(S): `/api/task030/controlled-staging-rehearsal` via `task030ControlledStagingRehearsalRoutes` (direct, src/index.ts:286, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task030ControlledStagingRehearsalRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task030AdminOperatorJourneyService.ts`, `src/services/task030ControlActionRehearsalService.ts`, `src/services/task030ControlledStagingDiagnosticsService.ts`, `src/services/task030ControlledStagingReportService.ts`, `src/services/task030OperationsConsoleRehearsalService.ts`, `src/services/task030RehearsalEvidenceLedgerService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task030ControlledStagingRehearsalRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task030ControlledStagingRehearsalService.ts`; repos `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:286); 02 dependency edges (src/routes/task030ControlledStagingRehearsalRoutes.ts:19 imports src/repositories/task030ControlledStagingRehearsalRepository.ts; src/routes/task030ControlledStagingRehearsalRoutes.ts:8 imports src/services/task030AdminOperatorJourneyService.ts; src/routes/task030ControlledStagingRehearsalRoutes.ts:13 imports src/services/task030ControlActionRehearsalService.ts; src/routes/task030ControlledStagingRehearsalRoutes.ts:18 imports src/services/task030ControlledStagingDiagnosticsService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task031-staging-smoke-canary-readiness

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task031/staging-smoke-canary-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task031/staging-smoke-canary-readiness` via `task031StagingSmokeCanaryReadinessRoutes` (direct, src/index.ts:295, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task031StagingSmokeCanaryReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task031AdminOperatorMonitoringSmokeService.ts`, `src/services/task031BackendRouteSmokeService.ts`, `src/services/task031CanaryReadinessDecisionService.ts`, `src/services/task031CopilotBootstrapSmokeService.ts`, `src/services/task031DiagnosticsService.ts`, `src/services/task031EmbedHandoffSmokeService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task030ControlledStagingRehearsalRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task030ControlledStagingRehearsalRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:295); 02 dependency edges (src/routes/task031StagingSmokeCanaryReadinessRoutes.ts:11 imports src/services/task031AdminOperatorMonitoringSmokeService.ts; src/routes/task031StagingSmokeCanaryReadinessRoutes.ts:16 imports src/services/task031BackendRouteSmokeService.ts; src/routes/task031StagingSmokeCanaryReadinessRoutes.ts:14 imports src/services/task031CanaryReadinessDecisionService.ts; src/routes/task031StagingSmokeCanaryReadinessRoutes.ts:7 imports src/services/task031CopilotBootstrapSmokeService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task032-controlled-canary-activation

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task032/controlled-canary-activation` (1 mount)
- ENTRY ROUTE(S): `/api/task032/controlled-canary-activation` via `task032ControlledCanaryActivationRoutes` (direct, src/index.ts:304, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task032ControlledCanaryActivationRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task032ApprovedSchoolCanaryConfigService.ts`, `src/services/task032CanaryActivationCommandService.ts`, `src/services/task032CanaryActivationDiagnosticsService.ts`, `src/services/task032CanaryActivationEvidenceLedgerService.ts`, `src/services/task032CanaryActivationReportService.ts`, `src/services/task032CanaryActivationStateMachineService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task032ControlledCanaryActivationRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeMockActivationQueueService.ts`, `src/services/aiProviderActivationGuard.ts`; repos `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:304); 02 dependency edges (src/routes/task032ControlledCanaryActivationRoutes.ts:25 imports src/contracts/task032ControlledCanaryActivationContracts.ts; src/routes/task032ControlledCanaryActivationRoutes.ts:24 imports src/repositories/task032ControlledCanaryActivationRepository.ts; src/routes/task032ControlledCanaryActivationRoutes.ts:4 imports src/services/task032ApprovedSchoolCanaryConfigService.ts; src/routes/task032ControlledCanaryActivationRoutes.ts:15 imports src/services/task032CanaryActivationCommandService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task033-controlled-canary-observation

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task033/controlled-canary-observation` (1 mount)
- ENTRY ROUTE(S): `/api/task033/controlled-canary-observation` via `task033ControlledCanaryObservationRoutes` (direct, src/index.ts:313, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task033ControlledCanaryObservationRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task033CanaryDriftDetectionService.ts`, `src/services/task033CanaryHealthObservationService.ts`, `src/services/task033ContentGovernanceObservationService.ts`, `src/services/task033CrossSchoolDenialObservationService.ts`, `src/services/task033DeenBoundaryObservationService.ts`, `src/services/task033IncidentSignalObservationService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task033ControlledCanaryObservationRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/recovery-progress/services/recoveryProgressObservationService.ts`, `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`; repos `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:313); 02 dependency edges (src/routes/task033ControlledCanaryObservationRoutes.ts:24 imports src/contracts/task033ControlledCanaryObservationContracts.ts; src/routes/task033ControlledCanaryObservationRoutes.ts:23 imports src/repositories/task033ControlledCanaryObservationRepository.ts; src/routes/task033ControlledCanaryObservationRoutes.ts:17 imports src/services/task033CanaryDriftDetectionService.ts; src/routes/task033ControlledCanaryObservationRoutes.ts:7 imports src/services/task033CanaryHealthObservationService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task034-controlled-limited-rollout

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task034/controlled-limited-rollout` (1 mount)
- ENTRY ROUTE(S): `/api/task034/controlled-limited-rollout` via `task034ControlledLimitedRolloutRoutes` (direct, src/index.ts:322, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task034ControlledLimitedRolloutRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task034ContentGovernanceReviewService.ts`, `src/services/task034ControlledLimitedRolloutReportService.ts`, `src/services/task034ControlledRolloutCommandService.ts`, `src/services/task034ControlledRolloutEventIntakeService.ts`, `src/services/task034ControlledRolloutStateMachineService.ts`, `src/services/task034CrossSchoolDenialReviewService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task034ControlledLimitedRolloutRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task030ControlledStagingDiagnosticsService.ts`; repos `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:322); 02 dependency edges (src/routes/task034ControlledLimitedRolloutRoutes.ts:2 imports src/contracts/task034ControlledLimitedRolloutContracts.ts; src/routes/task034ControlledLimitedRolloutRoutes.ts:3 imports src/contracts/task034ControlledLimitedRolloutContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task035-school-wide-readiness

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task035/school-wide-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task035/school-wide-readiness` via `task035SchoolWideReadinessRoutes` (direct, src/index.ts:331, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task035SchoolWideReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task035ApprovedSchoolBoundaryGuardService.ts`, `src/services/task035CurriculumSourceReviewService.ts`, `src/services/task035DeenGovernanceReviewService.ts`, `src/services/task035FinalSchoolLaunchDecisionService.ts`, `src/services/task035FullSchoolRollbackReadinessService.ts`, `src/services/task035FullSchoolRolloutSimulationService.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven; CANDIDATE_SIGNAL only: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/schoolIdentityMappingRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`; repos `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/schoolIdentityMappingRepository.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:331); 02 dependency edges (src/routes/task035SchoolWideReadinessRoutes.ts:2 imports src/contracts/task035SchoolWideReadinessContracts.ts; src/routes/task035SchoolWideReadinessRoutes.ts:5 imports src/services/task035ApprovedSchoolBoundaryGuardService.ts; src/routes/task035SchoolWideReadinessRoutes.ts:16 imports src/services/task035CurriculumSourceReviewService.ts; src/routes/task035SchoolWideReadinessRoutes.ts:15 imports src/services/task035DeenGovernanceReviewService.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task036-live-school-launch

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task036/live-school-launch` (1 mount)
- ENTRY ROUTE(S): `/api/task036/live-school-launch` via `task036LiveSchoolLaunchRoutes` (direct, src/index.ts:341, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task036LiveSchoolLaunchRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task036ContentGovernanceService.ts`, `src/services/task036CrossSchoolDenialService.ts`, `src/services/task036DeenBoundaryService.ts`, `src/services/task036DiagnosticsService.ts`, `src/services/task036EvidenceLedgerService.ts`, `src/services/task036FinalLaunchDecisionService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task036LiveSchoolLaunchRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`; repos `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:341); 02 dependency edges (src/routes/task036LiveSchoolLaunchRoutes.ts:2 imports src/contracts/task036LiveSchoolLaunchContracts.ts); 03 mount table + shared-prefix grouping

### LOGIC-operations-api-task040-backend-freeze

- DOMAIN: operations
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/task040/backend-freeze` (1 mount)
- ENTRY ROUTE(S): `/api/task040/backend-freeze` via `task040BackendFreezeRoutes` (direct, src/index.ts:351, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task040BackendFreezeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task040AcceptedTaskLedgerService.ts`, `src/services/task040BackendSurfaceInventoryService.ts`, `src/services/task040ChangeControlPolicyService.ts`, `src/services/task040ContractInventoryService.ts`, `src/services/task040DiagnosticsService.ts`, `src/services/task040DirtyWorkspaceClassifierService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task040BackendFreezeRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence, R8A_STRUCTURAL); role checks UNRESOLVED statically — no requireRole/policy call proven for this group
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/backendAiTelemetryService.ts`, `src/services/backendAuditEventService.ts`, `src/services/backendBackpressureService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:351); 02 dependency edges (src/routes/task040BackendFreezeRoutes.ts:2 imports src/contracts/task040BackendFreezeContracts.ts; src/routes/task040BackendFreezeRoutes.ts:36 imports src/repositories/task040BackendFreezeRepository.ts; src/routes/task040BackendFreezeRoutes.ts:11 imports src/services/task040AcceptedTaskLedgerService.ts); 03 mount table + shared-prefix grouping

## Voice / External Integrations

### LOGIC-voice-api-copilot-airoutes

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot#aiRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `aiRoutes` (direct, src/index.ts:191, middleware: schoolAuthMiddleware, rateLimitMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/ai.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/legacyRouteGuard.ts`, `src/services/assessmentSessionService.ts`, `src/services/assistantTurnPipelineService.ts`, `src/services/constitutionHealthService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/creativeDeckService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence (structural model link); family `operations-readiness` writer evidence (structural model link); family `revision` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link); family `student-identity-context` writer evidence (structural model link); family `voice` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `ChatMessage`, `ChatSession`, `CopilotPreferences`, `LatencyThresholdAlert`, `LearningEffectEvent`, `MetacognitiveEvent`, `Mistake`, `Progress` → families `chat-session`, `operations-readiness`, `revision`, `safeguarding-privacy`, `student-identity-context`, `voice`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: ChatMessage, ChatSession); `operations-readiness`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LatencyThresholdAlert, TurnLatencyMetric); `revision`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: RevisionItem); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: SafetyAlert, SafetyEventAudit); `student-identity-context`: SHARED_BY_DESIGN (PRISMA_WRITE_ACCESS structural link: CopilotPreferences, StudentProfile); `voice`: CLEAR (PRISMA_WRITE_ACCESS structural link: VoiceLedgerEntry, VoicePackageGrant, VoiceSessionUsage, VoiceUsage)
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotSessionContinuityContracts.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:191); 02 dependency edges (src/routes/ai.ts:4 imports src/lib/prisma.ts; src/routes/ai.ts:170 imports src/lib/rbac.ts; src/routes/ai.ts:5 imports src/lib/redis.ts; src/routes/ai.ts:9 imports src/lib/types.ts); 03 mount table + shared-prefix grouping

### LOGIC-voice-api-copilot-anomalies

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/anomalies` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/anomalies` via `anomalyRoutes` (direct, src/index.ts:175, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/anomalies.ts`
- PRIMARY SERVICE(S): `src/services/abnormalBehaviorService.ts`
- REPOSITORY / DATA OWNER: family `operations-readiness` writer evidence (structural model link); family `safeguarding-privacy` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `SafetyAlert`, `SafetyEventAudit`, `TurnLatencyMetric` → families `operations-readiness`, `safeguarding-privacy`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: TurnLatencyMetric); `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: SafetyAlert, SafetyEventAudit)
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:175); 02 dependency edges (src/routes/anomalies.ts:2 imports src/lib/rbac.ts; src/routes/anomalies.ts:4 imports src/services/abnormalBehaviorService.ts; src/routes/anomalies.ts:3 imports src/utils/logger.ts; src/services/abnormalBehaviorService.ts:102 create SafetyEventAudit (write/service)); 03 mount table + shared-prefix grouping

### LOGIC-voice-api-copilot-chat-pipeline

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/chat-pipeline` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/chat-pipeline` via `chatPipelineRoutes` (direct, src/index.ts:182, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/chatPipeline.ts`
- PRIMARY SERVICE(S): `src/services/artifactPromptPacketBuilder.ts`, `src/services/artifactReasoningContracts.ts`, `src/services/cacheScopeContracts.ts`, `src/services/cacheScopePolicyService.ts`, `src/services/chatContextIntegrationService.ts`, `src/services/chatPipelineContracts.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/artifactAwarePracticeChatOrchestrator.ts`, `src/services/artifactAwarePracticeChatTriggerService.ts`, `src/services/assistantTurnPipelineService.test.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:182); 02 dependency edges (src/routes/chatPipeline.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/chatPipeline.ts:12 imports src/services/chatContextIntegrationService.ts; src/routes/chatPipeline.ts:16 imports src/services/chatPipelineContracts.ts; src/routes/chatPipeline.ts:11 imports src/services/chatPipelineValidation.ts); 03 mount table + shared-prefix grouping

### LOGIC-voice-api-copilot-intent

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/intent` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/intent` via `intentResolverRoutes` (direct, src/index.ts:181, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/intentResolver.ts`
- PRIMARY SERVICE(S): `src/services/clarificationPolicyService.ts`, `src/services/intentEvidenceService.ts`, `src/services/intentResolutionEventService.ts`, `src/services/intentResolverContracts.ts`, `src/services/intentResolverService.ts`, `src/services/intentResolverValidation.ts`
- REPOSITORY / DATA OWNER: UNRESOLVED — no structural service→repository/data link proven
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no structural route→data link proven (keyword overlap is candidate signal only)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED — no structural route→data link proven
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/domains/assessment/result-release/services/resultReleaseDeliveryIntentService.ts`, `src/domains/assessment/result-report-card-access/services/resultReportCardAccessTokenIntentService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardExportIntentService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:181); 02 dependency edges (src/routes/intentResolver.ts:8 imports src/middleware/schoolAuthMiddleware.ts; src/routes/intentResolver.ts:9 imports src/routes/ai/ai-middleware.ts; src/routes/intentResolver.ts:17 imports src/services/intentResolutionEventService.ts; src/routes/intentResolver.ts:16 imports src/services/intentResolverService.ts); 03 mount table + shared-prefix grouping

### LOGIC-voice-api-copilot-latency

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/copilot/latency` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/latency` via `latencyRoutes` (direct, src/index.ts:174, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/latency.ts`
- PRIMARY SERVICE(S): `src/services/latencyService.ts`
- REPOSITORY / DATA OWNER: family `operations-readiness` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `LatencyThresholdAlert`, `TurnLatencyMetric` → families `operations-readiness`
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present (CANDIDATE_SIGNAL)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts and no service-level role check proven; URL shape was not used as authorization proof
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS (PRISMA_WRITE_ACCESS structural link: LatencyThresholdAlert, TurnLatencyMetric)
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`; repos none
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:174); 02 dependency edges (src/routes/latency.ts:2 imports src/lib/rbac.ts; src/routes/latency.ts:4 imports src/services/latencyService.ts; src/routes/latency.ts:3 imports src/utils/logger.ts; src/services/latencyService.ts:270 findUnique TurnLatencyMetric (read/service)); 03 mount table + shared-prefix grouping

### LOGIC-voice-api-voice-voiceroutes

- DOMAIN: voice
- CAPABILITY STATUS: CONFIRMED logic capability (entry + structural downstream boundary proven)
- CAPABILITY: HTTP capability group mounted at `/api/voice#voiceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/voice` via `voiceRoutes` (direct, src/index.ts:192, middleware: schoolAuthMiddleware, rateLimitMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/voice.ts`
- PRIMARY SERVICE(S): `src/services/voiceLedgerService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence (structural model link); family `student-identity-context` writer evidence (structural model link); family `voice` writer evidence (structural model link)
- PRISMA MODEL / DATA FAMILY: `ChatSession`, `StudentProfile`, `VoiceLedgerEntry`, `VoicePackageGrant`, `VoiceSessionUsage` → families `chat-session`, `student-identity-context`, `voice`
- INPUT / VALIDATION: SOURCE-CONFIRMED input validation (src/routes/voice.ts:36-48)
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence, R8A_STRUCTURAL)
- AUTHORIZATION / ROLE SCOPE: admin-only grant path gated by requireRole(admin) → 403 (SOURCE_INSPECTION); balance/session reads use mount auth only
- CORE DECISION LOGIC: SOURCE-CONFIRMED: src/routes/voice.ts:3-10 imports voiceLedgerService ops (applyVoicePaymentGrant, authorizeVoiceSession, start/stopVoiceSession) + requireRole + logger | src/routes/voice.ts:36-48 POST /admin/grants/apply: requireRole(admin) gate, studentId/minutesPurchased input validation with 400 paths | src/services/voiceLedgerService.ts:131,167,179,207,260,271 transactional persistence: tx.studentProfile.upsert, tx.voicePackageGrant.create/update, tx.voiceLedgerEntry.create
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: DUPLICATE_WRITER_CANDIDATE (PRISMA_WRITE_ACCESS structural link: ChatSession); `student-identity-context`: SHARED_BY_DESIGN (PRISMA_WRITE_ACCESS structural link: StudentProfile); `voice`: CLEAR (PRISMA_WRITE_ACCESS structural link: VoiceLedgerEntry, VoicePackageGrant, VoiceSessionUsage)
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: SOURCE-CONFIRMED failure/result paths (src/routes/voice.ts:36-48)
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- KEYWORD CANDIDATES (CANDIDATE_SIGNAL, not proof): services `src/services/voiceLedgerService.test.ts`; repos none
- COMPLETENESS: L4 (SOURCE_INSPECTION: src/routes/voice.ts:3-10; src/routes/voice.ts:36-48; src/services/voiceLedgerService.ts:131,167,179,207,260,271)
- CONFIDENCE: medium-high (source-confirmed coherent path; no runtime proof claimed) 
- EVIDENCE KIND: R8A_STRUCTURAL + DEPENDENCY_GRAPH + PRISMA_WRITE_ACCESS + SOURCE_INSPECTION; keyword overlap is CANDIDATE_SIGNAL only
- EVIDENCE: 01 routes.mounts[] (src/index.ts:192); 02 dependency edges (src/routes/voice.ts:10 imports src/lib/rbac.ts; src/routes/voice.ts:3 imports src/services/voiceLedgerService.ts; src/routes/voice.ts:11 imports src/utils/logger.ts; src/services/voiceLedgerService.ts:131 upsert StudentProfile (write/service)); 03 mount table + shared-prefix grouping

## Compatibility / Transitional Logic

No repository evidence for this section — omitted from capability detail (no unsupported entries invented).

## Unresolved Logic

Route groups below are route/capability CANDIDATES (CANDIDATE_SIGNAL + R8A_STRUCTURAL mount evidence). They are not counted as proven logic capabilities because no downstream behavior boundary (service call, repository/data effect, external operation) is structurally proven. Stable deterministic LOGIC IDs are retained for tracking.

Unresolved route-group candidates (7 of 110 mount groups):

Logic ID | Mount key | Reason unresolved | Evidence
--- | --- | --- | ---
LOGIC-memory-api-copilot-evidence | /api/copilot/evidence | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:545; origins: none
LOGIC-question-bank-api-question-bank-exam-papers | /api/question-bank/exam-papers | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:384; origins: none
LOGIC-question-bank-api-question-bank-marking | /api/question-bank/marking | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:380; origins: none
LOGIC-question-bank-api-question-bank-marking-invocation | /api/question-bank/marking-invocation | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:398; origins: none
LOGIC-question-bank-api-question-bank-recovery-case-adjudication | /api/question-bank/recovery-case-adjudication | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:503; origins: none
LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board | /api/question-bank/recovery-execution-readiness-board | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:479; origins: none
LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure | /api/question-bank/recovery-lifecycle-closure | no importOrigin (mount origin not statically linked) | 01 routes.mounts[] src/index.ts:454; origins: none

Unmounted route candidates (9): `src/domains/curriculum-knowledge-graph/routes/CurriculumGraphRouter.ts`, `src/routes/ai-route-segmentation.contract.test.ts`, `src/routes/ai.assistant-envelope.contract.test.ts`, `src/routes/ai.growth-endpoints.contract.test.ts`, `src/routes/ai/ai-chat.routes.ts`, `src/routes/ai/ai-route-contracts.ts`, `src/routes/task026ControlledPilotExecutionRoutes.ts`, `src/routes/task033CanaryObservationRoutes.ts`, `src/routes/task034ControlledRolloutRoutes.ts`. Each is L1 at most; runtime reachability is UNRESOLVED, not disproven.

Test/proof-only mounts (45): excluded from capability detail; representative evidence: `src/tests/learner-memory-r2-repair.test.ts:39`, `src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:9`, `src/tests/task-032-cross-learner-denial.contract.test.ts:10`, `src/tests/task-032-cross-school-denial.contract.test.ts:10`, `src/tests/task-032-peer-denied-routes.contract.test.ts:10`, `src/tests/task-032-routes-activation-lifecycle.contract.test.ts:10`.

Auxiliary or unresolved route modules (12): `src/domains/learning-evidence/routes/learningEvidenceRoutes.ts`, `src/routes/ai/ai-middleware.ts`, `src/routes/ai/ai-shared.ts`, `src/routes/examPaper.ts`, `src/routes/marking.ts`, `src/routes/markingInvocation.ts`, `src/routes/recoveryCaseAdjudication.ts`, `src/routes/recoveryExecutionReadinessBoard.ts`, `src/routes/recoveryLifecycleClosure.ts`, `src/services/aiGateway/safeModelRouter.ts`, `src/services/tutorModeExecutionRouter.ts`, `src/services/tutorTurnRuntimeModeRouter.ts`.

Gap notes:

- UNRESOLVED_INTERNAL_IMPORT: `src/tests/backend-structure.contract.test.ts:62` imports `../../src/utils/prismaClient` (resolution=unresolved_internal). Classification only; no repair in R8-B.
- R8-A summary reports unresolvedInternalImports=1; graph evidence lists 1. The single accepted import is represented above where graph evidence resolves it, otherwise carried as the summary-level count.

Dependency cycles (5 accepted; classification only):

- `f-a8dba5e5eb52`: `src/domains/assessment/exam-blueprint/contracts/examBlueprintRepositoryContracts.ts` ↔ `src/domains/assessment/exam-blueprint/contracts/index.ts` — assessment exam-blueprint contracts (auxiliary barrel pair); initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.
- `f-f15ee3746717`: `src/domains/assessment/runtime/questionBankRuntimeComposition.ts` ↔ `src/routes/examPaper.ts` — assessment runtime composition vs exam-paper route (runtime reachable candidate); initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.
- `f-46c16965c23c`: `src/media-stream/metadata.ts` ↔ `src/media-stream/scoring.ts` — media-stream metadata vs scoring (domain pair); initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.
- `f-4590df85597b`: `src/services/learningEffectivenessService.ts` ↔ `src/services/revisionLearningService.ts` — learning-effectiveness vs revision-learning services (domain pair, runtime reachable candidate); initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.
- `f-34ebf97e1b6c`: `src/services/nextPracticeService.ts` ↔ `src/services/practiceAttemptService.ts` — next-practice vs practice-attempt services (domain pair, runtime reachable candidate); initialization/control-flow relevance UNRESOLVED statically; later engineering review needed; no refactor in R8-B.

Duplicate/legacy classification (no destructive action):

- DUPLICATE_SERVICE_CANDIDATE `adaptivechallengeaudit`: adaptiveChallengeAuditRepository, adaptiveChallengeAuditService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`
- DUPLICATE_SERVICE_CANDIDATE `adaptiverecommendationprofile`: adaptiveRecommendationProfileRepository, adaptiveRecommendationProfileService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`
- DUPLICATE_SERVICE_CANDIDATE `canaryactivationstatemachine`: task032CanaryActivationStateMachine, task032CanaryActivationStateMachineService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task032CanaryActivationStateMachine.ts`, `src/services/task032CanaryActivationStateMachineService.ts`
- DUPLICATE_SERVICE_CANDIDATE `contentgovernanceaudit`: prismaContentGovernanceAuditRepository, task022ContentGovernanceAuditService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/contentGovernance/repositories/prismaContentGovernanceAuditRepository.ts`, `src/services/task022ContentGovernanceAuditService.ts`
- DUPLICATE_SERVICE_CANDIDATE `contentgovernancereadiness`: contentGovernanceReadinessService, task023Task022ContentGovernanceReadinessService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/contentGovernance/contentGovernanceReadinessService.ts`, `src/services/task023Task022ContentGovernanceReadinessService.ts`
- DUPLICATE_SERVICE_CANDIDATE `contracts`: task011Contracts, task015Contracts, task017Contracts — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/mastery/task011Contracts.ts`, `src/services/task015Contracts.ts`, `src/services/task017Contracts.ts`
- DUPLICATE_SERVICE_CANDIDATE `controlledrolloutstatemachine`: task034ControlledRolloutStateMachine, task034ControlledRolloutStateMachineService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task034ControlledRolloutStateMachine.ts`, `src/services/task034ControlledRolloutStateMachineService.ts`
- DUPLICATE_SERVICE_CANDIDATE `curriculumsourcereview`: task033CurriculumSourceReviewService, task034CurriculumSourceReviewService, task035CurriculumSourceReviewService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task033CurriculumSourceReviewService.ts`, `src/services/task034CurriculumSourceReviewService.ts`, `src/services/task035CurriculumSourceReviewService.ts`
- DUPLICATE_SERVICE_CANDIDATE `deengovernancereview`: task033DeenGovernanceReviewService, task034DeenGovernanceReviewService, task035DeenGovernanceReviewService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task033DeenGovernanceReviewService.ts`, `src/services/task034DeenGovernanceReviewService.ts`, `src/services/task035DeenGovernanceReviewService.ts`
- DUPLICATE_SERVICE_CANDIDATE `deploymentreadiness`: task023DeploymentReadinessRepository, task023PrismaDeploymentReadinessService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task023DeploymentReadinessRepository.ts`, `src/services/task023PrismaDeploymentReadinessService.ts`
- DUPLICATE_SERVICE_CANDIDATE `diagnostics`: task031DiagnosticsService, task034DiagnosticsService, task036DiagnosticsService, task040DiagnosticsService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task031DiagnosticsService.ts`, `src/services/task034DiagnosticsService.ts`, `src/services/task036DiagnosticsService.ts` +1 more
- DUPLICATE_SERVICE_CANDIDATE `evidenceledger`: task034EvidenceLedgerService, task036EvidenceLedgerService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task034EvidenceLedgerService.ts`, `src/services/task036EvidenceLedgerService.ts`
- DUPLICATE_SERVICE_CANDIDATE `exampaperassemblypersistence`: inMemoryExamPaperAssemblyPersistence, prismaExamPaperAssemblyPersistence — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts`, `src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts`
- DUPLICATE_SERVICE_CANDIDATE `executionaudit`: task026ExecutionAuditService, task028ExecutionAuditService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task026ExecutionAuditService.ts`, `src/services/task028ExecutionAuditService.ts`
- DUPLICATE_SERVICE_CANDIDATE `executiondiagnostics`: task026ExecutionDiagnosticsService, task028ExecutionDiagnosticsService — classification: LIKELY_DUPLICATION_REVIEW_REQUIRED; evidence: `src/services/task026ExecutionDiagnosticsService.ts`, `src/services/task028ExecutionDiagnosticsService.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `examblueprintrepositories`: inMemoryExamBlueprintRepositories, prismaExamBlueprintRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `examdeliveryrepositories`: inMemoryExamDeliveryRepositories, prismaExamDeliveryRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `exampaperrepositories`: inMemoryExamPaperRepositories, prismaExamPaperRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/exam-paper/repositories/prismaExamPaperRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `learningevidenceeventstore`: inMemoryLearningEvidenceEventStoreRepository, learningEvidenceEventStoreRepository, prismaLearningEvidenceEventStoreRepository — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `markinginvocationrepositories`: inMemoryMarkingInvocationRepositories, prismaMarkingInvocationRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `markingrepositories`: inMemoryMarkingRepositories, prismaMarkingRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`, `src/domains/assessment/marking/repositories/prismaMarkingRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `questionbankrepositories`: inMemoryQuestionBankRepositories, prismaQuestionBankRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoverycaseadjudicationrepositories`: inMemoryRecoveryCaseAdjudicationRepositories, prismaRecoveryCaseAdjudicationRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoverycasetriagerepositories`: inMemoryRecoveryCaseTriageRepositories, prismaRecoveryCaseTriageRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoveryexecutionauthorizationpreviewrepositories`: inMemoryRecoveryExecutionAuthorizationPreviewRepositories, prismaRecoveryExecutionAuthorizationPreviewRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoveryexecutionreadinessboardrepositories`: inMemoryRecoveryExecutionReadinessBoardRepositories, prismaRecoveryExecutionReadinessBoardRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoverylifecycleclosurerepositories`: inMemoryRecoveryLifecycleClosureRepositories, prismaRecoveryLifecycleClosureRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts`, `src/domains/assessment/recovery-lifecycle-closure/repositories/prismaRecoveryLifecycleClosureRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoveryoutcomeactionrepositories`: inMemoryRecoveryOutcomeActionRepositories, prismaRecoveryOutcomeActionRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts`, `src/domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoveryoutcomeexecutionsimulationrepositories`: inMemoryRecoveryOutcomeExecutionSimulationRepositories, prismaRecoveryOutcomeExecutionSimulationRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/prismaRecoveryOutcomeExecutionSimulationRepositories.ts`
- DUPLICATE_REPOSITORY_CANDIDATE `recoveryoutcomerepositories`: inMemoryRecoveryOutcomeRepositories, prismaRecoveryOutcomeRepositories — classification: SHARED_BY_DESIGN (in-memory/test doubles alongside durable owners) or TEST_OR_PROOF_ONLY; evidence: `src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts`, `src/domains/assessment/recovery-outcome/repositories/prismaRecoveryOutcomeRepositories.ts`
- SHARED_MOUNT_PREFIX_CANDIDATE groups: 6 — classification: SHARED_BY_DESIGN (Express mount layering; distinct routers under one prefix are not duplication). DUPLICATE_EFFECTIVE_ROUTE: none reported.

## Completeness Summary

L4 is awarded only with SOURCE_INSPECTION evidence citing the production source that justified it (input/validation + decision + persistence/output + failure/result path). Keyword/path matches alone never produce L3 or L4.

Level | Capabilities | Meaning
--- | --- | ---
L0 ABSENT | 0 | structural evidence band
L1 SCAFFOLD | 0 | structural evidence band
L2 PARTIAL | 7 | structural evidence band
L3 CONNECTED | 99 | structural route→downstream connection proven
L4 FUNCTIONALLY COMPLETE | 4 | source-confirmed functional behavior only
L5 RELIABLE | 0 | not awarded in R8-B (requires runtime proof)
L6 PRODUCTION-READY CANDIDATE | 0 | not awarded in R8-B (requires runtime proof)
L7 OPTIMIZED | 0 | not awarded in R8-B (requires runtime proof)

L4 source-evidence index (4): `LOGIC-mastery-api-copilot-practice-mastery` (src/routes/practiceMastery.ts:14-28; src/routes/practiceMastery.ts:54,84,105,126,148,175,200; src/routes/practiceMastery.ts:56,85,106,127; src/routes/practiceMastery.ts:67-77), `LOGIC-memory-api-copilot-learner-memory` (src/routes/learnerMemory.ts:11-19; src/routes/learnerMemory.ts:53,81,111; src/routes/learnerMemory.ts:54,86,112; src/routes/learnerMemory.ts:64-71,94-101; src/services/learnerMemoryService.ts:503,505,731,767), `LOGIC-question-bank-api-content-governance-contentgovernanceroutes` (src/routes/contentGovernance.ts:25-31; src/routes/contentGovernance.ts:47,71,87,153,176; src/routes/contentGovernance.ts:203-210), `LOGIC-voice-api-voice-voiceroutes` (src/routes/voice.ts:3-10; src/routes/voice.ts:36-48; src/services/voiceLedgerService.ts:131,167,179,207,260,271).

Source-inspected capabilities: 7 registry entries (backend/src read-only; files unchanged).

R8-B awards no final backend production readiness. No capability is rated above L4.

