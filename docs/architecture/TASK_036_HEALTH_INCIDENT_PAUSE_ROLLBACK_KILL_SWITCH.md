# Task 036: Health, Incident, Pause, Rollback, Kill-Switch

## Identity

- **Task:** 036
- **Component:** Health/Incident/Pause/Rollback/Kill-Switch Runtime
- **Type:** Backend-only runtime safety controls

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Provide runtime safety controls to pause, rollback, or kill the live school launch in response to health degradation or incidents. This is the emergency response system for the controlled launch.

## Components

### Health Check System

- Periodic health checks against core services
- Checks: process health, database connectivity, auth service, AI provider gateway, memory service, evidence service
- Failure threshold: 3 consecutive failures triggers incident

### Incident Detection

- Health check failures
- Error rate spikes (>5% in 5-minute window)
- Latency budget violations (p99 > 5s)
- Privacy gate violations
- Socratic gate violations
- Deen gate violations
- Safety gate violations

### Pause Mechanism

- Stops new session creation
- Blocks AI calls for new requests
- Active sessions continue to drain gracefully
- Pause is reversible (unpause)
- Pause state is logged and monitored

### Rollback Mechanism

- Reverts runtime configuration to pre-launch state
- Blocks all launch-specific behavior
- Maintains audit trail of rollback event
- Rollback owner must be assigned
- Rollback plan must be documented

### Kill Switch

- Immediately stops all runtime launch behavior
- Blocks all AI, memory, session, and evidence operations
- Requires kill-switch owner acknowledgment
- Kill-switch event is audited
- Recovery requires manual re-approval

## Incident Response Flow

```
Health Check Failure → Incident Detection → Assessment
    ↓                                                    ↓
Pause Runtime                                    Escalate to Owners
    ↓                                                    ↓
Assess Severity                                   Rollback or Kill
    ↓                                                    ↓
Resolve or Rollback                              Recovery Plan
```

## Verification

Health/incident/pause/rollback/kill-switch readiness is validated by:
1. `scripts/run-task036-live-school-launch.cjs` — validates all controls
2. `scripts/verify-task036.ps1` — includes readiness verification step
3. `scripts/gen-task036-report.cjs` — records readiness in report
