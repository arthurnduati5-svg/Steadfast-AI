# Governed Execution Skill

## Overview
This skill enables OpenCode to execute tasks within the Steadfast Agent Execution Control Plane. All task state, evidence, and progression are managed by deterministic repository scripts.

## Workflow
1. **Read task status**: `node scripts/task-governor.mjs status --task <task-id>`
2. **Validate manifest lock**: Check `task-manifest.lock.json` in runtime storage
3. **Audit exact scope**: Inspect only task-owned paths
4. **Implement**: Change only allowed paths within manifest scope
5. **Enter ERROR_REPAIR** on current-scope failure, same task ID
6. **Run mandatory verification**: `node scripts/task-governor.mjs run --task <task-id> --gate <gate-id> -- <command>`
7. **Validate test inventory**: `node scripts/test-inventory-guard.mjs capture-final --task <task-id>`
8. **Validate evidence**: `node scripts/evidence-validator.mjs validate --task <task-id>`
9. **Validate visual truth** (frontend tasks): `node scripts/visual-evidence-validator.mjs validate --task <task-id>`
10. **Stage exact paths**: Create paths file, then `node scripts/task-governor.mjs stage --task <task-id> --paths-file <file>`
11. **Commit**: `git commit -m "<message>"`
12. **Run post-commit**: `node scripts/post-commit-verifier.mjs run --task <task-id>`
13. **Call finalizer**: `node scripts/finalize-task.mjs --task <task-id>`
14. Return only machine-authorized acceptance

## Examples

### Frontend Task
```
node scripts/task-governor.mjs advance --task FE-123 --to IMPLEMENTING
# implement changes
node scripts/task-governor.mjs run --task FE-123 --gate required-tests -- npm test
node scripts/test-inventory-guard.mjs capture-final --task FE-123
node scripts/evidence-validator.mjs validate --task FE-123
node scripts/visual-evidence-validator.mjs validate --task FE-123
node scripts/task-governor.mjs advance --task FE-123 --to STAGING
# create paths.txt
node scripts/task-governor.mjs stage --task FE-123 --paths-file paths.txt
git commit -m "feat(frontend): implement feature X"
node scripts/post-commit-verifier.mjs run --task FE-123
node scripts/finalize-task.mjs --task FE-123
```

### Backend Task
Same as frontend, without visual validation.

### Same-task Repair
```
node scripts/task-governor.mjs status --task BE-456
# active failures found
# repair code
node scripts/task-governor.mjs resolve --task BE-456 --failure <id> --evidence <path>
node scripts/task-governor.mjs run --task BE-456 --gate required-tests -- npm test
```

### Backlog Discovery
When a relevant issue is outside task scope, record it:
```
# record discovery in runtime storage backlog
```

## Important Rules
- **Agent cannot accept tasks**: Only finalize-task.mjs produces acceptance
- **Broad staging forbidden**: Use exact paths through task-governor.mjs stage
- **Foreground servers forbidden**: Launch servers as detached children
- **Owner browser profiles protected**: No modification of active profiles
- **Same task ERROR_REPAIR**: Never create a new repair task ID
- **Evidence must be machine-generated**: Agent cannot author evidence outcomes
