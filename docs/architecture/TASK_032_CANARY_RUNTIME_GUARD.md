# TASK 032 — Canary Runtime Guard

**This service is backend-only. It gates all runtime access for canary members.**

## Purpose

The canary runtime guard (`task032CanaryRuntimeGuardService.ts`) is the central access gate that all canary member requests must pass through. It enforces that every prerequisite gate has passed, the canary is in an active state, and all policy gates (Socratic, Deen, curriculum, privacy) are satisfied before granting access.

## Guard Checks

| Check | Description |
|-------|-------------|
| School identity | Requesting school must be recognized |
| Approved school | School must be in approved canary list |
| Approved cohort | Student must belong to approved cohort |
| Active canary | Canary must be in `active` state (not paused/killed/rolled-back) |
| Pause blocks | If canary is paused, runtime access is denied |
| Kill switch blocks | If kill switch is active, runtime access is denied |
| Rollback blocks | If rollback has been executed, runtime access is denied |
| Curriculum scope | Requested curriculum scope must be approved |
| Source scope | Requested source scope must be approved |
| Socratic gate | Socratic integrity policy must be satisfied |
| Deen gate | Deen sensitivity boundary must be respected |
| Privacy gate | No raw student data in the request context |
| Session blocked before gates | AI and memory calls blocked until all gates pass |

## State Machine Integration

The runtime guard reads the current canary state from the activation state machine:
- `active` — full runtime access allowed (after all gates)
- `paused` — access blocked, pending resume
- `killed` — permanent access denial
- `rolled-back` — permanent access denial, data intact

## Data Flow

```
RuntimeGuard
  -> Check canary state (must be active)
  -> Validate school identity
  -> Validate approved school
  -> Validate cohort membership
  -> Validate curriculum/source scopes
  -> Execute policy gates: Socratic, Deen, Privacy
  -> Verify AI/memory blocked before gates
  -> Grant or deny runtime access
```

## Boundaries

- No runtime access before all gates pass
- No AI calls before gate chain completes
- No memory reads before privacy gate passes
