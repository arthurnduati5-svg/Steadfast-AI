# Task 026 — Safeguarding Escalation Runtime

## Purpose

Detect safeguarding-relevant signals during pilot execution and route them through a controlled escalation pipeline. Signals are logged, reviewed, and summarized — they are NOT dispatched to live safeguarding services, school authorities, or external systems.

## Scope

- Signal detection from pilot interactions
- Signal classification (low / medium / high severity)
- Escalation routing within the pilot boundary
- Escalation record in evidence ledger
- Simulated review cycle (no real human-in-the-loop dispatch)

## Architecture

```
Pilot Interaction
       │
       v
Safeguarding Escalation Runtime
  ├── SignalDetector
  ├── SignalClassifier (low / medium / high)
  ├── EscalationRouter (pilot-internal)
  └── EscalationRecorder
       │
       v
Pilot Evidence Ledger
       │
       v
Daily Pilot Summary (aggregated)
```

High-severity signals may trigger automated pause via the Pause/Resume/Rollback Runtime.

## Key Components

- `SafeguardingSignalDetector` — identifies potential signals from interaction data
- `SafeguardingSignalClassifier` — assigns severity level
- `EscalationRouter` — routes within pilot boundary only
- `EscalationRecorder` — writes to `PilotSafetySignal` model

## Security

- Raw safeguarding details are NOT exposed to teacher bridge
- No real external dispatch occurs
- Signal data uses minimum necessary disclosure
- All signals are audited with tamper-evident ledger entries
- Escalation does not weaken existing safeguarding boundaries

## Dependencies

- Prisma `PilotSafetySignal` model
- Pilot Evidence Ledger for persistence
- Pause/Resume/Rollback Runtime for automated pause on high-severity signals

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
