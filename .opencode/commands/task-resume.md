# task-resume

## Flow
1. Require task ID
2. Load locked manifest from runtime storage
3. Validate manifest hash against lock
4. Validate state hash chain
5. Validate worktree exists
6. Show active failures
7. Print next allowed action

## Rules
- Never create a new task
- Same task ID must be used
- Never skip ERROR_REPAIR state
