# Task 026 — Controlled Pilot Execution Runtime

## Purpose

Task 026 provides the controlled execution runtime for running Steadfast AI pilot programs. It defines the lifecycle, state machine, gating, monitoring, safeguarding, and evidence collection infrastructure required to execute a pilot without expanding scope, deploying to production, or communicating with real schools.

## Scope

- Define and enforce the pilot execution lifecycle (state machine)
- Gate cohort access and learner participation
- Provide teacher monitoring bridge (simulated)
- Implement safeguarding and escalation runtime
- Support pause, resume, and rollback operations
- Collect pilot evidence into an immutable ledger
- Generate daily pilot summaries
- Verify readiness dependency on Task 025

## Architecture

```
Task 025 (Readiness)
       |
       v
Controlled Pilot Execution Runtime
  ├── Execution State Machine
  ├── Cohort Execution Scope Gate
  ├── Learner Access Gate
  ├── Teacher Monitoring Bridge
  ├── Safeguarding Escalation Runtime
  ├── Pause / Resume / Rollback Runtime
  ├── Pilot Evidence Ledger
  └── Daily Pilot Summary
       |
       v
Handoff → Task 027 (Future)
```

All execution occurs in a sandboxed runtime environment. No production data, live AI calls, or school connector traffic flows through this system.

## Key Components

| Component | Responsibility |
|---|---|
| Execution State Machine | Manages pilot phases (scheduled → preflight → running → paused → completed → rolled back) |
| Cohort Execution Scope Gate | Validates cohort is within approved scope before execution |
| Learner Access Gate | Verifies learner eligibility per pilot criteria |
| Teacher Monitoring Bridge | Simulated dashboard data for teacher oversight |
| Safeguarding Escalation Runtime | Detects and routes safeguarding signals within pilot boundary |
| Pause / Resume / Rollback Runtime | Handles lifecycle interrupts |
| Pilot Evidence Ledger | Immutable event store for pilot execution evidence |
| Daily Pilot Summary | Aggregated daily report of pilot activity |

## Security

- All pilot data is isolated from production learner data
- No real PII flows through the runtime
- Safeguarding signals are logged but not dispatched to live services
- Access gates enforce strict boundary checks
- Evidence ledger is append-only and tamper-evident

## Dependencies

- Task 025 (Pilot Readiness) — prerequisite gates and configuration
- Prisma schema for PilotExecutionRun, PilotExecutionEvent, PilotRuntimeMetricSnapshot, PilotFeedbackRecord, PilotSafetySignal, PilotPostPilotReview, PilotExecutionAuditRecord
- Local SQLite / test database — no production database access

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
