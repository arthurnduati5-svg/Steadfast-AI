# Steadfast AI Agent Rules

## Steadfast Governed Execution

OpenCode may build features but may **not** accept its own task.

- every task requires an immutable manifest
- every task uses one task ID; no duplicate repair or closure task IDs
- every failure enters same-task ERROR_REPAIR
- only repository scripts advance task state
- only `scripts/finalize-task.mjs` emits acceptance
- exact-path staging is mandatory (git add ., -A, --all forbidden)
- task worktrees must be clean before finalization
- active browser profiles are protected
- foreground development servers are forbidden
- current-scope errors must be repaired before advancement
- unrelated defects become backlog discoveries, not manifest changes
- acceptance criteria may not change after manifest lock
- no duplicate repair or closure task may be created

See:
- `.opencode/skills/governed-execution/SKILL.md` — complete workflow
- `tasks/README.md` — task lifecycle documentation
- `agent-control/README.md` — control plane reference

---

## Product Standard

Steadfast AI is a premium Socratic learning platform for students.

Every agent must protect:
- clean UI
- smooth flows
- stable backend logic
- strong TypeScript contracts
- responsive layouts
- student-centered learning
- futuristic but calm product quality
- minimal clutter
- clear learning purpose

Build with positive ambition and practical discipline. Make changes that improve the product without damaging existing working logic.

---

## Core Development Rule

Make small, focused, safe changes.

Do not rewrite large files or rebuild whole pages unless the task explicitly asks for it.

Before editing:
1. inspect the existing implementation
2. identify current state and data flow
3. make the smallest useful patch
4. preserve working behavior
5. run validation

---

## Validation Command

After code changes, run:

```bash
npx tsc --noEmit --incremental false

## Session History

### 2026-07-13 — Task 040: Final Backend Logic Freeze (commit d4d6763)
- Created complete backend freeze infrastructure: contracts, validation, repository, 20 services, routes (30 endpoints)
- Added 63 test files with 464 assertions covering all freeze logic, continuity from Tasks 020-036, safety/boundary checks, role security
- Created 5 verification scripts: verify, report gen, JSON validate, privacy scan, runner
- Created 9 architecture docs + 3 ops docs + 2 reports (JSON + MD)
- Fixed 25 failing test files (path resolution, async/await, expectations)
- All gates pass: TypeScript (0 errors), backend build, Prisma validate+generate, 16 verification checks
- Commit: `chore(task-040): freeze accepted backend logic through task 036`
- Key files: `backend/src/contracts/task040BackendFreezeContracts.ts`, `backend/src/services/task040*.ts`, `scripts/verify-task040.ps1`
- Verdict: ACCEPTED_READY_YES — safe to start frontend integration or next phase