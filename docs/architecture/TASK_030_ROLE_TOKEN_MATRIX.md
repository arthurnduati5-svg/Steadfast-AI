# Task 030 — Role Token Matrix

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Role Token Matrix defines synthetic role identities and their associated permissions for the Controlled Staging Rehearsal Runtime. Each role is assigned a synthetic token in the format `task030_synthetic_token_*`. The matrix is used to gate access during journey rehearsals and console operations rehearsals.

## Role Definitions

### synthetic_admin

| Property | Value |
|----------|-------|
| Role ID | `synthetic_admin` |
| Display Name | `"Synthetic Administrator"` |
| Token Format | `task030_synthetic_token_admin_<uuid_fragment>` |
| Example Token | `task030_synthetic_token_admin_a1b2c3d4` |
| School Fixture ID | `task030_safe_admin_001` |

### synthetic_operator

| Property | Value |
|----------|-------|
| Role ID | `synthetic_operator` |
| Display Name | `"Synthetic Operator"` |
| Token Format | `task030_synthetic_token_operator_<uuid_fragment>` |
| Example Token | `task030_synthetic_token_operator_e5f6g7h8` |
| School Fixture ID | `task030_safe_operator_001` |

### synthetic_teacher

| Property | Value |
|----------|-------|
| Role ID | `synthetic_teacher` |
| Display Name | `"Synthetic Teacher"` |
| Token Format | `task030_synthetic_token_teacher_<uuid_fragment>` |
| Example Token | `task030_synthetic_token_teacher_i9j0k1l2` |
| School Fixture ID | `task030_safe_teacher_101` through `_103` |

### synthetic_learner

| Property | Value |
|----------|-------|
| Role ID | `synthetic_learner` |
| Display Name | `"Synthetic Learner"` |
| Token Format | `task030_synthetic_token_learner_<uuid_fragment>` |
| Example Token | `task030_synthetic_token_learner_m3n4o5p6` |
| School Fixture ID | `task030_safe_learner_201` through `_212` |

### unknown_role

| Property | Value |
|----------|-------|
| Role ID | `unknown_role` |
| Display Name | `"Unknown Role"` |
| Token Format | `task030_synthetic_token_unknown_<uuid_fragment>` |
| Example Token | `task030_synthetic_token_unknown_q7r8s9t0` |
| School Fixture ID | `task030_safe_unknown_001` |

## Token Format

```
task030_synthetic_token_<role>_<uuid_fragment>
```

Where:
- `task030_synthetic_token_` is the fixed prefix
- `<role>` is one of: `admin`, `operator`, `teacher`, `learner`, `unknown`
- `<uuid_fragment>` is a short UUID-like hex string (8 characters minimum)

## Permission Matrix

| Permission | admin | operator | teacher | learner | unknown |
|------------|-------|----------|---------|---------|---------|
| View operations dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| View stage summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| View health summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| View monitoring timeline | ✅ | ✅ | ❌ | ❌ | ❌ |
| View oversight queue | ✅ | ✅ | ✅* | ❌ | ❌ |
| View own expansion status | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pause expansion | ✅ | ✅ | ❌ | ❌ | ❌ |
| Resume expansion | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enable kill switch | ✅ | ✅ | ❌ | ❌ | ❌ |
| Disable kill switch | ✅ | ✅ | ❌ | ❌ | ❌ |
| Execute rollback | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate completion review | ✅ | ✅ | ❌ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| View other students' data | ❌ | ❌ | ❌ | ❌ | ❌ |
| View teacher/admin notes | ❌ | ❌ | ❌ | ❌ | ❌ |
| View private learner memory | ❌ | ❌ | ❌ | ❌ | ❌ |
| View raw chat | ❌ | ❌ | ❌ | ❌ | ❌ |
| Access console controls | ✅ | ✅ | ❌ | ❌ | ❌ |

*Note: Teacher can view oversight items **assigned to them** only.

## Permission Verification

Each permission check during rehearsal:
1. Extracts role from the synthetic token.
2. Looks up the role in the permission matrix.
3. Returns `allow: true/false` with reason.
4. Logs the check as an evidence event.

## Integration Points

The matrix integrates with:
- **Synthetic school fixture**: Uses fixture identities for role assignment.
- **Journey rehearsal services**: Gates each journey step against the matrix.
- **Operations console rehearsal**: Validates that console components respect the matrix.
- **Evidence ledger**: Records permission check outcomes.