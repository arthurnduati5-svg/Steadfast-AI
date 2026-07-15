# Package 16: Result Follow-Up Intelligence

## 1. Package 16 Scope

Package 16 builds the backend-only result follow-up intelligence layer. After report cards have been assembled (Package 13), exported (Package 14), and prepared for controlled access (Package 15), Package 16 enables teachers and staff to create follow-up cases, attach signals, build action plans, queue teacher review items, draft parent guidance, draft student reflection tasks, schedule review windows, create escalation plans, and summarize follow-up activity — all as safe metadata records without sending live notifications, creating live tasks, mutating scores, generating AI narratives, performing OCR, generating PDFs, syncing externally, or leaking private data.

## 2. Package 15 Dependency Proof (d61b768)

Package 16 depends on Package 15, committed at `d61b768`. Follow-up cases reference:
- `resultReportCardAccessGrantId` — the Package 15 access grant
- `resultReportCardAccessSummaryId` — the Package 15 access summary

No follow-up record may exist without at least one upstream reference from Package 9 through Package 15.

## 3. Package 15 Access Readiness Reuse Proof

Package 16's `ResultFollowUpCaseRecord` references `resultReportCardAccessGrantId` and `resultReportCardAccessSummaryId` — the Package 15 access grant and access summary. These are never duplicated, only referenced by ID.

## 4. Package 14 Export Readiness Reuse Proof

Package 16's `ResultFollowUpCaseRecord` references Package 14 indirectly through Package 15's export chain. No direct export reference is stored in Package 16 records — the export chain is accessed through the access grant or assembly reference.

## 5. Package 13 Report Card Reuse Proof

Package 16's `ResultFollowUpCaseRecord` references `resultReportCardAssemblyId` and `resultReportCardAudienceProjectionId` — the Package 13 report card assembly and audience projection. These are never duplicated, only referenced by ID.

## 6. Package 12 Delivery Receipt Reuse Proof

Package 16 reuses the delivery receipt and envelope patterns established in Package 12. No delivery receipt or envelope data is duplicated in follow-up records. Access to delivery context is through upstream references.

## 7. Package 11 Release Packet Reuse Proof

Package 16's `ResultFollowUpCaseRecord` references `resultReleasePacketId` — the Package 11 release packet. The packet is never duplicated, only referenced by ID.

## 8. Package 10 Learning Evidence Reuse Proof

Package 16 references Package 10 learning evidence through the release packet and assembly chain. No learning evidence records are duplicated in follow-up records.

## 9. Package 9 Finalization/Release Readiness Reuse Proof

Package 16's `ResultFollowUpCaseRecord` references `resultFinalizationDecisionId` and `resultReleaseReadinessId` — the Package 9 finalization decision and release readiness. These are never duplicated, only referenced by ID.

## 10. Package 16 No-Duplication Scan Summary

All 11 follow-up intelligence terms were NOT FOUND in the existing schema before Package 16. No forbidden models (live task, live notification, calendar event, external sync, AI narrative, OCR, regrade execution, score mutation, result overwrite) are created. Existing Package 9–15 records are reused by reference only. See `package-16-no-duplication-scan.md` for full details.

## 11. Prisma Models Added (11)

1. `ResultFollowUpCaseRecord`
2. `ResultFollowUpSignalRecord`
3. `ResultFollowUpActionPlanRecord`
4. `TeacherFollowUpQueueItemRecord`
5. `ParentGuidanceDraftRecord`
6. `StudentReflectionTaskDraftRecord`
7. `FollowUpReviewWindowRecord`
8. `FollowUpEscalationPlanRecord`
9. `FollowUpSummaryRecord`
10. `FollowUpAuditRecord`
11. `FollowUpIdempotencyRecord`

## 12. Existing Systems Reused

### Models Reused (by reference only)

- `ResultFollowUpCaseRecord` references: `resultFinalizationDecisionId` (Pkg 9), `resultReleaseReadinessId` (Pkg 9), `resultReleasePacketId` (Pkg 11), `resultReportCardAssemblyId` (Pkg 13), `resultReportCardAudienceProjectionId` (Pkg 13), `resultReportCardAccessGrantId` (Pkg 15), `resultReportCardAccessSummaryId` (Pkg 15)
- Policy enforcer `ResultFollowUpPolicyEnforcer` reuses role constants (`ALLOWED_FOLLOW_UP_CREATION_ROLES`, `BLOCKED_FOLLOW_UP_CREATION_ROLES`)
- `FORBIDDEN_FOLLOW_UP_FIELDS` reuses the same leak-prevention contracts from Packages 9–15
- Audit bridge reuses the same `FollowUpAuditRecord` pattern from Package 15 audit model
- Idempotency reuses the same `FollowUpIdempotencyRecord` pattern from Package 15 idempotency

## 13. Follow-Up Case Lifecycle

```
draft → opened → triaged → planned → under_review → closed
draft → opened → triaged → planned → under_review → blocked
draft → blocked
any → void
```

Case types: `academic_support`, `attendance_related`, `parent_follow_up`, `teacher_review`, `student_reflection`, `safeguarding_review_referral`, `general_growth_support`.

Case priorities: `low`, `medium`, `high`, `urgent_review_required`.

Case modes: `mock_action_only`, `future_action_only`, `teacher_review_only`, `metadata_only`.

## 14. Follow-Up Signal Lifecycle

```
active → suppressed
active → void
```

Signal types: `weak_objective_pattern`, `missed_practice_pattern`, `result_drop_pattern`, `low_confidence_pattern`, `teacher_review_requested`, `parent_guidance_needed`, `student_reflection_needed`, `access_not_acknowledged`, `report_card_review_follow_up`, `manual_teacher_flag`.

Signal severities: `low`, `medium`, `high`, `critical`.

## 15. Action Plan Lifecycle

```
draft → teacher_review_ready → approved_for_future_use
draft → teacher_review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Plan mode: defaults to `mock_plan_only`.

## 16. Teacher Queue Lifecycle

```
draft → queued_for_review → acknowledged_mock → completed_mock
draft → queued_for_review → acknowledged_mock → suppressed
draft → blocked
any → void
```

Queue modes: defaults to `mock_review`. Queue priorities: `low`, `medium`, `high`, `urgent`.

## 17. Parent Guidance Draft Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Draft mode: defaults to `mock_draft_only`. Audience type: defaults to `parent`.

## 18. Student Reflection Draft Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Draft mode: defaults to `mock_only`.

## 19. Review Window Lifecycle

```
draft → scheduled_mock → completed_mock
draft → scheduled_mock → cancelled
draft → cancelled
any → void
```

Window mode: defaults to `mock_only`.

## 20. Escalation Plan Lifecycle

```
draft → review_ready → approved_for_future_use
draft → review_ready → suppressed
draft → suppressed
draft → blocked
any → void
```

Escalation levels: `low`, `medium`, `high`, `critical`. Escalation mode: defaults to `metadata_only`.

Creation restricted to `lead_teacher`, `department_head`, `admin`, `system_job` — teachers cannot create escalation plans.

## 21. Summary Read Model Lifecycle

```
active → stale
active → blocked
any → void
```

Scopes: `school`, `student`, `teacher`, `case_type`, `priority`.

## 22. No-Live-Notification Policy

Package 16 has a dedicated `RESULT_FOLLOW_UP_NO_LIVE_NOTIFICATION` policy family that blocks all live notification behavior. Every service and route enforces this policy. Acknowledgements are mock-only metadata records.

## 23. No-Live-Task Policy

Package 16 has a dedicated `RESULT_FOLLOW_UP_NO_LIVE_TASK` policy family that blocks all live task creation. Teacher queue items, parent guidance drafts, and student reflection drafts are metadata-only records.

## 24. No-Score-Mutation Policy

Package 16 has a dedicated `RESULT_FOLLOW_UP_NO_SCORE_MUTATION` policy family that blocks all score mutation. Scores, grades, and result versions are never modified by follow-up operations.

## 25. No-AI/OCR/PDF/External-Sync Deferral Explanation

All real execution of AI narrative generation, OCR processing, PDF generation, HTML export, external school system sync, notification sending, live task creation, and real calendar event creation is intentionally deferred to future packages. Package 16 creates only safe follow-up intelligence metadata.

Dedicated policy families:
- `RESULT_FOLLOW_UP_NO_AI_NARRATIVE` — blocks AI narrative generation
- `RESULT_FOLLOW_UP_NO_OCR` — blocks OCR processing

No PDF, HTML export, or external sync policy is needed because no code path touches those domains.

## 26. Forbidden Scope Not Touched

- No frontend files modified
- No AI provider imports
- No OCR imports
- No notification sending
- No PDF generation
- No HTML export file creation
- No external sync
- No score changes
- No result version overwrites
- No regrade execution
- No live task creation
- No calendar event creation

## 27. Tests Summary

Package 16 currently has no dedicated test files. The following test coverage is needed:

- Unit tests for all 11 repository implementations (create, read, list, update, status transitions)
- Unit tests for all 12 service classes (case, signal, action plan, teacher queue, parent guidance, student reflection, review window, escalation plan, summary, safety, idempotency, audit bridge)
- Policy enforcer unit tests for all 12 policy families including role-blocked and fail-closed behavior
- Route contract tests (once routes are implemented)
- Integration tests for unsafe field filtering (FORBIDDEN_FOLLOW_UP_FIELDS)
- Status transition validation tests for all lifecycle states
- Cross-package reference validation tests

Tests must prove: all CRUD operations work, status transitions are valid, forbidden fields are blocked, role policies are enforced, no live operations leak through, all upstream references are valid.

## 28. Known Deferred Items

- Real parent notification via email/SMS/push/WhatsApp (future package)
- Real student notification via email/SMS/push (future package)
- Real teacher notification via dashboard/email (future package)
- Live teacher task creation and assignment (future package)
- Live parent guidance delivery (future package)
- Live student reflection submission portal (future package)
- Real review window scheduling with calendar integration (future package)
- Real escalation execution with department head notification (future package)
- AI narrative generation for follow-up recommendations (future package)
- OCR processing for paper-based reflection submission (future package)
- External school system sync for follow-up records (future package)
- Frontend UI for follow-up case management (future package)
- Frontend UI for teacher queue dashboard (future package)
- Frontend UI for parent guidance review (future package)
- Frontend UI for student reflection prompts (future package)

## 29. Package 17 Readiness

Yes — Package 17 is ready to prompt after Package 16 passes verification and is accepted. Package 17 would logically follow the question bank roadmap pattern established by Packages 0–16.
