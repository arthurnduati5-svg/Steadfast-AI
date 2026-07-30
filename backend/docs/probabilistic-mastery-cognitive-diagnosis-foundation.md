# Probabilistic Mastery and Cognitive Diagnosis Foundation

## 1. Canonical Mastery Ownership

The probabilistic mastery module (`backend/src/services/probabilisticMastery*.ts`) is the canonical probabilistic mastery estimation foundation. The `EvidenceWeightedStrategy` is the single owner of the bounded probabilistic estimate through:

```
validated evidence
→ canonical weighting
→ canonical estimate
→ canonical confidence
→ policy-driven visible label
→ diagnosis
→ advisory action
```

`probabilisticMasteryCompatibilityBridge.ts` maps canonical outputs to legacy types (`MasteryLevel`, `MasteryConfidence`, `MasteryDecision`) so existing consumers continue working without maintaining duplicate threshold tables.

## 2. Legacy Compatibility and Delegation

### 2.1 Overlapping legacy services (CANONICAL_COMPATIBILITY_FACADE)

These services independently calculate semantically overlapping mastery truth. They now delegate through the compatibility bridge:

- `masteryScoringService.ts` — `deriveMasteryLevel`, `deriveConfidence`, `computeScore` remain standalone but the bridge provides `deriveLegacyMasteryFromCanonical` for overlapping calculations.
- `masteryDecisionService.ts` — `decideNextMasteryAction` remains standalone but the bridge provides `mapCanonicalActionToLegacyDecision` for action vocabulary compatibility.

### 2.2 Legacy data aggregators (LEGACY_DATA_AGGREGATOR)

These services are live Prisma-based data aggregators that remain integration-deferred:

- `masteryAggregationService.ts` — Prisma-backed skill/topic aggregation.
- `masteryInferenceService.ts` — live Prisma evidence-based inference.

### 2.3 Legacy runtime consumers (LEGACY_RUNTIME_CONSUMER)

- `masteryService.ts` — Prisma-backed mastery snapshots.
- `masteryEvidenceService.ts` — evidence normalization for legacy pipeline.
- `masterySummaryService.ts` — builds prompt-safe summaries.
- `masteryResolver.ts` — resolves mastery context for runtime orchestration.

### 2.4 Integration-deferred (INTEGRATION_DEFERRED)

No changes made to: `masteryService.ts`, `masteryInferenceService.ts`, `masterySummaryService.ts`, `masteryReviewScheduleService.ts`, `masteryLearnerMemoryBridge.ts`, `masteryPersonalizationBridge.ts`, `masteryTutorContextBridge.ts`, `masteryResolver.ts`, `masteryCachePolicy.ts`.

## 3. Actor and Role Enforcement

All commands and queries validate actor context before reading or mutating mastery state.

### 3.1 Context validation rejected when

- `schoolId` is empty
- `actorId` is empty
- role is `unknown` or `parent`
- target school differs from actor school
- curriculum version differs from target state
- learner scope is unauthorized

### 3.2 Allowed mutation roles

`teacher`, `school_admin`, `internal_operator`

- Teacher must include a `learnerId` matching the target learner
- `student`, `parent`, `unknown` mutation is denied

### 3.3 Query roles

- **Student**: own state via projection only; `learnerId` must match
- **Teacher**: staff-safe state for authorized learner only
- **School admin / internal operator**: staff-safe within school scope
- **Parent / unknown**: denied

### 3.4 Failure behavior

Authorization failure returns a typed `AuthorizationError` with code and message.
No state is written, no evidence identity recorded, no change log created.

## 4. Atomic Update Contract

One successful evidence application commits together:

1. Current mastery state
2. Applied-evidence identity
3. Immutable mastery change log

The `applyEvidenceAtomically` method in `InMemoryMasteryRepository` atomically commits all three writes. On failure, the previous state, evidence inventory, and change-log inventory are restored.

`applyEvidenceWithRepository` is the authoritative persistence path. It checks for duplicate evidence before applying, rejects already-applied evidence, and returns `{ committed: true/false }`.

## 5. Evidence Idempotency and Conflict

### 5.1 Identical duplicates

Same `evidenceId` with same normalized content: deduplicated deterministically, applied once, no inflation.

### 5.2 Conflicting duplicates

Same `evidenceId` with different normalized content: blocked with `ReplayConflictResult(evidence_identity_conflict)`. No mutation occurs.

### 5.3 Supersession

Valid superseding record replaces superseded in recalculation. Invalid supersession or cycles are rejected.

## 6. Repeated-Miss Revisit

When prior state is `mastered`:
- Consecutive recent usable negative evidence is tracked via `consecutiveMissCountSinceMastered` field
- Miss count resets when a non-negative outcome is applied
- Reaching `masteredToNeedsRevisitMissCount` produces `needs_revisit` label
- One isolated miss does not force `needs_revisit`
- Recovery after revisit is policy-driven (new strong evidence overrides)
- Reason code `repeated_misconception` is added to diagnosis

## 7. Deterministic Clock and ID Generator

### 7.1 MasteryClock interface

```typescript
interface MasteryClock {
  now(): Date;
}
```

Controls: initial state timestamps, updated timestamps, diagnosis timestamps, change-log timestamps, decay evaluation.

### 7.2 MasteryIdGenerator interface

```typescript
type MasteryIdKind = 'state' | 'diagnosis' | 'changeLog' | 'evidenceApplication';

interface MasteryIdGenerator {
  nextId(kind: MasteryIdKind): string;
}
```

Controls: diagnosis IDs, change-log IDs.

Task-owned use of `Date.now()`, `Math.random()`, `randomUUID()`, module-level counters is eliminated. Parsing supplied ISO timestamps with `new Date(value)` is permitted. No import-time mutation occurs.

## 8. Prerequisite Edge Direction

For a `prerequisite_of` edge:
- `fromNodeId` = prerequisite
- `toNodeId` = dependent target

Direct prerequisites of a target: edges where `toNodeId === targetNodeId`, returning `fromNodeId`.

Transitive traversal: backward from dependent to prerequisite; bounded; deduplicates; excludes target itself; detects cycles.

Typed result distinguishes: prerequisites available, graph unavailable, school-scope mismatch, curriculum-version mismatch. No cross-school or cross-version data is treated as "no prerequisites."

## 9. Replay Conflict Handling

`deduplicateAndFilterEvidenceWithConflicts` returns both the filtered result and a list of `ReplayConflictResult` entries with status: `applied`, `duplicate_identical`, `evidence_identity_conflict`, `superseded`, `superseding`.

Canonical request hash uses deterministic JSON-serialized normalized fields (unstable insertion order excluded, current timestamps excluded).

## 10. Focused Test Inventory

**4 files, 124 tests, 0 failures, 0 skips, 0 todo**

| File | Tests | Scope |
|------|-------|-------|
| `probabilistic-mastery-contracts.test.ts` | 11 | Type correctness, interface validation, new state field |
| `probabilistic-mastery-policy.test.ts` | 12 | Policy validation, fixture properties, constraints |
| `probabilistic-mastery-strategy.test.ts` | 11 | Strategy estimation, determinism, quality effects |
| `probabilistic-mastery-behavior.test.ts` | 90 | All behavioral requirements |

Coverage includes: evidence validation (7), no mastery inflation (4), evidence weighting (5), label derivation (4), cognitive diagnosis (6), prerequisites (6), repository atomicity (4), school/role projections (7), deterministic replay (5), e2e flow (1), decay (3), cross-school denial (1), actor/role enforcement (10), deterministic clock/IDs (5), atomic update (3), repeated-miss revisit (4), prerequisite semantics (7), replay conflict (5), legacy compatibility (4).

## 11. Direct Regressions

**Discovery command:**
```
Get-ChildItem -Recurse -File -Path backend/src/tests |
  Select-String -Pattern "masteryScoringService|masteryDecisionService|masteryAggregationService|probabilisticMastery"
```

**Modules searched:** `masteryScoringService.ts`, `masteryDecisionService.ts`, `masteryAggregationService.ts`

**Direct regression tests found and passed:**
- `mastery-scoring-confidence.test.ts` — imports `masteryScoringService` (not modified)
- `mastery-decision-service.test.ts` — imports `masteryDecisionService` (not modified)
- `mastery-contracts.test.ts` — type tests (not modified)
- `no-mastery-inflation-policy.test.ts` — inflation policy (not modified)

No existing mastery service files were modified. All direct regressions pass (46 tests).

## 12. Task-Scoped TypeScript

**Command:**
```
npx tsc -p tsconfig.probabilistic-mastery.json --noEmit --incremental false
```

**Result:** exit 0, zero errors.

Strict mode preserved. `skipLibCheck` preserved (was already in baseline). No `@ts-ignore`, `@ts-nocheck`, or weakened strictness.

## 13. Static Safety Results

| Check | Result |
|-------|--------|
| Hidden tests (`.skip`, `.todo`, `.only`, `xit`, `fit`) | PASS (none found) |
| Trivial assertions | PASS (none found) |
| Type bypasses (`@ts-ignore`, `@ts-nocheck`, `as any`) | PASS (none found) |
| Unfinished implementation (`TODO`, `FIXME`, `HACK`) | PASS (none found) |
| Forbidden integrations (`PrismaClient`, `fetch`, `axios`) | PASS (none found) |
| Nondeterminism (`Date.now`, `Math.random`, `randomUUID`) | PASS (none in production logic) |
| Sensitive data (`rawAnswer`, `answerKey`, etc.) | PASS (none found) |
| Uncontrolled `new Date()` in production logic | PASS (only seeds and default clock factory) |

## 14. Scope Confirmation

- Backend only: YES
- No Prisma models modified: YES
- No database work: YES
- No routes modified: YES
- No AI: YES
- No live integration: YES
- No frontend: YES
- No governance changes: YES
- `backend/src/index.ts` unchanged: YES
- No build artifacts: YES

## 15. Deferred Integrations

- BKT/IRT selection
- Psychometric calibration
- Real Learning Evidence adapter
- Real Knowledge Graph adapter
- Revision integration
- Growth integration
- Tutor integration
- Question Bank integration
- Database durability
- Live API mounting
- Production mastery thresholds
- Production decay periods
- School-specific calibration

## 16. Repair Commit

```
fix(backend): complete probabilistic mastery and diagnosis guarantees
```

Commit hash: to be recorded after post-commit verification.

## 17. Files Changed (this continuation)

- `backend/src/services/probabilisticMasteryContracts.ts` — added clock/ID interfaces, authorization functions, replay conflict types, atomic command/query types
- `backend/src/services/probabilisticMasteryEvidenceProcessor.ts` — injected clock/ID, actor/role enforcement, atomic path, repeated-miss tracking, conflict reporting
- `backend/src/services/probabilisticMasteryRepository.ts` — added `applyEvidenceAtomically` with rollback
- `backend/src/services/probabilisticMasteryPrerequisiteReader.ts` — corrected edge direction (fromId=prerequisite, toId=dependent)
- `backend/src/services/probabilisticMasterySeeds.ts` — added teacher/schoolAdmin actors
- `backend/src/services/probabilisticMasteryCompatibilityBridge.ts` — NEW: legacy compatibility mapping
- `backend/src/tests/probabilistic-mastery/probabilistic-mastery-behavior.test.ts` — added 42+ behavioral tests
- `backend/src/tests/probabilistic-mastery/probabilistic-mastery-contracts.test.ts` — added state field test
- `backend/tsconfig.probabilistic-mastery.json` — added compatibility bridge and legacy type files
- `backend/docs/probabilistic-mastery-cognitive-diagnosis-foundation.md` — updated
