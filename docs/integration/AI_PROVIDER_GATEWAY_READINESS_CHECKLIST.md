# AI Provider Gateway Readiness Checklist

## Status: Integration Deferred (Task 038)

Live activation status: **BLOCKED / DEFERRED**

---

## 1. School Identity Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| School context verification gate exists | ✅ PASS | `aiProviderGatewaySafetyService.ts` | Task 038 | Pre-activation | YES |
| School context blocks provider when missing | ✅ PASS | Test: `school-context-before-provider` | Task 038 | Pre-activation | YES |
| No provider call without verified school | ✅ PASS | Contract: `AiProviderSchoolContext.verified` | Task 038 | Pre-activation | YES |

## 2. Learner Context Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Learner context verification gate exists | ✅ PASS | `aiProviderGatewaySafetyService.ts` | Task 038 | Pre-activation | YES |
| Learner context blocks provider when missing | ✅ PASS | Test: `learner-context-before-provider` | Task 038 | Pre-activation | YES |

## 3. Content/Source Governance Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Content governance gate exists | ✅ PASS | Gateway safety check | Task 038 | Pre-activation | YES |
| Content gap blocks teaching claims | ✅ PASS | Mock: content gap response | Task 038 | Pre-activation | YES |
| Answer key risk detected before provider | ✅ PASS | Safety context checks | Task 038 | Pre-activation | YES |
| Teacher-only content risk detected | ✅ PASS | Safety context checks | Task 038 | Pre-activation | YES |

## 4. Deen Governance Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Deen authority risk detected before provider | ✅ PASS | Safety context checks | Task 038 | Pre-activation | YES |
| Deen source unavailable → scholar referral | ✅ PASS | Mock: scholar referral | Task 038 | Pre-activation | YES |
| Fatwa-style answers blocked | ✅ PASS | Output validation | Task 038 | Pre-activation | YES |

## 5. Academic Integrity Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Academic integrity check before provider | ✅ PASS | Safety context | Task 038 | Pre-activation | YES |
| Final answer blocks enforced | ✅ PASS | Output validation | Task 038 | Pre-activation | YES |
| Socratic mode required | ✅ PASS | Gateway safety check | Task 038 | Pre-activation | YES |

## 6. Privacy/Redaction Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Request redaction service exists | ✅ PASS | `aiProviderRequestRedactionService.ts` | Task 038 | Pre-activation | YES |
| Forbidden fields removed | ✅ PASS | Test: redaction | Task 038 | Pre-activation | YES |
| Secrets masked | ✅ PASS | Test: redaction | Task 038 | Pre-activation | YES |
| Private memory excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Safeguarding raw excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Deen-sensitive text excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Answer keys excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Teacher-only content excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Database URLs masked | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Auth headers excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |
| Tokens excluded | ✅ PASS | Redaction service | Task 038 | Pre-activation | YES |

## 7. Provider Config Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Provider contracts define all modes | ✅ PASS | `aiProviderGatewayContracts.ts` | Task 038 | Pre-activation | YES |
| Provider mode defaults to mock_only | ✅ PASS | `getDefaultAiProviderMode()` | Task 038 | Pre-activation | YES |
| Live provider adapter disabled shell exists | ✅ PASS | `disabledLiveAiProviderAdapter.ts` | Task 038 | Pre-activation | YES |
| Mock provider adapter exists | ✅ PASS | `mockAiProviderAdapter.ts` | Task 038 | Pre-activation | YES |

## 8. Secret Management Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| No API keys in codebase | ✅ PASS | Privacy scan | Task 038 | Pre-activation | YES |
| No database URLs in codebase | ✅ PASS | Privacy scan | Task 038 | Pre-activation | YES |
| No tokens in codebase | ✅ PASS | Privacy scan | Task 038 | Pre-activation | YES |
| Future env vars documented by name only | ✅ PASS | `FUTURE_ENV_VARS` | Task 038 | Pre-activation | YES |

## 9. Quota/Cost Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Cost limit config schema defined | ✅ PASS | `LiveProviderConfigSchema` | Task 038 | Pre-activation | YES |
| Retry limit configured | ✅ PASS | Future config | Task 038 | Pre-activation | NO |

## 10. Rate Limit Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Rate limit simulation exists in mock | ✅ PASS | `simulateRateLimit()` | Task 038 | Pre-activation | NO |
| Rate limit policy config defined | ✅ PASS | Future config | Task 038 | Pre-activation | YES |

## 11. Observability Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Provider failure metadata policy defined | ✅ PASS | Failure/fallback policy | Task 038 | Pre-activation | YES |
| Raw prompts excluded from logs | ✅ PASS | Response envelope has `promptExcluded` | Task 038 | Pre-activation | YES |
| Raw responses excluded from logs | ✅ PASS | Response envelope has `rawResponseExcluded` | Task 038 | Pre-activation | YES |

## 12. Incident Response Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Failure types classified | ✅ PASS | `AiProviderFailure` contract | Task 038 | Pre-activation | YES |
| Fallback decisions defined | ✅ PASS | `AiProviderFallbackDecision` | Task 038 | Pre-activation | YES |

## 13. Fallback Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Fallback policy documented | ✅ PASS | `AI_PROVIDER_FAILURE_AND_FALLBACK_POLICY.md` | Task 038 | Pre-activation | YES |
| Mock provider fallback tested | ✅ PASS | Test: failure fallback | Task 038 | Pre-activation | YES |
| Content gap fallback | ✅ PASS | Mock: missing content | Task 038 | Pre-activation | YES |
| Scholar referral fallback | ✅ PASS | Mock: Deen question | Task 038 | Pre-activation | YES |
| Teacher referral fallback | ✅ PASS | Mock: teacher-only | Task 038 | Pre-activation | YES |

## 14. Staging Test Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Task 038 focused tests pass | ✅ PASS | Task 038 test suite | Task 038 | Pre-activation | YES |
| Provider no-live-call tests pass | ✅ PASS | No-live-call tests | Task 038 | Pre-activation | YES |
| Privacy leak scan passes | ✅ PASS | Privacy scan tests | Task 038 | Pre-activation | YES |
| No-bypass audit passes | ✅ PASS | No-bypass audit tests | Task 038 | Pre-activation | YES |

## 15. Manual Approval Readiness

| Item | Status | Required Evidence | Owner | Activation Phase | Blocking? |
|---|---|---|---|---|---|
| Activation guide documented | ✅ PASS | `MOCK_TO_LIVE_AI_PROVIDER_ACTIVATION_GUIDE.md` | Task 038 | Pre-activation | YES |
| Activation gates documented | ✅ PASS | `aiProviderActivationGuard.ts` | Task 038 | Activation task | YES |
| Rollback steps documented | ✅ PASS | Activation guide | Task 038 | Activation task | YES |

## Overall Status

| Criterion | Status |
|---|---|
| All blocking items for Task 038 passed? | ✅ YES |
| Live provider activation allowed? | ❌ BLOCKED / DEFERRED |
| Next required action | Run future activation task when all gates pass |
