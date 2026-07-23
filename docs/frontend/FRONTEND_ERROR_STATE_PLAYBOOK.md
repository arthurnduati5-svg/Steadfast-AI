# Frontend Error State Playbook

## Version: task-037-v1

Maps every documented error code to frontend behavior.

---

| Error Code | Safe User Message | Who Can See It | Frontend Action | Retry Allowed | Escalation Path | Privacy Notes |
|---|---|---|---|---|---|---|
| `UNAUTHENTICATED` | "Please sign in to continue." | All | Redirect to login page. Clear any cached protected state. | Yes, after sign-in | N/A | No protected data should be visible before auth |
| `FORBIDDEN` | "You do not have permission to access this resource." | All | Show permission-denied view. Log role mismatch for debugging. Hide the resource. | No | Contact teacher/admin if genuine access needed | Do not reveal what the resource contains |
| `MISSING_VERIFIED_SCHOOL_CONTEXT` | "We need your verified school session before opening the tutor." | Learner | Show school context missing view. Offer to re-authenticate. Do NOT load tutor, memory, evidence, or AI. | Yes, after context refresh | Contact school admin if school auth issue persists | No tutor context, memory, evidence, or AI call should be loaded |
| `INVALID_LEARNER_CONTEXT` | "Your learning session context is not valid. Please restart." | Learner | Show session expired/invalid view. Offer to start a new session. | Yes, after new session start | N/A | Previous session data is not recoverable from this error |
| `CONTENT_CONTEXT_REQUIRED` | "This action requires an approved curriculum or source context." | Learner/Teacher | Show content context required view. Provide link to curriculum overview. | Yes, after curriculum context established | Teacher can request new source approval | No unapproved content should be suggested |
| `CONTENT_GAP` | "This topic does not yet have an approved source. A scholar referral may be available." | Learner/Teacher | Show content gap notice. Offer alternative topics. If scholar referral exists, show referral info. | No, must await source approval | Teacher/admin can initiate source approval workflow | No fabricated answer or unapproved source should appear |
| `ANSWER_KEY_PROTECTED` | "Answer keys are not available to learners." | Learner | Block access. Show protected resource notice. Log access attempt. | No | Teacher/admin can audit access attempts | Never expose answer key data in error details |
| `TEACHER_ONLY_CONTENT_PROTECTED` | "This content is only available to teachers." | Learner | Block access. Show teacher-only notice. | No | N/A | Never expose teacher-only content |
| `DEEN_SOURCE_REQUIRED` | "This topic requires a verified Deen/Islamic source before answering." | Learner | Show Deen source required view. Offer to submit a scholar referral request. | No, must await source verification | Admin/deen_reviewer can process source | No unverified Deen content should appear |
| `SCHOLAR_REFERRAL_REQUIRED` | "A qualified scholar referral is required for this topic." | Learner | Show scholar-referral-required view with scholar info if available. | No | Referral is processed by admin | Scholar info is public-safe; no private details leaked |
| `SAFEGUARDING_ESCALATION_RESTRICTED` | "This action is restricted by safeguarding policy." | Teacher/Learner | Block action. Show safeguarding policy notice. | No | Safeguarding team escalation path | No raw safeguarding details should appear |
| `RATE_LIMITED` | "Too many requests. Please wait before trying again." | All | Show rate-limit notice with retry-after countdown. Disable submit buttons. Auto-retry after duration if safe. | Yes, after retry duration | Admin can adjust rate limits | No rate-limit internals or user identity leaks |
| `QUOTA_EXCEEDED` | "Your usage quota has been exceeded for this period." | Learner/Teacher | Show quota-exceeded notice with reset time. Disable quota-using features. Keep offline features functional. | Yes, after quota reset | Admin can adjust quota | No quota internals or billing details leaked |
| `VALIDATION_ERROR` | "The request data is not valid." | All | Show field-level validation errors. Let user correct input. | Yes, after correction | N/A | No sensitive data in validation details |
| `NOT_FOUND` | "The requested resource was not found." | All | Show 404-style notice. Offer to navigate to valid resource. | Yes, with valid resource ID | N/A | Do not reveal if resource ever existed |
| `CONFLICT` | "A conflict occurred. Please refresh and try again." | All | Show conflict notice. Offer to refresh data. | Yes, after refresh | N/A | No conflict internals leaked |
| `DEGRADED_MODE` | "Some features are temporarily limited. Core learning is still available." | All | Show degraded-mode banner. Disable AI chat, advanced features. Keep core practice/revision/progress. | Check periodically for restoration | Ops team monitoring | No infrastructure details |
| `INTERNAL_ERROR_SAFE` | "Something went wrong. Please try again or contact support." | All | Show generic error view. Log request ID for support. | Yes, with backoff | Support team with request ID | No internal error details, stack traces, or server info |
