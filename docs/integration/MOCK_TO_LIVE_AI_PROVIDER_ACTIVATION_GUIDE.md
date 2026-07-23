# Mock-to-Live AI Provider Activation Guide

## Status: Integration Deferred

**Task 038 does not activate the live AI provider.**

This guide documents the future activation steps required to switch from mock-only mode to live AI provider mode. All steps are integration-deferred and must be completed in a future activation task.

## Prerequisite: Task 038 Complete

Before any live activation, verify:
- [x] AI provider contracts exist
- [x] Gateway safety service exists
- [x] Mock provider adapter exists
- [x] Disabled live provider adapter shell exists
- [x] Provider activation guard exists
- [x] Request redaction service exists
- [x] Output validation service exists
- [x] No-bypass audit passes
- [x] Provider mode defaults to `mock_only`
- [x] Live provider mode is blocked
- [x] No real API keys are in codebase
- [x] Privacy/secret scan passes

## Activation Steps

### Step 1: Complete Frontend Runtime Wiring

- [ ] Wire frontend API client to backend endpoints
- [ ] Run frontend integration tests
- [ ] Verify error-state playbook works end-to-end

### Step 2: Complete School-System Identity Bridge

- [ ] Connect real school-system OAuth/API
- [ ] Verify school identity bridge works
- [ ] Confirm: no school context = no AI call

### Step 3: Verify Pre-Call Gates

- [ ] School context verified before any provider call
- [ ] Learner context verified before any provider call
- [ ] Content governance verified before any teaching claim
- [ ] Deen governance verified before any Islamic content generation
- [ ] Academic integrity checked before any provider call
- [ ] No answer keys or teacher-only content in context

### Step 4: Choose Provider and Model Alias

Select from the contract-defined provider names:
- `future_openai`
- `future_anthropic`
- `future_google`
- `future_groq`
- `future_openrouter`
- `future_local_ollama`
- `future_other`

Configure `AI_PROVIDER_NAME` and `AI_PROVIDER_MODEL_ALIAS`.

### Step 5: Configure Provider Environment Variables Securely

Required env vars (names only, set values via secure secrets manager):

```
AI_PROVIDER_MODE=live_ready_not_enabled
AI_PROVIDER_NAME=future_openai
AI_PROVIDER_MODEL_ALIAS=gpt-4o
AI_PROVIDER_TIMEOUT_MS=30000
AI_PROVIDER_MAX_TOKENS=2048
AI_PROVIDER_RETRY_LIMIT=3
AI_PROVIDER_COST_LIMIT=10000
AI_PROVIDER_API_KEY=<set via secure env, never hardcoded>
```

**Never commit API keys, tokens, or secrets to the codebase.**

### Step 6: Configure Cost/Quota/Rate-Limit Policy

- [ ] Configure daily cost limits per provider
- [ ] Configure rate limit thresholds
- [ ] Configure retry policy
- [ ] Configure circuit breaker thresholds

### Step 7: Run Provider Privacy Scan

- [ ] Scan all provider request paths for secret leakage
- [ ] Verify redaction removes forbidden fields
- [ ] Verify no raw prompts or responses are logged

### Step 8: Run No-Bypass Audit

- [ ] Run `AiProviderNoBypassAuditService`
- [ ] Verify no route bypasses the gateway
- [ ] Verify no direct provider SDK calls outside disabled shell

### Step 9: Run Staging-Only Smoke Test

- [ ] Deploy to staging environment
- [ ] Run end-to-end smoke test with mock provider
- [ ] Run end-to-end smoke test with live provider (staging only)
- [ ] Verify degraded fallback works

### Step 10: Validate Degraded Fallback

- [ ] Simulate provider timeout → safe degraded response
- [ ] Simulate provider rate limit → safe degraded response
- [ ] Simulate provider unsafe output → blocked/fallback
- [ ] Simulate all providers unavailable → safe unavailable message

### Step 11: Validate Incident Response

- [ ] Configure provider incident alerting
- [ ] Verify incident response path works
- [ ] Document rollback procedure

### Step 12: Receive Manual Owner Approval

- [ ] All gates pass
- [ ] Privacy scan passes
- [ ] No-bypass audit passes
- [ ] Staging smoke test passes
- [ ] Owner/operator approves live activation

### Step 13: Enable Live Provider Mode

In a dedicated future activation task only:
1. Set `AI_PROVIDER_MODE=live_enabled`
2. Set provider API key via secure env
3. Run full smoke test suite
4. Monitor for 24 hours with degraded fallback ready

## Safety Bypass Prevention

The following are NEVER allowed in any mode:
- Direct provider SDK calls outside the disabled shell
- API keys in code, config files, or logs
- Database URLs in provider requests
- Raw prompts or responses in logs
- Provider calls without verified school context
- Provider calls without content governance check
- Teaching claims without approved sources
- Fatwa-style answers without Deen source authority

## Rollback

If live provider activation causes issues:
1. Set `AI_PROVIDER_MODE=mock_only` or `disabled_live`
2. Provider calls revert to mock adapter
3. All safety gates remain active
4. Investigate root cause before re-activation

## Verification

After activation, verify:
- [ ] School context blocks provider calls when missing
- [ ] Content governance blocks teaching claims when missing
- [ ] Deen governance blocks unsupported Islamic claims
- [ ] Academic integrity blocks final answers
- [ ] Output validation blocks unsafe content
- [ ] Redaction removes forbidden fields
- [ ] No bypass routes exist

## Important

This guide is for the future activation task only.
Task 038 builds the readiness layer but does not activate the live provider.
