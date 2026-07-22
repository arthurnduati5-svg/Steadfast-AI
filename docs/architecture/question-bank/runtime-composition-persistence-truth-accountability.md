# Question Bank Runtime Composition + Persistence Truth — Accountability Record

## Commit History (top of main)
```
c8f8f2d fix(qbank): finalize runtime composition + persistence truth for packages 5/6/8/22/24/26
bf8eab9 fix(qbank): remove Date.now() variantCode, replace dynamic import with static import
d8f843b fix(task-040): remove synthetic success from Package 6 routes, fix skipped tests, resolve path errors + Vite duplicate key warnings
```

## Scope
Finalize runtime-composition infrastructure and persistence-truth enforcement for assessment packages 5 (marking), 6 (exam-paper), 8 (marking-invocation), 22 (recovery-lifecycle-closure), 24 (recovery-execution-readiness-board), and 26 (recovery-case-adjudication).

## What Was Delivered

### 1. Runtime Composition Graph
- `backend/src/domains/assessment/runtime/questionBankRuntimeComposition.ts` — canonical composition graph for all 6 packages
- `backend/src/domains/assessment/runtime/questionBankRepositoryMode.ts` — env-based repository mode resolver (`QBANK_REPO_MODE`)
- `backend/src/domains/assessment/runtime/questionBankRuntimeContracts.ts` — mode types, error constants
- Tests: 2 files, 19 tests covering mode resolution, build/getRepositories lifecycle, singleton guarantee

### 2. Exam-Paper Persistence Contracts
- `backend/src/domains/assessment/exam-paper/contracts/examPaperAssemblyPersistenceContracts.ts` — `IExamPaperAssemblyPersistence` interface
- `backend/src/domains/assessment/exam-paper/services/inMemoryExamPaperAssemblyPersistence.ts` — in-memory implementation
- `backend/src/domains/assessment/exam-paper/services/prismaExamPaperAssemblyPersistence.ts` — Prisma implementation

### 3. DI-Based Route Migration
6 routes refactored from direct `new InMemory...Repository()` to dependency injection via `composeRuntime()`:
- `backend/src/routes/marking.ts`
- `backend/src/routes/markingInvocation.ts`
- `backend/src/routes/examPaper.ts` (prior commit)
- `backend/src/routes/recoveryLifecycleClosure.ts`
- `backend/src/routes/recoveryExecutionReadinessBoard.ts`
- `backend/src/routes/recoveryCaseAdjudication.ts`

### 4. Service Wiring
Domain services modified to require explicit repository/persistence injection (no hidden defaults):
- `markingRunService.ts` — requires `IMarkingRunRepository`, `IMarkingResultVersionRepository`
- `markingInvocationRequestService.ts` — requires `IMarkingInvocationRequestRepository`
- `examPaperAssemblyService.ts` — requires `IExamPaperAssemblyPersistence`
- 5 recovery-execution-readiness-board services
- 11 recovery-lifecycle-closure services

### 5. Test Bypass Removal
- `safety-and-observability.contract.test.ts` — removed 3 `if (!existsSync(fp)) return;`
- `task-016-no-live-integration.contract.test.ts` — removed 7 `if (!fs.existsSync(fullPath)) return;`

### 6. Task 040 Root Repair
- `task-040-freeze-manifest-service.test.ts` — 6 behavioral tests, all pass
- `task-034-task033-proof-loader.test.ts` — 14 tests, all pass
- `task-034-report-truth-smoke.test.ts` — 8 tests, all pass
- Cross-CWD proof passes from both repository root and `backend/` directory

## Verification Gates
| Gate | Result |
|---|---|
| TypeScript (`npx tsc --noEmit --incremental false`) | 0 errors |
| Prisma validate | Valid |
| Prisma generate | Generated |
| Full test suite (2,518 files) | 39,770 passed |
| Runtime composition tests | 19 passed |
| Domain tests (packages 5/6/8/22/24/26) | 862 passed |
| Post-commit TypeScript | 0 errors |
| Post-commit Prisma validate | Valid |
| Post-commit domain tests | 881 passed |

## Sentinel
`STEADFAST_QBANK_RUNTIME_COMPOSITION_PERSISTENCE_TRUTH_ACCEPTED_READY`
