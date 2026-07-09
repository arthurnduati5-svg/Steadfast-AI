# Task 030 — Task 029 Dependency Gate

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** build canary mode/activation
> - Task 030 does **NOT** build rollout
> - Task 030 does **NOT** build school-wide launch
> - Task 030 does **NOT** deploy
> - Task 030 does **NOT** send real communication
> - Task 030 does **NOT** call live AI
> - Task 030 does **NOT** write live school connectors
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Task 029 Dependency Gate ensures that the Controlled Staging Rehearsal Runtime only operates when its required upstream (Task 029) is fully accepted and proven. This prevents the rehearsal from running against unverified, partially built, or non-functional downstream dependencies.

## What It Checks

| Check | Detail | Required Value |
|-------|--------|----------------|
| **Task 029 Report Exists** | Task 029 JSON report is present at `docs/ops/task-029/task-029-expansion-operations-console-report.json` | `true` |
| **Implementation Commit** | Git commit `4e3ed4c` exists in history | Present |
| **Acceptance Commit** | Git commit `2ef56aa` exists in history | Present |
| **Commit Order** | `2ef56aa` is an ancestor of (or same as) `4e3ed4c` | Verified |
| **taskId** | Report `taskId` is `"029"` | `true` |
| **safeToStartTask030** | Report `safeToStartTask030` is `true` | `true` |
| **finalDecision** | Report `finalDecision` is `"TASK_029_PASS_SAFE_TO_START_TASK_030"` | Exact match |
| **blockingIssues** | Report `blockingIssues` array is empty | Empty |

## How It Blocks

If any dependency gate check fails, the rehearsal runtime refuses to start:

1. **All rehearsal endpoints** return HTTP `503 Service Unavailable`.
2. **Response body** includes a structured error:
   ```json
   {
     "error": "TASK029_DEPENDENCY_GATE_BLOCKED",
     "message": "Task 029 proof is not valid. Controlled staging rehearsal requires Task 029 to be accepted.",
     "details": {
       "reportFound": false,
       "implementationCommitVerified": false,
       "acceptanceCommitVerified": false,
       "safeToStartTask030": false,
       "blockingIssues": ["Report not found at docs/ops/task-029/task-029-expansion-operations-console-report.json"]
     }
   }
   ```
3. **State machine** remains in `blocked` state.
4. **Health endpoint** still responds and reports `dependencyGate: "blocked"`.
5. **Audit events** for blocked attempts are recorded.

## Git Commit Verification

### Implementation Commit `4e3ed4c`

This commit implements the Task 029 Expansion Operations Console Runtime (backend only). It must exist in the git history at the time of Task 030 gate checking.

### Acceptance Commit `2ef56aa`

This commit formally accepts Task 029 with verdict `ACCEPTED_READY_YES` and sets `safeToStartTask030: true`. It must exist in the git history and must be a descendant of (or identical to) the implementation commit.

### Verification Command

```bash
node -e "
const fs = require('fs');
const path = 'docs/ops/task-029/task-029-expansion-operations-console-report.json';
const r = JSON.parse(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
if (r.taskId !== '029') process.exit(1);
if (r.safeToStartTask030 !== true) process.exit(2);
if (r.finalDecision !== 'TASK_029_PASS_SAFE_TO_START_TASK_030') process.exit(3);
console.log('TASK_029_PROOF_VALID');
process.exit(0);
"
```

Exit code 0 = PASS, any non-zero = FAIL.

## Gate Pass/Fail Criteria

### PASS — All of:
- [x] Task 029 report found at expected path
- [x] Report `taskId` is `"029"`
- [x] Report `safeToStartTask030` is `true`
- [x] Report `finalDecision` is `"TASK_029_PASS_SAFE_TO_START_TASK_030"`
- [x] Report `blockingIssues` is empty
- [x] Git commit `4e3ed4c` (implementation) exists
- [x] Git commit `2ef56aa` (acceptance) exists
- [x] `2ef56aa` is not behind `4e3ed4c` in commit ancestry
- [x] Verification command exits with code 0

### FAIL — Any of:
- [ ] Task 029 report missing or unreadable
- [ ] Report `taskId` is not `"029"`
- [ ] `safeToStartTask030` is not `true`
- [ ] `finalDecision` does not match expected
- [ ] `blockingIssues` is non-empty
- [ ] Implementation commit `4e3ed4c` is absent
- [ ] Acceptance commit `2ef56aa` is absent
- [ ] Acceptance precedes implementation incorrectly
- [ ] Verification command exits non-zero

## Integration Points

The gate integrates with:
- **File system**: Reads Task 029 JSON report from `docs/ops/task-029/`.
- **Git history**: Verifies commits `2ef56aa` and `4e3ed4c` via `git cat-file -t` and `git merge-base --is-ancestor`.
- **Configuration flags**: The gate result is cached in the rehearsal state machine.

## Recovery

If the gate fails, fix the underlying issue:
1. Ensure Task 029 report is present and correctly formatted.
2. Ensure git commits are reachable on the current branch.
3. Re-run the verification command.
4. Once all checks pass, the gate automatically unblocks and the state machine resets to `created`.