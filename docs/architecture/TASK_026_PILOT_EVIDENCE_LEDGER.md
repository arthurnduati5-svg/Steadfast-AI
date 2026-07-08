# Task 026 — Pilot Evidence Ledger

## Purpose

Provide an immutable, append-only ledger for all pilot execution evidence. Every event, metric, feedback record, safety signal, and audit entry is written to the ledger for post-pilot review and accountability.

## Scope

- Event capture from all runtime components
- Immutable append-only storage
- Tamper-evident entry structure
- Query interface for post-pilot review and daily summaries
- Archive preservation before rollback

## Architecture

```
All Runtime Components
       │
       v
Pilot Evidence Ledger
  ├── PilotExecutionEvent
  ├── PilotRuntimeMetricSnapshot
  ├── PilotFeedbackRecord
  ├── PilotSafetySignal
  ├── PilotPostPilotReview
  └── PilotExecutionAuditRecord
       │
       v
Daily Pilot Summary
Post-Pilot Review
```

Each entry includes a timestamp, source component, event type, payload hash, and sequence number to detect tampering or gaps.

## Key Components

- `PilotEventCaptureService` — captures events from all components
- `PilotEvidenceStore` — write and query interface for ledger models
- `LedgerIntegrityChecker` — verifies sequence continuity and payload hashes
- `PilotPostPilotReviewService` — generates review from ledger data

## Security

- Ledger is append-only — no update or delete operations
- Each entry is hashed with predecessor hash (blockchain-style chain)
- Entry payload is encrypted at rest
- Query access is restricted to authorized review roles
- Rollback does not delete ledger entries (archived separately)

## Dependencies

- Prisma models: `PilotExecutionEvent`, `PilotRuntimeMetricSnapshot`, `PilotFeedbackRecord`, `PilotSafetySignal`, `PilotPostPilotReview`, `PilotExecutionAuditRecord`
- Execution State Machine for event source
- Daily Pilot Summary for aggregation queries

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
