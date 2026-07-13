# Task 036: Launch Approval

## Identity

- **Task:** 036
- **Gate:** Launch Approval Gate
- **Type:** Backend-only approval gate

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Require multi-role launch approval before a single school can go live. The approval gate ensures that all required stakeholders have acknowledged the launch.

## Required Approvals

| Role | Approval Check |
|------|---------------|
| Admin | Admin launch approval present |
| Privacy Officer | Privacy review passed |
| Deen Governance Officer | Deen review passed |
| Safeguarding Lead | Safeguarding review passed |
| Operations Lead | Operations readiness confirmed |
| Teacher Lead | Teacher readiness confirmed |
| Rollback Owner | Rollback owner assigned |
| Kill-Switch Owner | Kill-switch owner assigned |

## Approval Verification

Approvals are verified by checking the Task 036 launch approval record. The gate validates:
1. All required approvals are present
2. No approval is expired
3. No approval is revoked
4. Approval record is internally consistent

## Failure Behavior

If any required approval is missing:
- Launch is blocked
- Missing approval is reported in `blockingIssues`
- `launchApprovalPassed` is set to `false`

## Verification

Launch approval is validated by:
1. `scripts/run-task036-live-school-launch.cjs` — checks all approvals
2. `scripts/verify-task036.ps1` — includes approval verification step
