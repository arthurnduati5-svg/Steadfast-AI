# Task 027 — Governance Decision Engine

## Engine Identity

**Task 027 is controlled pilot expansion governance.** The governance decision engine is the final component in the governance pipeline. It consumes the complete expansion evidence pack and produces the definitive governance decision: whether `safeToStartTask028` may be set to `true`.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

The decision engine decides — it does not execute.

## Possible Decisions

| Decision | Meaning | `safeToStartTask028` |
|---|---|---|
| **APPROVED** | All gates pass. Expansion is authorized. | `true` |
| **APPROVED_WITH_CONDITIONS** | All gates pass, but specific conditions must be met before or during Task 028 execution. | `true` (conditions recorded) |
| **BLOCKED** | One or more gates have blocking failures. Expansion is not authorized. | `false` |
| **BLOCKED_PERMANENTLY** | One or more gates have failures that cannot be remediated within current constraints. Expansion is permanently blocked. | `false` |
| **DEFERRED** | Evidence is insufficient to make a decision. More information or time is required. | `false` |

## `safeToStartTask028` Conditions

The decision engine sets `safeToStartTask028 = true` **only** when ALL of the following are true:

1. Every governance gate returned PASS or CONDITIONAL_PASS (not BLOCKED or BLOCKED_PERMANENTLY).
2. The expansion evidence pack is COMPLETE and verified (no PII, no executable content, format valid).
3. The overall risk score from the risk assessment is ≤ 40 (MODERATE or below).
4. No gate returned BLOCKED or BLOCKED_PERMANENTLY.
5. No unresolved safeguarding concerns exist.
6. Operations health review confirms system stability and documented rollback readiness.
7. Teacher and admin reviews include at least one APPROVED from the lead teacher and school administrator.

If any of these conditions are not met, `safeToStartTask028` must remain `false`.

## Blocking Conditions and Handling

When the decision is BLOCKED, the engine produces:

- The specific gate(s) that caused the block.
- The blocking details from each gate.
- Recommended remediation actions.
- Whether the block is re-evaluable (gates can be re-run after remediation) or permanent.

For BLOCKED_PERMANENTLY, the engine records the reason and archives the decision. No re-evaluation is possible without a new governance cycle.

For DEFERRED, the engine specifies what additional evidence is required and what gates would need to be re-run.

## Decision Record

```yaml
governance_decision:
  decision: "APPROVED" | "APPROVED_WITH_CONDITIONS" | "BLOCKED" | "BLOCKED_PERMANENTLY" | "DEFERRED"
  safeToStartTask028: true | false
  conditions: null | [list of conditions]
  blocking_gates: null | [list of blocking gates with details]
  remediation: null | [list of recommended remediations]
  evidence_pack_reference: "<evidence_pack_id>"
  timestamp: "<ISO-8601>"
  decision_version: "1.0.0"
```

## Preservation

The decision engine preserves all boundaries. It does not modify verified school identity, content governance, privacy and safeguarding boundaries, or Socratic tutor behavior. It evaluates readiness within these boundaries and either authorizes Task 028 to operate within them or blocks expansion.
