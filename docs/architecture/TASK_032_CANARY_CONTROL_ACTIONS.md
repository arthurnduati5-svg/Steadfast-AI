# TASK 032 — Canary Control Actions

**This service is backend-only. Only authorized admin/operator roles can invoke control actions.**

## Purpose

The canary control action service (`task032CanaryControlActionService.ts`) provides the administrative interface for managing a canary run after activation. It handles pause, resume, kill-switch, and rollback actions.

## Actions

### Pause
- Suspends the canary while preserving all state
- Runtime guard blocks access during pause
- Only admin/operator role can invoke
- Teacher role explicitly denied

### Resume
- Returns a paused canary to active state
- Re-validates runtime gates before granting access
- Only admin/operator role can invoke

### Kill Switch
- Immediately terminates the canary
- All runtime access permanently blocked
- Preserves safe audit summary for investigation
- Only admin/operator role can invoke
- This is a fire-drill action

### Rollback
- Reverses the canary activation effects
- Runtime access permanently blocked
- Safe audit summary is preserved
- Destructive deletion of learning evidence is avoided
- Only admin/operator role can invoke
- Rollback is the preferred safe-reversal action

## Role Authorization

| Action | Admin | Operator | Teacher | Student | Unknown |
|--------|-------|----------|---------|---------|---------|
| Pause | ✅ | ✅ | ❌ | ❌ | ❌ |
| Resume | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kill switch | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rollback | ✅ | ✅ | ❌ | ❌ | ❌ |

## Data Flow

```
ControlActionRequest
  -> Authenticate role
  -> Authorize action for role
  -> Execute state machine transition
  -> Notify incident bridge if risk detected
  -> Return safe status summary
```

## Boundaries

- No destructive deletion of learning evidence on rollback
- No raw private data in control action responses
- No control action accessible to students or teachers
