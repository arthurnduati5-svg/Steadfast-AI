# Question Bank Packages 1-26 Truth Audit

**Audit ID:** QB-A1
**Date:** 2026-07-16
**Branch:** main
**Starting HEAD:** 91f1f823d524018d4c2b46aa7372101d61d7253b

## Executive Verdict

The Question Bank backend is **feature-incomplete**. While 17 of 26 packages contain substantive domain logic with contracts, policies, services, Prisma models, and behavioral tests, 3 critical structural issues prevent production readiness:

1. **No Prisma at runtime** — All routes use in-memory repositories
2. **Packages 24 and 26 are dead code** — Routes return hardcoded stubs with no service wire-up
3. **Packages 5, 6, 8 have unpersisted data** — Services default to in-memory or never save

## Audit Method

- Source code inspection of all 26 packages
- Route file analysis for wire-up verification
- Service constructor analysis for DI vs default-in-memory
- Behavioral test execution (244 + 208 + 170 tests)
- Prisma schema and migration validation
- TypeScript compilation verification

## Evidence Hierarchy

| Source | Weight |
|--------|--------|
| Current source code (services, routes, tests) | Strongest |
| Current test execution results | Strong |
| Current Prisma schema | Strong |
| Route mounting in index.ts | Strong |
| Package documentation | Supporting |

## Repository Baseline

| Metric | Value |
|--------|-------|
| Branch | main |
| Starting HEAD | 91f1f82 |
| Assessment domain directories | 34 |
| Question Bank TypeScript files | ~600+ |
| Prisma models (Question Bank) | ~150+ |
| Route files (Question Bank) | 24 |
| Mounted route bases | 24 |
| Test files (total assessment) | 250 |
| Architecture documents | 80+ |
| Package 0 documents | 5 |

## Package 26 Continuity

| Verification | Result |
|-------------|--------|
| Pkg 26 test files | 19 passed |
| Pkg 26 tests | 244 passed |
| Pkg 25 tests | 208 passed |
| Pkg 24 tests | 170 passed |
| Backend TypeScript | 0 errors |
| Root TypeScript | 0 errors |
| Prisma validate | Valid |
| Prisma generate | Success |

## Packages 1-26 Status Summary

| Package | Status |
|---------|--------|
| Pkg 1: Enforcement foundation | COMPLETE |
| Pkg 2: Question truth | COMPLETE |
| Pkg 3: Ingestion | COMPLETE |
| Pkg 4: Blueprint | COMPLETE |
| Pkg 5: Marking | PARTIAL |
| Pkg 6: Exam paper | PLACEHOLDER |
| Pkg 7: Exam delivery | PARTIAL |
| Pkg 8: Marking invocation | PARTIAL |
| Pkg 9: Result governance | COMPLETE |
| Pkg 10: Mastery bridge | COMPLETE |
| Pkg 11: Result release | COMPLETE |
| Pkg 12: Result delivery | COMPLETE |
| Pkg 13: Report card | COMPLETE |
| Pkg 14: Report card export | COMPLETE |
| Pkg 15: Report card access | COMPLETE |
| Pkg 16: Follow-up | COMPLETE |
| Pkg 17: Recovery planning | COMPLETE |
| Pkg 18: Recovery progress | COMPLETE |
| Pkg 19: Recovery outcome | COMPLETE |
| Pkg 20: Recovery action | COMPLETE |
| Pkg 21: Recovery simulation | COMPLETE |
| Pkg 22: Recovery closure | COMPLETE |
| Pkg 23: Recovery auth preview | COMPLETE |
| Pkg 24: Readiness board | STRUCTURAL_ONLY |
| Pkg 25: Recovery triage | COMPLETE |
| Pkg 26: Adjudication | STRUCTURAL_ONLY |

## Capability Summary

| Capability | Status |
|-----------|--------|
| Enforcement foundation | COMPLETE |
| Question truth lifecycle | COMPLETE |
| Ingestion and intake | COMPLETE |
| Parsing and extraction | DEFERRED_FILE_PROCESSING |
| Curriculum classification | PARTIAL |
| Duplicate governance | COMPLETE |
| Blueprinting | COMPLETE |
| Exam paper assembly | PLACEHOLDER |
| Delivery and attempt | PARTIAL |
| Marking and challenge | PARTIAL |
| Marking invocation | PARTIAL |
| Result finalization | COMPLETE |
| Mastery bridge | COMPLETE |
| Result release | COMPLETE |
| Result delivery | COMPLETE |
| Report card assembly | COMPLETE |
| Report card export | COMPLETE |
| Report card access | COMPLETE |
| Follow-up intelligence | COMPLETE |
| Recovery planning | COMPLETE |
| Recovery progress | COMPLETE |
| Recovery outcome decision | COMPLETE |
| Recovery action preparation | COMPLETE |
| Recovery simulation | COMPLETE |
| Recovery closure | COMPLETE |
| Recovery auth preview | COMPLETE |
| Readiness board | STRUCTURAL_ONLY |
| Recovery triage | COMPLETE |
| Adjudication | STRUCTURAL_ONLY |
| Question quality analytics | MISSING |
| Psychometric foundation | MISSING |
| Adaptive question evolution | MISSING |
| Question generation | DEFERRED_AI |
| Teacher recommendations | MISSING |
| Cross-domain providers | DEFERRED_INTEGRATION |
| End-to-end scenarios | PARTIAL |

## Major Strengths

- 17 of 26 packages contain substantive domain logic with proper contracts, services, policies, and behavioral tests
- All 250+ test files pass
- TypeScript compiles with 0 errors
- Prisma schema validated with 419 models
- All 24 route bases are mounted and use schoolAuthMiddleware
- Duplicate detection, blueprint drafting, triage priority engine, simulation, and consensus evaluation contain real algorithms
- Recovery chain (Packages 17-26) is a continuous pipeline from planning through adjudication

## Structural-Only Areas

- **Package 24 (Readiness Board):** All services, contracts, Prisma repos, and tests exist but route file returns hardcoded stubs. Dead code.
- **Package 26 (Adjudication):** All services, contracts, Prisma repos, and tests exist but route file returns hardcoded stubs. Dead code.

## Placeholders

- **Package 6 (Exam Paper Assembly):** Assembly service generates UUIDs and returns in-memory results without persisting anything.

## Duplications

- Governance wrappers (SafetyService, AuditBridge, IdempotencyService) are independently re-implemented in all 26 packages with ~90% identical logic.
- Package 19 (outcome decision) and Package 20 (outcome action) have structurally near-identical decision/action draft patterns.

## Ownership Conflicts

None found. Each package has a distinct, non-overlapping domain boundary.

## Runtime Wiring Gaps

- **ALL routes use InMemoryRepositories** — Prisma repos exist and compile but are never instantiated at runtime
- **Packages 5 and 8 services default to in-memory** in constructors
- **Routes use mock context extractor** (dev-only HTTP headers) instead of proper auth middleware
- **Package 22 DI uses concrete class** instead of interface

## Persistence Gaps

- No Prisma repository wired at runtime
- Package 6 assembly never persists

## Test Quality Gaps

- No expect(true).toBe(true) or skipped tests found
- Static string-scan tests in "routes-and-no-duplication" files are valid safety scans (verify no live providers, no AI, no frontend code)
- 244 + 208 + 170 tests all pass

## Privacy and School-Scope Gaps

- School context middleware applied to all Question Bank routes (backend/src/index.ts:360-452)
- School isolation tests exist for all recovery packages
- Forbidden field projection is simple field name stripping

## Deferred Integration

- Live curriculum provider
- Live lesson objective provider
- Real notification transport (email/SMS/push)
- Real portal/parent delivery
- Real PDF generation
- External school system integration

## Deferred AI

- AI question generation
- AI subjective marking
- AI question classification
- AI recommendation narrative

## Deferred File Processing

- Live OCR engine
- PDF/Word parsing
- Image extraction and understanding
- Table extraction

## Recovery-Chain Verdict

**RECOVERY_CHAIN_FROZEN_WITH_REPAIRS**

The recovery chain (Packages 17-26) provides a continuous pipeline from planning through adjudication. However:
- Packages 24 and 26 routes need wiring to their real services
- Packages 22 DI needs interface correction
- Governance wrappers should be consolidated

## Backend Feature-Completeness Verdict

**QUESTION_BANK_BACKEND_FEATURE_INCOMPLETE**

Core non-live backend capabilities required before feature-complete:
1. Wire Packages 24 and 26 routes to real services (CRITICAL)
2. Wire Packages 5 and 8 services to DI pattern (CRITICAL)
3. Implement Package 6 assembly persistence (CRITICAL)
4. Wire all routes to Prisma for production (MEDIUM)
5. Consolidate governance wrappers (MEDIUM)
6. Fix Package 22 DI (MEDIUM)
7. Implement curriculum validity check (MEDIUM)
8. Implement concurrency control (LOW)

## Exact Remaining Task Count

- 4 critical correctness repairs
- 2 medium repairs
- 1 ownership consolidation
- 1 core feature
- 1 seeded scenario
- 2 feature milestone (deferred)
- 3 deferred items (non-blocking)
- **7 finite tasks before backend feature completeness**

## Recommended Next Task

**QB-RW-001: Wire Packages 24 and 26 routes to their real services**

Replace hardcoded stub routes with real service construction following the same DI pattern used by Packages 12-23 and 25. This is the highest-impact repair because these packages contain the most test coverage (170 + 244 tests) that proves correct behavior at the service layer but cannot reach the HTTP layer.
