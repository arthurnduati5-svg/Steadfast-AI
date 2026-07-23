# AI Provider Failure and Fallback Policy

## Overview

This policy governs how the system handles AI provider failures and determines safe fallback behavior. It applies to both mock and future live provider modes.

## Failure Hierarchy

```
Provider Call Requested
  → Gateway Safety Check
    → Blocked (school, learner, content, Deen, privacy) → Safe fallback response
    → Allowed (mock_only / disabled_live)
      → Provider unavailable → Safe fallback
      → Provider timeout → Retry or fallback
      → Provider rate limit → Backoff or fallback
      → Provider quota exceeded → Fallback
      → Provider unsafe output → Validate → Block or repair
      → Provider malformed response → Safe degraded response
      → Success → Output validation
        → Unsafe → Block, repair, or fallback
        → Safe → Return to tutor
```

## Failure Types and Handling

| Failure Type | Detection | Handling | Safe Message |
|---|---|---|---|
| Provider unavailable | Status check fails or connection error | Skip to fallback or mock | "I am not able to generate a response right now. Please try again in a moment." |
| Provider timeout | Exceeds configured timeout | Retry once, then fallback | "The response is taking longer than expected. Please try again." |
| Provider rate limit | HTTP 429 or rate limit error | Exponential backoff, then fallback | "I am receiving too many requests. Please wait a moment and try again." |
| Provider quota exceeded | HTTP 429 or budget guard blocks | Fallback to mock or safe degraded | "The learning service is temporarily unavailable. Please try again later." |
| Provider unsafe output | Output validation blocks | Block output, return safe fallback | See output validation outcomes below |
| Provider malformed response | Parse error or missing fields | Safe degraded response | "I received an unexpected response. Please try again." |
| School context missing | Gateway safety check | Blocked before any call | "School identity must be verified before I can assist you." |
| Content context missing | Gateway safety check | Content gap fallback | "I do not have enough approved curriculum content to answer this accurately." |
| Deen source missing | Gateway safety check | Scholar/teacher referral | "This question involves Islamic knowledge that should be referred to a qualified scholar." |
| Answer-key risk | Gateway safety check | Blocked before any call | "I cannot provide answer key content." |

## Fallback Decisions

| Fallback Type | When Used | Behavior |
|---|---|---|
| `fallback_mock` | No live provider available; live disabled | Return mock provider response |
| `fallback_safe_hint` | Unsafe output blocked; academic integrity risk | Return Socratic hint instead |
| `fallback_content_gap` | Missing approved curriculum content | Refer to teacher |
| `fallback_teacher_referral` | Teacher-only content risk; policy boundary | Refer to teacher |
| `fallback_scholar_referral` | Deen authority risk; unsupported fatwa | Refer to scholar |
| `fallback_retry_later` | Rate limit; quota; timeout | Tell user to retry |
| `no_fallback_available` | All providers and fallbacks exhausted | Return safe unavailable message |

## Output Validation Outcomes

| Outcome | Fallback |
|---|---|
| `safe_to_show` | Return to tutor as-is |
| `safe_after_redaction` | Redact and return |
| `blocked_academic_integrity` | `fallback_safe_hint` |
| `blocked_answer_key` | `fallback_teacher_referral` |
| `blocked_teacher_only` | `fallback_teacher_referral` |
| `blocked_deen_authority` | `fallback_scholar_referral` |
| `blocked_privacy` | `fallback_safe_hint` |
| `blocked_secret` | `fallback_safe_hint` |
| `blocked_safeguarding` | `fallback_teacher_referral` |
| `blocked_prompt_leak` | `fallback_safe_hint` |
| `degraded_safe_fallback` | Return safe unavailable message |

## Important Rules

1. No fallback may invent teaching claims without approved content context.
2. No fallback may expose raw provider errors, prompts, or responses to the learner.
3. No fallback may bypass the school identity gate.
4. No fallback may bypass the content governance gate.
5. No fallback may bypass Deen governance.
6. Fallback responses must be safe, Socratic, and learner-appropriate.
7. All fallback decisions are logged with safe metadata only.

## Incident/Observability Metadata

Only the following metadata is logged on provider failure:
- requestId
- providerId
- errorCode (not raw error body)
- latencyMs
- fallbackDecision
- outcome

Raw provider error bodies, prompts, and responses are never logged.
