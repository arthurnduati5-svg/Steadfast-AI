# Question Bank Remaining Work Ledger

**Total tasks:** 13
**Blocking backend feature-complete:** 7
**Deferred (non-blocking):** 6

## A. Critical Correctness Repairs (4 tasks)

| # | ID | Priority | Type | Title | Evidence | Scope | Non-Scope |
|---|----|----------|------|-------|----------|-------|-----------|
| 1 | QB-RW-001 | CRITICAL | REPAIR | Wire Pkg 24 and 26 routes to real services | recoveryExecutionReadinessBoard.ts:27-29, recoveryCaseAdjudication.ts:5-7 | Replace stub endpoints with real service construction using in-memory repos | Do not add new routes or change service behavior |
| 2 | QB-RW-002 | CRITICAL | REPAIR | Fix Pkg 5 and 8 service DI to accept repos | marking/markingRunService.ts:41, marking-invocation/markingInvocationRequestService.ts:21 | Update constructors to accept repos via DI; update route files to pass in-memory repos | Do not change business logic |
| 3 | QB-RW-003 | CRITICAL | CORE_FEATURE | Implement exam paper assembly persistence | exam-paper/services/examPaperAssemblyService.ts | Make assembly service persist through repository | Do not add new assembly features |
| 4 | QB-RW-005 | HIGH | REPAIR | Fix Pkg 22 DI to use interface | closure/services/closureReadinessService.ts:18 | Change concrete class DI to interface DI | Do not change business logic |

## B. Ownership and Duplication Repairs (1 task)

| # | ID | Priority | Type | Title | Evidence | Scope |
|---|----|----------|------|-------|----------|-------|
| 5 | QB-RW-004 | HIGH | OWNERSHIP_CONSOLIDATION | Consolidate governance wrappers | SafetyService, AuditBridge, IdempotencyService in all 26 packages | Extract shared utility with policy injection |

## C. Core Missing Backend Capabilities (2 tasks)

| # | ID | Priority | Type | Title | Evidence | Scope |
|---|----|----------|------|-------|----------|-------|
| 6 | QB-RW-006 | MEDIUM | CORE_FEATURE | Implement curriculum validity check | question-bank/services/governedQuestionCommandService.ts:383 | Replace stub with real Prisma query |
| 7 | QB-RW-007 | MEDIUM | CORE_FEATURE | Implement concurrency control | assessment/assessmentCommandEnforcementService.ts:141 | Replace stub with real version check |

## D. Seeded End-to-End Scenario Work (1 task)

| # | ID | Priority | Type | Title | Evidence | Scope |
|---|----|----------|------|-------|----------|-------|
| 8 | QB-RW-009 | MEDIUM | SEEDED_SCENARIO | Wire all routes to Prisma for production | All routes use InMemoryRepositories | Add production config with Prisma repo instantiation |

## E. Feature-Complete Milestone (2 tasks, deferred)

| # | ID | Priority | Type | Title | Evidence | Scope |
|---|----|----------|------|-------|----------|-------|
| 9 | QB-RW-010 | LOW | FEATURE_COMPLETE_MILESTONE | Question quality analytics | Not built | New package for usage frequency, difficulty signals, quality review |
| 10 | QB-RW-011 | LOW | FEATURE_COMPLETE_MILESTONE | Psychometric and calibration foundation | Not built | New package for calibration, discrimination, confidence bands |

## F. Bulk Import (1 task)

| # | ID | Priority | Type | Title | Evidence | Scope |
|---|----|----------|------|-------|----------|-------|
| 8 | QB-RW-008 | LOW | CORE_FEATURE | Add bulk CSV/Excel import | No bulk import exists | Extend questionIngestionService |

## G. Deferred Work (3 tasks)

| # | ID | Priority | Type | Title | Evidence |
|---|----|----------|------|-------|----------|
| 11 | QB-RW-012 | LOW | DEFERRED_INTEGRATION | Live curriculum provider | Curriculum validity is stub |
| 12 | QB-RW-013 | LOW | DEFERRED_AI | AI question generation | Contracts exist, no AI provider |
| — | — | LOW | DEFERRED_FILE_PROCESSING | OCR/PDF/Word/image parsing | No file processing built |

## Summary

| Category | Count |
|----------|-------|
| Critical correctness repairs | 4 |
| Ownership consolidation | 1 |
| Core missing features | 2 |
| Bulk import | 1 |
| Seeded scenario | 1 |
| Feature milestone (deferred) | 2 |
| Deferred integration | 1 |
| Deferred AI | 1 |
| Deferred file processing | 1 |
| **Total** | **13** |
| **Blocking backend feature-complete** | **7** |

## Recommended Next Task

**QB-RW-001:** Wire Packages 24 and 26 routes to their real services (replace stub route handlers with real service construction)
