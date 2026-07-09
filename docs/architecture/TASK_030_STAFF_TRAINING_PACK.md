# Task 030 — Staff Training Pack

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Staff Training Pack provides documentation and checklists to train staff on the Controlled Staging Rehearsal process. All training docs are privacy-safe, use synthetic fixtures only, and do not expose any real data or production configuration.

## Training Pack Contents

| Document | Path | Audience | Purpose |
|----------|------|----------|---------|
| STAFF_TRAINING_PACK.md | `docs/ops/task-030/STAFF_TRAINING_PACK.md` | All staff | Comprehensive training reference covering expansion principles, console reading, control actions, rollback, privacy, and escalation paths |
| ADMIN_OPERATOR_RUNBOOK.md | `docs/ops/task-030/ADMIN_OPERATOR_RUNBOOK.md` | Admin/operator | Step-by-step runbook for running the rehearsal, executing control actions, and verifying results |
| TEACHER_QUICK_START.md | `docs/ops/task-030/TEACHER_QUICK_START.md` | Teacher | Quick reference for teacher-limited oversight view, permissions, privacy |
| STUDENT_SAFE_MESSAGE_TEMPLATE.md | `docs/ops/task-030/STUDENT_SAFE_MESSAGE_TEMPLATE.md` | Student-facing | Templates for safe communication to students about expansion status |
| ROLLBACK_AND_KILL_SWITCH_DRILL.md | `docs/ops/task-030/ROLLBACK_AND_KILL_SWITCH_DRILL.md` | Admin/operator | Step-by-step drill guide for kill-switch and rollback procedures |
| REHEARSAL_DAY_CHECKLIST.md | `docs/ops/task-030/REHEARSAL_DAY_CHECKLIST.md` | Admin/operator | Before/during/after checklist for the rehearsal day |

## Training Pack Checklist

### Pre-Generation Validation
- [ ] Task 029 proof is valid
- [ ] Staging environment gate passes
- [ ] No-live-student guard passes
- [ ] Synthetic fixture exists and all IDs use `task030_safe_` prefix
- [ ] Role token matrix is generated

### Generation
- [ ] STAFF_TRAINING_PACK.md is generated
- [ ] ADMIN_OPERATOR_RUNBOOK.md is generated
- [ ] TEACHER_QUICK_START.md is generated
- [ ] STUDENT_SAFE_MESSAGE_TEMPLATE.md is generated
- [ ] ROLLBACK_AND_KILL_SWITCH_DRILL.md is generated
- [ ] REHEARSAL_DAY_CHECKLIST.md is generated

### Post-Generation Validation
- [ ] All 6 documents exist at expected paths
- [ ] No document contains real student data
- [ ] No document contains production database URLs
- [ ] No document contains API tokens or secrets
- [ ] No document contains raw AI prompts or responses
- [ ] No document contains private learner memory
- [ ] All documents reference `task030_safe_` fixture IDs only
- [ ] All documents are consistent with the rehearsal state machine

## Privacy Requirements

| Data Type | Must Be Absent From Training Docs |
|-----------|-----------------------------------|
| Real student names | ✅ |
| Real student emails | ✅ |
| Real student IDs | ✅ |
| Production database URLs | ✅ |
| API tokens/secrets | ✅ |
| Private learner memory | ✅ |
| Raw student chat | ✅ |
| Teacher-only notes (raw) | ✅ |
| Safeguarding raw details | ✅ |
| AI prompts/responses | ✅ |