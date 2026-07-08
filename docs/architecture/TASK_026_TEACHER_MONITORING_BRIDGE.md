# Task 026 — Teacher Monitoring Bridge

## Purpose

Provide a simulated monitoring bridge that surfaces pilot execution status, learner progress aggregates, and safety signals to authorized teacher observers. All data is synthetic or appropriately aggregated — no raw learner data is exposed.

## Scope

- Simulated teacher dashboard data endpoints
- Aggregate learner progress views (no individual PII)
- Safety signal summaries (minimum necessary disclosure)
- Pilot health status indicators
- Alert routing for safeguarding escalations

## Architecture

```
Teacher Monitoring Bridge
  ├── PilotStatusSummary
  ├── LearnerAggregateProgressView
  ├── SafetySignalSummary
  └── AlertRouter
         │
         v
  Simulated frontend data / log output
```

The bridge does not connect to any real teacher-facing UI or notification system. Output is written to the evidence ledger and daily summary for post-pilot review.

## Key Components

- `PilotStatusSummaryService` — aggregates pilot run status
- `LearnerAggregateProgressService` — computes anonymized aggregates
- `SafetySignalSummaryService` — summarizes safeguarding events
- `AlertRouter` — routes alerts to ledger (no live dispatch)

## Security

- No raw student chat exposed
- No private learner memory exposed
- No teacher-only notes exposed
- No safeguarding raw details exposed
- All aggregates are minimum-necessary disclosure only

## Dependencies

- Pilot Evidence Ledger for source data
- Safeguarding Escalation Runtime for signal input
- Daily Pilot Summary for output aggregation

## Non-Goals

- Task 026 does NOT build Task 027 expansion
- Task 026 does NOT expand the pilot
- Task 026 does NOT deploy
- Task 026 does NOT send real communication
- Task 026 does NOT call live AI
- Task 026 does NOT write live school connectors
- Task 026 preserves verified school identity
- Task 026 preserves content governance
- Task 026 preserves privacy and safeguarding boundaries
- Task 026 preserves Socratic tutor behavior
