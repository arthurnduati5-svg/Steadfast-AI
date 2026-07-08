# Task 027 — Operations Runbook

## Runbook Identity

**Task 027 is controlled pilot expansion governance.** This runbook provides detailed operational procedures for executing the governance pipeline, interpreting results, handling blocked decisions, managing emergencies, and performing handoff to Task 028.

## Core Principle

**Task 027 does not execute expansion.** It does not build Task 028. It does not activate expanded cohorts. It does not invite new students. It does not send real communication. It does not deploy. It does not call live AI. It does not write live school connectors.

All procedures in this runbook are governance procedures only. No step in this runbook should result in any expansion execution action.

## How to Run the Governance Pipeline

### Prerequisites

- Task 026 execution is complete with verified artifacts.
- Governance runtime environment is available (non-production, isolated from live systems).
- All required reviewers (teachers, administrators, safeguarding lead) are identified and have confirmed availability.
- Evidence from the current pilot cohort is available in anonymized, aggregated form.

### Step-by-Step Execution

1. **Initialize pipeline** — Start the governance runtime. Confirm runtime version, environment isolation, and boundary enforcement rules are active.
2. **Execute Gate 1: Task 026 Evidence Dependency** — Point the runtime to Task 026 execution artifacts. Verify gate passes before proceeding.
3. **Execute Gate 2: Learning Quality Review** — Feed anonymized learning metrics into the gate. Review output for pass/fail.
4. **Execute Gate 3: Cohort Expansion Proposal Guard** — Submit the draft expansion proposal. Verify the guard scan detects no executable or prohibited content.
5. **Execute Gate 4: Expansion Risk Assessment** — Feed proposal and learning quality outputs into the risk model. Review dimension scores.
6. **Execute Gate 5: Teacher/Admin Review** — Distribute proposal to reviewers. Wait for all responses. Collect decisions.
7. **Execute Gate 6: Parent/Learner Feedback Readiness** — Confirm feedback has been collected and summarized safely. Review anonymized summary.
8. **Execute Gate 7: Safeguarding/Deen/Privacy Review** — Run the combined review. Check all three domains pass.
9. **Execute Gate 8: Socratic/Academic Integrity Review** — Verify methodology fidelity and academic integrity readiness.
10. **Execute Gate 9: Operations Health and Rollback Review** — Check system health metrics and rollback plan completeness.
11. **Assemble evidence pack** — The runtime aggregates all gate outputs. Run completeness, PII, and executable content scans.
12. **Run decision engine** — Feed the evidence pack to the decision engine. Record the decision.

## Interpreting Results

### Pipeline Output Statuses

| Status | Meaning | Action |
|---|---|---|
| All gates PASS | Pipeline clean | Proceed to decision engine |
| Any gate BLOCKED | Pipeline halted | Identify blocking gate, remediate, re-run gate |
| Any gate CONDITIONAL_PASS | Pass with conditions | Record conditions, continue pipeline, enforce conditions in decision |
| Evidence pack INCOMPLETE | Missing gate outputs | Investigate runtime, re-run missing gates |
| Decision engine returns BLOCKED | Expansion not authorized | Review blocking gates, remediate, re-run affected gates |
| Decision engine returns APPROVED | Expansion authorized | Record decision, proceed to handoff |

### Reading Gate Outputs

Each gate produces a structured YAML record. Key fields to examine:

- `status` — Overall gate result.
- `blocking_details` — If BLOCKED, this field explains why.
- `required_remediation` or `conditions` — What must be addressed.
- Individual criterion results — To understand partial failures.

## Handling Blocked Decisions

### Single Gate Blocked

1. Review `blocking_details` in the gate output.
2. Determine if the block is re-evaluable (can be fixed and gate re-run) or permanent.
3. If re-evaluable: implement remediation, re-execute the gate, and continue the pipeline from that point.
4. If permanent: the governance cycle ends. Record BLOCKED_PERMANENTLY. Notify stakeholders.

### Multiple Gates Blocked

1. Triage by severity: safeguarding and privacy blocks take priority.
2. Address each block individually following single-gate procedure.
3. Re-run all affected gates in sequence (the runtime does not skip gates).
4. If any block is permanent, the entire cycle is BLOCKED_PERMANENTLY.

### Unblocking Workflow

1. Identify remediation actions from gate output.
2. Implement remediation outside the governance runtime (the runtime does not execute fixes).
3. Re-execute the specific gate(s) with updated evidence.
4. The runtime re-verifies the gate and produces a new output.
5. If all gates now pass, the evidence pack is re-assembled and the decision engine re-run.

## Emergency Procedures

### PII Detected in Evidence Pack

1. **Immediate halt** — The runtime automatically halts when PII is detected.
2. **Isolate** — The evidence pack is quarantined. Do not delete — preserve for investigation.
3. **Investigate** — Determine source of PII (which gate input introduced it).
4. **Remediate** — Fix the source process to ensure PII is stripped before ingestion.
5. **Restart** — Begin a new pipeline cycle with corrected inputs.

### Safeguarding Incident Raised During Pipeline

1. **Immediate block** — Any safeguarding signal during pipeline execution triggers an automatic BLOCKED status on the safeguarding gate.
2. **Escalate** — Notify the designated safeguarding lead immediately. This is outside the governance runtime.
3. **Resolve** — The safeguarding incident must be resolved through proper channels before the gate can be re-evaluated.
4. **Re-enter** — Once resolved, the safeguarding lead provides attestation. The gate is re-run with this attestation as evidence.

### Runtime Failure

If the governance runtime itself fails (crash, data corruption, unexpected behavior):

1. Check runtime logs for error details.
2. Restore runtime state from the last successful checkpoint (the runtime persists state after each gate).
3. Re-run from the last successfully completed gate.
4. If state cannot be restored, restart the full pipeline with fresh evidence.

## Handoff to Task 028

Handoff occurs **only** when the decision engine returns APPROVED or APPROVED_WITH_CONDITIONS and `safeToStartTask028 = true`.

### Handoff Package Contents

1. Governance decision record (the decision engine output).
2. Approved expansion proposal (governance scope).
3. Conditions or required remediations (if APPROVED_WITH_CONDITIONS).
4. Evidence pack reference (for audit trail).
5. Risk assessment summary.
6. Rollback plan (from operations health gate).

### What Handoff Does Not Include

The handoff package must not include any of the prohibited items listed in the evidence pack specification. It is a governance package, not an execution package.

### Handoff Procedure

1. Governance runtime marks the pipeline as COMPLETE.
2. Handoff package is assembled and stored in a secure, accessible location.
3. Task 028 governance coordinator is notified that `safeToStartTask028` is `true`.
4. Task 027 is archived and the governance runtime is shut down.
5. If the decision was APPROVED_WITH_CONDITIONS, those conditions are attached to the Task 028 charter as mandatory requirements.

### Handoff Declaration

```yaml
handoff:
  from_task: "027"
  to_task: "028"
  safeToStartTask028: true
  decision: "APPROVED" | "APPROVED_WITH_CONDITIONS"
  conditions: null | [conditions]
  handoff_package_ref: "<package_id>"
  timestamp: "<ISO-8601>"
```

## Preservation Reminder

Throughout all runbook procedures: preserve verified school identity, content governance, privacy and safeguarding boundaries, and Socratic tutor behavior. No procedure in this runbook should modify any of these.
