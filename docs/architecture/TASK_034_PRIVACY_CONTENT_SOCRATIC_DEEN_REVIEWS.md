# Task 034 — Privacy, Content, Socratic, Deen Reviews

## Purpose

Privacy, content, Socratic integrity, and Deen boundary reviews ensure that the limited rollout continues to respect all privacy and governance boundaries during the rollout period.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## Privacy Review

| Check | Method | Pass Condition |
|---|---|---|
| Raw chat not exposed | Scan all rollout events | No raw chat found |
| Private memory not exposed | Scan all rollout events | No private memory found |
| Teacher notes not exposed | Scan all rollout events | No teacher notes found |
| Safeguarding details not exposed | Scan all rollout events | No safeguarding details found |
| Deen text not exposed | Scan all rollout events | No Deen text found |
| Tokens/secrets not exposed | Scan all config/events | No tokens/secrets found |
| Database URLs not exposed | Scan all config/events | No database URLs found |
| Answer keys not exposed | Scan all rollout events | No answer keys found |
| AI prompts not exposed | Scan all rollout events | No AI prompts found |
| Provider responses not exposed | Scan all rollout events | No provider responses found |

## Content Governance Review

| Check | Method | Pass Condition |
|---|---|---|
| Curriculum boundaries | Verify curriculum gate | Gate required and passing |
| Source attribution | Verify source gate | Gate required and passing |
| Content moderation | Verify moderation gate | Gate required and passing |

## Socratic Integrity Review

| Check | Method | Pass Condition |
|---|---|---|
| No answer leaks | Scan for final answer patterns | No answer key exposure |
| No homework shortcut | Scan for direct answer patterns | No shortcut detected |
| Student reasoning first | Verify response ordering | Reasoning before hints |
| NoFinalAnswer policy | Verify policy enforced | Policy gate passing |

## Deen Boundary Review

| Check | Method | Pass Condition |
|---|---|---|
| No fatwa engine | Scan for fatwa/ruling patterns | No fatwa engine introduced |
| No invented rulings | Scan for unverified rulings | No invented rulings |
| Deen text not exposed | Scan for Deen-sensitive text | No Deen text exposed |
| Safe referral path | Verify referral gate | Referral path preserved |
| Deen governance gate | Verify gate still enforced | Gate required and passing |

## Review Flow

```
Rollout Events -> PrivacyScanner -> ContentGovernance -> SocraticScanner -> DeenScanner
  -> If any violation -> Pause rollout, raise incident
  -> If all clean -> Record aggregate metrics
  -> Review Report
```

## Verification

Reviews are verified by:
1. Automated privacy scan scripts
2. Integration tests for each review check
3. Privacy scan confirming no raw data in review artifacts
