# TASK 031 — Task 030 Dependency Gate

**This doc is backend-only and staging-only. No real students, no live data, no activation.**

Task 031 cannot run unless Task 030 proof is accepted.

The proof loader (`task031Task030ProofLoaderService.ts`) verifies:

- Commit e79ee74 exists
- Task 030 report exists in `docs/ops/task-030/task-030-controlled-staging-rehearsal-report.json`
- Verdict is `ACCEPTED_READY_YES`
- `safeToStartTask031` is true
- No remaining blockers

If proof fails, Task 031 must fail closed with `safeToStartTask032: false`.