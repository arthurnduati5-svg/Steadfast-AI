# Task 024 – Backup, Restore, and Data Integrity

## Backup Readiness

The `BackupReadinessService` (`task024BackupReadinessService.ts`) checks whether the system is configured for database backups. It is a **read-only check** — it inspects environment variables and package.json scripts but never initiates a real backup.

### What It Checks

- **Config presence** — whether `DATABASE_URL` is set
- **Database provider** — detected from the URL scheme (postgresql, mysql, mongodb)
- **Backup command documented** — whether any package.json script name contains "backup"
- **Backup destination configured** — whether `BACKUP_DEST` env var is set
- **Backup schedule documented** — whether `BACKUP_SCHEDULE` env var is set
- **Retention policy documented** — whether `BACKUP_RETENTION_DAYS` env var is set
- **Encryption-at-rest expected** — always true for production (hardcoded)
- **Restore drill plan exists** — whether `RESTORE_DRILL_PLAN` env var is set
- **Manual approval required** — always true (hardcoded)

The service returns a `BackupReadinessResult` with a boolean `ready` field, a `safeSummary`, and detailed `safeDetails` array. A manifest summary is also available showing expected table names per database provider.

### What Is NOT Done

- No actual backup is performed
- No connection to the database is made beyond reading env vars
- No production data is read or transferred

## Restore Drill

The `RestoreDrillService` (`task024RestoreDrillService.ts`) runs a **simulation-only** restore drill using isolated test fixtures. It never touches production data.

### How It Works

1. Checks whether the restore procedure is documented (via `RESTORE_PROCEDURE_DOCUMENTED` env var)
2. Selects a test fixture (default: `test_fixture_default` with 42 records) — three fixtures are available:
   - `test_fixture_default` — 42 records, checksum `a1b2c3d4e5f6`
   - `test_fixture_curriculum` — 128 records, checksum `f6e5d4c3b2a1`
   - `test_fixture_students` — 350 records, checksum `9a8b7c6d5e4f`
3. Simulates checksum validation against expected checksum
4. Simulates record count validation
5. Returns a `RestoreDrillResult` with `destructiveCommandExecuted: false` and `realProductionDataOverwritten: false` always

### Safety Guarantees

- `destructiveCommandExecuted` is always `false`
- `realProductionDataOverwritten` is always `false`
- `manualApprovalBeforeRestore` is always `true`
- Drill history is tracked in-memory

### What Is NOT Done

- No actual database restore commands are executed
- No production data is written, overwritten, or deleted
- No destructive commands (`DROP`, `TRUNCATE`, `DELETE`, `rm -rf`) are ever issued
- No external storage is accessed

## Data Integrity Verification

The `DataIntegrityVerificationService` (`task024DataIntegrityVerificationService.ts`) checks record integrity across 9 key models using **aggregate metadata counts only**.

### Models Checked

| Check Name | Prisma Model | What Is Verified |
|---|---|---|
| `schoolIntegrationMappings` | `SchoolIntegrationIdempotencyRecord` | Record count, orphan count via `schoolRosterSyncJob` relation |
| `learnerMappings` | `TutorLearnerIdentityMap` | Record count, orphan count, duplicate active mappings |
| `sessionStateRecords` | `StudentLearningSessionState` | Record count, invalid status count |
| `contentGovernanceRecords` | `ContentGovernanceAuditRecord` | Record count |
| `approvedSourceRecords` | `ApprovedSourceRecord` | Record count |
| `contentItemRecords` | `ContentItemRecord` | Record count |
| `contentGapRecords` | `ContentGapRecord` | Record count |
| `auditRecords` | `DurableAuditEvent` | Record count |
| `rateLimitQuotaRecords` | `RateLimitQuotaRecord` | Record count (model may not exist) |

### How It Works

- Each check attempts to query the Prisma model for a `count()` (aggregate only — no raw rows fetched)
- For specific checks, orphan counts and invalid statuses are also queried
- Falls back to test fixtures when the database is unavailable or in test mode
- Returns the checks as `DataIntegrityCheckResult` with: `accessible`, `recordCount`, `orphanCount`, `missingRequiredRelationCount`, `invalidStatusCount`, `duplicateActiveMappingCount`, `latestSafeTimestamp`, `issues[]`

### What Is NOT Done

- No raw record data is retrieved — only aggregate `count()` queries
- No student chat, prompts, answers, teacher-only content, or private memory is ever read
- No mutations are performed on the database
- No production data is exposed in logs or responses
