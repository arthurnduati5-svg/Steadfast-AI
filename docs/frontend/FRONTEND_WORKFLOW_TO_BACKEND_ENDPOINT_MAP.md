# Frontend Workflow to Backend Endpoint Map

## Version: task-037-v1
## Integration Mode: mock-ready-integration-deferred
## Last Updated: 2026-06-30

---

## Overview

Maps every frontend screen/workflow to backend API endpoints. Each row documents method, path, auth requirements, role requirements, school context needs, and integration status.

---

## Workflow 1: Student Onboarding / Verified School Context

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| School Login / Auth | POST | `/api/integrations/school/auth` | None | Any | No | Durable | Integration-deferred |
| School Context Refresh | POST | `/api/integrations/school/context/refresh` | schoolAuth | Any | Yes | Durable | Integration-deferred |
| Student Home / Launch | GET | `/api/learner/sessions/start` (preflight) | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 2: Student Tutor Conversation

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Tutor Chat | POST | `/api/tutor/conversation/turn` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Tutor Chat (SSE) | POST | `/api/tutor/conversation/stream` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Start | POST | `/api/learner/sessions/start` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Step | POST | `/api/learner/sessions/:sessionId/step` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Pause | POST | `/api/learner/sessions/:sessionId/pause` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Complete | POST | `/api/learner/sessions/:sessionId/complete` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Resume | GET | `/api/learner/sessions/:sessionId/state` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Summary | GET | `/api/learner/sessions/:sessionId/summary` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Session Events | GET | `/api/learner/sessions/:sessionId/events` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 3: Student Session Resume

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Resume Session | GET | `/api/learner/sessions/:sessionId/state` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Transition Mode | POST | `/api/learner/sessions/:sessionId/transition` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 4: Student Practice Attempt

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Submit Practice | POST | `/api/copilot/practice-mastery/attempts` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| List Attempts | GET | `/api/copilot/practice-mastery/attempts` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Next Practice | POST | `/api/copilot/practice-mastery/next` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 5: Student Revision Queue

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Review Due Items | GET | `/api/copilot/practice-mastery/review-due` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Revision Why | GET | `/api/learner/revision/:revisionItemId/why` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 6: Student Mastery and Weak-Skill Recovery

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Mastery Overview | GET | `/api/copilot/practice-mastery/mastery` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Mastery Resolve | POST | `/api/copilot/practice-mastery/mastery/resolve` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Weak Skill Path | GET | `/api/learner/remediation/path` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Remediation Step Complete | POST | `/api/learner/remediation/:pathId/steps/:stepIndex/complete` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 7: Student Progress Dashboard

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Progress Narrative | GET | `/api/learner/progress/narrative` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Privacy Visibility | GET | `/api/learner/privacy/visibility` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 8: Student Why-This-Next Recommendation

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Next Recommendation | GET | `/api/learner/recommendations/next` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Recommendation Explanation | GET | `/api/learner/recommendations/:recommendationId/explanation` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Submit Feedback | POST | `/api/learner/recommendations/:recommendationId/feedback` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Record Interaction | POST | `/api/learner/recommendations/:recommendationId/interaction` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Adaptive Profile | GET | `/api/learner/recommendations/profile` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Tuning Context | GET | `/api/learner/recommendations/tuning-context` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Update Preferences | PATCH | `/api/learner/recommendations/preferences` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Submit Preference | POST | `/api/learner/recommendations/preference` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 9: Student Content-Gap State

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Learner Curriculum Context | GET | `/api/content-governance/learner/curriculum/context` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 10: Student Adaptive Challenges

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Next Challenge | GET | `/api/learner/challenges/next` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Request Challenge | POST | `/api/learner/challenges` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Challenge Detail | GET | `/api/learner/challenges/:challengeId` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Submit Attempt | POST | `/api/learner/challenges/:challengeId/attempt` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Request Hint | GET | `/api/learner/challenges/:challengeId/hint` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Difficulty Calibration | GET | `/api/learner/difficulty/calibration` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 11: Teacher Dashboard

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Student Summary | GET | `/api/teacher/reports/students/:studentId/summary` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Class Summary | GET | `/api/teacher/reports/classes/:classId/summary` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Student Evidence | GET | `/api/teacher/reports/students/:studentId/evidence` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Class Revision Due | GET | `/api/teacher/reports/classes/:classId/revision-due` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Class Next Actions | GET | `/api/teacher/reports/classes/:classId/next-actions` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Student Next Actions | GET | `/api/teacher/reports/students/:studentId/next-actions` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Teacher Interventions Create | POST | `/api/teacher-interventions` | schoolAuth | Teacher | Yes | Durable | Backend-ready |
| Teacher Interventions Detail | GET | `/api/teacher-interventions/:id` | schoolAuth | Teacher | Yes | Durable | Backend-ready |

---

## Workflow 12: Admin Content Governance

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Curriculum Summary | GET | `/api/content-governance/curriculum/summary` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Active Versions | GET | `/api/content-governance/curriculum/active` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Curriculum Resolve | POST | `/api/content-governance/curriculum/resolve` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| List Approved Sources | GET | `/api/content-governance/sources` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Propose Source | POST | `/api/content-governance/sources/propose` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Review Source | POST | `/api/content-governance/sources/:sourceId/review` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Content Gap Summary | GET | `/api/content-governance/gaps/summary` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Import Dry Run | POST | `/api/content-governance/import/dry-run` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Deen Review Decision | POST | `/api/content-governance/deen/review-decision` | schoolAuth | Deen Reviewer/Admin | Yes | Durable | Backend-ready |
| Grounding Check | POST | `/api/content-governance/grounding/check` | schoolAuth | Teacher/Admin | Yes | Durable | Backend-ready |
| Diagnostics | GET | `/api/content-governance/diagnostics` | schoolAuth | Admin | Yes | Durable | Backend-ready |

---

## Workflow 13: Admin School Integration Diagnostics

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| School Integration Status | GET | `/api/integrations/school/status` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Trigger Roster Sync | POST | `/api/integrations/school/roster/sync` | schoolAuth | Admin | Yes | Durable | Integration-deferred |

---

## Workflow 14: Admin / Operations Diagnostics

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Operations Health | GET | `/api/ops/health` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Operations Readiness | GET | `/api/ops/readiness` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Operations Metrics | GET | `/api/ops/metrics` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Incidents List | GET | `/api/ops/incidents` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Backup Status | GET | `/api/ops/backup/status` | schoolAuth | Admin | Yes | Durable | Backend-ready |
| Deployment Readiness | GET | `/api/deployment/readiness` | schoolAuth | Admin | No | Durable | Backend-ready |
| Rate Limit Admin | GET | `/api/admin/rate-limits` | schoolAuth | Admin | Yes | Durable | Backend-ready |

---

## Workflow 15: Public / No-Auth Health Probes

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Liveness | GET | `/api/health/live` | None | None | No | None | Backend-ready |
| Readiness | GET | `/api/health/ready` | None | None | No | None | Backend-ready |
| Dependencies | GET | `/api/health/dependencies` | None | None | No | None | Backend-ready |
| Routes | GET | `/api/health/routes` | None | None | No | None | Backend-ready |

---

## Workflow 16: Tutor State Frontend Sync

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| Get Tutor State | GET | `/api/copilot/tutor-state` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Resolve Context | POST | `/api/copilot/tutor-state/resolve` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Patch State | PATCH | `/api/copilot/tutor-state` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Get V2 State | GET | `/api/copilot/tutor-state/v2` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Get V2 Summary | GET | `/api/copilot/tutor-state/v2/summary` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Get V2 History | GET | `/api/copilot/tutor-state/v2/history` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| V2 Resolve | POST | `/api/copilot/tutor-state/v2/resolve` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| V2 Patch | PATCH | `/api/copilot/tutor-state/v2/patch` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| V2 Reset | POST | `/api/copilot/tutor-state/v2/reset` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| V2 Snapshot | POST | `/api/copilot/tutor-state/v2/snapshot` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| V2 Validate | POST | `/api/copilot/tutor-state/v2/validate` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow 17: Learner Memory

| Screen | Method | Path | Auth | Role | School Context | Persistence | Integration Status |
|--------|--------|------|------|------|---------------|-------------|-------------------|
| List Memory | GET | `/api/copilot/learner-memory` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Record Event | POST | `/api/copilot/learner-memory/events` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Resolve Memory | POST | `/api/copilot/learner-memory/resolve` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Patch Memory | PATCH | `/api/copilot/learner-memory/:memoryId` | schoolAuth | Learner | Yes | Durable | Backend-ready |
| Delete Memory | DELETE | `/api/copilot/learner-memory/:memoryId` | schoolAuth | Learner | Yes | Durable | Backend-ready |

---

## Workflow Summary Counts

| Status | Count |
|--------|-------|
| Backend-ready | 55+ |
| Integration-deferred (school) | 2 |
| Integration-deferred (pilot/rollout) | ~10 |
| Internal-only (not frontend-facing) | ~15 |
