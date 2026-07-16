# Package 26 — Review Consensus and Priority Override Contract

## 1. Decision Codes

The following decision codes define what a reviewer can conclude about a queue item:

| Code | Meaning | Triggers |
|------|---------|----------|
| `confirm_priority` | Agree with current priority assessment | None |
| `recommend_lower_priority` | Priority should be lowered | May trigger priority override |
| `recommend_higher_priority` | Priority should be raised | May trigger priority override |
| `request_more_evidence` | Insufficient evidence to decide | Session → `needs_more_evidence` |
| `request_second_review` | Request another reviewer's opinion | Creates second review request |
| `recommend_escalation` | Case should be escalated | May trigger escalation disposition |
| `defer_review` | Defer review to later time | Session → `needs_more_evidence` |
| `block_for_governance` | Case needs governance review | Triggers governance block disposition |
| `return_to_triage` | Send back to triage | Triggers `return_to_triage` disposition |
| `no_change` | No action needed | None |

These codes are defined in `recoveryCaseAdjudicationContracts.ts:31` as `RecoveryCaseReviewerDecisionCode`.

## 2. Reviewer Positions

| Position | Description | Can Create |
|----------|-------------|------------|
| `primary` | First reviewer assigned to queue item | Decision draft, consensus record |
| `secondary` | Second reviewer (if required) | Decision draft, consensus record |
| `governance_resolver` | Role assigned to resolve disagreements or governance blocks | Decision draft, disagreement resolution draft |
| `quality_reviewer` | Reviewer assigned via quality sampling | Decision draft |

## 3. Second-Review Mandatory Triggers

A second review request must be created (status enforced via `requiresSecondReview` policy check) when ANY of the following conditions are true:

| Trigger | Explanation | Source |
|---------|-------------|--------|
| `critical_review` priority band | All cases in the highest priority band require second review | `ADJUDICATION_REQUIRES_SECOND_REVIEW` policy |
| Priority override proposed | Any recommendation to change priority band triggers mandatory second review | Policy check on decision code `recommend_lower_priority` or `recommend_higher_priority` |
| `block_for_governance` decision | Reviewer chose to block the case for governance review | Decision code |
| Escalation beyond `department_head` | Any recommendation that targets a role above department_head | Escalation policy |
| Primary reviewer explicitly requests | Primary reviewer selects `request_second_review` decision code | Decision code |
| Quality policy requires | Quality sampling policy may mandate second review for certain bands | Quality sampling policy |

## 4. Conflict Rules

| Rule | Enforcement |
|------|-------------|
| Personal conflict blocks reviewer | If `conflictType = declared_personal_conflict`, reviewer is blocked from continuing; `conflictStatus = blocked` |
| Primary and secondary must be different actors | Primary and secondary reviewer actorIds must differ for the same queue item session |
| Override requestor cannot approve own override | `createdByActorId` of override request must not equal the actorId of the approval action |
| Reviewer cannot resolve own disagreement | The `governance_resolver` for a disagreement must be a different actor than the primary or secondary reviewer |
| `system_job` cannot author reviewer decisions | `system_job` role is forbidden from creating decision drafts (only `createIntegrityDigest`, `evaluateChecklistStructure`, `calculateQualitySample`, `refreshSummary` are allowed for `system_job`) |

## 5. Consensus Rules

The consensus evaluation compares the primary reviewer's decision with the secondary reviewer's decision.

### Evaluation Algorithm

```
Input:
  primaryDecision.decisionCode   — the code selected by the primary reviewer
  primaryDecision.currentPriorityBand — the priority band at time of primary decision
  secondaryDecision.decisionCode — the code selected by the secondary reviewer
  secondaryDecision.currentPriorityBand — the priority band at time of secondary decision

Evaluation:
  IF primaryDecision.decisionCode === secondaryDecision.decisionCode
    AND primaryDecision.currentPriorityBand === secondaryDecision.currentPriorityBand
    THEN consensusStatus = 'consensus_reached'

  ELSE IF primaryDecision.decisionCode === secondaryDecision.decisionCode
    AND primaryDecision.currentPriorityBand !== secondaryDecision.currentPriorityBand
    THEN consensusStatus = 'partial_consensus'

  ELSE (primaryDecision.decisionCode !== secondaryDecision.decisionCode)
    THEN consensusStatus = 'disagreement'
```

### Consensus Statuses

| Status | Meaning |
|--------|---------|
| `consensus_reached` | Both reviewers agree on code AND band |
| `partial_consensus` | Same code, different band assessment |
| `disagreement` | Different decision codes |
| `needs_more_evidence` | Evaluation deferred pending additional evidence |
| `blocked` | Consensus evaluation blocked |
| `void` | Consensus record voided |

## 6. Disagreement Rules

When consensus evaluation yields `disagreement`:

1. **No winner is chosen** — the system never declares one reviewer correct over another
2. A `RecoveryCaseDisagreementResolutionDraftRecord` is created
3. The draft captures:
   - `reasonCodeComparisonJson` — structured comparison of primary vs secondary reason codes
   - `evidenceGapsJson` — identified gaps in evidence that could help resolve
   - `proposedGovernanceRole` — suggested role to resolve (e.g. `department_head`, `admin`)
   - `proposedResolutionOptionsJson` — possible paths (e.g. third reviewer, more evidence, escalation)
   - `safeDisagreementSummary` — human-readable summary
4. The resolution draft status progresses: `draft` → `review_ready` → `approved_for_future_use` | `blocked` | `suppressed` | `void`
5. `governance_resolver` position reviewers (distinct from primary and secondary) are responsible for resolving

## 7. Priority Override Rules

| Rule | Description |
|------|-------------|
| Records current score/band | `currentPriorityScore` and `currentPriorityBand` are snapshots from Pkg 25 at the time the override request is created |
| Never mutates Package 25 | The override request is governance metadata only — Pkg 25 `RecoveryCasePriorityAssessmentRecord` is never updated |
| Requestor cannot approve own | `createdByActorId !== approvingActorId` — enforced by policy |
| Approved for future use | An approved override (`approved_for_future_use` status) signals to a future execution package that a priority change should be applied |
| Override bands | Must be a valid `RecoveryCasePriorityBand`: `critical_review`, `high`, `normal`, `low`, `deferred` |
| Needs second review | Override requests automatically trigger a second-review requirement |
| Supporting evidence | May reference supporting decision IDs and evidence bundle IDs for audit |

## 8. Queue Disposition Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `retain_in_queue` | No action needed; item stays in queue | Consensus reached, no override, no escalation |
| `defer_for_more_evidence` | Needs more evidence before further action | Decision code `request_more_evidence` or `defer_review` |
| `second_review_required` | Second review is needed | Mandatory trigger activated |
| `priority_override_proposed` | A priority override has been proposed | Decision code `recommend_lower_priority` or `recommend_higher_priority` |
| `escalation_proposed` | Escalation has been proposed | Decision code `recommend_escalation` |
| `return_to_triage` | Case should go back to triage | Decision code `return_to_triage` |
| `governance_blocked` | Case is blocked for governance | Decision code `block_for_governance` |
| `archived_ready` | Case is fully adjudicated and ready for archival | Final disposition after all reviews complete |

## 9. Quality Sampling Formula

### Seed Construction

```
seed = `${schoolId}:${queueItemId}:${policyVersion}`
```

Where:
- `schoolId` — the school identifier (string)
- `queueItemId` — the queue item identifier (string)
- `policyVersion` — the quality sampling policy version constant

### Hash Computation

```
hash = SHA-256(seed)          // 64-character hex string
first8 = hash.substring(0, 8) // first 8 hex characters
bucket = parseInt(first8, 16) % 10000  // integer 0–9999
```

### Selection

```
IF priorityBand === 'critical_review'
  THEN selected = true
  ELSE selected = (bucket < sampleBasisPoints)

Where sampleBasisPoints is an integer 0–10000 representing basis points (0%–100%).
```

### Policy Versions

| Version Constant | Value |
|-----------------|-------|
| Adjudication governance policy | `RECOVERY_CASE_ADJUDICATION_POLICY_V1` |
| Quality sampling policy | `RECOVERY_CASE_ADJUDICATION_QUALITY_V1` |

### Worked Deterministic Example

```
schoolId = "sch-99"
queueItemId = "qi-77"
policyVersion = "RECOVERY_CASE_ADJUDICATION_QUALITY_V1"
priorityBand = "normal"
sampleBasisPoints = 5000

seed = "sch-99:qi-77:RECOVERY_CASE_ADJUDICATION_QUALITY_V1"
hash = SHA-256("sch-99:qi-77:RECOVERY_CASE_ADJUDICATION_QUALITY_V1")
     = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"

first8 = "a1b2c3d4"
bucket = parseInt("a1b2c3d4", 16) % 10000
     = 2713910740 % 10000
     = 074

Since priorityBand is "normal" (not "critical_review"):
selected = (74 < 5000) = true

Result: selected = true, bucket = 74, seed = "sch-99:qi-77:RECOVERY_CASE_ADJUDICATION_QUALITY_V1"
```

### Determinism Guarantees

| Property | Guarantee |
|----------|-----------|
| Same inputs produce same result | Yes — SHA-256 is deterministic |
| Different queue items produce different buckets | Yes — seed includes queueItemId |
| Different schools produce different results | Yes — seed includes schoolId |
| Different policy versions produce different results | Yes — seed includes policyVersion |
| `critical_review` always selected | Yes — hardcoded override regardless of basis points |
| 0 basis points selects no non-critical cases | Yes — bucket < 0 is never true |
| 10000 basis points selects all cases | Yes — bucket < 10000 is always true (bucket is 0–9999) |
| No queue order mutation | Yes — sampling is pure computation, no side effects on queue |
