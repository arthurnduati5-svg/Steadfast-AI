# Backend Runtime Route Map

STATIC STRUCTURAL EVIDENCE — NOT RUNTIME EXECUTION PROOF

Static route composition below is derived from TypeScript AST analysis.
Effective paths are reported only when the mount and the endpoint are
both statically resolvable. Anything else is listed as a candidate.

## Baseline

- Scanner version: 1.0.0
- Source fingerprint: sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0
- Generated at: 2026-09-08T17:43:59.064Z
- Git branch: main
- Git head: 87df12783eb0283d4b24963879f8a632b315e8cf

## Direct Runtime Mounts

mount path | router | source | middleware | line
--- | --- | --- | --- | ---
/api/health | healthRoutes | src/index.ts | — | 171
/api | readinessRoutes | src/index.ts | — | 172
/api/copilot/latency | latencyRoutes | src/index.ts | schoolAuthMiddleware | 174
/api/copilot/anomalies | anomalyRoutes | src/index.ts | schoolAuthMiddleware | 175
/api/copilot/tutor-state | tutorStateRoutes | src/index.ts | schoolAuthMiddleware | 176
/api/copilot/tutor-state | tutorStateV2Routes | src/index.ts | schoolAuthMiddleware | 177
/api/copilot/artifacts | artifactRoutes | src/index.ts | schoolAuthMiddleware | 178
/api/copilot/learner-memory | learnerMemoryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 179
/api/copilot/practice-mastery | practiceMasteryRoutes | src/index.ts | schoolAuthMiddleware | 180
/api/copilot/intent | intentResolverRoutes | src/index.ts | schoolAuthMiddleware | 181
/api/copilot/chat-pipeline | chatPipelineRoutes | src/index.ts | schoolAuthMiddleware | 182
/api/copilot/live-chat | liveChatRoutes | src/index.ts | schoolAuthMiddleware | 183
/api/copilot | videoRecommendationRoutes | src/index.ts | schoolAuthMiddleware | 184
/api/copilot | videoLearningSessionRoutes | src/index.ts | schoolAuthMiddleware | 185
/api/copilot | videoAwarePracticeRoutes | src/index.ts | schoolAuthMiddleware | 186
/api/video-learning-analytics | videoLearningAnalyticsRoutes | src/index.ts | schoolAuthMiddleware | 187
/api | teacherInterventionRoutes | src/index.ts | schoolAuthMiddleware | 188
/api | teacherReportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 189
/api/copilot/artifacts | artifactAwarePracticeRoutes | src/index.ts | schoolAuthMiddleware | 190
/api/copilot | aiRoutes | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware | 191
/api/voice | voiceRoutes | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware | 192
/api/copilot/growth | growthAggregateRoutes | src/index.ts | schoolAuthMiddleware | 193
/api | profileRoutes | src/index.ts | schoolAuthMiddleware | 194
/api/learner | learnerRecommendationRoutes | src/index.ts | schoolAuthMiddleware | 195
/api/learner | learnerPreferenceRoutes | src/index.ts | schoolAuthMiddleware | 196
/api/copilot | copilotHandoffRoutes | src/index.ts | — | 197
/api/copilot | tutorPolicyEvaluateRoutes | src/index.ts | schoolAuthMiddleware | 198
/api/copilot | tutorSafeChatRoutes | src/index.ts | schoolAuthMiddleware | 199
/api/learner | learnerSessionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 200
/api/tutor | tutorConversationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 201
/api/learner | adaptiveChallengeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 202
/api/copilot/learning-sessions | studentLearningSessionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 203
/api/ops | opsPublicRouter | src/index.ts | — | 204
/api/ops/diagnostics | task018DiagnosticsRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 205
/api/admin/rate-limits | rateLimitAdminRoutes | src/index.ts | schoolAuthMiddleware | 206
/api/governance | privacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 207
/api/task020/security-privacy-governance | task020SecurityPrivacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 208
/api/learner | privacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 209
/api | schoolIntegrationRoutes | src/index.ts | schoolAuthMiddleware | 210
/api/task021/school-integration | task021SchoolIntegrationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 211
/api/content-governance | contentGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 213
/api/task022/curriculum-governance | task022CurriculumContentGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 214
/api | deploymentReadinessRoutes | src/index.ts | — | 217
/api/task023/deployment-readiness | task023DeploymentReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 220
/api | task024OperationsRoutes | src/index.ts | — | 229
/api/task024/operations-readiness | task024OperationsReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 233
/api | task025PilotRoutes | src/index.ts | schoolAuthMiddleware | 242
/api/task025/pilot-readiness | task025ControlledPilotReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 245
/api | task026PilotExecutionRoutes | src/index.ts | schoolAuthMiddleware | 254
/api | task027PilotExpansionRoutes | src/index.ts | schoolAuthMiddleware | 258
/api/task027/pilot-expansion-governance | task027PilotExpansionGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 261
/api | task028ExpansionExecutionRoutes | src/index.ts | schoolAuthMiddleware | 270
/api/task028/controlled-expansion-execution | task028ControlledExpansionExecutionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 273
/api | task029ExpansionOperationsRoutes | src/index.ts | schoolAuthMiddleware | 282
/api/task030/controlled-staging-rehearsal | task030ControlledStagingRehearsalRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 286
/api/task031/staging-smoke-canary-readiness | task031StagingSmokeCanaryReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 295
/api/task032/controlled-canary-activation | task032ControlledCanaryActivationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 304
/api/task033/controlled-canary-observation | task033ControlledCanaryObservationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 313
/api/task034/controlled-limited-rollout | task034ControlledLimitedRolloutRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 322
/api/task035/school-wide-readiness | task035SchoolWideReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 331
/api/task036/live-school-launch | task036LiveSchoolLaunchRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 341
/api/task040/backend-freeze | task040BackendFreezeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 351
/api/question-bank | questionBankRoutes | src/index.ts | schoolAuthMiddleware | 360
/api/question-bank | examBlueprintRoutes | src/index.ts | schoolAuthMiddleware | 364
/api/question-bank/marking | composedMarkingRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 380
/api/question-bank/exam-papers | composedExamPaperRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 384
/api/question-bank/exam-delivery | examDeliveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 388
/api/question-bank/marking-invocation | composedMarkingInvocationRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 398
/api/question-bank/result-governance | resultGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 402
/api/question-bank/result-learning-evidence | resultLearningEvidenceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 406
/api/question-bank/result-release | resultReleaseRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 410
/api/question-bank/result-delivery | resultDeliveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 414
/api/question-bank/result-report-cards | resultReportCardRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 418
/api/question-bank/result-report-card-export | resultReportCardExportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 422
/api/question-bank/result-report-card-access | resultReportCardAccessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 426
/api/question-bank/result-follow-up | resultFollowUpRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 430
/api/question-bank/result-recovery | resultRecoveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 434
/api/question-bank/recovery-progress | recoveryProgressRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 438
/api/question-bank/recovery-outcome | recoveryOutcomeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 442
/api/question-bank/recovery-outcome-action | recoveryOutcomeActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 446
/api/question-bank/recovery-outcome-execution-simulation | recoveryOutcomeExecutionSimulationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 450
/api/question-bank/recovery-lifecycle-closure | composedRecoveryLifecycleClosureRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 454
/api/question-bank/recovery-execution-authorization-preview | recoveryExecutionAuthorizationPreviewRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 458
/api/question-bank/recovery-execution-readiness-board | composedRecoveryExecutionReadinessBoardRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 479
/api/question-bank/recovery-case-triage | recoveryCaseTriageRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 483
/api/question-bank/recovery-case-adjudication | composedRecoveryCaseAdjudicationRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 503
/api | learningModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 506
/api/copilot | learningProfileRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 507
/api/copilot/tutor-actions | tutorActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 510
/api/copilot/focus-mode | focusModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 513
/api/copilot/exam-mode | examModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 516
/api/copilot/quiz-mode | quizModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 519
/api/copilot/teach-back-mode | teachBackModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 522
/api/copilot/revision-mode | revisionModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 526
/api/copilot/growth | growthActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 530
/api/copilot/tutor-turn | tutorTurnRuntimeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 534
/api/copilot/learning-evidence | safeLearningEvidenceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 538
/api/copilot/evidence | createLearningEvidenceRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 545
/api/copilot/teacher-insights | teacherSafeInsightRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 549
/api/copilot/learner-transparency | learnerTransparencyRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 553
/api/copilot/adaptive-recommendations | adaptiveRecommendationTuningRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 557
/api/copilot/adaptive-challenges | adaptiveChallengeTask015Routes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 562
/api/copilot/remediation | remediationTask015Routes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 563
/api/copilot/no-ai-bypass | noAiBypassAuditRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 565
/api/phase3/objectives | phase3ObjectiveMasteryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 569
/api/phase3/daily-objective-checks | phase3DailyObjectiveCheckRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 573
/api/phase3/daily-learning-feed | phase3DailyLearningFeedRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 577
/api/phase3/study-plans | phase3StudyPlanRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 581
/api/phase3/growth-page | phase3GrowthPageRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 585
/api/phase3/living-revision | phase3LivingRevisionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 589
/api/phase3/confidence-recovery | phase3ConfidenceRecoveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 593
/api/phase3/parent-support | phase3ParentSupportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 597
/api/phase3/peer-learning | phase3PeerLearningRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 601
/ | preferencesMemoryRouter | src/routes/ai.ts | — | 204
/ | voiceQuotaRouter | src/routes/ai.ts | — | 205
/ | safetyRouter | src/routes/ai.ts | — | 206
/ | researchRouter | src/routes/ai.ts | — | 207
/ | studyRouter | src/routes/ai.ts | — | 208
/ | growthRouter | src/routes/ai.ts | — | 209
/ | assessmentRouter | src/routes/ai.ts | — | 210
/ | mediaRouter | src/routes/ai.ts | — | 211
/ | revisionRouter | src/routes/ai.ts | — | 212
/api/copilot/learner-memory | learnerMemoryRoutes | src/tests/learner-memory-r2-repair.test.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 39
/api/copilot/evidence | createLearningEvidenceRouter | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-cross-learner-denial.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-cross-school-denial.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-peer-denied-routes.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-activation-lifecycle.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-cohort-eligibility.contract.test.ts | — | 11
/api/task-032 | task032Router | src/tests/task-032-routes-config.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-consent-authorization.contract.test.ts | — | 11
/api/task-032 | task032Router | src/tests/task-032-routes-control-action.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-dependency.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-diagnostics.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-environment-preflight.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-health-budget.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-health.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-incident-bridge.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-privacy-boundary.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-report.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-runtime-guard.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-safe-view.contract.test.ts | — | 10
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cap-check.contract.test.ts | — | 24
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cohort-eligibility.contract.test.ts | — | 26
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-content-governance-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cross-school-denial-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-deen-boundary-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-dependency.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-diagnostics.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-environment-preflight.contract.test.ts | — | 33
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-event-intake.contract.test.ts | — | 32
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-evidence.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-health-budget.contract.test.ts | — | 26
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-health.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-incident-escalation.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-learner-notice-readiness.contract.test.ts | — | 27
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-limited-rollout-config.contract.test.ts | — | 31
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-post-limited-rollout-decision.contract.test.ts | — | 28
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-privacy-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-report.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-rollback-protection.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-runtime-guard.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-safe-view.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-school-identity-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-session-lifecycle.contract.test.ts | — | 21
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-socratic-integrity-review.contract.test.ts | — | 13
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-staff-readiness.contract.test.ts | — | 25

## Effective Endpoints

method | effective path | route source | mount source | middleware
--- | --- | --- | --- | ---
_none statically resolvable_

## Factory / Composition Mounts

mount | factory/router | source | resolution note
--- | --- | --- | ---
/api/question-bank/marking | composedMarkingRouter | src/index.ts:380 | router factory call; effective endpoints not composed
/api/question-bank/exam-papers | composedExamPaperRouter | src/index.ts:384 | router factory call; effective endpoints not composed
/api/question-bank/marking-invocation | composedMarkingInvocationRouter | src/index.ts:398 | router factory call; effective endpoints not composed
/api/question-bank/recovery-lifecycle-closure | composedRecoveryLifecycleClosureRouter | src/index.ts:454 | router factory call; effective endpoints not composed
/api/question-bank/recovery-execution-readiness-board | composedRecoveryExecutionReadinessBoardRouter | src/index.ts:479 | router factory call; effective endpoints not composed
/api/question-bank/recovery-case-adjudication | composedRecoveryCaseAdjudicationRouter | src/index.ts:503 | router factory call; effective endpoints not composed
/api/copilot/evidence | createLearningEvidenceRouter | src/index.ts:545 | router factory call; effective endpoints not composed
/api/copilot/evidence | createLearningEvidenceRouter | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:9 | router factory call; effective endpoints not composed

## Duplicate Exact Route Candidates

_none_

## Shared Mount-Prefix Candidates

- `/api`
  - src/index.ts:172 (router readinessRoutes at /api)
  - src/index.ts:188 (router teacherInterventionRoutes at /api)
  - src/index.ts:189 (router teacherReportRoutes at /api)
  - src/index.ts:194 (router profileRoutes at /api)
  - src/index.ts:210 (router schoolIntegrationRoutes at /api)
  - src/index.ts:217 (router deploymentReadinessRoutes at /api)
  - src/index.ts:229 (router task024OperationsRoutes at /api)
  - src/index.ts:242 (router task025PilotRoutes at /api)
  - src/index.ts:254 (router task026PilotExecutionRoutes at /api)
  - src/index.ts:258 (router task027PilotExpansionRoutes at /api)
  - src/index.ts:270 (router task028ExpansionExecutionRoutes at /api)
  - src/index.ts:282 (router task029ExpansionOperationsRoutes at /api)
  - src/index.ts:506 (router learningModeRoutes at /api)
- `/api/copilot`
  - src/index.ts:174 (router latencyRoutes at /api/copilot/latency)
  - src/index.ts:175 (router anomalyRoutes at /api/copilot/anomalies)
  - src/index.ts:176 (router tutorStateRoutes at /api/copilot/tutor-state)
  - src/index.ts:177 (router tutorStateV2Routes at /api/copilot/tutor-state)
  - src/index.ts:178 (router artifactRoutes at /api/copilot/artifacts)
  - src/index.ts:179 (router learnerMemoryRoutes at /api/copilot/learner-memory)
  - src/index.ts:180 (router practiceMasteryRoutes at /api/copilot/practice-mastery)
  - src/index.ts:181 (router intentResolverRoutes at /api/copilot/intent)
  - src/index.ts:182 (router chatPipelineRoutes at /api/copilot/chat-pipeline)
  - src/index.ts:183 (router liveChatRoutes at /api/copilot/live-chat)
  - src/index.ts:184 (router videoRecommendationRoutes at /api/copilot)
  - src/index.ts:185 (router videoLearningSessionRoutes at /api/copilot)
  - src/index.ts:186 (router videoAwarePracticeRoutes at /api/copilot)
  - src/index.ts:190 (router artifactAwarePracticeRoutes at /api/copilot/artifacts)
  - src/index.ts:191 (router aiRoutes at /api/copilot)
  - src/index.ts:193 (router growthAggregateRoutes at /api/copilot/growth)
  - src/index.ts:197 (router copilotHandoffRoutes at /api/copilot)
  - src/index.ts:198 (router tutorPolicyEvaluateRoutes at /api/copilot)
  - src/index.ts:199 (router tutorSafeChatRoutes at /api/copilot)
  - src/index.ts:203 (router studentLearningSessionRoutes at /api/copilot/learning-sessions)
  - src/index.ts:507 (router learningProfileRoutes at /api/copilot)
  - src/index.ts:510 (router tutorActionRoutes at /api/copilot/tutor-actions)
  - src/index.ts:513 (router focusModeRoutes at /api/copilot/focus-mode)
  - src/index.ts:516 (router examModeRoutes at /api/copilot/exam-mode)
  - src/index.ts:519 (router quizModeRoutes at /api/copilot/quiz-mode)
  - src/index.ts:522 (router teachBackModeRoutes at /api/copilot/teach-back-mode)
  - src/index.ts:526 (router revisionModeRoutes at /api/copilot/revision-mode)
  - src/index.ts:530 (router growthActionRoutes at /api/copilot/growth)
  - src/index.ts:534 (router tutorTurnRuntimeRoutes at /api/copilot/tutor-turn)
  - src/index.ts:538 (router safeLearningEvidenceRoutes at /api/copilot/learning-evidence)
  - src/index.ts:545 (router createLearningEvidenceRouter at /api/copilot/evidence)
  - src/index.ts:549 (router teacherSafeInsightRoutes at /api/copilot/teacher-insights)
  - src/index.ts:553 (router learnerTransparencyRoutes at /api/copilot/learner-transparency)
  - src/index.ts:557 (router adaptiveRecommendationTuningRoutes at /api/copilot/adaptive-recommendations)
  - src/index.ts:562 (router adaptiveChallengeTask015Routes at /api/copilot/adaptive-challenges)
  - src/index.ts:563 (router remediationTask015Routes at /api/copilot/remediation)
  - src/index.ts:565 (router noAiBypassAuditRoutes at /api/copilot/no-ai-bypass)
  - src/tests/learner-memory-r2-repair.test.ts:39 (router learnerMemoryRoutes at /api/copilot/learner-memory)
  - src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:9 (router createLearningEvidenceRouter at /api/copilot/evidence)
- `/api/learner`
  - src/index.ts:195 (router learnerRecommendationRoutes at /api/learner)
  - src/index.ts:196 (router learnerPreferenceRoutes at /api/learner)
  - src/index.ts:200 (router learnerSessionRoutes at /api/learner)
  - src/index.ts:202 (router adaptiveChallengeRoutes at /api/learner)
  - src/index.ts:209 (router privacyGovernanceRoutes at /api/learner)
- `/api/ops`
  - src/index.ts:204 (router opsPublicRouter at /api/ops)
  - src/index.ts:205 (router task018DiagnosticsRoutes at /api/ops/diagnostics)
- `/api/phase3`
  - src/index.ts:569 (router phase3ObjectiveMasteryRoutes at /api/phase3/objectives)
  - src/index.ts:573 (router phase3DailyObjectiveCheckRoutes at /api/phase3/daily-objective-checks)
  - src/index.ts:577 (router phase3DailyLearningFeedRoutes at /api/phase3/daily-learning-feed)
  - src/index.ts:581 (router phase3StudyPlanRoutes at /api/phase3/study-plans)
  - src/index.ts:585 (router phase3GrowthPageRoutes at /api/phase3/growth-page)
  - src/index.ts:589 (router phase3LivingRevisionRoutes at /api/phase3/living-revision)
  - src/index.ts:593 (router phase3ConfidenceRecoveryRoutes at /api/phase3/confidence-recovery)
  - src/index.ts:597 (router phase3ParentSupportRoutes at /api/phase3/parent-support)
  - src/index.ts:601 (router phase3PeerLearningRoutes at /api/phase3/peer-learning)
- `/api/question-bank`
  - src/index.ts:360 (router questionBankRoutes at /api/question-bank)
  - src/index.ts:364 (router examBlueprintRoutes at /api/question-bank)
  - src/index.ts:380 (router composedMarkingRouter at /api/question-bank/marking)
  - src/index.ts:384 (router composedExamPaperRouter at /api/question-bank/exam-papers)
  - src/index.ts:388 (router examDeliveryRoutes at /api/question-bank/exam-delivery)
  - src/index.ts:398 (router composedMarkingInvocationRouter at /api/question-bank/marking-invocation)
  - src/index.ts:402 (router resultGovernanceRoutes at /api/question-bank/result-governance)
  - src/index.ts:406 (router resultLearningEvidenceRoutes at /api/question-bank/result-learning-evidence)
  - src/index.ts:410 (router resultReleaseRoutes at /api/question-bank/result-release)
  - src/index.ts:414 (router resultDeliveryRoutes at /api/question-bank/result-delivery)
  - src/index.ts:418 (router resultReportCardRoutes at /api/question-bank/result-report-cards)
  - src/index.ts:422 (router resultReportCardExportRoutes at /api/question-bank/result-report-card-export)
  - src/index.ts:426 (router resultReportCardAccessRoutes at /api/question-bank/result-report-card-access)
  - src/index.ts:430 (router resultFollowUpRoutes at /api/question-bank/result-follow-up)
  - src/index.ts:434 (router resultRecoveryRoutes at /api/question-bank/result-recovery)
  - src/index.ts:438 (router recoveryProgressRoutes at /api/question-bank/recovery-progress)
  - src/index.ts:442 (router recoveryOutcomeRoutes at /api/question-bank/recovery-outcome)
  - src/index.ts:446 (router recoveryOutcomeActionRoutes at /api/question-bank/recovery-outcome-action)
  - src/index.ts:450 (router recoveryOutcomeExecutionSimulationRoutes at /api/question-bank/recovery-outcome-execution-simulation)
  - src/index.ts:454 (router composedRecoveryLifecycleClosureRouter at /api/question-bank/recovery-lifecycle-closure)
  - src/index.ts:458 (router recoveryExecutionAuthorizationPreviewRoutes at /api/question-bank/recovery-execution-authorization-preview)
  - src/index.ts:479 (router composedRecoveryExecutionReadinessBoardRouter at /api/question-bank/recovery-execution-readiness-board)
  - src/index.ts:483 (router recoveryCaseTriageRoutes at /api/question-bank/recovery-case-triage)
  - src/index.ts:503 (router composedRecoveryCaseAdjudicationRouter at /api/question-bank/recovery-case-adjudication)

## Unmounted Route Candidates

- src/domains/curriculum-knowledge-graph/routes/CurriculumGraphRouter.ts
- src/routes/ai-route-segmentation.contract.test.ts
- src/routes/ai.assistant-envelope.contract.test.ts
- src/routes/ai.growth-endpoints.contract.test.ts
- src/routes/ai/ai-chat.routes.ts
- src/routes/ai/ai-route-contracts.ts
- src/routes/task026ControlledPilotExecutionRoutes.ts
- src/routes/task033CanaryObservationRoutes.ts
- src/routes/task034ControlledRolloutRoutes.ts

## Unresolved Route Dependencies

_none_
