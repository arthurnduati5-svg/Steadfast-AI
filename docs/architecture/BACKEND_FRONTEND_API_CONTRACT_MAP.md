# Backend Frontend API Contract Map

## Overview
This document maps all backend API endpoints that serve frontend consumers. Endpoints are grouped by frontend area. Each entry documents the method, path, request shape, response shape, auth requirement, and status.

## Conventions
- **Base URL**: `/api` or as specified
- **Auth**: `schoolAuthMiddleware` (JWT Bearer token) on all routes unless noted
- **School Context**: `requireVerifiedSchoolContext` on tutor runtime routes
- **Error Envelope**: `{ ok: false, error: { code: string, message: string } }`
- **Success Envelope**: `{ ok: true, ...data }` or direct JSON response

---

## 1. Student Tutor Session

### POST /api/learner/sessions/start
- **Purpose**: Start or resume a learning session
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Request**: `{ subject?, topic?, skillTag?, sessionIntent?, clientContext? }`
- **Response**: `{ ok, session, resumed, degradeToHydration, carryOverSummary }`
- **Status**: Ready

### GET /api/learner/sessions/:sessionId/state
- **Purpose**: Get current session state
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: `{ ok, session }`
- **Status**: Ready

### POST /api/learner/sessions/:sessionId/step
- **Purpose**: Execute a learning step (conversation, practice, etc.)
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Request**: `{ learnerActionType, message, attemptText?, selectedOptionId?, feedbackType?, clientContext? }`
- **Response**: `{ ok, result }`
- **Status**: Ready

### POST /api/learner/sessions/:sessionId/transition
- **Purpose**: Transition learning mode
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Request**: `{ requestedMode, reason? }`
- **Response**: `{ ok, session, decision }`
- **Status**: Ready

### POST /api/learner/sessions/:sessionId/pause
- **Purpose**: Pause session
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: `{ ok, session }`
- **Status**: Ready

### POST /api/learner/sessions/:sessionId/complete
- **Purpose**: Complete/close session
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: `{ ok, session, summary }`
- **Status**: Ready

### GET /api/learner/sessions/:sessionId/summary
- **Purpose**: Get session completion summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: `{ ok, summary }`
- **Status**: Ready

### GET /api/learner/sessions/:sessionId/events
- **Purpose**: List session events
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Query**: `?limit=50`
- **Response**: `{ ok, events }`
- **Status**: Ready

---

## 2. Tutor Conversation

### POST /api/tutor/conversation/turn
- **Purpose**: Process a tutor conversation turn
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Request**: Full turn request object
- **Response**: Turn result with safe response
- **Status**: Ready

### POST /api/tutor/conversation/stream
- **Purpose**: SSE-streaming conversation turn
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Request**: Turn request with sessionId
- **Response**: SSE stream
- **Status**: Ready

---

## 3. Tutor State

### GET /api/copilot/tutor-state
- **Purpose**: Get current tutor state
- **Auth**: schoolAuthMiddleware
- **Query**: `?sessionId=`
- **Response**: `{ ok, tutorState }`
- **Status**: Ready

### POST /api/copilot/tutor-state/resolve
- **Purpose**: Resolve full tutor turn context
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, context }`
- **Status**: Ready

### PATCH /api/copilot/tutor-state
- **Purpose**: Patch tutor state fields
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, tutorState }`
- **Status**: Ready

### GET /api/copilot/tutor-state/v2
- **Purpose**: Get v2 dedicated tutor state
- **Auth**: schoolAuthMiddleware
- **Response**: Full dedicated state
- **Status**: Ready

### GET /api/copilot/tutor-state/v2/summary
- **Purpose**: Lightweight state summary
- **Auth**: schoolAuthMiddleware
- **Response**: State summary
- **Status**: Ready

### GET /api/copilot/tutor-state/v2/history
- **Purpose**: State history snapshots
- **Auth**: schoolAuthMiddleware
- **Response**: History list
- **Status**: Ready

### POST /api/copilot/tutor-state/v2/resolve
- **Purpose**: Forced re-resolution
- **Auth**: schoolAuthMiddleware
- **Response**: Resolved state
- **Status**: Ready

### PATCH /api/copilot/tutor-state/v2/patch
- **Purpose**: Structured patch operation
- **Auth**: schoolAuthMiddleware
- **Response**: Patched state
- **Status**: Ready

### POST /api/copilot/tutor-state/v2/reset
- **Purpose**: Reset state by scope
- **Auth**: schoolAuthMiddleware
- **Response**: Reset result
- **Status**: Ready

### POST /api/copilot/tutor-state/v2/snapshot
- **Purpose**: Create state snapshot
- **Auth**: schoolAuthMiddleware
- **Response**: Snapshot result
- **Status**: Ready

### POST /api/copilot/tutor-state/v2/validate
- **Purpose**: Validate state object
- **Auth**: schoolAuthMiddleware
- **Response**: Validation result
- **Status**: Ready

---

## 4. Learner Memory

### GET /api/copilot/learner-memory
- **Purpose**: List durable learner memory
- **Auth**: schoolAuthMiddleware
- **Query**: `?kind=&subject=&topic=&limit=&includeDeleted=`
- **Response**: `{ ok, memory, status }`
- **Status**: Ready

### POST /api/copilot/learner-memory/events
- **Purpose**: Record learning event → memory
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, event, memoryCreated, memoryUpdated }`
- **Status**: Ready

### POST /api/copilot/learner-memory/resolve
- **Purpose**: Resolve memory context
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, learnerMemoryContext }`
- **Status**: Ready

### PATCH /api/copilot/learner-memory/:memoryId
- **Purpose**: Patch safe memory fields
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, memory }`
- **Status**: Ready

### DELETE /api/copilot/learner-memory/:memoryId
- **Purpose**: Soft-delete memory item
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, memory }`
- **Status**: Ready

---

## 5. Practice / Mastery / Revision

### POST /api/copilot/practice-mastery/attempts
- **Purpose**: Create practice attempt, propagate to mastery/memory/revision
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, attempt, masteryUpdates, memoryUpdates, reviewItems, recommendations }`
- **Status**: Ready

### GET /api/copilot/practice-mastery/attempts
- **Purpose**: List practice attempts
- **Auth**: schoolAuthMiddleware
- **Query**: `?subject=&topic=&limit=`
- **Response**: `{ ok, attempts }`
- **Status**: Ready

### POST /api/copilot/practice-mastery/next
- **Purpose**: Get next-practice recommendations
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, recommendations }`
- **Status**: Ready

### GET /api/copilot/practice-mastery/mastery
- **Purpose**: List mastery snapshots
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, masterySnapshots, status }`
- **Status**: Ready

### POST /api/copilot/practice-mastery/mastery/resolve
- **Purpose**: Resolve mastery context
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, context }`
- **Status**: Ready

### PATCH /api/copilot/practice-mastery/mastery/:masteryId
- **Purpose**: Patch safe mastery fields
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, masterySnapshot }`
- **Status**: Ready

### GET /api/copilot/practice-mastery/review-due
- **Purpose**: Get due spaced reviews
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, reviewItems }`
- **Status**: Ready

---

## 6. Student Progress & Recommendations

### GET /api/learner/recommendations/next
- **Purpose**: Get next recommendation with explanation
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, explanation, safety, warnings }`
- **Status**: Ready

### GET /api/learner/recommendations/:recommendationId/explanation
- **Purpose**: Get explanation for specific recommendation
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, explanation, warnings }`
- **Status**: Ready

### GET /api/learner/revision/:revisionItemId/why
- **Purpose**: Get revision explanation
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, explanation, warnings }`
- **Status**: Ready

### GET /api/learner/progress/narrative
- **Purpose**: Get progress narrative
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, narratives, warnings }`
- **Status**: Ready

### GET /api/learner/privacy/visibility
- **Purpose**: Get privacy visibility info
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, visibility }`
- **Status**: Ready

### POST /api/learner/recommendations/preference
- **Purpose**: Submit recommendation preference
- **Auth**: schoolAuthMiddleware
- **Request**: `{ optionId, feedback, recommendationId }`
- **Response**: `{ ok, warnings }`
- **Status**: Ready

---

## 7. Student Preferences

### POST /api/learner/recommendations/:recommendationId/feedback
- **Purpose**: Submit feedback on recommendation
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, feedbackAccepted, profileUpdated, ... }`
- **Status**: Ready

### POST /api/learner/recommendations/:recommendationId/interaction
- **Purpose**: Record interaction with recommendation
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, interaction }`
- **Status**: Ready

### GET /api/learner/recommendations/profile
- **Purpose**: Get adaptive profile
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, profile }`
- **Status**: Ready

### GET /api/learner/recommendations/tuning-context
- **Purpose**: Get tuning context
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, tuningContext, supportLevel, profile }`
- **Status**: Ready

### PATCH /api/learner/recommendations/preferences
- **Purpose**: Update preferences
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, updated, profile }`
- **Status**: Ready

---

## 8. Adaptive Challenges

### GET /api/learner/challenges/next
- **Purpose**: Get next challenge
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data: { challenge, remediationPath, decision, warnings } }`
- **Status**: Ready

### POST /api/learner/challenges
- **Purpose**: Request new challenge
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### GET /api/learner/challenges/:challengeId
- **Purpose**: Get challenge details
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### POST /api/learner/challenges/:challengeId/attempt
- **Purpose**: Submit challenge attempt
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### GET /api/learner/challenges/:challengeId/hint
- **Purpose**: Request hint for challenge
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### GET /api/learner/remediation/path
- **Purpose**: Get remediation path
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### POST /api/learner/remediation/:pathId/steps/:stepIndex/complete
- **Purpose**: Complete remediation step
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

### GET /api/learner/difficulty/calibration
- **Purpose**: Get difficulty calibration
- **Auth**: schoolAuthMiddleware
- **Response**: `{ ok, data }`
- **Status**: Ready

---

## 9. Teacher Dashboard

### GET /api/teacher/reports/students/:studentId/summary
- **Purpose**: Get safe student summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Student summary with privacy guards
- **Status**: Ready

### GET /api/teacher/reports/classes/:classId/summary
- **Purpose**: Get safe class summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Class summary with privacy guards
- **Status**: Ready

### GET /api/teacher/reports/students/:studentId/evidence
- **Purpose**: Get student evidence dashboard
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Evidence dashboard
- **Status**: Ready

### GET /api/teacher/reports/classes/:classId/revision-due
- **Purpose**: Get revision-due summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Revision due info
- **Status**: Ready

### GET /api/teacher/reports/classes/:classId/next-actions
- **Purpose**: Get class-level next actions
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Next action recommendations
- **Status**: Ready

### GET /api/teacher/reports/students/:studentId/next-actions
- **Purpose**: Get student-level next actions
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext
- **Response**: Next action recommendations
- **Status**: Ready

### GET /api/teacher/reports/audit
- **Purpose**: Get report audit trail (admin only)
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + admin role
- **Response**: Audit records
- **Status**: Ready

---

## 10. Teacher Interventions

### POST /api/teacher-interventions
- **Purpose**: Create intervention assignment
- **Auth**: schoolAuthMiddleware
- **Response**: Intervention record
- **Status**: Ready

### GET /api/teacher-interventions/:id
- **Purpose**: Get intervention detail
- **Auth**: schoolAuthMiddleware
- **Response**: Intervention detail
- **Status**: Ready

*(Additional CRUD endpoints in teacherInterventions.ts)*

---

## 11. Content Governance (Admin)

### GET /api/content-governance/curriculum/summary
- **Purpose**: Curriculum version summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Curriculum summary
- **Status**: Ready

### GET /api/content-governance/curriculum/active
- **Purpose**: Active curriculum versions
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Active versions
- **Status**: Ready

### POST /api/content-governance/curriculum/resolve
- **Purpose**: Resolve curriculum context
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Curriculum context with skills, objectives, gaps
- **Status**: Ready

### GET /api/content-governance/sources
- **Purpose**: List approved sources
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Source list
- **Status**: Ready

### POST /api/content-governance/sources/propose
- **Purpose**: Propose new source
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Proposal result
- **Status**: Ready

### POST /api/content-governance/sources/:sourceId/review
- **Purpose**: Review proposed source (admin)
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + admin
- **Response**: Review result
- **Status**: Ready

### POST /api/content-governance/grounding/check
- **Purpose**: Check content grounding
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Grounding decision
- **Status**: Ready

### GET /api/content-governance/gaps/summary
- **Purpose**: Get content gap summary
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + teacher/admin
- **Response**: Gap summary
- **Status**: Ready

### POST /api/content-governance/import/dry-run
- **Purpose**: Dry-run curriculum import
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + admin
- **Response**: Validation result
- **Status**: Ready

### POST /api/content-governance/deen/review-decision
- **Purpose**: Classify Deen content
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + deen_reviewer/admin
- **Response**: Classification and handling
- **Status**: Ready

### GET /api/content-governance/diagnostics
- **Purpose**: Content governance diagnostics (admin only)
- **Auth**: schoolAuthMiddleware + requireVerifiedSchoolContext + admin
- **Response**: Diagnostics
- **Status**: Ready

### GET /api/content-governance/learner/curriculum/context
- **Purpose**: Learner curriculum context (learner-facing)
- **Auth**: schoolAuthMiddleware
- **Response**: Curriculum context for learner
- **Status**: Ready

---

## 12. School Integration (Admin)

### GET /api/integrations/school/status
- **Purpose**: School integration status
- **Auth**: schoolAuthMiddleware
- **Response**: Status info
- **Status**: Ready

### POST /api/integrations/school/roster/sync
- **Purpose**: Trigger roster sync
- **Auth**: schoolAuthMiddleware
- **Response**: Sync result
- **Status**: Ready

*(Additional endpoints in schoolIntegration.ts)*

---

## 13. Health & Ops (Admin/Internal)

### GET /api/health/live
- **Purpose**: Liveness probe
- **Auth**: None
- **Response**: `{ status, timestamp, uptimeSec, env, version }`
- **Status**: Ready

### GET /api/health/ready
- **Purpose**: Readiness probe
- **Auth**: None
- **Response**: `{ ok, service, mode, checks, degraded, timestamp }`
- **Status**: Ready

### GET /api/health/dependencies
- **Purpose**: Dependency check
- **Auth**: None
- **Response**: `{ ok, checks, timestamp }`
- **Status**: Ready

### GET /api/health/routes
- **Purpose**: Route contract verification
- **Auth**: None
- **Response**: `{ ok, routeCount, failures, warnings, report }`
- **Status**: Ready

---

## Endpoint Status Summary

| Status | Count |
|--------|-------|
| **Ready** — fully built, registered, guarded, persistent | 200+ |
| **Internal only** — admin/ops routes | ~40 |
| **Integration-deferred** — require frontend wiring | Pipeline routes |
| **Not built** | 0 |
