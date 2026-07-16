# Question Bank Runtime, Data, Route, and Test Inventory

## Prisma Model Inventory (Question Bank)

**Total Question Bank models:** ~150 across 24 model families

| Model Family | Package | Count |
|-------------|---------|-------|
| QuestionBankItem + versions + parts | 2-3 | 12 |
| ExamBlueprint + drafts + selection | 4 | 8 |
| MarkingRun + review + override | 5 | 9 |
| ExamPaper + sections + variants | 6 | 10 |
| ExamDelivery + attempts + snapshots | 7 | 10 |
| MarkingInvocation + batches + links | 8 | 8 |
| ResultGovernance + release boundaries | 9 | 8 |
| ResultLearningEvidence + mastery | 10 | 8 |
| ResultRelease + audience projection | 11 | 9 |
| ResultDelivery + dispatch + receipts | 12 | 10 |
| ResultReportCard + templates + assembly | 13 | 11 |
| ResultReportCardExport + jobs + manifests | 14 | 10 |
| ResultReportCardAccess + grants + tokens | 15 | 11 |
| ResultFollowUp + escalation + plans | 16 | 11 |
| ResultRecovery + plans + checkpoints | 17 | 12 |
| RecoveryProgress + evaluations + rollups | 18 | 11 |
| RecoveryOutcome + decisions + criteria | 19 | 13 |
| RecoveryOutcomeAction + bundles + gates | 20 | 14 |
| RecoveryOutcomeExecutionSimulation + runs | 21 | 15 |
| RecoveryLifecycleClosure + handoff | 22 | 13 |
| RecoveryExecutionAuthorizationPreview | 23 | 15 |
| RecoveryExecutionReadinessBoard | 24 | 16 |
| RecoveryCaseTriage + queue + priority | 25 | 15 |
| RecoveryCaseAdjudication + sessions | 26 | 15 |

## Repository Inventory

| Package | Prisma Repository | InMemory Repository | Runtime Uses |
|---------|------------------|-------------------|-------------|
| 1 | — | InMemoryIdempotencyRepository, InMemoryAuditWriter | InMemory |
| 2-3 | prismaQuestionBankRepositories.ts | InMemoryQuestionBankRepositories.ts | InMemory |
| 4 | prismaExamBlueprintRepositories.ts | InMemoryExamBlueprintRepositories.ts | InMemory |
| 5 | prismaMarkingRepositories.ts | InMemoryMarkingRepositories.ts | InMemory (default in services) |
| 6 | prismaExamPaperRepositories.ts | InMemoryExamPaperRepositories.ts | InMemory |
| 7 | prismaExamDeliveryRepositories.ts | InMemoryExamDeliveryRepositories.ts | InMemory |
| 8 | prismaMarkingInvocationRepositories.ts | InMemoryMarkingInvocationRepositories.ts | InMemory (passed in routes) |
| 9 | prismaResultGovernanceRepositories.ts | InMemoryResultGovernanceRepositories.ts | InMemory |
| 10-16 | prismaResult*Repositories.ts | InMemoryResult*Repositories.ts | InMemory |
| 17-26 | prismaRecovery*Repositories.ts | InMemoryRecovery*Repositories.ts | InMemory |

## Service Inventory

| Package | Services | Service DI Pattern | Runtime Connection |
|---------|---------|-------------------|-------------------|
| 1 | 6 services (enforcement, idempotency, audit, concurrency, outbox, projection) | Interface DI | InMemory repos |
| 2-3 | 10 services | Interface DI | InMemory repos |
| 4 | 7 services | Interface DI | InMemory repos |
| 5 | 7 services | **Default to InMemory** (no constructor DI) | InMemory |
| 6 | 9 services | **No DI** (assembly never persists) | None |
| 7 | 10 services | Interface DI (all repos required) | InMemory |
| 8 | 10 services | Interface DI | InMemory |
| 9 | 9 services | Interface DI (no in-memory defaults) | InMemory |
| 10-16 | ~70 services total | Interface DI | InMemory |
| 17-26 | ~150 services total | Interface DI (except Pkg 22 uses concrete class) | InMemory |

## Route Inventory

All 24 route groups mounted at `/api/question-bank/*` in `backend/src/index.ts:360-452`.

All use `schoolAuthMiddleware` and `requireVerifiedSchoolContext`.

| Route | Base Path | Lines | Status |
|-------|-----------|-------|--------|
| questionBank.ts | /api/question-bank | 973 | Wired |
| examBlueprint.ts | /api/question-bank | — | Wired |
| marking.ts | /api/question-bank/marking | 253 | Wired (in-memory defaults) |
| examPaper.ts | /api/question-bank/exam-papers | — | Wired |
| examDelivery.ts | /api/question-bank/exam-delivery | — | Wired |
| markingInvocation.ts | /api/question-bank/marking-invocation | 344 | Wired |
| resultGovernance.ts | /api/question-bank/result-governance | — | Wired |
| resultLearningEvidence.ts | /api/question-bank/result-learning-evidence | — | Wired |
| resultRelease.ts | /api/question-bank/result-release | — | Wired |
| resultDelivery.ts | /api/question-bank/result-delivery | 377 | Wired |
| resultReportCard.ts | /api/question-bank/result-report-cards | — | Wired |
| resultReportCardExport.ts | /api/question-bank/result-report-card-export | — | Wired |
| resultReportCardAccess.ts | /api/question-bank/result-report-card-access | — | Wired |
| resultFollowUp.ts | /api/question-bank/result-follow-up | — | Wired |
| resultRecovery.ts | /api/question-bank/result-recovery | — | Wired |
| recoveryProgress.ts | /api/question-bank/recovery-progress | — | Wired |
| recoveryOutcome.ts | /api/question-bank/recovery-outcome | — | Wired |
| recoveryOutcomeAction.ts | /api/question-bank/recovery-outcome-action | — | Wired |
| recoveryOutcomeExecutionSimulation.ts | /api/question-bank/...simulation | — | Wired |
| recoveryLifecycleClosure.ts | /api/question-bank/recovery-lifecycle-closure | — | Wired |
| recoveryExecutionAuthorizationPreview.ts | /api/question-bank/...auth-preview | — | Wired |
| recoveryExecutionReadinessBoard.ts | /api/question-bank/...readiness-board | 627 | **Stubs only** |
| recoveryCaseTriage.ts | /api/question-bank/recovery-case-triage | — | Wired |
| recoveryCaseAdjudication.ts | /api/question-bank/...adjudication | 619 | **Stubs only** |

## Test Inventory

**Total Question Bank test files:** 250 across assessment domain
**Total Question Bank tests:** 1,784+ (across all packages 1-26)

### Test Quality Classification

| Type | Count | Found In |
|------|-------|---------|
| BEHAVIORAL_UNIT | Majority | All package test files exercise service methods with assertions |
| BEHAVIORAL_SERVICE | Many | Integration-style tests that wire services with in-memory repos |
| POLICE_AND_SAFETY | Common | Tests that verify policy enforcement, forbidden fields, role checks |
| STATIC_SOURCE_SCAN | Significant | "Routes and no duplication" test files use readFileSync + toContain for safety verification |
| STATE_MACHINE | Common | Lifecycle tests that cycle through status transitions |
| FAKE_OR_TRIVIAL | 0 | No expect(true).toBe(true), no .skip() found |

## Runtime Repository Construction

**ALL routes use InMemoryRepositories.** Prisma repositories exist and compile but are never instantiated at runtime.

## Migration Coverage

All ~419 Prisma models exist in a single `schema.prisma` file. No individual migration files checked.
