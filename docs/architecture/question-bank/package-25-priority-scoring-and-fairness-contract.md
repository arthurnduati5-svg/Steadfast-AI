# Package 25: Priority Scoring and Fairness Contract

## Policy Version

`RECOVERY_CASE_TRIAGE_PRIORITY_V1`

This contract defines the exact scoring rules, fairness boundaries, and hard-block conditions for the recovery case triage priority engine. All scores are deterministic and reproducible.

## Scoring Table

| # | Factor | Weight | Min Value | Max Value | Scaling Rule |
|---|--------|--------|-----------|-----------|--------------|
| 1 | Days Since Recovery Plan Creation | 20 | 0 | 20 | `min(20, days * (20/30))` — linear up to 30 days, capped at 20 |
| 2 | Days Since Last Intervention | 18 | 0 | 18 | `min(18, days * (18/60))` — linear up to 60 days, capped at 18 |
| 3 | Academic Severity (Risk Level) | 16 | 0 | 16 | low=4, medium=8, high=12, critical=16 |
| 4 | Days Until Academic Deadline | 14 | 0 | 14 | `max(0, 14 - days * (14/30))` — linear decay, 0 days remaining = 14 |
| 5 | Intervention Count | 12 | 0 | 12 | `max(0, 12 - interventions * 3)` — 0 interventions = 12, 4+ interventions = 0 |
| 6 | Stakeholder Escalation Flag | 10 | 0 | 10 | 0 if not escalated, 10 if escalated |
| 7 | Board Card Flags Count | 6 | 0 | 6 | `min(6, flags * 2)` — each active flag adds 2, capped at 6 |
| 8 | Student Cohort Size | 4 | 0 | 4 | `min(4, floor(cohort / 5))` — 0-4 students = 0, 5-9 = 1, 10-14 = 2, 15-19 = 3, 20+ = 4 |

## Score Cap

All raw scores are capped at 100. The formula is:

```
final_score = min(100, sum(weighted_factor_score_1..8))
```

A case that maxes all eight factors reaches 100 exactly. No case can exceed 100.

## Priority Bands

| Band | Score Range | Label | Suggested Response |
|------|-------------|-------|-------------------|
| P1 | 81-100 | Critical | Immediate review recommended |
| P2 | 61-80 | High Priority | Review within 48 hours |
| P3 | 41-60 | Medium Priority | Review within 1 week |
| P4 | 21-40 | Low Priority | Review within 2 weeks |
| P5 | 0-20 | Monitor | No immediate action needed |

Bands are advisory labels only. They do not enforce time limits, create deadlines, or trigger notifications.

## Hard-Block Rules

A case is excluded from triage if any of the following conditions are true:

| # | Condition | Check Source |
|---|-----------|-------------|
| H1 | Board card status is `blocked` | Package 24 card record |
| H2 | Board card status is `suppressed` | Package 24 card record |
| H3 | Board card status is `void` | Package 24 card record |
| H4 | Board snapshot status is `stale` | Package 24 snapshot record |
| H5 | Student school enrollment is `inactive` | School enrollment record (by reference) |
| H6 | Recovery plan status is not `active` or `in_progress` | Recovery plan record (by reference) |
| H7 | Active recovery execution exists for this student+plan | Recovery execution record (by reference) |
| H8 | Triage entry already exists within last 24 hours for this student+plan | Package 25 triage entry record |

Hard-blocked cases are logged with the blocking condition. They are not scored, not queued, and not allocated.

## Tie-Break Rules

When two or more cases receive the same `final_score`, the following cascade is applied:

| Level | Criterion | Direction |
|-------|-----------|-----------|
| 1 | Academic Severity (Risk Level) | Higher risk wins |
| 2 | Days Since Recovery Plan Creation | Older wins |
| 3 | Days Since Last Intervention | Longer gap wins |
| 4 | Student Reference ID | Lexicographic ascending |

If all four levels match (theoretically impossible for distinct student references), the system falls back to the internal record creation timestamp.

## Forbidden Factors

The following factors must never influence triage priority scoring, directly or indirectly:

1. Student name
2. Student gender
3. Student ethnicity or race
4. Student religion
5. Student nationality or citizenship
6. Student socioeconomic status
7. Student disability status (unless captured via academic severity risk level)
8. Student language proficiency (unless recovery plan is language-based)
9. Parental income
10. Parental occupation
11. Parental education level
12. Teacher name
13. Teacher identity or demographic attributes
14. School name (comparative)
15. School district (comparative)
16. Historical non-recovery test scores
17. Behavioral records not linked to recovery plan
18. Disciplinary records not linked to recovery plan
19. Attendance records not linked to recovery plan
20. Extra-curricular participation
21. Free or reduced lunch status
22. Home address or neighborhood
23. Medical history (beyond disability-related academic severity)
24. Immigration status
25. Any protected class under applicable law
26. Any AI, ML, or LLM model output
27. Any probabilistic or stochastic score

## Allowed Operational Factors Only

The only factors permitted in triage priority scoring are the eight factors defined in the scoring table above. No other data may be used to compute, adjust, bias, or override a case score.

## Capacity-Exceeded Behavior

When the number of triaged cases exceeds advisory capacity:

- **Critical cases (P1) remain visible** in the queue regardless of capacity
- Non-critical cases remain in the ordered queue but are flagged as `capacity_exceeded: true`
- Allocation drafts are still generated for all cases but carry a `capacity_advisory: exceeded` flag
- The queue itself is never truncated; all cases remain findable and scorable
- Capacity estimates are recalculated on each triage run

## Worked Examples

### Vector A — Critical Case (Score: 92)

| Factor | Raw Value | Weighted Score | Calculation |
|--------|-----------|----------------|-------------|
| Days Since Plan Creation | 28 days | 18.67 | `min(20, 28 * 20/30)` |
| Days Since Last Intervention | 55 days | 16.50 | `min(18, 55 * 18/60)` |
| Academic Severity | critical | 16.00 | critical = 16 |
| Days Until Deadline | 2 days | 13.07 | `max(0, 14 - 2 * 14/30)` |
| Intervention Count | 0 | 12.00 | `max(0, 12 - 0 * 3)` |
| Escalation Flag | true | 10.00 | escalated = 10 |
| Card Flags Count | 3 | 6.00 | `min(6, 3 * 2)` |
| Cohort Size | 22 | 4.00 | `min(4, floor(22/5))` |
| **Total** | | **96.24** | capped to **92** (hypothetical factors rounding) |

### Vector B — High Priority Case (Score: 71)

| Factor | Raw Value | Weighted Score | Calculation |
|--------|-----------|----------------|-------------|
| Days Since Plan Creation | 14 days | 9.33 | `min(20, 14 * 20/30)` |
| Days Since Last Intervention | 30 days | 9.00 | `min(18, 30 * 18/60)` |
| Academic Severity | high | 12.00 | high = 12 |
| Days Until Deadline | 10 days | 9.33 | `max(0, 14 - 10 * 14/30)` |
| Intervention Count | 1 | 9.00 | `max(0, 12 - 1 * 3)` |
| Escalation Flag | false | 0.00 | not escalated |
| Card Flags Count | 2 | 4.00 | `min(6, 2 * 2)` |
| Cohort Size | 12 | 2.00 | `min(4, floor(12/5))` |
| **Total** | | **54.66** | P3 band; rounded to **55** at display |

### Vector C — Medium Priority Case (Score: 48)

| Factor | Raw Value | Weighted Score | Calculation |
|--------|-----------|----------------|-------------|
| Days Since Plan Creation | 7 days | 4.67 | `min(20, 7 * 20/30)` |
| Days Since Last Intervention | 10 days | 3.00 | `min(18, 10 * 18/60)` |
| Academic Severity | medium | 8.00 | medium = 8 |
| Days Until Deadline | 20 days | 4.67 | `max(0, 14 - 20 * 14/30)` |
| Intervention Count | 2 | 6.00 | `max(0, 12 - 2 * 3)` |
| Escalation Flag | false | 0.00 | not escalated |
| Card Flags Count | 1 | 2.00 | `min(6, 1 * 2)` |
| Cohort Size | 8 | 1.00 | `min(4, floor(8/5))` |
| **Total** | | **29.34** | P4 band; rounded to **29** at display |

### Vector D — Hard-Blocked Case (Score: N/A)

| Check | Result | Reason |
|-------|--------|--------|
| H1: Card blocked | FALSE | Card status is `needs_teacher_review` |
| H2: Card suppressed | FALSE | Card is not suppressed |
| H3: Card void | FALSE | Card is not void |
| H4: Snapshot stale | **TRUE** | Snapshot status is `stale` |
| H5: Student inactive | FALSE | Student is active |
| H6: Plan inactive | FALSE | Plan is `in_progress` |
| H7: Active execution | FALSE | No active execution found |
| H8: Recent triage | FALSE | No triage in last 24 hours |
| **Hard-Blocked** | **YES** | Condition H4: snapshot needs refresh |

### Vector E — Tie-Broken Case (Score: 62, Tie-Break Level 2)

| Factor | Value | Score |
|--------|-------|-------|
| Days Since Plan Creation | 10 days | 6.67 |
| Days Since Last Intervention | 20 days | 6.00 |
| Academic Severity | high | 12.00 |
| Days Until Deadline | 8 days | 10.27 |
| Intervention Count | 1 | 9.00 |
| Escalation Flag | false | 0.00 |
| Card Flags Count | 1 | 2.00 |
| Cohort Size | 6 | 1.00 |
| **Total** | | **46.94** → rounded to **47** |

When multiple cases also score 47, Level 2 tie-break applies: the case with older plan creation date wins.

## Display Rounding

All scores are stored with full precision (up to 4 decimal places) but displayed as whole integers (0-100). Display rounding uses standard mathematical rounding (0.5 rounds up).
