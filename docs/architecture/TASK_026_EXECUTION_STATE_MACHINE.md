# Task 026 — Execution State Machine

## Purpose

Define and enforce the finite state machine that governs pilot execution lifecycle. Every pilot run transitions through a well-defined set of states with validations at each boundary.

## Scope

- State definitions and transitions
- Guard conditions for each transition
- Event logging for every state change
- Error and timeout handling per state

## Architecture

```
scheduled ──> preflight ──> running ──> completed
                  │            │
                  v            v
              paused <──> resumed
                  │
                  v
            rolled_back ──> completed
```

| State | Description |
|---|---|
| scheduled | Pilot is registered but not yet started |
| preflight | Pre-execution validation is running |
| running | Pilot is actively executing |
| paused | Execution suspended (manual or triggered) |
| resumed | Execution continues after pause |
| rolled_back | Execution undone, system restored to pre-pilot state |
| completed | Pilot finished naturally |

Transitions are guarded by:
- Preflight gate status
- Safeguarding signal absence
- Authorized pause/resume commands
- Rollback precondition checks

## Key Components

- `PilotExecutionStateMachine` — core state machine engine
- Transition guards per edge
- State persistence via `PilotExecutionRun.status`
- Event emission on every transition

## Security

- State transitions require valid authorization tokens
- Pause and rollback require elevated privileges
- All transitions are audited to `PilotExecutionEvent`
- Invalid transitions are rejected with explicit error codes

## Dependencies

- Prisma model `PilotExecutionRun` (status field)
- `PilotExecutionEvent` for audit trail
- Task 025 readiness gates for initial state validation

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
