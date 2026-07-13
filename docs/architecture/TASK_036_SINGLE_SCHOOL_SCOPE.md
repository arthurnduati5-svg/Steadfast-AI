# Task 036: Single School Scope

## Identity

- **Task:** 036
- **Gate:** Single School Scope Guard
- **Type:** Backend-only scope guard

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Enforce that Task 036 operates within a single approved school boundary. No cross-school access, no unknown school access, no public access, no multi-school rollout.

## Scope Guard Rules

| Check | Enforcement |
|-------|-------------|
| Approved school ID | Must match pre-approved school identifier |
| Approved tenant ID | Must match pre-approved tenant identifier |
| Cross-school access | Blocked |
| Unknown school access | Blocked |
| Tenant mismatch | Blocked |
| Public access | Blocked |
| Multi-school activation | Blocked |
| Open registration | Blocked |
| Public signup | Blocked |

## School Identifier

The approved school identifier is `school_task036_single_school_safe`. The approved tenant identifier is `tenant_task036_single_school_safe`. These are safe test identifiers that do not correspond to any real school or tenant.

## Verification

Single school scope is validated by:
1. `scripts/run-task036-live-school-launch.cjs` — enforces scope rules
2. `scripts/verify-task036.ps1` — includes scope verification step
