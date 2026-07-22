# CLI Reference

## Usage

```
node scripts/task-governor.mjs <command> [options]
```

## Commands

### `doctor`
Verify the governor installation.

```
node scripts/task-governor.mjs doctor
```
Exit codes: 0 (operational), 1 (issues detected)

### `validate <task-id>`
Validate a task manifest.

```
node scripts/task-governor.mjs validate qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (valid), 11 (invalid)

### `bootstrap <task-id>`
Bootstrap a task: capture baseline workspace, set initial state to IMPLEMENTING.

```
node scripts/task-governor.mjs bootstrap qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (success), 11 (manifest error)

### `status <task-id> [--json]`
Show current task state.

```
node scripts/task-governor.mjs status qbank-runtime-composition-persistence-truth
node scripts/task-governor.mjs status qbank-runtime-composition-persistence-truth --json
```
Exit codes: 0 (active), 10 (ERROR_REPAIR), 18 (BLOCKED)

### `resume <task-id>`
Show the exact next required action after interruption.

```
node scripts/task-governor.mjs resume qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (active), 10 (ERROR_REPAIR), 18 (BLOCKED)

### `run-gate <task-id> <gate-id>`
Run a specific gate.

```
node scripts/task-governor.mjs run-gate qbank-runtime-composition-persistence-truth backend-ts
```
Exit codes: 0 (passed), 1+ (failed)

### `verify-todo <task-id> <todo-id>`
Mark a todo as verified complete.

```
node scripts/task-governor.mjs verify-todo qbank-runtime-composition-persistence-truth QBANK-1
```
Exit codes: 0 (verified), 1+ (error)

### `prepare-commit <task-id>`
Validate staging for a commit.

```
node scripts/task-governor.mjs prepare-commit qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (passed), 13 (scope violation), 15 (order violation)

### `record-implementation-commit <task-id>`
Record that an implementation commit was made.

```
node scripts/task-governor.mjs record-implementation-commit qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (recorded), 13 (scope violation), 15 (order violation)

### `verify-post-commit <task-id>`
Run post-commit verification gates.

```
node scripts/task-governor.mjs verify-post-commit qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (passed), 1+ (failed)

### `record-accountability-commit <task-id>`
Record an accountability (docs-only) commit.

```
node scripts/task-governor.mjs record-accountability-commit qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (recorded), 13 (scope violation), 15 (order violation), 17 (sentinel found)

### `finalize <task-id>`
Finalize the task. Independent verification of all gates.

```
node scripts/task-governor.mjs finalize qbank-runtime-composition-persistence-truth
```
Exit codes: 0 (accepted), 17 (not accepted)

### `explain <task-id>`
Show detailed task explanation including todos and gates.

```
node scripts/task-governor.mjs explain qbank-runtime-composition-persistence-truth
```

## Exit Code Model

| Code | Meaning |
|------|---------|
| 0 | Command or gate passed |
| 10 | Task locked in ERROR_REPAIR |
| 11 | Manifest invalid |
| 12 | Evidence integrity failure |
| 13 | Workspace scope violation |
| 14 | Test inventory regression |
| 15 | Commit order violation |
| 16 | Required command timeout |
| 17 | Finalization not permitted |
| 18 | External blocker recorded |

## State Requirements

| Command | Required State |
|---------|---------------|
| bootstrap | any (creates initial) |
| status | any |
| resume | any |
| run-gate | any executable state |
| verify-todo | IMPLEMENTING, ERROR_REPAIR |
| prepare-commit | PRE_COMMIT_VERIFICATION, STAGING |
| record-implementation-commit | STAGING |
| verify-post-commit | IMPLEMENTATION_COMMITTED |
| record-accountability-commit | POST_COMMIT_VERIFICATION, ACCOUNTABILITY_COMMITTED |
| finalize | FINAL_REPOSITORY_PROOF, ACCOUNTABILITY_COMMITTED |
