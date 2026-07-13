# Task 036: Privacy, Content, Socratic, and Deen Boundaries

## Identity

- **Task:** 036
- **Component:** Privacy/Content/Socratic/Deen Boundary Enforcement
- **Type:** Backend-only boundary enforcement

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Ensure the launch runtime enforces all privacy, content, Socratic, and Deen boundaries. These boundaries are inherited from previous tasks (020, 022, 007, 008) and must remain intact during the live launch.

## Privacy Boundaries

| Boundary | Enforcement |
|----------|-------------|
| Raw student chat | NOT exposed |
| Private learner memory | NOT exposed |
| Teacher-only notes | NOT exposed |
| Safeguarding raw details | NOT exposed |
| Deen-sensitive private text | NOT exposed |
| AI prompts | NOT exposed |
| Provider responses | NOT exposed |
| Tokens/secrets | NOT exposed |
| Database URLs | NOT exposed |
| Answer keys | NOT exposed |
| Teacher-only content | NOT exposed |
| Protected rubrics | NOT exposed |
| Real student emails | NOT exposed |
| Real student phone numbers | NOT exposed |
| Real roster export | NOT exposed |

## Content Boundaries

| Boundary | Enforcement |
|----------|-------------|
| Unapproved curriculum content | Blocked |
| Unapproved source content | Blocked |
| External content without approval | Blocked |

## Socratic Boundaries

| Boundary | Enforcement |
|----------|-------------|
| No final answer for homework | Enforced |
| Socratic questioning required | Enforced |
| Answer key exposure | Blocked |
| Homework shortcut | Blocked |
| Socratic gate weakened | MUST NOT happen |

## Deen Boundaries

| Boundary | Enforcement |
|----------|-------------|
| Fatwa engine behavior | NOT introduced |
| Invented rulings | Blocked |
| Sectarian authority claims | Blocked |
| Deen-sensitive private text exposure | Blocked |
| Safe referral path preserved | Enforced |
| Deen governance gate weakened | MUST NOT happen |

## Gate Weakening Prevention

The following gates must NOT be weakened by Task 036:
- School auth gate
- School boundary gate
- Teacher/admin oversight gate
- Content governance gate
- Curriculum/source gate
- Socratic/no-final-answer gate
- Deen governance gate

## Verification

Boundary enforcement is validated by:
1. `scripts/task036-privacy-scan.cjs` — scans artifacts for forbidden patterns
2. `scripts/verify-task036.ps1` — includes boundary verification
3. `scripts/run-task036-live-school-launch.cjs` — validates boundary rules
