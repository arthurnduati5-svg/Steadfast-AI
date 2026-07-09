# Task 030 — Journey Rehearsals

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

Journey rehearsals simulate the full experience of each role interacting with the operations console, control actions, and status views. Each journey runs against synthetic fixtures only. No real data is used. No live side effects occur.

## Admin/Operator Journey

The admin and operator roles share identical permissions in Task 030. The journey exercises the full admin scope.

### Steps

| Step | Action | Expected Outcome | Dry-Only |
|------|--------|-----------------|----------|
| 1 | Request operations dashboard | Receive safe dashboard read model (aggregate data only) | ✅ |
| 2 | Request stage summary | Receive aggregate stage counts with no raw identities | ✅ |
| 3 | Request health summary | Receive aggregate health metrics with safe explanation | ✅ |
| 4 | Request monitoring timeline | Receive safe event summaries with no raw identities | ✅ |
| 5 | Request oversight queue | Receive safe oversight items with severity | ✅ |
| 6 | Request pause expansion | Preflight check passes; pause is simulated (no actual effector call) | ✅ |
| 7 | Request resume expansion | Resume is simulated; state machine transitions correctly | ✅ |
| 8 | Request enable kill switch | Kill-switch enable is simulated; student access marked blocked | ✅ |
| 9 | Request disable kill switch | Kill-switch disable passes recheck gate; student access restored | ✅ |
| 10 | Request execute rollback | Rollback is simulated; expanded access marked blocked; audit preserved | ✅ |
| 11 | Request completion review generation | Review generates safe summary with honest safeToStart | ✅ |
| 12 | Request reports | Report panel returns safe artifact paths; no raw logs in output | ✅ |

### Denied Steps (for both admin and operator — these should 403)

| Action | Expected Result |
|--------|-----------------|
| View other role's fixture data | 403 Forbidden |
| View raw student chat | 403 Forbidden |
| View private learner memory | 403 Forbidden |

### Steps Total: 12 pass, 3 denial

## Teacher Journey

Teachers have strictly limited access. They can view assigned oversight items only. They cannot trigger controls or view admin dashboards.

### Steps

| Step | Action | Expected Result | Dry-Only |
|------|--------|-----------------|----------|
| 1 | Request operations dashboard | 403 Forbidden — denied dashboard access | ✅ |
| 2 | Request assigned oversight queue | Receive only their assigned oversight items (safe summaries) | ✅ |
| 3 | Request pause expansion | 403 Forbidden | ✅ |
| 4 | Request resume expansion | 403 Forbidden | ✅ |
| 5 | Request enable kill switch | 403 Forbidden | ✅ |
| 6 | Request disable kill switch | 403 Forbidden | ✅ |
| 7 | Request execute rollback | 403 Forbidden | ✅ |
| 8 | Request reports | 403 Forbidden | ✅ |

### Additional Denials

| Action | Expected Result |
|--------|-----------------|
| View raw private data (student chat, memory) | 403 Forbidden |
| View admin/teacher-only notes | 403 Forbidden |

### Steps Total: 2 pass, 8+ denials

## Student Journey — Self-Only Boundary

Students can only query their own expansion status. They cannot see any other student's data or any operations internals.

### Steps

| Step | Action | Expected Result | Dry-Only |
|------|--------|-----------------|----------|
| 1 | Request own expansion status | Receive their own status (available/unavailable) with safe message | ✅ |
| 2 | Request operations dashboard | 403 Forbidden | ✅ |
| 3 | Request health internals | 403 Forbidden | ✅ |
| 4 | Request oversight queue | 403 Forbidden | ✅ |
| 5 | Request control actions (pause/resume/kill/rollback) | 403 Forbidden | ✅ |
| 6 | Request reports | 403 Forbidden | ✅ |
| 7 | Request another student's status | 403 Forbidden | ✅ |
| 8 | View teacher/admin notes | 403 Forbidden | ✅ |
| 9 | View private learner memory (other students) | 403 Forbidden | ✅ |

### Steps Total: 1 pass, 8 denials

## Unknown Role Denial

Unknown roles must be denied all access.

### Steps

| Step | Action | Expected Result | Dry-Only |
|------|--------|-----------------|----------|
| 1 | Request any operations endpoint | 403 Forbidden | ✅ |
| 2 | Request own status endpoint | 403 Forbidden | ✅ |
| 3 | Request oversight | 403 Forbidden | ✅ |
| 4 | Request reports | 403 Forbidden | ✅ |
| 5 | Request health | 403 Forbidden | ✅ |

### Steps Total: 0 pass, 5 denials

## Dry-Only Guarantees

| Guarantee | Enforced By |
|-----------|-------------|
| All journeys use `task030_safe_` fixture IDs | Synthetic school fixture + token matrix |
| No real data appears in journey inputs or outputs | No-live-student guard + privacy scan |
| No production effectors are called | Staging environment gate + journey simulation |
| All journeys produce evidence events | Evidence ledger |
| All journey results are recorded | Report generation engine |
| Teacher can only see assigned oversight | Role token matrix permission check |
| Student can only see own status | Role token matrix permission check |
| Unknown role gets 403 on all endpoints | Role token matrix permission check |