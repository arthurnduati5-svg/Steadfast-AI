# Task 027 — Expansion Risk Assessment Gate

## Gate Identity

**Task 027 is controlled pilot expansion governance.** The expansion risk assessment gate evaluates the risks associated with proceeding to expanded pilot operations. It produces a structured risk score that feeds the governance decision engine.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

This gate assesses risk — it does not implement mitigations or execute any risk treatment actions.

## Dimensions Evaluated

| Risk Dimension | Description | Evaluation Method |
|---|---|---|
| Technical Risk | Likelihood of system instability, AI misbehavior, or scaling failures under expanded load | Review of current system performance metrics, load testing evidence from Task 026 |
| Pedagogical Risk | Risk of degraded learning quality under expanded cohort | Comparison of learning quality review outputs against expansion targets |
| Safeguarding Risk | Risk of safeguarding incidents increasing with cohort size | Review of current incident rates, safeguarding capacity, reporting processes |
| Privacy Risk | Risk of data protection breaches under expanded data volume | Review of data flow diagrams, access controls, anonymization processes |
| Operational Risk | Risk of insufficient support, monitoring, or incident response capacity | Review of operations staffing, runbooks, escalation paths |
| Reputational Risk | Risk of negative outcomes affecting school or platform reputation | Qualitative assessment based on other risk dimensions |
| Financial Risk | Risk of cost overruns or resource shortfalls | Review of resource estimates in expansion proposal |

## Thresholds

| Risk Level | Score Range | Meaning |
|---|---|---|
| LOW | 0-20 | Acceptable risk, no mitigations required |
| MODERATE | 21-40 | Acceptable with standard mitigations |
| HIGH | 41-60 | Requires specific mitigations before expansion |
| CRITICAL | 61-80 | Expansion blocked unless risks are reduced |
| EXTREME | 81-100 | Expansion blocked permanently at this time |

## Blocking Conditions

The gate blocks expansion (status: `BLOCKED`) if:

- Any single dimension scores CRITICAL or EXTREME.
- Three or more dimensions score HIGH or above.
- Technical risk or safeguarding risk scores HIGH or above.
- Overall risk score exceeds 50.

The gate may return `CONDITIONAL_PASS` if overall risk is MODERATE and specific HIGH dimensions have identified, documented mitigation plans.

## Output Format

```yaml
gate: expansion_risk_assessment
status: PASS | CONDITIONAL_PASS | BLOCKED
overall_score: 0-100
dimension_scores:
  technical: { score: 0-100, level: "LOW"|"MODERATE"|"HIGH"|"CRITICAL"|"EXTREME" }
  pedagogical: { score: 0-100, level: "..." }
  safeguarding: { score: 0-100, level: "..." }
  privacy: { score: 0-100, level: "..." }
  operational: { score: 0-100, level: "..." }
  reputational: { score: 0-100, level: "..." }
  financial: { score: 0-100, level: "..." }
required_mitigations: null | [list of required mitigations before expansion]
```

## Preservation

This gate operates entirely within existing boundaries. It preserves verified school identity, content governance, privacy and safeguarding boundaries, and Socratic tutor behavior.
