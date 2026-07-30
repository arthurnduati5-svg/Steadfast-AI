# Probabilistic Mastery and Cognitive Diagnosis Foundation

## 1. Purpose

Build one complete, standalone, school-scoped Probabilistic Mastery and Cognitive Diagnosis foundation that converts validated learning evidence into concept-, skill-, and objective-level learner state with bounded probability, confidence, deterministic replay, role-safe projections, and cognitive diagnosis.

## 2. Canonical Mastery Ownership

The new probabilistic mastery module (`backend/src/services/probabilisticMastery*.ts`) is the canonical mastery estimation foundation. Existing services (`masteryService.ts`, `masteryScoringService.ts`, `masteryAggregationService.ts`, etc.) remain untouched as compatibility facades for their existing consumers.

## 3. Existing Services Reused

Formulas from the following services were consolidated into the evidence-weighted strategy:

- `masteryAggregationService.ts` — score formula (correct * 1.0, partial * 0.45, teach-back * 0.75, penalties for hints/stuck)
- `masteryScoringService.ts` — threshold-based level mapping, confidence derivation, no-one-shot-mastery rules
- `masteryInferenceService.ts` — evidence weighting pattern (positive/negative weights, misconception detection)
- `mastery/masteryEvidenceAggregationService.ts` — hint dependency and independence tracking
- `microMasteryService.ts` — label derivation from evidence score and thresholds

## 4. Duplicates Avoided

No new competing mastery system was created. The existing services remain unmodified and continue to serve their consumers.

## 5. Psychometric Model Unresolved

Bayesian Knowledge Tracing (BKT) and Item Response Theory (IRT) are NOT hard-coded. The strategy interface (`MasteryEstimationStrategy`) is model-agnostic, allowing future BKT, IRT, or calibrated school policies without rewriting contracts.

## 6. Strategy Interface

```typescript
interface MasteryEstimationStrategy {
  readonly strategyId: string;
  readonly strategyVersion: string;
  estimate(input: MasteryEstimationInput): MasteryEstimationResult;
}
```

## 7. Current Evidence-Weighted Strategy

The `EvidenceWeightedStrategy` consolidates existing repository formulas with:
- Source weight × confidence × independence × hint × explanation adjustments
- Diminishing returns formula: `newProb = prior + (delta * gap) / (1 + delta)`
- Recency decay via `exp(-ageDays / 60)`
- Retention and transfer signal boosts
- Bounded output in [0, 1]

## 8. Versioned Policy

`MasteryPolicyConfig` is explicit, validated, and versioned. The `createFixturePolicy()` produces a deterministic fixture policy with the version `fixture-policy-v1`. Policy validation enforces:
- All probabilities and weights are finite
- Normalized values in [0, 1]
- Monotonic label thresholds
- `mastered` threshold >= `near_mastery` threshold
- Decay cannot increase mastery
- Integrity risk cannot increase evidence weight
- Hint dependency cannot increase independence
- Missing/unknown policy or strategy fails closed

## 9. Mastery State

Internal state tracks: school, learner, target, curriculum version, probability of mastery (0-1), confidence (0-1), evidence count, decay risk, misconception tags, independence/hint dependency/retention/transfer scores, visible label, policy/strategy versions, revision counter.

## 10. Visible Labels

`not_started` → `introduced` → `attempted` → `developing` → `near_mastery` → `mastered` + `needs_revisit` (regression label). Thresholds are policy-driven, not hard-coded.

## 11. Evidence Normalization

`NormalizedMasteryEvidence` supports 11 evidence source types and includes only computation-relevant fields. No raw answers, chat, prompts, answer keys, or private data.

## 12. Weighting and Confidence

- Source type weight from policy
- Marking confidence adjustment (0.2 multiplier)
- Independence bonus (0.15)
- Hint dependency penalty (-0.25)
- Explanation quality adjustment (0 to 0.2)

## 13. Integrity-Risk Behavior

High integrity risk (>0.7) blocks automatic mastery upgrade. Rejected at validation level with typed error.

## 14. Independence and Hints

Independent evidence contributes more than hinted evidence. Hint dependency penalty reduces effective weight proportionally.

## 15. Explanation and Working

Strong explanations/teach-back increase effective weight within policy bounds (max 1.3×).

## 16. Decay and Needs Revisit

Configurable decay (enabled/disabled, rate per day, minimum probability, half-life). Decay never increases mastery. Old evidence fades. Mastered state can move to `needs_revisit` after policy-defined missed count or decay days.

## 17. Prerequisite Evaluation

`PrerequisiteReader` port consumes deterministic graph snapshots. Weak prerequisites cap mastery below threshold. Direct and transitive prerequisites are distinguished. Circular graphs fail safely.

## 18. Cognitive Diagnosis

Deterministic, non-AI diagnosis with statuses: insufficient_evidence, weak_prerequisite, repeated_misconception, evidence_quality_weak, decay_risk, conflicting_signals, stable_progress, uncertain, healthy. Includes reason codes, contributing evidence IDs, and prerequisite info. No learner trait inference.

## 19. Next-Best-Action Classification

Reuses existing action vocabulary: `diagnose`, `practice`, `remediate`, `review`, `advance`. Advisory only, no execution.

## 20. Repository and Atomicity

`InMemoryMasteryRepository` with school/learner isolation, defensive copies, evidence dedup tracking, change log storage, and test reset.

## 21. Replay and Recalculation

Deterministic replay from evidence history with dedup, supersession, and canonical sorting. Supported operations: consistent check, divergence detection, authorized repair.

## 22. School Isolation

All operations scoped by schoolId. Cross-school access denied at repository and validation levels.

## 23. Role and Projection Safety

- **Student**: visible label, safe progress message, safe prerequisite explanation, next action. NO raw probability, weights, or internal data.
- **Teacher**: probability, confidence, evidence count, diagnosis reasons, prerequisite IDs, next action. No raw learner content.
- **School admin/internal operator**: staff-safe view with policy diagnostics.
- **Parent/Unknown**: denied.

## 24. Deterministic Fixtures

25 fixture scenarios with two schools, deterministic IDs, fixed timestamps, and explicit seeding. No real student/school/curriculum data.

## 25. Focused Tests

88 tests across 4 files covering: contracts, policy validation, strategy estimation, evidence validation, no mastery inflation, evidence weighting, label derivation, cognitive diagnosis, prerequisites, repository atomicity, school/role projections, deterministic replay, decay, cross-school denial, and end-to-end domain flow.

## 26. Direct Regressions

No existing files were modified. All existing mastery services remain unchanged. No direct regression tests needed.

## 27. Exact Verification Commands

```powershell
cd backend
npx tsc -p tsconfig.probabilistic-mastery.json --noEmit --incremental false
npx vitest run "src/tests/probabilistic-mastery"
```

## 28. Deferred Integrations

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

## 29. Acceptance Boundary

- No Prisma work performed
- No database added
- No route added or mounted
- No live Learning Evidence integration
- No live Curriculum Knowledge Graph integration
- No AI used
- No production psychometric calibration claimed
- All existing services untouched
- Integration remains separately authorized work
