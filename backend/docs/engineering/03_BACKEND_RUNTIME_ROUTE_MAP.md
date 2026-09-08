# Backend Runtime Route Map

STATIC STRUCTURAL EVIDENCE — NOT RUNTIME EXECUTION PROOF

Static route composition below is derived from TypeScript AST analysis.
Effective paths are reported only when the mount and the endpoint are
both statically resolvable. Anything else is listed as a candidate.

## Baseline

- Scanner version: 1.0.0
- Source fingerprint: sf-7fc842778ef56aaf2cb3563a4eef107fb4154790ec8407ccac9f56049d0656b0
- Generated at: 2026-09-08T17:15:55.265Z
- Git branch: main
- Git head: ce94ab86c991562a1c6a864522a28d7382960975

## Direct Runtime Mounts

mount path | router | source | middleware | line
--- | --- | --- | --- | ---
/ | <unknown> | src/index.ts | — | 124
/ | <unknown> | src/index.ts | — | 125
/ | globalLimiter | src/index.ts | — | 143
/ | <unknown> | src/index.ts | — | 144
/ | <unknown> | src/index.ts | — | 145
/ | requestIdMiddleware | src/index.ts | — | 146
/ | requestCorrelationMiddleware | src/index.ts | — | 147
/ | requestTelemetryMiddleware | src/index.ts | — | 148
/ | httpLogger | src/index.ts | — | 149
/api/health | healthRoutes | src/index.ts | healthRoutes | 171
/api | readinessRoutes | src/index.ts | readinessRoutes | 172
/api/copilot/latency | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, latencyRoutes | 174
/api/copilot/latency | latencyRoutes | src/index.ts | schoolAuthMiddleware, latencyRoutes | 174
/api/copilot/anomalies | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, anomalyRoutes | 175
/api/copilot/anomalies | anomalyRoutes | src/index.ts | schoolAuthMiddleware, anomalyRoutes | 175
/api/copilot/tutor-state | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, tutorStateRoutes | 176
/api/copilot/tutor-state | tutorStateRoutes | src/index.ts | schoolAuthMiddleware, tutorStateRoutes | 176
/api/copilot/tutor-state | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, tutorStateV2Routes | 177
/api/copilot/tutor-state | tutorStateV2Routes | src/index.ts | schoolAuthMiddleware, tutorStateV2Routes | 177
/api/copilot/artifacts | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, artifactRoutes | 178
/api/copilot/artifacts | artifactRoutes | src/index.ts | schoolAuthMiddleware, artifactRoutes | 178
/api/copilot/learner-memory | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 179
/api/copilot/learner-memory | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 179
/api/copilot/learner-memory | learnerMemoryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 179
/api/copilot/practice-mastery | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, practiceMasteryRoutes | 180
/api/copilot/practice-mastery | practiceMasteryRoutes | src/index.ts | schoolAuthMiddleware, practiceMasteryRoutes | 180
/api/copilot/intent | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, intentResolverRoutes | 181
/api/copilot/intent | intentResolverRoutes | src/index.ts | schoolAuthMiddleware, intentResolverRoutes | 181
/api/copilot/chat-pipeline | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, chatPipelineRoutes | 182
/api/copilot/chat-pipeline | chatPipelineRoutes | src/index.ts | schoolAuthMiddleware, chatPipelineRoutes | 182
/api/copilot/live-chat | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, liveChatRoutes | 183
/api/copilot/live-chat | liveChatRoutes | src/index.ts | schoolAuthMiddleware, liveChatRoutes | 183
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, videoRecommendationRoutes | 184
/api/copilot | videoRecommendationRoutes | src/index.ts | schoolAuthMiddleware, videoRecommendationRoutes | 184
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, videoLearningSessionRoutes | 185
/api/copilot | videoLearningSessionRoutes | src/index.ts | schoolAuthMiddleware, videoLearningSessionRoutes | 185
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, videoAwarePracticeRoutes | 186
/api/copilot | videoAwarePracticeRoutes | src/index.ts | schoolAuthMiddleware, videoAwarePracticeRoutes | 186
/api/video-learning-analytics | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, videoLearningAnalyticsRoutes | 187
/api/video-learning-analytics | videoLearningAnalyticsRoutes | src/index.ts | schoolAuthMiddleware, videoLearningAnalyticsRoutes | 187
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, teacherInterventionRoutes | 188
/api | teacherInterventionRoutes | src/index.ts | schoolAuthMiddleware, teacherInterventionRoutes | 188
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherReportRoutes | 189
/api | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherReportRoutes | 189
/api | teacherReportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherReportRoutes | 189
/api/copilot/artifacts | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, artifactAwarePracticeRoutes | 190
/api/copilot/artifacts | artifactAwarePracticeRoutes | src/index.ts | schoolAuthMiddleware, artifactAwarePracticeRoutes | 190
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, aiRoutes | 191
/api/copilot | rateLimitMiddleware | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, aiRoutes | 191
/api/copilot | aiRoutes | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, aiRoutes | 191
/api/voice | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, voiceRoutes | 192
/api/voice | rateLimitMiddleware | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, voiceRoutes | 192
/api/voice | voiceRoutes | src/index.ts | schoolAuthMiddleware, rateLimitMiddleware, voiceRoutes | 192
/api/copilot/growth | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, growthAggregateRoutes | 193
/api/copilot/growth | growthAggregateRoutes | src/index.ts | schoolAuthMiddleware, growthAggregateRoutes | 193
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, profileRoutes | 194
/api | profileRoutes | src/index.ts | schoolAuthMiddleware, profileRoutes | 194
/api/learner | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, learnerRecommendationRoutes | 195
/api/learner | learnerRecommendationRoutes | src/index.ts | schoolAuthMiddleware, learnerRecommendationRoutes | 195
/api/learner | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, learnerPreferenceRoutes | 196
/api/learner | learnerPreferenceRoutes | src/index.ts | schoolAuthMiddleware, learnerPreferenceRoutes | 196
/api/copilot | copilotHandoffRoutes | src/index.ts | copilotHandoffRoutes | 197
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, tutorPolicyEvaluateRoutes | 198
/api/copilot | tutorPolicyEvaluateRoutes | src/index.ts | schoolAuthMiddleware, tutorPolicyEvaluateRoutes | 198
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, tutorSafeChatRoutes | 199
/api/copilot | tutorSafeChatRoutes | src/index.ts | schoolAuthMiddleware, tutorSafeChatRoutes | 199
/api/learner | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerSessionRoutes | 200
/api/learner | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerSessionRoutes | 200
/api/learner | learnerSessionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerSessionRoutes | 200
/api/tutor | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorConversationRoutes | 201
/api/tutor | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorConversationRoutes | 201
/api/tutor | tutorConversationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorConversationRoutes | 201
/api/learner | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeRoutes | 202
/api/learner | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeRoutes | 202
/api/learner | adaptiveChallengeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeRoutes | 202
/api/copilot/learning-sessions | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, studentLearningSessionRoutes | 203
/api/copilot/learning-sessions | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, studentLearningSessionRoutes | 203
/api/copilot/learning-sessions | studentLearningSessionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, studentLearningSessionRoutes | 203
/api/ops | opsPublicRouter | src/index.ts | opsPublicRouter | 204
/api/ops/diagnostics | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task018DiagnosticsRoutes | 205
/api/ops/diagnostics | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task018DiagnosticsRoutes | 205
/api/ops/diagnostics | task018DiagnosticsRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task018DiagnosticsRoutes | 205
/api/admin/rate-limits | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, rateLimitAdminRoutes | 206
/api/admin/rate-limits | rateLimitAdminRoutes | src/index.ts | schoolAuthMiddleware, rateLimitAdminRoutes | 206
/api/governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 207
/api/governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 207
/api/governance | privacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 207
/api/task020/security-privacy-governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task020SecurityPrivacyGovernanceRoutes | 208
/api/task020/security-privacy-governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task020SecurityPrivacyGovernanceRoutes | 208
/api/task020/security-privacy-governance | task020SecurityPrivacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task020SecurityPrivacyGovernanceRoutes | 208
/api/learner | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 209
/api/learner | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 209
/api/learner | privacyGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, privacyGovernanceRoutes | 209
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, schoolIntegrationRoutes | 210
/api | schoolIntegrationRoutes | src/index.ts | schoolAuthMiddleware, schoolIntegrationRoutes | 210
/api/task021/school-integration | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task021SchoolIntegrationRoutes | 211
/api/task021/school-integration | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task021SchoolIntegrationRoutes | 211
/api/task021/school-integration | task021SchoolIntegrationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task021SchoolIntegrationRoutes | 211
/api/content-governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, contentGovernanceRoutes | 213
/api/content-governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, contentGovernanceRoutes | 213
/api/content-governance | contentGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, contentGovernanceRoutes | 213
/api/task022/curriculum-governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task022CurriculumContentGovernanceRoutes | 214
/api/task022/curriculum-governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task022CurriculumContentGovernanceRoutes | 214
/api/task022/curriculum-governance | task022CurriculumContentGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task022CurriculumContentGovernanceRoutes | 214
/api | deploymentReadinessRoutes | src/index.ts | deploymentReadinessRoutes | 217
/api/task023/deployment-readiness | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task023DeploymentReadinessRoutes | 220
/api/task023/deployment-readiness | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task023DeploymentReadinessRoutes | 220
/api/task023/deployment-readiness | task023DeploymentReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task023DeploymentReadinessRoutes | 220
/api | task024OperationsRoutes | src/index.ts | task024OperationsRoutes | 229
/api/task024/operations-readiness | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task024OperationsReadinessRoutes | 233
/api/task024/operations-readiness | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task024OperationsReadinessRoutes | 233
/api/task024/operations-readiness | task024OperationsReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task024OperationsReadinessRoutes | 233
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, task025PilotRoutes | 242
/api | task025PilotRoutes | src/index.ts | schoolAuthMiddleware, task025PilotRoutes | 242
/api/task025/pilot-readiness | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task025ControlledPilotReadinessRoutes | 245
/api/task025/pilot-readiness | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task025ControlledPilotReadinessRoutes | 245
/api/task025/pilot-readiness | task025ControlledPilotReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task025ControlledPilotReadinessRoutes | 245
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, task026PilotExecutionRoutes | 254
/api | task026PilotExecutionRoutes | src/index.ts | schoolAuthMiddleware, task026PilotExecutionRoutes | 254
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, task027PilotExpansionRoutes | 258
/api | task027PilotExpansionRoutes | src/index.ts | schoolAuthMiddleware, task027PilotExpansionRoutes | 258
/api/task027/pilot-expansion-governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task027PilotExpansionGovernanceRoutes | 261
/api/task027/pilot-expansion-governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task027PilotExpansionGovernanceRoutes | 261
/api/task027/pilot-expansion-governance | task027PilotExpansionGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task027PilotExpansionGovernanceRoutes | 261
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, task028ExpansionExecutionRoutes | 270
/api | task028ExpansionExecutionRoutes | src/index.ts | schoolAuthMiddleware, task028ExpansionExecutionRoutes | 270
/api/task028/controlled-expansion-execution | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task028ControlledExpansionExecutionRoutes | 273
/api/task028/controlled-expansion-execution | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task028ControlledExpansionExecutionRoutes | 273
/api/task028/controlled-expansion-execution | task028ControlledExpansionExecutionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task028ControlledExpansionExecutionRoutes | 273
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, task029ExpansionOperationsRoutes | 282
/api | task029ExpansionOperationsRoutes | src/index.ts | schoolAuthMiddleware, task029ExpansionOperationsRoutes | 282
/api/task030/controlled-staging-rehearsal | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task030ControlledStagingRehearsalRoutes | 286
/api/task030/controlled-staging-rehearsal | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task030ControlledStagingRehearsalRoutes | 286
/api/task030/controlled-staging-rehearsal | task030ControlledStagingRehearsalRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task030ControlledStagingRehearsalRoutes | 286
/api/task031/staging-smoke-canary-readiness | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task031StagingSmokeCanaryReadinessRoutes | 295
/api/task031/staging-smoke-canary-readiness | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task031StagingSmokeCanaryReadinessRoutes | 295
/api/task031/staging-smoke-canary-readiness | task031StagingSmokeCanaryReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task031StagingSmokeCanaryReadinessRoutes | 295
/api/task032/controlled-canary-activation | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task032ControlledCanaryActivationRoutes | 304
/api/task032/controlled-canary-activation | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task032ControlledCanaryActivationRoutes | 304
/api/task032/controlled-canary-activation | task032ControlledCanaryActivationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task032ControlledCanaryActivationRoutes | 304
/api/task033/controlled-canary-observation | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task033ControlledCanaryObservationRoutes | 313
/api/task033/controlled-canary-observation | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task033ControlledCanaryObservationRoutes | 313
/api/task033/controlled-canary-observation | task033ControlledCanaryObservationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task033ControlledCanaryObservationRoutes | 313
/api/task034/controlled-limited-rollout | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task034ControlledLimitedRolloutRoutes | 322
/api/task034/controlled-limited-rollout | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task034ControlledLimitedRolloutRoutes | 322
/api/task034/controlled-limited-rollout | task034ControlledLimitedRolloutRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task034ControlledLimitedRolloutRoutes | 322
/api/task035/school-wide-readiness | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task035SchoolWideReadinessRoutes | 331
/api/task035/school-wide-readiness | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task035SchoolWideReadinessRoutes | 331
/api/task035/school-wide-readiness | task035SchoolWideReadinessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task035SchoolWideReadinessRoutes | 331
/api/task036/live-school-launch | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task036LiveSchoolLaunchRoutes | 341
/api/task036/live-school-launch | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task036LiveSchoolLaunchRoutes | 341
/api/task036/live-school-launch | task036LiveSchoolLaunchRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task036LiveSchoolLaunchRoutes | 341
/api/task040/backend-freeze | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task040BackendFreezeRoutes | 351
/api/task040/backend-freeze | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task040BackendFreezeRoutes | 351
/api/task040/backend-freeze | task040BackendFreezeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, task040BackendFreezeRoutes | 351
/api/question-bank | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, questionBankRoutes | 360
/api/question-bank | questionBankRoutes | src/index.ts | schoolAuthMiddleware, questionBankRoutes | 360
/api/question-bank | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, examBlueprintRoutes | 364
/api/question-bank | examBlueprintRoutes | src/index.ts | schoolAuthMiddleware, examBlueprintRoutes | 364
/api/question-bank/marking | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingRouter | 380
/api/question-bank/marking | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingRouter | 380
/api/question-bank/marking | composedMarkingRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingRouter | 380
/api/question-bank/exam-papers | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedExamPaperRouter | 384
/api/question-bank/exam-papers | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedExamPaperRouter | 384
/api/question-bank/exam-papers | composedExamPaperRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedExamPaperRouter | 384
/api/question-bank/exam-delivery | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examDeliveryRoutes | 388
/api/question-bank/exam-delivery | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examDeliveryRoutes | 388
/api/question-bank/exam-delivery | examDeliveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examDeliveryRoutes | 388
/api/question-bank/marking-invocation | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingInvocationRouter | 398
/api/question-bank/marking-invocation | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingInvocationRouter | 398
/api/question-bank/marking-invocation | composedMarkingInvocationRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedMarkingInvocationRouter | 398
/api/question-bank/result-governance | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultGovernanceRoutes | 402
/api/question-bank/result-governance | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultGovernanceRoutes | 402
/api/question-bank/result-governance | resultGovernanceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultGovernanceRoutes | 402
/api/question-bank/result-learning-evidence | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultLearningEvidenceRoutes | 406
/api/question-bank/result-learning-evidence | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultLearningEvidenceRoutes | 406
/api/question-bank/result-learning-evidence | resultLearningEvidenceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultLearningEvidenceRoutes | 406
/api/question-bank/result-release | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReleaseRoutes | 410
/api/question-bank/result-release | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReleaseRoutes | 410
/api/question-bank/result-release | resultReleaseRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReleaseRoutes | 410
/api/question-bank/result-delivery | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultDeliveryRoutes | 414
/api/question-bank/result-delivery | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultDeliveryRoutes | 414
/api/question-bank/result-delivery | resultDeliveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultDeliveryRoutes | 414
/api/question-bank/result-report-cards | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardRoutes | 418
/api/question-bank/result-report-cards | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardRoutes | 418
/api/question-bank/result-report-cards | resultReportCardRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardRoutes | 418
/api/question-bank/result-report-card-export | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardExportRoutes | 422
/api/question-bank/result-report-card-export | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardExportRoutes | 422
/api/question-bank/result-report-card-export | resultReportCardExportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardExportRoutes | 422
/api/question-bank/result-report-card-access | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardAccessRoutes | 426
/api/question-bank/result-report-card-access | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardAccessRoutes | 426
/api/question-bank/result-report-card-access | resultReportCardAccessRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultReportCardAccessRoutes | 426
/api/question-bank/result-follow-up | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultFollowUpRoutes | 430
/api/question-bank/result-follow-up | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultFollowUpRoutes | 430
/api/question-bank/result-follow-up | resultFollowUpRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultFollowUpRoutes | 430
/api/question-bank/result-recovery | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultRecoveryRoutes | 434
/api/question-bank/result-recovery | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultRecoveryRoutes | 434
/api/question-bank/result-recovery | resultRecoveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, resultRecoveryRoutes | 434
/api/question-bank/recovery-progress | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryProgressRoutes | 438
/api/question-bank/recovery-progress | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryProgressRoutes | 438
/api/question-bank/recovery-progress | recoveryProgressRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryProgressRoutes | 438
/api/question-bank/recovery-outcome | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeRoutes | 442
/api/question-bank/recovery-outcome | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeRoutes | 442
/api/question-bank/recovery-outcome | recoveryOutcomeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeRoutes | 442
/api/question-bank/recovery-outcome-action | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeActionRoutes | 446
/api/question-bank/recovery-outcome-action | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeActionRoutes | 446
/api/question-bank/recovery-outcome-action | recoveryOutcomeActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeActionRoutes | 446
/api/question-bank/recovery-outcome-execution-simulation | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeExecutionSimulationRoutes | 450
/api/question-bank/recovery-outcome-execution-simulation | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeExecutionSimulationRoutes | 450
/api/question-bank/recovery-outcome-execution-simulation | recoveryOutcomeExecutionSimulationRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryOutcomeExecutionSimulationRoutes | 450
/api/question-bank/recovery-lifecycle-closure | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryLifecycleClosureRouter | 454
/api/question-bank/recovery-lifecycle-closure | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryLifecycleClosureRouter | 454
/api/question-bank/recovery-lifecycle-closure | composedRecoveryLifecycleClosureRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryLifecycleClosureRouter | 454
/api/question-bank/recovery-execution-authorization-preview | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryExecutionAuthorizationPreviewRoutes | 458
/api/question-bank/recovery-execution-authorization-preview | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryExecutionAuthorizationPreviewRoutes | 458
/api/question-bank/recovery-execution-authorization-preview | recoveryExecutionAuthorizationPreviewRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryExecutionAuthorizationPreviewRoutes | 458
/api/question-bank/recovery-execution-readiness-board | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryExecutionReadinessBoardRouter | 479
/api/question-bank/recovery-execution-readiness-board | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryExecutionReadinessBoardRouter | 479
/api/question-bank/recovery-execution-readiness-board | composedRecoveryExecutionReadinessBoardRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryExecutionReadinessBoardRouter | 479
/api/question-bank/recovery-case-triage | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryCaseTriageRoutes | 483
/api/question-bank/recovery-case-triage | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryCaseTriageRoutes | 483
/api/question-bank/recovery-case-triage | recoveryCaseTriageRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, recoveryCaseTriageRoutes | 483
/api/question-bank/recovery-case-adjudication | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryCaseAdjudicationRouter | 503
/api/question-bank/recovery-case-adjudication | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryCaseAdjudicationRouter | 503
/api/question-bank/recovery-case-adjudication | composedRecoveryCaseAdjudicationRouter | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, composedRecoveryCaseAdjudicationRouter | 503
/api | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningModeRoutes | 506
/api | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningModeRoutes | 506
/api | learningModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningModeRoutes | 506
/api/copilot | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningProfileRoutes | 507
/api/copilot | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningProfileRoutes | 507
/api/copilot | learningProfileRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learningProfileRoutes | 507
/api/copilot/tutor-actions | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorActionRoutes | 510
/api/copilot/tutor-actions | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorActionRoutes | 510
/api/copilot/tutor-actions | tutorActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorActionRoutes | 510
/api/copilot/focus-mode | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, focusModeRoutes | 513
/api/copilot/focus-mode | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, focusModeRoutes | 513
/api/copilot/focus-mode | focusModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, focusModeRoutes | 513
/api/copilot/exam-mode | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examModeRoutes | 516
/api/copilot/exam-mode | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examModeRoutes | 516
/api/copilot/exam-mode | examModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, examModeRoutes | 516
/api/copilot/quiz-mode | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, quizModeRoutes | 519
/api/copilot/quiz-mode | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, quizModeRoutes | 519
/api/copilot/quiz-mode | quizModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, quizModeRoutes | 519
/api/copilot/teach-back-mode | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teachBackModeRoutes | 522
/api/copilot/teach-back-mode | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teachBackModeRoutes | 522
/api/copilot/teach-back-mode | teachBackModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teachBackModeRoutes | 522
/api/copilot/revision-mode | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, revisionModeRoutes | 526
/api/copilot/revision-mode | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, revisionModeRoutes | 526
/api/copilot/revision-mode | revisionModeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, revisionModeRoutes | 526
/api/copilot/growth | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, growthActionRoutes | 530
/api/copilot/growth | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, growthActionRoutes | 530
/api/copilot/growth | growthActionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, growthActionRoutes | 530
/api/copilot/tutor-turn | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorTurnRuntimeRoutes | 534
/api/copilot/tutor-turn | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorTurnRuntimeRoutes | 534
/api/copilot/tutor-turn | tutorTurnRuntimeRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, tutorTurnRuntimeRoutes | 534
/api/copilot/learning-evidence | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, safeLearningEvidenceRoutes | 538
/api/copilot/learning-evidence | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, safeLearningEvidenceRoutes | 538
/api/copilot/learning-evidence | safeLearningEvidenceRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, safeLearningEvidenceRoutes | 538
/api/copilot/evidence | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 545
/api/copilot/evidence | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext | 545
/api/copilot/teacher-insights | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherSafeInsightRoutes | 549
/api/copilot/teacher-insights | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherSafeInsightRoutes | 549
/api/copilot/teacher-insights | teacherSafeInsightRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, teacherSafeInsightRoutes | 549
/api/copilot/learner-transparency | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerTransparencyRoutes | 553
/api/copilot/learner-transparency | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerTransparencyRoutes | 553
/api/copilot/learner-transparency | learnerTransparencyRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerTransparencyRoutes | 553
/api/copilot/adaptive-recommendations | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveRecommendationTuningRoutes | 557
/api/copilot/adaptive-recommendations | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveRecommendationTuningRoutes | 557
/api/copilot/adaptive-recommendations | adaptiveRecommendationTuningRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveRecommendationTuningRoutes | 557
/api/copilot/adaptive-challenges | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeTask015Routes | 562
/api/copilot/adaptive-challenges | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeTask015Routes | 562
/api/copilot/adaptive-challenges | adaptiveChallengeTask015Routes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, adaptiveChallengeTask015Routes | 562
/api/copilot/remediation | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, remediationTask015Routes | 563
/api/copilot/remediation | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, remediationTask015Routes | 563
/api/copilot/remediation | remediationTask015Routes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, remediationTask015Routes | 563
/api/copilot/no-ai-bypass | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, noAiBypassAuditRoutes | 565
/api/copilot/no-ai-bypass | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, noAiBypassAuditRoutes | 565
/api/copilot/no-ai-bypass | noAiBypassAuditRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, noAiBypassAuditRoutes | 565
/api/phase3/objectives | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ObjectiveMasteryRoutes | 569
/api/phase3/objectives | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ObjectiveMasteryRoutes | 569
/api/phase3/objectives | phase3ObjectiveMasteryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ObjectiveMasteryRoutes | 569
/api/phase3/daily-objective-checks | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyObjectiveCheckRoutes | 573
/api/phase3/daily-objective-checks | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyObjectiveCheckRoutes | 573
/api/phase3/daily-objective-checks | phase3DailyObjectiveCheckRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyObjectiveCheckRoutes | 573
/api/phase3/daily-learning-feed | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyLearningFeedRoutes | 577
/api/phase3/daily-learning-feed | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyLearningFeedRoutes | 577
/api/phase3/daily-learning-feed | phase3DailyLearningFeedRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3DailyLearningFeedRoutes | 577
/api/phase3/study-plans | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3StudyPlanRoutes | 581
/api/phase3/study-plans | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3StudyPlanRoutes | 581
/api/phase3/study-plans | phase3StudyPlanRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3StudyPlanRoutes | 581
/api/phase3/growth-page | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3GrowthPageRoutes | 585
/api/phase3/growth-page | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3GrowthPageRoutes | 585
/api/phase3/growth-page | phase3GrowthPageRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3GrowthPageRoutes | 585
/api/phase3/living-revision | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3LivingRevisionRoutes | 589
/api/phase3/living-revision | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3LivingRevisionRoutes | 589
/api/phase3/living-revision | phase3LivingRevisionRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3LivingRevisionRoutes | 589
/api/phase3/confidence-recovery | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ConfidenceRecoveryRoutes | 593
/api/phase3/confidence-recovery | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ConfidenceRecoveryRoutes | 593
/api/phase3/confidence-recovery | phase3ConfidenceRecoveryRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ConfidenceRecoveryRoutes | 593
/api/phase3/parent-support | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ParentSupportRoutes | 597
/api/phase3/parent-support | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ParentSupportRoutes | 597
/api/phase3/parent-support | phase3ParentSupportRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3ParentSupportRoutes | 597
/api/phase3/peer-learning | schoolAuthMiddleware | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3PeerLearningRoutes | 601
/api/phase3/peer-learning | requireVerifiedSchoolContext | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3PeerLearningRoutes | 601
/api/phase3/peer-learning | phase3PeerLearningRoutes | src/index.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, phase3PeerLearningRoutes | 601
/ | errorTelemetryMiddleware | src/index.ts | — | 604
/ | <unknown> | src/index.ts | — | 607
/ | preferencesMemoryRouter | src/routes/ai.ts | — | 204
/ | voiceQuotaRouter | src/routes/ai.ts | — | 205
/ | safetyRouter | src/routes/ai.ts | — | 206
/ | researchRouter | src/routes/ai.ts | — | 207
/ | studyRouter | src/routes/ai.ts | — | 208
/ | growthRouter | src/routes/ai.ts | — | 209
/ | assessmentRouter | src/routes/ai.ts | — | 210
/ | mediaRouter | src/routes/ai.ts | — | 211
/ | revisionRouter | src/routes/ai.ts | — | 212
/ | <unknown> | src/tests/learner-memory-r2-repair.test.ts | — | 38
/api/copilot/learner-memory | schoolAuthMiddleware | src/tests/learner-memory-r2-repair.test.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 39
/api/copilot/learner-memory | requireVerifiedSchoolContext | src/tests/learner-memory-r2-repair.test.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 39
/api/copilot/learner-memory | learnerMemoryRoutes | src/tests/learner-memory-r2-repair.test.ts | schoolAuthMiddleware, requireVerifiedSchoolContext, learnerMemoryRoutes | 39
/ | <unknown> | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts | — | 8
/api/copilot/evidence | <unknown> | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts | — | 9
/ | <unknown> | src/tests/task-032-cross-learner-denial.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-cross-learner-denial.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-cross-school-denial.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-cross-school-denial.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-peer-denied-routes.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-peer-denied-routes.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-activation-lifecycle.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-activation-lifecycle.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-cohort-eligibility.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-cohort-eligibility.contract.test.ts | task032Router | 11
/ | <unknown> | src/tests/task-032-routes-config.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-config.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-consent-authorization.contract.test.ts | — | 10
/api/task-032 | task032Router | src/tests/task-032-routes-consent-authorization.contract.test.ts | task032Router | 11
/ | <unknown> | src/tests/task-032-routes-control-action.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-control-action.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-dependency.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-dependency.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-diagnostics.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-diagnostics.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-environment-preflight.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-environment-preflight.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-health-budget.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-health-budget.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-health.contract.test.ts | — | 8
/api/task-032 | task032Router | src/tests/task-032-routes-health.contract.test.ts | task032Router | 9
/ | <unknown> | src/tests/task-032-routes-incident-bridge.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-incident-bridge.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-privacy-boundary.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-privacy-boundary.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-report.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-report.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-runtime-guard.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-runtime-guard.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-032-routes-safe-view.contract.test.ts | — | 9
/api/task-032 | task032Router | src/tests/task-032-routes-safe-view.contract.test.ts | task032Router | 10
/ | <unknown> | src/tests/task-034-routes-cap-check.contract.test.ts | — | 23
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cap-check.contract.test.ts | — | 24
/ | <unknown> | src/tests/task-034-routes-cohort-eligibility.contract.test.ts | — | 25
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cohort-eligibility.contract.test.ts | — | 26
/ | <unknown> | src/tests/task-034-routes-content-governance-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-content-governance-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-cross-school-denial-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-cross-school-denial-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-deen-boundary-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-deen-boundary-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-dependency.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-dependency.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-diagnostics.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-diagnostics.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-environment-preflight.contract.test.ts | — | 32
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-environment-preflight.contract.test.ts | — | 33
/ | <unknown> | src/tests/task-034-routes-event-intake.contract.test.ts | — | 31
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-event-intake.contract.test.ts | — | 32
/ | <unknown> | src/tests/task-034-routes-evidence.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-evidence.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-health-budget.contract.test.ts | — | 25
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-health-budget.contract.test.ts | — | 26
/ | <unknown> | src/tests/task-034-routes-health.contract.test.ts | — | 11
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-health.contract.test.ts | — | 12
/ | <unknown> | src/tests/task-034-routes-incident-escalation.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-incident-escalation.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-learner-notice-readiness.contract.test.ts | — | 26
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-learner-notice-readiness.contract.test.ts | — | 27
/ | <unknown> | src/tests/task-034-routes-limited-rollout-config.contract.test.ts | — | 30
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-limited-rollout-config.contract.test.ts | — | 31
/ | <unknown> | src/tests/task-034-routes-post-limited-rollout-decision.contract.test.ts | — | 27
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-post-limited-rollout-decision.contract.test.ts | — | 28
/ | <unknown> | src/tests/task-034-routes-privacy-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-privacy-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-report.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-report.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-rollback-protection.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-rollback-protection.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-runtime-guard.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-runtime-guard.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-safe-view.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-safe-view.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-school-identity-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-school-identity-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-session-lifecycle.contract.test.ts | — | 20
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-session-lifecycle.contract.test.ts | — | 21
/ | <unknown> | src/tests/task-034-routes-socratic-integrity-review.contract.test.ts | — | 12
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-socratic-integrity-review.contract.test.ts | — | 13
/ | <unknown> | src/tests/task-034-routes-staff-readiness.contract.test.ts | — | 24
/ | task034LimitedRolloutRoutes | src/tests/task-034-routes-staff-readiness.contract.test.ts | — | 25

## Effective Endpoints

method | effective path | route source | mount source | middleware
--- | --- | --- | --- | ---
_none statically resolvable_

## Factory / Composition Mounts

mount | factory/router | source | resolution note
--- | --- | --- | ---
/ | <unknown> | src/index.ts:124 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/index.ts:125 | router origin unknown; effective endpoints not composed
/ | globalLimiter | src/index.ts:143 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/index.ts:144 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/index.ts:145 | router origin unknown; effective endpoints not composed
/ | requestIdMiddleware | src/index.ts:146 | router origin unknown; effective endpoints not composed
/ | httpLogger | src/index.ts:149 | router origin unknown; effective endpoints not composed
/api/copilot/learner-memory | requireVerifiedSchoolContext | src/index.ts:179 | router origin unknown; effective endpoints not composed
/api | requireVerifiedSchoolContext | src/index.ts:189 | router origin unknown; effective endpoints not composed
/api/copilot | rateLimitMiddleware | src/index.ts:191 | router origin unknown; effective endpoints not composed
/api/voice | rateLimitMiddleware | src/index.ts:192 | router origin unknown; effective endpoints not composed
/api/learner | requireVerifiedSchoolContext | src/index.ts:200 | router origin unknown; effective endpoints not composed
/api/tutor | requireVerifiedSchoolContext | src/index.ts:201 | router origin unknown; effective endpoints not composed
/api/learner | requireVerifiedSchoolContext | src/index.ts:202 | router origin unknown; effective endpoints not composed
/api/copilot/learning-sessions | requireVerifiedSchoolContext | src/index.ts:203 | router origin unknown; effective endpoints not composed
/api/ops | opsPublicRouter | src/index.ts:204 | router origin unknown; effective endpoints not composed
/api/ops/diagnostics | requireVerifiedSchoolContext | src/index.ts:205 | router origin unknown; effective endpoints not composed
/api/ops/diagnostics | task018DiagnosticsRoutes | src/index.ts:205 | router origin unknown; effective endpoints not composed
/api/governance | requireVerifiedSchoolContext | src/index.ts:207 | router origin unknown; effective endpoints not composed
/api/task020/security-privacy-governance | requireVerifiedSchoolContext | src/index.ts:208 | router origin unknown; effective endpoints not composed
/api/learner | requireVerifiedSchoolContext | src/index.ts:209 | router origin unknown; effective endpoints not composed
/api/task021/school-integration | requireVerifiedSchoolContext | src/index.ts:211 | router origin unknown; effective endpoints not composed
/api/content-governance | requireVerifiedSchoolContext | src/index.ts:213 | router origin unknown; effective endpoints not composed
/api/task022/curriculum-governance | requireVerifiedSchoolContext | src/index.ts:214 | router origin unknown; effective endpoints not composed
/api/task023/deployment-readiness | requireVerifiedSchoolContext | src/index.ts:220 | router origin unknown; effective endpoints not composed
/api/task024/operations-readiness | requireVerifiedSchoolContext | src/index.ts:233 | router origin unknown; effective endpoints not composed
/api/task025/pilot-readiness | requireVerifiedSchoolContext | src/index.ts:245 | router origin unknown; effective endpoints not composed
/api/task027/pilot-expansion-governance | requireVerifiedSchoolContext | src/index.ts:261 | router origin unknown; effective endpoints not composed
/api/task028/controlled-expansion-execution | requireVerifiedSchoolContext | src/index.ts:273 | router origin unknown; effective endpoints not composed
/api/task030/controlled-staging-rehearsal | requireVerifiedSchoolContext | src/index.ts:286 | router origin unknown; effective endpoints not composed
/api/task031/staging-smoke-canary-readiness | requireVerifiedSchoolContext | src/index.ts:295 | router origin unknown; effective endpoints not composed
/api/task032/controlled-canary-activation | requireVerifiedSchoolContext | src/index.ts:304 | router origin unknown; effective endpoints not composed
/api/task033/controlled-canary-observation | requireVerifiedSchoolContext | src/index.ts:313 | router origin unknown; effective endpoints not composed
/api/task034/controlled-limited-rollout | requireVerifiedSchoolContext | src/index.ts:322 | router origin unknown; effective endpoints not composed
/api/task035/school-wide-readiness | requireVerifiedSchoolContext | src/index.ts:331 | router origin unknown; effective endpoints not composed
/api/task036/live-school-launch | requireVerifiedSchoolContext | src/index.ts:341 | router origin unknown; effective endpoints not composed
/api/task040/backend-freeze | requireVerifiedSchoolContext | src/index.ts:351 | router origin unknown; effective endpoints not composed
/api/question-bank/marking | requireVerifiedSchoolContext | src/index.ts:380 | router origin unknown; effective endpoints not composed
/api/question-bank/marking | composedMarkingRouter | src/index.ts:380 | router origin unknown; effective endpoints not composed
/api/question-bank/exam-papers | requireVerifiedSchoolContext | src/index.ts:384 | router origin unknown; effective endpoints not composed
/api/question-bank/exam-papers | composedExamPaperRouter | src/index.ts:384 | router origin unknown; effective endpoints not composed
/api/question-bank/exam-delivery | requireVerifiedSchoolContext | src/index.ts:388 | router origin unknown; effective endpoints not composed
/api/question-bank/marking-invocation | requireVerifiedSchoolContext | src/index.ts:398 | router origin unknown; effective endpoints not composed
/api/question-bank/marking-invocation | composedMarkingInvocationRouter | src/index.ts:398 | router origin unknown; effective endpoints not composed
/api/question-bank/result-governance | requireVerifiedSchoolContext | src/index.ts:402 | router origin unknown; effective endpoints not composed
/api/question-bank/result-learning-evidence | requireVerifiedSchoolContext | src/index.ts:406 | router origin unknown; effective endpoints not composed
/api/question-bank/result-release | requireVerifiedSchoolContext | src/index.ts:410 | router origin unknown; effective endpoints not composed
/api/question-bank/result-delivery | requireVerifiedSchoolContext | src/index.ts:414 | router origin unknown; effective endpoints not composed
/api/question-bank/result-report-cards | requireVerifiedSchoolContext | src/index.ts:418 | router origin unknown; effective endpoints not composed
/api/question-bank/result-report-card-export | requireVerifiedSchoolContext | src/index.ts:422 | router origin unknown; effective endpoints not composed
/api/question-bank/result-report-card-access | requireVerifiedSchoolContext | src/index.ts:426 | router origin unknown; effective endpoints not composed
/api/question-bank/result-follow-up | requireVerifiedSchoolContext | src/index.ts:430 | router origin unknown; effective endpoints not composed
/api/question-bank/result-recovery | requireVerifiedSchoolContext | src/index.ts:434 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-progress | requireVerifiedSchoolContext | src/index.ts:438 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-outcome | requireVerifiedSchoolContext | src/index.ts:442 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-outcome-action | requireVerifiedSchoolContext | src/index.ts:446 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-outcome-execution-simulation | requireVerifiedSchoolContext | src/index.ts:450 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-lifecycle-closure | requireVerifiedSchoolContext | src/index.ts:454 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-lifecycle-closure | composedRecoveryLifecycleClosureRouter | src/index.ts:454 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-execution-authorization-preview | requireVerifiedSchoolContext | src/index.ts:458 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-execution-readiness-board | requireVerifiedSchoolContext | src/index.ts:479 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-execution-readiness-board | composedRecoveryExecutionReadinessBoardRouter | src/index.ts:479 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-case-triage | requireVerifiedSchoolContext | src/index.ts:483 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-case-adjudication | requireVerifiedSchoolContext | src/index.ts:503 | router origin unknown; effective endpoints not composed
/api/question-bank/recovery-case-adjudication | composedRecoveryCaseAdjudicationRouter | src/index.ts:503 | router origin unknown; effective endpoints not composed
/api | requireVerifiedSchoolContext | src/index.ts:506 | router origin unknown; effective endpoints not composed
/api/copilot | requireVerifiedSchoolContext | src/index.ts:507 | router origin unknown; effective endpoints not composed
/api/copilot/tutor-actions | requireVerifiedSchoolContext | src/index.ts:510 | router origin unknown; effective endpoints not composed
/api/copilot/focus-mode | requireVerifiedSchoolContext | src/index.ts:513 | router origin unknown; effective endpoints not composed
/api/copilot/exam-mode | requireVerifiedSchoolContext | src/index.ts:516 | router origin unknown; effective endpoints not composed
/api/copilot/quiz-mode | requireVerifiedSchoolContext | src/index.ts:519 | router origin unknown; effective endpoints not composed
/api/copilot/teach-back-mode | requireVerifiedSchoolContext | src/index.ts:522 | router origin unknown; effective endpoints not composed
/api/copilot/revision-mode | requireVerifiedSchoolContext | src/index.ts:526 | router origin unknown; effective endpoints not composed
/api/copilot/growth | requireVerifiedSchoolContext | src/index.ts:530 | router origin unknown; effective endpoints not composed
/api/copilot/tutor-turn | requireVerifiedSchoolContext | src/index.ts:534 | router origin unknown; effective endpoints not composed
/api/copilot/learning-evidence | requireVerifiedSchoolContext | src/index.ts:538 | router origin unknown; effective endpoints not composed
/api/copilot/evidence | requireVerifiedSchoolContext | src/index.ts:545 | router origin unknown; effective endpoints not composed
/api/copilot/teacher-insights | requireVerifiedSchoolContext | src/index.ts:549 | router origin unknown; effective endpoints not composed
/api/copilot/learner-transparency | requireVerifiedSchoolContext | src/index.ts:553 | router origin unknown; effective endpoints not composed
/api/copilot/adaptive-recommendations | requireVerifiedSchoolContext | src/index.ts:557 | router origin unknown; effective endpoints not composed
/api/copilot/adaptive-challenges | requireVerifiedSchoolContext | src/index.ts:562 | router origin unknown; effective endpoints not composed
/api/copilot/remediation | requireVerifiedSchoolContext | src/index.ts:563 | router origin unknown; effective endpoints not composed
/api/copilot/no-ai-bypass | requireVerifiedSchoolContext | src/index.ts:565 | router origin unknown; effective endpoints not composed
/api/phase3/objectives | requireVerifiedSchoolContext | src/index.ts:569 | router origin unknown; effective endpoints not composed
/api/phase3/daily-objective-checks | requireVerifiedSchoolContext | src/index.ts:573 | router origin unknown; effective endpoints not composed
/api/phase3/daily-learning-feed | requireVerifiedSchoolContext | src/index.ts:577 | router origin unknown; effective endpoints not composed
/api/phase3/study-plans | requireVerifiedSchoolContext | src/index.ts:581 | router origin unknown; effective endpoints not composed
/api/phase3/growth-page | requireVerifiedSchoolContext | src/index.ts:585 | router origin unknown; effective endpoints not composed
/api/phase3/living-revision | requireVerifiedSchoolContext | src/index.ts:589 | router origin unknown; effective endpoints not composed
/api/phase3/confidence-recovery | requireVerifiedSchoolContext | src/index.ts:593 | router origin unknown; effective endpoints not composed
/api/phase3/parent-support | requireVerifiedSchoolContext | src/index.ts:597 | router origin unknown; effective endpoints not composed
/api/phase3/peer-learning | requireVerifiedSchoolContext | src/index.ts:601 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/index.ts:607 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/learner-memory-r2-repair.test.ts:38 | router origin unknown; effective endpoints not composed
/api/copilot/learner-memory | requireVerifiedSchoolContext | src/tests/learner-memory-r2-repair.test.ts:39 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:8 | router origin unknown; effective endpoints not composed
/api/copilot/evidence | <unknown> | src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-cross-learner-denial.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-cross-school-denial.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-peer-denied-routes.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-activation-lifecycle.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-cohort-eligibility.contract.test.ts:10 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-config.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-consent-authorization.contract.test.ts:10 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-control-action.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-dependency.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-diagnostics.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-environment-preflight.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-health-budget.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-health.contract.test.ts:8 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-incident-bridge.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-privacy-boundary.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-report.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-runtime-guard.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-032-routes-safe-view.contract.test.ts:9 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-cap-check.contract.test.ts:23 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-cohort-eligibility.contract.test.ts:25 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-content-governance-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-cross-school-denial-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-deen-boundary-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-dependency.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-diagnostics.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-environment-preflight.contract.test.ts:32 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-event-intake.contract.test.ts:31 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-evidence.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-health-budget.contract.test.ts:25 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-health.contract.test.ts:11 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-incident-escalation.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-learner-notice-readiness.contract.test.ts:26 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-limited-rollout-config.contract.test.ts:30 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-post-limited-rollout-decision.contract.test.ts:27 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-privacy-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-report.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-rollback-protection.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-runtime-guard.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-safe-view.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-school-identity-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-session-lifecycle.contract.test.ts:20 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-socratic-integrity-review.contract.test.ts:12 | router origin unknown; effective endpoints not composed
/ | <unknown> | src/tests/task-034-routes-staff-readiness.contract.test.ts:24 | router origin unknown; effective endpoints not composed

## Duplicate Exact Route Candidates

_none_

## Shared Mount-Prefix Candidates

- `/api`
  - src/index.ts:172 (router readinessRoutes at /api)
  - src/index.ts:188 (router schoolAuthMiddleware at /api)
  - src/index.ts:188 (router teacherInterventionRoutes at /api)
  - src/index.ts:189 (router schoolAuthMiddleware at /api)
  - src/index.ts:189 (router requireVerifiedSchoolContext at /api)
  - src/index.ts:189 (router teacherReportRoutes at /api)
  - src/index.ts:194 (router schoolAuthMiddleware at /api)
  - src/index.ts:194 (router profileRoutes at /api)
  - src/index.ts:210 (router schoolAuthMiddleware at /api)
  - src/index.ts:210 (router schoolIntegrationRoutes at /api)
  - src/index.ts:217 (router deploymentReadinessRoutes at /api)
  - src/index.ts:229 (router task024OperationsRoutes at /api)
  - src/index.ts:242 (router schoolAuthMiddleware at /api)
  - src/index.ts:242 (router task025PilotRoutes at /api)
  - src/index.ts:254 (router schoolAuthMiddleware at /api)
  - src/index.ts:254 (router task026PilotExecutionRoutes at /api)
  - src/index.ts:258 (router schoolAuthMiddleware at /api)
  - src/index.ts:258 (router task027PilotExpansionRoutes at /api)
  - src/index.ts:270 (router schoolAuthMiddleware at /api)
  - src/index.ts:270 (router task028ExpansionExecutionRoutes at /api)
  - src/index.ts:282 (router schoolAuthMiddleware at /api)
  - src/index.ts:282 (router task029ExpansionOperationsRoutes at /api)
  - src/index.ts:506 (router schoolAuthMiddleware at /api)
  - src/index.ts:506 (router requireVerifiedSchoolContext at /api)
  - src/index.ts:506 (router learningModeRoutes at /api)
- `/api/admin`
  - src/index.ts:206 (router schoolAuthMiddleware at /api/admin/rate-limits)
  - src/index.ts:206 (router rateLimitAdminRoutes at /api/admin/rate-limits)
- `/api/content-governance`
  - src/index.ts:213 (router schoolAuthMiddleware at /api/content-governance)
  - src/index.ts:213 (router requireVerifiedSchoolContext at /api/content-governance)
  - src/index.ts:213 (router contentGovernanceRoutes at /api/content-governance)
- `/api/copilot`
  - src/index.ts:174 (router schoolAuthMiddleware at /api/copilot/latency)
  - src/index.ts:174 (router latencyRoutes at /api/copilot/latency)
  - src/index.ts:175 (router schoolAuthMiddleware at /api/copilot/anomalies)
  - src/index.ts:175 (router anomalyRoutes at /api/copilot/anomalies)
  - src/index.ts:176 (router schoolAuthMiddleware at /api/copilot/tutor-state)
  - src/index.ts:176 (router tutorStateRoutes at /api/copilot/tutor-state)
  - src/index.ts:177 (router schoolAuthMiddleware at /api/copilot/tutor-state)
  - src/index.ts:177 (router tutorStateV2Routes at /api/copilot/tutor-state)
  - src/index.ts:178 (router schoolAuthMiddleware at /api/copilot/artifacts)
  - src/index.ts:178 (router artifactRoutes at /api/copilot/artifacts)
  - src/index.ts:179 (router schoolAuthMiddleware at /api/copilot/learner-memory)
  - src/index.ts:179 (router requireVerifiedSchoolContext at /api/copilot/learner-memory)
  - src/index.ts:179 (router learnerMemoryRoutes at /api/copilot/learner-memory)
  - src/index.ts:180 (router schoolAuthMiddleware at /api/copilot/practice-mastery)
  - src/index.ts:180 (router practiceMasteryRoutes at /api/copilot/practice-mastery)
  - src/index.ts:181 (router schoolAuthMiddleware at /api/copilot/intent)
  - src/index.ts:181 (router intentResolverRoutes at /api/copilot/intent)
  - src/index.ts:182 (router schoolAuthMiddleware at /api/copilot/chat-pipeline)
  - src/index.ts:182 (router chatPipelineRoutes at /api/copilot/chat-pipeline)
  - src/index.ts:183 (router schoolAuthMiddleware at /api/copilot/live-chat)
  - src/index.ts:183 (router liveChatRoutes at /api/copilot/live-chat)
  - src/index.ts:184 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:184 (router videoRecommendationRoutes at /api/copilot)
  - src/index.ts:185 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:185 (router videoLearningSessionRoutes at /api/copilot)
  - src/index.ts:186 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:186 (router videoAwarePracticeRoutes at /api/copilot)
  - src/index.ts:190 (router schoolAuthMiddleware at /api/copilot/artifacts)
  - src/index.ts:190 (router artifactAwarePracticeRoutes at /api/copilot/artifacts)
  - src/index.ts:191 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:191 (router rateLimitMiddleware at /api/copilot)
  - src/index.ts:191 (router aiRoutes at /api/copilot)
  - src/index.ts:193 (router schoolAuthMiddleware at /api/copilot/growth)
  - src/index.ts:193 (router growthAggregateRoutes at /api/copilot/growth)
  - src/index.ts:197 (router copilotHandoffRoutes at /api/copilot)
  - src/index.ts:198 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:198 (router tutorPolicyEvaluateRoutes at /api/copilot)
  - src/index.ts:199 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:199 (router tutorSafeChatRoutes at /api/copilot)
  - src/index.ts:203 (router schoolAuthMiddleware at /api/copilot/learning-sessions)
  - src/index.ts:203 (router requireVerifiedSchoolContext at /api/copilot/learning-sessions)
  - src/index.ts:203 (router studentLearningSessionRoutes at /api/copilot/learning-sessions)
  - src/index.ts:507 (router schoolAuthMiddleware at /api/copilot)
  - src/index.ts:507 (router requireVerifiedSchoolContext at /api/copilot)
  - src/index.ts:507 (router learningProfileRoutes at /api/copilot)
  - src/index.ts:510 (router schoolAuthMiddleware at /api/copilot/tutor-actions)
  - src/index.ts:510 (router requireVerifiedSchoolContext at /api/copilot/tutor-actions)
  - src/index.ts:510 (router tutorActionRoutes at /api/copilot/tutor-actions)
  - src/index.ts:513 (router schoolAuthMiddleware at /api/copilot/focus-mode)
  - src/index.ts:513 (router requireVerifiedSchoolContext at /api/copilot/focus-mode)
  - src/index.ts:513 (router focusModeRoutes at /api/copilot/focus-mode)
  - src/index.ts:516 (router schoolAuthMiddleware at /api/copilot/exam-mode)
  - src/index.ts:516 (router requireVerifiedSchoolContext at /api/copilot/exam-mode)
  - src/index.ts:516 (router examModeRoutes at /api/copilot/exam-mode)
  - src/index.ts:519 (router schoolAuthMiddleware at /api/copilot/quiz-mode)
  - src/index.ts:519 (router requireVerifiedSchoolContext at /api/copilot/quiz-mode)
  - src/index.ts:519 (router quizModeRoutes at /api/copilot/quiz-mode)
  - src/index.ts:522 (router schoolAuthMiddleware at /api/copilot/teach-back-mode)
  - src/index.ts:522 (router requireVerifiedSchoolContext at /api/copilot/teach-back-mode)
  - src/index.ts:522 (router teachBackModeRoutes at /api/copilot/teach-back-mode)
  - src/index.ts:526 (router schoolAuthMiddleware at /api/copilot/revision-mode)
  - src/index.ts:526 (router requireVerifiedSchoolContext at /api/copilot/revision-mode)
  - src/index.ts:526 (router revisionModeRoutes at /api/copilot/revision-mode)
  - src/index.ts:530 (router schoolAuthMiddleware at /api/copilot/growth)
  - src/index.ts:530 (router requireVerifiedSchoolContext at /api/copilot/growth)
  - src/index.ts:530 (router growthActionRoutes at /api/copilot/growth)
  - src/index.ts:534 (router schoolAuthMiddleware at /api/copilot/tutor-turn)
  - src/index.ts:534 (router requireVerifiedSchoolContext at /api/copilot/tutor-turn)
  - src/index.ts:534 (router tutorTurnRuntimeRoutes at /api/copilot/tutor-turn)
  - src/index.ts:538 (router schoolAuthMiddleware at /api/copilot/learning-evidence)
  - src/index.ts:538 (router requireVerifiedSchoolContext at /api/copilot/learning-evidence)
  - src/index.ts:538 (router safeLearningEvidenceRoutes at /api/copilot/learning-evidence)
  - src/index.ts:545 (router schoolAuthMiddleware at /api/copilot/evidence)
  - src/index.ts:545 (router requireVerifiedSchoolContext at /api/copilot/evidence)
  - src/index.ts:549 (router schoolAuthMiddleware at /api/copilot/teacher-insights)
  - src/index.ts:549 (router requireVerifiedSchoolContext at /api/copilot/teacher-insights)
  - src/index.ts:549 (router teacherSafeInsightRoutes at /api/copilot/teacher-insights)
  - src/index.ts:553 (router schoolAuthMiddleware at /api/copilot/learner-transparency)
  - src/index.ts:553 (router requireVerifiedSchoolContext at /api/copilot/learner-transparency)
  - src/index.ts:553 (router learnerTransparencyRoutes at /api/copilot/learner-transparency)
  - src/index.ts:557 (router schoolAuthMiddleware at /api/copilot/adaptive-recommendations)
  - src/index.ts:557 (router requireVerifiedSchoolContext at /api/copilot/adaptive-recommendations)
  - src/index.ts:557 (router adaptiveRecommendationTuningRoutes at /api/copilot/adaptive-recommendations)
  - src/index.ts:562 (router schoolAuthMiddleware at /api/copilot/adaptive-challenges)
  - src/index.ts:562 (router requireVerifiedSchoolContext at /api/copilot/adaptive-challenges)
  - src/index.ts:562 (router adaptiveChallengeTask015Routes at /api/copilot/adaptive-challenges)
  - src/index.ts:563 (router schoolAuthMiddleware at /api/copilot/remediation)
  - src/index.ts:563 (router requireVerifiedSchoolContext at /api/copilot/remediation)
  - src/index.ts:563 (router remediationTask015Routes at /api/copilot/remediation)
  - src/index.ts:565 (router schoolAuthMiddleware at /api/copilot/no-ai-bypass)
  - src/index.ts:565 (router requireVerifiedSchoolContext at /api/copilot/no-ai-bypass)
  - src/index.ts:565 (router noAiBypassAuditRoutes at /api/copilot/no-ai-bypass)
  - src/tests/learner-memory-r2-repair.test.ts:39 (router schoolAuthMiddleware at /api/copilot/learner-memory)
  - src/tests/learner-memory-r2-repair.test.ts:39 (router requireVerifiedSchoolContext at /api/copilot/learner-memory)
  - src/tests/learner-memory-r2-repair.test.ts:39 (router learnerMemoryRoutes at /api/copilot/learner-memory)
  - src/tests/learning-evidence-domain/learning-evidence-routes.test.ts:9 (router <unknown> at /api/copilot/evidence)
- `/api/governance`
  - src/index.ts:207 (router schoolAuthMiddleware at /api/governance)
  - src/index.ts:207 (router requireVerifiedSchoolContext at /api/governance)
  - src/index.ts:207 (router privacyGovernanceRoutes at /api/governance)
- `/api/learner`
  - src/index.ts:195 (router schoolAuthMiddleware at /api/learner)
  - src/index.ts:195 (router learnerRecommendationRoutes at /api/learner)
  - src/index.ts:196 (router schoolAuthMiddleware at /api/learner)
  - src/index.ts:196 (router learnerPreferenceRoutes at /api/learner)
  - src/index.ts:200 (router schoolAuthMiddleware at /api/learner)
  - src/index.ts:200 (router requireVerifiedSchoolContext at /api/learner)
  - src/index.ts:200 (router learnerSessionRoutes at /api/learner)
  - src/index.ts:202 (router schoolAuthMiddleware at /api/learner)
  - src/index.ts:202 (router requireVerifiedSchoolContext at /api/learner)
  - src/index.ts:202 (router adaptiveChallengeRoutes at /api/learner)
  - src/index.ts:209 (router schoolAuthMiddleware at /api/learner)
  - src/index.ts:209 (router requireVerifiedSchoolContext at /api/learner)
  - src/index.ts:209 (router privacyGovernanceRoutes at /api/learner)
- `/api/ops`
  - src/index.ts:204 (router opsPublicRouter at /api/ops)
  - src/index.ts:205 (router schoolAuthMiddleware at /api/ops/diagnostics)
  - src/index.ts:205 (router requireVerifiedSchoolContext at /api/ops/diagnostics)
  - src/index.ts:205 (router task018DiagnosticsRoutes at /api/ops/diagnostics)
- `/api/phase3`
  - src/index.ts:569 (router schoolAuthMiddleware at /api/phase3/objectives)
  - src/index.ts:569 (router requireVerifiedSchoolContext at /api/phase3/objectives)
  - src/index.ts:569 (router phase3ObjectiveMasteryRoutes at /api/phase3/objectives)
  - src/index.ts:573 (router schoolAuthMiddleware at /api/phase3/daily-objective-checks)
  - src/index.ts:573 (router requireVerifiedSchoolContext at /api/phase3/daily-objective-checks)
  - src/index.ts:573 (router phase3DailyObjectiveCheckRoutes at /api/phase3/daily-objective-checks)
  - src/index.ts:577 (router schoolAuthMiddleware at /api/phase3/daily-learning-feed)
  - src/index.ts:577 (router requireVerifiedSchoolContext at /api/phase3/daily-learning-feed)
  - src/index.ts:577 (router phase3DailyLearningFeedRoutes at /api/phase3/daily-learning-feed)
  - src/index.ts:581 (router schoolAuthMiddleware at /api/phase3/study-plans)
  - src/index.ts:581 (router requireVerifiedSchoolContext at /api/phase3/study-plans)
  - src/index.ts:581 (router phase3StudyPlanRoutes at /api/phase3/study-plans)
  - src/index.ts:585 (router schoolAuthMiddleware at /api/phase3/growth-page)
  - src/index.ts:585 (router requireVerifiedSchoolContext at /api/phase3/growth-page)
  - src/index.ts:585 (router phase3GrowthPageRoutes at /api/phase3/growth-page)
  - src/index.ts:589 (router schoolAuthMiddleware at /api/phase3/living-revision)
  - src/index.ts:589 (router requireVerifiedSchoolContext at /api/phase3/living-revision)
  - src/index.ts:589 (router phase3LivingRevisionRoutes at /api/phase3/living-revision)
  - src/index.ts:593 (router schoolAuthMiddleware at /api/phase3/confidence-recovery)
  - src/index.ts:593 (router requireVerifiedSchoolContext at /api/phase3/confidence-recovery)
  - src/index.ts:593 (router phase3ConfidenceRecoveryRoutes at /api/phase3/confidence-recovery)
  - src/index.ts:597 (router schoolAuthMiddleware at /api/phase3/parent-support)
  - src/index.ts:597 (router requireVerifiedSchoolContext at /api/phase3/parent-support)
  - src/index.ts:597 (router phase3ParentSupportRoutes at /api/phase3/parent-support)
  - src/index.ts:601 (router schoolAuthMiddleware at /api/phase3/peer-learning)
  - src/index.ts:601 (router requireVerifiedSchoolContext at /api/phase3/peer-learning)
  - src/index.ts:601 (router phase3PeerLearningRoutes at /api/phase3/peer-learning)
- `/api/question-bank`
  - src/index.ts:360 (router schoolAuthMiddleware at /api/question-bank)
  - src/index.ts:360 (router questionBankRoutes at /api/question-bank)
  - src/index.ts:364 (router schoolAuthMiddleware at /api/question-bank)
  - src/index.ts:364 (router examBlueprintRoutes at /api/question-bank)
  - src/index.ts:380 (router schoolAuthMiddleware at /api/question-bank/marking)
  - src/index.ts:380 (router requireVerifiedSchoolContext at /api/question-bank/marking)
  - src/index.ts:380 (router composedMarkingRouter at /api/question-bank/marking)
  - src/index.ts:384 (router schoolAuthMiddleware at /api/question-bank/exam-papers)
  - src/index.ts:384 (router requireVerifiedSchoolContext at /api/question-bank/exam-papers)
  - src/index.ts:384 (router composedExamPaperRouter at /api/question-bank/exam-papers)
  - src/index.ts:388 (router schoolAuthMiddleware at /api/question-bank/exam-delivery)
  - src/index.ts:388 (router requireVerifiedSchoolContext at /api/question-bank/exam-delivery)
  - src/index.ts:388 (router examDeliveryRoutes at /api/question-bank/exam-delivery)
  - src/index.ts:398 (router schoolAuthMiddleware at /api/question-bank/marking-invocation)
  - src/index.ts:398 (router requireVerifiedSchoolContext at /api/question-bank/marking-invocation)
  - src/index.ts:398 (router composedMarkingInvocationRouter at /api/question-bank/marking-invocation)
  - src/index.ts:402 (router schoolAuthMiddleware at /api/question-bank/result-governance)
  - src/index.ts:402 (router requireVerifiedSchoolContext at /api/question-bank/result-governance)
  - src/index.ts:402 (router resultGovernanceRoutes at /api/question-bank/result-governance)
  - src/index.ts:406 (router schoolAuthMiddleware at /api/question-bank/result-learning-evidence)
  - src/index.ts:406 (router requireVerifiedSchoolContext at /api/question-bank/result-learning-evidence)
  - src/index.ts:406 (router resultLearningEvidenceRoutes at /api/question-bank/result-learning-evidence)
  - src/index.ts:410 (router schoolAuthMiddleware at /api/question-bank/result-release)
  - src/index.ts:410 (router requireVerifiedSchoolContext at /api/question-bank/result-release)
  - src/index.ts:410 (router resultReleaseRoutes at /api/question-bank/result-release)
  - src/index.ts:414 (router schoolAuthMiddleware at /api/question-bank/result-delivery)
  - src/index.ts:414 (router requireVerifiedSchoolContext at /api/question-bank/result-delivery)
  - src/index.ts:414 (router resultDeliveryRoutes at /api/question-bank/result-delivery)
  - src/index.ts:418 (router schoolAuthMiddleware at /api/question-bank/result-report-cards)
  - src/index.ts:418 (router requireVerifiedSchoolContext at /api/question-bank/result-report-cards)
  - src/index.ts:418 (router resultReportCardRoutes at /api/question-bank/result-report-cards)
  - src/index.ts:422 (router schoolAuthMiddleware at /api/question-bank/result-report-card-export)
  - src/index.ts:422 (router requireVerifiedSchoolContext at /api/question-bank/result-report-card-export)
  - src/index.ts:422 (router resultReportCardExportRoutes at /api/question-bank/result-report-card-export)
  - src/index.ts:426 (router schoolAuthMiddleware at /api/question-bank/result-report-card-access)
  - src/index.ts:426 (router requireVerifiedSchoolContext at /api/question-bank/result-report-card-access)
  - src/index.ts:426 (router resultReportCardAccessRoutes at /api/question-bank/result-report-card-access)
  - src/index.ts:430 (router schoolAuthMiddleware at /api/question-bank/result-follow-up)
  - src/index.ts:430 (router requireVerifiedSchoolContext at /api/question-bank/result-follow-up)
  - src/index.ts:430 (router resultFollowUpRoutes at /api/question-bank/result-follow-up)
  - src/index.ts:434 (router schoolAuthMiddleware at /api/question-bank/result-recovery)
  - src/index.ts:434 (router requireVerifiedSchoolContext at /api/question-bank/result-recovery)
  - src/index.ts:434 (router resultRecoveryRoutes at /api/question-bank/result-recovery)
  - src/index.ts:438 (router schoolAuthMiddleware at /api/question-bank/recovery-progress)
  - src/index.ts:438 (router requireVerifiedSchoolContext at /api/question-bank/recovery-progress)
  - src/index.ts:438 (router recoveryProgressRoutes at /api/question-bank/recovery-progress)
  - src/index.ts:442 (router schoolAuthMiddleware at /api/question-bank/recovery-outcome)
  - src/index.ts:442 (router requireVerifiedSchoolContext at /api/question-bank/recovery-outcome)
  - src/index.ts:442 (router recoveryOutcomeRoutes at /api/question-bank/recovery-outcome)
  - src/index.ts:446 (router schoolAuthMiddleware at /api/question-bank/recovery-outcome-action)
  - src/index.ts:446 (router requireVerifiedSchoolContext at /api/question-bank/recovery-outcome-action)
  - src/index.ts:446 (router recoveryOutcomeActionRoutes at /api/question-bank/recovery-outcome-action)
  - src/index.ts:450 (router schoolAuthMiddleware at /api/question-bank/recovery-outcome-execution-simulation)
  - src/index.ts:450 (router requireVerifiedSchoolContext at /api/question-bank/recovery-outcome-execution-simulation)
  - src/index.ts:450 (router recoveryOutcomeExecutionSimulationRoutes at /api/question-bank/recovery-outcome-execution-simulation)
  - src/index.ts:454 (router schoolAuthMiddleware at /api/question-bank/recovery-lifecycle-closure)
  - src/index.ts:454 (router requireVerifiedSchoolContext at /api/question-bank/recovery-lifecycle-closure)
  - src/index.ts:454 (router composedRecoveryLifecycleClosureRouter at /api/question-bank/recovery-lifecycle-closure)
  - src/index.ts:458 (router schoolAuthMiddleware at /api/question-bank/recovery-execution-authorization-preview)
  - src/index.ts:458 (router requireVerifiedSchoolContext at /api/question-bank/recovery-execution-authorization-preview)
  - src/index.ts:458 (router recoveryExecutionAuthorizationPreviewRoutes at /api/question-bank/recovery-execution-authorization-preview)
  - src/index.ts:479 (router schoolAuthMiddleware at /api/question-bank/recovery-execution-readiness-board)
  - src/index.ts:479 (router requireVerifiedSchoolContext at /api/question-bank/recovery-execution-readiness-board)
  - src/index.ts:479 (router composedRecoveryExecutionReadinessBoardRouter at /api/question-bank/recovery-execution-readiness-board)
  - src/index.ts:483 (router schoolAuthMiddleware at /api/question-bank/recovery-case-triage)
  - src/index.ts:483 (router requireVerifiedSchoolContext at /api/question-bank/recovery-case-triage)
  - src/index.ts:483 (router recoveryCaseTriageRoutes at /api/question-bank/recovery-case-triage)
  - src/index.ts:503 (router schoolAuthMiddleware at /api/question-bank/recovery-case-adjudication)
  - src/index.ts:503 (router requireVerifiedSchoolContext at /api/question-bank/recovery-case-adjudication)
  - src/index.ts:503 (router composedRecoveryCaseAdjudicationRouter at /api/question-bank/recovery-case-adjudication)
- `/api/task020`
  - src/index.ts:208 (router schoolAuthMiddleware at /api/task020/security-privacy-governance)
  - src/index.ts:208 (router requireVerifiedSchoolContext at /api/task020/security-privacy-governance)
  - src/index.ts:208 (router task020SecurityPrivacyGovernanceRoutes at /api/task020/security-privacy-governance)
- `/api/task021`
  - src/index.ts:211 (router schoolAuthMiddleware at /api/task021/school-integration)
  - src/index.ts:211 (router requireVerifiedSchoolContext at /api/task021/school-integration)
  - src/index.ts:211 (router task021SchoolIntegrationRoutes at /api/task021/school-integration)
- `/api/task022`
  - src/index.ts:214 (router schoolAuthMiddleware at /api/task022/curriculum-governance)
  - src/index.ts:214 (router requireVerifiedSchoolContext at /api/task022/curriculum-governance)
  - src/index.ts:214 (router task022CurriculumContentGovernanceRoutes at /api/task022/curriculum-governance)
- `/api/task023`
  - src/index.ts:220 (router schoolAuthMiddleware at /api/task023/deployment-readiness)
  - src/index.ts:220 (router requireVerifiedSchoolContext at /api/task023/deployment-readiness)
  - src/index.ts:220 (router task023DeploymentReadinessRoutes at /api/task023/deployment-readiness)
- `/api/task024`
  - src/index.ts:233 (router schoolAuthMiddleware at /api/task024/operations-readiness)
  - src/index.ts:233 (router requireVerifiedSchoolContext at /api/task024/operations-readiness)
  - src/index.ts:233 (router task024OperationsReadinessRoutes at /api/task024/operations-readiness)
- `/api/task025`
  - src/index.ts:245 (router schoolAuthMiddleware at /api/task025/pilot-readiness)
  - src/index.ts:245 (router requireVerifiedSchoolContext at /api/task025/pilot-readiness)
  - src/index.ts:245 (router task025ControlledPilotReadinessRoutes at /api/task025/pilot-readiness)
- `/api/task027`
  - src/index.ts:261 (router schoolAuthMiddleware at /api/task027/pilot-expansion-governance)
  - src/index.ts:261 (router requireVerifiedSchoolContext at /api/task027/pilot-expansion-governance)
  - src/index.ts:261 (router task027PilotExpansionGovernanceRoutes at /api/task027/pilot-expansion-governance)
- `/api/task028`
  - src/index.ts:273 (router schoolAuthMiddleware at /api/task028/controlled-expansion-execution)
  - src/index.ts:273 (router requireVerifiedSchoolContext at /api/task028/controlled-expansion-execution)
  - src/index.ts:273 (router task028ControlledExpansionExecutionRoutes at /api/task028/controlled-expansion-execution)
- `/api/task030`
  - src/index.ts:286 (router schoolAuthMiddleware at /api/task030/controlled-staging-rehearsal)
  - src/index.ts:286 (router requireVerifiedSchoolContext at /api/task030/controlled-staging-rehearsal)
  - src/index.ts:286 (router task030ControlledStagingRehearsalRoutes at /api/task030/controlled-staging-rehearsal)
- `/api/task031`
  - src/index.ts:295 (router schoolAuthMiddleware at /api/task031/staging-smoke-canary-readiness)
  - src/index.ts:295 (router requireVerifiedSchoolContext at /api/task031/staging-smoke-canary-readiness)
  - src/index.ts:295 (router task031StagingSmokeCanaryReadinessRoutes at /api/task031/staging-smoke-canary-readiness)
- `/api/task032`
  - src/index.ts:304 (router schoolAuthMiddleware at /api/task032/controlled-canary-activation)
  - src/index.ts:304 (router requireVerifiedSchoolContext at /api/task032/controlled-canary-activation)
  - src/index.ts:304 (router task032ControlledCanaryActivationRoutes at /api/task032/controlled-canary-activation)
- `/api/task033`
  - src/index.ts:313 (router schoolAuthMiddleware at /api/task033/controlled-canary-observation)
  - src/index.ts:313 (router requireVerifiedSchoolContext at /api/task033/controlled-canary-observation)
  - src/index.ts:313 (router task033ControlledCanaryObservationRoutes at /api/task033/controlled-canary-observation)
- `/api/task034`
  - src/index.ts:322 (router schoolAuthMiddleware at /api/task034/controlled-limited-rollout)
  - src/index.ts:322 (router requireVerifiedSchoolContext at /api/task034/controlled-limited-rollout)
  - src/index.ts:322 (router task034ControlledLimitedRolloutRoutes at /api/task034/controlled-limited-rollout)
- `/api/task035`
  - src/index.ts:331 (router schoolAuthMiddleware at /api/task035/school-wide-readiness)
  - src/index.ts:331 (router requireVerifiedSchoolContext at /api/task035/school-wide-readiness)
  - src/index.ts:331 (router task035SchoolWideReadinessRoutes at /api/task035/school-wide-readiness)
- `/api/task036`
  - src/index.ts:341 (router schoolAuthMiddleware at /api/task036/live-school-launch)
  - src/index.ts:341 (router requireVerifiedSchoolContext at /api/task036/live-school-launch)
  - src/index.ts:341 (router task036LiveSchoolLaunchRoutes at /api/task036/live-school-launch)
- `/api/task040`
  - src/index.ts:351 (router schoolAuthMiddleware at /api/task040/backend-freeze)
  - src/index.ts:351 (router requireVerifiedSchoolContext at /api/task040/backend-freeze)
  - src/index.ts:351 (router task040BackendFreezeRoutes at /api/task040/backend-freeze)
- `/api/tutor`
  - src/index.ts:201 (router schoolAuthMiddleware at /api/tutor)
  - src/index.ts:201 (router requireVerifiedSchoolContext at /api/tutor)
  - src/index.ts:201 (router tutorConversationRoutes at /api/tutor)
- `/api/video-learning-analytics`
  - src/index.ts:187 (router schoolAuthMiddleware at /api/video-learning-analytics)
  - src/index.ts:187 (router videoLearningAnalyticsRoutes at /api/video-learning-analytics)
- `/api/voice`
  - src/index.ts:192 (router schoolAuthMiddleware at /api/voice)
  - src/index.ts:192 (router rateLimitMiddleware at /api/voice)
  - src/index.ts:192 (router voiceRoutes at /api/voice)

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
