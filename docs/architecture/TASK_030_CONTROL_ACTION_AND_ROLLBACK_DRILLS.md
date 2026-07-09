# Task 030 — Control Action and Rollback Drills

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

Control action and rollback drills simulate emergency response procedures in a safe, dry-run rehearsal environment. No live state is mutated. No production effectors are invoked. All drills use synthetic fixtures.

## Control Actions

### Pause Rehearsal
1. Preflight: Validate that the rehearsal run is in a state that allows pause.
2. Dry-run: Return confirmation that pause would be executed.
3. Expected behavior in simulation:
   - State machine moves to simulated `paused` state.
   - Evidence ledger records "PAUSE_REHEARSAL" event.
   - No actual pause effector is called.

### Resume Rehearsal
1. Preflight: Validate that the rehearsal run is in a state that allows resume.
2. Dry-run: Return confirmation that resume would be executed.
3. Expected behavior in simulation:
   - State machine moves back to previous active state.
   - Evidence ledger records "RESUME_REHEARSAL" event.
   - No actual resume effector is called.

### Intervention
1. Preflight: Validate caller role (admin or operator only).
2. Dry-run: Simulate flagging an oversight item for intervention.
3. Expected behavior in simulation:
   - Oversight item severity is escalated in simulation.
   - Evidence ledger records "INTERVENTION_SIMULATED" event.
   - No actual intervention is triggered.

### Kill-Switch Enable
1. Preflight: Validate caller role and staging gate.
2. Dry-run: Simulate enabling kill switch.
3. Expected behavior in simulation:
   - Simulated student access blocked in synthetic fixture.
   - Evidence ledger records "KILL_SWITCH_ENABLE_SIMULATED" event.
   - No actual kill switch is enabled.

### Kill-Switch Disable
1. Preflight: Validate caller role and recheck gate.
2. Dry-run: Simulate disabling kill switch.
3. Expected behavior in simulation:
   - Simulated student access restored.
   - Evidence ledger records "KILL_SWITCH_DISABLE_SIMULATED" event.
   - No actual kill switch is disabled.

## Rollback Drill

### Rollback Initiation
1. Preflight:
   - Role is admin or operator.
   - Staging environment gate passes.
   - No-live-student guard passes.
   - A reason is provided.
2. Dry-run: Execute rollback simulation.
3. Expected behavior:
   - Expanded access is marked blocked (simulation).
   - Audit records are preserved (written to evidence ledger).
   - Learning evidence is NOT destructively deleted (verified in simulation).
   - Safe rollback summary is generated.

### Rollback Confirmation
1. Preflight: Rollback was initiated within the last 5 minutes.
2. Dry-run: Confirm rollback simulation.
3. Expected behavior:
   - Evidence ledger records "ROLLBACK_CONFIRMED_SIMULATED" event.
   - Safe summary is finalized.
   - No actual rollback of production systems occurs.

## Dry-Only Guarantees

| Action | Dry-Run Behavior |
|--------|-----------------|
| Pause | No actual pause effector called |
| Resume | No actual resume effector called |
| Intervention | No actual intervention triggered |
| Kill-switch enable | No actual kill-switch engaged |
| Kill-switch disable | No actual kill-switch disengaged |
| Rollback init | No actual rollback of production data |
| Rollback confirm | No actual rollback confirmed on production |

## Verification Checks

| Check | Expected |
|-------|----------|
| Kill-switch enable correctly blocks simulated student access | PASS |
| Kill-switch disable requires recheck gate | PASS |
| Rollback correctly blocks expanded access | PASS |
| Rollback preserves audit trail | PASS |
| Rollback does not destructively delete learning evidence | PASS |
| All drill actions produce audit events | PASS |
| All drill action summaries are safe | PASS |