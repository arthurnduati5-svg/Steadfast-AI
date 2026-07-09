# TASK 032 — Safe Canary View

**This service enforces role-based safe views. No raw private data is exposed to any role.**

## Purpose

The canary view service (`task032CanaryViewService.ts`) provides role-appropriate summaries of canary status. Each role sees only the data necessary for their function, and no raw private data crosses any view boundary.

## View Matrix

| View | Admin | Operator | Teacher | Student | Unknown |
|------|-------|----------|---------|---------|---------|
| Canary status | Full | Full | Summary | Own status only | Denied |
| Cohort summary | Aggregate | Aggregate | Assigned only | Denied | Denied |
| Gate results | Full detail | Full detail | Summary | Denied | Denied |
| Health budget | Full | Full | Denied | Denied | Denied |
| Control history | Full | Full | Denied | Denied | Denied |
| Individual student data | Aggregate only | Aggregate only | Assigned aggregate | Own only | Denied |
| Raw private data | Blocked | Blocked | Blocked | Blocked | Blocked |

## Teacher View

- Summary of canary status for assigned cohort
- Aggregate gate results (pass/fail only, no detail)
- No individual student data
- No ability to activate, pause, kill, or rollback
- Safe empty state when no canary is active

## Student View

- Own canary status only (active/paused/rolled-back)
- No other student data visible
- No controls or actions available
- Minimal safe status readout

## Data Flow

```
ViewRequest
  -> Authenticate role
  -> Determine view template
  -> Filter data by role permissions
  -> Privacy boundary scan on response
  -> Return safe view
```

## Boundaries

- No raw student chat in any view
- No private learner memory in any view
- No teacher-only notes exposed
- No answer keys or protected rubrics
- No admin controls visible to non-admin roles
