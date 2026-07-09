# TASK 032 — Canary Activation State Machine

**This state machine is backend-only. It is the sole authority on canary lifecycle.**

## Purpose

The canary activation state machine (`task032CanaryActivationStateMachine.ts`) manages the deterministic lifecycle of a canary run. It defines allowed transitions, blocks invalid transitions, and provides the current state to the runtime guard.

## States

```
inactive ──> configuring ──> ready ──> active ──> completed
                                       |  |  |
                                       v  v  v
                                    paused  killed  rolled-back
```

| State | Description |
|-------|-------------|
| `inactive` | Initial state, no canary configured |
| `configuring` | Canary configuration in progress |
| `ready` | Configuration complete, awaiting activation |
| `active` | Canary is live and accepting runtime requests |
| `paused` | Suspended, resume required before returning to active |
| `killed` | Terminated, cannot resume |
| `rolled-back` | Rolled back, all runtime effects undone |
| `completed` | Natural end of canary observation period |

## Allowed Transitions

| From | To | Condition |
|------|----|-----------|
| `inactive` | `configuring` | All gates passed |
| `configuring` | `ready` | Configuration validated |
| `ready` | `active` | Activation authorized |
| `active` | `paused` | Pause action |
| `paused` | `active` | Resume action |
| `active` | `killed` | Kill switch action |
| `active` | `rolled-back` | Rollback action |
| `paused` | `killed` | Kill switch during pause |
| `paused` | `rolled-back` | Rollback during pause |
| `active` | `completed` | Natural canary period end |
| `killed` | (none) | Terminal state |
| `rolled-back` | (none) | Terminal state |
| `completed` | (none) | Terminal state |

## Blocked Transitions

- Teacher role cannot transition any state
- Student role cannot transition any state
- Unknown role cannot transition any state
- `active` -> `inactive` is forbidden (must roll back or kill)
- `paused` -> `inactive` is forbidden
- `killed` -> any state is forbidden
- `rolled-back` -> any state is forbidden

## Forbidden Operations

- No external actor can force-transition the state machine
- No state transition bypasses the runtime guard
- No transition skips the required gate chain
