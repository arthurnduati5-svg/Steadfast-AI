# Frontend Role and Access Matrix

## Version: task-037-v1

---

## Overview

Defines what each role can access in the frontend. The backend enforces role-based access at the API layer. The frontend must match these rules to avoid showing restricted UI elements.

---

## Role Definitions

| Role | Backend Verification | Frontend Behavior |
|------|---------------------|-------------------|
| `learner` / `student` | JWT role claim + school context | Student tutor, practice, revision, progress, recommendations |
| `teacher` | JWT role claim + school context + class scope | Student/class summaries, interventions, content governance |
| `admin` | JWT role claim + school context | School integration, content governance admin, ops diagnostics |
| `deen_reviewer` | JWT role claim + school context | Deen content classification and review |
| `internal` / `operator` | JWT role claim | Operations monitoring, incidents, backup/restore |
| `unauthenticated` | No JWT | Public health probes only |

---

## Access Matrix

| Area | Learner | Teacher | Admin | Internal | Unauthenticated |
|------|---------|---------|-------|----------|-----------------|
| **Student Tutor Session** | Full access | No access | No access | No access | No access |
| **Student Practice/Revision** | Own only | View summaries | No access | No access | No access |
| **Student Progress** | Own only | View summaries | No access | No access | No access |
| **Student Recommendations** | Own only | No access | No access | No access | No access |
| **Student Challenges** | Own only | No access | No access | No access | No access |
| **Teacher Class Summaries** | No access | Own classes | All classes | No access | No access |
| **Teacher Student Summaries** | No access | Own students | All students | No access | No access |
| **Teacher Interventions** | No access | Own scope | All interventions | No access | No access |
| **Content Governance (View)** | Own curriculum context | Teacher scope | Full scope | No access | No access |
| **Content Governance (Admin)** | No access | Propose sources | Full admin | No access | No access |
| **Source Review** | No access | No access | Admin only | No access | No access |
| **Deen Review** | No access | No access | Deen_reviewer / Admin | No access | No access |
| **Curriculum Import** | No access | No access | Admin only | No access | No access |
| **School Integration** | No access | No access | Admin only | No access | No access |
| **Deployment Readiness** | No access | No access | Admin only | Internal only | No access |
| **Operations Health** | No access | No access | Admin only | Internal only | Live/Ready probes only |
| **Operations Incidents** | No access | No access | Admin only | Internal only | No access |
| **Operations Backup/Restore** | No access | No access | Admin only | Internal only | No access |
| **Rate Limit Admin** | No access | No access | Admin only | No access | No access |
| **Health Probes** | No access | No access | No access | No access | Full access |

---

## Critical Frontend-Enforced Rules

1. **Students cannot access admin/internal diagnostics**: Do not show ops, deployment, or admin navigation to learners.
2. **Students cannot access teacher reports**: Learner role should never see teacher-only route links.
3. **Teachers cannot access raw private chat**: Teacher summaries must be privacy-guarded. No raw message content.
4. **Admins cannot see secrets or raw provider responses**: Operations views show safe metadata only.
5. **Internal operators see only safe operational metadata**: No PII, no student data, no private keys.
6. **Unauthenticated users see no protected data**: Only health endpoints are public.

---

## School Context Requirements

| Requirement | When Needed |
|-------------|-------------|
| Verified school context required | Tutor sessions, teacher reports, content governance, school integration, learner memory |
| Verified school context not required | Health probes, public auth pages (login), deployment readiness |
| Integration-deferred | Real school-system auth/OAuth |

If school context is missing, the frontend must:
- Block access to tutor, memory, evidence, and AI functionality
- Show a clear message: "We need your verified school session before opening the tutor."
- Offer to re-authenticate through school login

---

## Expired Context Handling

If school context expires mid-session:
- Backend returns `MISSING_VERIFIED_SCHOOL_CONTEXT`
- Frontend must stop all protected operations
- Show session-expired view
- Offer to re-authenticate
- Preserve local non-protected state for resumption after re-auth if possible
