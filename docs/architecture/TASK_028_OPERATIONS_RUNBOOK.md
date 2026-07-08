# Task 028 — Operations Runbook

## Purpose

Operations runbook for the Controlled Expansion Execution Runtime. Covers startup, monitoring, incidents, and completion.

## 1. Prerequisites

- Task 027 governance approval proof must exist
- Approved expansion plan must be available
- System must be in `PendingGovernanceApproval` state

## 2. Startup Sequence

```
1. Load governance approval proof
2. Verify proof checks (see TASK_027_GOVERNANCE_DEPENDENCY)
3. Load approved expansion plan
4. Validate allowed fields / reject forbidden fields
5. Initialize evidence ledger
6. Initialize health monitor
7. Initialize teacher oversight bridge
8. Transition to Approved state
```

## 3. Activation Sequence

```
1. Run cohort activation gate for each target cohort
2. If gate passes, transition cohort to active
3. Record gate result to evidence ledger
4. Transition runtime to Activating -> Active
```

## 4. Monitoring

- Health snapshots are taken every 60 seconds
- Evidence ledger is append-only
- Teacher oversight bridge provides read-only access

## 5. Incident Response

| Symptom | Action |
|---|---|
| Gate denial rate > 10% | Investigate plan configuration |
| Health threshold violated | Check health snapshot details |
| Runtime guard violation | Review incident details |
| Teacher oversight offline | Check bridge connectivity |

## 6. Rollback Procedure

```
1. Confirm rollback command received
2. Lock runtime state
3. Revoke all expanded learner access
4. Deactivate all expanded cohorts
5. Record rollback evidence
6. Transition to RolledBack state
```

## 7. Completion Procedure

```
1. Verify all planned cohorts activated
2. Verify zero active incidents
3. Verify all health metrics within thresholds
4. Run completion review
5. If safeToStartTask029, hand off to Task 029
```

## 8. Troubleshooting

| Issue | Resolution |
|---|---|
| Proof verification fails | Obtain new governance proof from Task 027 |
| Plan contains forbidden fields | Request governance to remove them |
| Gate consistently denies | Check plan configuration and system state |
| Incident cannot resolve | Execute rollback |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Operations runbook | **Yes** |
| Startup/activation/monitoring procedures | **Yes** |
| Incident/rollback/completion procedures | **Yes** |
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

## References

- All `TASK_028_*` architecture documents
- `TASK_028_HANDOFF.md`
