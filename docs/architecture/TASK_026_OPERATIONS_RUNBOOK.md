# Task 026 — Operations Runbook

## Purpose

Provide operational guidance for running, monitoring, and troubleshooting the Task 026 Controlled Pilot Execution Runtime during development and testing.

## Scope

- Startup and initialization procedures
- State machine operations
- Monitoring and log inspection
- Troubleshooting common issues
- Safe shutdown and rollback procedures

## Architecture

### Startup Sequence

1. Verify Task 025 readiness gate → PASS
2. Initialize Pilot Evidence Ledger connection
3. Initialize Execution State Machine
4. Run Cohort Execution Scope Gate validation
5. Run Learner Access Gate warm-up
6. Transition state to `scheduled`
7. Begin preflight validation cycle

### State Machine Operations

| Action | Command / Trigger |
|---|---|
| Start pilot | `POST /api/pilot/execution/start` (after preflight) |
| Pause pilot | `POST /api/pilot/execution/pause` (authorized only) |
| Resume pilot | `POST /api/pilot/execution/resume` (authorized only) |
| Rollback pilot | `POST /api/pilot/execution/rollback` (authorized only) |
| Get status | `GET /api/pilot/execution/status` |

### Monitoring

- Evidence ledger entries are written for every state transition
- Daily summary generated on schedule via `DailySummaryGenerator`
- Safeguarding signals appear in `PilotSafetySignal` table
- Metric snapshots in `PilotRuntimeMetricSnapshot` table

### Troubleshooting

| Issue | Check |
|---|---|
| Pilot won't start | Verify Task 025 readiness gate, cohort scope, learner eligibility |
| State transition fails | Check authorization, current state validity, guard conditions |
| Evidence not appearing | Check ledger connection, event emitter configuration |
| Safeguarding false positives | Review signal classifier thresholds, adjust severity mapping |
| Rollback fails | Check for active sessions, authorization level, cleanup permissions |

### Safe Shutdown

1. Pause all active sessions via PauseHandler
2. Archive evidence ledger (if rollback planned)
3. Execute RollbackHandler cleanup
4. Verify pre-pilot state restoration
5. Confirm completion in execution report

## Key Components

- All Task 026 runtime components (see TASK_026_CONTROLLED_PILOT_EXECUTION_RUNTIME.md)

## Security

- All operations require appropriate authorization
- Rollback requires elevated privileges and dual-authorization pattern
- Evidence ledger is never deleted — only archived
- Runbook procedures assume non-production testing environment

## Dependencies

- Task 025 readiness artifacts
- Prisma schema migrations for all pilot models
- Local/test database instance

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
