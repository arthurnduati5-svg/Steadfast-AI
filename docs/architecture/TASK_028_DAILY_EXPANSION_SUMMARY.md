# Task 028 — Daily Expansion Summary

## Purpose

The Daily Expansion Summary is a generated report that aggregates evidence ledger entries for a given day. It provides a concise overview of the runtime's activity.

## Summary Contents

| Section | Source |
|---|---|
| Current state | State machine |
| Active cohorts | Cohort activation gate |
| Active learners | Learner access gate |
| Gate pass/denial counts | Evidence ledger |
| Health snapshot | Health metrics |
| Active incidents | Incident bridge |
| Rollback status | Rollback execution |

## Generation Rules

| Rule | Description |
|---|---|
| Generated once per day | At a configurable time |
| Based on evidence ledger | Uses only recorded metadata |
| Does not send anywhere | Stored locally, no real communication |
| Read via teacher oversight bridge | Accessible through read-only bridge |

## Scope Boundaries

| Capability | In Task 028? |
|---|---|
| Generate daily summary | **Yes** |
| Store summary in evidence ledger | **Yes** |
| Make summary readable via bridge | **Yes** |
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

Daily summary logic lives in `src/expansion/daily-summary.ts`.

## References

- `TASK_028_EXPANSION_EVIDENCE_LEDGER.md`
- `TASK_028_TEACHER_OVERSIGHT_BRIDGE.md`
- `TASK_028_EXPANSION_HEALTH_AND_INTERVENTION.md`
