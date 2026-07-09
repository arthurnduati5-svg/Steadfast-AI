# Task 030 — Evidence and Reporting

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Evidence and Reporting service collects safe metadata from the rehearsal run and produces structured reports used for handoff and decision-making. No PII, no secrets, no raw data are included. The `safeToStartTask031` decision is computed honestly from all gate and rehearsal outcomes.

## Evidence Ledger

The evidence ledger is an append-only log recording rehearsal events. Each entry contains safe metadata only.

### Ledger Entry Format

```typescript
interface EvidenceLedgerEntry {
  id: string;                      // task030_evidence_<uuid>
  timestamp: string;               // ISO 8601
  eventType: EvidenceEventType;
  rehearsalRunId: string;
  actor: {
    actorId: string;               // task030_safe_* ID
    role: string;                  // synthetic_*, unknown_role
    syntheticTokenPrefix: string;  // task030_synthetic_token_*
  };
  details: Record<string, unknown>; // safe metadata only
  hash: string;                    // SHA-256 of details for integrity check
  size: number;                    // bytes of details
}

type EvidenceEventType =
  | 'TASK029_DEPENDENCY_GATE'
  | 'STAGING_ENVIRONMENT_GATE'
  | 'NO_LIVE_STUDENT_GUARD'
  | 'STATE_TRANSITION'
  | 'JOURNEY_STEP'
  | 'PERMISSION_CHECK'
  | 'CONTROL_ACTION_DRY_RUN'
  | 'ROLLBACK_DRILL'
  | 'TRAINING_PACK_GENERATED'
  | 'REPORT_GENERATED'
  | 'BLOCKER_RECORDED';
```

### Safety Rules

| Rule | Description |
|------|-------------|
| No PII | No real student names, emails, or identifiers |
| No secrets | No API tokens, database URLs, or passwords |
| No AI data | No prompts, responses, or model outputs |
| No chat | No raw student chat or conversations |
| No memory | No private learner memory entries |
| Safe actor IDs | Only `task030_safe_*` actor IDs recorded |
| Immutable | Once written, entries cannot be deleted or modified |
| Integrity validated | Each entry includes a SHA-256 hash of details |

## Report Format (JSON)

```json
{
  "taskId": "TASK-030",
  "scope": "controlled-staging-rehearsal-runtime-backend",
  "task029AcceptanceCommit": "2ef56aa",
  "task029ImplementationCommit": "4e3ed4c",
  "task029DependencyVerified": true,
  "task030Started": true,
  "task031Started": false,
  "task032Started": false,
  "task033Started": false,
  "task034Started": false,
  "task035Started": false,
  "task040Started": false,
  "acceptedReady": true,
  "stagingEnvironmentGatePassed": true,
  "noLiveStudentGuardPassed": true,
  "syntheticFixtureGenerated": true,
  "roleTokenMatrixGenerated": true,
  "adminOperatorJourneyPassed": true,
  "teacherJourneyPassed": true,
  "studentJourneyPassed": true,
  "unknownRoleDenialPassed": true,
  "operationsConsoleRehearsalPassed": true,
  "controlActionRehearsalPassed": true,
  "rollbackDrillPassed": true,
  "trainingPackGenerated": true,
  "reportGenerated": true,
  "evidenceLedgerVerified": true,
  "privacyScanPassed": true,
  "blockingIssues": [],
  "safeToStartTask031": true,
  "safeToStartTask032": false,
  "safeToStartTask033": false,
  "safeToStartTask034": false,
  "safeToStartTask035": false,
  "safeToStartTask040": false,
  "verdict": "ACCEPTED_READY_YES"
}
```

## Report Format (Markdown)

A Markdown report summarizing the rehearsal with:
- Task identity and scope
- Gate statuses (Task 029 dependency, staging environment, no-live-student)
- Fixture and role matrix status
- Journey results table
- Console rehearsal status
- Control action and rollback drill status
- Training pack status
- Evidence and report generation status
- Verdict and safeToStart decision

## Gates and Decision Rules

### `safeToStartTask031` = true
Only when ALL of the following are true:
- `task029DependencyVerified` = true
- `stagingEnvironmentGatePassed` = true
- `noLiveStudentGuardPassed` = true
- `syntheticFixtureGenerated` = true
- `roleTokenMatrixGenerated` = true
- `adminOperatorJourneyPassed` = true
- `teacherJourneyPassed` = true
- `studentJourneyPassed` = true
- `unknownRoleDenialPassed` = true
- `operationsConsoleRehearsalPassed` = true
- `controlActionRehearsalPassed` = true
- `rollbackDrillPassed` = true
- `trainingPackGenerated` = true
- `reportGenerated` = true
- `evidenceLedgerVerified` = true
- `privacyScanPassed` = true
- `blockingIssues` is empty

### `safeToStartTask032` through `safeToStartTask040` = `false`
These tasks are downstream of Task 031 and cannot be started until Task 031 passes.

## Verdicts

| Verdict | Meaning |
|---------|---------|
| `ACCEPTED_READY_YES` | All gates and rehearsals pass. Task 030 accepted. Safe to start Task 031. |
| `BLOCKED_PENDING_RESOLUTION` | One or more gates or rehearsals failed. Blocker details present. |