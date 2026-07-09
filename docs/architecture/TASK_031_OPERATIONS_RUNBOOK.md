# TASK 031 — Operations Runbook

**This runbook is backend-only and staging-only. No canary activation.**

## Pre-flight

1. Verify Task 030 commit e79ee74 exists
2. Verify Task 030 report is accepted (ACCEPTED_READY_YES)
3. Verify no staged Task 032+ files
4. Verify no frontend UI changes

## Runtime

1. Run `.\scripts\verify-task031.ps1` from repo root
2. Check each smoke gate passes
3. Confirm canary readiness decision is `ready_for_task032`
4. Confirm `safeToStartTask032` is true

## Post-flight

1. Stage only Task 031 files
2. Commit with message `feat(task-031): add staging smoke canary readiness runtime`
3. Do NOT push
4. Do NOT start Task 032

## Failure Recovery

If any gate fails, investigate blocking issues, fix, re-run verification.