# task-start

## Flow
1. Require task ID from owner
2. Require exact original prompt file
3. Require immutable manifest file
4. Run: `node scripts/bootstrap-task.mjs create --manifest <path> --prompt <path>`
5. Capture baseline: `node scripts/workspace-guard.mjs capture-baseline --task <task-id>`
6. Advance to AUDITING: `node scripts/task-governor.mjs advance --task <task-id> --to AUDITING`
7. Print task worktree and exact resume command

## Required
- Task ID (alphanumeric, hyphen, underscore only)
- Original prompt file (exact content)
- Manifest file (validated against schema)
