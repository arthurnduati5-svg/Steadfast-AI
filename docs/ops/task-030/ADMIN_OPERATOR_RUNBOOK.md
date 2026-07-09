# Steadfast AI — Admin/Operator Runbook for Controlled Expansion Rehearsal

## Prerequisites

- Task 029 proof is accepted (`safeToStartTask030: true`)
- `TASK030_STAGING_REHEARSAL=1`
- `TASK030_NO_LIVE_STUDENTS=1`
- `NODE_ENV` is not `production` (unless explicit staging override exists)
- No production database URL is active
- `LIVE_ROLLOUT_ENABLED` is not `true`

## Running the Rehearsal

1. Set environment variables:
   ```
   $env:TASK030_STAGING_REHEARSAL = "1"
   $env:TASK030_NO_LIVE_STUDENTS = "1"
   ```

2. Run the verification script:
   ```
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-task030.ps1
   ```

3. Verify exit code is 0.

## Console Operations

| Action | Endpoint | Guard | Notes |
|--------|----------|-------|-------|
| View dashboard | GET /api/pilot/expansion/operations/dashboard | admin | Safe aggregate data only |
| View status | GET /api/pilot/expansion/operations/status | admin | Proof status + execution status |
| View stages | GET /api/pilot/expansion/operations/stages | admin | Aggregate counts only |
| View health | GET /api/pilot/expansion/operations/health | admin | Aggregate metrics only |
| View events | GET /api/pilot/expansion/operations/events | admin | Safe event summaries |
| View oversight | GET /api/pilot/expansion/operations/oversight | admin | Safe oversight items |
| Pause | POST /api/pilot/expansion/operations/pause | admin | Calls Task 028 service |
| Resume | POST /api/pilot/expansion/operations/resume | admin | Calls Task 028 service |
| Enable kill switch | POST /api/pilot/expansion/operations/kill-switch/enable | admin | Blocks student access |
| Disable kill switch | POST /api/pilot/expansion/operations/kill-switch/disable | admin | Requires recheck gate |
| Rollback | POST /api/pilot/expansion/operations/rollback | admin | Requires reason |
| Generate review | POST /api/pilot/expansion/operations/completion-review/generate | admin | Computes safeToStart |

## Kill Switch Drill

1. Enable kill switch.
2. Verify student own-status endpoint shows access blocked.
3. Disable kill switch only after confirming the gate recheck passes.
4. Verify student access is restored if intended.

## Rollback Drill

1. Execute rollback with a reason.
2. Verify expanded access is blocked.
3. Verify audit records are preserved.
4. Verify learning evidence was not destructively deleted.

## Troubleshooting

- If console shows "proof missing": Verify Task 028 and Task 029 reports exist.
- If controls return 403: Verify your role is admin.
- If student status endpoint fails: Verify execution run ID is correct.
- If rehearsal script fails: Check `logs/task-030/verify-task030-standalone.log`.

## Data Safety

- Never copy raw student chat or private memory.
- Never share database URLs or API tokens.
- Never expose teacher-only content in reports.
- Always use `*_task030_safe` fixture identifiers during rehearsal.
