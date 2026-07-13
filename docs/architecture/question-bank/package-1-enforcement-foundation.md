# Package 1 — Enforcement Foundation

## 1. Scope

Package 1 creates the backend enforcement spine for the future Question Bank Intelligence Engine. It implements the reusable enforcement core — contracts, services, and tests — that later packages will use to build governed assessment commands.

## 2. What Was Implemented

- **Assessment Domain Boundary** at `backend/src/domains/assessment/` with modular subdirectories
- **Command Context Contract** (`assessmentCommandContext.ts`) — governed assessment command context with actorId, actorRole, schoolId, correlationId, causationId, idempotencyKey, source, policyVersionRefs, and optional fields
- **Policy Registry Foundation** (`assessmentPolicyRegistry.ts`) — registry supporting 13 policy families with MISSING/DISABLED/BLOCKED/DEFERRED/CONFIGURED statuses; missing policies fail closed
- **Projection Guard** (`assessmentProjectionGuard.ts`) — role-based field projection with 20 forbidden fields, per-role projection maps, and strip/assert utilities
- **Idempotency Foundation** (`assessmentIdempotencyService.ts`) — actor+school scoped idempotency with fingerprint conflict detection
- **Optimistic Concurrency** (`assessmentConcurrencyService.ts`) — expectedVersion assertion with VERSION_CONFLICT and MISSING_EXPECTED_VERSION results
- **Audit Event Foundation** (`assessmentAuditService.ts`) — append-only audit writer with metadata redaction
- **Outbox/Inbox Foundation** (`assessmentOutboxService.ts`) — payload validation (rejects forbidden fields), schema version requirement, idempotent inbox receipt
- **Durable Job Contracts** (`assessmentJobContracts.ts`) — contracts for future background assessment jobs
- **Enforcement Orchestrator** (`assessmentCommandEnforcementService.ts`) — combines context validation, policy lookup, projection check, idempotency check, audit write, and optional outbox write
- **In-Memory Test Repositories** — reusable in-memory implementations for idempotency, audit, outbox, inbox, and job repositories
- **Tests** (48 assertions) covering command context, policy registry, projection guard, idempotency, concurrency, audit, outbox/inbox, no-duplication contracts, and enforcement orchestrator

## 3. What Was Intentionally Not Implemented

- QuestionBankItem or QuestionVersion product behavior
- Exam draft generation
- Exam blueprinting
- Paper scheduling or release windows
- Marking or scoring engine
- Teacher review queue behavior
- Student challenge behavior
- Parent summary behavior
- OCR or scan processing
- Real AI generation or AI marking
- Frontend UI additions
- External school-system integration
- Expansion of `backend/src/routes/ai.ts`
- Duplication of existing auth, curriculum, mastery, revision, growth, or content-governance systems

## 4. Existing Systems Reused

- **Idempotency patterns** from `schoolIntegrationIdempotencyRepository.ts` and `safeLearningEvidenceIdempotencyService.ts` — assessment idempotency wraps similar patterns
- **Audit infrastructure** from `durableAuditEventContracts.ts` and `backendAuditEventService.ts` — assessment audit reuses redaction concepts and append-only patterns
- **Policy decision patterns** from existing `PolicyDecision` types across the codebase — assessment policy registry is a new generic registry
- **Forbidden field detection** patterns from existing domain-specific forbidden field validators — centralized into a single registry
- **correlationId/causationId** conventions already used across the codebase

## 5. New Assessment Domain Boundary

```
backend/src/domains/assessment/
  contracts/
    assessmentCommandContext.ts
    assessmentPolicyContracts.ts
    assessmentProjectionContracts.ts
    assessmentIdempotencyContracts.ts
    assessmentConcurrencyContracts.ts
    assessmentAuditContracts.ts
    assessmentOutboxContracts.ts
    assessmentJobContracts.ts
  policies/
    assessmentPolicyRegistry.ts
  projections/
    assessmentProjectionGuard.ts
  idempotency/
    assessmentIdempotencyService.ts
  concurrency/
    assessmentConcurrencyService.ts
  audit/
    assessmentAuditService.ts
  outbox/
    assessmentOutboxService.ts
  jobs/
    (contracts only)
  repositories/
    inMemoryAssessmentRepositories.ts
  tests/
    package-1-enforcement-foundation.test.ts
  index.ts
```

## 6. Enforcement Flow

1. Validate command context (schoolId, actorId, actorRole, correlationId required; idempotencyKey required for API)
2. Check required policies against registry (missing/disables/blocked → fail closed)
3. Check projection role for forbidden fields
4. Check idempotency (same key + different fingerprint → conflict)
5. Check optimistic concurrency (expectedVersion vs actualVersion)
6. Write audit event (fail closed if audit write fails)
7. Publish outbox event (if configured, fail closed on write failure)
8. Return enforcement result

## 7. Policy Registry Behavior

| Status | allowed | Behavior |
|--------|---------|----------|
| CONFIGURED | true | Operation proceeds |
| MISSING | false | Blocked — no default invented |
| DISABLED | false | Blocked |
| BLOCKED | false | Blocked |
| DEFERRED | false | Blocked |

## 8. Safe Block Behavior

All blocked states produce:
- `allowed = false`
- Machine-readable `reasonCode`
- `safeMessage` with no secrets, answer keys, raw student data, hidden reasoning, or internal stack traces
- `missingPolicyKeys` for MISSING status
- `policyVersionRef` tracking

## 9. Idempotency Behavior

- Same actor + school + commandType + idempotencyKey + same fingerprint → accepted replay
- Same key + different fingerprint → conflict
- Same key cannot replay across schools
- Same key cannot replay across actors
- Missing idempotencyKey blocks governed API mutations

## 10. Audit/Outbox Behavior

- Audit metadata redacted for forbidden fields (replaced with `[REDACTED]`)
- Audit write failure blocks governed transitions when audit is required
- Outbox payload validated against forbidden fields (rejected with clear error)
- Event schemaVersion is required
- Duplicate inbox receipt returns idempotent response
- Outbox write failure blocks transition when outbox is required

## 11. Tests Run

All 48 tests pass:

- Command Context: 6 tests
- Policy Registry: 6 tests
- Projection Guard: 7 tests
- Idempotency: 5 tests
- Concurrency: 4 tests
- Audit: 4 tests
- Outbox/Inbox: 6 tests
- No-Duplication Contract: 4 tests
- Enforcement Orchestrator: 6 tests

## 12. Remaining Blockers for Package 2

1. Prisma-backed repositories (currently in-memory only)
2. Connection to real school policy configuration
3. Express health/diagnostic endpoint for the assessment domain
4. Integration tests with wired services
5. Full question bank domain contracts (QuestionBankItem, QuestionVersion, etc.)

## 13. No-Duplication Proof

- Assessment domain does not import React, Next.js, or frontend modules
- Assessment domain does not import OpenAI or Pinecone directly
- No `.tsx` files exist in the domain
- No routes were added to `backend/src/routes/ai.ts`
- No Prisma models were added
- Existing school auth, curriculum, mastery, revision, growth, and content-governance systems were not duplicated
