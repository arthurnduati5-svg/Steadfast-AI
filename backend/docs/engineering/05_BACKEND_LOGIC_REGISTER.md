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

Capability IDs are stable and deterministic: `LOGIC-<domain>-<mount-key>`, sorted lexicographically. Completeness scale: L0 ABSENT, L1 SCAFFOLD, L2 PARTIAL, L3 CONNECTED, L4 FUNCTIONALLY COMPLETE, L5 RELIABLE, L6 PRODUCTION-READY CANDIDATE, L7 OPTIMIZED. R8-B awards L1–L4 from structural evidence only: L4 = mounted + production service match + production writer in a linked data family; L3 = mounted + one of service/writer; L2 = mounted with neither; L1 = unmounted route candidate. L5–L7 require runtime proof and are never awarded here.

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

Enforcement observed on production mounts (`src/index.ts` mount middleware, R8-A route evidence):

- AUTHENTICATION: `schoolAuthMiddleware` on near-all production mounts; a small set of mounts (health, readiness, ops-public, copilot handoff, deployment-readiness, task024 operations) carry no mount middleware in R8-A evidence.
- SCHOOL CONTEXT: `requireVerifiedSchoolContext` on learner/session/evidence/teacher/governance/readiness mounts.
- ROLE AUTHORIZATION: route-prefix scoping (`/api/admin/*`, `/api/learner/*`, `/api/question-bank/result-*`) plus service-level role checks where R1–R7 accepted architecture establishes them; per-capability service enforcement below is UNRESOLVED unless a service/contract match proves it.
- RESOURCE OWNERSHIP: UNRESOLVED statically; learner/school scoping is enforced at middleware + service layers per accepted R1–R7 behavior, referenced not re-proven.
- SAFETY/GOVERNANCE CHECK: governance mounts (`content-governance`, `security-privacy-governance`, `privacyGovernance`, `no-ai-bypass`) expose the check surfaces; decision internals are UNRESOLVED statically.
- No authorization is inferred from an authenticated prefix alone; the middleware column per capability is the evidence.

## Learning Core

### LOGIC-learning-core-api-copilot-copilothandoffroutes

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/copilot#copilotHandoffRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `copilotHandoffRoutes` (direct, src/index.ts:197, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/copilotHandoff.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryPostSimulationHandoffPacketService.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/task031CopilotBootstrapSmokeService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:197); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-learning-core-api-copilot-live-chat

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/copilot/live-chat` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/live-chat` via `liveChatRoutes` (direct, src/index.ts:183, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/liveChat.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryAuditBridge.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/repositories/task036LiveSchoolLaunchRepository.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `question-bank` (226 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:183); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-learning-core-api-copilot-tutor-actions

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-actions` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/tutor-actions` via `tutorActionRoutes` (direct, src/index.ts:510, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorActionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSafetyService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSummaryService.ts`, `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/aiProviderRequestRedactionService.ts`, `src/services/artifactConceptBlockExtractionService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `question-bank` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:510); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-learning-core-api-copilot-tutor-state

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-state` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/tutor-state` via `tutorStateRoutes` (direct, src/index.ts:176, middleware: schoolAuthMiddleware); `/api/copilot/tutor-state` via `tutorStateV2Routes` (direct, src/index.ts:177, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorState.ts`, `src/routes/tutorStateEndpoint.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactAwarePracticeStateService.ts`, `src/services/artifactReasoningTutorContextBridge.ts`, `src/services/artifactTutorContextBridge.ts`, `src/services/artifactVideoTutorStateContinuityAdapter.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `mastery` writer evidence; family `objectives` writer evidence; family `question-bank` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `mastery` (13 models), `objectives` (31 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:176, src/index.ts:177); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-learning-core-api-copilot-tutor-turn

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/copilot/tutor-turn` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/tutor-turn` via `tutorTurnRuntimeRoutes` (direct, src/index.ts:534, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorTurnRuntimeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactReasoningTutorContextBridge.ts`, `src/services/artifactTutorContextBridge.ts`, `src/services/artifactVideoTutorStateContinuityAdapter.ts`, `src/services/assistantTurnPipelineService.test.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `operations-readiness` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `operations-readiness` (7 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `operations-readiness`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:534); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-learning-core-api-tutor-tutorconversationroutes

- DOMAIN: learning-core
- CAPABILITY: HTTP capability group mounted at `/api/tutor#tutorConversationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/tutor` via `tutorConversationRoutes` (direct, src/index.ts:201, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/tutorConversation.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/tutorMessageGenerationService.ts`, `src/services/aiGateway/tutorSafeResponseAssembler.ts`, `src/services/artifactReasoningTutorContextBridge.ts`, `src/services/artifactTutorContextBridge.ts`, `src/services/artifactVideoTutorStateContinuityAdapter.ts`, `src/services/conversationArchiveAccessContracts.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:201); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Memory / Evidence

### LOGIC-memory-api-copilot-evidence

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/copilot/evidence` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/evidence` via `createLearningEvidenceRouter` (factory, src/index.ts:545, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseEvidenceBundleService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `learning-evidence` (19 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learning-evidence`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:545); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-memory-api-copilot-learner-memory

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learner-memory` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learner-memory` via `learnerMemoryRoutes` (direct, src/index.ts:179, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerMemory.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts`, `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `learner-memory` (3 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:179); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-memory-api-copilot-learner-transparency

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learner-transparency` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learner-transparency` via `learnerTransparencyRoutes` (direct, src/index.ts:553, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerTransparencyRoutes.ts`
- PRIMARY SERVICE(S): `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `learner-memory` (3 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:553); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-memory-api-copilot-learning-evidence

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learning-evidence` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learning-evidence` via `safeLearningEvidenceRoutes` (direct, src/index.ts:538, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/safeLearningEvidenceRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseEvidenceBundleService.ts`, `src/domains/assessment/recovery-progress/services/recoveryEvidenceRollupService.ts`, `src/domains/assessment/recovery-progress/services/recoveryOutcomeEvidenceService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:538); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-memory-api-copilot-teacher-insights

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/copilot/teacher-insights` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/teacher-insights` via `teacherSafeInsightRoutes` (direct, src/index.ts:549, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teacherSafeInsightRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionTeacherReviewService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryOutcomeTeacherReviewPacketService.ts`, `src/domains/assessment/recovery-progress/services/recoveryTeacherReviewDecisionService.ts`
- REPOSITORY / DATA OWNER: family `question-bank` writer evidence; family `safeguarding-privacy` writer evidence; family `school-integration` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:549); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-memory-api-question-bank-result-learning-evidence

- DOMAIN: memory
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-learning-evidence` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-learning-evidence` via `resultLearningEvidenceRoutes` (direct, src/index.ts:406, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultLearningEvidence.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:406); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Mastery / Objectives / Practice / Revision

### LOGIC-mastery-api-copilot-adaptive-challenges

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/adaptive-challenges` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/adaptive-challenges` via `adaptiveChallengeTask015Routes` (direct, src/index.ts:562, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveChallengeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/studentChallengeService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengeGenerationRuntime.ts`, `src/services/adaptiveChallengePrivacyGuard.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `practice` (6 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:562); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-adaptive-recommendations

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/adaptive-recommendations` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/adaptive-recommendations` via `adaptiveRecommendationTuningRoutes` (direct, src/index.ts:557, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveRecommendationTuningRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengeGenerationRuntime.ts`
- REPOSITORY / DATA OWNER: family `mastery` writer evidence; family `practice` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `mastery` (13 models), `practice` (6 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS; `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:557); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-exam-mode

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/exam-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/exam-mode` via `examModeRoutes` (direct, src/index.ts:516, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/examModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts`, `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/exam-paper/repositories/prismaExamPaperRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `objectives` (31 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:516); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-focus-mode

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/focus-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/focus-mode` via `focusModeRoutes` (direct, src/index.ts:513, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/focusModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/moderationService.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`, `src/services/aiGateway/providers/cloudModelAdapter.ts`, `src/services/aiGateway/providers/localModelAdapter.ts`, `src/services/aiGateway/providers/mockModelAdapter.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:513); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-growth

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/growth` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/growth` via `growthAggregateRoutes` (direct, src/index.ts:193, middleware: schoolAuthMiddleware); `/api/copilot/growth` via `growthActionRoutes` (direct, src/index.ts:530, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/growthActionRoutes.ts`, `src/routes/growthAggregate.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/growthActionAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `mastery` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `mastery` (13 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:193, src/index.ts:530); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-practice-mastery

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/practice-mastery` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/practice-mastery` via `practiceMasteryRoutes` (direct, src/index.ts:180, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/practiceMastery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryPracticeDraftService.ts`, `src/services/artifactAwarePracticeChatOrchestrator.ts`, `src/services/artifactAwarePracticeChatTriggerService.ts`
- REPOSITORY / DATA OWNER: family `learning-evidence` writer evidence; family `mastery` writer evidence; family `practice` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `learning-evidence` (19 models), `mastery` (13 models), `practice` (6 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:180); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-quiz-mode

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/quiz-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/quiz-mode` via `quizModeRoutes` (direct, src/index.ts:519, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/quizModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/moderationService.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`, `src/services/aiGateway/providers/cloudModelAdapter.ts`, `src/services/aiGateway/providers/localModelAdapter.ts`, `src/services/aiGateway/providers/mockModelAdapter.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:519); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-remediation

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/remediation` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/remediation` via `remediationTask015Routes` (direct, src/index.ts:563, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/remediationRoutes.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/remediationPathPlanner.ts`, `src/services/remediationPathRepository.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `practice` (6 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:563); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-revision-mode

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/revision-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/revision-mode` via `revisionModeRoutes` (direct, src/index.ts:526, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/revisionModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/result-learning-evidence/services/revisionSignalDispatchService.ts`, `src/services/aiGateway/modelProviderContracts.ts`, `src/services/aiGateway/modelRoutingContracts.ts`, `src/services/aiGateway/providers/cloudModelAdapter.ts`, `src/services/aiGateway/providers/localModelAdapter.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `revision` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `revision` (8 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `revision`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:526); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-copilot-teach-back-mode

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/copilot/teach-back-mode` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/teach-back-mode` via `teachBackModeRoutes` (direct, src/index.ts:522, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teachBackModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeRollbackPlanService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionTeacherReviewService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task040BackendFreezeRepository.ts`
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `operations-readiness` (7 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:522); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-learner-adaptivechallengeroutes

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/learner#adaptiveChallengeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `adaptiveChallengeRoutes` (direct, src/index.ts:202, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/adaptiveChallenges.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/studentChallengeService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/adaptiveChallengeAuditService.ts`, `src/services/adaptiveChallengeGenerationRuntime.ts`, `src/services/adaptiveChallengePrivacyGuard.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence; family `practice` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `learner-memory` (3 models), `practice` (6 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:202); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-confidence-recovery

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/confidence-recovery` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/confidence-recovery` via `phase3ConfidenceRecoveryRoutes` (direct, src/index.ts:593, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ConfidenceRecoveryRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-case-adjudication/services/index.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationAuditBridge.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationIdempotencyService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationSafetyService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationSummaryService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:593); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-daily-learning-feed

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/daily-learning-feed` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/daily-learning-feed` via `phase3DailyLearningFeedRoutes` (direct, src/index.ts:577, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3DailyLearningFeedRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `school-integration` (33 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:577); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-daily-objective-checks

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/daily-objective-checks` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/daily-objective-checks` via `phase3DailyObjectiveCheckRoutes` (direct, src/index.ts:573, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3DailyObjectiveCheckRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts`, `src/services/artifactLearningObjectiveService.ts`, `src/services/backendDependencyCheckService.ts`, `src/services/backendStartupCheckService.ts`
- REPOSITORY / DATA OWNER: `src/services/contentGovernance/repositories/prismaLearningObjectiveRepository.ts`
- PRISMA MODEL / DATA FAMILY: `mastery` (13 models), `objectives` (31 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:573); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-growth-page

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/growth-page` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/growth-page` via `phase3GrowthPageRoutes` (direct, src/index.ts:585, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3GrowthPageRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/services/growthActionAccessPolicy.ts`, `src/services/growthActionEvidenceService.ts`, `src/services/growthActionExecutionService.ts`, `src/services/growthActionLearnerStateService.ts`, `src/services/growthActionPrivacyGuard.ts`
- REPOSITORY / DATA OWNER: family `mastery` writer evidence
- PRISMA MODEL / DATA FAMILY: `mastery` (13 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:585); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-living-revision

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/living-revision` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/living-revision` via `phase3LivingRevisionRoutes` (direct, src/index.ts:589, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3LivingRevisionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/revisionSignalDispatchService.ts`, `src/services/mastery/revisionSchedulingRuntime.ts`, `src/services/phase3ConfidenceCalibrationService.ts`, `src/services/phase3ConfidenceMismatchDetectionService.ts`, `src/services/phase3ConfidenceRecoveryAuditService.ts`, `src/services/phase3ConfidenceRecoveryDailyCheckAdapterService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `revision` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `revision` (8 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `revision`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:589); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-objectives

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/objectives` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/objectives` via `phase3ObjectiveMasteryRoutes` (direct, src/index.ts:569, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ObjectiveMasteryRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-recovery/services/resultRecoveryObjectiveService.ts`, `src/services/artifactLearningObjectiveService.ts`, `src/services/phase3ConfidenceCalibrationService.ts`, `src/services/phase3ConfidenceMismatchDetectionService.ts`, `src/services/phase3ConfidenceRecoveryAuditService.ts`, `src/services/phase3ConfidenceRecoveryDailyCheckAdapterService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:569); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-mastery-api-phase3-study-plans

- DOMAIN: mastery
- CAPABILITY: HTTP capability group mounted at `/api/phase3/study-plans` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/study-plans` via `phase3StudyPlanRoutes` (direct, src/index.ts:581, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3StudyPlanRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeRollbackPlanService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionSimulationPlanService.ts`, `src/domains/assessment/result-delivery/services/resultDeliveryRetryPlanService.ts`, `src/domains/assessment/result-follow-up/services/followUpEscalationPlanService.ts`, `src/domains/assessment/result-follow-up/services/resultFollowUpActionPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:581); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Artifacts / Media

### LOGIC-artifacts-api-copilot-artifacts

- DOMAIN: artifacts
- CAPABILITY: HTTP capability group mounted at `/api/copilot/artifacts` (2 mounts)
- ENTRY ROUTE(S): `/api/copilot/artifacts` via `artifactRoutes` (direct, src/index.ts:178, middleware: schoolAuthMiddleware); `/api/copilot/artifacts` via `artifactAwarePracticeRoutes` (direct, src/index.ts:190, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/artifactAwarePractice.ts`, `src/routes/artifacts.ts`
- PRIMARY SERVICE(S): `src/services/artifactSafeSummaryService.ts`, `src/services/artifactSafetyGuardService.ts`, `src/services/artifactService.ts`, `src/services/artifactSourceProvenanceService.ts`, `src/services/artifactStructuredRepository.ts`, `src/services/copilotHandoffContracts.ts`
- REPOSITORY / DATA OWNER: family `artifacts-media` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:178, src/index.ts:190); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-artifacts-api-copilot-videoawarepracticeroutes

- DOMAIN: artifacts
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoAwarePracticeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoAwarePracticeRoutes` (direct, src/index.ts:186, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoAwarePractice.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-recovery/services/resultRecoveryPracticeDraftService.ts`, `src/services/aiGateway/deenAwareGenerationService.ts`, `src/services/aiGateway/policyAwarePromptBuilder.ts`, `src/services/artifactAwareAnswerEvaluator.ts`, `src/services/artifactAwareMisconceptionService.ts`, `src/services/artifactAwarePracticeChatOrchestrator.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `practice` (6 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:186); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-artifacts-api-copilot-videolearningsessionroutes

- DOMAIN: artifacts
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoLearningSessionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoLearningSessionRoutes` (direct, src/index.ts:185, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoLearningSessions.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `question-bank` (226 models), `revision` (8 models), `student-identity-context` (3 models), `unclassified` (42 models), `voice` (4 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED; `voice`: CLEAR
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:185); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-artifacts-api-copilot-videorecommendationroutes

- DOMAIN: artifacts
- CAPABILITY: HTTP capability group mounted at `/api/copilot#videoRecommendationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `videoRecommendationRoutes` (direct, src/index.ts:184, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoRecommendations.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/adaptiveRecommendationSourceTruthPolicy.ts`, `src/services/adaptiveRecommendationTuningAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `mastery` writer evidence; family `practice` writer evidence; family `question-bank` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `mastery` (13 models), `practice` (6 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `mastery`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:184); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-artifacts-api-video-learning-analytics-videolearninganalyticsroutes

- DOMAIN: artifacts
- CAPABILITY: HTTP capability group mounted at `/api/video-learning-analytics#videoLearningAnalyticsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/video-learning-analytics` via `videoLearningAnalyticsRoutes` (direct, src/index.ts:187, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/videoLearningAnalytics.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:187); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Curriculum / Assessment / Question Bank

### LOGIC-question-bank-api-content-governance-contentgovernanceroutes

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/content-governance#contentGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/content-governance` via `contentGovernanceRoutes` (direct, src/index.ts:213, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/contentGovernance.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/question-bank/services/questionContentSafetyReviewBridge.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/services/contentGovernance/repositories/failingRepository.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/contentGovernance/repositories/index.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `question-bank` (226 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `question-bank`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:213); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-learningmoderoutes

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api#learningModeRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `learningModeRoutes` (direct, src/index.ts:506, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learningModeRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking/services/moderationService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:506); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-exam-delivery

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/exam-delivery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/exam-delivery` via `examDeliveryRoutes` (direct, src/index.ts:388, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/examDelivery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts`, `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/exam-paper/repositories/prismaExamPaperRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:388); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-exam-papers

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/exam-papers` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/exam-papers` via `composedExamPaperRouter` (factory, src/index.ts:384, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts`, `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/exam-paper/repositories/prismaExamPaperRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:384); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-examblueprintroutes

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank#examBlueprintRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank` via `examBlueprintRoutes` (direct, src/index.ts:364, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/examBlueprint.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts`, `src/domains/assessment/exam-blueprint/services/examBlueprintCommandService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts`, `src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts`, `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts`, `src/domains/assessment/exam-blueprint/repositories/prismaExamBlueprintRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts`, `src/domains/assessment/exam-paper/repositories/prismaExamPaperRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:364); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-marking

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/marking` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/marking` via `composedMarkingRouter` (factory, src/index.ts:380, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts`, `src/domains/assessment/marking-invocation/services/markingBatchPlannerService.ts`, `src/domains/assessment/marking-invocation/services/markingInvocationAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`, `src/domains/assessment/marking/repositories/prismaMarkingRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:380); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-marking-invocation

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/marking-invocation` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/marking-invocation` via `composedMarkingInvocationRouter` (factory, src/index.ts:398, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/deterministicMarkingInvocationService.ts`, `src/domains/assessment/marking-invocation/services/markingBatchPlannerService.ts`, `src/domains/assessment/marking-invocation/services/markingInvocationAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts`, `src/domains/assessment/marking-invocation/repositories/prismaMarkingInvocationRepositories.ts`, `src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts`, `src/domains/assessment/marking/repositories/prismaMarkingRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:398); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-questionbankroutes

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank#questionBankRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank` via `questionBankRoutes` (direct, src/index.ts:360, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/questionBank.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:360); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-case-adjudication

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-case-adjudication` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-case-adjudication` via `composedRecoveryCaseAdjudicationRouter` (factory, src/index.ts:503, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:503); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-case-triage

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-case-triage` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-case-triage` via `recoveryCaseTriageRoutes` (direct, src/index.ts:483, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryCaseTriage.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:483); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-execution-authorization-preview

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-execution-authorization-preview` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-execution-authorization-preview` via `recoveryExecutionAuthorizationPreviewRoutes` (direct, src/index.ts:458, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryExecutionAuthorizationPreview.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:458); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-execution-readiness-board

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-execution-readiness-board` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-execution-readiness-board` via `composedRecoveryExecutionReadinessBoardRouter` (factory, src/index.ts:479, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `operations-readiness` (7 models), `practice` (6 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `operations-readiness`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:479); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-lifecycle-closure

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-lifecycle-closure` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-lifecycle-closure` via `composedRecoveryLifecycleClosureRouter` (factory, src/index.ts:454, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: UNRESOLVED — mount origin not statically linked
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:454); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-outcome

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome` via `recoveryOutcomeRoutes` (direct, src/index.ts:442, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcome.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:442); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-outcome-action

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome-action` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome-action` via `recoveryOutcomeActionRoutes` (direct, src/index.ts:446, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcomeAction.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:446); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-outcome-execution-simulation

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-outcome-execution-simulation` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-outcome-execution-simulation` via `recoveryOutcomeExecutionSimulationRoutes` (direct, src/index.ts:450, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryOutcomeExecutionSimulation.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:450); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-recovery-progress

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/recovery-progress` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/recovery-progress` via `recoveryProgressRoutes` (direct, src/index.ts:438, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/recoveryProgress.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`, `src/domains/assessment/question-bank/services/governedQuestionCommandService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:438); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-delivery

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-delivery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-delivery` via `resultDeliveryRoutes` (direct, src/index.ts:414, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultDelivery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:414); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-follow-up

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-follow-up` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-follow-up` via `resultFollowUpRoutes` (direct, src/index.ts:430, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultFollowUp.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:430); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-governance

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-governance` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-governance` via `resultGovernanceRoutes` (direct, src/index.ts:402, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultGovernance.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:402); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-recovery

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-recovery` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-recovery` via `resultRecoveryRoutes` (direct, src/index.ts:434, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultRecovery.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-adjudication/repositories/prismaRecoveryCaseAdjudicationRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts`, `src/domains/assessment/recovery-case-triage/repositories/prismaRecoveryCaseTriageRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:434); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-release

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-release` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-release` via `resultReleaseRoutes` (direct, src/index.ts:410, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultRelease.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:410); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-report-card-access

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-card-access` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-card-access` via `resultReportCardAccessRoutes` (direct, src/index.ts:426, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCardAccess.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-paper/services/examAccessPolicyService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `operations-readiness` (7 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `operations-readiness`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:426); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-report-card-export

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-card-export` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-card-export` via `resultReportCardExportRoutes` (direct, src/index.ts:422, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCardExport.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `operations-readiness` (7 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `operations-readiness`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:422); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-question-bank-result-report-cards

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/question-bank/result-report-cards` (1 mount)
- ENTRY ROUTE(S): `/api/question-bank/result-report-cards` via `resultReportCardRoutes` (direct, src/index.ts:418, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/resultReportCard.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/questionPoolEligibilityService.ts`, `src/domains/assessment/exam-blueprint/services/questionSelectionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/marking-invocation/services/markingResultVersionBridgeService.ts`, `src/domains/assessment/question-bank/services/duplicateFingerprintService.ts`, `src/domains/assessment/question-bank/services/extractMockAssessmentActorContext.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts`, `src/domains/assessment/question-bank/repositories/prismaQuestionBankRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts`, `src/domains/assessment/result-follow-up/repositories/prismaResultFollowUpRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learning-evidence` (19 models), `mastery` (13 models), `objectives` (31 models), `operations-readiness` (7 models), `practice` (6 models), `question-bank` (226 models), `revision` (8 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `mastery`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `operations-readiness`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/question-bank`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:418); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-question-bank-api-task022-curriculum-governance

- DOMAIN: question-bank
- CAPABILITY: HTTP capability group mounted at `/api/task022/curriculum-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task022/curriculum-governance` via `task022CurriculumContentGovernanceRoutes` (direct, src/index.ts:214, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task022CurriculumContentGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/services/contentGovernance/repositories/failingRepository.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/contentGovernance/repositories/index.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `question-bank` (226 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `question-bank`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:214); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Teacher / School / Administration

### LOGIC-school-api-copilot-learning-sessions

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/copilot/learning-sessions` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/learning-sessions` via `studentLearningSessionRoutes` (direct, src/index.ts:203, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/studentLearningSessionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:203); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-copilot-learningprofileroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/copilot#learningProfileRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `learningProfileRoutes` (direct, src/index.ts:507, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learningProfileRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `practice` (6 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:507); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-learner-learnerpreferenceroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerPreferenceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerPreferenceRoutes` (direct, src/index.ts:196, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/learnerPreferences.ts`
- PRIMARY SERVICE(S): `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/copilotPreferenceService.ts`, `src/services/growthActionLearnerStateService.ts`, `src/services/learnerAgencyOptionsService.ts`, `src/services/learnerChoicePolicyService.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `learner-memory` (3 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:196); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-learner-learnerrecommendationroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerRecommendationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerRecommendationRoutes` (direct, src/index.ts:195, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/learnerRecommendations.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryNextCycleRecommendationService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryResourceRecommendationService.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/adaptiveRecommendationSourceTruthPolicy.ts`, `src/services/adaptiveRecommendationTuningAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `learner-memory` writer evidence; family `mastery` writer evidence; family `practice` writer evidence; family `question-bank` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `learner-memory` (3 models), `mastery` (13 models), `practice` (6 models), `question-bank` (226 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `mastery`: AMBIGUOUS; `practice`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:195); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-learner-learnersessionroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/learner#learnerSessionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `learnerSessionRoutes` (direct, src/index.ts:200, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/learnerSessions.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examDeliverySessionService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseReviewSessionService.ts`, `src/services/artifactLearnerMemoryBridge.ts`, `src/services/artifactReasoningLearnerMemoryBridge.ts`, `src/services/assessmentSessionService.test.ts`, `src/services/assessmentSessionService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `learner-memory` writer evidence; family `objectives` writer evidence; family `question-bank` writer evidence; family `revision` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence; family `voice` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `learner-memory` (3 models), `objectives` (31 models), `question-bank` (226 models), `revision` (8 models), `student-identity-context` (3 models), `unclassified` (42 models), `voice` (4 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `revision`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED; `voice`: CLEAR
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:200); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-phase3-parent-support

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/phase3/parent-support` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/parent-support` via `phase3ParentSupportRoutes` (direct, src/index.ts:597, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3ParentSupportRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome/services/recoveryOutcomeParentUpdateDraftService.ts`, `src/domains/assessment/recovery-progress/services/recoveryParentProgressNoteDraftService.ts`, `src/domains/assessment/result-follow-up/services/parentGuidanceDraftService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryParentSupportNoteDraftService.ts`, `src/domains/assessment/result-recovery/services/resultRecoveryStudentSupportDraftService.ts`, `src/domains/assessment/result-release/services/parentSafeResultSummaryService.ts`
- REPOSITORY / DATA OWNER: family `objectives` writer evidence; family `question-bank` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `objectives` (31 models), `question-bank` (226 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `objectives`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:597); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-phase3-peer-learning

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/phase3/peer-learning` (1 mount)
- ENTRY ROUTE(S): `/api/phase3/peer-learning` via `phase3PeerLearningRoutes` (direct, src/index.ts:601, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/phase3PeerLearningRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-learning-evidence/services/growthSignalDispatchService.ts`, `src/domains/assessment/result-learning-evidence/services/index.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationApplicationService.ts`, `src/domains/assessment/result-learning-evidence/services/masteryMutationPlanService.ts`, `src/domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService.ts`, `src/domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceEventStoreRepository.ts`, `src/domains/learning-evidence/repositories/learningEvidenceRepositoryErrors.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`
- PRISMA MODEL / DATA FAMILY: `artifacts-media` (3 models), `chat-session` (9 models), `learning-evidence` (19 models), `objectives` (31 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `artifacts-media`: AMBIGUOUS; `chat-session`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `objectives`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/phase3`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:601); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-profileroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api#profileRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `profileRoutes` (direct, src/index.ts:194, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/profile.ts`
- PRIMARY SERVICE(S): `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/adaptiveRecommendationProfileService.ts`, `src/services/learningProfileAccessPolicy.ts`, `src/services/learningProfileEvidenceService.ts`, `src/services/learningProfilePrivacyGuard.ts`, `src/services/learningProfileResponseBuilder.ts`
- REPOSITORY / DATA OWNER: family `practice` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `practice` (6 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `practice`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:194); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-schoolintegrationroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api#schoolIntegrationRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `schoolIntegrationRoutes` (direct, src/index.ts:210, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/schoolIntegration.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryDeferredIntegrationTicketService.ts`, `src/services/artifactVideoEvidenceIntegrationService.ts`, `src/services/challengeAttemptIntegrationService.ts`, `src/services/chatContextIntegrationService.ts`, `src/services/disabledLiveSchoolSystemAdapter.ts`, `src/services/durableAuditIntegrationAdapters.ts`
- REPOSITORY / DATA OWNER: `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:210); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-task021-school-integration

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api/task021/school-integration` (1 mount)
- ENTRY ROUTE(S): `/api/task021/school-integration` via `task021SchoolIntegrationRoutes` (direct, src/index.ts:211, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task021SchoolIntegrationRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-lifecycle-closure/services/recoveryDeferredIntegrationTicketService.ts`, `src/services/artifactVideoEvidenceIntegrationService.ts`, `src/services/challengeAttemptIntegrationService.ts`, `src/services/chatContextIntegrationService.ts`, `src/services/disabledLiveSchoolSystemAdapter.ts`, `src/services/durableAuditIntegrationAdapters.ts`
- REPOSITORY / DATA OWNER: `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:211); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-teacherinterventionroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api#teacherInterventionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `teacherInterventionRoutes` (direct, src/index.ts:188, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/teacherInterventions.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionTeacherReviewService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryOutcomeTeacherReviewPacketService.ts`, `src/domains/assessment/recovery-progress/services/recoveryTeacherReviewDecisionService.ts`
- REPOSITORY / DATA OWNER: family `question-bank` writer evidence; family `safeguarding-privacy` writer evidence; family `school-integration` writer evidence
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:188); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-school-api-teacherreportroutes

- DOMAIN: school
- CAPABILITY: HTTP capability group mounted at `/api#teacherReportRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `teacherReportRoutes` (direct, src/index.ts:189, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/teacherReports.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/teacherReviewDispatchService.ts`, `src/domains/assessment/marking/services/teacherOverrideService.ts`, `src/domains/assessment/marking/services/teacherReviewQueueService.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionTeacherReviewService.ts`, `src/domains/assessment/recovery-outcome/services/recoveryOutcomeTeacherReviewPacketService.ts`, `src/domains/assessment/recovery-progress/services/recoveryTeacherReviewDecisionService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-access/repositories/prismaResultReportCardAccessRepositories.ts`, `src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts`, `src/domains/assessment/result-report-card-export/repositories/prismaResultReportCardExportRepositories.ts`, `src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `learning-evidence` (19 models), `operations-readiness` (7 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `learning-evidence`: AMBIGUOUS; `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:189); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Safety / Privacy / Governance

### LOGIC-safety-api-copilot-no-ai-bypass

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/copilot/no-ai-bypass` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/no-ai-bypass` via `noAiBypassAuditRoutes` (direct, src/index.ts:565, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/noAiBypassAuditRoutes.ts`
- PRIMARY SERVICE(S): `src/services/aiProviderNoBypassAuditService.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/noAiBypassApiAuditService.ts`
- REPOSITORY / DATA OWNER: family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:565); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-copilot-tutorpolicyevaluateroutes

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/copilot#tutorPolicyEvaluateRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `tutorPolicyEvaluateRoutes` (direct, src/index.ts:198, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorPolicyEvaluate.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-paper/services/examAccessPolicyService.ts`, `src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts`, `src/services/adaptiveChallengeAccessPolicy.ts`, `src/services/adaptiveChallengeSourceTruthPolicy.ts`, `src/services/adaptiveRecommendationSourceTruthPolicy.ts`, `src/services/adaptiveRecommendationTuningAccessPolicy.ts`
- REPOSITORY / DATA OWNER: family `assessment` writer evidence; family `chat-session` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `chat-session` (9 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `chat-session`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:198); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-copilot-tutorsafechatroutes

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/copilot#tutorSafeChatRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `tutorSafeChatRoutes` (direct, src/index.ts:199, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/tutorSafeChat.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-blueprint/services/examDraftProjectionSafetyService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService.ts`, `src/domains/assessment/exam-paper/services/examPaperProjectionSafetyService.ts`, `src/domains/assessment/marking-invocation/services/markingInvocationProjectionSafetyService.ts`, `src/domains/assessment/marking/services/markingProjectionSafetyService.ts`, `src/domains/assessment/question-bank/services/projectionSafetyService.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `learner-memory` writer evidence; family `learning-evidence` writer evidence; family `question-bank` writer evidence; family `safeguarding-privacy` writer evidence; family `student-identity-context` writer evidence; family `unclassified` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `learner-memory` (3 models), `learning-evidence` (19 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `learning-evidence`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:199); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-governance-privacygovernanceroutes

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/governance#privacyGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/governance` via `privacyGovernanceRoutes` (direct, src/index.ts:207, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/privacyGovernance.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/services/contentGovernance/repositories/failingRepository.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/contentGovernance/repositories/index.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `question-bank` (226 models), `safeguarding-privacy` (12 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:207); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-learner-privacygovernanceroutes

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/learner#privacyGovernanceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/learner` via `privacyGovernanceRoutes` (direct, src/index.ts:209, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/privacyGovernance.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/services/contentGovernance/repositories/failingRepository.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/contentGovernance/repositories/index.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `learner-memory` (3 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `student-identity-context` (3 models), `unclassified` (42 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `learner-memory`: DUPLICATE_WRITER_CANDIDATE; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE; `unclassified`: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/learner`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:209); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-task020-security-privacy-governance

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/task020/security-privacy-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task020/security-privacy-governance` via `task020SecurityPrivacyGovernanceRoutes` (direct, src/index.ts:208, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task020SecurityPrivacyGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/services/contentGovernance/repositories/failingRepository.ts`, `src/services/contentGovernance/repositories/inMemoryRepositories.ts`, `src/services/contentGovernance/repositories/index.ts`
- PRISMA MODEL / DATA FAMILY: `curriculum-content` (11 models), `question-bank` (226 models), `safeguarding-privacy` (12 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `curriculum-content`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:208); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-safety-api-task027-pilot-expansion-governance

- DOMAIN: safety
- CAPABILITY: HTTP capability group mounted at `/api/task027/pilot-expansion-governance` (1 mount)
- ENTRY ROUTE(S): `/api/task027/pilot-expansion-governance` via `task027PilotExpansionGovernanceRoutes` (direct, src/index.ts:261, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task027PilotExpansionGovernanceRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardGovernanceService.ts`, `src/domains/assessment/result-governance/services/index.ts`, `src/domains/assessment/result-governance/services/resultFinalizationDecisionService.ts`, `src/domains/assessment/result-governance/services/resultFinalizationReviewService.ts`, `src/domains/assessment/result-governance/services/resultGovernanceAuditBridge.ts`, `src/domains/assessment/result-governance/services/resultGovernanceIdempotencyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts`, `src/domains/assessment/result-governance/repositories/prismaResultGovernanceRepositories.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `curriculum-content` (11 models), `learning-evidence` (19 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `curriculum-content`: AMBIGUOUS; `learning-evidence`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:261); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Operations / Reliability / Observability

### LOGIC-operations-api-deploymentreadinessroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#deploymentReadinessRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `deploymentReadinessRoutes` (direct, src/index.ts:217, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/deploymentReadiness.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`, `src/services/contentGovernance/repositories/prismaReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:217); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-health-healthroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/health#healthRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/health` via `healthRoutes` (direct, src/index.ts:171, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/health.ts`
- PRIMARY SERVICE(S): `src/services/aiGateway/providerHealthService.ts`, `src/services/backendHealthService.ts`, `src/services/constitutionHealthService.ts`, `src/services/phase3HealthyChallengeParticipationService.ts`, `src/services/phase3HealthyChallengeService.ts`, `src/services/task017TutorRuntimeHealthReadinessService.ts`
- REPOSITORY / DATA OWNER: family `school-integration` writer evidence
- PRISMA MODEL / DATA FAMILY: `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:171); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-ops-diagnostics

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/ops/diagnostics` (1 mount)
- ENTRY ROUTE(S): `/api/ops/diagnostics` via `task018DiagnosticsRoutes` (direct, src/index.ts:205, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task018OperationsDiagnostics.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-outcome-execution-simulation/services/recoveryOutcomeExecutionBlockedActionDiagnosticService.ts`, `src/services/activeWorkLoopService.ts`, `src/services/learnerLoopService.ts`, `src/services/task017ProductionLearningLoopSmokeTestHarness.ts`, `src/services/task018AdminDiagnosticsScopePolicyService.ts`, `src/services/task018TutorRuntimeDiagnosticsService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `safeguarding-privacy` (12 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/ops`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:205); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-ops-opspublicrouter

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/ops#opsPublicRouter` (1 mount)
- ENTRY ROUTE(S): `/api/ops` via `opsPublicRouter` (direct, src/index.ts:204, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/task018OperationsDiagnostics.ts`
- PRIMARY SERVICE(S): `src/services/activeWorkLoopService.ts`, `src/services/learnerLoopService.ts`, `src/services/task017ProductionLearningLoopSmokeTestHarness.ts`, `src/services/weakAreaGrowthLoopService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task024OpsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `safeguarding-privacy` (12 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/ops`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:204); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-readinessroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#readinessRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `readinessRoutes` (direct, src/index.ts:172, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/readiness.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`, `src/services/contentGovernance/repositories/prismaReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:172); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task023-deployment-readiness

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task023/deployment-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task023/deployment-readiness` via `task023DeploymentReadinessRoutes` (direct, src/index.ts:220, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task023DeploymentReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`, `src/services/contentGovernance/repositories/prismaReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:220); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task024-operations-readiness

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task024/operations-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task024/operations-readiness` via `task024OperationsReadinessRoutes` (direct, src/index.ts:233, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task024OperationsReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task024OpsRepository.ts`, `src/repositories/task029ExpansionOperationsRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task035SchoolWideReadinessRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:233); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task024operationsroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task024OperationsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task024OperationsRoutes` (direct, src/index.ts:229, middleware: none recorded)
- PRIMARY ROUTE MODULE: `src/routes/task024OperationsRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task018SafeOperationsMonitoringRuntime.ts`, `src/services/task024BackupReadinessService.ts`, `src/services/task024DataIntegrityVerificationService.ts`, `src/services/task024GovernanceGateContinuityService.ts`, `src/services/task024IncidentAuditService.ts`, `src/services/task024IncidentClassificationService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task024OpsRepository.ts`, `src/repositories/task029ExpansionOperationsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: UNRESOLVED — no authentication middleware recorded on these mounts
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:229); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task025-pilot-readiness

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task025/pilot-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task025/pilot-readiness` via `task025ControlledPilotReadinessRoutes` (direct, src/index.ts:245, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task025ControlledPilotReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `operations-readiness` (7 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:245); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task025pilotroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task025PilotRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task025PilotRoutes` (direct, src/index.ts:242, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task025PilotRoutes.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/task025CandidateCohortReadinessService.ts`, `src/services/task025DataPrivacyReadinessService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task025PilotRepository.ts`, `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:242); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task026pilotexecutionroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task026PilotExecutionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task026PilotExecutionRoutes` (direct, src/index.ts:254, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task026PilotExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationAuditBridge.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationDryRunService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/prismaRecoveryOutcomeExecutionSimulationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:254); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task027pilotexpansionroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task027PilotExpansionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task027PilotExpansionRoutes` (direct, src/index.ts:258, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task027PilotExpansionRoutes.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/task025PilotAccessGateService.ts`, `src/services/task025PilotDryRunService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task025PilotRepository.ts`, `src/repositories/task026PilotExecutionRepository.ts`, `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/repositories/task029ExpansionOperationsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `safeguarding-privacy` (12 models), `school-integration` (33 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:258); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task028-controlled-expansion-execution

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task028/controlled-expansion-execution` (1 mount)
- ENTRY ROUTE(S): `/api/task028/controlled-expansion-execution` via `task028ControlledExpansionExecutionRoutes` (direct, src/index.ts:273, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task028ControlledExpansionExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationAuditBridge.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationDryRunService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/prismaRecoveryOutcomeExecutionSimulationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:273); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task028expansionexecutionroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task028ExpansionExecutionRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task028ExpansionExecutionRoutes` (direct, src/index.ts:270, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task028ExpansionExecutionRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-execution-authorization-preview/services/index.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionApprovalChainService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorityMatrixService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationAuditBridge.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationDryRunService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationEligibilityService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-authorization-preview/repositories/prismaRecoveryExecutionAuthorizationPreviewRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts`, `src/domains/assessment/recovery-outcome-execution-simulation/repositories/prismaRecoveryOutcomeExecutionSimulationRepositories.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:270); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task029expansionoperationsroutes

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api#task029ExpansionOperationsRoutes` (1 mount)
- ENTRY ROUTE(S): `/api` via `task029ExpansionOperationsRoutes` (direct, src/index.ts:282, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/task029ExpansionOperationsRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task018SafeOperationsMonitoringRuntime.ts`, `src/services/task024OperationsAuditService.ts`, `src/services/task024OperationsDiagnosticsService.ts`, `src/services/task024OperationsPrivacyGuardService.ts`, `src/services/task024OperationsReadinessRepository.ts`, `src/services/task024SafeOperationsSummaryService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task027PilotExpansionGovernanceRepository.ts`, `src/repositories/task027PilotExpansionRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/repositories/task029ExpansionOperationsRepository.ts`
- PRISMA MODEL / DATA FAMILY: `assessment` (2 models), `learning-evidence` (19 models), `operations-readiness` (7 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `assessment`: UNRESOLVED; `learning-evidence`: AMBIGUOUS; `operations-readiness`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:282); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task030-controlled-staging-rehearsal

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task030/controlled-staging-rehearsal` (1 mount)
- ENTRY ROUTE(S): `/api/task030/controlled-staging-rehearsal` via `task030ControlledStagingRehearsalRoutes` (direct, src/index.ts:286, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task030ControlledStagingRehearsalRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task030AdminOperatorJourneyService.ts`, `src/services/task030ControlActionRehearsalService.ts`, `src/services/task030ControlledStagingDiagnosticsService.ts`, `src/services/task030ControlledStagingRehearsalService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`, `src/repositories/task034ControlledLimitedRolloutRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no family keyword overlap proven
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:286); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task031-staging-smoke-canary-readiness

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task031/staging-smoke-canary-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task031/staging-smoke-canary-readiness` via `task031StagingSmokeCanaryReadinessRoutes` (direct, src/index.ts:295, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task031StagingSmokeCanaryReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:295); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task032-controlled-canary-activation

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task032/controlled-canary-activation` (1 mount)
- ENTRY ROUTE(S): `/api/task032/controlled-canary-activation` via `task032ControlledCanaryActivationRoutes` (direct, src/index.ts:304, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task032ControlledCanaryActivationRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`, `src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeMockActivationQueueService.ts`, `src/services/aiProviderActivationGuard.ts`, `src/services/schoolConnectorActivationGuard.ts`, `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`, `src/repositories/task034ControlledLimitedRolloutRepository.ts`
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:304); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task033-controlled-canary-observation

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task033/controlled-canary-observation` (1 mount)
- ENTRY ROUTE(S): `/api/task033/controlled-canary-observation` via `task033ControlledCanaryObservationRoutes` (direct, src/index.ts:313, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task033ControlledCanaryObservationRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/recovery-progress/services/recoveryProgressObservationService.ts`, `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task030ControlledStagingDiagnosticsService.ts`, `src/services/task030ControlledStagingRehearsalService.ts`, `src/services/task030ControlledStagingReportService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task031StagingSmokeCanaryReadinessRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`, `src/repositories/task034ControlledLimitedRolloutRepository.ts`
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:313); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task034-controlled-limited-rollout

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task034/controlled-limited-rollout` (1 mount)
- ENTRY ROUTE(S): `/api/task034/controlled-limited-rollout` via `task034ControlledLimitedRolloutRoutes` (direct, src/index.ts:322, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task034ControlledLimitedRolloutRoutes.ts`
- PRIMARY SERVICE(S): `src/services/task026ControlledPilotRunService.ts`, `src/services/task028ControlledExpansionRunService.ts`, `src/services/task030ControlledStagingDiagnosticsService.ts`, `src/services/task030ControlledStagingRehearsalService.ts`, `src/services/task030ControlledStagingReportService.ts`, `src/services/task034CanaryBaselineComparisonService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task030ControlledStagingRehearsalRepository.ts`, `src/repositories/task032ControlledCanaryActivationRepository.ts`, `src/repositories/task033ControlledCanaryObservationRepository.ts`, `src/repositories/task034ControlledLimitedRolloutRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no family keyword overlap proven
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:322); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task035-school-wide-readiness

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task035/school-wide-readiness` (1 mount)
- ENTRY ROUTE(S): `/api/task035/school-wide-readiness` via `task035SchoolWideReadinessRoutes` (direct, src/index.ts:331, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task035SchoolWideReadinessRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/marking-invocation/services/markingReadinessCheckService.ts`, `src/domains/assessment/recovery-case-adjudication/services/recoveryCaseAdjudicationReadinessService.ts`, `src/domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService.ts`, `src/domains/assessment/recovery-execution-authorization-preview/services/recoveryExecutionAuthorizationReadinessService.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/index.ts`, `src/domains/assessment/recovery-execution-readiness-board/services/recoveryExecutionReadinessBoardAuditBridge.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts`, `src/domains/assessment/recovery-execution-readiness-board/repositories/prismaRecoveryExecutionReadinessBoardRepositories.ts`, `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:331); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task036-live-school-launch

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task036/live-school-launch` (1 mount)
- ENTRY ROUTE(S): `/api/task036/live-school-launch` via `task036LiveSchoolLaunchRoutes` (direct, src/index.ts:341, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task036LiveSchoolLaunchRoutes.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/exam-delivery/services/examAnswerSubmissionService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService.ts`, `src/domains/assessment/exam-delivery/services/examAttemptService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryActivationService.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryAuditBridge.ts`, `src/domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService.ts`
- REPOSITORY / DATA OWNER: `src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts`, `src/domains/assessment/exam-delivery/repositories/prismaExamDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/repositories/schoolIdentityMappingRepository.ts`, `src/repositories/schoolIntegrationAuditRepository.ts`
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `safeguarding-privacy` (12 models), `school-integration` (33 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `safeguarding-privacy`: DUPLICATE_WRITER_CANDIDATE; `school-integration`: AMBIGUOUS
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:341); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-operations-api-task040-backend-freeze

- DOMAIN: operations
- CAPABILITY: HTTP capability group mounted at `/api/task040/backend-freeze` (1 mount)
- ENTRY ROUTE(S): `/api/task040/backend-freeze` via `task040BackendFreezeRoutes` (direct, src/index.ts:351, middleware: schoolAuthMiddleware, requireVerifiedSchoolContext)
- PRIMARY ROUTE MODULE: `src/routes/task040BackendFreezeRoutes.ts`
- PRIMARY SERVICE(S): `src/services/backendAiTelemetryService.ts`, `src/services/backendAuditEventService.ts`, `src/services/backendBackpressureService.ts`, `src/services/backendDependencyCheckService.ts`, `src/services/backendEnvSchema.ts`, `src/services/backendHealthService.ts`
- REPOSITORY / DATA OWNER: `src/repositories/task040BackendFreezeRepository.ts`
- PRISMA MODEL / DATA FAMILY: UNRESOLVED — no family keyword overlap proven
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: `requireVerifiedSchoolContext` school-context enforcement (mount evidence); role checks UNRESOLVED statically
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: UNRESOLVED
- EXTERNAL DEPENDENCIES: UNRESOLVED — none proven statically for this group
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: diagnostics/readiness/health mounts expose operational telemetry surfaces
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L3
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:351); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Voice / External Integrations

### LOGIC-voice-api-copilot-airoutes

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/copilot#aiRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/copilot` via `aiRoutes` (direct, src/index.ts:191, middleware: schoolAuthMiddleware, rateLimitMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/ai.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/task031CopilotBootstrapSmokeService.ts`
- REPOSITORY / DATA OWNER: family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:191); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-voice-api-copilot-anomalies

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/copilot/anomalies` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/anomalies` via `anomalyRoutes` (direct, src/index.ts:175, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/anomalies.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/task031CopilotBootstrapSmokeService.ts`
- REPOSITORY / DATA OWNER: family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:175); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-voice-api-copilot-chat-pipeline

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/copilot/chat-pipeline` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/chat-pipeline` via `chatPipelineRoutes` (direct, src/index.ts:182, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/chatPipeline.ts`
- PRIMARY SERVICE(S): `src/services/artifactAwarePracticeChatOrchestrator.ts`, `src/services/artifactAwarePracticeChatTriggerService.ts`, `src/services/assistantTurnPipelineService.test.ts`, `src/services/assistantTurnPipelineService.ts`, `src/services/chatContextIntegrationService.ts`, `src/services/chatPipelineContracts.ts`
- REPOSITORY / DATA OWNER: family `chat-session` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `chat-session` (9 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `chat-session`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:182); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-voice-api-copilot-intent

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/copilot/intent` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/intent` via `intentResolverRoutes` (direct, src/index.ts:181, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/intentResolver.ts`
- PRIMARY SERVICE(S): `src/domains/assessment/result-release/services/resultReleaseDeliveryIntentService.ts`, `src/domains/assessment/result-report-card-access/services/resultReportCardAccessTokenIntentService.ts`, `src/domains/assessment/result-report-card/services/resultReportCardExportIntentService.ts`, `src/services/artifactIntentResolver.ts`, `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`
- REPOSITORY / DATA OWNER: family `question-bank` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `question-bank` (226 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `question-bank`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: idempotency records present in a linked family; exact key behavior UNRESOLVED statically
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:181); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-voice-api-copilot-latency

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/copilot/latency` (1 mount)
- ENTRY ROUTE(S): `/api/copilot/latency` via `latencyRoutes` (direct, src/index.ts:174, middleware: schoolAuthMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/latency.ts`
- PRIMARY SERVICE(S): `src/services/copilotHandoffContracts.ts`, `src/services/copilotHandoffService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/copilotSessionContinuityContracts.ts`, `src/services/latencyService.test.ts`, `src/services/latencyService.ts`
- REPOSITORY / DATA OWNER: family `operations-readiness` writer evidence; family `student-identity-context` writer evidence
- PRISMA MODEL / DATA FAMILY: `operations-readiness` (7 models), `student-identity-context` (3 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `operations-readiness`: AMBIGUOUS; `student-identity-context`: DUPLICATE_WRITER_CANDIDATE
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: `shared_mount_prefix:/api/copilot`
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:174); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

### LOGIC-voice-api-voice-voiceroutes

- DOMAIN: voice
- CAPABILITY: HTTP capability group mounted at `/api/voice#voiceRoutes` (1 mount)
- ENTRY ROUTE(S): `/api/voice` via `voiceRoutes` (direct, src/index.ts:192, middleware: schoolAuthMiddleware, rateLimitMiddleware)
- PRIMARY ROUTE MODULE: `src/routes/voice.ts`
- PRIMARY SERVICE(S): `src/services/voiceLedgerService.test.ts`, `src/services/voiceLedgerService.ts`
- REPOSITORY / DATA OWNER: family `voice` writer evidence
- PRISMA MODEL / DATA FAMILY: `voice` (4 models)
- INPUT / VALIDATION: UNRESOLVED — request schemas are not statically extracted by R8-A; contract files under `src/contracts/` govern shapes where present
- AUTHENTICATION: `schoolAuthMiddleware` (mount evidence)
- AUTHORIZATION / ROLE SCOPE: UNRESOLVED — no school-context middleware on these mounts; service-level role checks not statically extracted
- CORE DECISION LOGIC: UNRESOLVED statically — decision internals live in service/domain source; route→service linkage above is the proven frame
- STATE TRANSITIONS: UNRESOLVED statically except where linked families carry state models (see matrix family rows)
- PERSISTENCE EFFECT: `voice`: CLEAR
- EXTERNAL DEPENDENCIES: AI provider gateway / media pipeline per EXTERNAL_PROVIDER_USAGE + AI_CALL_CANDIDATE findings; exact calls UNRESOLVED statically
- FAILURE SEMANTICS: UNRESOLVED statically — error shapes live in service/route bodies not extracted by R8-A; where equivalent paths diverge, ERROR_SEMANTICS_REVIEW_REQUIRED applies as a later-review flag, not a verdict
- IDEMPOTENCY / DUPLICATE BEHAVIOR: UNRESOLVED — no idempotency record linked to this group
- TIMEOUT / RETRY BEHAVIOR: UNRESOLVED statically
- CONCURRENCY / TRANSACTION BEHAVIOR: UNRESOLVED statically; accepted R1–R7 architecture governs canonical mastery/evidence paths and is referenced, not re-proven
- OBSERVABILITY: UNRESOLVED — no dedicated telemetry surface proven for this group
- KNOWN STRUCTURAL SIGNALS: none — no duplicate/declaration finding attaches to these mounts
- COMPLETENESS: L4
- CONFIDENCE: medium (structural only; no runtime proof claimed)
- EVIDENCE: 01 routes.mounts[] (src/index.ts:192); 03 mount table + shared-prefix grouping; 02 mounts edges where importOrigin resolves

## Compatibility / Transitional Logic

No repository evidence for this section — omitted from capability detail (no unsupported entries invented).

## Unresolved Logic

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

Level | Capabilities | Meaning
--- | --- | ---
L0 ABSENT | 0 | structural evidence band
L1 SCAFFOLD | 0 | structural evidence band
L2 PARTIAL | 0 | structural evidence band
L3 CONNECTED | 7 | structural evidence band
L4 FUNCTIONALLY COMPLETE | 103 | structural evidence band
L5 RELIABLE | 0 | not awarded in R8-B (requires runtime proof)
L6 PRODUCTION-READY CANDIDATE | 0 | not awarded in R8-B (requires runtime proof)
L7 OPTIMIZED | 0 | not awarded in R8-B (requires runtime proof)

R8-B awards no final backend production readiness. No capability is rated above L4.

