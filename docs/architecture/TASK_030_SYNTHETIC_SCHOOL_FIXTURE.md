# Task 030 — Synthetic School Fixture

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Synthetic School Fixture provides a completely artificial school data set for the Controlled Staging Rehearsal Runtime. No real student data, no real school data, no production data is used. All identifiers are clearly marked as synthetic.

## Fixture Structure

### School

| Field | Value |
|-------|-------|
| `id` | `task030_safe_school_001` |
| `name` | `"Staging Rehearsal School (Synthetic)"` |
| `domain` | `staging-rehearsal.synth.steadfastai.internal` |
| `timezone` | `"UTC"` |

### Cohort

| Field | Value |
|-------|-------|
| `id` | `task030_safe_cohort_001` |
| `schoolId` | `task030_safe_school_001` |
| `name` | `"Synthetic Rehearsal Cohort Alpha"` |
| `stage` | `"stage_1"` |

### Admin

| Field | Value |
|-------|-------|
| `id` | `task030_safe_admin_001` |
| `name` | `"Synthetic Admin"` |
| `email` | `admin-synth@staging-rehearsal.synth.steadfastai.internal` |
| `role` | `synthetic_admin` |

### Operator

| Field | Value |
|-------|-------|
| `id` | `task030_safe_operator_001` |
| `name` | `"Synthetic Operator"` |
| `email` | `operator-synth@staging-rehearsal.synth.steadfastai.internal` |
| `role` | `synthetic_operator` |

### Teachers (3)

| Field | Value for Teacher 1 | Value for Teacher 2 | Value for Teacher 3 |
|-------|--------------------|--------------------|--------------------|
| `id` | `task030_safe_teacher_101` | `task030_safe_teacher_102` | `task030_safe_teacher_103` |
| `name` | `"Synthetic Teacher A"` | `"Synthetic Teacher B"` | `"Synthetic Teacher C"` |
| `email` | `teacher-a.synth@staging-rehearsal.synth.steadfastai.internal` | `teacher-b.synth@staging-rehearsal.synth.steadfastai.internal` | `teacher-c.synth@staging-rehearsal.synth.steadfastai.internal` |
| `role` | `synthetic_teacher` | `synthetic_teacher` | `synthetic_teacher` |

### Learners (12)

| Field | Value Pattern |
|-------|---------------|
| `id` | `task030_safe_learner_201` through `task030_safe_learner_212` |
| `name` | `"Synthetic Learner 01"` through `"Synthetic Learner 12"` |
| `email` | `learner-01.synth@staging-rehearsal.synth.steadfastai.internal` through `learner-12.synth@...` |
| `role` | `synthetic_learner` |

### Learner-Cohort Assignment

| Learner ID | Cohort |
|------------|--------|
| `task030_safe_learner_201` through `task030_safe_learner_212` | `task030_safe_cohort_001` |

### Teacher-Cohort Assignment

| Teacher ID | Cohort |
|------------|--------|
| `task030_safe_teacher_101` | `task030_safe_cohort_001` |
| `task030_safe_teacher_102` | `task030_safe_cohort_001` |
| `task030_safe_teacher_103` | `task030_safe_cohort_001` |

### Unknown Role (for denial testing)

| Field | Value |
|-------|-------|
| `id` | `task030_safe_unknown_001` |
| `name` | `"Synthetic Unknown Actor"` |
| `role` | `"unknown_role"` |

## Synthetic ID Prefix Rules

| Rule | Description |
|------|-------------|
| All IDs must start with `task030_safe_` | Guarantees no collision with real data |
| UUID fragments may follow | e.g., `task030_safe_learner_201_<short_uuid>` |
| No real identifiers | No real student IDs, emails, names, or any real-world data |
| Prefix check enforced | The gate checks that all fixture IDs contain the prefix |
| Logged IDs must be prefixed | Any ID written to logs or evidence must use the prefix |

## No Real Data Constraints

| Data Type | Must Not Contain | Enforcement |
|-----------|-----------------|-------------|
| Fixture IDs | Real student IDs, real cohort IDs, real school IDs | Prefix check |
| Names | Any real student, teacher, or school name | Synthetic names only |
| Emails | Any real email addresses | Synthetic domain only |
| Phone numbers | Any real phone numbers | No phone fields in fixture |
| Roster data | Any real class roster | Synthetic assignment only |
| Chat data | Any real student chat or conversation | No chat data in fixture |
| Learner memory | Any private learner memory | No memory data in fixture |
| AI prompts | Any real AI conversation | No AI data in fixture |

## Integration Points

The fixture integrates with:
- **Role token matrix service**: Uses fixture identities for token generation.
- **Journey rehearsal services**: Uses fixture identities for role-scoped journey execution.
- **No-live-student guard**: Validates fixture IDs contain `task030_safe_` prefix.
- **Evidence ledger**: Records fixture-related events with safe IDs only.