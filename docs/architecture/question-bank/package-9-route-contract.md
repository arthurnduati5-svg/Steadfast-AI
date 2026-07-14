# Package 9 - Route Contract

## Mount Point

All routes are mounted at `/api/question-bank/result-governance` with `schoolAuthMiddleware` and `requireVerifiedSchoolContext`.

## Route Inventory

### Finalization Reviews

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /finalization-reviews | Create review | Yes | teacher/admin/system_job |
| GET | /finalization-reviews/:id | Get review | No | teacher/admin |
| GET | /finalization-reviews | List school reviews | No | teacher/admin |
| POST | /finalization-reviews/:id/run-checks | Run readiness checks | No | teacher/admin |
| POST | /finalization-reviews/:id/ready-for-decision | Mark ready | No | teacher/admin |
| POST | /finalization-reviews/:id/block | Block review | No | teacher/admin |
| POST | /finalization-reviews/:id/cancel | Cancel review | No | teacher/admin |
| POST | /finalization-reviews/:id/complete | Complete review | No | teacher/admin |

### Finalization Decisions

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /finalization-reviews/:id/decisions | Create decision | Yes | teacher/admin/system_job |
| GET | /finalization-reviews/:id/decisions | List for review | No | teacher/admin |
| GET | /decisions/:id | Get decision | No | teacher/admin |
| POST | /decisions/:id/approve | Approve | No | teacher/admin |
| POST | /decisions/:id/return-for-review | Return | No | teacher/admin |
| POST | /decisions/:id/block | Block | No | teacher/admin |
| POST | /decisions/:id/void | Void | No | teacher/admin |

### Release Readiness

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /decisions/:id/release-readiness | Create readiness | Yes | teacher/admin/system_job |
| GET | /release-readiness/:id | Get readiness | No | teacher/admin |
| GET | /decisions/:id/release-readiness | List for decision | No | teacher/admin |
| POST | /release-readiness/:id/evaluate-internal | Evaluate internal | No | teacher/admin |
| POST | /release-readiness/:id/evaluate-student | Evaluate student | No | teacher/admin |
| POST | /release-readiness/:id/evaluate-parent-boundary | Evaluate parent | No | teacher/admin |
| POST | /release-readiness/:id/block | Block | No | teacher/admin |
| POST | /release-readiness/:id/expire | Expire | No | teacher/admin |

### Release Boundaries

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /release-readiness/:id/boundaries | Create boundary | Yes | teacher/admin/system_job |
| GET | /boundaries/:id | Get boundary | No | teacher/admin |
| GET | /release-readiness/:id/boundaries | List for readiness | No | teacher/admin |
| POST | /boundaries/:id/activate | Activate | No | teacher/admin |
| POST | /boundaries/:id/block | Block | No | teacher/admin |
| POST | /boundaries/:id/void | Void | No | teacher/admin |

### Regrade Requests

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /regrade-requests | Create request | Yes | student/teacher/admin |
| GET | /regrade-requests/:id | Get request | No | teacher/admin |
| GET | /regrade-requests | List (school/student/version) | No | teacher/admin |
| POST | /regrade-requests/:id/cancel | Cancel | No | teacher/admin |
| POST | /regrade-requests/:id/reject | Reject | No | teacher/admin |
| POST | /regrade-requests/:id/accept-for-review | Accept | No | teacher/admin |
| POST | /regrade-requests/:id/resolve-without-change | Resolve | No | teacher/admin |
| POST | /regrade-requests/:id/defer | Defer | No | teacher/admin |

### Regrade Intakes

| Method | Path | Purpose | Idempotent | Role Requirement |
|--------|------|---------|------------|-----------------|
| POST | /regrade-requests/:id/intakes | Create intake | Yes | admin/system_job |
| GET | /regrade-requests/:id/intakes | List intakes | No | teacher/admin |
| POST | /regrade-intakes/:id/assign | Assign reviewer | No | admin |
| POST | /regrade-intakes/:id/accept | Accept | No | admin |
| POST | /regrade-intakes/:id/reject | Reject | No | admin |
| POST | /regrade-intakes/:id/block | Block | No | admin |
| POST | /regrade-intakes/:id/complete | Complete | No | admin |

### Projections

| Method | Path | Purpose | Leakage Protection |
|--------|------|---------|-------------------|
| GET | /finalization-reviews/:id/projection/teacher | Teacher view | Governance status only |
| GET | /finalization-reviews/:id/projection/admin | Admin view | Counts + status |
| GET | /finalization-reviews/:id/projection/student-safe | Student view | No answer keys, rubrics, hidden reasoning, unreleased scores, mastery |
| GET | /release-readiness/:id/projection/parent-boundary | Parent boundary | Boundary-only, no scores/keys |

## Safe Error Codes

AUTH_REQUIRED, SCHOOL_CONTEXT_REQUIRED, VALIDATION_FAILED, POLICY_BLOCKED, IDEMPOTENCY_CONFLICT, NOT_FOUND, FORBIDDEN_FIELD, PACKAGE_5_RESULT_NOT_FOUND, PACKAGE_8_INVOCATION_NOT_FOUND, RESULT_VERSION_NOT_READY, TEACHER_REVIEW_UNRESOLVED, MODERATION_UNRESOLVED, FINALIZATION_BLOCKED, RELEASE_READINESS_BLOCKED, PARENT_RELEASE_DEFERRED, PARENT_NOTIFICATION_DEFERRED, REGRADE_EXECUTION_DEFERRED, AI_MARKING_DEFERRED, OCR_DEFERRED, MASTERY_MUTATION_DEFERRED, UNKNOWN_SAFE_ERROR

## Forbidden Leakage Rules

- Student/parent projections must block: answerKeySafeRef, answerKeyText, correctAnswerSummary, rubricInternal, rubricText, markingNotesTeacherOnly, teacherOnlyNotes, hiddenReasoning, chainOfThought, rawQuestionMetadata, selectionReasonInternal, markingAlgorithmInternals, moderationDecisionInternal, teacherOverrideInternal, auditInternals, rawStudentAnswer, scoreBeforeFinalization, unreleasedScore, finalGradeBeforeRelease, parentDeliveryPayload, masteryMutation.
- No route sends parent notifications.
- No route performs regrade execution.
- No route mutates mastery.
