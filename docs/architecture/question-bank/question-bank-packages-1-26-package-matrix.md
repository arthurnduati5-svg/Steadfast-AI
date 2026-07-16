# Question Bank Packages 1-26 Package Matrix

| # | Package | Feature Commit | Closure Commits | Domain Path | Prisma Models | Route File | Route Base | Test Files | Test Count | Status |
|---|---------|---------------|----------------|-------------|---------------|------------|------------|------------|------------|--------|
| 1 | Enforcement foundation | c1610ef | — | assessment/contracts, policies, idempotency, audit, concurrency, outbox, projections | 0 | questionBank.ts | /api/question-bank | 1 | 56 | COMPLETE |
| 2 | Question truth | 71d0291 | — | question-bank | 12 | questionBank.ts | /api/question-bank | 2 | 87 | COMPLETE |
| 3 | Ingestion | 626520d | — | question-bank | 2 | questionBank.ts | /api/question-bank | 2 | 34 | COMPLETE |
| 4 | Blueprint/draft | f0c9089 | — | exam-blueprint | 8 | examBlueprint.ts | /api/question-bank | 4 | 72 | COMPLETE |
| 5 | Marking | d82846d | 70f8a73 | marking | 9 | marking.ts | /api/question-bank/marking | 2 | 45 | PARTIAL |
| 6 | Exam paper | 3a39c4a | f990e8d | exam-paper | 10 | examPaper.ts | /api/question-bank/exam-papers | 1 | 28 | PLACEHOLDER |
| 7 | Exam delivery | 6f7a6ec | 4ac9048, f3a0c5e | exam-delivery | 10 | examDelivery.ts | /api/question-bank/exam-delivery | 2 | 52 | PARTIAL |
| 8 | Marking invocation | e7ac058 | — | marking-invocation | 8 | markingInvocation.ts | /api/question-bank/marking-invocation | 2 | 48 | PARTIAL |
| 9 | Result governance | 3fa30df | — | result-governance | 8 | resultGovernance.ts | /api/question-bank/result-governance | 2 | 64 | COMPLETE |
| 10 | Mastery bridge | 2865831 | 44eb2a9 | result-learning-evidence | 8 | resultLearningEvidence.ts | /api/question-bank/result-learning-evidence | 1 | 48 | COMPLETE |
| 11 | Result release | d3e6510 | 7895426 | result-release | 9 | resultRelease.ts | /api/question-bank/result-release | 1 | 52 | COMPLETE |
| 12 | Result delivery | 35e5522 | 5a40281 | result-delivery | 10 | resultDelivery.ts | /api/question-bank/result-delivery | 1 | 56 | COMPLETE |
| 13 | Report card | cbda4ff | — | result-report-card | 11 | resultReportCard.ts | /api/question-bank/result-report-cards | 1 | 52 | COMPLETE |
| 14 | Report card export | deb8fb9 | — | result-report-card-export | 10 | resultReportCardExport.ts | /api/question-bank/result-report-card-export | 3 | 64 | COMPLETE |
| 15 | Report card access | d61b768 | — | result-report-card-access | 11 | resultReportCardAccess.ts | /api/question-bank/result-report-card-access | 2 | 56 | COMPLETE |
| 16 | Follow-up | 8a6b824 | — | result-follow-up | 11 | resultFollowUp.ts | /api/question-bank/result-follow-up | 2 | 52 | COMPLETE |
| 17 | Recovery planning | 9c1a1a6 | — | result-recovery | 12 | resultRecovery.ts | /api/question-bank/result-recovery | 1 | 48 | COMPLETE |
| 18 | Recovery progress | cb8c0b8 | 4ef2fb2 | recovery-progress | 11 | recoveryProgress.ts | /api/question-bank/recovery-progress | 1 | 48 | COMPLETE |
| 19 | Recovery outcome | 7ac57f6 | 1294cd1 | recovery-outcome | 13 | recoveryOutcome.ts | /api/question-bank/recovery-outcome | 1 | 52 | COMPLETE |
| 20 | Recovery action | c318680 | 44054d3 | recovery-outcome-action | 14 | recoveryOutcomeAction.ts | /api/question-bank/recovery-outcome-action | 1 | 56 | COMPLETE |
| 21 | Recovery simulation | 5cceeb3 | 5e83395, 0f27e52 | recovery-outcome-execution-simulation | 15 | recoveryOutcomeExecutionSimulation.ts | /api/question-bank/recovery-outcome-execution-simulation | 1 | 64 | COMPLETE |
| 22 | Recovery closure | 72e5869 | 08cefc8 | recovery-lifecycle-closure | 13 | recoveryLifecycleClosure.ts | /api/question-bank/recovery-lifecycle-closure | 1 | 56 | COMPLETE |
| 23 | Auth preview | bb45956 | 9a32709, 78ebd36 | recovery-execution-authorization-preview | 15 | recoveryExecutionAuthorizationPreview.ts | /api/question-bank/recovery-execution-authorization-preview | 1 | 64 | COMPLETE |
| 24 | Readiness board | 45a7df9 | 851d21b, 10888ee, 7fde9ac, e671316 | recovery-execution-readiness-board | 16 | recoveryExecutionReadinessBoard.ts | /api/question-bank/recovery-execution-readiness-board | 2 | 170 | STRUCTURAL_ONLY |
| 25 | Triage priority | 1f8ba6c | 58bbfb3 | recovery-case-triage | 15 | recoveryCaseTriage.ts | /api/question-bank/recovery-case-triage | 3 | 208 | COMPLETE |
| 26 | Adjudication | c04817a | — | recovery-case-adjudication | 15 | recoveryCaseAdjudication.ts | /api/question-bank/recovery-case-adjudication | 19 | 244 | STRUCTURAL_ONLY |
