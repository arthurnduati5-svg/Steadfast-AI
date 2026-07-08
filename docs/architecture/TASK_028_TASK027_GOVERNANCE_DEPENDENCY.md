# Task 028 — Task 027 Governance Dependency

## Purpose

Task 028 **cannot begin** without an explicit governance approval proof from Task 027. This document defines the proof checks required before the runtime transitions from `PendingGovernanceApproval` to `Approved`.

## Required Proof Checks

| Check | Description |
|---|---|
| `governanceApprovalToken` | Signed token from Task 027 governance |
| `approvedExpansionPlanHash` | SHA-256 hash of the approved plan |
| `approvalTimestamp` | ISO 8601 timestamp of approval |
| `approvalSignature` | Cryptographic signature verifying authenticity |
| `planVersionId` | Version identifier of the approved plan |

## Transition Rule

The runtime **must** verify all proof checks pass. If any check fails, the runtime stays in `PendingGovernanceApproval` and logs the failure as evidence.

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Verify governance proof | **Yes** |
| Reject unapproved plans | **Yes** |
| Build Task 029 operations console | **No** |
| Build staging rehearsal environment | **No** |
| Build canary analysis | **No** |
| Build rollout orchestration | **No** |
| Build school-wide launch | **No** |
| Build frontend UI | **No** |
| Send real communication | **No** |
| Deploy to production | **No** |
| Call live AI models | **No** |
| Write live school connectors | **No** |

## Implementation

Proof verification logic resides in `src/expansion/governance-proof.ts`.

## References

- `TASK_028_CONTROLLED_EXPANSION_EXECUTION_RUNTIME.md`
- `TASK_028_APPROVED_EXPANSION_PLAN.md`
