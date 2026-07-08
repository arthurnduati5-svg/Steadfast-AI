# Task 027 — Teacher and Admin Review Workflow Gate

## Gate Identity

**Task 027 is controlled pilot expansion governance.** The teacher and admin review workflow gate ensures that the human stakeholders responsible for the learning environment have reviewed and approved the expansion proposal before any governance decision is made.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

This gate coordinates human review — it does not bypass, automate, or simulate teacher or admin approval.

## Required Reviews

The following reviews must be completed. Each reviewer receives a governance-only expansion proposal (as defined in the cohort expansion proposal guard) and evaluates it within their domain:

1. **Lead Teacher Review** — The lead teacher of the existing pilot cohort reviews the proposal for pedagogical soundness, classroom impact, and student readiness for expanded cohort dynamics.
2. **School Administrator Review** — The school administrator reviews operational impact, resource availability, scheduling feasibility, and alignment with school policies.
3. **Platform Administrator Review** — The platform administrator reviews technical capacity, support readiness, and alignment with platform governance policies.
4. **Safeguarding Lead Review** — The designated safeguarding lead reviews the proposal for any safeguarding concerns arising from expansion.

## Approval Conditions

Each reviewer submits one of:

| Decision | Meaning |
|---|---|
| **APPROVED** | Expansion proposal accepted without conditions |
| **APPROVED_WITH_CONDITIONS** | Expansion proposal accepted subject to specified conditions being met |
| **NOT_APPROVED** | Expansion proposal rejected; reasons must be provided |
| **NEEDS_MORE_INFO** | Expansion proposal needs additional information before a decision can be made |

The gate passes if **all** required reviewers submit APPROVED or APPROVED_WITH_CONDITIONS. Any NOT_APPROVED blocks the gate. Any NEEDS_MORE_INFO stalls the gate until information is provided.

## Workflow

1. Governance runtime assembles the expansion proposal package.
2. Package is distributed to all required reviewers.
3. Reviewers have a defined period (configurable, typically 5-10 business days) to respond.
4. Responses are collected and recorded.
5. If all approve (with or without conditions), the gate passes.
6. If any reject, the gate blocks and remediation guidance is captured.
7. If any request more information, the runtime pauses and notifies the governance coordinator.

## Output Format

```yaml
gate: teacher_admin_review_workflow
status: PASS | CONDITIONAL_PASS | BLOCKED | AWAITING_INFO
reviewer_decisions:
  lead_teacher: { decision: "APPROVED"|"APPROVED_WITH_CONDITIONS"|"NOT_APPROVED"|"NEEDS_MORE_INFO", conditions: null|[...], notes: "..." }
  school_administrator: { ... }
  platform_administrator: { ... }
  safeguarding_lead: { ... }
conditions: null | [aggregated conditions from all APPROVED_WITH_CONDITIONS decisions]
```

## Preservation

This gate does not modify verified school identity, content governance, privacy and safeguarding boundaries, or Socratic tutor behavior. Human reviewers evaluate within these established boundaries.
