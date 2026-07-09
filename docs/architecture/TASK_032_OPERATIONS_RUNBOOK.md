# TASK 032 — Operations Runbook

**This runbook is backend-only and canary-dry-run-only. No live production activation.**

## Pre-flight Checks

1. Verify Task 031 report is accepted:
   - `reports/task-031-staging-smoke-canary-readiness-v1.json`
   - `verdict === "ACCEPTED_READY_YES"`
   - `safeToStartTask032 === true`

2. Verify environment flags are set:
   - `TASK032_CONTROLLED_CANARY=1`
   - `TASK032_CANARY_DRY_RUN=1`
   - `TASK032_REQUIRE_APPROVED_SCHOOL=1`
   - `TASK032_LIVE_STUDENT_PROTECTION=1`
   - `TASK032_NO_OPEN_ROLLOUT=1`

3. Verify no Task 033+ files are staged

4. Verify no frontend UI changes are included

## Runtime

1. Run `.\scripts\verify-task032.ps1` from repo root
2. Each step will log to `logs/task-032/`
3. Monitor output for PASS/FAIL per step
4. On failure, inspect the corresponding log file

### Verification Steps

| Step | What It Validates |
|------|-------------------|
| Task 031 Dependency Proof | Task 031 report loaded, verdict accepted, safeToStartTask032 true |
| TypeScript noEmit | Zero TypeScript errors |
| Backend Build | Backend compiles successfully |
| Prisma Validate | Prisma schema is valid |
| Prisma Generate | Prisma client generates successfully |
| Task 032 Focused Tests | 65+ task-specific tests pass |
| Task 020-031 Regression | All previous task tests still pass |
| Phase 3 Regression | Phase 3 tests still pass |
| Full Backend Suite | Complete backend test suite (optional, skip with `-SkipFullBackendSuite`) |
| Generate Report | Final JSON and Markdown reports generated |

## Post-flight

1. Verify reports generated:
   - `reports/task-032-controlled-canary-activation-v1.json`
   - `reports/task-032-controlled-canary-activation-v1.md`

2. Verify JSON report validation passes:
   ```
   node scripts/task032-json-validate.cjs
   ```

3. Verify privacy scan passes:
   ```
   node scripts/task032-privacy-scan.cjs
   ```

4. Stage only Task 032 files

5. Commit with message: `feat(task-032): add controlled real-school canary activation runtime`

6. Do NOT push to main until Task 033 is ready

## Failure Recovery

| Failure | Recovery |
|---------|----------|
| Task 031 proof missing | Complete Task 031 verification first |
| TypeScript errors | Fix type errors and re-run |
| Backend build fails | Fix compilation errors |
| Prisma errors | Validate schema and re-generate |
| Tests fail | Fix failing tests before proceeding |
| Report generation fails | Check gen-task032-report.cjs for errors |
| JSON validation fails | Check report contains all required sections |
| Privacy scan fails | Fix leak before proceeding |

## Rollback

If a canary must be rolled back after activation:
1. Admin/operator invokes rollback action
2. State machine transitions to `rolled-back`
3. Runtime access is permanently blocked
4. Safe audit summary is preserved
5. Learning evidence is NOT destructively deleted
