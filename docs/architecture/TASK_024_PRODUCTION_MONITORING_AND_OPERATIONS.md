# Task 024 – Production Monitoring and Operations

## What Task 024 Adds

This task implements a production operations layer covering:

- **Production monitoring** — checks component health, aggregates operational status, and produces safe metrics snapshots.
- **Incident response** — deterministic detection, classification, response plan generation, and metadata-only audit.
- **Backup/restore readiness** — checks backup configuration, simulates restore drills on isolated test data.
- **Data integrity verification** — checks record counts, orphans, and status validity across 9 key models using aggregate metadata only.
- **Hardening checklist** — validates environment gate, secret masking, monitoring routes, incident workflow, backup readiness, restore drill, data integrity, privacy leak scanning, destructive command policies, live AI call prohibition, and docs/reports coverage.

All operations routes are admin/internal only. Learners are denied access at the middleware level.

## How Monitoring Works

### OperationalHealthAggregator

The `OperationalHealthAggregator` (`task024OperationalHealthAggregator.ts`) runs 10 parallel component health checks every time the health endpoint is called. Each component check is a lightweight, non-destructive probe that returns a status (healthy, degraded, unhealthy, blocked, unknown, not_applicable), a safe message, and an optional reason code. The aggregator computes an overall status from all components and produces safe next actions.

### MetricsSnapshotService

The `MetricsSnapshotService` (`task024MetricsSnapshotService.ts`) provides in-memory counters for requests, errors, and rate-limit events. It exposes a `produceMetricsSnapshot()` function that returns an `OperationalMetricsSnapshot` containing only aggregate counts — no raw data, no private content. Counters are used for near-real-time operational awareness.

## Components Monitored

| Component | What is Checked |
|---|---|
| database | Whether `DATABASE_URL` is configured |
| prisma | Whether Prisma client can be imported |
| ai_gateway | Whether AI provider key or gateway endpoint is configured |
| school_integration | Whether school integration verification service is available |
| content_governance | Whether content governance readiness service is available |
| deployment_readiness | Whether deployment readiness aggregator is available |
| rate_limits | Whether rate limit middleware is importable |
| telemetry | Whether request telemetry service is available |
| backup_readiness | Whether backup readiness service is available |
| restore_drill | Whether restore drill service is available |

## Telemetry — Allowed Fields

Only metadata fields are permitted in telemetry events. The `TelemetryEvent` type allows:

- `id` — event identifier
- `timestamp` — ISO timestamp
- `component` — component name
- `category` — event category (request, response, error, audit, incident, readiness, health, backup, restore, data_integrity, admin)
- `severity` — info, low, medium, high, critical
- `status` — healthy, degraded, unhealthy, blocked, unknown, not_applicable
- `safeReasonCode` — machine-readable reason string
- `safeSummary` — human-safe summary string
- `schoolScopeCount` — number of schools affected
- `correlationId` — request correlation identifier
- `durationMs` — duration in milliseconds
- `count` — numeric count
- `booleanFlags` — record of boolean flags

## Telemetry — Forbidden Fields

The following fields are explicitly blocked from telemetry by the `SafeTelemetryService`:

- `rawChat`
- `prompt`
- `providerResponse`
- `answerKey`
- `teacherOnlyContent`
- `studentPrivateMemory`
- `safeguardingRaw`
- `deenSensitiveRaw`
- `token` / `secret` / `databaseUrl`
- `authorizationHeader` / `cookie`
- `stackTraceWithSensitiveData`

Any telemetry event containing a forbidden field is rejected with an error.

## How Redaction Works

The `RedactionAndLeakDetectionService` uses two layers:

1. **Field-name pattern matching** — recursively walks objects and redacts any key matching unsafe field patterns (e.g., `rawChat`, `databaseUrl`, `apiKey`, `token`, `secret`, `password`, `privateKey`, `email`, `phone`).

2. **Value pattern matching** — within string values, scans for and redacts:
   - Private keys (`-----BEGIN ... PRIVATE KEY-----`)
   - Database URLs (`postgres://`, `mysql://`, `mongodb://`, etc.)
   - Bearer tokens
   - API keys (`sk-...`, `ghp_...`, `xox...`, `AIza...`)
   - Provider keys (`pplx-...`, `openai-...`, etc.)
   - Email addresses and phone numbers
   - Long base64-like secrets
   - Auth headers and cookies
   - Raw content markers (raw prompt, raw chat, raw transcript, answer key patterns)

The `scanForLeaks()` function reports which patterns matched without exposing the actual values.

## Operations Routes

All routes are mounted at `/api` and are admin/internal only (enforced by `schoolAuthMiddleware` + `requireRole('admin', 'counselor')`):

| Route | Method | Purpose |
|---|---|---|
| `/api/operations/health` | GET | Run operational health check — returns overall status, component statuses, critical failures, warnings, safe next actions |
| `/api/operations/metrics` | GET | Produce metrics snapshot — returns aggregate request count, error count, rate limit count, incident counts |
| `/api/operations/incidents/simulate` | GET | Detect all incident signals, classify them, record audit entries — simulates the full detection pipeline |
| `/api/operations/incidents/plan` | GET | Generate incident response plans from current detected signals |
| `/api/operations/backup/readiness` | GET | Check backup readiness — config presence, documentation, retention, encryption |
| `/api/operations/restore/drill` | GET | Run a restore drill on isolated test fixtures — no production data touched |
| `/api/operations/data-integrity` | GET | Verify data integrity across 9 models using aggregate metadata counts |
| `/api/operations/hardening-checklist` | GET | Run the operational hardening checklist |
| `/api/operations/audit/records` | GET | View incident audit records (last 100, metadata-only) |
