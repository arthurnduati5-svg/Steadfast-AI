# Task 032 — Task 031 Dependency Gate

## Purpose

Task 032 cannot proceed unless Task 031 (Authenticated Staging Smoke) has completed successfully. This document describes the gate that enforces this dependency.

## Gate: Task 031 Proof Loader

The `Task031ProofLoaderService` is the first gate executed in the Task 032 controlled canary activation pipeline. It validates that the Task 031 staging smoke verification was successful before any Task 032 activation logic runs.

## Proof Requirements

The loader validates the following artifacts from `docs/ops/task-031/`:

| Artifact | Required Field | Pass Condition |
|---|---|---|
| `task-031-authenticated-staging-smoke-report.json` | `finalDecision` | Must be `TASK_031_PASS_SAFE_TO_START_TASK_032` |
| `task-031-authenticated-staging-smoke-report.json` | `blockingIssues` | Must be empty array |
| `task-031-authenticated-staging-smoke-report.json` | `safeToStartTask032` | Must be `true` |
| `TASK_031_AUTHENTICATED_STAGING_SMOKE_REPORT.md` | Markdown gate rows | All gates must show PASS |
| `TASK_031_HANDOFF.md` | `safeToStartTask032` | Must be `true` (supports markdown-safe formats) |
| `task-031-staging-smoke-canary-readiness-report.json` | Verification exit codes | Must be `0` |
| `verify-task031-standalone.log` | Exit Code line | Must show Exit Code: 0 |

## Failure Conditions

The gate fails (blocking Task 032 activation) if any of:
- Task 031 artifacts are missing or unreadable
- Task 031 `finalDecision` is not PASS
- Task 031 `safeToStartTask032` is not `true`
- Task 031 `blockingIssues` is not empty
- Task 031 verification exit code is not `0`
- Task 031 handoff is inconsistent with the report
- Task 031 standalone log is missing or invalid

## Impact on Task 032

If the Task 031 dependency gate fails:
- `safeToStartTask033` is set to `false`
- `finalDecision` is set to `TASK_032_BLOCKED_TASK_031_FAILED`
- No activation can proceed
- All subsequent gates are skipped
- Report reflects the blocked status

## Verification

The gate is verified by:
1. Direct artifact loading and field validation in `Task031ProofLoaderService`
2. Integration tests in `task-032-routes-dependency.contract.test.ts`
3. End-to-end test in the controlled canary runner
4. Privacy scan to ensure no Task 031 raw data leaks into Task 032 responses
