# Backend Integration Handoff (V1)

## 1. Purpose and accepted baseline

This is the backend-owned integration handoff for the current build cycle. It
packages the accepted backend's external contracts so frontend, AI-provider,
school-system, and deployment lanes can integrate without guessing. It changes
no product behavior and reopens no closed correctness work (R8-G, R8-H).

- Integration contract baseline SHA: `b9ed75960f33fd99af39687e4183818ca5c509a9`
  (`fix(r8-h): preserve rate-limit semantics under clock rollback`).
- Handoff contract version: `1`.
- Remaining backend correctness gaps: NONE (per
  `13_BACKEND_ENGINEERING_ACCEPTANCE_REPORT.md`, frozen; this task adds
  packaging only).
- Supporting canonical evidence (referenced, not duplicated):
  `01_BACKEND_SYSTEM_INVENTORY.json`, `02_BACKEND_DEPENDENCY_GRAPH.json`,
  `03_BACKEND_RUNTIME_ROUTE_MAP.md` (refreshed in this task to the baseline
  above), `04_BACKEND_DATA_OWNERSHIP_MATRIX.md`,
  `05_BACKEND_LOGIC_REGISTER.md`, `06_BACKEND_ALGORITHM_REGISTER.md`,
  `07_BACKEND_COMPLETENESS_MATRIX.md`, `08_BACKEND_GAP_REGISTER.md`,
  `09_BACKEND_PERFORMANCE_REPORT.md`, `10_BACKEND_RELIABILITY_REPORT.md`,
  `13_BACKEND_ENGINEERING_ACCEPTANCE_REPORT.md`.

## 2. Integration scope boundary

Backend-owned in this handoff: route truth, auth/authz provenance, request /
response / validation / error contracts, state / idempotency / pagination /
timeout / retry / rate-limit semantics, external-port manifest with activation
truth, read-only consumer maps, deterministic contract proof, this document.

Explicitly NOT in this handoff: frontend wiring, AI orchestration / prompts /
model selection, live provider activation, live SSO, SIS/LMS connections,
live email/SMS/push, deployment, infrastructure, schema/migration changes,
product-behavior redesign, route renaming. Cross-lane code was inspected
read-only to identify consumers; inspection authorized no modification and
none was made.

## 3. Runtime entrypoint

- Entrypoint: `backend/src/index.ts` (Express; `app.listen(PORT, HOST)`).
- `backend/tsconfig.json` retains `rootDir: ".."` with `files:
  ["src/index.ts"]`; the compiled graph is the transitive closure from the
  entrypoint. Build emits `backend/dist/backend/src/index.js`.
- Global middleware order: `helmet` -> `cors` -> global rate limiter (10,000
  req / 15 min, NAT-aware) -> `express.json` (limit `JSON_LIMIT`, default
  `10mb`) -> `requestId` -> `requestCorrelation` -> `requestTelemetry` ->
  `httpLogger` -> route mounts -> `errorTelemetryMiddleware` -> global error
  handler (`{ message }` only; 413 payload-too-large mapped explicitly).
- CORS: `ALLOWED_ORIGINS` allowlist; open origin only when non-production and
  unconfigured. Allowed headers: `Content-Type`, `Authorization`. Methods:
  `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Server timeouts: `REQUEST_TIMEOUT_MS` default `120000` (also `server.timeout`
  and `server.requestTimeout`), `KEEP_ALIVE_TIMEOUT_MS` default `65000`,
  `HEADERS_TIMEOUT_MS` default `66000`. Graceful shutdown on SIGTERM/SIGINT
  with 10 s forced-close backstop.

## 4. Global HTTP/auth conventions

- Identity transport: `Authorization: Bearer <JWT>` only. There is NO header
  passthrough for school identity; body/query/path `schoolId` values are
  never authoritative identity (see section 6).
- JWT verification order: `JWT_SECRET` (HS) -> `COPILOT_JWT_SECRET` (HS, if
  distinct) -> `COPILOT_PUBLIC_KEY` (RS256). Startup is fatal when none is
  configured. No token / malformed / unverifiable token -> `401 { success:
  false, message }`. No cookies, no API-key scheme on integration routes.
- Claim names (all trimmed): user from `userId | studentId | id | sub`;
  school from `schoolId | school_id | orgId | organizationId`; role from
  `role | userRole | accountRole | accountType` (plus `roles[]`), normalized
  to `admin | counselor | student | teacher | school_admin` (else raw
  lowercase). `teacher` is preserved by auth extraction but collapses to
  `student` inside `src/lib/rbac.ts` (`resolveRequestRole` default is
  `student`); the school-context layer keeps `teacher` distinct.
- Verified context (`requireVerifiedSchoolContext`): derives context from
  `req.schoolId | req.user.schoolId` + `req.user.id` (+ optional
  `studentId` param, `classId`/`subjectId` query). Missing school/user ->
  `401 { error, code: SCHOOL_CONTEXT_REQUIRED }`. Failing pure validation
  (unknown role, expired context, mismatched issuer/audience when
  configured, student without external student id) -> `403 { error, code:
  SCHOOL_CONTEXT_INVALID }`. Success stamps `req.verifiedSchoolIdentity`
  and overwrites `req.schoolId` with the verified value.
- Correlation: `x-request-id` / `x-correlation-id` are tracing metadata only,
  never identity. `requestId` is middleware-stamped and echoed by safe
  envelopes.
- Fail-closed invariant: unverified caller-supplied `schoolId` NEVER equals
  authorized school identity. Proven by
  `src/tests/integration-readiness-handoff.contract.test.ts` (spoofed
  `x-school-id` header + body `schoolId` ignored; rows stay in the verified
  school scope) and the reused R8-G integrity suite.

## 5. Route-family integration map

113 production mounts in `src/index.ts` (refreshed route map at this
baseline): 76 `schoolAuthMiddleware` + `requireVerifiedSchoolContext`, 32
`schoolAuthMiddleware`-only, 5 public. Explicit `rateLimitMiddleware` on the
AI and voice mounts; global limiter everywhere; health/ops/ready exempt.
Exhaustive endpoint detail lives in `03_BACKEND_RUNTIME_ROUTE_MAP.md`; the
table below groups stable capability families.

| CAPABILITY | BASE PATH | CONSUMER | AUTH | VERIFIED SCHOOL | ROLE / RELATIONSHIP | REQUEST OWNER | RESPONSE OWNER | ERROR FAMILY | IDEMPOTENCY | PAGINATION | PERSISTENCE EFFECT | EXTERNAL DEPENDENCY | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Health / bootstrap | `/api/health`, `GET /api/health`, `/api` (`readiness`) | ops, frontend boot | PUBLIC | no | none | none (no body) | `backendHealthService` (`{ok,status,service,timestamp,uptimeSeconds,version}`) | 200 / 503 (`/ready`, `/dependencies`, `/routes`) | NOT_APPLICABLE | none | none | none | PRIMARY_PRODUCT_SURFACE |
| Ops public summary | `/api/ops` | ops | PUBLIC | no | none | route-level | safe envelope | 200 | NOT_APPLICABLE | none | none | none | OPERATIONS_OR_GOVERNANCE_SURFACE |
| Deployment / task024 summaries | `/api` (`deploymentReadiness`, `task024Operations`) | ops | PUBLIC | no | none | route-level | readiness/ops services | 200 | NOT_APPLICABLE | none | none | none | OPERATIONS_OR_GOVERNANCE_SURFACE |
| Study chat / copilot core | `/api/copilot` (`aiRoutes`: chat, study, assessment, media, revision, growth, safety, research) | Study Chat, Revision, Practice, Growth, Media, Profile | auth + rate-limit | mixed (chat core auth-only; evidence/memory verified) | student self; teacher/admin per sub-route; `requireRole`/service gates | manual (service-owned); per-file `aiLimiter`/`sttLimiter`/`ttsLimiter` on hot paths | 200 direct service objects; 404/500 branches | VALIDATION(400) AUTHN(401) AUTHZ(403) NOT_FOUND(404) RATE_LIMIT(429) INTERNAL(500) | SUPPORTED_OPTIONAL (family-specific) | none (bounded payloads) | session/message/artifact stores | governed mock gateway (default) + legacy direct OpenAI path (live where configured) | PRIMARY_PRODUCT_SURFACE |
| Tutor turn / policy / safe chat | `/api/copilot/tutor-turn`, `/tutor-actions`, `/tutor-state`, `/no-ai-bypass` | Study Chat | auth + verified | yes | student/teacher/admin per policy packet | route + `tutorTurnPolicy` contracts | 200 policy/turn objects | AUTHZ(403) VALIDATION(400) | SUPPORTED_OPTIONAL | none | turn/session stores | mock gateway default | PRIMARY_PRODUCT_SURFACE |
| Learning modes (focus/exam/quiz/teach-back/revision/growth-action) | `/api/copilot/*-mode`, `/api/copilot/growth` | Practice, Revision, Growth | auth + verified | yes | student self | route-level | 200 mode objects | AUTHN/Z, VALIDATION, INTERNAL | SUPPORTED_OPTIONAL | none | mode session stores | none | PRIMARY_PRODUCT_SURFACE |
| Learner memory | `/api/copilot/learner-memory` | Profile/Preferences | auth + verified | yes | self (`resolveIdentity` from `req.schoolId`/`req.user.id` only) | zod (`learnerMemoryValidation`) | 201 create / 200 reads | VALIDATION(400) AUTHN(401) NOT_FOUND(404) INTERNAL(500) | SUPPORTED_OPTIONAL | none | memory/event stores | none | PRIMARY_PRODUCT_SURFACE |
| Learning evidence ledger | `/api/copilot/evidence` | Learning Sessions (backend-internal today) | auth + verified | yes | student/teacher/`school_admin`/`internal_operator`; students body-echo own learnerId (see 7/23); internal ops privileged-only | route guards + `LearningEvidenceCommandService` | 201 create / 200 transitions+reads; `{ok,data}` / `{ok:false,error:{code,message,requestId,correlationId}}` | VALIDATION(400) AUTHN(401) AUTHZ(403) NOT_FOUND(404) IDEMPOTENCY_CONFLICT(400+code) INTERNAL(500) | REQUIRED (key + sha256 request hash; same-key/same-hash replays, same-key/changed-hash conflicts non-retryable) | none (stream reads bounded) | event-sourced evidence store, atomic append | none | PRIMARY_PRODUCT_SURFACE |
| Learning sessions (durable) | `/api/copilot/learning-sessions`, `/api/learner` (`learnerSessionRoutes`), `/api/tutor` | Learning Sessions | auth + verified | yes | student self; teacher/admin per scope | route guards + transition service | 200/201 `{ok,session,decision}` | VALIDATION(400) AUTHN(401) AUTHZ(403) NOT_FOUND(404) INVALID_TRANSITION(422) IDEMPOTENCY_CONFLICT(409) | REQUIRED (header key + fingerprint; replay vs conflict) | `limit`-only on session events (default 50, no max cap) | transactional session state + event store | none | PRIMARY_PRODUCT_SURFACE |
| Teacher insights / reports / interventions | `/api` (`teacherInterventionRoutes`, `teacherReportRoutes`), `/api/copilot/teacher-insights` | Teacher/Admin (no live UI consumer yet) | auth (+verified on reports) | reports yes | service scope policy (`validateTeacher*Scope`); audit trail admin-only | service policy (manual) | 200 report JSON | AUTHZ(403) INTERNAL(500) | NOT_APPLICABLE (reads) | query filters (`classId,subject,window`); no cursor | none (reads) + audit writes | safety webhook (gated) | PRIMARY_PRODUCT_SURFACE |
| Question bank + assessment packages 4-26 | `/api/question-bank` (+ `/marking`, `/exam-papers`, `/exam-delivery`, `/result-*`, `/recovery-*`) | Assessment (via `/api/copilot/assessment/*`); direct `/api/question-bank` has no UI caller yet | auth (JWT) BUT actor context via MOCK/DEV-ONLY extractor (`x-school-id` header/body) — see 7/23 | mount-level NO (replacement deferred) | `extractMockAssessmentActorContext` role allow-list (`student..support_owner`); per-package policy | route + `*CommandService` + policy registry | 201 writes / 200 reads; `createSafeResponseEnvelope` (`ok,requestId,correlationId,resourceId,status,safeMessage,reasonCode,errorCode,data`) | VALIDATION(400 inc. `IDEMPOTENCY_REQUIRED`) AUTHN(401) AUTHZ(403) NOT_FOUND(404) STATE/IDEMPOTENCY/VERSION conflict(409) DEPENDENCY(503) | REQUIRED on writes (`x-idempotency-key` or body key; missing -> 400) | none (bounded lists; no cursor/offset) | package repositories (in-memory dev / prisma-gated prod) + audit writer | none | PRIMARY_PRODUCT_SURFACE with MOCK actor-context constraint |
| Voice / quotas / ledger | `/api/voice`, `/api/copilot/voice/*` (extracted quota domain, same pattern) | Voice (partial: proxy+client+AI hook exist; no prod UI caller) | auth + rate-limit | no (auth-only mount) | `requireRole(admin)` on grants; quota ledger per student/day | manual (`parsePositiveInt`; 400s) | 200 balance/session; 402 `time_exhausted`; 404/409/429 branches | VALIDATION(400) AUTHN(401) QUOTA(402/429) NOT_FOUND(404) CONFLICT(409) | NOT_APPLICABLE (ledger is transactional, row-locked) | none | voice ledger (transactional settlement) | OpenAI STT/TTS (live where configured); TTS model via `OPENAI_TTS_MODEL` | PRIMARY_PRODUCT_SURFACE |
| Learner prefs / recommendations / adaptive | `/api/learner` (preferences, recommendations, adaptive-challenges), `/api/copilot` (learning-profile, adaptive-*, remediation) | Profile, Growth, Practice | auth (+verified on sessions/challenges paths) | family-specific | student self | route/service-level | 200 preference/recommendation objects | AUTHN/Z, VALIDATION, INTERNAL | SUPPORTED_OPTIONAL | none | preference/profile stores | none | PRIMARY_PRODUCT_SURFACE |
| Video learning + analytics | `/api/copilot` (recommendations, sessions, aware-practice), `/api/video-learning-analytics` | Media | auth (+verified on sessions) | family-specific | student self; recommendations fail closed on empty identity | service-level | 200 school-scoped recommendations (`recommendationId` school-prefixed, `safety.status=needs_review`, `cacheAllowed=false`) | VALIDATION, AUTHZ, INTERNAL | SUPPORTED_OPTIONAL | none | session/analytics stores | YouTube/Vimeo candidate adapters (gated-off without key); Genkit transcript flow (in-process) | PRIMARY_PRODUCT_SURFACE |
| Phase3 growth/study/family surfaces | `/api/phase3/*` (objectives, daily checks, daily feed, study plans, growth page, living revision, confidence recovery, parent support, peer learning) | Growth (partial; `/api/phase3` has no UI caller — UI uses `/api/copilot/growth/*`) | auth + verified | yes | student self; parent-safe projections | route/service-level | 200 page/feed objects | AUTHN/Z, VALIDATION, INTERNAL | SUPPORTED_OPTIONAL | bounded feeds (rank-dedupe optimized, R8-H) | objective/check/plan stores | none | PRIMARY_PRODUCT_SURFACE |
| Governance (privacy, content, curriculum, security task020) | `/api/governance`, `/api/learner` (privacy), `/api/content-governance`, `/api/task022/*`, `/api/task020/*` | Admin/operations | auth + verified | yes | local `requireRole`-style boolean gates (`school_admin/system_admin/internal_operator`, teacher sets) — NOT `lib/rbac` | route/service policy | 200 governance objects; 403 `Forbidden. Insufficient role.` | AUTHZ(403) VALIDATION(400) | SUPPORTED_OPTIONAL | none | governance/audit stores | none | OPERATIONS_OR_GOVERNANCE_SURFACE |
| School integration (mock) + task021 | `/api` (`schoolIntegrationRoutes`), `/api/task021/school-integration` | Admin/operations (future SSO/SIS lane) | auth (+verified on task021) | task021 yes | verified identity; roster diff pure/local | local runtime (in-memory job `Map`, pure diff) | 200 sync/dry-run/diagnostics envelopes with reason codes | VALIDATION, AUTHZ, CONFLICT (reason-coded) | REQUIRED (idempotency locks on sync) | none | durable bridge + audit | mock/disabled-live only (see 16) | OPERATIONS_OR_GOVERNANCE_SURFACE |
| Rate-limit admin | `/api/admin/rate-limits` | Admin/operations | auth (light rate config) | no | admin/internal | route-level | 200 config objects | AUTHZ(403) | NOT_APPLICABLE | none | config store | none | OPERATIONS_OR_GOVERNANCE_SURFACE |
| Pilot / staging / canary / rollout governance (task023-040) | `/api/task023/*` … `/api/task040/*` plus `/api`-mounted ops summaries | Admin/operations | auth + verified (governance mounts); school-auth + `requireRole('admin'[, 'counselor'])` per-route (`adminGuard`/`internalGuard` local consts) | governance yes | admin (control) / admin+counselor (internal) / student-denied (teachers resolve to `student` in `lib/rbac`) | route/service-level | 200 governance envelopes | AUTHZ(403) VALIDATION(400) | family-specific (locks where control ops) | none | rollout/launch state stores | notification-guard tests (no live send) | OPERATIONS_OR_GOVERNANCE_SURFACE |
| AI runtime internal (latency, anomalies, intent, pipelines, handoff, policy-eval) | `/api/copilot/*` | backend-internal / diagnostics | auth (+verified on memory/handoff paths) | family-specific | role per route (`anomalies`/`latency` use `requireRole`) | route/service-level | 200 diagnostics objects | AUTHZ(403) INTERNAL(500) | NOT_APPLICABLE | none | telemetry stores | mock gateway default | INTERNAL_BACKEND |
| Legacy / compatibility | `/task020`, `/task021`, `/task024`… and `/api/task-032`, `/api/task-032`-style test-only mounts | none (test-only mounts exist only under test processes) | n/a (tests) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | LEGACY_OR_COMPATIBILITY_SURFACE — documented, NOT removed, NOT renamed in this task |

## 6. Authentication provenance

Per protected family (verified in source, proven in contract tests):

- Middleware: `src/middleware/schoolAuthMiddleware.ts` (Bearer JWT,
  multi-secret) then, on 76 mounts, `src/middleware/
  schoolContextGuardMiddleware.ts` (`requireVerifiedSchoolContext`; student
  variant `requireVerifiedStudentContext` adds role/student-id/scope checks).
- Identity source: JWT claims only. `schoolId` provenance: claim
  (`schoolId|school_id|orgId|organizationId`) -> `req.schoolId` ->
  overwritten by `verification.identity.schoolId`. Actor/userId provenance:
  claim (`userId|studentId|id|sub`) -> `req.user.id`. Role provenance: claim
  -> `req.user.role` (auth normalization) -> `verification.identity.role`
  (context normalization).
- Body/query/path IDs that are NOT authoritative: any body `schoolId`,
  `x-school-id` / `x-actor-id` / `x-actor-role` headers (ignored by
  verified-context families; proven ignored by the evidence contract test),
  `x-request-id` / `x-correlation-id` (tracing only).
- Ownership checks: evidence internal ops (privileged roles), teacher report
  scope validators, learner-session transition guards,
  question-bank/enforcement policies, voice quota ledger identity.
- Known constraint (documented, not changed): the question-bank family mounts
  `schoolAuthMiddleware` WITHOUT `requireVerifiedSchoolContext` and derives
  actor context from the explicitly MOCK/DEV-ONLY
  `extractMockAssessmentActorContext` (`x-school-id` header/body). Production
  school integration MUST replace this extractor with verified-context
  middleware before any live-school use (deferred item D2).

## 7. Authorization/relationship model

There is no single universal role table; authorization is route-family
specific and fail-closed:

- `src/lib/rbac.ts` (`admin | counselor | student`; `teacher` and unknown ->
  `student`; default `student`): used by pilot/expansion governance
  (`adminGuard`/`internalGuard` local consts), `anomalies`, `latency`, parts
  of AI routes. Deny: `403 { message: 'Forbidden' }`.
- Local boolean `requireRole(req,res,allowed[])` with own role sets in
  `contentGovernance.ts` (`school_admin/system_admin/internal_operator`,
  teacher sets) and `task022…` routes. Deny: `403 { success: false, message:
  'Forbidden. Insufficient role.', role }`.
- Service-policy gates: teacher reports (`validateTeacher*Scope`, admin-only
  audit trail), evidence commands (role allow-lists per transition; students
  body-echo own learnerId on candidate create — frontend MUST send the
  caller's own learnerId; the backend does not cross-compare it against the
  JWT on that endpoint), learner-session transitions, question-bank policy
  registry, voice admin grants (`requireRole admin`).
- Student/self: learner memory (`resolveIdentity` server-side only), durable
  sessions (school+learner scoping), evidence reads (school-scoped; cross-
  school reads return empty, never foreign rows — proven).
- Teacher/class: teacher report scope validators (class/subject/window from
  query, never from unauthenticated body).
- Admin scope: governance + rollout control planes; counselors admitted only
  via `internalGuard` surfaces.

## 8. Request contract ownership

Canonical owner per family (summarized obligations; source paths are
normative, definitions are NOT duplicated here):

- Learner memory: zod schemas in `src/services/learnerMemoryValidation.ts`
  (route: `src/routes/learnerMemory.ts`). Consumers send JSON
  (`content-type: application/json`, `JSON_LIMIT` default `10mb`); missing
  identity -> 401 before validation.
- Evidence ledger: route-level required-field checks + `LearningEvidence…
  CommandService` + `LearningEvidencePrivacyGuard` (forbidden-key rejection:
  `chainOfThought/hiddenReasoning/answerKey/markingScheme`-class keys ->
  400). Required on create: `learnerId, sourceLineage{sourceType,
  sourceRecordId, sourceVersion,…}, safePayload, idempotencyKey`.
- Question bank: `*CommandService` + `AssessmentPolicyRegistry` +
  `AssessmentCommandEnforcementService`; writes REQUIRE an idempotency key
  (`x-idempotency-key` header or `idempotencyKey` body; absent -> 400
  `IDEMPOTENCY_REQUIRED`).
- Exam delivery: header-only `x-idempotency-key` required on lifecycle
  transitions; `paperId/paperVersionId/title` required on session create.
- Durable sessions: transition `transitionType` required; `requestedMode`
  validated against the state machine (illegal -> 422).
- Voice: `studentId` + positive-int `minutesPurchased`/usage fields;
  `sessionUsageId` required on stop; multipart `audio` on STT paths
  (`upload.single('audio')`); per-day caps (`MAX_VOICE_SESSIONS_PER_DAY=3`,
  180 s/session; documents 2/24 h).
- AI chat core: manual service-owned validation; file/multipart only on
  media/voice ingestion paths (local `multer.diskStorage` tmp; no external
  object-storage port).
- Normalization/bounds: schoolId blank -> null (never matches foreign scope);
  role strings lowercased/trimmed; voice ints positive-only; session-event
  list `limit` default 50 (no max cap — consumers MUST pass sane limits).

## 9. Response contract ownership

- Health: `{ ok, status: 'live', service, timestamp, uptimeSeconds,
  version }` (200); readiness/dependencies/routes: `{ ok, checks,
  warnings, … }` (200 or 503).
- AI/chat core: 200 direct service objects (family shapes differ by design;
  no envelope normalization was performed — consumers must handle per-
  family shapes).
- Evidence: `{ ok, data }` / `{ ok:false, error:{ code, message, requestId,
  correlationId } }`. Create -> 201 with `{ eventId, evidenceCandidateId,
  streamSequence, currentState, eventHash }`. Empty learner evidence ->
  200 with `data: []` (empty is NOT an error). Unknown id -> 404
  `EVIDENCE_NOT_FOUND`.
- Question bank: `createSafeResponseEnvelope` (`ok, requestId,
  correlationId, resourceId, resourceVersion, status, safeMessage,
  reasonCode, policyDecision, nextAllowedActions, data, errorCode`).
  Writes -> 201 (`draft_created` etc.).
- Exam delivery: explicit session states (`draft/open/paused…`) with
  `nextAllowedActions` on every transition.
- Durable sessions: `{ ok, session: safeState, decision }`; learner-safe
  sanitization applied (`sanitizeSessionStateForLearner`).
- Voice: `{ allowed, remainingSeconds, reason }`; quota-exhausted start ->
  402 `time_exhausted`; degraded abuse path sleeps 2 s instead of refusing.
- Version/revision fields: evidence `streamSequence`/`eventHash`;
  question-bank `resourceVersion`; session `stateVersion`. Timestamps ISO.
  Async/job identifiers: roster sync batch ids; recovery-board refresh-job
  ids; projection-rebuild results.

## 10. Error semantics

Stable integration categories (map per family; envelopes differ by family by
design — a different shape is documentation, not a defect):

| Category | Typical status | Retryable | Notes |
|---|---|---|---|
| VALIDATION | 400 (`VALIDATION_ERROR`, `IDEMPOTENCY_REQUIRED`, `SCHOOL_CONTEXT_REQUIRED` on mock-context routes) | no (fix request) | zod or manual; privacy-forbidden keys included |
| AUTHENTICATION | 401 (`UNAUTHENTICATED`, `SCHOOL_CONTEXT_REQUIRED`, `AUTH_REQUIRED`) | no (re-authenticate) | never leaks which credential half failed |
| AUTHORIZATION | 403 (`Forbidden`, `POLICY_BLOCKED`, `FORBIDDEN_FIELD`, `ROLE_FORBIDDEN`, `RELATIONSHIP_FORBIDDEN`, `SCHOOL_CONTEXT_INVALID`) | no | fail-closed; student cross-learner evidence reads return 200-empty (scope, not error) |
| NOT_FOUND | 404 (`NOT_FOUND`, `EVIDENCE_NOT_FOUND`) | no | no false 2xx (proven) |
| CONFLICT | 409 (question-bank `IDEMPOTENCY_CONFLICT`/`VERSION_CONFLICT`/`INVALID_STATE`; sessions 409/422) | same-key/same-hash replay yes; changed-hash no | evidence family surfaces idempotency conflict as 400 + `EVIDENCE_IDEMPOTENCY_CONFLICT` (stable, documented difference) |
| RATE_LIMIT_OR_QUOTA | 429 (`Retry-After`, `retryAfterMs/Sec`; voice 402 `time_exhausted` + 429 daily caps) | yes, after `Retry-After` | abuse path headers `X-RateLimit-Abuse`; tenant path `X-RateLimit-Student/School-Remaining` |
| TIMEOUT | 408/504 family via `AiTimeoutError` (provider timeouts 10–30 s, hard deadlines 20–60 s) | depends on idempotency | server request timeout 120 s |
| DEPENDENCY_FAILURE | 503 (`DEPENDENCY_UNAVAILABLE`) | yes with backoff | redis/pinecone degrade gracefully when unconfigured |
| UNAVAILABLE | 503 (readiness not-ok) | yes | health `/ready` is the probe |
| INTERNAL | 500 (`INTERNAL_ERROR`, `{ message: 'An unexpected error occurred.' }`) | no blind retry on mutations | no stack/secret/learner payload in consumer messages |

Sensitive-detail restriction: global handler emits `{ message }` only;
safe envelopes carry `safeMessage` + `reasonCodes`; raw learner payloads,
keys, and PII never enter logs or errors (secret/privacy review clean).

## 11. Idempotency / duplicate behavior

| Family | Classification | Key source / semantics |
|---|---|---|
| Evidence ledger | REQUIRED | `idempotencyKey` + sha256 `requestHash`, scoped per school+command. Same-key/same-hash -> replay original result (201 with identical `evidenceCandidateId`, proven). Same-key/changed-hash -> `EVIDENCE_IDEMPOTENCY_CONFLICT` (400+code, non-retryable, proven). Persistence owner: event store (`appendEventAtomically`). |
| Question bank writes | REQUIRED | `x-idempotency-key` header or body key; missing -> 400. Same-key/changed-request -> 409 `IDEMPOTENCY_CONFLICT`. Owner: `AssessmentIdempotencyService` + in-memory/audit repos. |
| Exam delivery lifecycle | REQUIRED | header-only `x-idempotency-key`; missing -> 400. |
| Durable learning sessions | REQUIRED | `idempotency-key`/`x-idempotency-key` header + transition fingerprint; replay (200/201) vs 409 conflict. |
| Roster sync | REQUIRED | idempotency locks in `task021RosterSyncRuntime`. |
| AI chat / reads / voice ledger | SUPPORTED_OPTIONAL or NOT_APPLICABLE | voice settlement is transactional (row locks) rather than key-deduped. |
| Control-plane governance | family-specific | locks where control ops mutate rollout state. |

Consumer rule: never blind-retry a non-idempotent mutation; reuse the same
key for intentional retries; treat changed-hash conflicts as
do-not-retry-without-operator-review.

## 12. Pagination / large-data behavior

- Session events (`learnerSessions`): `limit`-only, default 50, NO max cap,
  no cursor/offset — consumers MUST pass bounded limits; multi-year history
  must be paged client-side by session.
- Exam sessions list: `status` filter only, full-array response.
- Question-bank lists (candidates, approvals, versions, holds): full arrays,
  intentionally bounded domains, no pagination by design.
- Evidence learner reads: full stream projection (bounded per-learner
  streams), empty -> `[]` with 200.
- Roster/sync: batch-scoped payloads; unbounded-roster risk is a known
  BEFORE_PRODUCTION gap (`GAP-school-roster-unbounded`) — future lane must
  page/chunk large rosters.
- Feeds (daily learning feed, growth): bounded server-side (rank-dedupe,
  R8-H); no cursor protocol.

## 13. State / persistence effects

Mutation families (external-consumer view):

- Evidence: candidate -> validate -> review/usable -> commit ->
  supersede/retain; `expectedStreamSequence` concurrency guard
  (`STREAM_CONCURRENCY_CONFLICT`, retryable with fresh state); atomic
  append (event + stream + projection + idempotency record); restart-
  durable event store.
- Exam delivery: `draft -> open <-> paused -> closed/cancelled` with
  `nextAllowedActions`; invalid transitions rejected, never partially
  applied.
- Durable sessions: `transitionSessionState` state machine; pause/resume/
  complete/abandon; transactional state+event writes with rollback on
  failure (proven by existing atomic suites).
- Question bank: draft -> version -> approval -> exposure/release; approval
  decisions and ingestion accept/reject are terminal-ish transitions with
  version-conflict protection.
- Voice: quota consume/settle transactional with row locks; concurrent
  consumes serialize on the ledger row.
- Roster: dry-run -> diff -> apply with conflict sets
  (created/updated/inactivated/conflicts + reason codes); in-memory job
  store (restart re-runs sync; idempotency locks prevent double-apply).
- Audit/outbox: school-integration audit is fire-and-forget and explicitly
  non-blocking (persistence failure never blocks the route response);
  assessment audit writer records command outcomes.
- Partial failure: command failures return stable error codes with
  `retryable` flags (`STREAM_CONCURRENCY_CONFLICT`/`PERSISTENCE_FAILED`
  retryable; conflicts/validation not).

## 14. Timeout / retry / circuit behavior

- HTTP consumer guidance: default server timeout 120 s; provider-backed
  calls resolve far earlier (see below). Retry ONLY idempotent operations
  or after `Retry-After`; never blind-retry mutations without keys.
- Backend internal: AI runtime timeout service (chat 30 s / hard 60 s;
  tool 15/30 s; embedding 10/20 s; classification 15/30 s; AbortController;
  `AiTimeoutError`), retry policy (max 3 attempts, exp backoff base 1 s,
  max 30 s, jitter 0.25), circuit breaker keyed `provider:operation`
  (closed/half-open with probe counts), retry-storm guard (task019).
- External-provider retry: YouTube/Vimeo adapters cached (8-min adapter
  cache) and return `[]` without key (no retry storm); safety webhook 5 s
  timeout, boolean outcome; Genkit transcript flow caught to null.
- Dependency checks: readiness DB 3 s / redis 2 s; `/dependencies` 5 s.
- Cancellation/partial success: abort on provider timeout; stream-sequence
  conflicts surface current safe state for resumption; roster dry-run
  precedes apply.

## 15. Rate limit / quota behavior

- Global: 10,000 req / 15 min (shared-IP school safe), `standardHeaders`,
  message `Server is under heavy load…`.
- Route layer (`task019`): exempt — `/api/health*`, `/api/ops*`,
  `/api/ready` (all checks off; proven); light — `/api/admin/rate-limits`;
  strict multi-tenant — roster sync. Explicit `rateLimitMiddleware` on AI +
  voice mounts (R8-H semantics preserved: sliding-window O(1) fast path,
  order-independent fallback under clock rollback — proven by
  `r8h-rate-limit-equivalence`).
- In-file AI limiters: `aiLimiter` 30/min, `sttLimiter` 15/min,
  `ttsLimiter` 20/min (user-or-IP keyed); legacy `rateLimiter` 20/60 s.
- Deny shape: 429 + `Retry-After` (+ `retryAfterMs/retryAfterSec`;
  abuse: `X-RateLimit-Abuse`; tenant: `X-RateLimit-Student/School-
  Remaining`). Proven deterministically in the handoff contract test.
- Voice quotas: 3 sessions/day, 180 s each; documents 2/24 h; balance 402
  `time_exhausted`; usage 429 daily-cap. Consumer action: surface
  remaining-time UI from balance endpoints; back off on 429.
- Internal anti-abuse detail beyond these headers is intentionally
  undocumented.

## 16. External-port manifest

| Port | Status | Owner | Current adapter | Future integration obligation |
|---|---|---|---|---|
| Governed LLM generation | DETERMINISTIC_MOCK | `src/services/aiGateway/` (`aiProviderGateway`, `modelProviderContracts`, `providerHealthService`, `safeModelRouter`) | `MockModelAdapter` (`mock-provider/mock-model-v1`, default route); `Local/CloudModelAdapter` return `misconfigured/provider_unavailable` without config | choose provider + credentials + SLO; route via governed gateway (policy packets, timeouts, circuit) |
| Legacy direct LLM (chat/embeddings/image) | ACTIVE_INTERNAL (live where configured) | `src/routes/ai.ts`, `src/services/aiService.ts`, `src/lib/personalization.ts`, `src/workers/` | `openai` SDK direct calls | migrate callers to governed gateway OR explicitly own the direct path per call-site before scale |
| STT (Whisper) | ACTIVE_INTERNAL (live where configured) | `src/routes/ai.ts` (`audio.transcriptions`) | `openai` SDK | own retention/consent + timeout policy (PII-sensitive audio) |
| TTS | ACTIVE_INTERNAL (live where configured) | `src/routes/ai.ts`, `recapGenerationService`, `src/media-stream/voice.ts` | `openai.audio.speech` | voice catalogue + cost caps |
| Vector/search (Pinecone) | LIVE_DISABLED (graceful when unconfigured) | `src/lib/pinecone.ts`, `src/lib/vectorClient.ts` | SDK guarded by `if(pineconeIndex)`; `required:false` dependency | index strategy + namespace (`student-{id}`) + retention before activation |
| Cache/session/rate (Redis) | LIVE_DISABLED (graceful when unconfigured) | `src/lib/redis.ts` | `null`-client bypass; rate limiter fail-open | production Redis + key-space policy |
| Genkit flow runtime | LOCAL_ONLY | `src/routes/ai.ts`, `videoRecommendationService` | in-process `runFlow` (flows in `AI/`, NOT backend) | none backend-side; AI lane owns flows |
| YouTube / Vimeo candidates | LIVE_DISABLED (empty without key) | `youtubeCreativeSourceAdapter`, `vimeoCreativeSourceAdapter` | HTTPS + cache; strict safe-search | API keys + quota + allowlist policy |
| OCR/PDF/image assist | LOCAL_ONLY (backend view) | backend import site `ai.ts`; impl in `AI/` attachments flow | base64 in/out, no OCR vendor SDK in backend | AI lane owns OCR quality/PII handling |
| Counselor safety webhook | LIVE_DISABLED (no-op without URL) | `src/services/safetyNotifier.ts` | `fetch` POST 5 s timeout, redacted excerpt | webhook URL + delivery SLO + retry policy |
| School identity/roster (SIS/LMS/SSO) | DETERMINISTIC_MOCK + PORT_DEFINED_NO_LIVE_ADAPTER | contracts `schoolSystemBridgeContracts`; mock `mockSchoolSystemAdapter`; disabled-live `disabledLiveSchoolSystemAdapter`; runtime `task021*`; routes `schoolIntegration` | default mode `mock_only`; disabled adapter returns empty shells; roster pure diff + in-memory jobs | future `SCHOOL_CONNECTOR_*` config + OAuth/roster mapping + sync/idempotency/conflict/deactivation/audit contracts (deferred lane) |
| Email / SMS / push | NOT_IMPLEMENTED_DEFERRED | — (only guard-test mentions) | none | full provider selection + consent + DND handling (deferred lane) |
| Object storage / uploads infra | NOT_IMPLEMENTED_DEFERRED (local tmp only) | `ai.ts` multer disk tmp | local disk | storage choice + signed URLs + retention (deferred) |

No mock is described as live. No new speculative ports were created: every
row above has a code owner; anything without backend behavior is correctly
`NOT_IMPLEMENTED_DEFERRED`.

## 17. Frontend consumer map

Transport truth: UI -> `frontend/lib/api.ts` -> Next proxy
(`frontend/app/api/copilot/[...path]/route.ts` -> `${backend}/api/copilot/…`;
voice via `frontend/app/voice/proxy.ts` + `/api/voice/:path*` rewrite).
Auth context expected: Bearer JWT (frontend owns acquisition/refresh —
backend only verifies).

| Surface | Status | Consumer path | Backend family | Gap |
|---|---|---|---|---|
| Study Chat | LIVE_CONSUMER | `frontend/components/steadfast-copilot.tsx` (`/api/copilot/chat`, `/message`, `/new-session`, `/session/:id`, `/preload`), `CopilotWidget.tsx` (`/handoff`) | chat/session/handoff | none blocking |
| Revision | LIVE_CONSUMER | `frontend/components/revision-tab.tsx` (collections, flashcards, guided-session respond) | revision modes | none blocking |
| Practice | LIVE_CONSUMER | `steadfast-copilot.tsx` (`practice-pad/check-step`), `AssessmentWorkspace.tsx` (assessment sessions start/answer/hint/navigate/finish/results) | practice + `/api/copilot/assessment/*` | direct `/api/question-bank` not yet consumed (backend ready, actor-context constraint applies) |
| Growth | LIVE_CONSUMER | `GrowthWorkspace.tsx` (`api.growth.*`, `api.study.*`) | growth aggregate/action, study plans, daily feed | `/api/phase3/*` not consumed (UI uses copilot growth paths) |
| Media | LIVE_CONSUMER | `steadfast-copilot.tsx` (media assets), `voice-concierge.tsx` (audio-recap) | media assets/recaps | none blocking |
| Profile | LIVE_CONSUMER | `steadfast-copilot.tsx` + `CopilotPrefetch.tsx` (preferences, student memory) | preferences, learner memory | none blocking |
| Learning Sessions | PARTIAL_CONSUMER | chat-session endpoints live; dedicated `/api/learner*` + `/api/phase3*` session routes unconsumed | durable sessions | wire dedicated session lifecycle when UX needs it |
| Teacher/Admin | NO_CONSUMER_EVIDENCE | client defs exist (progress-summary, school-safe-report, interventions); only safety page calls `api.safety.*` | teacher reports/insights | UI build-out is a frontend-lane item |
| Question Bank | PARTIAL_CONSUMER | assessment sessions live via copilot paths; `/api/question-bank` direct unconsumed | question-bank packages | direct use requires verified-context replacement (D2) |
| Voice | PARTIAL_CONSUMER | proxy+client+AI hook exist; no prod UI caller | voice/quota ledger | UI build-out + quota UX is a frontend-lane item |

Frontend handoff answers: which endpoint (table + route map), identity
(Bearer JWT; verified school derived server-side), payloads (section 8),
responses (section 9), failures (section 10), retry (sections 11/14),
pagination (section 12), idempotency keys (section 11), authoritative server
state (13; UI must NOT infer mastery/session/ledger state locally; must NOT
send authoritative `schoolId` — server derives it).

## 18. AI consumer map

- AI orchestration (`AI/ai/flows/*`, `AI/ai/tools/*`) makes NO backend HTTP
  calls (in-process Genkit + direct Prisma in AI lane); the only AI-lane
  HTTP client is voice-scoped (`AI/lib/api.ts` -> `/api/copilot/voice/*`,
  consumed by `AI/useVoiceController.ts`). Classification: AI-lane is
  PLANNED_CONSUMER of governed backend ports (no live port calls today).
- AI lane may call through: governed LLM port (mock default; request
  `{requestId,providerId,modelId,prompt,generationMode}` -> `{ok,text|
  errorCode,latencyMs}`), transcript/video-candidate adapters (in-process /
  gated), evidence/session write paths (with verified identity).
- Required context: verified school identity (JWT + verified context, never
  body-echoed); structured request/result shapes per section 8/9.
- Backend-owned (AI must NOT decide): safety/source-policy outcomes,
  socratic vs answer behavior, deen referral, retention/privacy classes,
  quota/rate outcomes, timeout/circuit behavior.
- AI output may NOT directly mutate: evidence commits, session transitions,
  quota ledger, roster/sync state, governance/rollout state — all require
  backend command paths with verified identity + idempotency keys.

## 19. School-system integration map

Current truth: deterministic local school boundary; live adapters deferred.

- Identity/SSO boundary: JWT claims + verified-context middleware (section
  6). No OAuth/SSO client exists (`NOT_IMPLEMENTED_DEFERRED`).
- School mapping: `createOrResolveIdentityMapping`, tutor-learner mapping
  with active/scope checks (`INACTIVE_LEARNER_MAPPING`,
  `SCHOOL_SCOPE_MISMATCH` fail-closed).
- Roster boundary: `processRosterSync`/`computeRosterDiff` pure local;
  batch ids, created/updated/inactivated/conflicts + reason codes;
  idempotency locks; in-memory job store (restart re-runs).
- Identifiers: external user/student/teacher ids + class/subject ids flow
  through verified context; body-echoed ids are never authoritative.
- Sync/idempotency/conflict: same-key replay vs conflict (section 11);
  dry-run before apply; conflict sets returned, not auto-resolved.
- Deactivation: inactivation via sync diff (no live directory delete is
  performed anywhere).
- Audit: fire-and-forget, non-blocking, reason-coded.
- Future adapter obligation: `SCHOOL_CONNECTOR_*` config schema exists as
  future names only; provider choice, OAuth, mapping, and SLO are deferred
  lane decisions (D3).

## 20. Configuration categories

Names/categories only (never values; no `.env` was read or printed):

- REQUIRED_AT_STARTUP: `DATABASE_URL`, `JWT_SECRET` (+ `COPILOT_JWT_SECRET`/
  `COPILOT_PUBLIC_KEY` alternatives for auth), `OPENAI_API_KEY`,
  `AI_PROVIDER_API_KEY`, `ENCRYPTION_KEY`, `NODE_ENV`. Auth keys are
  fail-fast (import-time fatal); the rest surface as validation issues, not
  hard exits.
- REQUIRED_PRODUCTION: `REDIS_URL`, `ALLOWED_ORIGINS` (empty in production
  blocks cross-origin; logged at boot).
- OPTIONAL: `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`,
  `STUDENT_ANALYTICS_CACHE_TTL`, `SESSION_EXPIRY_MS`,
  `SCHOOL_SYNC_INTERVAL_MS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`,
  `SCHOOL_CONNECTOR_TIMEOUT_MS`, `JSON_LIMIT`, `REQUEST_TIMEOUT_MS`,
  `OPENAI_TTS_MODEL`, `YOUTUBE_DATA_API_KEY`, `VIMEO_ACCESS_TOKEN`,
  `COUNSELOR_ALERT_WEBHOOK_URL`, `ADMIN_USER_IDS`, `COUNSELOR_USER_IDS`.
- MOCK_ONLY: governed-gateway mock routing (`mock-provider` default).
- LIVE_INTEGRATION_DEFERRED: `PINECONE_*`, provider keys for future
  adapters, `SCHOOL_CONNECTOR_*` future names.
- Fail-fast behavior: auth keys hard-fail; required-all/production issues
  reported via `validateBackendEnv`; redis/pinecone/media adapters degrade
  to disabled with warnings; rate limiter fail-open on internal error.

## 21. Compatibility / versioning rules

- No `/v1` was added. Baseline pin: contract baseline SHA `b9ed759…` +
  handoff contract version `1` (section 1).
- NON_BREAKING: optional additive response field; new optional request
  behavior; new endpoint.
- BREAKING: required request-field change; field type change; semantic
  meaning change; removed field; auth requirement change; error semantic
  change; idempotency change; state-transition change; path/method change.
- Breaking changes after this handoff require: explicit migration/version
  strategy + consumer impact review + contract regression update. Silent
  consumer breaks are forbidden.

## 22. Deferred integration work

- D1 frontend wiring: dedicated session lifecycle, teacher/admin surfaces,
  voice UI + quota UX, direct question-bank use (gated on D2).
- D2 question-bank verified-context replacement: swap
  `extractMockAssessmentActorContext` for verified-context middleware before
  any live-school use; keep idempotency/policy semantics.
- D3 school lane: SSO/OAuth, SIS/LMS/roster live adapters, mapping,
  deactivation, sync SLO (port defined, adapters deferred).
- D4 notifications: provider selection + consent + delivery SLO.
- D5 AI-provider activation: governed-gateway provider choice, credentials,
  cost/latency SLO, legacy-direct-path disposition.
- D6 vector/cache activation: Pinecone index + Redis key-space policy.
- D7 deployment/pilot: environment gates, SLO/RTO/RPO, canary/rollout
  execution (governance routes exist; execution is a separate lane).
- D8 roster scale: bounded/chunked large-roster sync
  (`GAP-school-roster-unbounded`).
- D9 session-events list cap: add explicit max limit (currently default 50,
  uncapped).

## 23. Unresolved policy decisions

| POLICY | AFFECTED CONTRACT | CURRENT SAFE BEHAVIOR | WHO MUST DECIDE | INTEGRATION IMPACT |
|---|---|---|---|---|
| Evidence candidate student-self cross-check | `/api/copilot/evidence` writes | school scope + roles enforced; body learnerId echoed, not JWT-compared | product + backend architecture | frontend MUST send caller's own learnerId; do not rely on server cross-check here |
| Question-bank actor trust | `/api/question-bank/*` | JWT auth + policy registry; actor detail mock-extracted | backend architecture (D2) | no live-school use until verified-context replacement |
| Retention/erasure periods | evidence, sessions, ledger, media | durable stores; no auto-erasure proven | product/policy + school contracts | data-lifecycle lane before pilot |
| Parent release policy | report cards, parent support, transparency | parent-safe projections only; no raw learner data to teachers/parents | product/policy | teacher/parent UI scope |
| External provider choice | LLM/STT/TTS/vector | mock default; legacy direct live where configured | product + AI lane (D5) | cost/latency/privacy posture |
| Production SLO/RTO/RPO | readiness, backup/drill surfaces | checks + drills exist; targets unset | operations | deployment/pilot entry criteria |
| School identity mapping | SSO/roster/role mapping | mock + disabled-live shells | school lane (D3) | blocks live roster/SSO |
| Unbounded lists | session events, rosters | defaults/bounded domains; session events uncapped | backend lane (D8/D9) | client-side bounding required meanwhile |

Only items with repository/architecture evidence are listed; no defaults
were invented.

## 24. Integration-readiness proof

New selection (all deterministic, no live calls — loopback-only fetch
proven by guard spy):

- `src/tests/integration-readiness-handoff.contract.test.ts` — 23/23 PASS:
  health public contract (2), auth provenance incl. spoof rejection (3),
  verified-context incl. 401/403 closures (3), evidence family end-to-end
  incl. durable 201, validation 400, replay, conflict, teacher write,
  cross-school empty, spoof-scope, 404, role gates (11), rate-limit
  exemption + 429 semantics (2), mock/disabled ports + offline proof (3).
- Reused (existing, unmodified): `r8g-final-security-integrity` 11/11
  (cross-school isolation, verified-context video guard, source-trust
  fail-closed, RBAC regression), `learning-evidence-routes` (router family
  regression), `r8h-rate-limit-equivalence` (R8-H semantics preserved),
  `r8g-idempotency-lifecycle` — combined 68/68 PASS across 5 files.
- R8-G identity proof reused, not rewritten (section 35).
- Deferred-live proof: mock-provider default generation, `mock_only`
  school mode + disabled-live empty shells, zero non-loopback fetch during
  contract proof, no credentials required (synthetic JWT secret only).
- No-secret review: synthetic identifiers throughout; diff contains no
  keys/tokens/PII fixtures.

## 25. Handoff checklist

- [x] Baseline `b9ed759…` proven (detached worktree HEAD + route-map
  regeneration stamped to it).
- [x] Current route truth refreshed via existing scanner (no new scanner;
  no production change; delta reconciled in section 5/38-equivalent).
- [x] Auth/authz provenance mapped from real middleware (sections 6–7).
- [x] Request/response/validation/error contracts mapped (sections 8–10).
- [x] State/idempotency/concurrency/pagination mapped (sections 11–13).
- [x] Timeout/retry/circuit + rate-limit mapped (sections 14–15).
- [x] External ports classified with activation truth (section 16).
- [x] Frontend/AI/school-system consumer maps, read-only (sections 17–19).
- [x] Representative deterministic contract proof passes (section 24).
- [x] No live integration activated; secrets/privacy preserved (24 + diff
  review).
- [x] TypeScript 0 diagnostics, Prisma valid, build emits startup artifact.
- [x] One clean local commit, exact-path staging, no push.

### Final handoff status

| Lane | Status |
|---|---|
| FRONTEND CONTRACT | READY_FOR_INTEGRATION |
| AI PORT CONTRACT | READY_FOR_INTEGRATION (mock port) + DEFERRED_WITH_EXPLICIT_PORT (live provider) |
| SCHOOL IDENTITY PORT | DEFERRED_WITH_EXPLICIT_PORT |
| SIS/LMS PORT | DEFERRED_NOT_IMPLEMENTED |
| NOTIFICATION PORT | DEFERRED_NOT_IMPLEMENTED |
| PRODUCTION DEPLOYMENT | DEFERRED_NOT_IMPLEMENTED (governance routes ready; execution separate lane) |

The Steadfast backend is integration-ready at its defined external
boundaries. Backend-owned contract discovery and packaging for this build
cycle are complete. Live frontend, AI-provider, school-system and deployment
integrations remain separate execution lanes.

STEADFAST_BACKEND_INTEGRATION_HANDOFF_V1_COMPLETE
