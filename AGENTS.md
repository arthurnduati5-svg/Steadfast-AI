# Steadfast AI Agent Rules

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