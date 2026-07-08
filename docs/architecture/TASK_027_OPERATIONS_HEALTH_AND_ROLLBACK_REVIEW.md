# Task 027 — Operations Health and Rollback Review Gate

## Gate Identity

**Task 027 is controlled pilot expansion governance.** The operations health and rollback review gate evaluates whether the operational infrastructure is healthy enough to support expansion and whether a credible rollback plan exists should expansion need to be reversed.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

This gate reviews operational readiness — it does not execute rollbacks, perform infrastructure changes, or deploy monitoring.

## Operations Health Review

Evaluates the current state of operations:

- **System uptime and stability** — Core learning platform has maintained ≥ 99.5% uptime during the current pilot. No critical incidents unresolved.
- **Incident response** — Incident response procedures are documented, tested, and staffed. Mean time to acknowledge (MTTA) and mean time to resolve (MTTR) are within acceptable thresholds.
- **Monitoring coverage** — All critical system components have monitoring in place. Alerting thresholds are defined and appropriate.
- **Support capacity** — Current support staffing is adequate for the existing cohort and has capacity buffer for expansion.
- **AI system health** — AI tutor availability and response quality metrics are within acceptable ranges. No degradation trends.
- **Data pipeline health** — Data collection, anonymization, and reporting pipelines are operational and complete.

## Rollback Readiness Review

Evaluates whether a credible rollback plan exists:

- **Rollback triggers documented** — Clear conditions that would trigger a rollback are defined (e.g., safeguarding incident, system instability, learning quality degradation).
- **Rollback procedure exists** — Step-by-step rollback procedure is documented, tested, and accessible to operations staff.
- **Rollback scope defined** — What is rolled back (cohort, features, communications) is clearly specified.
- **Data preservation** — Rollback procedure preserves essential data while removing or disabling expansion-related changes.
- **Communication plan** — Stakeholder communication plan for rollback scenario is documented.
- **Testing evidence** — Rollback procedure has been tested in a non-production environment or through a tabletop exercise.

## Blocking Conditions

The gate blocks if:

- Current uptime is below 99% in the last 30 days.
- Any critical incident remains unresolved.
- Monitoring coverage is incomplete for critical components.
- Rollback procedure is not documented.
- Rollback procedure has not been tested.
- Data preservation during rollback is not addressed.

## Output Format

```yaml
gate: operations_health_and_rollback_review
status: PASS | CONDITIONAL_PASS | BLOCKED
operations_health:
  uptime_acceptable: true | false
  incidents_resolved: true | false
  monitoring_complete: true | false
  support_capacity_adequate: true | false
  ai_system_healthy: true | false
  data_pipeline_operational: true | false
rollback_readiness:
  triggers_documented: true | false
  procedure_documented: true | false
  scope_defined: true | false
  data_preservation_addressed: true | false
  communication_planned: true | false
  testing_completed: true | false
blocking_details: null | "description"
```

## Preservation

This gate preserves verified school identity, content governance, privacy and safeguarding boundaries, and Socratic tutor behavior. The rollback plan exists to protect these if expansion were to proceed in Task 028 and then need reversal.
