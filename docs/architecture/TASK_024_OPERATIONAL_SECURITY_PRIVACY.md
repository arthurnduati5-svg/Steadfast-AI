# Task 024 – Operational Security & Privacy

## No Secret Leakage

All operations services are built to never expose secrets:

- **Database URLs** — the `RedactionAndLeakDetectionService` detects and redacts all database URL patterns (`postgres://`, `mysql://`, `mongodb://`, `redis://`, etc.) in any string value or object field.
- **API keys** — patterns matching `sk-...`, `ghp_...`, `xox...`, `AIza...`, provider keys (`pplx-...`, `openai-...`) are redacted.
- **Private keys, bearer tokens, auth headers, cookies** — all redacted via pattern matching.
- **Secret env vars** — the hardening checklist verifies that secret env vars (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `REDIS_URL`) are present but never prints their values.
- **The `checkSecretMasking` hardening check** confirms that secrets exist but only reports their names, never their values.

## No Private Student Data Leakage

- **Raw chat** — the field name `rawChat` is in the forbidden fields list and any telemetry event containing it is rejected.
- **Prompts** — `prompt`, `rawPrompt`, `systemPrompt`, `developerPrompt` are all redacted.
- **Provider responses** — `providerResponse`, `rawTranscript` are redacted.
- **Answer keys** — `answerKey`, `solutionSteps`, `answer_key` patterns are redacted in both field names and string values.
- **Teacher-only content** — `teacherOnlyNote`, `teacherOnlyContent` are redacted.
- **Student private memory** — `privateMemory`, `studentPrivateMemory` are redacted.
- **Safeguarding raw data** — `safeguardingRaw` is forbidden.
- **Deen-sensitive raw data** — `deenSensitiveRaw` is forbidden.

These protections apply at multiple levels:
1. The `SafeTelemetryService` rejects events with forbidden fields
2. The `RedactionAndLeakDetectionService` redacts both field names and values
3. The `scanForLeaks()` function reports pattern matches without exposing actual values
4. Contract tests verify no private data leaks in the operations pipeline

## No Unsafe Religious Authority

- Incident systems report **availability only** for Deen governance components — e.g., whether the Deen governance source is reachable.
- There is **no fatwa engine**, **no Islamic ruling logic**, and **no religious decision-making** in any Task 024 service.
- The `deenGovernanceRelevant` flag on incident records is a metadata marker that triggers a referral reminder to notify the Deen compliance lead — it does not perform any Deen-related verification or judgment.

## No Destructive DB Operations

- No Task 024 service executes `DROP`, `TRUNCATE`, `DELETE FROM`, `rm -rf`, or any destructive command.
- The hardening checklist explicitly scans `package.json` scripts for destructive patterns and reports violations.
- The `RestoreDrillService` always returns `destructiveCommandExecuted: false` and `realProductionDataOverwritten: false`.
- Contract tests (`task-024-no-destructive-backup-restore-command.contract.test.ts`) enforce this guarantee.

## No Live AI Calls

- No Task 024 service makes a direct HTTP call to an external AI provider.
- The hardening checklist scans all `task024` service files for references to known AI provider names (OpenAI, Anthropic, Cohere, Together, etc.) and reports any that are not in comments.
- Contract tests (`task-024-no-live-ai-call.contract.test.ts`) enforce this guarantee.
- All incident response plans are generated deterministically — no AI summarization or generation.

## Operations Routes — Admin/Internal Only

- All `/api/operations/*` routes are protected by `schoolAuthMiddleware` + `requireRole('admin', 'counselor')`.
- `enforceInternalAccess()` returns a `403` JSON response with a clear denial message for unauthorized users.
- Unauthenticated requests are blocked at the middleware level before reaching any operations handler.
- Contract tests verify both admin access and learner denial for all operations routes.

## Learners Denied from All Operations Routes

- Learners are explicitly denied access to all operations routes. The middleware checks for the `admin` or `counselor` role — learners have neither.
- The safeness denial message is: `"Access denied. Operations routes are admin/internal only."`
- Contract tests (`task-024-learner-denied-operations-routes.contract.test.ts`) verify this for every operations route.

## Security Contract Tests

The following contract tests enforce the security and privacy guarantees of Task 024:

| Test File | What It Verifies |
|---|---|
| `task-024-no-secret-leak.contract.test.ts` | No database URLs, API keys, or secrets appear in operations output |
| `task-024-no-private-data-leak.contract.test.ts` | No raw chat, memory, safeguarding, or Deen-sensitive data appears |
| `task-024-no-live-ai-call.contract.test.ts` | No direct AI provider calls made from Task 024 services |
| `task-024-no-destructive-backup-restore-command.contract.test.ts` | No destructive commands in restore drill |
| `task-024-operations-routes-admin-scope.contract.test.ts` | Routes are admin/counselor only |
| `task-024-learner-denied-operations-routes.contract.test.ts` | Learners get 403 on all operations routes |
