# Task 026 — Cohort Execution Scope Gate

## Purpose

Ensure that every pilot execution operates within the approved cohort scope. The gate validates cohort identity, size, subject range, grade levels, and duration before allowing execution to proceed.

## Scope

- Cohort identity verification against approved pilot configuration
- Size bounds checking (min/max participants)
- Subject and curriculum scope validation
- Grade level range enforcement
- Duration limit enforcement
- Scope breach detection and escalation

## Architecture

```
Cohort Scope Gate
  ├── validateCohortIdentity()
  ├── validateCohortSize()
  ├── validateSubjectScope()
  ├── validateGradeRange()
  └── validateDuration()
         │
         v
  PASS / FAIL with reason
```

The gate runs during preflight and at configurable intervals during execution. Any scope breach triggers an event to the Safeguarding Escalation Runtime.

## Key Components

- `CohortScopeValidator` — composite validator running all checks
- `CohortScopeConfig` — approved scope parameters from pilot setup
- Scope breach event emitter

## Security

- Cohort scope config is immutable during execution
- Scope changes require a new pilot setup (Task 025)
- Breach events are logged to `PilotExecutionEvent` with full context
- No scope data is exposed to learners

## Dependencies

- Task 025 pilot configuration (approved cohort definition)
- Prisma `PilotExecutionRun` for scope binding
- Subject and curriculum registry for scope validation

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
