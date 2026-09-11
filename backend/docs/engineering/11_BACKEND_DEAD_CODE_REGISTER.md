# Backend Dead-Code Register

R8-F structural dispositions only. This is NOT a scanner output and NOT a
repo-wide cleanup record. Entries are added only with direct R8-F evidence.
Unlisted paths are out of scope; no speculative deletion occurred.

## R8-F dispositions

### InMemory result-release repositories — RETAIN (tests/fixtures only)

- PATHS: `backend/src/domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories.ts`
  (all 10 classes: packet, approval, audience projection, report snapshot,
  parent-safe summary, student-safe summary, delivery intent, audit,
  idempotency, approval atomic committer).
- DISPOSITION: RETAIN.
- REASON: still required for explicit test injection
  (`createResultReleaseRouter(dependencies)` seam) and existing focused
  Package 11 service tests. No longer the default HTTP production
  composition — production defaults to the Prisma repository set via
  `buildProductionResultReleaseDependencies()` in
  `backend/src/routes/resultRelease.ts`, with no silent Prisma→memory
  fallback.
- EVIDENCE: `package-11-production-composition.test.ts` (4/4);
  `package-11-approval-workflow.test.ts` (17/17).

### Old direct ChatMessage persistence sites — CONSOLIDATED

- PATHS (caller remains; persistence responsibility moved to
  `backend/src/repositories/chatMessageRepository.ts`):
  - `backend/src/routes/ai.ts` (4 creates + 1 metadata update)
  - `backend/src/services/aiService.ts` (2 creates)
  - `backend/src/services/revisionLearningService.ts` (raw
    `INSERT INTO "ChatMessage"` proven same canonical object via
    `backend/prisma/schema.prisma`, now routed through the canonical
    writer with identical role/content/messageNumber/metadata/id/timestamp
    semantics)
- DISPOSITION: CONSOLIDATED (caller remains, persistence responsibility removed).
- DELIBERATELY EXCLUDED: `backend/src/routes/ai/ai-chat.routes.ts`
  (unmounted, untracked owner segmentation stub — not a live production
  writer; left byte-identical). Session-scoped `deleteMany` on session
  delete and all read paths (`findMany`/`findFirst`/`count`, MAX
  messageNumber read) are unchanged caller-side behavior, not competing
  persistence rules.
- EVIDENCE: `src/repositories/chatMessageRepository.test.ts` (6/6);
  `prisma-client-boundary.contract.test.ts` (12/12);
  directly-affected ownership assertions in
  `backend-infrastructure-ownership.contract.test.ts` pass (one unrelated
  pre-existing failure in that file concerns untracked owner config
  content, untouched by R8-F).

### Genuinely dead files discovered within touched paths — NONE

- No file with zero-consumer proof was found inside the R8-F touched
  paths. No files were deleted.
