# Task 027 — Cohort Expansion Proposal Guard

## Gate Identity

**Task 027 is controlled pilot expansion governance.** The cohort expansion proposal guard evaluates the proposed expansion plan to ensure it is a governance document only — not an execution plan that crosses into Task 028 territory.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

This guard ensures the proposal stays within governance scope and does not contain executable expansion logic.

## What a Proposal Contains

A valid cohort expansion proposal in Task 027 is a **governance document** containing:

- **Target cohort definition** — Description of the proposed expanded cohort: size, demographic parameters, school profile, selection criteria. This is a specification, not an invitation list.
- **Expansion timeline** — Proposed schedule for onboarding, orientation, and pilot start. This is a plan, not a scheduled execution.
- **Resource requirements** — Estimated additional resources needed (AI capacity, review bandwidth, support staff).
- **Risk mitigations** — How risks identified in the risk assessment will be addressed.
- **Success criteria** — Measurable outcomes that would define a successful expansion.
- **Rollback plan** — Conditions and procedures for reversing the expansion if needed.

## What a Proposal Must Not Contain

The proposal guard rejects any document containing:

- Actual student names, email addresses, or contact information.
- Live invitation templates or communication drafts intended for sending.
- School connector configuration or API credentials.
- Deployment scripts, configuration files, or infrastructure changes.
- AI model configuration changes or prompt modifications.
- Any executable code, scripts, or automation logic.
- Real cohort activation commands or flags.
- Production data access requests or credentials.

## Governance-Only Scope

The proposal is a **plan for a plan**. It describes what Task 028 would need to build and execute. It does not itself build, execute, or activate anything. The guard enforces this distinction by scanning the proposal for executable content and rejecting any submission that crosses the line.

## Blocking Conditions

The guard blocks if:

- The proposal contains executable code or scripts.
- The proposal references real student or parent identities.
- The proposal includes communication content intended for sending.
- The proposal assumes Task 027 will execute any part of expansion.
- The proposal references live school connectors or AI model changes.

## Output Format

```yaml
gate: cohort_expansion_proposal_guard
status: PASS | BLOCKED
proposal_scope: "governance-only"
executable_content_detected: false | [list of detections]
blocking_details: null | "description of prohibited content found"
```

## Preservation

The guard preserves verified school identity (by not using it), content governance (by not modifying it), privacy and safeguarding boundaries (by rejecting any proposal that crosses them), and Socratic tutor behavior (by not proposing changes to it).
