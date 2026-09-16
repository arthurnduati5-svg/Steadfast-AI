# Backend Engineering Acceptance Report (R8-G.5R-FINAL + Final Security Integrity Repair)

## Accepted Baseline

- Baseline HEAD: `517ce9bb1bd191709acceaf9bd64e91d94d09227`.
- Closure commit: `276af5c3d772720f5f7971dce9ecff9d9093d2c3`.
- Final repair (this commit): `fix(r8-g): close final security integrity regressions` — school-scoped Task024 ops records, verified-identity video recommendation guard with honest provider-search evidence, source-trust school normalization; one new deterministic security test file; no migration edits; no AI-lane edits.
- Runtime entrypoint: `backend/src/index.ts`; `backend/tsconfig.json` retains `rootDir: ".."` and `files: ["src/index.ts"]` (REQUIRED_RUNTIME_CONTRACT: resolves the pre-existing rootDir/build emission error; the compiled graph is the complete transitive closure from the entrypoint, and `npm run build` emits successfully).

## Schema Reconciliation (owner-authorized)

- `StudentLearningSessionEvent` and `StudentLearningSessionState` synchronized with the already-tracked migrations `20260826140000_r1_durable_student_learning_session` and `20260827140000_r1_idempotency_fingerprint_unique`. No migration file was edited.
- `@default(cuid())` added to the two session row ids per existing schema convention (5 precedents); client-side default, DB contract untouched.
- `studentLearningSessionRepository.ts` is byte-identical to frozen HEAD (zero diff). One deterministic security test file was added by the final repair (`backend/src/tests/r8g-final-security-integrity.test.ts`, 11 tests); no pre-existing test file was modified.

## Proof

- `npx tsc -p tsconfig.json --noEmit`: PASS, 0 diagnostics, exit 0.
- `npx prisma validate --schema prisma/schema.prisma`: PASS.
- Focused regression (8-file command; 7 files collected, 51 tests passed): `r3-structured-artifact`, `artifact-r3-structured-understanding`, `task024-smoke`, `task024-restore-drill-dry-run-service`, `task024-operations-readiness-routes.contract`, `task-027-task026-execution-dependency-service`, `task-029-task027-expansion-governance-continuity.contract`, `task-026-no-answer-artifact-leak.contract` — the last file is excluded from collection by the `src/tests/task-026-*` pattern in `vitest.config.ts` (pre-existing config, unchanged).
- Durable R1 suites (3 files): `task-r1-unkeyed-create.atomic`, `task-r1-keyed-create.atomic`, `task-r1-durable-idempotency-repair.contract` — 14 tests passed.
- `npm run build`: PASS, exit 0; `backend/dist/backend/src/index.js` exists.

## Security And Privacy Invariants (proven, not claimed)

Targeted proof: `backend/src/tests/r8g-final-security-integrity.test.ts` — 11/11 PASS (single Vitest invocation, deterministic, provider Search mocked at `@genkit-ai/flow` with `importOriginal` so AI flow registration is untouched; no live AI, no live DB).

- Task024 school isolation test: PASS — School A `createBackupCheck`/`createOpsReport` retrievable via school-scoped `getLatestOpsReport(undefined, schoolId)` / `listBackupChecks(schoolId)`; School B scoped reads return null/empty. Writes carry the verified `schoolId` from caller composition (`getReqSchoolId(req)` in `task024OperationsRoutes.ts`); blank school normalizes to null and never matches another school's scope.
- Video verified-context authorization test: PASS — valid verified identity yields a school-scoped response (`meta.schoolId`, `recommendationId` prefixed, `safety.status = needs_review`, Islamic appropriateness `needsTeacherReview`, `cacheAllowed = false`); empty/whitespace `schoolId`/`studentId` throws before any provider use, so an untrusted boundary can never become an authorized recommendation request. Cross-school identity (B) cannot mint A-scoped output. Routes derive identity exclusively from `schoolAuthMiddleware` claims (`req.schoolId` / `req.userId`); body `schoolId` is never trusted.
- Source visibility fail-closed test: PASS — high-trust retrieval resolves `verified` under `citationPolicy: verified_only`; untrusted URL and missing retrieval record resolve `unsupported` with zero verified sources and `unsupportedSourcesBlocked = true`. Blank `schoolId` normalizes to null (no forged scope); tenant authorization remains in caller composition (`artifactQueryService`, `tutorContextResolver`, chat pipeline thread verified identity).
- RBAC regression: PASS — imperative `requireRole(req, res, allowed)` and middleware-factory `requireRole(...allowed)` forms both enforce via the same `resolveRequestRole`; admin/counselor pass, student/teacher-derived `student` is forbidden (403). No role expansion: `teacher` still maps to `student`; `school_admin` still resolves to `student`.
- Cross-school access proof: PASS — covered by the Task024, video, and source-trust cases above.

Preserved base guarantees: authentication, verified school identity, student privacy, safeguarding, rate limits, idempotency, audit, transaction, origin, and validation controls were not weakened. AI orchestration, model prompts, model selection, and tutoring philosophy were not modified. No secrets or raw learner payloads were added to logs. Generated `backend/dist/**` output is excluded from the commit (28 build-modified dist files restored to HEAD via binary-safe content restoration after the build proof).

## Process History (recorded truthfully)

- P2 `npm-ci` exception: contained dependency-tree restoration, no manifest edits.
- P5 stash exception: contained; followed by P5 reconstruction proof.
- Prisma `validate` in a bare shell reports P1012 `DIRECT_URL` (environment-only `getConfig` stage, pre-existing datasource env requirement, untouched by R8-G); schema syntax proof was obtained with stub datasource env values without touching any live database: "The schema at prisma/schema.prisma is valid".
- Process exceptions do not prevent correctness acceptance once proven contained.

## Remaining Backend Correctness Gaps

NONE

## R8-H Post-Acceptance Optimization (2026-09-16, baseline 6b419dad)

R8-G correctness remains intact; this section adds optimization truth without
rewriting the R8-G acceptance result above.

- Portfolio: 30 R8-C records reconciled (27 CURRENT, 2 SUPERSEDED, 1
  NO_LONGER_RUNTIME_REACHABLE); classes A=2/B=7/C=9/D=9 (see 06 appendix).
- Production optimizations (2, both ACCEPTED_OPTIMIZATION with correctness
  equivalence PASS): AI rate-limit sliding window O(w)->amortized O(1) ordered
  fast path with order-independent fallback for rare clock rollback
  (p95 -57%..-97% on repair recheck, digest `4ff6f5476dd6f430`); daily-feed rank-dedupe with
  rank-table + single-parse decoration (LARGE p95 -39%, STRESS p95 -20%,
  digest `297be19ee8a5ea75`). No output-contract, security, tenant, schema,
  or learning-rule change; no benchmark-only path in runtime; no generic
  abstraction (both STEADFAST_SPECIFIC, kept local).
- Proof: equivalence suites 25/25 PASS (rate-limit 12/12 incl. clock-rollback
  reference-baseline cases, daily-feed 13/13); existing guard/integration/contract
  suites 11/11 PASS; `npx tsc -p tsconfig.json --noEmit` 0 diagnostics
  (proven with a client regenerated from the tracked schema; owner
  node_modules restored from backup afterwards); `npx prisma validate` PASS
  (stub env); build emit PASS to temp dir with `index.js` produced; tracked
  `backend/dist/**` untouched; `git diff --check` clean.
- R8-G regression stance: optimizations touch neither security/tenant/source/
  video/durable-session/RBAC semantics, so unrelated R8-G suites were not
  mechanically rerun per run budget; the reliability-adjacent suites covering
  the touched paths pass (see above).
