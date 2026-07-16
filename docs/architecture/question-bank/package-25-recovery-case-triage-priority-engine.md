# Package 25: Recovery Case Triage Priority Engine

## Purpose

When many student recovery cases appear on the readiness board (Package 24) at the same time, teachers and administrators cannot review them all simultaneously. The triage priority engine determines which cases should be reviewed first using deterministic scoring. It generates an ordered queue with allocation drafts, escalation drafts, and review window drafts — all advisory only. No assignments are made, no live actions are dispatched, and no calendar events are created.

## Pipeline Position

Package 25 sits after Package 24 (Controlled Recovery Execution Readiness Board) in the recovery chain.

```
Packages 17-23 -> Package 24 (Readiness Board) -> Package 25 (Triage Priority Engine) -> Package 26+ (Live Execution)
```

Package 25 reads recovery case identifiers and metadata from Package 24 board cards by reference. It does not duplicate or mutate Package 24 records.

## How Package 25 Consumes Package 24

Package 25 references Package 24 records by their source identifiers (board snapshot ID, card ID, student reference, plan reference). It creates its own triage-specific records that link back to Package 24 via foreign key references. Package 25 never imports, duplicates, or extends any Package 24 model.

## Triage Readiness Concept

A recovery case is "triage-ready" when it appears on a Package 24 readiness board card that is not blocked, suppressed, or void. Triage readiness is a read-only determination: the engine inspects card status and board state at the moment of queue generation.

## Deterministic Scoring Design

All priority scoring is deterministic. No AI, no ML, no LLMs, no probabilistic models, no learned weights, no black-box ranking. Every score is computed from explicit rules with fixed weights and transparent arithmetic. Every score is reproducible given the same inputs.

## Priority Factors

| # | Factor | Weight | Description |
|---|--------|--------|-------------|
| 1 | Days Since Recovery Plan Creation | 20 | Older cases receive higher priority. Capped at 30 days. |
| 2 | Days Since Last Intervention | 18 | Cases with no recent intervention receive higher priority. Capped at 60 days. |
| 3 | Academic Severity (Risk Level) | 16 | Derived from risk signals on the board card. Higher risk = higher score. |
| 4 | Days Until Academic Deadline | 14 | Cases closer to deadline receive higher priority. Inverted: fewer days = higher score. |
| 5 | Intervention Count | 12 | Cases with fewer historical interventions receive higher priority (underserved students first). |
| 6 | Stakeholder Escalation Flag | 10 | Cases flagged by administrator or parent escalation receive a fixed boost. |
| 7 | Board Card Flags Count | 6 | Cases with more active flags (risk signals, blockers, governance notes) receive higher priority. |
| 8 | Student Cohort Size | 4 | Cases from larger affected cohorts receive slightly higher priority (broader impact). |

Score formula: `score = min(100, sum of all weighted factor scores)`

## Hard-Block Behavior

Certain conditions prevent a case from being triaged at all, regardless of score. Hard-blocked cases are excluded from queue generation and are not allocated, escalated, or windowed. The hard-block conditions are:

- Board card is in blocked status
- Board card is in suppressed status
- Board card is in void status
- Board snapshot is stale (needs refresh)
- Student record is marked inactive for the school
- Recovery plan is not in an active state
- Case is already assigned to an active recovery execution (by reference check)
- Case has been triaged within the last 24 hours (anti-flood)

Hard-blocked cases remain visible in the readiness board. The triage engine does not hide or modify them — it simply skips them during queue generation.

## Fairness Boundary

The following factors are explicitly prohibited from influencing triage priority:

- Student name, gender, ethnicity, religion, nationality, socioeconomic status
- Student disability status (unless directly related to academic severity via board risk signals)
- Teacher name or identity
- School name or identity (comparative ranking between schools)
- Historical score trends that are not recovery-related
- Behavioral or disciplinary records not directly linked to the recovery plan
- Parental income, occupation, or education level
- Language proficiency (except where the recovery plan itself is language-based)
- Any factor outside the eight allowed operational factors

## Capacity Planning (Advisory Only)

The engine generates a capacity advisory based on:

- Teacher caseload limits (configured per school)
- Admin caseload limits (configured per school)
- Current active allocations (by reference to existing assignment records)
- Estimated review effort per case (derived from risk level and card flags)

The capacity advisory is a read-only estimate. It does not limit queue generation. It does not prevent allocation drafts from being created. It does not enforce any hard caps.

## Queue Generation Process

1. Collect all triage-ready cases from Package 24 readiness board cards for the school
2. Apply hard-block filters to exclude non-triageable cases
3. Compute deterministic priority score for each remaining case
4. Apply tie-breaking rules to resolve equal scores
5. Apply duplicate suppression to remove case duplicates
6. Sort cases by score descending
7. Generate allocation drafts, escalation drafts, and review window drafts from the ordered queue
8. Attach capacity advisory as metadata
9. Write triage run record with audit trail

## Tie-Breaking Rules

When two or more cases receive the same priority score, ties are broken using the following cascade:

1. **First tie-break:** Academic severity (higher risk level wins)
2. **Second tie-break:** Days since recovery plan creation (older wins)
3. **Third tie-break:** Days since last intervention (longer gap wins)
4. **Fourth tie-break:** Student reference ID (lexicographic, deterministic)

This four-level cascade ensures every case receives a unique position in the queue.

## Duplicate Suppression

If the same student-recovery-plan combination appears on multiple board cards (same student, same plan, different lane), the engine deduplicates to a single triage entry. The entry with the highest score is retained; all others are logged as suppressed duplicates.

## Allocation Drafts (Not Assignments)

Allocation drafts are advisory suggestions for which teacher or admin should review each case. They are:

- Based on current caseload estimates (advisory capacity)
- Based on role-scoped queue visibility (teacher vs admin)
- Based on historical allocation patterns (by reference only)
- Never committed as actual assignments
- Never sent as notifications
- Never enforced as workload distribution

## Escalation Drafts (Not Dispatch)

Escalation drafts identify cases that exceed the teacher's scope and may require administrator attention. They are:

- Based on risk level thresholds
- Based on stakeholder escalation flags
- Advisory only — no dispatch, no notification, no alert
- Never sent to administrators
- Never created as actual escalation records in external systems

## Review Window Drafts (Not Calendar Events)

Review window drafts suggest timeframes for when cases could be reviewed. They are:

- Based on academic deadlines (from board card metadata)
- Based on estimated review effort
- Advisory only — no calendar events are created
- No invites, no reminders, no scheduling
- Never synced with external calendar systems

## Safe Explanations

Every triage run produces a human-readable explanation string for each case's priority score. Explanations include:

- Final score and priority band
- Contribution of each factor to the final score
- Any tie-break applied
- Duplicate suppression status
- Hard-block reason (if blocked)

Explanations are safe, deterministic, and contain no hidden reasoning, no AI narratives, and no subjective language.

## Audit and Idempotency

All triage operations create audit events:

- Queue generation creates a triage run audit record
- Each scored case creates a triage entry audit record
- Allocation drafts create allocation draft audit records
- Escalation drafts create escalation draft audit records
- Review window drafts create window draft audit records

Idempotency keys prevent duplicate triage runs. A triage run with the same idempotency key within the same school and same 24-hour window is treated as a no-op (existing results returned).

## Privacy and School Isolation

All triage data is scoped to a single school at a time. The engine never cross-contaminates cases between schools. Student references are stored as school-relative identifiers. No student PII is used in scoring.

## No-Live-Action Boundary

Package 25 does not:

- Assign recovery cases to teachers or admins
- Dispatch notifications or alerts
- Create calendar events
- Execute recovery actions
- Authorize live execution
- Close recovery lifecycles
- Mutate scores or mastery
- Send emails or messages
- Publish to portals
- Sync with external scheduling systems
- Generate AI narratives or LLM output
- Enforce capacity limits (advisory only)

## Deferred Future Work

- Live assignment from allocation draft
- Live escalation from escalation draft
- Calendar integration for review windows
- Machine learning scoring (requires future governance approval)
- Cross-school triage views
- Automated capacity enforcement
- Student/parent-facing triage explanations
- Historical triage effectiveness analysis
