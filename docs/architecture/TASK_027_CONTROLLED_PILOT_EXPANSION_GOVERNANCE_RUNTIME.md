# Task 027 — Controlled Pilot Expansion Governance Runtime

## Governance Identity

**Task 027 is controlled pilot expansion governance.** This document defines the governance runtime — the operational kernel that coordinates all gates, reviews, evidence collection, and decision-making for evaluating whether a controlled pilot expansion may proceed.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

Task 027 is a governance-only phase. Its sole purpose is to evaluate readiness and produce a governance decision. Any action beyond evaluation is explicitly out of scope.

## Purpose

The governance runtime exists to:

- Coordinate execution of all defined governance gates in the correct sequence.
- Collect and validate evidence from each gate before allowing progression to the next.
- Produce structured outputs (evidence packs, risk scores, review artifacts) that feed the decision engine.
- Enforce boundary rules so that no expansion-adjacent action leaks into this phase.
- Set `safeToStartTask028 = true` **only** after every governance gate has passed without exception.

## Key Components

| Component | Role |
|---|---|
| Gate Sequencer | Orders and triggers each governance gate |
| Evidence Collector | Gathers structured evidence from gate outputs |
| Decision Engine | Consumes all evidence and produces a final decision |
| Boundary Enforcer | Runtime check preventing execution of out-of-scope actions |
| State Recorder | Persists governance pipeline state and decisions |

## Data Flow

1. Task 026 execution evidence enters the runtime as the first dependency gate.
2. Each subsequent gate (learning quality, cohort proposal, risk, teacher/admin review, parent/learner feedback, safeguarding/Deen/privacy, Socratic/academic integrity, operations health/rollback) runs sequentially.
3. Each gate produces a structured output — pass, fail, or conditional pass with required remediations.
4. All gate outputs aggregate into the expansion evidence pack.
5. The decision engine evaluates the complete evidence pack and produces a final governance decision.
6. If all gates pass, `safeToStartTask028` is set to `true`. If any gate blocks, the decision engine returns a blocked decision with remediation guidance.

## Boundary Rules

The runtime must enforce at runtime that:

- No live AI calls are made.
- No real student or parent communications are sent.
- No real school connector integrations are written or invoked.
- No cohort activation or invitation logic is executed.
- No deployment scripts or commands are run.
- No production data is touched.
- Verified school identity from earlier phases is preserved but never acted upon.
- Content governance boundaries from previous phases are respected.
- Privacy and safeguarding boundaries are strictly maintained.
- Socratic tutor behavior definitions remain unchanged.

## Output

The runtime produces a single governance decision record. If that record contains `safeToStartTask028: true`, Task 027's purpose is fulfilled and execution handoff to Task 028 is authorized. If `false`, remediation steps are attached and no handoff occurs.
