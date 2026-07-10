# Task 034 — Safe Rollout Read Model

## Purpose

The safe rollout read model provides aggregate-only read access to limited rollout data. No raw individual learner or staff data is accessible through any read path.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## Read Endpoints

| Endpoint | Data Returned | Auth Required |
|---|---|---|
| `GET /task034/rollout/summary` | Aggregate rollout summary | Admin/Operator |
| `GET /task034/rollout/health` | Health budget metrics | Admin/Operator |
| `GET /task034/rollout/gates` | Gate pass/fail status | Admin/Operator |
| `GET /task034/rollout/incidents` | Safe incident summaries | Admin/Operator |
| `GET /task034/rollout/state` | Rollout state machine status | Admin/Operator |

All endpoints return aggregate metrics only. No raw learner or staff data.

## Response Structure

Every response follows this contract:

```typescript
interface SafeRolloutResponse {
  ok: boolean;
  data: {
    aggregateMetrics: Record<string, number>;
    rolloutState: string;
    gateStatus: Record<string, boolean>;
    healthBudget: Record<string, number>;
    incidents?: SafeIncidentSummary[];
  };
  warnings?: string[];
}
```

## Forbidden Response Fields

The safe rollout read model explicitly forbids:
- `rawStudentData`, `rawChat`, `privateMemory`
- `studentName`, `studentEmail`, `studentPhone`
- `teacherNotes`, `safeguardingDetails`, `deenText`
- `aiPrompt`, `providerResponse`, `answerKey`
- `bearerToken`, `apiKey`, `databaseUrl`
- `staffName`, `staffContact`, `rawStaffRecord`

## Verification

The safe rollout read model is verified by:
1. Integration tests for each endpoint
2. Response schema validation
3. Privacy scan confirming no raw data in any read model output
