# Backend Data Ownership Matrix

R8-B evidence classification. Every ownership statement cites its evidence kind: R8-A inventory/graph/route evidence, PRISMA_WRITE_ACCESS rows, DEPENDENCY_GRAPH edges, or CANDIDATE_SIGNAL grouping. Targeted SOURCE_INSPECTION citations live in the Logic Register (registry-gated); matrix rows below do not claim source inspection. File names, directory names, class names, task numbers, and route prefixes were treated as signals, never as proof.

## Baseline

- Scanner version: 1.0.0
- Source fingerprint: sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0
- R8-A generated at: 2026-09-08T17:43:59.064Z
- R8-A git: branch=main head=87df12783eb0283d4b24963879f8a632b315e8cf
- Canonical Prisma schema: prisma/schema.prisma
- Accepted structural snapshot: files=5398 routeModules=134 routeMounts=167 routeEndpoints=3312 prismaModels=432 unresolvedInternalImports=1 cycles=5 findings=9610
- R8-B scope: classification/understanding only. No production behavior was changed and no finding below carries a final disposition.

## Ownership Taxonomy

Status vocabulary: `CLEAR` | `SHARED_BY_DESIGN` | `DUPLICATE_WRITER_CANDIDATE` | `AMBIGUOUS` | `LEGACY_OR_TRANSITIONAL_CANDIDATE` | `UNRESOLVED`.

Evidence hierarchy: `CANDIDATE_SIGNAL` (naming/path keyword only — never proof) | `R8A_STRUCTURAL` (01 inventory mounts/files/access rows) | `PRISMA_WRITE_ACCESS` (01 prisma.accesses readWrite=write with path/line/operation) | `DEPENDENCY_GRAPH` (02 import/require edges) | `SOURCE_INSPECTION` (cited backend/src path+line read for this task, files unchanged) | `ACCEPTED_ARCHITECTURE` (accepted R1–R7 contracts where directly applicable).

A canonical writer is the production file with the most R8-A WRITE access rows for the model (CANONICAL MUTATION PATH, PRISMA_WRITE_ACCESS). Single-writer CLEAR confidence is reduced when the writer is route-layer, misc/other-layer, or a compatibility/bootstrap/operations path. `SHARED_BY_DESIGN` requires a proven coordination boundary (dependency edge, common coordinator, shared transaction, explicit delegation, accepted architecture, or source inspection) — repository/service filename co-occurrence alone yields `DUPLICATE_WRITER_CANDIDATE`, never `SHARED_BY_DESIGN`. `UNRESOLVED` means no production writer is visible in R8-A evidence (often TEST_PROOF-only writers).

## Data Families

### Artifacts / Media (`artifacts-media`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): artifacts
- CONFIRMED DOMAIN OWNERSHIP: artifacts
- MODELS (3): `LearningArtifact`, `LearningArtifactBlock`, `MediaAsset`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/artifactService.ts`, `src/services/artifactStructuredRepository.ts`
- ADDITIONAL WRITERS: `src/services/artifactService.ts`, `src/services/artifactStructuredRepository.ts`
- READERS (production, up to 12): `src/services/artifactService.ts`, `src/services/learnerGrowthDataReaderService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot/artifacts`, `/api/copilot/tutor-state`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot#videoAwarePracticeRoutes`, `/api/copilot#videoLearningSessionRoutes`, `/api/copilot#videoRecommendationRoutes`, `/api/copilot/remediation`, `/api/video-learning-analytics#videoLearningAnalyticsRoutes`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (2 writer path(s), 2 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Assessment (`assessment`)

- CANDIDATE FAMILY (name-based grouping only — not authoritative ownership)
- CANDIDATE DOMAIN (taxonomy regex): assessment
- CONFIRMED DOMAIN OWNERSHIP: UNRESOLVED — model-name match only (CANDIDATE_SIGNAL)
- MODELS (2): `ExamAccessPolicyRecord`, `PilotExpansionRiskAssessment`
- CANONICAL WRITER(S): `UNRESOLVED`
- ADDITIONAL WRITERS: none proven in production evidence
- READERS (production, up to 12): none proven in production evidence
- ROUTE / API SURFACES (structural): UNRESOLVED — no structural route→data link proven
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. CANDIDATE FAMILY: model-name regex match only; no production Prisma read/write access, dependency, or architecture evidence. Not authoritative primary-domain ownership.
- STATUS: UNRESOLVED

### Chat / Session (`chat-session`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): learning-session
- CONFIRMED DOMAIN OWNERSHIP: learning-session
- MODELS (9): `ChatMessage`, `ChatSession`, `ConversationArchiveRecord`, `RecoveryPostSimulationHandoffPacketRecord`, `StudentLearningSessionEvent`, `StudentLearningSessionState`, `TutorActionDecisionRecord`, `TutorActionEffectivenessRecord`, `TutorState`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/routes/ai.ts`, `src/routes/ai/ai-chat.routes.ts`, `src/services/conversationArchiveService.ts`, `src/services/studentLearningSessionRepository.ts`
- ADDITIONAL WRITERS: `prisma/seed.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-chat.routes.ts`, `src/routes/ai/ai-research.routes.ts`, `src/services/aiService.ts`, `src/services/conversationArchiveService.ts`, `src/services/studentExitArchiveService.ts`, `src/services/studentLearningSessionRepository.ts`, `src/workers/index.ts`
- READERS (production, up to 12): `src/routes/ai.ts`, `src/routes/ai/ai-chat.routes.ts`, `src/routes/ai/ai-research.routes.ts`, `src/routes/ai/ai-safety.routes.ts`, `src/services/aiService.ts`, `src/services/conversationArchiveService.ts`, `src/services/learnerGrowthDataReaderService.ts`, `src/services/studentExitArchiveService.ts`, `src/services/studentLearningSessionRepository.ts`, `src/services/voiceLedgerService.ts`, `src/workers/index.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#aiRoutes`, `/api/copilot/learning-sessions`, `/api/voice#voiceRoutes`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot#tutorSafeChatRoutes`, `/api/copilot#videoLearningSessionRoutes`, `/api/copilot/chat-pipeline`, `/api/copilot/live-chat`, `/api/learner#learnerSessionRoutes`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: medium
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (9 writer path(s), 11 reader path(s)). Writer verdicts per model below.
- STATUS: DUPLICATE_WRITER_CANDIDATE

### Curriculum / Content (`curriculum-content`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): curriculum
- CONFIRMED DOMAIN OWNERSHIP: curriculum
- MODELS (11): `AnswerKeyVersionRecord`, `ApprovedSourceRecord`, `ContentGapRecord`, `ContentGovernanceAuditRecord`, `ContentItemRecord`, `ContentReviewRecord`, `CurriculumSkillRecord`, `CurriculumTopicRecord`, `CurriculumVersionRecord`, `DifficultyCalibrationRecord`, `QuestionCurriculumValidityRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/difficultyCalibrationRepository.ts`
- ADDITIONAL WRITERS: `src/services/difficultyCalibrationRepository.ts`
- READERS (production, up to 12): `src/services/difficultyCalibrationRepository.ts`, `src/services/phase3ObjectiveRepository.ts`
- ROUTE / API SURFACES (structural): `/api/learner#adaptiveChallengeRoutes`, `/api/phase3/daily-learning-feed`, `/api/phase3/daily-objective-checks`, `/api/phase3/objectives`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/content-governance#contentGovernanceRoutes`, `/api/task022/curriculum-governance`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (1 writer path(s), 2 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Learner Memory (`learner-memory`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): memory
- CONFIRMED DOMAIN OWNERSHIP: memory
- MODELS (3): `GlobalMemory`, `LearnerMemoryItem`, `SafeMemorySummary`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/learnerMemoryService.ts`, `src/services/safeMemorySummaryService.ts`
- ADDITIONAL WRITERS: `src/services/learnerMemoryService.ts`, `src/services/safeMemorySummaryService.ts`, `src/services/studentExitArchiveService.ts`
- READERS (production, up to 12): `src/services/learnerGrowthDataReaderService.ts`, `src/services/learnerMemoryService.ts`, `src/services/safeMemorySummaryService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot/learner-memory`, `/api/copilot/practice-mastery`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot/evidence`, `/api/copilot/learner-transparency`, `/api/copilot/learning-evidence`, `/api/copilot/teacher-insights`, `/api/learner#adaptiveChallengeRoutes`, `/api/learner#learnerPreferenceRoutes`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: medium
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (3 writer path(s), 3 reader path(s)). Writer verdicts per model below.
- STATUS: DUPLICATE_WRITER_CANDIDATE

### Learning Evidence (`learning-evidence`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): evidence
- CONFIRMED DOMAIN OWNERSHIP: evidence
- MODELS (19): `CanonicalMasteryEvidenceApplicationRecord`, `CommittedLearningEvidenceProjection`, `LearningEvent`, `LearningEvidenceCandidateProjection`, `LearningEvidenceEvent`, `LearningEvidenceIdempotency`, `LearningEvidenceProjectionCheckpoint`, `LearningEvidenceStream`, `PilotExpansionEvidencePack`, `RecoveryCaseReviewEvidenceBundleRecord`, `RecoveryEvidenceRollupRecord`, `RecoveryOutcomeEvidenceRecord`, `ResultLearningEvidenceAuditRecord`, `ResultLearningEvidenceBridgeRecord`, `ResultLearningEvidenceIdempotencyRecord`, `ResultReportCardEvidenceLinkRecord`, `SafeLearningEvidenceAggregateRecord`, `SafeLearningEvidenceAuditRecord`, `SafeLearningEvidenceRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`, `src/services/learnerMemoryService.ts`, `src/services/probabilisticMasteryRepository.ts`
- ADDITIONAL WRITERS: `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`, `src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts`, `src/services/learnerMemoryService.ts`, `src/services/probabilisticMasteryRepository.ts`
- READERS (production, up to 12): `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`, `src/services/probabilisticMasteryRepository.ts`
- ROUTE / API SURFACES (structural): `/api/copilot/learner-memory`, `/api/copilot/practice-mastery`, `/api/phase3/objectives`, `/api/phase3/study-plans`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api#learningModeRoutes`, `/api/copilot#copilotHandoffRoutes`, `/api/copilot#learningProfileRoutes`, `/api/copilot#videoLearningSessionRoutes`, `/api/copilot/evidence`, `/api/copilot/learning-evidence`
- TRANSACTION BOUNDARY: idempotency records present; boundary per capability (see Logic Register)
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (5 writer path(s), 3 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Mastery (`mastery`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): mastery
- CONFIRMED DOMAIN OWNERSHIP: mastery
- MODELS (13): `CanonicalMasteryChangeRecord`, `CanonicalMasteryStateRecord`, `GrowthMasteryTrendState`, `GrowthMistakePatternState`, `GrowthProofRecord`, `GrowthRecommendationState`, `GrowthWeakTopicState`, `ResultGrowthSignalRecord`, `ResultMasteryMutationEventRecord`, `ResultMasteryMutationPlanRecord`, `ResultObjectiveMasteryImpactRecord`, `SkillMasterySnapshot`, `StudentMasteryAggregationRun`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/services/probabilisticMasteryRepository.ts`
- ADDITIONAL WRITERS: `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/services/probabilisticMasteryRepository.ts`
- READERS (production, up to 12): `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/services/learnerGrowthDataReaderService.ts`, `src/services/learningProfileEvidenceService.ts`, `src/services/masteryAggregationService.ts`, `src/services/studentLearningProfileService.ts`, `src/services/weakTopicDetectionService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#learningProfileRoutes`, `/api/phase3/objectives`, `/api/phase3/study-plans`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot/adaptive-challenges`, `/api/copilot/adaptive-recommendations`, `/api/copilot/exam-mode`, `/api/copilot/focus-mode`, `/api/copilot/growth`, `/api/copilot/practice-mastery`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (2 writer path(s), 6 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Objectives / Plans / Feed (`objectives`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): objectives
- CONFIRMED DOMAIN OWNERSHIP: objectives
- MODELS (31): `ExamModeAttemptRecord`, `ExamModeQuestionStateRecord`, `ExamModeSessionRecord`, `ExamModeSummaryRecord`, `FocusModeAttemptRecord`, `FocusModeSessionRecord`, `FocusModeStepRecord`, `FocusModeSummaryRecord`, `LearningModeAttempt`, `LearningModeExitSummary`, `LearningModeHintEvent`, `LearningModeSession`, `LearningModeSignal`, `LearningObjectiveRecord`, `QuestionObjectiveMappingRecord`, `QuizModeAttemptRecord`, `QuizModeQuestionStateRecord`, `QuizModeSessionRecord`, `QuizModeSummaryRecord`, `ResultRecoveryObjectiveRecord`, `ResultRecoveryParentSupportNoteDraftRecord`, `RevisionModeAttemptRecord`, `RevisionModeItemStateRecord`, `RevisionModeQueueRecord`, `RevisionModeSessionRecord`, `RevisionModeSummaryRecord`, `StudyPlan`, `TeachBackModeAttemptRecord`, `TeachBackModePromptStateRecord`, `TeachBackModeSessionRecord`, `TeachBackModeSummaryRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/examModeAttemptService.ts`, `src/services/examModeQuestionStateService.ts`, `src/services/examModeSessionService.ts`, `src/services/examModeSummaryService.ts`, `src/services/focusModeAttemptService.ts`, `src/services/focusModeSessionService.ts`, `src/services/focusModeStepService.ts`, `src/services/focusModeSummaryService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningHintTrackingService.ts`, `src/services/learningModeSessionService.ts`, `src/services/learningSignalService.ts`, `src/services/modeExitSummaryService.ts`, `src/services/quizModeAttemptService.ts`, `src/services/quizModeQuestionStateService.ts`, `src/services/quizModeSessionService.ts`, `src/services/quizModeSummaryService.ts`, `src/services/revisionModeAttemptService.ts`, `src/services/revisionModeItemStateService.ts`, `src/services/revisionModeQueueService.ts`, `src/services/revisionModeSessionService.ts`, `src/services/revisionModeSummaryService.ts`, `src/services/teachBackModeAttemptService.ts`, `src/services/teachBackModePromptStateService.ts`, `src/services/teachBackModeSessionService.ts`, `src/services/teachBackModeSummaryService.ts`
- ADDITIONAL WRITERS: `src/services/examModeAttemptService.ts`, `src/services/examModeQuestionStateService.ts`, `src/services/examModeSessionService.ts`, `src/services/examModeSummaryService.ts`, `src/services/focusModeAttemptService.ts`, `src/services/focusModeSessionService.ts`, `src/services/focusModeStepService.ts`, `src/services/focusModeSummaryService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningHintTrackingService.ts`, `src/services/learningModeSessionService.ts`, `src/services/learningSignalService.ts`
- READERS (production, up to 12): `src/services/examModeAttemptService.ts`, `src/services/examModeQuestionStateService.ts`, `src/services/examModeSessionService.ts`, `src/services/examModeSummaryService.ts`, `src/services/focusModeAttemptService.ts`, `src/services/focusModeSessionService.ts`, `src/services/focusModeStepService.ts`, `src/services/focusModeSummaryService.ts`, `src/services/learningAttemptService.ts`, `src/services/learningHintTrackingService.ts`, `src/services/learningModeSessionService.ts`, `src/services/learningProfileEvidenceService.ts`
- ROUTE / API SURFACES (structural): `/api#learningModeRoutes`, `/api/copilot#learningProfileRoutes`, `/api/copilot/exam-mode`, `/api/copilot/focus-mode`, `/api/copilot/quiz-mode`, `/api/copilot/revision-mode`, `/api/copilot/teach-back-mode`, `/api/phase3/daily-learning-feed`, `/api/phase3/daily-objective-checks`, `/api/phase3/objectives`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (26 writer path(s), 31 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Operations / Readiness (`operations-readiness`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): operations
- CONFIRMED DOMAIN OWNERSHIP: operations
- MODELS (7): `LatencyThresholdAlert`, `OpsBackupCheck`, `OpsIncident`, `OpsMetricSnapshot`, `OpsReport`, `OpsRestoreDrill`, `TurnLatencyMetric`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/latencyService.ts`
- ADDITIONAL WRITERS: `src/services/latencyService.ts`
- READERS (production, up to 12): `src/services/abnormalBehaviorService.ts`, `src/services/latencyService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#aiRoutes`, `/api/copilot/anomalies`, `/api/copilot/latency`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api#deploymentReadinessRoutes`, `/api#readinessRoutes`, `/api#task024OperationsRoutes`, `/api#task025PilotRoutes`, `/api#task026PilotExecutionRoutes`, `/api#task027PilotExpansionRoutes`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (1 writer path(s), 2 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Practice / Attempts (`practice`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): practice
- CONFIRMED DOMAIN OWNERSHIP: practice
- MODELS (6): `AdaptiveChallengeRecord`, `AdaptiveRecommendationProfileRecord`, `PracticeAttempt`, `PracticeMisconceptionSignal`, `RemediationPathRecord`, `ResultRecoveryPracticeDraftRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/services/adaptiveChallengeRepository.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/remediationPathRepository.ts`
- ADDITIONAL WRITERS: `src/services/adaptiveChallengeRepository.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/remediationPathRepository.ts`
- READERS (production, up to 12): `src/services/adaptiveChallengeRepository.ts`, `src/services/adaptiveRecommendationProfileRepository.ts`, `src/services/learnerGrowthDataReaderService.ts`, `src/services/learningProfileEvidenceService.ts`, `src/services/remediationPathRepository.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#learningProfileRoutes`, `/api/copilot/adaptive-challenges`, `/api/copilot/remediation`, `/api/learner#adaptiveChallengeRoutes`, `/api/learner#learnerPreferenceRoutes`, `/api/learner#learnerSessionRoutes`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot#videoAwarePracticeRoutes`, `/api/copilot/practice-mastery`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (3 writer path(s), 5 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Question Bank / Exam Papers / Marking (`question-bank`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): question-bank
- CONFIRMED DOMAIN OWNERSHIP: question-bank
- MODELS (226): `ExamAttemptQuestionSnapshotRecord`, `ExamAttemptRecord`, `ExamAttemptSubmissionSnapshotRecord`, `ExamAttemptTimingEventRecord`, `ExamBlueprintRecord`, `ExamBlueprintRequirementRecord`, `ExamBlueprintVersionRecord`, `ExamDeliveryAuditRecord`, `ExamDeliveryIdempotencyRecord`, `ExamDeliverySessionRecord`, `ExamDeliverySessionStateRecord`, `ExamDraftQuestionRecord`, `ExamDraftRecord`, `ExamDraftSetRecord`, `ExamPaperApprovalRecord`, `ExamPaperAssemblyRunRecord`, `ExamPaperDeliveryBridgeRecord`, `ExamPaperQuestionRecord`, `ExamPaperRecord`, `ExamPaperSectionRecord`, `ExamPaperVersionRecord`, `ExamVariantAssignmentRecord`, `ExamVariantQuestionRecord`, `ExamVariantRecord`, `FollowUpAuditRecord`, `FollowUpEscalationPlanRecord`, `FollowUpIdempotencyRecord`, `FollowUpReviewWindowRecord`, `FollowUpSummaryRecord`, `MarkingBatchItemRecord`, `MarkingBatchRecord`, `MarkingBreakdownItemRecord`, `MarkingDispatchAuditRecord`, `MarkingInvocationIdempotencyRecord`, `MarkingInvocationRequestRecord`, `MarkingReadinessCheckRecord`, `MarkingResultLinkRecord`, `MarkingResultVersionRecord`, `MarkingRunRecord`, `QuestionBankItemRecord`, `RecoveryAdminGovernanceReviewPacketRecord`, `RecoveryArchiveManifestRecord`, `RecoveryCaseAdjudicationAuditRecord`, `RecoveryCaseAdjudicationIdempotencyRecord`, `RecoveryCaseAdjudicationReadinessRecord`, `RecoveryCaseAdjudicationSummaryRecord`, `RecoveryCaseCapacitySnapshotRecord`, `RecoveryCaseConflictOfInterestDeclarationRecord`, `RecoveryCaseDisagreementResolutionDraftRecord`, `RecoveryCaseDuplicateSuppressionRecord`, `RecoveryCaseEscalationDraftRecord`, `RecoveryCaseFairnessCheckRecord`, `RecoveryCasePriorityAssessmentRecord`, `RecoveryCasePriorityFactorRecord`, `RecoveryCasePriorityOverrideRequestRecord`, `RecoveryCaseQualitySampleRecord`, `RecoveryCaseQueueDispositionRecord`, `RecoveryCaseQueueExplanationRecord`, `RecoveryCaseReviewChecklistRecord`, `RecoveryCaseReviewerConsensusRecord`, `RecoveryCaseReviewerDecisionDraftRecord`, `RecoveryCaseReviewSessionRecord`, `RecoveryCaseReviewWindowDraftRecord`, `RecoveryCaseSecondReviewRequestRecord`, `RecoveryCaseTriageAuditRecord`, `RecoveryCaseTriageIdempotencyRecord`, `RecoveryCaseTriageQueueItemRecord`, `RecoveryCaseTriageQueueSnapshotRecord`, `RecoveryCaseTriageReadinessRecord`, `RecoveryCaseTriageSummaryRecord`, `RecoveryCaseWorkloadAllocationDraftRecord`, `RecoveryCheckpointEvaluationRecord`, `RecoveryClosureActionDraftRecord`, `RecoveryClosureDecisionDraftRecord`, `RecoveryContinuationActionDraftRecord`, `RecoveryContinuationDecisionDraftRecord`, `RecoveryDeferredIntegrationTicketRecord`, `RecoveryExecutionApprovalChainDraftRecord`, `RecoveryExecutionAuthorityMatrixSnapshotRecord`, `RecoveryExecutionAuthorizationAuditRecord`, `RecoveryExecutionAuthorizationDryRunRecord`, `RecoveryExecutionAuthorizationEligibilityCheckRecord`, `RecoveryExecutionAuthorizationIdempotencyRecord`, `RecoveryExecutionAuthorizationPreviewReadinessRecord`, `RecoveryExecutionAuthorizationRequestDraftRecord`, `RecoveryExecutionAuthorizationSummaryRecord`, `RecoveryExecutionConsentBoundaryCheckRecord`, `RecoveryExecutionMockAuthorizationReceiptRecord`, `RecoveryExecutionPreflightChecklistRecord`, `RecoveryExecutionPreLiveDecisionPacketRecord`, `RecoveryExecutionReadinessBoardAdminQueueRecord`, `RecoveryExecutionReadinessBoardAuditRecord`, `RecoveryExecutionReadinessBoardBlockerRecord`, `RecoveryExecutionReadinessBoardCardRecord`, `RecoveryExecutionReadinessBoardFilterPresetRecord`, `RecoveryExecutionReadinessBoardGovernanceNoteRecord`, `RecoveryExecutionReadinessBoardIdempotencyRecord`, `RecoveryExecutionReadinessBoardLaneRecord`, `RecoveryExecutionReadinessBoardParentSafeStatusDraftRecord`, `RecoveryExecutionReadinessBoardRefreshJobRecord`, `RecoveryExecutionReadinessBoardRiskSignalRecord`, `RecoveryExecutionReadinessBoardRoleProjectionRecord`, `RecoveryExecutionReadinessBoardSnapshotRecord`, `RecoveryExecutionReadinessBoardStudentSafeStatusDraftRecord`, `RecoveryExecutionReadinessBoardSummaryRecord`, `RecoveryExecutionReadinessBoardTeacherQueueRecord`, `RecoveryExecutionRiskAttestationRecord`, `RecoveryExecutionVetoRecord`, `RecoveryExitCriteriaEvaluationRecord`, `RecoveryExitCriteriaRecord`, `RecoveryFinalLifecycleSummaryRecord`, `RecoveryIntensificationActionDraftRecord`, `RecoveryIntensificationDecisionDraftRecord`, `RecoveryLifecycleClosureAuditRecord`, `RecoveryLifecycleClosureIdempotencyRecord`, `RecoveryLifecycleClosureReadinessRecord`, `RecoveryNextCycleRecommendationDraftRecord`, `RecoveryOutcomeActionAuditRecord`, `RecoveryOutcomeActionBundleRecord`, `RecoveryOutcomeActionIdempotencyRecord`, `RecoveryOutcomeActionReadinessRecord`, `RecoveryOutcomeActionSummaryRecord`, `RecoveryOutcomeApprovalGateRecord`, `RecoveryOutcomeAuditRecord`, `RecoveryOutcomeDecisionReadinessRecord`, `RecoveryOutcomeDecisionSummaryRecord`, `RecoveryOutcomeDryRunReceiptRecord`, `RecoveryOutcomeExecutionBlockedActionDiagnosticRecord`, `RecoveryOutcomeExecutionEligibilityCheckRecord`, `RecoveryOutcomeExecutionFailureInjectionRecord`, `RecoveryOutcomeExecutionParentPreviewDraftRecord`, `RecoveryOutcomeExecutionReadinessVerdictRecord`, `RecoveryOutcomeExecutionSimulationAuditRecord`, `RecoveryOutcomeExecutionSimulationIdempotencyRecord`, `RecoveryOutcomeExecutionSimulationPlanRecord`, `RecoveryOutcomeExecutionSimulationReadinessRecord`, `RecoveryOutcomeExecutionSimulationResultRecord`, `RecoveryOutcomeExecutionSimulationRunRecord`, `RecoveryOutcomeExecutionSimulationStepRecord`, `RecoveryOutcomeExecutionSimulationSummaryRecord`, `RecoveryOutcomeExecutionStudentPreviewDraftRecord`, `RecoveryOutcomeExecutionTeacherReviewRecord`, `RecoveryOutcomeIdempotencyRecord`, `RecoveryOutcomeMockActivationQueueRecord`, `RecoveryOutcomeParentUpdateDraftRecord`, `RecoveryOutcomeRollbackPlanRecord`, `RecoveryOutcomeStudentNextStepDraftRecord`, `RecoveryOutcomeSuppressionRuleRecord`, `RecoveryOutcomeTeacherReviewPacketRecord`, `RecoveryParentClosureGuidanceDraftRecord`, `RecoveryParentProgressNoteDraftRecord`, `RecoveryPauseActionDraftRecord`, `RecoveryPauseDecisionDraftRecord`, `RecoveryPlanAdjustmentDraftRecord`, `RecoveryProgressAuditRecord`, `RecoveryProgressIdempotencyRecord`, `RecoveryProgressObservationRecord`, `RecoveryProgressSummaryRecord`, `RecoveryStudentClosureReflectionDraftRecord`, `RecoveryStudentProgressReflectionDraftRecord`, `RecoveryTeacherClosureReviewPacketRecord`, `RecoveryTeacherReviewDecisionRecord`, `RecoveryUnresolvedRiskRegisterRecord`, `ResultDeliveryAttemptRecord`, `ResultDeliveryAuditRecord`, `ResultDeliveryChannelEnvelopeRecord`, `ResultDeliveryIdempotencyRecord`, `ResultDeliveryJobRecord`, `ResultDeliveryMockProviderRecord`, `ResultDeliveryReceiptRecord`, `ResultDeliveryRecipientRecord`, `ResultDeliveryRetryPlanRecord`, `ResultDeliverySuppressionRecord`, `ResultFollowUpActionPlanRecord`, `ResultFollowUpCaseRecord`, `ResultFollowUpSignalRecord`, `ResultGovernanceAuditRecord`, `ResultGovernanceIdempotencyRecord`, `ResultRecoveryAuditRecord`, `ResultRecoveryCheckpointRecord`, `ResultRecoveryIdempotencyRecord`, `ResultRecoveryPlanRecord`, `ResultRecoveryResourceRecommendationRecord`, `ResultRecoveryStepRecord`, `ResultRecoveryStudentSupportDraftRecord`, `ResultRecoverySummaryRecord`, `ResultRecoveryTeacherReviewPacketRecord`, `ResultReleaseApprovalRecord`, `ResultReleaseAuditRecord`, `ResultReleaseBoundaryRecord`, `ResultReleaseDeliveryIntentRecord`, `ResultReleaseIdempotencyRecord`, `ResultReleasePacketRecord`, `ResultReleaseReadinessRecord`, `ResultReportCardAccessAcknowledgementRecord`, `ResultReportCardAccessAuditRecord`, `ResultReportCardAccessExpiryRecord`, `ResultReportCardAccessGrantRecord`, `ResultReportCardAccessIdempotencyRecord`, `ResultReportCardAccessRecipientRecord`, `ResultReportCardAccessRevocationRecord`, `ResultReportCardAccessSummaryRecord`, `ResultReportCardAccessTimelineRecord`, `ResultReportCardAccessTokenIntentRecord`, `ResultReportCardArchiveManifestRecord`, `ResultReportCardAssemblyRecord`, `ResultReportCardAudienceProjectionRecord`, `ResultReportCardAuditRecord`, `ResultReportCardExportAuditRecord`, `ResultReportCardExportEnvelopeRecord`, `ResultReportCardExportIdempotencyRecord`, `ResultReportCardExportIntentRecord`, `ResultReportCardExportJobRecord`, `ResultReportCardExportReceiptRecord`, `ResultReportCardExportRetryPlanRecord`, `ResultReportCardExportSuppressionRecord`, `ResultReportCardExportTargetRecord`, `ResultReportCardIdempotencyRecord`, `ResultReportCardMockExportAttemptRecord`, `ResultReportCardPortalPreviewRecord`, `ResultReportCardRenderManifestRecord`, `ResultReportCardReviewRecord`, `ResultReportCardSectionRecord`, `ResultReportCardTemplateRecord`, `ResultReportCardTemplateVersionRecord`, `TeacherFollowUpQueueItemRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`
- ADDITIONAL WRITERS: `src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts`, `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`
- READERS (production, up to 12): `src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts`, `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts`
- ROUTE / API SURFACES (structural): UNRESOLVED — no structural route→data link proven
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api#learningModeRoutes`, `/api/content-governance#contentGovernanceRoutes`, `/api/question-bank#examBlueprintRoutes`, `/api/question-bank#questionBankRoutes`, `/api/question-bank/exam-delivery`, `/api/question-bank/exam-papers`
- TRANSACTION BOUNDARY: idempotency records present; boundary per capability (see Logic Register)
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (4 writer path(s), 3 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Revision (`revision`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): revision
- CONFIRMED DOMAIN OWNERSHIP: revision
- MODELS (8): `ResultRevisionSignalRecord`, `RevisionCollection`, `RevisionGuidedSessionRecord`, `RevisionGuidedStepRecord`, `RevisionItem`, `RevisionNoteLink`, `RevisionReviewEvent`, `RevisionSourceSignalReceipt`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`
- ADDITIONAL WRITERS: `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`
- READERS (production, up to 12): `src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-revision.routes.ts`, `src/services/learnerGrowthDataReaderService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#aiRoutes`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot/revision-mode`, `/api/phase3/living-revision`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (1 writer path(s), 4 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Safeguarding / Privacy (`safeguarding-privacy`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): safety
- CONFIRMED DOMAIN OWNERSHIP: safety
- MODELS (12): `DurableAuditEvent`, `ExpansionExecutionAuditRecord`, `OpsIncidentAudit`, `PersonalizationAuditRecord`, `PilotAuditRecord`, `PilotExecutionAuditRecord`, `PilotExpansionAuditRecord`, `PilotSafetySignal`, `SafetyAlert`, `SafetyEventAudit`, `SchoolIntegrationAuditRecord`, `TeacherInterventionAuditEvent`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-safety.routes.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/personalizationAuditRepository.ts`, `src/services/teacherInterventionAuditService.ts`
- ADDITIONAL WRITERS: `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-safety.routes.ts`, `src/services/abnormalBehaviorService.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/durableAuditRepository.ts`, `src/services/personalizationAuditRepository.ts`, `src/services/teacherInterventionAuditService.ts`
- READERS (production, up to 12): `src/repositories/schoolIntegrationAuditRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/routes/ai/ai-safety.routes.ts`, `src/services/abnormalBehaviorService.ts`, `src/services/adaptiveChallengeAuditRepository.ts`, `src/services/durableAuditRepository.ts`, `src/services/personalizationAuditRepository.ts`, `src/services/teacherInterventionAuditService.ts`
- ROUTE / API SURFACES (structural): `/api#schoolIntegrationRoutes`, `/api#task025PilotRoutes`, `/api#task026PilotExecutionRoutes`, `/api#task028ExpansionExecutionRoutes`, `/api#task029ExpansionOperationsRoutes`, `/api#teacherInterventionRoutes`, `/api/copilot#aiRoutes`, `/api/copilot/adaptive-challenges`, `/api/copilot/anomalies`, `/api/copilot/remediation`, `/api/learner#adaptiveChallengeRoutes`, `/api/learner#learnerPreferenceRoutes`, `/api/task028/controlled-expansion-execution`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot#tutorPolicyEvaluateRoutes`, `/api/copilot#tutorSafeChatRoutes`, `/api/copilot/no-ai-bypass`, `/api/governance#privacyGovernanceRoutes`, `/api/learner#privacyGovernanceRoutes`, `/api/task020/security-privacy-governance`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: medium
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (10 writer path(s), 9 reader path(s)). Writer verdicts per model below.
- STATUS: DUPLICATE_WRITER_CANDIDATE

### School Integration / Teacher / Admin (`school-integration`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): school
- CONFIRMED DOMAIN OWNERSHIP: school
- MODELS (33): `ExpandedPilotParticipant`, `ExpansionCompletionReview`, `ExpansionExecutionReport`, `ExpansionExecutionRun`, `ExpansionExecutionStage`, `ExpansionHealthSnapshot`, `ExpansionInterventionRecord`, `ExpansionOversightItem`, `ExpansionRollbackRecord`, `ExpansionRuntimeEvent`, `InterventionEffectEvent`, `PilotCohort`, `PilotDryRun`, `PilotExecutionEvent`, `PilotExecutionRun`, `PilotExpansionApproval`, `PilotExpansionCohortChange`, `PilotExpansionProposal`, `PilotExpansionReport`, `PilotExpansionReview`, `PilotFeedbackRecord`, `PilotParticipant`, `PilotPostPilotReview`, `PilotProgram`, `PilotReadinessCheck`, `PilotRuntimeMetricSnapshot`, `SchoolIntegrationIdempotencyRecord`, `SchoolRosterSyncConflictRecord`, `SchoolRosterSyncJobRecord`, `TeacherInterventionAssignment`, `TeacherOverrideRecord`, `TeacherReviewGroupRecord`, `TeacherReviewItemRecord`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/services/teacherInterventionRepository.ts`
- ADDITIONAL WRITERS: `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/services/teacherInterventionRepository.ts`
- READERS (production, up to 12): `src/repositories/schoolIntegrationIdempotencyRepository.ts`, `src/repositories/schoolRosterSyncConflictRepository.ts`, `src/repositories/schoolRosterSyncJobRepository.ts`, `src/repositories/task025PilotRepository.ts`, `src/repositories/task028ExpansionExecutionRepository.ts`, `src/services/learnerGrowthDataReaderService.ts`, `src/services/teacherInterventionRepository.ts`
- ROUTE / API SURFACES (structural): `/api#schoolIntegrationRoutes`, `/api#task025PilotRoutes`, `/api#task026PilotExecutionRoutes`, `/api#task028ExpansionExecutionRoutes`, `/api#task029ExpansionOperationsRoutes`, `/api#teacherInterventionRoutes`, `/api/task028/controlled-expansion-execution`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api#profileRoutes`, `/api#teacherReportRoutes`, `/api/copilot#learningProfileRoutes`, `/api/copilot/learning-sessions`, `/api/learner#learnerPreferenceRoutes`, `/api/learner#learnerRecommendationRoutes`
- TRANSACTION BOUNDARY: idempotency records present; boundary per capability (see Logic Register)
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (6 writer path(s), 7 reader path(s)). Writer verdicts per model below.
- STATUS: AMBIGUOUS

### Student Identity / Context (`student-identity-context`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): identity
- CONFIRMED DOMAIN OWNERSHIP: identity
- MODELS (3): `CopilotPreferences`, `LearnerPreferenceFeedbackRecord`, `StudentProfile`
- CANONICAL WRITER(S): `prisma/seed.ts`, `src/routes/ai/ai-memory-preferences.routes.ts`, `src/services/learnerPreferenceFeedbackRepository.ts`
- ADDITIONAL WRITERS: `prisma/seed.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-memory-preferences.routes.ts`, `src/services/copilotPreferenceService.ts`, `src/services/learnerPreferenceFeedbackRepository.ts`, `src/services/voiceLedgerService.ts`
- READERS (production, up to 12): `src/routes/ai/ai-memory-preferences.routes.ts`, `src/services/aiService.ts`, `src/services/copilotPreferenceService.ts`, `src/services/learnerPreferenceFeedbackRepository.ts`, `src/workers/index.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#aiRoutes`, `/api/copilot/adaptive-recommendations`, `/api/learner#learnerPreferenceRoutes`, `/api/voice#voiceRoutes`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: medium
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (6 writer path(s), 5 reader path(s)). Writer verdicts per model below.
- STATUS: SHARED_BY_DESIGN

### Unclassified (explicit) (`unclassified`)

- CANDIDATE FAMILY (name-based grouping only — not authoritative ownership)
- CANDIDATE DOMAIN (taxonomy regex): unclassified
- CONFIRMED DOMAIN OWNERSHIP: UNRESOLVED — model-name match only (CANDIDATE_SIGNAL)
- MODELS (42): `ExamAnswerSubmissionRecord`, `LearningEffectEvent`, `MetacognitiveEvent`, `Mistake`, `ModerationDecisionRecord`, `ParentGuidanceDraftRecord`, `ParentSafeResultSummaryRecord`, `PrerequisiteLinkRecord`, `Progress`, `QuestionApprovalRecord`, `QuestionApprovalRequestRecord`, `QuestionAssetVersionRecord`, `QuestionDuplicateCandidateRecord`, `QuestionExposureHoldRecord`, `QuestionIngestionBatchRecord`, `QuestionIngestionCandidateRecord`, `QuestionPartVersionRecord`, `QuestionSelectionCandidateRecord`, `QuestionSelectionRunRecord`, `QuestionSourceRecordRecord`, `QuestionUsageEligibilityRecord`, `QuestionVersionRecord`, `RecommendationInteractionRecord`, `ResultAudienceProjectionRecord`, `ResultFinalizationDecisionRecord`, `ResultFinalizationReviewRecord`, `ResultRegradeIntakeRecord`, `ResultRegradeRequestRecord`, `RubricVersionRecord`, `ScoringSuggestionRecord`, `SpacedReviewItem`, `StudentLearningProfileSnapshot`, `StudentMarkChallengeRecord`, `StudentReflectionTaskDraftRecord`, `StudentResultReportSnapshotRecord`, `StudentSafeResultSummaryRecord`, `StudentSupportPatternSnapshot`, `StudyGoal`, `SubmittedSnapshotIntakeRecord`, `TutorHintLadderStateRecord`, `TutorLearnerIdentityMap`, `TutorSession`
- CANONICAL WRITER(S): `UNRESOLVED`, `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/lib/personalization.ts`, `src/repositories/schoolIdentityMappingRepository.ts`, `src/routes/ai.ts`, `src/services/learningEffectivenessService.ts`, `src/services/metacognitionService.ts`, `src/services/recommendationInteractionRepository.ts`, `src/services/studentLearningProfileService.ts`
- ADDITIONAL WRITERS: `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/lib/personalization.ts`, `src/repositories/schoolIdentityMappingRepository.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-memory-preferences.routes.ts`, `src/services/externalStudentIdentityMapper.ts`, `src/services/learningEffectivenessService.ts`, `src/services/masteryInferenceService.ts`, `src/services/metacognitionService.ts`, `src/services/recommendationInteractionRepository.ts`, `src/services/studentLearningProfileService.ts`, `src/services/task021SchoolIntegrationDurableBridge.ts`
- READERS (production, up to 12): `src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts`, `src/lib/personalization.ts`, `src/repositories/schoolIdentityMappingRepository.ts`, `src/routes/ai.ts`, `src/routes/ai/ai-memory-preferences.routes.ts`, `src/services/aiService.ts`, `src/services/externalStudentIdentityMapper.ts`, `src/services/growthIntelligenceService.ts`, `src/services/learningEffectivenessService.ts`, `src/services/masteryInferenceService.ts`, `src/services/metacognitionService.ts`, `src/services/recommendationInteractionRepository.ts`
- ROUTE / API SURFACES (structural): UNRESOLVED — no structural route→data link proven
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: low
- EVIDENCE KIND: CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Explicit unclassified bucket (no taxonomy regex matched). CANDIDATE_SIGNAL organization only.
- STATUS: UNRESOLVED

### Voice (`voice`)

- CONFIRMED FAMILY (taxonomy candidate + independent evidence)
- CANDIDATE DOMAIN (taxonomy regex): voice
- CONFIRMED DOMAIN OWNERSHIP: voice
- MODELS (4): `VoiceLedgerEntry`, `VoicePackageGrant`, `VoiceSessionUsage`, `VoiceUsage`
- CANONICAL WRITER(S): `src/routes/ai/ai-voice.routes.ts`, `src/services/voiceLedgerService.ts`
- ADDITIONAL WRITERS: `src/routes/ai/ai-voice.routes.ts`, `src/services/voiceLedgerService.ts`
- READERS (production, up to 12): `src/routes/ai.ts`, `src/routes/ai/ai-voice.routes.ts`, `src/services/voiceLedgerService.ts`
- ROUTE / API SURFACES (structural): `/api/copilot#aiRoutes`, `/api/voice#voiceRoutes`
- ROUTE CANDIDATES (keyword overlap only, CANDIDATE_SIGNAL): `/api/copilot/anomalies`, `/api/copilot/chat-pipeline`, `/api/copilot/intent`, `/api/copilot/latency`
- TRANSACTION BOUNDARY: UNRESOLVED — no explicit transaction evidence in R8-A substrate
- DURABILITY: PostgreSQL via Prisma where a production writer exists; otherwise UNRESOLVED
- PROCESS-LOCAL STATE RELATION: see Runtime State Ownership for module/class Map/Set owners in this domain
- OWNERSHIP CONFIDENCE: high
- EVIDENCE KIND: PRISMA_WRITE_ACCESS + R8A_STRUCTURAL + CANDIDATE_SIGNAL
- EVIDENCE: 01 prisma.models[] + prisma.modelWriterGroups[] + prisma.accesses[] (readWrite split, production paths only); 02 writes/uses edges; canonical schema prisma/schema.prisma. Confirmed family ownership: taxonomy candidate + production Prisma access evidence (2 writer path(s), 3 reader path(s)). Writer verdicts per model below.
- STATUS: CLEAR

## Canonical Writers

Canonical mutation paths derive from actual R8-A WRITE access rows (path/line/operation/readWrite/layerSignal), not from first-sorted filenames. See per-row evidence kinds.

Model | Canonical writer | Additional writers | Status | Evidence kind | Evidence
--- | --- | --- | --- | --- | ---
AdaptiveChallengeRecord | src/services/adaptiveChallengeRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:AdaptiveChallengeRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/adaptiveChallengeRepository.ts lines 51, 154 ops create/update (PRISMA_WRITE_ACCESS).
AdaptiveRecommendationProfileRecord | src/services/adaptiveRecommendationProfileRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:AdaptiveRecommendationProfileRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/adaptiveRecommendationProfileRepository.ts lines 55, 104, 110 ops deleteMany/upsert (PRISMA_WRITE_ACCESS).
AnswerKeyVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:AnswerKeyVersionRecord; No R8-A modelWriterGroups entry for this model.
ApprovedSourceRecord | UNRESOLVED | src/tests/task-022-final-persistence-failure-blocks-source-approval.contract.test.ts:98, src/tests/task-022-final-production-memory-only-fails-closed.contract.test.ts:45, src/tests/task-022-final-production-memory-only-fails-closed.contract.test.ts:59, src/tests/task-022-final-real-db-approved-source-readback.test.ts:28 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ApprovedSourceRecord; Writer evidence is TEST_PROOF only; no production writer identified.
CanonicalMasteryChangeRecord | src/services/probabilisticMasteryRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:CanonicalMasteryChangeRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/probabilisticMasteryRepository.ts lines 482 ops create (PRISMA_WRITE_ACCESS).
CanonicalMasteryEvidenceApplicationRecord | src/services/probabilisticMasteryRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:CanonicalMasteryEvidenceApplicationRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/probabilisticMasteryRepository.ts lines 449 ops create (PRISMA_WRITE_ACCESS).
CanonicalMasteryStateRecord | src/services/probabilisticMasteryRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:CanonicalMasteryStateRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/probabilisticMasteryRepository.ts lines 465, 473 ops create/updateMany (PRISMA_WRITE_ACCESS).
ChatMessage | src/repositories/chatMessageRepository.ts | — (callers delegate: src/routes/ai.ts, src/services/aiService.ts, src/services/revisionLearningService.ts import the canonical writer; unmounted untracked segmentation stub src/routes/ai/ai-chat.routes.ts excluded, not live) | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL+R8F_SOURCE_INSPECTION | modelWriterGroups:ChatMessage; R8-F consolidated all confirmed live production writes through one persistence owner (createChatMessage/updateChatMessage with preserved sessionId/role/content/messageNumber/metadata/id/timestamp semantics; no role normalization; transaction-client compatible). CANONICAL MUTATION PATH previously from 10 production WRITE access row(s): src/routes/ai.ts lines 4791, 5077, 5123, 5551, 5670 ops create/update (PRISMA_WRITE_ACCESS).
ChatSession | src/routes/ai/ai-chat.routes.ts | prisma/seed.ts, src/routes/ai.ts, src/routes/ai/ai-research.routes.ts, src/services/aiService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ChatSession; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-research.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 18 production WRITE access row(s): src/routes/ai/ai-chat.routes.ts lines 70, 75, 158, 200, 243 +1 more ops create/deleteMany/update/updateMany (PRISMA_WRITE_ACCESS).
CommittedLearningEvidenceProjection | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:CommittedLearningEvidenceProjection; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 130 ops upsert (PRISMA_WRITE_ACCESS).
ContentGapRecord | UNRESOLVED | src/tests/task-022-final-persistence-failure-blocks-source-approval.contract.test.ts:51, src/tests/task-022-final-real-db-content-gap-audit-readback.test.ts:26, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:82, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:92 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ContentGapRecord; Writer evidence is TEST_PROOF only; no production writer identified.
ContentGovernanceAuditRecord | UNRESOLVED | src/tests/task-022-final-persistence-failure-blocks-source-approval.contract.test.ts:78, src/tests/task-022-final-real-db-content-gap-audit-readback.test.ts:68, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:102, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:111 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ContentGovernanceAuditRecord; Writer evidence is TEST_PROOF only; no production writer identified.
ContentItemRecord | UNRESOLVED | src/tests/task-022-final-persistence-failure-blocks-source-approval.contract.test.ts:38, src/tests/task-022-final-real-db-content-grounding-source-of-truth.contract.test.ts:107, src/tests/task-022-final-real-db-content-grounding-source-of-truth.contract.test.ts:38, src/tests/task-022-final-real-db-content-grounding-source-of-truth.contract.test.ts:90 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ContentItemRecord; Writer evidence is TEST_PROOF only; no production writer identified.
ContentReviewRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ContentReviewRecord; No R8-A modelWriterGroups entry for this model.
ConversationArchiveRecord | src/services/conversationArchiveService.ts | src/services/studentExitArchiveService.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ConversationArchiveRecord; Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/conversationArchiveService.ts lines 54 ops create (PRISMA_WRITE_ACCESS).
CopilotPreferences | src/routes/ai/ai-memory-preferences.routes.ts | src/services/copilotPreferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:CopilotPreferences; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai/ai-memory-preferences.routes.ts imports src/services/copilotPreferenceService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/routes/ai/ai-memory-preferences.routes.ts lines 47, 171 ops upsert (PRISMA_WRITE_ACCESS).
CurriculumSkillRecord | UNRESOLVED | src/tests/r4-daily-objectives-prisma-integration.test.ts:47, src/tests/task-022-final-real-db-curriculum-readback.test.ts:114, src/tests/task-022-final-real-db-curriculum-readback.test.ts:80 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:CurriculumSkillRecord; Writer evidence is TEST_PROOF only; no production writer identified.
CurriculumTopicRecord | UNRESOLVED | src/tests/r4-daily-objectives-prisma-integration.test.ts:43, src/tests/task-022-final-real-db-curriculum-readback.test.ts:62 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:CurriculumTopicRecord; Writer evidence is TEST_PROOF only; no production writer identified.
CurriculumVersionRecord | UNRESOLVED | src/tests/r4-daily-objectives-prisma-integration.test.ts:39, src/tests/task-022-final-real-db-curriculum-readback.test.ts:45, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:20, src/tests/task-022-final-real-db-diagnostics-source-of-truth.contract.test.ts:30 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:CurriculumVersionRecord; Writer evidence is TEST_PROOF only; no production writer identified.
dailyObjectiveCheckAttemptRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:dailyObjectiveCheckAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 643, 1007 ops create/deleteMany (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckCompletionIdempotencyRecord | src/services/phase3DailyObjectiveCheckCompletionService.ts | src/services/phase3DailyObjectiveCheckRepository.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:dailyObjectiveCheckCompletionIdempotencyRecord; Multiple writer files with proven coordination boundary (dependency-edge: src/services/phase3DailyObjectiveCheckCompletionService.ts imports src/services/phase3DailyObjectiveCheckRepository.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/phase3DailyObjectiveCheckCompletionService.ts lines 114, 138, 830 ops deleteMany/update/upsert (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckConfidenceRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:dailyObjectiveCheckConfidenceRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 525, 531, 1008 ops create/deleteMany/update (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckSessionRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:dailyObjectiveCheckSessionRecord; Single production writer file. CANONICAL MUTATION PATH from 11 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 228, 393, 406, 469, 669 +6 more ops create/deleteMany/update/updateMany (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
DifficultyCalibrationRecord | src/services/difficultyCalibrationRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:DifficultyCalibrationRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/difficultyCalibrationRepository.ts lines 97 ops upsert (PRISMA_WRITE_ACCESS).
DurableAuditEvent | src/services/adaptiveChallengeAuditRepository.ts | src/services/durableAuditRepository.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:DurableAuditEvent; Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/adaptiveChallengeAuditRepository.ts lines 9 ops create (PRISMA_WRITE_ACCESS).
ExamAccessPolicyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAccessPolicyRecord; No R8-A modelWriterGroups entry for this model.
ExamAnswerSubmissionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAnswerSubmissionRecord; No R8-A modelWriterGroups entry for this model.
ExamAttemptQuestionSnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAttemptQuestionSnapshotRecord; No R8-A modelWriterGroups entry for this model.
ExamAttemptRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAttemptRecord; No R8-A modelWriterGroups entry for this model.
ExamAttemptSubmissionSnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAttemptSubmissionSnapshotRecord; No R8-A modelWriterGroups entry for this model.
ExamAttemptTimingEventRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamAttemptTimingEventRecord; No R8-A modelWriterGroups entry for this model.
ExamBlueprintRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamBlueprintRecord; No R8-A modelWriterGroups entry for this model.
ExamBlueprintRequirementRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamBlueprintRequirementRecord; No R8-A modelWriterGroups entry for this model.
ExamBlueprintVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamBlueprintVersionRecord; No R8-A modelWriterGroups entry for this model.
ExamDeliveryAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDeliveryAuditRecord; No R8-A modelWriterGroups entry for this model.
ExamDeliveryIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDeliveryIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
ExamDeliverySessionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDeliverySessionRecord; No R8-A modelWriterGroups entry for this model.
ExamDeliverySessionStateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDeliverySessionStateRecord; No R8-A modelWriterGroups entry for this model.
ExamDraftQuestionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDraftQuestionRecord; No R8-A modelWriterGroups entry for this model.
ExamDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDraftRecord; No R8-A modelWriterGroups entry for this model.
ExamDraftSetRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamDraftSetRecord; No R8-A modelWriterGroups entry for this model.
ExamModeAttemptRecord | src/services/examModeAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamModeAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/examModeAttemptService.ts lines 27 ops create (PRISMA_WRITE_ACCESS).
ExamModeQuestionStateRecord | src/services/examModeQuestionStateService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamModeQuestionStateRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/examModeQuestionStateService.ts lines 20, 94 ops create/update (PRISMA_WRITE_ACCESS).
ExamModeSessionRecord | src/services/examModeSessionService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamModeSessionRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/examModeSessionService.ts lines 36, 108, 125, 132, 139 +1 more ops create/update (PRISMA_WRITE_ACCESS).
ExamModeSummaryRecord | src/services/examModeSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamModeSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/examModeSummaryService.ts lines 26 ops create (PRISMA_WRITE_ACCESS).
ExamPaperApprovalRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamPaperApprovalRecord; No R8-A modelWriterGroups entry for this model.
ExamPaperAssemblyRunRecord | src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamPaperAssemblyRunRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts lines 103 ops create (PRISMA_WRITE_ACCESS).
ExamPaperDeliveryBridgeRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamPaperDeliveryBridgeRecord; No R8-A modelWriterGroups entry for this model.
ExamPaperQuestionRecord | src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamPaperQuestionRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts lines 86 ops create (PRISMA_WRITE_ACCESS).
ExamPaperRecord | src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamPaperRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts lines 21 ops create (PRISMA_WRITE_ACCESS).
ExamPaperSectionRecord | src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamPaperSectionRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts lines 65 ops create (PRISMA_WRITE_ACCESS).
ExamPaperVersionRecord | src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExamPaperVersionRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts lines 41 ops create (PRISMA_WRITE_ACCESS).
ExamVariantAssignmentRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamVariantAssignmentRecord; No R8-A modelWriterGroups entry for this model.
ExamVariantQuestionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamVariantQuestionRecord; No R8-A modelWriterGroups entry for this model.
ExamVariantRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ExamVariantRecord; No R8-A modelWriterGroups entry for this model.
ExpandedPilotParticipant | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpandedPilotParticipant; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 274, 294, 334 ops create/update/updateMany (PRISMA_WRITE_ACCESS).
ExpansionCompletionReview | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionCompletionReview; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 747 ops create (PRISMA_WRITE_ACCESS).
ExpansionExecutionAuditRecord | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionExecutionAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 888 ops create (PRISMA_WRITE_ACCESS).
ExpansionExecutionReport | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionExecutionReport; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 825 ops create (PRISMA_WRITE_ACCESS).
ExpansionExecutionRun | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionExecutionRun; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 102, 122 ops create/update (PRISMA_WRITE_ACCESS).
ExpansionExecutionStage | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionExecutionStage; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 193, 213 ops create/update (PRISMA_WRITE_ACCESS).
ExpansionHealthSnapshot | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionHealthSnapshot; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 453 ops create (PRISMA_WRITE_ACCESS).
ExpansionInterventionRecord | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionInterventionRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 608, 620 ops create/update (PRISMA_WRITE_ACCESS).
ExpansionOversightItem | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionOversightItem; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 527, 547 ops create/update (PRISMA_WRITE_ACCESS).
ExpansionRollbackRecord | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionRollbackRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 681 ops create (PRISMA_WRITE_ACCESS).
ExpansionRuntimeEvent | src/repositories/task028ExpansionExecutionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ExpansionRuntimeEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task028ExpansionExecutionRepository.ts lines 386 ops create (PRISMA_WRITE_ACCESS).
FocusModeAttemptRecord | src/services/focusModeAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:FocusModeAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/focusModeAttemptService.ts lines 23 ops create (PRISMA_WRITE_ACCESS).
FocusModeSessionRecord | src/services/focusModeSessionService.ts | src/services/focusModeStepService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:FocusModeSessionRecord; Multiple writer files with proven coordination boundary (common-coordinator: src/routes/focusModeRoutes.ts imports src/services/focusModeSessionService.ts + src/services/focusModeStepService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/focusModeSessionService.ts lines 33, 99, 113, 120, 130 ops create/update (PRISMA_WRITE_ACCESS).
FocusModeStepRecord | src/services/focusModeStepService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:FocusModeStepRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/focusModeStepService.ts lines 36, 67, 103 ops create/update (PRISMA_WRITE_ACCESS).
FocusModeSummaryRecord | src/services/focusModeSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:FocusModeSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/focusModeSummaryService.ts lines 22 ops create (PRISMA_WRITE_ACCESS).
FollowUpAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:FollowUpAuditRecord; No R8-A modelWriterGroups entry for this model.
FollowUpEscalationPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:FollowUpEscalationPlanRecord; No R8-A modelWriterGroups entry for this model.
FollowUpIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:FollowUpIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
FollowUpReviewWindowRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:FollowUpReviewWindowRecord; No R8-A modelWriterGroups entry for this model.
FollowUpSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:FollowUpSummaryRecord; No R8-A modelWriterGroups entry for this model.
GlobalMemory | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GlobalMemory; No R8-A modelWriterGroups entry for this model.
GrowthMasteryTrendState | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GrowthMasteryTrendState; No R8-A modelWriterGroups entry for this model.
GrowthMistakePatternState | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GrowthMistakePatternState; No R8-A modelWriterGroups entry for this model.
GrowthProofRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GrowthProofRecord; No R8-A modelWriterGroups entry for this model.
GrowthRecommendationState | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GrowthRecommendationState; No R8-A modelWriterGroups entry for this model.
GrowthWeakTopicState | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:GrowthWeakTopicState; No R8-A modelWriterGroups entry for this model.
InterventionEffectEvent | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:InterventionEffectEvent; No R8-A modelWriterGroups entry for this model.
LatencyThresholdAlert | src/services/latencyService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LatencyThresholdAlert; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/latencyService.ts lines 303, 304, 537 ops createMany/update (PRISMA_WRITE_ACCESS).
LearnerMemoryItem | src/services/learnerMemoryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearnerMemoryItem; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/learnerMemoryService.ts lines 731, 767 ops create/update (PRISMA_WRITE_ACCESS).
LearnerPreferenceFeedbackRecord | src/services/learnerPreferenceFeedbackRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearnerPreferenceFeedbackRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learnerPreferenceFeedbackRepository.ts lines 60 ops create (PRISMA_WRITE_ACCESS).
LearningArtifact | src/services/artifactService.ts | src/services/artifactStructuredRepository.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningArtifact; Multiple writer files with proven coordination boundary (dependency-edge: src/services/artifactStructuredRepository.ts imports src/services/artifactService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/artifactService.ts lines 718, 826, 931 ops update/upsert (PRISMA_WRITE_ACCESS).
LearningArtifactBlock | src/services/artifactStructuredRepository.ts | src/services/artifactService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningArtifactBlock; Multiple writer files with proven coordination boundary (dependency-edge: src/services/artifactStructuredRepository.ts imports src/services/artifactService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 7 production WRITE access row(s): src/services/artifactStructuredRepository.ts lines 164, 166, 300, 302, 423 ops createMany/deleteMany (PRISMA_WRITE_ACCESS).
LearningEffectEvent | src/services/learningEffectivenessService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEffectEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learningEffectivenessService.ts lines 251 ops create (PRISMA_WRITE_ACCESS).
LearningEvent | src/services/learnerMemoryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learnerMemoryService.ts lines 505 ops create (PRISMA_WRITE_ACCESS).
LearningEvidenceCandidateProjection | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvidenceCandidateProjection; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 75 ops upsert (PRISMA_WRITE_ACCESS).
LearningEvidenceEvent | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvidenceEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 24 ops create (PRISMA_WRITE_ACCESS).
LearningEvidenceIdempotency | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvidenceIdempotency; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 206 ops create (PRISMA_WRITE_ACCESS).
LearningEvidenceProjectionCheckpoint | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvidenceProjectionCheckpoint; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 179 ops upsert (PRISMA_WRITE_ACCESS).
LearningEvidenceStream | src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningEvidenceStream; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository.ts lines 59 ops upsert (PRISMA_WRITE_ACCESS).
LearningModeAttempt | src/services/learningAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningModeAttempt; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learningAttemptService.ts lines 21 ops create (PRISMA_WRITE_ACCESS).
LearningModeExitSummary | src/services/modeExitSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningModeExitSummary; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/modeExitSummaryService.ts lines 23 ops create (PRISMA_WRITE_ACCESS).
LearningModeHintEvent | src/services/learningHintTrackingService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningModeHintEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learningHintTrackingService.ts lines 16 ops create (PRISMA_WRITE_ACCESS).
LearningModeSession | src/services/learningModeSessionService.ts | src/services/quizModeSessionService.ts, src/services/teachBackModeSessionService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningModeSession; Multiple writer files with proven coordination boundary (dependency-edge: src/services/quizModeSessionService.ts imports src/services/learningModeSessionService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/learningModeSessionService.ts lines 15, 87, 103, 113 ops create/update (PRISMA_WRITE_ACCESS).
LearningModeSignal | src/services/learningSignalService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:LearningModeSignal; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/learningSignalService.ts lines 25 ops create (PRISMA_WRITE_ACCESS).
LearningObjectiveRecord | UNRESOLVED | src/tests/r4-daily-objectives-prisma-integration.test.ts:51, src/tests/task-022-final-real-db-curriculum-readback.test.ts:97 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:LearningObjectiveRecord; Writer evidence is TEST_PROOF only; no production writer identified.
MarkingBatchItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingBatchItemRecord; No R8-A modelWriterGroups entry for this model.
MarkingBatchRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingBatchRecord; No R8-A modelWriterGroups entry for this model.
MarkingBreakdownItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingBreakdownItemRecord; No R8-A modelWriterGroups entry for this model.
MarkingDispatchAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingDispatchAuditRecord; No R8-A modelWriterGroups entry for this model.
MarkingInvocationIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingInvocationIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
MarkingInvocationRequestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingInvocationRequestRecord; No R8-A modelWriterGroups entry for this model.
MarkingReadinessCheckRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingReadinessCheckRecord; No R8-A modelWriterGroups entry for this model.
MarkingResultLinkRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingResultLinkRecord; No R8-A modelWriterGroups entry for this model.
MarkingResultVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingResultVersionRecord; No R8-A modelWriterGroups entry for this model.
MarkingRunRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MarkingRunRecord; No R8-A modelWriterGroups entry for this model.
MediaAsset | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:MediaAsset; No R8-A modelWriterGroups entry for this model.
MetacognitiveEvent | src/services/metacognitionService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:MetacognitiveEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/metacognitionService.ts lines 237 ops create (PRISMA_WRITE_ACCESS).
Mistake | src/lib/personalization.ts | src/routes/ai.ts, src/routes/ai/ai-memory-preferences.routes.ts, src/services/masteryInferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:Mistake; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-memory-preferences.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 12 production WRITE access row(s): src/lib/personalization.ts lines 60, 75, 94 ops create/deleteMany/update (PRISMA_WRITE_ACCESS).
ModerationDecisionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ModerationDecisionRecord; No R8-A modelWriterGroups entry for this model.
OpsBackupCheck | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:165 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsBackupCheck; Writer evidence is TEST_PROOF only; no production writer identified.
OpsIncident | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:50 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsIncident; Writer evidence is TEST_PROOF only; no production writer identified.
OpsIncidentAudit | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:91 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsIncidentAudit; Writer evidence is TEST_PROOF only; no production writer identified.
OpsMetricSnapshot | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:128 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsMetricSnapshot; Writer evidence is TEST_PROOF only; no production writer identified.
OpsReport | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:229 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsReport; Writer evidence is TEST_PROOF only; no production writer identified.
OpsRestoreDrill | UNRESOLVED | src/tests/task-024-real-prisma-persistence.test.ts:194 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:OpsRestoreDrill; Writer evidence is TEST_PROOF only; no production writer identified.
ParentGuidanceDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ParentGuidanceDraftRecord; No R8-A modelWriterGroups entry for this model.
ParentSafeResultSummaryRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ParentSafeResultSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 537, 582, 587, 595, 603 ops create/update (PRISMA_WRITE_ACCESS).
PersonalizationAuditRecord | src/services/personalizationAuditRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PersonalizationAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/personalizationAuditRepository.ts lines 45 ops create (PRISMA_WRITE_ACCESS).
PilotAuditRecord | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 451 ops create (PRISMA_WRITE_ACCESS).
PilotCohort | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotCohort; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 200 ops create (PRISMA_WRITE_ACCESS).
PilotDryRun | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotDryRun; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 392 ops create (PRISMA_WRITE_ACCESS).
PilotExecutionAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExecutionAuditRecord; No R8-A modelWriterGroups entry for this model.
PilotExecutionEvent | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExecutionEvent; No R8-A modelWriterGroups entry for this model.
PilotExecutionRun | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExecutionRun; No R8-A modelWriterGroups entry for this model.
PilotExpansionApproval | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionApproval; No R8-A modelWriterGroups entry for this model.
PilotExpansionAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionAuditRecord; No R8-A modelWriterGroups entry for this model.
PilotExpansionCohortChange | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionCohortChange; No R8-A modelWriterGroups entry for this model.
PilotExpansionEvidencePack | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionEvidencePack; No R8-A modelWriterGroups entry for this model.
PilotExpansionProposal | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionProposal; No R8-A modelWriterGroups entry for this model.
PilotExpansionReport | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionReport; No R8-A modelWriterGroups entry for this model.
PilotExpansionReview | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionReview; No R8-A modelWriterGroups entry for this model.
PilotExpansionRiskAssessment | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotExpansionRiskAssessment; No R8-A modelWriterGroups entry for this model.
PilotFeedbackRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotFeedbackRecord; No R8-A modelWriterGroups entry for this model.
PilotParticipant | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotParticipant; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 259, 270 ops create/update (PRISMA_WRITE_ACCESS).
PilotPostPilotReview | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotPostPilotReview; No R8-A modelWriterGroups entry for this model.
PilotProgram | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotProgram; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 115, 153 ops create/update (PRISMA_WRITE_ACCESS).
PilotReadinessCheck | src/repositories/task025PilotRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:PilotReadinessCheck; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/repositories/task025PilotRepository.ts lines 338 ops create (PRISMA_WRITE_ACCESS).
PilotRuntimeMetricSnapshot | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotRuntimeMetricSnapshot; No R8-A modelWriterGroups entry for this model.
PilotSafetySignal | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PilotSafetySignal; No R8-A modelWriterGroups entry for this model.
PracticeAttempt | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PracticeAttempt; No R8-A modelWriterGroups entry for this model.
PracticeMisconceptionSignal | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PracticeMisconceptionSignal; No R8-A modelWriterGroups entry for this model.
PrerequisiteLinkRecord | UNRESOLVED | src/tests/task-022-final-real-db-curriculum-readback.test.ts:125 | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:PrerequisiteLinkRecord; Writer evidence is TEST_PROOF only; no production writer identified.
Progress | src/routes/ai.ts | src/lib/personalization.ts, src/routes/ai/ai-memory-preferences.routes.ts, src/services/masteryInferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:Progress; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-memory-preferences.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 10 production WRITE access row(s): src/routes/ai.ts lines 2301, 2306, 2353 ops create/update (PRISMA_WRITE_ACCESS).
QuestionApprovalRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionApprovalRecord; No R8-A modelWriterGroups entry for this model.
QuestionApprovalRequestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionApprovalRequestRecord; No R8-A modelWriterGroups entry for this model.
QuestionAssetVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionAssetVersionRecord; No R8-A modelWriterGroups entry for this model.
QuestionBankItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionBankItemRecord; No R8-A modelWriterGroups entry for this model.
QuestionCurriculumValidityRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionCurriculumValidityRecord; No R8-A modelWriterGroups entry for this model.
QuestionDuplicateCandidateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionDuplicateCandidateRecord; No R8-A modelWriterGroups entry for this model.
QuestionExposureHoldRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionExposureHoldRecord; No R8-A modelWriterGroups entry for this model.
QuestionIngestionBatchRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionIngestionBatchRecord; No R8-A modelWriterGroups entry for this model.
QuestionIngestionCandidateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionIngestionCandidateRecord; No R8-A modelWriterGroups entry for this model.
QuestionObjectiveMappingRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionObjectiveMappingRecord; No R8-A modelWriterGroups entry for this model.
QuestionPartVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionPartVersionRecord; No R8-A modelWriterGroups entry for this model.
QuestionSelectionCandidateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionSelectionCandidateRecord; No R8-A modelWriterGroups entry for this model.
QuestionSelectionRunRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionSelectionRunRecord; No R8-A modelWriterGroups entry for this model.
QuestionSourceRecordRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionSourceRecordRecord; No R8-A modelWriterGroups entry for this model.
QuestionUsageEligibilityRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionUsageEligibilityRecord; No R8-A modelWriterGroups entry for this model.
QuestionVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:QuestionVersionRecord; No R8-A modelWriterGroups entry for this model.
QuizModeAttemptRecord | src/services/quizModeAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:QuizModeAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/quizModeAttemptService.ts lines 28 ops create (PRISMA_WRITE_ACCESS).
QuizModeQuestionStateRecord | src/services/quizModeQuestionStateService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:QuizModeQuestionStateRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/quizModeQuestionStateService.ts lines 20, 96 ops create/update (PRISMA_WRITE_ACCESS).
QuizModeSessionRecord | src/services/quizModeSessionService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:QuizModeSessionRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/quizModeSessionService.ts lines 33, 106, 136, 140, 147 +1 more ops create/update (PRISMA_WRITE_ACCESS).
QuizModeSummaryRecord | src/services/quizModeSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:QuizModeSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/quizModeSummaryService.ts lines 30 ops create (PRISMA_WRITE_ACCESS).
RecommendationInteractionRecord | src/services/recommendationInteractionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RecommendationInteractionRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/recommendationInteractionRepository.ts lines 49 ops create (PRISMA_WRITE_ACCESS).
RecoveryAdminGovernanceReviewPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryAdminGovernanceReviewPacketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryArchiveManifestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryArchiveManifestRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseAdjudicationAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseAdjudicationAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseAdjudicationIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseAdjudicationIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseAdjudicationReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseAdjudicationReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseAdjudicationSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseAdjudicationSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseCapacitySnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseCapacitySnapshotRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseConflictOfInterestDeclarationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseConflictOfInterestDeclarationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseDisagreementResolutionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseDisagreementResolutionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseDuplicateSuppressionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseDuplicateSuppressionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseEscalationDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseEscalationDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseFairnessCheckRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseFairnessCheckRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCasePriorityAssessmentRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCasePriorityAssessmentRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCasePriorityFactorRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCasePriorityFactorRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCasePriorityOverrideRequestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCasePriorityOverrideRequestRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseQualitySampleRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseQualitySampleRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseQueueDispositionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseQueueDispositionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseQueueExplanationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseQueueExplanationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewChecklistRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewChecklistRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewerConsensusRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewerConsensusRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewerDecisionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewerDecisionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewEvidenceBundleRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewEvidenceBundleRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewSessionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewSessionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseReviewWindowDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseReviewWindowDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseSecondReviewRequestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseSecondReviewRequestRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageQueueItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageQueueItemRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageQueueSnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageQueueSnapshotRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseTriageSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseTriageSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCaseWorkloadAllocationDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCaseWorkloadAllocationDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryCheckpointEvaluationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryCheckpointEvaluationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryClosureActionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryClosureActionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryClosureDecisionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryClosureDecisionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryContinuationActionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryContinuationActionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryContinuationDecisionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryContinuationDecisionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryDeferredIntegrationTicketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryDeferredIntegrationTicketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryEvidenceRollupRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryEvidenceRollupRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionApprovalChainDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionApprovalChainDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorityMatrixSnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorityMatrixSnapshotRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationDryRunRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationDryRunRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationEligibilityCheckRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationEligibilityCheckRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationPreviewReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationPreviewReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationRequestDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationRequestDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionAuthorizationSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionAuthorizationSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionConsentBoundaryCheckRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionConsentBoundaryCheckRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionMockAuthorizationReceiptRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionMockAuthorizationReceiptRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionPreflightChecklistRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionPreflightChecklistRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionPreLiveDecisionPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionPreLiveDecisionPacketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardAdminQueueRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardAdminQueueRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardBlockerRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardBlockerRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardCardRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardCardRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardFilterPresetRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardFilterPresetRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardGovernanceNoteRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardGovernanceNoteRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardLaneRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardLaneRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardParentSafeStatusDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardParentSafeStatusDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardRefreshJobRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardRefreshJobRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardRiskSignalRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardRiskSignalRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardRoleProjectionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardRoleProjectionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardSnapshotRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardSnapshotRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardStudentSafeStatusDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardStudentSafeStatusDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionReadinessBoardTeacherQueueRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionReadinessBoardTeacherQueueRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionRiskAttestationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionRiskAttestationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExecutionVetoRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExecutionVetoRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExitCriteriaEvaluationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExitCriteriaEvaluationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryExitCriteriaRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryExitCriteriaRecord; No R8-A modelWriterGroups entry for this model.
RecoveryFinalLifecycleSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryFinalLifecycleSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryIntensificationActionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryIntensificationActionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryIntensificationDecisionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryIntensificationDecisionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryLifecycleClosureAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryLifecycleClosureAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryLifecycleClosureIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryLifecycleClosureIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryLifecycleClosureReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryLifecycleClosureReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryNextCycleRecommendationDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryNextCycleRecommendationDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeActionAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeActionAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeActionBundleRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeActionBundleRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeActionIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeActionIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeActionReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeActionReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeActionSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeActionSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeApprovalGateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeApprovalGateRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeDecisionReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeDecisionReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeDecisionSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeDecisionSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeDryRunReceiptRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeDryRunReceiptRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeEvidenceRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeEvidenceRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionBlockedActionDiagnosticRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionBlockedActionDiagnosticRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionEligibilityCheckRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionEligibilityCheckRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionFailureInjectionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionFailureInjectionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionParentPreviewDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionParentPreviewDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionReadinessVerdictRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionReadinessVerdictRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationPlanRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationReadinessRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationResultRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationResultRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationRunRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationRunRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationStepRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationStepRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionSimulationSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionSimulationSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionStudentPreviewDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionStudentPreviewDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeExecutionTeacherReviewRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeExecutionTeacherReviewRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeMockActivationQueueRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeMockActivationQueueRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeParentUpdateDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeParentUpdateDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeRollbackPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeRollbackPlanRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeStudentNextStepDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeStudentNextStepDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeSuppressionRuleRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeSuppressionRuleRecord; No R8-A modelWriterGroups entry for this model.
RecoveryOutcomeTeacherReviewPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryOutcomeTeacherReviewPacketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryParentClosureGuidanceDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryParentClosureGuidanceDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryParentProgressNoteDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryParentProgressNoteDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryPauseActionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryPauseActionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryPauseDecisionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryPauseDecisionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryPlanAdjustmentDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryPlanAdjustmentDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryPostSimulationHandoffPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryPostSimulationHandoffPacketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryProgressAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryProgressAuditRecord; No R8-A modelWriterGroups entry for this model.
RecoveryProgressIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryProgressIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
RecoveryProgressObservationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryProgressObservationRecord; No R8-A modelWriterGroups entry for this model.
RecoveryProgressSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryProgressSummaryRecord; No R8-A modelWriterGroups entry for this model.
RecoveryStudentClosureReflectionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryStudentClosureReflectionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryStudentProgressReflectionDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryStudentProgressReflectionDraftRecord; No R8-A modelWriterGroups entry for this model.
RecoveryTeacherClosureReviewPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryTeacherClosureReviewPacketRecord; No R8-A modelWriterGroups entry for this model.
RecoveryTeacherReviewDecisionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryTeacherReviewDecisionRecord; No R8-A modelWriterGroups entry for this model.
RecoveryUnresolvedRiskRegisterRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RecoveryUnresolvedRiskRegisterRecord; No R8-A modelWriterGroups entry for this model.
RemediationPathRecord | src/services/remediationPathRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RemediationPathRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/remediationPathRepository.ts lines 52, 140 ops create/update (PRISMA_WRITE_ACCESS).
ResultAudienceProjectionRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultAudienceProjectionRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 390, 438, 443, 451 ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryAttemptRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 9 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 588, 631, 636, 641, 649 +4 more ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryAuditRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 871 ops create (PRISMA_WRITE_ACCESS).
ResultDeliveryChannelEnvelopeRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryChannelEnvelopeRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 449, 492, 497, 502, 510 +1 more ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryIdempotencyRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryIdempotencyRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 903, 923, 928 ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryJobRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryJobRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 260, 326, 331, 336, 344 +1 more ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryMockProviderRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryMockProviderRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 811, 848, 853, 861 ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryReceiptRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryReceiptRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 691, 734, 739 ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryRecipientRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryRecipientRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 362, 413, 418, 423, 431 +1 more ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliveryRetryPlanRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliveryRetryPlanRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 749, 788, 793, 801 ops create/update (PRISMA_WRITE_ACCESS).
ResultDeliverySuppressionRecord | src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultDeliverySuppressionRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories.ts lines 528, 565, 570, 578 ops create/update (PRISMA_WRITE_ACCESS).
ResultFinalizationDecisionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultFinalizationDecisionRecord; No R8-A modelWriterGroups entry for this model.
ResultFinalizationReviewRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultFinalizationReviewRecord; No R8-A modelWriterGroups entry for this model.
ResultFollowUpActionPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultFollowUpActionPlanRecord; No R8-A modelWriterGroups entry for this model.
ResultFollowUpCaseRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultFollowUpCaseRecord; No R8-A modelWriterGroups entry for this model.
ResultFollowUpSignalRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultFollowUpSignalRecord; No R8-A modelWriterGroups entry for this model.
ResultGovernanceAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultGovernanceAuditRecord; No R8-A modelWriterGroups entry for this model.
ResultGovernanceIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultGovernanceIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
ResultGrowthSignalRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultGrowthSignalRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 372, 401 ops create/update (PRISMA_WRITE_ACCESS).
ResultLearningEvidenceAuditRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultLearningEvidenceAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 412 ops create (PRISMA_WRITE_ACCESS).
ResultLearningEvidenceBridgeRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultLearningEvidenceBridgeRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 161, 210, 215 ops create/update (PRISMA_WRITE_ACCESS).
ResultLearningEvidenceIdempotencyRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultLearningEvidenceIdempotencyRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 438, 454, 459 ops create/update (PRISMA_WRITE_ACCESS).
ResultMasteryMutationEventRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultMasteryMutationEventRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 264, 287 ops create/update (PRISMA_WRITE_ACCESS).
ResultMasteryMutationPlanRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultMasteryMutationPlanRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 222, 252, 257 ops create/update (PRISMA_WRITE_ACCESS).
ResultObjectiveMasteryImpactRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultObjectiveMasteryImpactRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 294, 324, 329 ops create/update (PRISMA_WRITE_ACCESS).
ResultRecoveryAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryAuditRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryCheckpointRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryCheckpointRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryObjectiveRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryObjectiveRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryParentSupportNoteDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryParentSupportNoteDraftRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryPlanRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryPracticeDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryPracticeDraftRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryResourceRecommendationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryResourceRecommendationRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryStepRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryStepRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryStudentSupportDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryStudentSupportDraftRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoverySummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoverySummaryRecord; No R8-A modelWriterGroups entry for this model.
ResultRecoveryTeacherReviewPacketRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRecoveryTeacherReviewPacketRecord; No R8-A modelWriterGroups entry for this model.
ResultRegradeIntakeRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRegradeIntakeRecord; No R8-A modelWriterGroups entry for this model.
ResultRegradeRequestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultRegradeRequestRecord; No R8-A modelWriterGroups entry for this model.
ResultReleaseApprovalRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReleaseApprovalRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 323, 367, 372, 380 ops create/update (PRISMA_WRITE_ACCESS).
ResultReleaseAuditRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReleaseAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 754 ops create (PRISMA_WRITE_ACCESS).
ResultReleaseBoundaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReleaseBoundaryRecord; No R8-A modelWriterGroups entry for this model.
ResultReleaseDeliveryIntentRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReleaseDeliveryIntentRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 688, 731, 736, 744 ops create/update (PRISMA_WRITE_ACCESS).
ResultReleaseIdempotencyRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReleaseIdempotencyRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 771, 786, 791 ops create/update (PRISMA_WRITE_ACCESS).
ResultReleasePacketRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL+R8F_SOURCE_INSPECTION | modelWriterGroups:ResultReleasePacketRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 234, 287, 292, 297, 305 +1 more ops create/update (PRISMA_WRITE_ACCESS). R8-F: mounted HTTP router (src/routes/resultRelease.ts, /api/question-bank/result-release) defaults to the durable Prisma repository set (all 9 Prisma repositories + PrismaResultReleaseApprovalAtomicCommitter) via buildProductionResultReleaseDependencies; InMemory repositories retained for explicit test injection only (createResultReleaseRouter(dependencies)); no silent Prisma→memory fallback.
ResultReleaseReadinessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReleaseReadinessRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessAcknowledgementRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessAcknowledgementRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessAuditRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessExpiryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessExpiryRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessGrantRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessGrantRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessRecipientRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessRecipientRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessRevocationRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessRevocationRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessSummaryRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessSummaryRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessTimelineRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessTimelineRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAccessTokenIntentRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAccessTokenIntentRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardArchiveManifestRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardArchiveManifestRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardAssemblyRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAssemblyRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 436, 498, 513 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardAudienceProjectionRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAudienceProjectionRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 637, 677, 690 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardAuditRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 871 ops create (PRISMA_WRITE_ACCESS).
ResultReportCardEvidenceLinkRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardEvidenceLinkRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 583, 627 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardExportAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportAuditRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportEnvelopeRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportEnvelopeRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportIdempotencyRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportIdempotencyRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportIntentRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportIntentRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 756, 791, 803 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardExportJobRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportJobRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportReceiptRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportReceiptRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportRetryPlanRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportRetryPlanRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportSuppressionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportSuppressionRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardExportTargetRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardExportTargetRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardIdempotencyRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardIdempotencyRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 878, 899 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardMockExportAttemptRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardMockExportAttemptRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardPortalPreviewRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ResultReportCardPortalPreviewRecord; No R8-A modelWriterGroups entry for this model.
ResultReportCardRenderManifestRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardRenderManifestRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 813, 848, 861 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardReviewRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardReviewRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 700, 733, 746 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardSectionRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardSectionRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 523, 561, 573 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardTemplateRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardTemplateRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 326, 358, 369 ops create/update (PRISMA_WRITE_ACCESS).
ResultReportCardTemplateVersionRecord | src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultReportCardTemplateVersionRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/domains/assessment/result-report-card/repositories/prismaResultReportCardRepositories.ts lines 379, 414, 426 ops create/update (PRISMA_WRITE_ACCESS).
ResultRevisionSignalRecord | src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:ResultRevisionSignalRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/domains/assessment/result-learning-evidence/repositories/prismaResultLearningEvidenceRepositories.ts lines 336, 365 ops create/update (PRISMA_WRITE_ACCESS).
RevisionCollection | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionCollection; No R8-A modelWriterGroups entry for this model.
RevisionGuidedSessionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionGuidedSessionRecord; No R8-A modelWriterGroups entry for this model.
RevisionGuidedStepRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionGuidedStepRecord; No R8-A modelWriterGroups entry for this model.
RevisionItem | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionItem; No R8-A modelWriterGroups entry for this model.
RevisionModeAttemptRecord | src/services/revisionModeAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RevisionModeAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/revisionModeAttemptService.ts lines 28 ops create (PRISMA_WRITE_ACCESS).
RevisionModeItemStateRecord | src/services/revisionModeItemStateService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RevisionModeItemStateRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/revisionModeItemStateService.ts lines 15, 103, 159 ops create/update (PRISMA_WRITE_ACCESS).
RevisionModeQueueRecord | src/services/revisionModeQueueService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RevisionModeQueueRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/revisionModeQueueService.ts lines 19, 87 ops create/update (PRISMA_WRITE_ACCESS).
RevisionModeSessionRecord | src/services/revisionModeSessionService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RevisionModeSessionRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/revisionModeSessionService.ts lines 13, 67, 87, 98, 123 +1 more ops create/update/updateMany (PRISMA_WRITE_ACCESS).
RevisionModeSummaryRecord | src/services/revisionModeSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:RevisionModeSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/revisionModeSummaryService.ts lines 31 ops create (PRISMA_WRITE_ACCESS).
RevisionNoteLink | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionNoteLink; No R8-A modelWriterGroups entry for this model.
RevisionReviewEvent | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionReviewEvent; No R8-A modelWriterGroups entry for this model.
RevisionSourceSignalReceipt | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RevisionSourceSignalReceipt; No R8-A modelWriterGroups entry for this model.
RubricVersionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:RubricVersionRecord; No R8-A modelWriterGroups entry for this model.
SafeLearningEvidenceAggregateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SafeLearningEvidenceAggregateRecord; No R8-A modelWriterGroups entry for this model.
SafeLearningEvidenceAuditRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SafeLearningEvidenceAuditRecord; No R8-A modelWriterGroups entry for this model.
SafeLearningEvidenceRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SafeLearningEvidenceRecord; No R8-A modelWriterGroups entry for this model.
SafeMemorySummary | src/services/safeMemorySummaryService.ts | src/services/studentExitArchiveService.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SafeMemorySummary; Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/safeMemorySummaryService.ts lines 69, 115 ops create/update (PRISMA_WRITE_ACCESS).
SafetyAlert | src/routes/ai.ts | src/routes/ai/ai-safety.routes.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SafetyAlert; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-safety.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/routes/ai.ts lines 3889, 3922 ops create/update (PRISMA_WRITE_ACCESS).
SafetyEventAudit | src/routes/ai/ai-safety.routes.ts | src/routes/ai.ts, src/services/abnormalBehaviorService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SafetyEventAudit; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-safety.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 7 production WRITE access row(s): src/routes/ai/ai-safety.routes.ts lines 77, 129, 165, 199, 224 ops create (PRISMA_WRITE_ACCESS).
SchoolIntegrationAuditRecord | src/repositories/schoolIntegrationAuditRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SchoolIntegrationAuditRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/schoolIntegrationAuditRepository.ts lines 56, 130 ops create/deleteMany (PRISMA_WRITE_ACCESS).
SchoolIntegrationIdempotencyRecord | src/repositories/schoolIntegrationIdempotencyRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SchoolIntegrationIdempotencyRecord; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/repositories/schoolIntegrationIdempotencyRepository.ts lines 39, 69, 92, 100 ops create/deleteMany/updateMany (PRISMA_WRITE_ACCESS).
SchoolRosterSyncConflictRecord | src/repositories/schoolRosterSyncConflictRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SchoolRosterSyncConflictRecord; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/repositories/schoolRosterSyncConflictRepository.ts lines 46, 79 ops create/deleteMany (PRISMA_WRITE_ACCESS).
SchoolRosterSyncJobRecord | src/repositories/schoolRosterSyncJobRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:SchoolRosterSyncJobRecord; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/repositories/schoolRosterSyncJobRepository.ts lines 38, 79, 85 ops create/deleteMany (PRISMA_WRITE_ACCESS).
ScoringSuggestionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:ScoringSuggestionRecord; No R8-A modelWriterGroups entry for this model.
SkillMasterySnapshot | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SkillMasterySnapshot; No R8-A modelWriterGroups entry for this model.
SpacedReviewItem | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SpacedReviewItem; No R8-A modelWriterGroups entry for this model.
StudentLearningProfileSnapshot | src/services/studentLearningProfileService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentLearningProfileSnapshot; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/studentLearningProfileService.ts lines 220 ops upsert (PRISMA_WRITE_ACCESS).
StudentLearningSessionEvent | src/services/studentLearningSessionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentLearningSessionEvent; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/studentLearningSessionRepository.ts lines 420, 488, 582, 841 ops create (PRISMA_WRITE_ACCESS).
StudentLearningSessionState | src/services/studentLearningSessionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentLearningSessionState; Single production writer file. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/services/studentLearningSessionRepository.ts lines 278, 395, 463, 557, 790 ops create/updateMany (PRISMA_WRITE_ACCESS).
StudentMarkChallengeRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudentMarkChallengeRecord; No R8-A modelWriterGroups entry for this model.
StudentMasteryAggregationRun | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudentMasteryAggregationRun; No R8-A modelWriterGroups entry for this model.
StudentProfile | prisma/seed.ts | src/routes/ai.ts, src/services/voiceLedgerService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentProfile; Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/services/voiceLedgerService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): prisma/seed.ts lines 9 ops upsert (PRISMA_WRITE_ACCESS).
StudentReflectionTaskDraftRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudentReflectionTaskDraftRecord; No R8-A modelWriterGroups entry for this model.
StudentResultReportSnapshotRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentResultReportSnapshotRecord; Single production writer file. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 461, 506, 511, 519, 527 ops create/update (PRISMA_WRITE_ACCESS).
StudentSafeResultSummaryRecord | src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:StudentSafeResultSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/domains/assessment/result-release/repositories/prismaResultReleaseRepositories.ts lines 613, 657, 662, 670, 678 ops create/update (PRISMA_WRITE_ACCESS).
StudentSupportPatternSnapshot | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudentSupportPatternSnapshot; No R8-A modelWriterGroups entry for this model.
StudyGoal | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudyGoal; No R8-A modelWriterGroups entry for this model.
StudyPlan | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:StudyPlan; No R8-A modelWriterGroups entry for this model.
SubmittedSnapshotIntakeRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:SubmittedSnapshotIntakeRecord; No R8-A modelWriterGroups entry for this model.
TeachBackModeAttemptRecord | src/services/teachBackModeAttemptService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeachBackModeAttemptRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/teachBackModeAttemptService.ts lines 29 ops create (PRISMA_WRITE_ACCESS).
TeachBackModePromptStateRecord | src/services/teachBackModePromptStateService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeachBackModePromptStateRecord; Single production writer file. CANONICAL MUTATION PATH from 10 production WRITE access row(s): src/services/teachBackModePromptStateService.ts lines 18, 63, 82, 89, 96 +5 more ops create/createMany/update (PRISMA_WRITE_ACCESS).
TeachBackModeSessionRecord | src/services/teachBackModeSessionService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeachBackModeSessionRecord; Single production writer file. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/teachBackModeSessionService.ts lines 34, 108, 138, 142, 149 +1 more ops create/update (PRISMA_WRITE_ACCESS).
TeachBackModeSummaryRecord | src/services/teachBackModeSummaryService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeachBackModeSummaryRecord; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/teachBackModeSummaryService.ts lines 30 ops create (PRISMA_WRITE_ACCESS).
TeacherFollowUpQueueItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TeacherFollowUpQueueItemRecord; No R8-A modelWriterGroups entry for this model.
TeacherInterventionAssignment | src/services/teacherInterventionRepository.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeacherInterventionAssignment; Single production writer file. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/teacherInterventionRepository.ts lines 78, 205, 239, 268 ops create/update (PRISMA_WRITE_ACCESS).
TeacherInterventionAuditEvent | src/services/teacherInterventionAuditService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TeacherInterventionAuditEvent; Single production writer file. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/services/teacherInterventionAuditService.ts lines 41 ops create (PRISMA_WRITE_ACCESS).
TeacherOverrideRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TeacherOverrideRecord; No R8-A modelWriterGroups entry for this model.
TeacherReviewGroupRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TeacherReviewGroupRecord; No R8-A modelWriterGroups entry for this model.
TeacherReviewItemRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TeacherReviewItemRecord; No R8-A modelWriterGroups entry for this model.
TurnLatencyMetric | src/services/latencyService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TurnLatencyMetric; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/latencyService.ts lines 275, 279, 295 ops create/update (PRISMA_WRITE_ACCESS).
TutorActionDecisionRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TutorActionDecisionRecord; No R8-A modelWriterGroups entry for this model.
TutorActionEffectivenessRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TutorActionEffectivenessRecord; No R8-A modelWriterGroups entry for this model.
TutorHintLadderStateRecord | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TutorHintLadderStateRecord; No R8-A modelWriterGroups entry for this model.
TutorLearnerIdentityMap | src/repositories/schoolIdentityMappingRepository.ts | src/services/externalStudentIdentityMapper.ts, src/services/task021SchoolIntegrationDurableBridge.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:TutorLearnerIdentityMap; Multiple writer files with proven coordination boundary (dependency-edge: src/services/task021SchoolIntegrationDurableBridge.ts imports src/repositories/schoolIdentityMappingRepository.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/repositories/schoolIdentityMappingRepository.ts lines 47, 121 ops create/update (PRISMA_WRITE_ACCESS).
TutorSession | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TutorSession; No R8-A modelWriterGroups entry for this model.
TutorState | UNRESOLVED | — | UNRESOLVED | R8A_STRUCTURAL | modelWriterGroups:TutorState; No R8-A modelWriterGroups entry for this model.
VoiceLedgerEntry | src/services/voiceLedgerService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:VoiceLedgerEntry; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/voiceLedgerService.ts lines 179, 271, 514 ops create (PRISMA_WRITE_ACCESS).
VoicePackageGrant | src/services/voiceLedgerService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:VoicePackageGrant; Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/voiceLedgerService.ts lines 167, 207, 260 ops create/update (PRISMA_WRITE_ACCESS).
VoiceSessionUsage | src/services/voiceLedgerService.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:VoiceSessionUsage; Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/voiceLedgerService.ts lines 402, 526 ops create/update (PRISMA_WRITE_ACCESS).
VoiceUsage | src/routes/ai/ai-voice.routes.ts | — | CLEAR | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | modelWriterGroups:VoiceUsage; Single production writer file, but confidence reduced: route-layer writer. CANONICAL MUTATION PATH from 1 production WRITE access row(s): src/routes/ai/ai-voice.routes.ts lines 55 ops create (PRISMA_WRITE_ACCESS).

## Shared / Multiple Writer Candidates

Model | Canonical writer | Additional writers | Classification | Evidence kind | Evidence
--- | --- | --- | --- | --- | ---
ChatMessage | src/routes/ai.ts | src/routes/ai/ai-chat.routes.ts, src/services/aiService.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 10 production WRITE access row(s): src/routes/ai.ts lines 4791, 5077, 5123, 5551, 5670 ops create/update (PRISMA_WRITE_ACCESS).
ChatSession | src/routes/ai/ai-chat.routes.ts | prisma/seed.ts, src/routes/ai.ts, src/routes/ai/ai-research.routes.ts, src/services/aiService.ts, src/workers/index.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-research.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 18 production WRITE access row(s): src/routes/ai/ai-chat.routes.ts lines 70, 75, 158, 200, 243 +1 more ops create/deleteMany/update/updateMany (PRISMA_WRITE_ACCESS).
ConversationArchiveRecord | src/services/conversationArchiveService.ts | src/services/studentExitArchiveService.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/conversationArchiveService.ts lines 54 ops create (PRISMA_WRITE_ACCESS).
CopilotPreferences | src/routes/ai/ai-memory-preferences.routes.ts | src/services/copilotPreferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai/ai-memory-preferences.routes.ts imports src/services/copilotPreferenceService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/routes/ai/ai-memory-preferences.routes.ts lines 47, 171 ops upsert (PRISMA_WRITE_ACCESS).
dailyObjectiveCheckAttemptRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Single production writer file. CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 643, 1007 ops create/deleteMany (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckCompletionIdempotencyRecord | src/services/phase3DailyObjectiveCheckCompletionService.ts | src/services/phase3DailyObjectiveCheckRepository.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/services/phase3DailyObjectiveCheckCompletionService.ts imports src/services/phase3DailyObjectiveCheckRepository.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/phase3DailyObjectiveCheckCompletionService.ts lines 114, 138, 830 ops deleteMany/update/upsert (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckConfidenceRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Single production writer file. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 525, 531, 1008 ops create/deleteMany/update (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
dailyObjectiveCheckSessionRecord | src/services/phase3DailyObjectiveCheckRepository.ts | — | AMBIGUOUS | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Single production writer file. CANONICAL MUTATION PATH from 11 production WRITE access row(s): src/services/phase3DailyObjectiveCheckRepository.ts lines 228, 393, 406, 469, 669 +6 more ops create/deleteMany/update/updateMany (PRISMA_WRITE_ACCESS). Writer-group key matches no canonical Prisma model (naming drift); carried as an orphan for later review.
DurableAuditEvent | src/services/adaptiveChallengeAuditRepository.ts | src/services/durableAuditRepository.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 2 production WRITE access row(s): src/services/adaptiveChallengeAuditRepository.ts lines 9 ops create (PRISMA_WRITE_ACCESS).
FocusModeSessionRecord | src/services/focusModeSessionService.ts | src/services/focusModeStepService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (common-coordinator: src/routes/focusModeRoutes.ts imports src/services/focusModeSessionService.ts + src/services/focusModeStepService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/focusModeSessionService.ts lines 33, 99, 113, 120, 130 ops create/update (PRISMA_WRITE_ACCESS).
LearningArtifact | src/services/artifactService.ts | src/services/artifactStructuredRepository.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/services/artifactStructuredRepository.ts imports src/services/artifactService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 4 production WRITE access row(s): src/services/artifactService.ts lines 718, 826, 931 ops update/upsert (PRISMA_WRITE_ACCESS).
LearningArtifactBlock | src/services/artifactStructuredRepository.ts | src/services/artifactService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/services/artifactStructuredRepository.ts imports src/services/artifactService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 7 production WRITE access row(s): src/services/artifactStructuredRepository.ts lines 164, 166, 300, 302, 423 ops createMany/deleteMany (PRISMA_WRITE_ACCESS).
LearningModeSession | src/services/learningModeSessionService.ts | src/services/quizModeSessionService.ts, src/services/teachBackModeSessionService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/services/quizModeSessionService.ts imports src/services/learningModeSessionService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 6 production WRITE access row(s): src/services/learningModeSessionService.ts lines 15, 87, 103, 113 ops create/update (PRISMA_WRITE_ACCESS).
Mistake | src/lib/personalization.ts | src/routes/ai.ts, src/routes/ai/ai-memory-preferences.routes.ts, src/services/masteryInferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-memory-preferences.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 12 production WRITE access row(s): src/lib/personalization.ts lines 60, 75, 94 ops create/deleteMany/update (PRISMA_WRITE_ACCESS).
Progress | src/routes/ai.ts | src/lib/personalization.ts, src/routes/ai/ai-memory-preferences.routes.ts, src/services/masteryInferenceService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-memory-preferences.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 10 production WRITE access row(s): src/routes/ai.ts lines 2301, 2306, 2353 ops create/update (PRISMA_WRITE_ACCESS).
SafeMemorySummary | src/services/safeMemorySummaryService.ts | src/services/studentExitArchiveService.ts | DUPLICATE_WRITER_CANDIDATE | PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple distinct production writer files without a proven coordination boundary (filename co-occurrence is candidate signal only). CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/services/safeMemorySummaryService.ts lines 69, 115 ops create/update (PRISMA_WRITE_ACCESS).
SafetyAlert | src/routes/ai.ts | src/routes/ai/ai-safety.routes.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-safety.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): src/routes/ai.ts lines 3889, 3922 ops create/update (PRISMA_WRITE_ACCESS).
SafetyEventAudit | src/routes/ai/ai-safety.routes.ts | src/routes/ai.ts, src/services/abnormalBehaviorService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/routes/ai/ai-safety.routes.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 7 production WRITE access row(s): src/routes/ai/ai-safety.routes.ts lines 77, 129, 165, 199, 224 ops create (PRISMA_WRITE_ACCESS).
StudentProfile | prisma/seed.ts | src/routes/ai.ts, src/services/voiceLedgerService.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/routes/ai.ts imports src/services/voiceLedgerService.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 3 production WRITE access row(s): prisma/seed.ts lines 9 ops upsert (PRISMA_WRITE_ACCESS).
TutorLearnerIdentityMap | src/repositories/schoolIdentityMappingRepository.ts | src/services/externalStudentIdentityMapper.ts, src/services/task021SchoolIntegrationDurableBridge.ts | SHARED_BY_DESIGN | DEPENDENCY_GRAPH+PRISMA_WRITE_ACCESS+R8A_STRUCTURAL | Multiple writer files with proven coordination boundary (dependency-edge: src/services/task021SchoolIntegrationDurableBridge.ts imports src/repositories/schoolIdentityMappingRepository.ts (02 dependency graph)). Filename co-occurrence was not used as proof. CANONICAL MUTATION PATH from 5 production WRITE access row(s): src/repositories/schoolIdentityMappingRepository.ts lines 47, 121 ops create/update (PRISMA_WRITE_ACCESS).

SHARED_BY_DESIGN appears only with a proven coordination boundary (dependency edge, common coordinator, shared transaction, explicit delegation, accepted architecture, or source inspection). Filename co-occurrence (repository + service) is candidate signal only and yields DUPLICATE_WRITER_CANDIDATE.

All rows above are classifications for later engineering review. R8-B records no final disposition.

## Runtime State Ownership

Allocation | Scope | Class | Evidence
--- | --- | --- | ---
src/contracts/task022CurriculumGovernanceContracts.ts:73 TASK022_FORBIDDEN_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/contracts/task040BackendFreezeContracts.ts:790 task040SafeJsonKeys (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/audit/assessmentAuditService.ts:10 REDACTED_METADATA_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:14 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:48 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:76 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:106 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:136 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:164 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:192 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/repositories/inMemoryExamBlueprintRepositories.ts:222 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/exam-blueprint/services/blueprintCoverageGapService.ts:65 uniqueReasons (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-blueprint/services/examDraftRankingService.ts:72 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-blueprint/services/examDraftSetGenerationService.ts:225 alreadySelected (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-blueprint/services/questionSelectionService.ts:129 alreadySelected (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:43 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:95 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:130 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:180 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:237 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:269 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:310 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:330 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:362 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories.ts:386 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-delivery/tests/package-7-delivery-contracts.test.ts:151 forbidden (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:25 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:62 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:100 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:118 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:140 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:176 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:194 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:234 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:253 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/repositories/inMemoryExamPaperRepositories.ts:279 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/services/examPaperAssemblyService.ts:122 sections (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-paper/services/examPaperSectionLayoutService.ts:86 positionMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-paper/services/examPaperSectionLayoutService.ts:93 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-paper/services/examVariantPlanningService.ts:84 markMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts:15 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts:16 idempotencyStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts:59 sectionKeyToId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:20 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:55 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:95 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:130 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:177 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:224 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:254 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/repositories/inMemoryMarkingInvocationRepositories.ts:286 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking-invocation/tests/package-8-batch-planning.test.ts:43 questionTypeMap (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/marking-invocation/tests/package-8-batch-planning.test.ts:45 marksMap (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:9 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:44 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:87 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:118 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:153 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:192 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:235 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:270 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/marking/repositories/inMemoryMarkingRepositories.ts:305 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/outbox/assessmentOutboxService.ts:10 FORBIDDEN_PAYLOAD_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/policies/assessmentPolicyRegistry.ts:13 policies (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:9 STUDENT_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:16 PARENT_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:25 TEACHER_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:29 SYSTEM_MARKING_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:35 ADMIN_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/projections/assessmentProjectionGuard.ts:51 FORBIDDEN_SET (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:20 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:61 versions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:96 parts (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:115 assets (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:132 answerKeys (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:157 rubrics (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:182 mappings (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:204 records (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:221 validityRecords (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:222 eligibilityRecords (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:223 safetyReviews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:269 requests (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:306 records (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:327 batches (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:366 candidates (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:419 candidates (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories.ts:454 holds (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:39 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:108 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:171 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:240 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:298 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:360 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:433 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:499 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:556 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:614 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:676 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:740 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:790 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-adjudication/repositories/inMemoryRecoveryCaseAdjudicationRepositories.ts:884 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:40 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:124 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:213 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:255 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:315 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:382 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:450 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:541 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:614 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:685 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:757 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:794 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:853 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:946 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories.ts:995 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:33 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:79 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:125 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:167 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:209 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:255 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:305 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:347 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:393 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:435 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:477 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:519 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:561 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:612 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories.ts:650 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:41 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:129 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:192 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:271 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:320 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:382 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:444 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:497 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:554 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:607 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:660 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:709 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:758 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:819 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:886 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-execution-readiness-board/repositories/inMemoryRecoveryExecutionReadinessBoardRepositories.ts:922 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:31 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:116 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:197 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:270 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:335 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:396 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:469 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:542 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:611 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:680 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:749 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:831 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-lifecycle-closure/repositories/inMemoryRecoveryLifecycleClosureRepositories.ts:848 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:43 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:101 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:163 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:213 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:263 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:313 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:367 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:413 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:463 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:501 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:551 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:597 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:655 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories.ts:673 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:35 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:100 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:173 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:242 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:291 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:352 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:417 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:486 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:543 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:616 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:681 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:746 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:815 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:889 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories.ts:906 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:90 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:140 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:184 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:224 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:274 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:324 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:374 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:429 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:483 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:527 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:575 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:636 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories.ts:648 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-outcome/tests/package-19-outcome-contracts.test.ts:33 allowed (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:18 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:58 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:98 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:135 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:169 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:203 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:234 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:265 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:299 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:336 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories.ts:348 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/repositories/inMemoryAssessmentRepositories.ts:22 records (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:31 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:122 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:200 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:274 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:329 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:425 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:474 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:528 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:581 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories.ts:609 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:91 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:234 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:343 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:457 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:589 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:702 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:813 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:919 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:1038 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:1144 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories.ts:1169 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:25 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:72 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:117 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:162 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:202 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:241 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:284 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories.ts:308 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:20 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:68 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:116 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:150 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:198 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:237 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:276 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories.ts:300 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:100 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:237 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:355 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:485 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:618 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:743 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:867 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:978 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:1096 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:1209 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:1312 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories.ts:1345 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:23 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:93 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:147 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:207 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:269 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:331 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:393 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:447 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts:465 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:116 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:237 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:342 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:446 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:533 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:631 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:746 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:866 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:992 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:1080 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-access/repositories/inMemoryResultReportCardAccessRepositories.ts:1109 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:56 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:168 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:266 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:367 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:475 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:568 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:663 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:763 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:855 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories.ts:884 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:33 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:77 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:126 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:213 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:263 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:305 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:359 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:408 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:472 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:521 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories.ts:531 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:39 versions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:40 nodes (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:41 edges (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:42 commandResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:43 snapshots (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:154 versions (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:155 nodes (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:156 edges (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:157 commandResults (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:165 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:166 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:167 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository.ts:168 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService.ts:220 nodeIdMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService.ts:311 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService.ts:366 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:26 student (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:29 teacher (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:42 school_admin (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:60 internal_operator (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:79 parent (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService.ts:80 unknown (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:35 childToParent (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:58 adj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:64 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:116 reverseAdj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:122 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:157 adj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:163 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:215 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:216 recursionStack (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:240 prereqIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:241 startSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:260 inDegree (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:261 prereqAdj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService.ts:495 safeNodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:97 childToParent (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:113 nodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:253 codeMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:275 edgeSignature (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:390 adj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:391 nodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:413 adj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:414 nodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:436 color (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:437 parent (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:479 adj (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService.ts:480 nodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:7 events (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:8 streams (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:9 candidateProjections (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:10 committedProjections (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:11 idempotency (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository.ts:12 checkpoints (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/lib/examModeValidation.ts:22 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/focusModeValidation.ts:15 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/growthActionValidation.ts:18 forbiddenFieldSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/learnerTransparencyValidation.ts:16 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/noAiBypassValidation.ts:12 forbiddenFieldSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/phase3DailyObjectiveCheckValidation.ts:93 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/phase3LivingRevisionValidation.ts:250 forbiddenSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/quizModeValidation.ts:21 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/rbac.ts:13 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/safeLearningEvidenceValidation.ts:16 forbiddenFieldSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/studentLearningSessionValidation.ts:14 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task025ControlledPilotReadinessValidation.ts:32 ALLOWED_ACTOR_ROLES_FOR_CONTROL (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task029ExpansionOperationsValidation.ts:247 forbiddenSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task031StagingSmokeCanaryReadinessValidation.ts:24 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task032ControlledCanaryActivationValidation.ts:23 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task032ControlledCanaryActivationValidation.ts:235 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task033ControlledCanaryObservationValidation.ts:30 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task033ControlledCanaryObservationValidation.ts:483 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task034ControlledLimitedRolloutValidation.ts:55 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/task034ControlledLimitedRolloutValidation.ts:542 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/teachBackModeValidation.ts:22 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/lib/tutorTurnRuntimeValidation.ts:12 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/collections.ts:109 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/collections.ts:136 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/collections.ts:184 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/collections.ts:252 byId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/collections.ts:318 groups (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:101 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:102 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:103 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:176 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:177 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:178 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:229 seenKeys (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:279 stopWords (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/metadata.ts:286 counts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/revision.ts:35 TITLE_STOPWORDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/revision.ts:180 selectedSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/scoring.ts:174 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/scoring.ts:175 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/scoring.ts:176 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/scoring.ts:177 recentIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/session.ts:214 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/types.ts:353 VALID_TUTOR_ACTIONS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/media-stream/voice.ts:17 ALLOWED_TTS_VOICES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/middleware/task019RateLimitMiddleware.ts:20 optionsStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/r5-revision-runtime-completion.test.ts:159 ids (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/r6-learning-intelligence-integration.test.ts:658 <anonymous> (Set) | unknown | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:13 pilotPrograms (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:14 pilotCohorts (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:15 pilotParticipants (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:16 pilotReadinessChecks (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:17 pilotDryRuns (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task025PilotRepository.ts:18 pilotAuditRecords (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:16 pilotRuns (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:17 executionEvents (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:18 evidenceEvents (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:19 auditEvents (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:20 incidentSignals (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:21 safeguardingSignals (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:22 dailySummaries (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task026PilotExecutionRepository.ts:23 teacherSnapshots (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:18 proposals (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:19 evidenceSummaries (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:20 reviewResults (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:21 riskAssessments (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:22 decisions (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:23 evidencePacks (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task027PilotExpansionGovernanceRepository.ts:24 auditEvents (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:18 runs (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:19 stages (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:20 participants (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:21 runtimeEvents (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:22 healthSnapshots (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:23 oversightItems (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:24 interventions (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:25 rollbackRecords (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:26 completionReviews (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:27 reports (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task028ExpansionExecutionRepository.ts:28 auditRecords (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:18 dashboards (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:19 permissionDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:20 controlActionPreflights (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:21 controlActionResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:22 learnerOwnStatusViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:23 interventionOperationsViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:24 incidentOperationsViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:25 rollbackCommandResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:26 auditTimelineViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:27 evidenceSummaryViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:28 completionReviewSummaryViews (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task029ExpansionOperationsRepository.ts:29 operationsDiagnostics (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task030ControlledStagingRehearsalRepository.ts:23 task029Proofs (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task030ControlledStagingRehearsalRepository.ts:25 schoolFixtures (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task030ControlledStagingRehearsalRepository.ts:26 roleTokenMatrices (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task030ControlledStagingRehearsalRepository.ts:27 rehearsalRuns (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task030ControlledStagingRehearsalRepository.ts:28 stageResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task031StagingSmokeCanaryReadinessRepository.ts:32 smokeRuns (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task031StagingSmokeCanaryReadinessRepository.ts:33 smokeStageResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task031StagingSmokeCanaryReadinessRepository.ts:45 evidenceEvents (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task032ControlledCanaryActivationRepository.ts:22 approvedSchoolCanaryConfigStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task032ControlledCanaryActivationRepository.ts:27 activationRecordStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task032ControlledCanaryActivationRepository.ts:31 safeViewStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task032ControlledCanaryActivationRepository.ts:183 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task032ControlledCanaryActivationRepository.ts:188 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task032ControlledCanaryActivationRepository.ts:192 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task033ControlledCanaryObservationRepository.ts:28 sessionStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task033ControlledCanaryObservationRepository.ts:30 aggregateStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task033ControlledCanaryObservationRepository.ts:42 safeReadModelStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task033ControlledCanaryObservationRepository.ts:247 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task033ControlledCanaryObservationRepository.ts:249 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task033ControlledCanaryObservationRepository.ts:261 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task034ControlledLimitedRolloutRepository.ts:37 sessionStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task034ControlledLimitedRolloutRepository.ts:49 safeReadModelStore (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/repositories/task034ControlledLimitedRolloutRepository.ts:63 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task034ControlledLimitedRolloutRepository.ts:75 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:31 environmentGates (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:32 launchWindows (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:33 launchApprovals (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:34 singleSchoolScopes (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:35 launchSessions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:36 launchEvents (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:37 runtimeMonitoringResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=meMo
src/repositories/task036LiveSchoolLaunchRepository.ts:38 healthBudgets (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:39 incidentReadinessResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:40 pauseControls (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:41 rollbackControls (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:42 killSwitchControls (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:43 privacyBoundaries (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:44 contentGovernances (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:45 socraticIntegrities (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:46 deenBoundaries (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:47 schoolIdentities (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:48 crossSchoolDenials (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:49 safeLaunchReadModels (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:51 diagnosticsResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/repositories/task036LiveSchoolLaunchRepository.ts:52 finalLaunchDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:522 VALID_TUTOR_ACTIONS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:553 ALLOWED_TTS_VOICES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:880 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:907 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1002 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1070 byId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1263 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1264 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1265 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1266 recentIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1316 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1317 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1318 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1378 dueNowIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1379 needsAttentionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1380 continueIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1502 seenKeys (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1537 groups (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1613 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1884 stopWords (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:1891 counts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:2388 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:2591 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3584 COPILOT_THEME_PREFERENCE_VALUES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3585 STUDY_ATMOSPHERE_IDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3614 MEDIA_RECAP_PREFERENCE_VALUES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3615 MEDIA_SHORT_SUPPORT_VALUES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3704 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3733 VIDEO_RECOMMENDATION_INTENTS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3847 HIGH_RISK_SEVERITIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:3988 recentIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:4233 TITLE_FORBIDDEN (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai.ts:4248 TITLE_STOPWORDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai/ai-media.routes.ts:270 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/ai/ai-route-contracts.ts:199 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/routes/growthActionRoutes.ts:66 actionPlanStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/routes/task035SchoolWideReadinessRoutes.ts:43 sessions (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationProfileRepository.ts:119 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/services/adaptiveRecommendationTuningPrivacyGuard.ts:4 FORBIDDEN_FIELDS_SET (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationTuningPrivacyGuard.ts:42 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationTuningService.ts:175 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationTuningService.ts:176 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationTuningService.ts:178 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/adaptiveRecommendationTuningService.ts:179 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/aiGateway/providerHealthService.ts:17 adapters (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/aiRuntimeBudgetGuardService.ts:12 usageStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/aiRuntimeCircuitBreakerService.ts:14 breakers (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/aiRuntimeRateLimitGuardService.ts:15 windows (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactAwareMisconceptionService.ts:53 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactAwareMisconceptionService.ts:58 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactAwarePracticeChatTriggerService.ts:99 ARTIFACT_REFERENCE_WORDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactAwarePracticeGenerator.ts:46 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactContracts.ts:60 RESTRICTED_ARTIFACT_BLOCK_KINDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactLearningObjectiveService.ts:80 seenInferred (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactParseOrchestrator.ts:205 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactParseOrchestrator.ts:212 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactPracticeSourceResolver.ts:47 foundSourceKinds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactPracticeSourceResolver.ts:260 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:77 queryTokens (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:80 scored (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:81 questionBlockIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:82 answerKeyBlockIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:83 workedExampleBlockIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactQueryService.ts:137 blockTokens (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactSafeSummaryService.ts:71 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactSafeSummaryService.ts:78 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactSafeSummaryService.ts:120 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactService.ts:32 artifactMemoryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Memo
src/services/artifactService.ts:33 artifactLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactService.ts:135 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:61 structuredRecordMirror (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:62 blockMirror (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:63 questionMirror (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:367 wanted (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:569 wanted (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactStructuredRepository.ts:573 wanted (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/artifactTopicSkillMappingService.ts:24 seenKeys (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assessmentSessionService.ts:853 answerTokens (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assessmentSessionService.ts:1208 latestAttemptByQuestion (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assessmentSessionService.ts:1216 topicMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assessmentSessionService.ts:1217 mistakeMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assessmentSessionService.ts:1218 weakTopicTriggers (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/assistantTurnPipelineService.ts:48 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/backendEnvSchema.ts:25 SECRET_KEYS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/backendPerformanceBudgetService.ts:4 budgets (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/backendProductionErrorService.ts:22 SAFE_CODES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/backendTimeoutPolicyService.ts:50 policies (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/cacheScopePolicyService.ts:20 NEVER_CACHE_DATA_CLASSES (Set) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=CACHE
src/services/chatPipelineValidation.ts:12 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/chatResponseSafetyService.ts:94 verifiedSourceIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/commonMistakeMapService.ts:24 allMistakes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/contentGovernance/repositories/inMemoryRepositories.ts:16 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:45 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:71 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:94 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:117 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:146 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:178 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/contentGovernance/repositories/inMemoryRepositories.ts:207 data (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/conversationRedactionService.ts:1 SENSITIVE_SAFETY_TAGS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/conversationRetentionPolicyService.ts:6 SENSITIVE_SAFETY_TAGS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeDeckService.ts:8 DECK_CACHE (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=CACHE
src/services/creativeDeckService.ts:44 creatorUsage (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeDeckService.ts:45 topicUsage (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeDeckService.ts:46 roleUsage (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeInteractionService.ts:69 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeScoringService.ts:88 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/creativeScoringService.ts:95 seenCreators (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:183 surfaces (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:243 mistakeMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:248 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:395 mistakesBySurface (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:399 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:422 weakSurfaces (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/crossSurfaceLearningContinuityService.ts:431 strongSurfaces (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/durableAuditRedactionService.ts:16 FORBIDDEN_DURABLE_AUDIT_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/endToEndLearningLoopRuntime.ts:112 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/examModePrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/externalVideoCandidateService.ts:16 SERVICE_CACHE (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=CACHE
src/services/externalVideoCandidateService.ts:39 byStableId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/focusModePrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/futureCurriculumAdapterRegistry.ts:18 adapters (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthActionPrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.integration.test.ts:256 redisStore (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/growthIntelligenceService.ts:254 snapshotCache (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Cache
src/services/growthIntelligenceService.ts:257 persistTracker (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:514 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:548 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:576 linkedRevisionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:602 linkedRevisionIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:679 canonicalNegativeEvidenceByTopic (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:680 canonicalPositiveEvidenceByTopic (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:690 canonicalMasteryByTopic (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:696 byTopic (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:969 seenTopic (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:1206 topicKeys (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:1407 weakTopicBySubject (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:1413 subjectBuckets (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:1433 topics (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthIntelligenceService.ts:1477 topicBuckets (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthProofService.ts:151 <anonymous> (Set) | unknown | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/growthProofService.ts:314 counts (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/intentResolutionEventService.ts:16 eventStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/intentResolutionEventService.ts:17 eventLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/intentResolverService.ts:357 scores (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/intentResolverValidation.ts:14 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/latencyService.ts:179 buckets (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learnerEvidenceProvenanceService.ts:54 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learnerFacingExplanationService.ts:205 ids (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learnerHiddenReasoningBoundaryGuard.ts:5 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learnerHiddenReasoningBoundaryGuard.ts:99 promptProviderSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learnerMemoryService.ts:41 memoryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=memo
src/services/learnerMemoryService.ts:42 memoryLookupByKey (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=memo
src/services/learnerMemoryService.ts:85 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/learnerMemoryService.ts:510 handledScopes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/services/learnerMemoryService.ts:544 handledScopes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=context
src/services/learnerMemoryValidation.ts:108 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/learnerPreferenceFeedbackRepository.ts:112 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/services/learnerTransparencyPrivacyGuard.ts:5 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningDashboardEvidenceService.ts:36 evidenceStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/learningEffectivenessService.ts:438 moduleMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningEventService.ts:19 eventMemoryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Memo
src/services/learningEventService.ts:62 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningEvidenceLedgerService.ts:36 ledgerStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/learningIntelligenceIntegrationService.ts:361 candidates (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:391 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:406 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:411 evidenceByTopic (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:434 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:451 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/learningIntelligenceIntegrationService.ts:465 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/lowWorkloadTeacherSummaryService.ts:125 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/learnerProgressStateService.ts:10 progressStateStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/mastery/learnerProgressStateService.ts:32 subjectsSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/revisionSchedulingRuntime.ts:21 scheduledSkills (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/stepEvidencePersistenceService.ts:17 inMemoryEvidenceStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Memo
src/services/mastery/stepEvidencePersistenceService.ts:18 evidenceLookupByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/stepEvidencePersistenceService.ts:43 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/stepEvidencePersistenceService.ts:69 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/stepEvidencePersistenceService.ts:79 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mastery/weakSkillTrackingService.ts:9 weakSkillStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/masteryInferenceService.ts:106 positiveSignals (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/masteryInferenceService.ts:121 negativeSignals (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/masteryService.ts:26 masteryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/masteryService.ts:27 masteryLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/masteryService.ts:28 masteryLookupBySkill (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/masteryService.ts:52 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mediaAssetService.ts:174 MEDIA_ASSET_KINDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mediaAssetService.ts:189 CORE_MEDIA_ASSET_KIND_SET (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mediaAssetService.ts:763 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mediaAssetService.ts:805 practiceActions (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mediaCollectionService.ts:371 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/metacognitionService.ts:132 counts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/misconceptionService.ts:16 misconceptionStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/misconceptionService.ts:17 misconceptionLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/misconceptionService.ts:41 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/mistakePatternAggregationService.ts:42 patternMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/modeExitSummaryService.ts:79 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/modeExitSummaryService.ts:115 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/modeExitSummaryService.ts:116 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/nextPracticeService.ts:31 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/noAiBypassModuleScanner.ts:85 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/noAiBypassModuleScanner.ts:96 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/noAiBypassPrivacyGuard.ts:3 forbiddenFieldSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/noAiBypassRouteRegistry.ts:3 routeRegistry (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/personalizationPromptComposer.ts:105 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceCalibrationService.ts:265 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceMismatchDetectionService.ts:211 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:25 observations (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:26 calibrations (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:27 mismatches (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:28 microMasterySignals (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:29 recoveryPlans (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryRepository.ts:30 recoveryActionCards (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:14 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:17 allLearnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:65 topicMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:69 learners (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:153 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ConfidenceRecoveryTeacherOverviewService.ts:183 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedAuditService.ts:17 auditStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3DailyLearningFeedLearnerResponseService.ts:152 refs (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedRankingService.ts:112 itemsByObjective (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedService.ts:71 objectiveIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedService.ts:261 completedSteps (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedTeacherOverviewService.ts:85 actions (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedTeacherOverviewService.ts:130 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyLearningFeedTeacherOverviewService.ts:156 refs (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckAttemptService.ts:45 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckAttemptService.ts:46 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckAttemptService.ts:47 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckCompletionService.ts:40 idempotencyStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3DailyObjectiveCheckCompletionService.ts:841 completed (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:61 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:62 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:63 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:64 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:65 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:66 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:67 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:193 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:196 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:199 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:805 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckRepository.ts:830 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3DailyObjectiveCheckSessionService.ts:132 completed (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageDailyFeedAdapterService.ts:198 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageDailyFeedAdapterService.ts:208 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageDueNowService.ts:116 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageEvidenceAdapterService.ts:82 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageEvidenceAdapterService.ts:193 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageEvidenceAdapterService.ts:203 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageReadModelService.ts:64 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageReadModelService.ts:65 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageReadModelService.ts:242 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:31 growthPageStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:32 dueNowStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:33 dueNowByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:34 weakTopicStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:35 weakTopicByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:36 mistakeStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:37 mistakeByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:38 helpProfileStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:39 auditStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3GrowthPageRepository.ts:73 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:117 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageRepository.ts:161 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageStudyPlanAdapterService.ts:236 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageStudyPlanAdapterService.ts:246 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:112 topicMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:155 ids (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:215 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:242 objectiveIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:243 learners (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3GrowthPageTeacherOverviewService.ts:248 safeEvidenceRefs (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3HealthyChallengeParticipationService.ts:80 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3HealthyChallengeService.ts:115 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3LivingRevisionRepository.ts:29 nodes (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3LivingRevisionRepository.ts:30 edges (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3LivingRevisionRepository.ts:31 dueItems (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3LivingRevisionRepository.ts:355 revisionGraphs (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3MicroMasterySignalService.ts:235 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3MistakeJournalReadModelService.ts:157 merged (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3MistakeJournalReadModelService.ts:164 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveEvidenceBridgeService.ts:59 evidenceIdempotencyStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveEvidenceBridgeService.ts:672 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveMasteryService.ts:23 masteryStatusStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveMasteryService.ts:24 statusByContext (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveMasteryService.ts:176 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveMasteryService.ts:284 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:45 objectiveStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:46 blueprintStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:47 snapshotStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:48 bridgeResultStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:49 auditStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:50 seedStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ObjectiveRepository.ts:51 objectivesBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:52 objectivesByClass (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:53 objectivesByTeacher (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:54 blueprintsByObjective (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:55 snapshotsByObjectiveAndLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:56 seedsByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:145 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:149 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:154 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ObjectiveRepository.ts:483 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentNotificationPolicyService.ts:443 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentNotificationPreferenceService.ts:114 enabledTypes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentNotificationQueueService.ts:97 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentProgressSummaryService.ts:355 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:53 parentLearnerLinkStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:54 visibilityDecisionStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:55 safeProgressSummaryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:56 notificationPreferenceStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:57 notificationDecisionStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:58 notificationCardStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3ParentSupportRepository.ts:61 linksByParent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:62 linksByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:63 summariesByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:64 summariesByParent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:65 notifDecisionsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:66 notifDecisionsByParent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:67 notifCardsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:68 notifCardsByParent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:69 summariesBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:70 notifCardsBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportRepository.ts:75 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportTeacherOverviewService.ts:28 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportTeacherOverviewService.ts:132 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportTeacherOverviewService.ts:169 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportTeacherOverviewService.ts:198 learnerIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3ParentSupportTeacherOverviewService.ts:222 actionCounts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerHighlightModerationService.ts:115 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerHighlightService.ts:86 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerHighlightService.ts:124 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:61 peerGroupStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:62 groupMembershipStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:63 visibilityDecisionStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:64 moderationDecisionStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:65 resourceShareStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:66 resourceReviewItemStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:67 highlightStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:68 highlightReviewItemStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:69 healthyChallengeStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:70 healthyChallengeParticipationStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/phase3PeerLearningRepository.ts:73 groupsBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:74 groupsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:75 groupsByTeacher (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:76 membershipsByGroup (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:77 membershipsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:78 visibilityDecisionsByContent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:79 resourcesByGroup (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:80 resourcesByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:81 resourcesBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:82 reviewItemsByResource (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:83 reviewItemsBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:84 highlightsByGroup (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:85 highlightsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:86 highlightsBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:87 highlightReviewItemsByHighlight (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:88 highlightReviewItemsBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:89 challengesByGroup (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:90 challengesBySchool (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:91 participationsByLearner (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:92 participationsByChallenge (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:97 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerLearningRepository.ts:167 groupIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerResourceReviewQueueService.ts:115 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerResourceSharingService.ts:92 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3PeerResourceSharingService.ts:133 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionDueResolverService.ts:36 statuses (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionDueResolverService.ts:361 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionEdgeService.ts:148 objectiveGroups (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionEdgeService.ts:177 topicGroups (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionEdgeService.ts:238 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionEvidenceAdapterService.ts:30 forbiddenSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionEvidenceAdapterService.ts:49 forbiddenSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNodeService.ts:277 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:75 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:86 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:143 learnerSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:157 nodeIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:169 existingEdges (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:266 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:277 limitedIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:304 map (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionNoteGraphService.ts:319 set (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionTeacherOverviewService.ts:21 learnerMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionTeacherOverviewService.ts:30 topicMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionTeacherOverviewService.ts:33 learners (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionTeacherOverviewService.ts:72 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3RevisionTeacherOverviewService.ts:261 map (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3WeakTopicRecoveryActionService.ts:221 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3WeakTopicRecoveryPlannerService.ts:231 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/phase3WhatHelpsMeLearnBestService.ts:78 actions (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceAttemptService.ts:33 attemptStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/practiceAttemptService.ts:34 attemptLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceAttemptService.ts:58 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceMasteryValidation.ts:82 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceRepetitionGuard.ts:37 skillCount (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceRepetitionGuard.ts:38 sourceCount (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceRepetitionGuard.ts:98 recentSkillIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/practiceSessionPlanService.ts:70 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/prerequisiteMapService.ts:24 allPrereqs (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/privacySafeRedactionService.ts:6 FORBIDDEN_FIELDS_LOWER (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryEvidenceProcessor.ts:305 supersededIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryEvidenceProcessor.ts:312 seen (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryEvidenceProcessor.ts:450 existingSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPolicy.ts:4 excluded (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:32 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:62 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:65 seenResult (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:108 visited (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:109 recStack (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryPrerequisiteReader.ts:127 allNodes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryRepository.ts:33 VALID_TARGET_NODE_TYPES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryRepository.ts:34 VALID_VISIBLE_LABELS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryRepository.ts:530 states (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/probabilisticMasteryRepository.ts:532 appliedEvidence (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/quizModePrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/recapGenerationService.ts:338 inFlightByKey (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=inFlight
src/services/recapGenerationService.ts:339 cacheByKey (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=cache
src/services/recommendationInteractionRepository.ts:107 store (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=store
src/services/recommendationWeightingPolicyService.ts:128 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/recommendationWeightingPolicyService.ts:129 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/repeatedWeaknessPatternService.ts:33 patternMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/researchModeService.ts:72 dedupe (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/researchModeService.ts:144 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:81 APPLICATION_CUE_TAGS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:90 PROCEDURE_CUE_CONTENT_TYPES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:98 PROCEDURE_CUE_SAVE_TYPES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:105 TITLE_STOP_WORDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:202 labelByKey (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:204 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:255 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:284 rightSet (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:384 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:451 focusTagFrequency (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:634 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:635 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:686 linksBySourceId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:687 generatedAtBySourceId (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionGraphService.ts:725 map (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionLearningService.ts:230 COMMON_STOP_WORDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionLearningService.ts:384 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionLearningService.ts:1210 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionLearningService.ts:1224 mediaKinds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionNormalizationService.ts:351 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionQueueService.ts:31 revisionQueueStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/revisionQueueService.ts:32 learnerQueueMap (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionQueueService.ts:306 byMistakeType (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionService.ts:373 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionService.ts:1423 graphItemById (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/revisionService.ts:1424 collectionPreviewById (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/rosterSyncDryRunService.ts:13 seenStudentIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/rosterSyncDryRunService.ts:39 seenTeacherIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/rosterSyncDryRunService.ts:65 seenClassIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/rosterSyncDryRunService.ts:91 seenSubjectIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceLearnerViewService.ts:29 strongSubjects (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceLearnerViewService.ts:30 weakSubjects (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidencePrivacyGuard.ts:3 forbiddenFieldSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceRepository.ts:20 evidenceStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/safeLearningEvidenceRepository.ts:21 evidenceByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceRepository.ts:22 evidenceByIdempotency (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceRepository.ts:23 aggregateStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/safeLearningEvidenceRepository.ts:24 growthProofStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/safeLearningEvidenceRepository.ts:25 growthProofByStudent (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceRepository.ts:26 auditStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/safeLearningEvidenceRepository.ts:91 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeLearningEvidenceRepository.ts:180 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/safeMemorySummaryService.ts:67 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/safeMemorySummaryService.ts:260 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/safeMemorySummaryService.ts:267 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/safeMemorySummaryService.ts:274 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/safeMemorySummaryService.ts:281 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=context
src/services/schoolIdentityConflictDetectionService.ts:33 externalUserMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/schoolIdentityConflictDetectionService.ts:34 tutorCandidateMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/schoolIdentityConflictDetectionService.ts:52 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticLearningControlService.ts:348 moves (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticLearningControlService.ts:380 moves (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticLearningEvidenceBridgeService.ts:53 _adapters (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyIntegrationService.ts:147 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyIntegrationService.ts:148 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyIntegrationService.ts:286 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyIntegrationService.ts:289 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyPacketBuilder.ts:74 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyPacketBuilder.ts:75 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticRuntimePolicyPacketBuilder.ts:76 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticTutorAutomationPolicyService.ts:185 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/socraticTutorAutomationPolicyService.ts:186 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/sourceTrustService.ts:194 seenIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/sourceTrustService.ts:204 seenUnsupported (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/spacedReviewService.ts:19 reviewStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/spacedReviewService.ts:20 reviewLookupByKey (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/spacedReviewService.ts:21 reviewDedupeKey (Map) | module | REQUEST_COALESCING_OR_INFLIGHT | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:98 subjectMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:144 strongTopics (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:145 weakTopics (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:146 developingTopics (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:261 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:262 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:263 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:381 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningProfileService.ts:387 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningSessionEvidenceBridge.ts:11 bridgedEvidence (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studentLearningSessionPrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:629 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:764 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:1121 canonicalTopicKeys (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:1163 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:1501 progressById (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/studySupportService.ts:1737 subjectStats (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportLevelConsistencyService.ts:296 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportPatternInferenceService.ts:52 hintCountByLevel (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportPatternInferenceService.ts:53 recoveryAfterHintByLevel (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportPatternInferenceService.ts:54 hintEffectiveMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportPatternInferenceService.ts:98 supportActionMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/supportPatternInferenceService.ts:156 hintLevelCount (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task017ConversationIdempotencyService.ts:7 inProgressStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task018AdminDiagnosticsScopePolicyService.ts:15 ADMIN_ROLES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task018AdminDiagnosticsScopePolicyService.ts:16 INTERNAL_ROLES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task018AdminDiagnosticsScopePolicyService.ts:18 PUBLIC_SAFE_ROUTES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task018ComponentHealthMonitorService.ts:33 checkRegistry (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task018SafeIncidentSummaryService.ts:83 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task019RetryStormGuardService.ts:18 memoryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=memo
src/services/task020ExportRequestFoundationService.ts:6 EXPORT_BLOCKED_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020ExportRequestFoundationService.ts:11 EXPORT_METADATA_ONLY_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020PrivacyBoundaryEnforcementService.ts:14 ALWAYS_REDACT_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SafeguardingAccessSeparationService.ts:47 SERIOUS_RISK_TRIGGERS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SafeguardingAccessSeparationService.ts:58 NOT_SAFEGUARDING_TRIGGERS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:21 dataClassifications (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:22 roleAccessDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:23 privacyBoundaryDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:24 aiEgressDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:25 retentionPolicyDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:26 exportRequests (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:27 deleteRequests (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:28 teacherVisibilityDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:29 safeguardingAccessDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:30 deenSensitiveDataDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:31 securityConfigValidations (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020SecurityPrivacyGovernanceRepository.ts:32 governanceAuditEvents (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task020TeacherVisibilityPolicyService.ts:41 TEACHER_FORBIDDEN_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021ClassEnrollmentScopeService.ts:24 enrollmentStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021ClassEnrollmentScopeService.ts:25 classStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021RoleScopeVerificationService.ts:10 STUDENT_SELF_SCOPED_OPERATIONS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:17 TEACHER_SCOPED_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:26 ADMIN_INTERNAL_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:34 SAFEGUARDING_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:40 student (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:51 teacher (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:61 school_admin (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:73 safeguarding_officer (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:79 system_admin (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:88 internal_operator (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RoleScopeVerificationService.ts:94 unknown (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021RosterSyncRuntime.ts:44 syncJobStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021SchoolIdentityMappingService.ts:27 identityCache (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Cache
src/services/task021SchoolIdentityMappingService.ts:304 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationIdempotencyService.ts:18 idempotencyCache (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Cache
src/services/task021SchoolIntegrationRepository.ts:30 externalIdentities (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:31 internalIdentities (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:32 identityMappings (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:33 rosterRecords (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:34 rosterSyncBatches (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:35 rosterReconciliationResults (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:36 teacherAssignments (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationRepository.ts:37 parentLearnerLinks (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationTokenValidationService.ts:9 VALID_SCHOOL_ISSUERS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SchoolIntegrationTokenValidationService.ts:10 VALID_SCHOOL_AUDIENCES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SubjectEnrollmentScopeService.ts:20 subjectStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021SubjectEnrollmentScopeService.ts:21 subjectEnrollmentStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021SubjectEnrollmentScopeService.ts:133 subjectIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021SubjectEnrollmentScopeService.ts:143 subjectIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021TeacherAssignmentScopeService.ts:15 assignmentStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task021TeacherAssignmentScopeService.ts:118 studentIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task021TeacherAssignmentScopeService.ts:133 classIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ApprovedSourceRegistryService.ts:4 sources (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ApprovedSourceRegistryService.ts:5 familySources (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ApprovedSourceRegistryService.ts:6 schoolSources (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ApprovedSourceRegistryService.ts:7 categorySources (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ContentGapDetectionService.ts:7 gaps (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ContentGapDetectionService.ts:110 summary (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ContentItemGovernanceService.ts:4 items (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022ContentRetrievalService.ts:41 sourceIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:26 approvedSources (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:27 sourceApprovalRequests (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:28 sourceApprovalDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:29 curriculumRegistryEntries (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:30 curriculumVersions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:31 contentItems (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:32 topicSkillObjectiveMaps (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:33 learningObjectiveGovernanceRecords (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:34 prerequisiteMapEntries (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:35 contentGovernanceDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:36 contentGroundingDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:37 contentGapDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:38 contentRetrievalResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:39 curriculumImportDryRunResults (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:40 cambridgeAcademicContentDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:41 madrasaDeenContentDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:42 deenSourcePolicyDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:43 tutorChallengeRemediationContentDecisions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:44 contentGovernanceDiagnostics (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumGovernanceRepository.ts:45 contentGovernanceAuditEvents (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:19 families (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:20 schoolActivations (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:21 subjects (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:22 stages (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:23 topics (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:24 skills (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:25 objectives (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:26 prerequisites (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRegistryService.ts:34 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRetrievalService.ts:62 topicIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumRetrievalService.ts:63 skillIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022CurriculumVersioningService.ts:9 versions (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022LearningObjectiveGovernanceService.ts:4 objectives (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022LearningObjectiveGovernanceService.ts:5 familyObjectives (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:16 maps (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:17 objectiveToTopic (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:18 skillToObjective (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:19 prerequisiteToObjective (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:20 prerequisiteEntryDetails (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:77 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:99 <anonymous> (Map) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillObjectivePrerequisiteMapService.ts:177 topicIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:4 topicToSkills (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:5 skillToPrerequisites (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:6 skillToObjectives (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:7 skillDetails (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:8 topicDetails (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:9 objectiveDetails (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task022TopicSkillPrerequisiteMapService.ts:10 prerequisiteLinks (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task023MigrationSafetyChecker.ts:60 seenDangerous (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task023MigrationSafetyChecker.ts:61 seenSafe (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task024IncidentClassificationService.ts:68 STUDENT_SAFETY_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task024IncidentClassificationService.ts:70 PRIVACY_RELEVANT_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task024IncidentClassificationService.ts:72 DEEN_GOVERNANCE_RELEVANT_CATEGORIES (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task024ReportService.ts:113 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task024SafeTelemetryService.ts:11 FORBIDDEN_FIELDS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task025PilotReadinessService.ts:253 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task025PilotReadinessService.ts:254 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task025PilotReadinessService.ts:257 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task025ReadinessDecisionService.ts:187 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task026PostPilotReviewService.ts:99 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task026PostPilotReviewService.ts:100 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027ExpansionEvidencePackService.ts:33 reviewMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027ExpansionEvidencePackService.ts:150 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027ExpansionEvidencePackService.ts:171 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027GovernanceDecisionService.ts:46 reviewTypesPresent (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027GovernanceDecisionService.ts:141 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027GovernanceDiagnosticsService.ts:14 reviewTypes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027GovernanceDiagnosticsService.ts:89 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027PilotExpansionCohortChangeService.ts:74 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027PilotExpansionDecisionService.ts:135 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027PilotExpansionReviewService.ts:86 presentTypes (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task027PilotExpansionRiskAssessmentService.ts:158 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task030NoLiveStudentGuardService.ts:144 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task031CanaryReadinessDecisionService.ts:106 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task031NoLiveStudentGuardService.ts:127 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task031SafeEvidenceLedgerService.ts:6 ledgerStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/task031SmokeRunStateMachineService.ts:47 runs (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task031SmokeRunStateMachineService.ts:111 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/task040SafetyScanService.ts:61 files (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teachBackModePrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherInterventionAuditRedactionService.ts:77 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeInsightNoiseFilter.ts:55 seen (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeInsightPrivacyGuard.ts:7 FORBIDDEN_SET (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeSummaryRuntimeService.ts:159 needs (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeSummaryRuntimeService.ts:173 strengths (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeSummaryRuntimeService.ts:187 students (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeSummaryRuntimeService.ts:197 students (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/teacherSafeWeakTopicClusterService.ts:41 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorActionPrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorLearnerMappingService.ts:18 existingMappings (Map) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorOrchestration/learningResponsePlanner.ts:193 merged (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorStatePatchService.ts:67 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorStateService.ts:48 memoryStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=memo
src/services/tutorStateService.ts:104 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorStateSnapshotService.ts:36 snapshotStore (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=Store
src/services/tutorTurnPolicy/responseBoundaryService.ts:86 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorTurnPolicy/responseBoundaryService.ts:87 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorTurnPolicy/responseBoundaryService.ts:88 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorTurnPolicy/responseBoundaryService.ts:90 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/tutorTurnRuntimeModeRouter.ts:7 VALID_DISPATCH_TARGETS (Set) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=context
src/services/tutorTurnRuntimePrivacyGuard.ts:3 forbiddenSet (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoAwareMisconceptionService.ts:52 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoAwarePracticeGenerator.ts:53 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoChatTriggerService.ts:25 VIDEO_AVOID_INTENTS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoEffectivenessScoringService.ts:85 uniqueStudents (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoEffectivenessScoringService.ts:89 studentEngagement (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoLearningAnalyticsAggregationService.ts:115 videoMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoLearningAnalyticsAggregationService.ts:125 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoLearningSessionStateService.ts:40 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoLearningSessionStateService.ts:243 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoMetadataService.ts:18 providerAdapters (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoPolicyService.ts:35 profiles (Map) | class | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoRecommendationExplanationService.ts:124 <anonymous> (Set) | unknown | UNKNOWN | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoWeaknessLoopDetectionService.ts:32 counts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/videoWeaknessLoopDetectionService.ts:93 bySkill (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/vimeoCreativeSourceAdapter.ts:35 ADAPTER_CACHE (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=CACHE
src/services/voiceLedgerService.ts:70 DEV_BOOTSTRAP_STUDENTS (Set) | module | PRODUCTION_PROCESS_LOCAL_CANDIDATE | runtimeState.mapSetAllocations; cacheSignal=none
src/services/voiceLedgerService.ts:84 allowed (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakAreaAggregationService.ts:48 grouped (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakAreaAggregationService.ts:59 evidenceKinds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakTopicDetectionService.ts:36 topicSignals (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakTopicDetectionService.ts:37 topicAttempts (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakTopicDetectionService.ts:53 allTopicIds (Set) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/weakTopicDetectionService.ts:140 topicMap (Map) | function | ALGORITHM_LOCAL_TEMPORARY | runtimeState.mapSetAllocations; cacheSignal=none
src/services/youtubeCreativeSourceAdapter.ts:54 ADAPTER_CACHE (Map) | module | MODULE_CACHE | runtimeState.mapSetAllocations; cacheSignal=CACHE
src/tests/ai-runtime-retry-policy.test.ts:28 unique (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/artifact-r3-structured-understanding.test.ts:199 <anonymous> (Set) | unknown | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/direct-chat-source-citation-safety.test.ts:174 allowedSources (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/learner-transparency-contracts.test.ts:87 allForbidden (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/phase3-living-revision-deen-boundary.contract.test.ts:12 forbiddenSet (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/query-efficiency-inspection-service.test.ts:79 categories (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/query-efficiency-inspection-service.test.ts:91 serviceNames (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-016-test-helpers.ts:3 inMemoryStore (Map) | module | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=Memo
src/tests/task-017-no-ai-bypass-route-registry.test.ts:12 <anonymous> (Set) | unknown | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-017-runtime-error-mapper.test.ts:43 messages (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:18 curriculumVersionRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:19 curriculumTopicRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:20 curriculumSkillRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:21 learningObjectiveRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:22 prerequisiteLinkRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:23 approvedSourceRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:24 contentItemRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:25 contentGapRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:26 contentGovernanceAuditRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-022-real-prisma-test-helpers.ts:27 contentReviewRecord (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-024-incident-audit-service.test.ts:157 allowed (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-025-forbidden-fields.contract.test.ts:287 allForbidden (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-026-forbidden-fields.contract.test.ts:79 set (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-026-no-production-mutation.contract.test.ts:42 set (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-029-incident-operations-service.test.ts:173 byId (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-029-routes-parent-denied.contract.test.ts:20 uniqueSet (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-036-canonical-routes.test.ts:68 <anonymous> (Set) | unknown | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-036-forbidden-future-task.test.ts:25 unique (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-036-forbidden-output-fields.test.ts:67 unique (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-036-forbidden-side-effects.test.ts:31 unique (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-036-runner-smoke.test.ts:23 ids (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/task-r1-keyed-create.atomic.test.ts:97 uniqueIds (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/teacher-intervention-repository.test.ts:6 store (Map) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=store
src/tests/tutor-action-contracts.test.ts:15 unique (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/vitest-setup.ts:9 sessionStateStore (Map) | module | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/tests/vitest-setup.ts:10 sessionEventStore (Map) | module | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=Store
src/tests/vitest-setup.ts:38 txCreatedStateIds (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/vitest-setup.ts:39 txCreatedEventIds (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none
src/tests/vitest-setup.ts:40 txUpdatedStateIds (Set) | function | TEST_STATE | runtimeState.mapSetAllocations; cacheSignal=none

State-class totals: PRODUCTION_PROCESS_LOCAL_CANDIDATE=637, ALGORITHM_LOCAL_TEMPORARY=309, UNKNOWN=177, TEST_STATE=48, MODULE_CACHE=74, REQUEST_COALESCING_OR_INFLIGHT=1.
Function-scope allocations are algorithm-local temporaries and confer no state ownership. Only module/class-scope owners are meaningful for the matrix above.

## Raw SQL / Runtime DDL Ownership

Occurrence | Kind | Class | Evidence
--- | --- | --- | ---
src/r5-canonical-closure.test.ts:24 $executeRawUnsafe [StudentProfile] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:39 $executeRawUnsafe [CurriculumVersionRecord] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:43 $executeRawUnsafe [CurriculumTopicRecord] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:47 $executeRawUnsafe [CurriculumSkillRecord] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:51 $executeRawUnsafe [LearningObjectiveRecord] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:60 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:68 $executeRawUnsafe [RevisionGuidedStepRecord, RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:69 $executeRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:70 $executeRawUnsafe [RevisionSourceSignalReceipt] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:71 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:72 $executeRawUnsafe [RevisionCollection] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:74 $executeRawUnsafe [LearningObjectiveRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:75 $executeRawUnsafe [CurriculumSkillRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:76 $executeRawUnsafe [CurriculumTopicRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:77 $executeRawUnsafe [CurriculumVersionRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:79 $executeRawUnsafe [LearningEvidenceEvent] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:80 $executeRawUnsafe [LearningEvidenceIdempotency] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:81 $executeRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:82 $executeRawUnsafe [LearningEvidenceCandidateProjection] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:83 $executeRawUnsafe [LearningEvidenceStream] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:84 $executeRawUnsafe [RevisionReviewEvent] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:128 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:134 $queryRawUnsafe [LearningEvidenceCandidateProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:148 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:184 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:191 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:252 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:258 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:265 $queryRawUnsafe [RevisionReviewEvent] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:272 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:317 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:327 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:333 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:354 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:362 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:368 $queryRawUnsafe [RevisionReviewEvent] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:374 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:410 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:417 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:422 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:439 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:445 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:465 $queryRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:490 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:502 $queryRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:508 $queryRawUnsafe [RevisionReviewEvent] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:522 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:531 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:547 $queryRawUnsafe [CommittedLearningEvidenceProjection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:553 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-canonical-closure.test.ts:559 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:29 $executeRawUnsafe [StudentProfile] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:38 $executeRawUnsafe [RevisionGuidedStepRecord, RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:39 $executeRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:40 $executeRawUnsafe [RevisionSourceSignalReceipt] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:41 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:42 $executeRawUnsafe [RevisionCollection] | UNSAFE_RAW_SQL_USAGE QK_DELETE | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:55 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:83 $queryRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:97 $executeRawUnsafe [RevisionCollection] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:101 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:106 $queryRawUnsafe [RevisionItem, RevisionCollection] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:136 $queryRawUnsafe [RevisionSourceSignalReceipt] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:162 $queryRawUnsafe [RevisionSourceSignalReceipt] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:208 $executeRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE INSERT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:215 $queryRawUnsafe [RevisionItem] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:235 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:266 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:296 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:398 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:463 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:469 $queryRawUnsafe [RevisionGuidedStepRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r5-revision-runtime-completion.test.ts:494 $queryRawUnsafe [RevisionGuidedSessionRecord] | UNSAFE_RAW_SQL_USAGE SELECT | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:196 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:197 $queryRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:415 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:775 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:844 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:868 $queryRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/r6-learning-intelligence-integration.test.ts:884 $queryRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | TEST_PROOF | 01 prisma.rawSql[]
src/routes/ai.ts:773 $queryRawUnsafe [ChatMessage, ChatSession] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/routes/ai.ts:819 $queryRawUnsafe [ChatMessage, ChatSession] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/routes/ai.ts:3556 $executeRawUnsafe [CopilotPreferences] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/routes/ai.ts:3568 $queryRawUnsafe [CopilotPreferences] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/routes/ai.ts:3577 $executeRawUnsafe [CopilotPreferences] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/artifactCurriculumReferenceService.ts:17 $queryRaw [no table] | RAW_SQL_USAGE SELECT | UNRESOLVED | 01 prisma.rawSql[]
src/services/artifactCurriculumReferenceService.ts:80 $queryRawUnsafe [CurriculumTopicRecord] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/artifactCurriculumReferenceService.ts:93 $queryRawUnsafe [CurriculumSkillRecord] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/artifactCurriculumReferenceService.ts:104 $queryRawUnsafe [LearningObjectiveRecord] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/artifactService.ts:41 $queryRaw [no table] | RAW_SQL_USAGE SELECT | UNRESOLVED | 01 prisma.rawSql[]
src/services/artifactStructuredRepository.ts:47 $queryRaw [no table] | RAW_SQL_USAGE SELECT | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:965 $queryRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:974 $queryRawUnsafe [AssessmentQuestion] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:981 $queryRawUnsafe [AssessmentAttempt] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:990 $queryRawUnsafe [AssessmentResult] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1004 $queryRawUnsafe [AssessmentQuestion] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1019 $executeRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1046 $executeRawUnsafe [AssessmentEvent] | UNSAFE_RAW_SQL_USAGE INSERT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1131 $executeRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1146 $executeRawUnsafe [AssessmentQuestion] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1204 $queryRawUnsafe [AssessmentAttempt] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1280 $executeRawUnsafe [AssessmentResult, SET] | UNSAFE_RAW_SQL_USAGE INSERT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1318 $executeRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1329 $executeRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE UPDATE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1442 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1469 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1494 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1512 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1525 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1547 $executeRawUnsafe [IF] | UNSAFE_RAW_SQL_USAGE  | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1559 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1560 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1561 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1562 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1563 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1564 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1565 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1566 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1567 $executeRawUnsafe [no table] | UNSAFE_RAW_SQL_USAGE  | UNRESOLVED | 01 prisma.rawSql[]
src/services/assessmentSessionService.ts:1697 $queryRawUnsafe [AssessmentSession] | UNSAFE_RAW_SQL_USAGE SELECT | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.rawSql[]
_… 344 further raw-SQL occurrences share the same per-file classification; full list retained in 01 inventory._

src/contracts/task033ControlledCanaryObservationContracts.ts:637 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task034ControlledLimitedRolloutContracts.ts:797 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task036LiveSchoolLaunchContracts.ts:776 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task036LiveSchoolLaunchContracts.ts:777 TRUNCATE (TRUNCATE TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task040BackendFreezeContracts.ts:140 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task040BackendFreezeContracts.ts:141 TRUNCATE (TRUNCATE TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task040BackendFreezeContracts.ts:156 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/contracts/task040BackendFreezeContracts.ts:157 TRUNCATE (TRUNCATE TABLE') | DDL_IN_RUNTIME_SOURCE | CONTRACT_ALLOWLIST_STRING | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:515 CREATE TABLE (revisionLearningService has no CREATE TABLE or ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:520 CREATE TABLE (CREATE TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:520 ALTER TABLE (ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:520 CREATE INDEX (CREATE INDEX') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:526 CREATE TABLE (revisionService has no CREATE TABLE or ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:531 CREATE TABLE (CREATE TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:531 ALTER TABLE (ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:531 CREATE INDEX (CREATE INDEX') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:537 CREATE TABLE (revisionGraphService has no CREATE TABLE or ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:542 CREATE TABLE (CREATE TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:542 ALTER TABLE (ALTER TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:542 CREATE INDEX (CREATE INDEX') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:620 CREATE TABLE (migration uses CREATE TABLE IF NOT EXISTS for RevisionNoteLi) | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:625 CREATE TABLE (CREATE TABLE IF NOT EXISTS "RevisionNoteLink"') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r5-revision-runtime-completion.test.ts:626 CREATE UNIQUE INDEX (CREATE UNIQUE INDEX IF NOT EXISTS') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/r6-learning-intelligence-integration.test.ts:826 ALTER TABLE (growth + study plan requests issue no CREATE/ALTER TABLE or ) | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/routes/ai.ts:3556 ALTER TABLE (`ALTER TABLE "CopilotPreferences" ADD COLUMN IF NOT EXISTS ") | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/routes/ai.ts:3557 ALTER TABLE (ALTER TABLE "CopilotPreferences" ADD COLUMN IF NOT EXISTS "m) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1442 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentSession" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1442 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentSession" ( ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1469 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentQuestion" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1469 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentQuestion" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1494 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentAttempt" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1494 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentAttempt" ( ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1512 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentFlag" (   ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1512 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentFlag" (    ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1525 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentResult" ( ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1525 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentResult" (  ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1547 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "AssessmentEvent" (  ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1547 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "AssessmentEvent" (   ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1559 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_update) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1559 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_updated) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1560 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_status) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1560 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_status_) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1561 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_posi) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1561 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_posit) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1562 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_stat) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1562 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_statu) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1563 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentAttempt_session_quest) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1563 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentAttempt_session_questi) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1564 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentFlag_session_question) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1564 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentFlag_session_question_) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1565 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentResult_userId_complet) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1565 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentResult_userId_complete) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1566 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentEvent_userId_createdA) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1566 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentEvent_userId_createdAt) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1567 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "AssessmentEvent_session_stage_i) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/assessmentSessionService.ts:1567 CREATE INDEX (CREATE INDEX IF NOT EXISTS "AssessmentEvent_session_stage_id) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:196 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "LearningEffectEvent" ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:196 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "LearningEffectEvent" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:211 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_crea) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:211 CREATE INDEX (CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_creat) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:212 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_even) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:212 CREATE INDEX (CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_event) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:213 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_sessionId_c) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:213 CREATE INDEX (CREATE INDEX IF NOT EXISTS "LearningEffectEvent_sessionId_cr) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:214 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_revisionIte) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/learningEffectivenessService.ts:214 CREATE INDEX (CREATE INDEX IF NOT EXISTS "LearningEffectEvent_revisionItem) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:341 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "MediaAsset" (         ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:341 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "MediaAsset" (          ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:371 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_upda) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:371 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_updat) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:375 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_asse) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:375 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_asset) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:379 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_topi) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:379 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaAsset_userId_topic) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:383 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaAsset_revisionIte) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:383 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaAsset_revisionItem) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:387 CREATE UNIQUE INDEX (`         CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_user) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaAssetService.ts:387 CREATE UNIQUE INDEX (         CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_userI) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:116 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "MediaCollection" (    ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:116 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "MediaCollection" (     ) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:129 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaCollection_userId) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:129 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaCollection_userId_) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:133 CREATE INDEX (`         CREATE INDEX IF NOT EXISTS "MediaCollection_userId) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/mediaCollectionService.ts:133 CREATE INDEX (         CREATE INDEX IF NOT EXISTS "MediaCollection_userId_) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:157 CREATE TABLE (`         CREATE TABLE IF NOT EXISTS "MetacognitiveEvent" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:157 CREATE TABLE (         CREATE TABLE IF NOT EXISTS "MetacognitiveEvent" () | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:175 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_userId_creat) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:175 CREATE INDEX (CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_userId_create) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:176 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sessionId_cr) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:176 CREATE INDEX (CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sessionId_cre) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:177 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_revisionItem) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:177 CREATE INDEX (CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_revisionItemI) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:178 CREATE INDEX (`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sourceMessag) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/metacognitionService.ts:178 CREATE INDEX (CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sourceMessage) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/practiceCanonicalLearningService.ts:71 CREATE TABLE (   CREATE TABLE IF NOT EXISTS "PracticeCanonicalIdempotency") | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/practiceCanonicalLearningService.ts:89 CREATE UNIQUE INDEX (`CREATE UNIQUE INDEX IF NOT EXISTS "PracticeCanonicalIdempot) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/practiceCanonicalLearningService.ts:90 CREATE UNIQUE INDEX (CREATE UNIQUE INDEX IF NOT EXISTS "PracticeCanonicalIdempote) | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:6 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:8 TRUNCATE (TRUNCATE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:10 ALTER TABLE (ALTER TABLE ... DROP') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:11 DROP INDEX (DROP INDEX') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:17 CREATE TABLE (CREATE TABLE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:18 ALTER TABLE (ALTER TABLE ADD COLUMN') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:19 CREATE INDEX (CREATE INDEX') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:20 CREATE UNIQUE INDEX (CREATE UNIQUE INDEX') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023MigrationSafetyChecker.ts:21 ALTER TABLE (ALTER TABLE ALTER COLUMN') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task023ReleaseSmokeTestHarness.ts:157 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task040SafetyScanService.ts:110 DROP TABLE (DROP TABLE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/services/task040SafetyScanService.ts:110 TRUNCATE (TRUNCATE TABLE') | DDL_IN_RUNTIME_SOURCE | OWNERSHIP_REVIEW_REQUIRED | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/explanation-privacy-guard.contract.test.ts:185 TRUNCATE (redactUnsafeExplanationText should truncate long text') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-011-privacy-safety.contract.test.ts:67 TRUNCATE (should truncate unsafe draft to safe summary length') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-023-deployment-readiness-contracts.test.ts:128 CREATE TABLE (CREATE TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-023-no-destructive-migration-command.contract.test.ts:27 TRUNCATE (TRUNCATE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-024-no-destructive-backup-restore-command.contract.test.ts:54 TRUNCATE (truncate') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-024-no-destructive-backup-restore-command.contract.test.ts:62 TRUNCATE (truncate') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-024-no-destructive-backup-restore-command.contract.test.ts:76 TRUNCATE (truncate') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-024-no-destructive-backup-restore-command.contract.test.ts:106 TRUNCATE (route file does not contain TRUNCATE statements') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-024-no-destructive-backup-restore-command.contract.test.ts:116 DROP TABLE (route file does not contain QK_DELETE FROM or DROP TABLE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-027-no-production-mutation.contract.test.ts:25 DROP TABLE (governance files do not contain DROP TABLE or DROP DATABASE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
src/tests/task-027-no-production-mutation.contract.test.ts:34 TRUNCATE (governance files do not contain QK_DELETE FROM or TRUNCATE') | DDL_IN_RUNTIME_SOURCE | TEST_PROOF | 01 prisma.runtimeDdlCandidates[]; string-literal occurrence only, execution not proven
_… 23 further DDL-string occurrences share the same classification; full list retained in 01 inventory._

Legend: `QK_DELETE` denotes the SQL write verb observed verbatim in 01 `prisma.rawSql[].queryKind`; it is evidence, not a disposition. No raw-SQL or DDL-string occurrence is rewritten or relocated in R8-B.

## Unresolved Data Ownership

- Families without a production writer: `assessment` (2 models), `unclassified` (42 models)
- Models without a production writer: 297 of 436
  - `AnswerKeyVersionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[AnswerKeyVersionRecord]`
  - `ApprovedSourceRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[ApprovedSourceRecord]`
  - `ContentGapRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[ContentGapRecord]`
  - `ContentGovernanceAuditRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[ContentGovernanceAuditRecord]`
  - `ContentItemRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[ContentItemRecord]`
  - `ContentReviewRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ContentReviewRecord]`
  - `CurriculumSkillRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[CurriculumSkillRecord]`
  - `CurriculumTopicRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[CurriculumTopicRecord]`
  - `CurriculumVersionRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[CurriculumVersionRecord]`
  - `ExamAccessPolicyRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAccessPolicyRecord]`
  - `ExamAnswerSubmissionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAnswerSubmissionRecord]`
  - `ExamAttemptQuestionSnapshotRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAttemptQuestionSnapshotRecord]`
  - `ExamAttemptRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAttemptRecord]`
  - `ExamAttemptSubmissionSnapshotRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAttemptSubmissionSnapshotRecord]`
  - `ExamAttemptTimingEventRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamAttemptTimingEventRecord]`
  - `ExamBlueprintRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamBlueprintRecord]`
  - `ExamBlueprintRequirementRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamBlueprintRequirementRecord]`
  - `ExamBlueprintVersionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamBlueprintVersionRecord]`
  - `ExamDeliveryAuditRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDeliveryAuditRecord]`
  - `ExamDeliveryIdempotencyRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDeliveryIdempotencyRecord]`
  - `ExamDeliverySessionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDeliverySessionRecord]`
  - `ExamDeliverySessionStateRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDeliverySessionStateRecord]`
  - `ExamDraftQuestionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDraftQuestionRecord]`
  - `ExamDraftRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDraftRecord]`
  - `ExamDraftSetRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamDraftSetRecord]`
  - `ExamPaperApprovalRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamPaperApprovalRecord]`
  - `ExamPaperDeliveryBridgeRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamPaperDeliveryBridgeRecord]`
  - `ExamVariantAssignmentRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamVariantAssignmentRecord]`
  - `ExamVariantQuestionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamVariantQuestionRecord]`
  - `ExamVariantRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ExamVariantRecord]`
  - `FollowUpAuditRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[FollowUpAuditRecord]`
  - `FollowUpEscalationPlanRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[FollowUpEscalationPlanRecord]`
  - `FollowUpIdempotencyRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[FollowUpIdempotencyRecord]`
  - `FollowUpReviewWindowRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[FollowUpReviewWindowRecord]`
  - `FollowUpSummaryRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[FollowUpSummaryRecord]`
  - `GlobalMemory`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GlobalMemory]`
  - `GrowthMasteryTrendState`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GrowthMasteryTrendState]`
  - `GrowthMistakePatternState`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GrowthMistakePatternState]`
  - `GrowthProofRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GrowthProofRecord]`
  - `GrowthRecommendationState`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GrowthRecommendationState]`
  - `GrowthWeakTopicState`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[GrowthWeakTopicState]`
  - `InterventionEffectEvent`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[InterventionEffectEvent]`
  - `LearningObjectiveRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[LearningObjectiveRecord]`
  - `MarkingBatchItemRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingBatchItemRecord]`
  - `MarkingBatchRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingBatchRecord]`
  - `MarkingBreakdownItemRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingBreakdownItemRecord]`
  - `MarkingDispatchAuditRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingDispatchAuditRecord]`
  - `MarkingInvocationIdempotencyRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingInvocationIdempotencyRecord]`
  - `MarkingInvocationRequestRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingInvocationRequestRecord]`
  - `MarkingReadinessCheckRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingReadinessCheckRecord]`
  - `MarkingResultLinkRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingResultLinkRecord]`
  - `MarkingResultVersionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingResultVersionRecord]`
  - `MarkingRunRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MarkingRunRecord]`
  - `MediaAsset`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[MediaAsset]`
  - `ModerationDecisionRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ModerationDecisionRecord]`
  - `OpsBackupCheck`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsBackupCheck]`
  - `OpsIncident`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsIncident]`
  - `OpsIncidentAudit`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsIncidentAudit]`
  - `OpsMetricSnapshot`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsMetricSnapshot]`
  - `OpsReport`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsReport]`
  - `OpsRestoreDrill`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[OpsRestoreDrill]`
  - `ParentGuidanceDraftRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[ParentGuidanceDraftRecord]`
  - `PilotExecutionAuditRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExecutionAuditRecord]`
  - `PilotExecutionEvent`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExecutionEvent]`
  - `PilotExecutionRun`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExecutionRun]`
  - `PilotExpansionApproval`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionApproval]`
  - `PilotExpansionAuditRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionAuditRecord]`
  - `PilotExpansionCohortChange`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionCohortChange]`
  - `PilotExpansionEvidencePack`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionEvidencePack]`
  - `PilotExpansionProposal`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionProposal]`
  - `PilotExpansionReport`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionReport]`
  - `PilotExpansionReview`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionReview]`
  - `PilotExpansionRiskAssessment`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotExpansionRiskAssessment]`
  - `PilotFeedbackRecord`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotFeedbackRecord]`
  - `PilotPostPilotReview`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotPostPilotReview]`
  - `PilotRuntimeMetricSnapshot`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotRuntimeMetricSnapshot]`
  - `PilotSafetySignal`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PilotSafetySignal]`
  - `PracticeAttempt`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PracticeAttempt]`
  - `PracticeMisconceptionSignal`: No R8-A modelWriterGroups entry for this model. Evidence: `01 prisma.modelWriterGroups[PracticeMisconceptionSignal]`
  - `PrerequisiteLinkRecord`: Writer evidence is TEST_PROOF only; no production writer identified. Evidence: `01 prisma.modelWriterGroups[PrerequisiteLinkRecord]`
  - _… 217 further models; full list in Canonical Writers table above._
- Models with no writer-group entry at all: 282 (`AnswerKeyVersionRecord`, `ContentReviewRecord`, `ExamAccessPolicyRecord`, `ExamAnswerSubmissionRecord`, `ExamAttemptQuestionSnapshotRecord`, `ExamAttemptRecord`, `ExamAttemptSubmissionSnapshotRecord`, `ExamAttemptTimingEventRecord`, `ExamBlueprintRecord`, `ExamBlueprintRequirementRecord`, `ExamBlueprintVersionRecord`, `ExamDeliveryAuditRecord`, `ExamDeliveryIdempotencyRecord`, `ExamDeliverySessionRecord`, `ExamDeliverySessionStateRecord`, `ExamDraftQuestionRecord`, `ExamDraftRecord`, `ExamDraftSetRecord`, `ExamPaperApprovalRecord`, `ExamPaperDeliveryBridgeRecord`, …)

## R8-A Findings Requiring Later Engineering Review

Code | Count | Later review relevance
--- | --- | ---
UNREACHABLE_SOURCE_CANDIDATE | 3328 | auxiliary/test surface; no runtime claim
BROAD_OR_SWALLOWED_CATCH_CANDIDATE | 1790 | failure-handling signal surfaced per capability where provable
PROOF_OR_TEST_IN_RUNTIME_ROOT_CANDIDATE | 831 | test/proof placement signal; no file action in R8-B
LEGACY_OR_COMPATIBILITY_CANDIDATE | 790 | legacy/transitional path signals; classification only
DIRECT_PRISMA_ACCESS_CANDIDATE | 784 | input to per-family access classification
DUPLICATE_DECLARATION_CANDIDATE | 463 | type-level duplication signal; no semantic verdict
UNSAFE_RAW_SQL_USAGE | 431 | input to Raw SQL ownership (unsafe API shape)
MODULE_SCOPE_MAP_SET | 288 | input to Runtime State Ownership
SILENT_CATCH | 230 | failure-handling signal surfaced per capability where provable
UNBOUNDED_PRISMA_QUERY_CANDIDATE | 196 | scale signal for later pagination review, not R8-B scope
DDL_IN_RUNTIME_SOURCE | 143 | input to Runtime DDL ownership (string-literal occurrences)
LARGE_MODULE | 94 | size signal only; no split decision in R8-B
UNBOUNDED_RAW_SELECT_CANDIDATE | 61 | scale signal for later review, not R8-B scope
MULTIPLE_MODEL_WRITERS_CANDIDATE | 37 | input to Shared / Multiple Writer Candidates
DUPLICATE_SERVICE_CANDIDATE | 36 | service-name grouping signal; classification only
RAW_SQL_USAGE | 33 | input to Raw SQL ownership
DUPLICATE_REPOSITORY_CANDIDATE | 25 | repository-name grouping signal; classification only
AI_CALL_CANDIDATE | 12 | AI-touch inventory for Voice/External section
EXTERNAL_PROVIDER_USAGE | 9 | provider-touch inventory for Voice/External section
UNMOUNTED_ROUTE_CANDIDATE | 9 | route-module accounting in Logic Register
NON_LITERAL_DYNAMIC_DEPENDENCY | 8 | static-analysis blind spot; reachability caveat
SHARED_MOUNT_PREFIX_CANDIDATE | 6 | shared prefixes are by-design mount layering (see register)
DEPENDENCY_CYCLE | 5 | 5 cycles; reachability classification in Logic Register
UNRESOLVED_INTERNAL_IMPORT | 1 | sole unresolved import; identify only (see Logic Register gap notes)

Total findings carried as evidence (no dispositions): 9610.

## R8-G.3A Ownership Reconciliation (2026-09-12, HEAD a0a3feac1e545f383a36f4b7bf73c1635ce61154)

> SUPERSEDED BY R8-G.3A FINAL RECONCILIATION (final section at end of this document). The intermediate verdicts below — in particular the `DEFECT_PROCESS_LOCAL_CANONICAL` rows for Tutor State Snapshots/History, Living Revision, Approved Source, Content Gap, Moderation Decision, and Governance Audit — were repaired by the accepted R8-G.3A commits D1 `4f0a6d2`, D1C `449d17b`, D2 `bcf9fb4`, D2C `7b2e404` and are historical evidence, not current truth.

Append-only. One verdict per target state object (R8-G.3A §9). No UNKNOWN for active production-critical state.

| CAPABILITY | STATE | VERDICT | CANONICAL OWNER | RESTART BEHAVIOR | PROOF |
| --- | --- | --- | --- | --- | --- |
| Tutor Handoff | identity mapping + copilot session | DURABLE_CANONICAL | Prisma TutorLearnerIdentityMap + TutorSession (via copilotHandoffService/tutorSessionContinuityService) | survives restart | route→service→Prisma chain, no Map (r8g3a trace; r8g-handoff-mount-guard accepted test) |
| Tutor Actions | decision/hint-ladder/effectiveness | DERIVED_VIEW / REQUEST_EPHEMERAL | none (pure compute per request) | stateless; nothing to lose | explicit not-persisted envelopes in route; no Prisma models |
| Tutor State | learner tutor state | DURABLE_CANONICAL (repaired) | Prisma TutorState row (tutorStateService, strict fail-closed default) | survives restart; DB-down writes/reads throw | r8g3a-tutor-state-durability.test.ts (4 tests) |
| Tutor State Snapshots/History | v1 snapshots | DEFECT_PROCESS_LOCAL_CANONICAL | none (snapshotStore Map) | lost on restart | source inspection; CONTRADICTION (no schema; architecture decision) |
| Tutor Turn | turn orchestration + telemetry | REQUEST_EPHEMERAL + CACHE_ONLY | none (per-request compute; telemetry array) | telemetry lost; safely recomputed | no repository; no Prisma models |
| Tutor Conversation | session state + events | DURABLE_CANONICAL | Prisma StudentLearningSessionState/Event (raw SQL) + R8-F chatMessageRepository | survives restart | chain inspection; idempotency Map is CACHE_ONLY (loss → safe retry) |
| Growth | growth page view | DERIVED_VIEW | canonical mastery/evidence (via DailyFeed/StudyPlan/Evidence adapters) | recomputed; snapshot Map is CACHE_ONLY | r8g3a-growth-derived-view.test.ts (3 tests); GAP-mastery-growth-writers PROVEN NOT A GAP for this path |
| Living Revision | nodes/edges/due/graphs/audit | DEFECT_PROCESS_LOCAL_CANONICAL | none (phase3LivingRevisionRepository Maps) | total loss on restart | r8g3a-revision-durability-defect.test.ts (defect lock); CONTRADICTION (no suitable schema) |
| Study Planning | plans + goals | DURABLE_CANONICAL | Prisma StudyPlan/StudyGoal rows (studySupportService) | survives restart | r8g3a-studyplan-durable-canonical.test.ts (2 tests); priorities endpoint DERIVED_VIEW |
| MediaAsset | asset metadata | DURABLE_CANONICAL | mediaAssetService (Prisma) | survives restart | r8g3a-media-ownership.test.ts; video routes proven non-owners |
| Video Learning Session | session/progress/checkpoints | DURABLE_CANONICAL | TutorState row videoLearningSession object + LearningEvent mirror | survives restart (inherits TutorState repair) | chain via videoLearningSessionStateService→tutorStateService |
| Video Learning Analytics | aggregates/scores | DERIVED_VIEW | durable VideoLearningAnalyticsEvent entries in TutorState row (bounded 200) | recomputed from events | aggregation/scoring pure; no metric persistence invented |
| Approved Source | approval state | DEFECT_PROCESS_LOCAL_CANONICAL | none durable (ApprovedSourceRegistryService Map; Prisma repo exists, unwired) | lost on restart; fail-closed (unknown = not approved) | r8g3a-governance-failclosed.test.ts; CONTRADICTION (composition redesign required) |
| Content Gap | gap records | DEFECT_PROCESS_LOCAL_CANONICAL | none durable (Map; Prisma repo exists, unwired) | lost; every unknown re-derives as gap (fail-closed) | defect lock test; CONTRADICTION |
| Moderation Decision | moderation outcomes | DEFECT_PROCESS_LOCAL_CANONICAL (default composition) | Prisma repo exists (prismaMarkingRepositories), default InMemory | lost on restart in default composition | defect lock; CONTRADICTION |
| Governance Audit | audit trail | DEFECT_PROCESS_LOCAL_CANONICAL | none durable (records array; Prisma repo exists, unwired) | lost on restart; decisions do not gate on audit success | defect lock; CONTRADICTION |

Provenance: 6 surfaces restored as ACCEPTED_PROVENANCE_OMISSION (62-file union); 4 surfaces stopped as provenance CONTRADICTION (tutorState 30, tutorStateEndpoint 39, tutorConversation 148, phase3GrowthPageRoutes 33 untracked value-closure files each).

## R8-G.3A FINAL RECONCILIATION (2026-09-13, HEAD 7b2e4047cf9f3a1ecd82afed73255021f35e2a3b)

Authoritative final ownership truth for the six R8-G.3A families. This section supersedes all intermediate verdicts above (including every `DEFECT_PROCESS_LOCAL_CANONICAL` row in the 2026-09-12 table, repaired by D1/D1C/D2/D2C: commits `4f0a6d2`, `449d17b`, `bcf9fb4`, `7b2e404`). Exactly ONE verdict per state object. Allowed verdict enum: `DURABLE_CANONICAL` | `DURABLE_EVENT` | `DERIVED_VIEW` | `CACHE_ONLY` | `REQUEST_EPHEMERAL` | `PREPARATION_EPHEMERAL_BY_DESIGN` | `NOT_ACTIVE`. No UNKNOWN, MAYBE, PARTIAL, or DEFECT_PROCESS_LOCAL_CANONICAL verdict remains for the accepted final R8-G.3A state.

| STATE | FINAL VERDICT | CANONICAL OWNER | RESTART BEHAVIOR | PROOF |
| --- | --- | --- | --- | --- |
| Tutor Handoff | DURABLE_CANONICAL | Prisma `TutorLearnerIdentityMap` + `TutorSession` (copilotHandoffService / tutorSessionContinuityService) | survives restart | r8g3a initial chain trace (`7988716`); no Map on canonical path |
| Tutor Actions | REQUEST_EPHEMERAL | none (pure per-request decision/hint-envelope compute); durable effects belong to Tutor State / Conversation / Learning Evidence owners | stateless; nothing to lose | `7988716` trace; no TutorAction persistence table invented |
| Tutor State | DURABLE_CANONICAL | Prisma `TutorState` row (`tutorStateService`, fail-closed production default) | survives restart; DB-down reads/writes throw | `r8g3a-tutor-state-durability.test.ts` (4 tests) |
| Tutor State Snapshots / History | DURABLE_CANONICAL | Prisma `TutorStateSnapshotRecord` (D1) | survives restart; restart-proven | D1 real-PostgreSQL suite 10/10 (`r8g3a-d1-snapshot-revision-durability-prisma.test.ts`) |
| Tutor Turn | REQUEST_EPHEMERAL | none (per-request orchestration); telemetry array CACHE_ONLY | telemetry lost and safely recomputed | `7988716` trace; no TutorTurn persistence invented |
| Tutor Conversation | DURABLE_CANONICAL | Prisma `StudentLearningSessionState`/`Event` (raw SQL) + R8-F `chatMessageRepository` | survives restart | `7988716` chain inspection; idempotency Map CACHE_ONLY (loss → safe retry) |
| Growth Page | DERIVED_VIEW | canonical mastery / learning evidence / study+support signals via DailyFeed, StudyPlan, Evidence adapters | recomputed; snapshot Map CACHE_ONLY | `r8g3a-growth-derived-view.test.ts` (3 tests); GAP-mastery-growth-writers PROVEN NOT A GAP |
| Revision Nodes | DURABLE_CANONICAL | Prisma `Phase3RevisionNodeRecord` (D1) | survives restart; restart-proven | D1 real-PostgreSQL suite 10/10 |
| Revision Edges | DURABLE_CANONICAL | Prisma `Phase3RevisionEdgeRecord` (transactional edge/count maintenance) | survives restart | D1 real-PostgreSQL suite 10/10 |
| Revision Due State | DURABLE_CANONICAL | Prisma `Phase3RevisionDueItemRecord` | survives restart | D1 real-PostgreSQL suite 10/10 |
| Revision Audit | DURABLE_EVENT | Prisma `Phase3RevisionAuditRecord` (append-only, awaited) | survives restart | D1 real-PostgreSQL suite 10/10 |
| Revision Graph | DERIVED_VIEW | derived from durable nodes + edges + due state (no graph table; none invented) | recomputed | D1/D1C; `r8g3a-revision-durability-defect.test.ts` durability lock |
| Study Plans / Goals | DURABLE_CANONICAL | Prisma `StudyPlan`/`StudyGoal` rows (`studySupportService`) | survives restart | `r8g3a-studyplan-durable-canonical.test.ts` (2 tests) |
| Study Priority View | DERIVED_VIEW | recomputed from durable plans/goals (`GET /priorities`) | recomputed | `r8g3a-studyplan-durable-canonical.test.ts` |
| MediaAsset | DURABLE_CANONICAL | `mediaAssetService` / Prisma `MediaAsset` | survives restart | `r8g3a-media-ownership.test.ts`; video routes proven non-owners |
| Video Learning Session | DURABLE_CANONICAL | TutorState row `videoLearningSession` object + established `LearningEvent` mirror | survives restart (inherits TutorState fail-closed repair) | `7988716` chain via videoLearningSessionStateService → tutorStateService |
| Video Learning Analytics | DERIVED_VIEW | computed from durable event/session inputs (bounded 200-event store; pure aggregation/scoring) | recomputed | `r8g3a-media-ownership.test.ts`; no metric persistence invented |
| ApprovedSourceRecord | DURABLE_CANONICAL | `PrismaApprovedSourceRepository` (D2); memory sink is explicit `CONTENT_GOVERNANCE_ALLOW_MEMORY_FALLBACK=1` opt-in only, overridable by `CONTENT_GOVERNANCE_REQUIRE_DURABLE=1` | survives restart; failed durable reads fail closed | D2 real-PostgreSQL suite final run 16/16; composition lock |
| ContentGapRecord | DURABLE_CANONICAL | `PrismaContentGapRepository` (D2); pure decision logic preserved, logical gap key preserved | survives restart | D2 real-PostgreSQL suite final run 16/16 |
| ModerationDecisionRecord | DURABLE_CANONICAL | `PrismaModerationDecisionRepository`; `new ModerationService()` default composition is Prisma with NO environment-controlled memory fallback (D2C removed `ASSESSMENT_MODERATION_ALLOW_MEMORY`); memory only via explicit constructor injection | survives restart | D2C composition lock 8/8 + package-5 teacher review/moderation 11/11 |
| ContentGovernanceAuditRecord | DURABLE_EVENT | `PrismaContentGovernanceAuditRepository` (append-only; required audits awaited; audit failure never reports successful governance completion) | survives restart | D2 real-PostgreSQL suite final run 16/16 |

Final gap statuses (no UNKNOWN, no PARTIALLY RESOLVED, no active CONTRADICTION remains for these six ownership/durability gaps):

- GAP-tutorcore-persistence-unresolved → RESOLVED
- GAP-mastery-growth-writers → PROVEN NOT A GAP (growth-page path)
- GAP-revision-writer-durability-unknown → RESOLVED
- GAP-studyplanning-ownership-unknown → RESOLVED
- GAP-media-writer-unknown → RESOLVED
- GAP-safety-audit-writers → RESOLVED

Accepted durability evidence — PREVIOUSLY EXECUTED / REUSED ACCEPTED EVIDENCE, not rerun by final reconciliation: D1 (`4f0a6d2`) 10/10 real PostgreSQL first run; D1C (`449d17b`) 16/16 focused/strict-history + 1/1 real-PostgreSQL HTTP production-route proof; D2 (`bcf9fb4`) 16/16 real PostgreSQL final run (run 1 15/16 was a test-expectation defect, not production); D2C (`7b2e404`) composition lock 8/8 + package-5 teacher review/moderation 11/11.

Provenance (R8-G.4 compile/provenance input — NOT an ownership verdict): `src/routes/tutorState.ts`, `src/routes/tutorStateEndpoint.ts`, `src/routes/tutorConversation.ts`, `src/routes/phase3GrowthPageRoutes.ts` remain Git-untracked while directly imported by `src/index.ts` (verified 2026-09-13: `git ls-files` empty for all four; import sites src/index.ts:12-13,36,584). These do not reopen any of the six ownership/durability gaps.

