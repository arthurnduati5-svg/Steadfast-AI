# Steadfast AI — Rollback and Kill Switch Drill Guide

## Purpose

Practice emergency response procedures in a safe staging environment without affecting live students.

## Kill Switch Drill Steps

### Enable Kill Switch

1. Ensure `TASK030_STAGING_REHEARSAL=1` and `TASK030_NO_LIVE_STUDENTS=1`.
2. Open the operations console.
3. Click **Enable Kill Switch** in the Control panel.
4. Confirm the action in the dialog.
5. **Verify**: Student own-status endpoint returns access blocked.
6. **Verify**: Operations dashboard shows kill switch enabled.

### Disable Kill Switch

1. Ensure the gate condition for disable is valid.
2. Click **Disable Kill Switch** in the Control panel.
3. Confirm the action after recheck.
4. **Verify**: Student own-status endpoint allows access if intended.
5. **Verify**: Operations dashboard shows kill switch disabled.

### Failure Scenarios

- If enable fails: Check Task 029 proof and execution run ID.
- If disable fails without recheck: Do not force. Review the gate condition.
- If students remain blocked after disable: Check execution run status.

## Rollback Drill Steps

### Execute Rollback

1. Ensure `TASK030_STAGING_REHEARSAL=1` and `TASK030_NO_LIVE_STUDENTS=1`.
2. Open the Rollback panel.
3. Enter a rollback reason (required).
4. Click **Execute Rollback**.
5. Confirm the action.
6. **Verify**: Expanded access is blocked.
7. **Verify**: Audit records are preserved.
8. **Verify**: Learning evidence was not destructively deleted.

### Post-Rollback Verification

1. Check the operations dashboard shows rolled back status.
2. Check student own-status endpoint shows expanded access unavailable.
3. Check the oversight queue for any post-rollback items.
4. Confirm no live production data was modified.

### Failure Scenarios

- If rollback fails: Check execution run ID and permissions.
- If rollback succeeds but access remains: Check stage-level activation status.
- If audit records are missing: Notify the admin team.

## Incident Response Protocol

1. **Identify**: Note the exact error message and reason codes.
2. **Contain**: Execute kill switch or rollback as appropriate.
3. **Verify**: Confirm student access is blocked.
4. **Report**: Document the incident with safe summary only.
5. **Review**: Do not delete evidence. Preserve audit trail.
6. **Resolve**: Only resume or disable kill switch after root cause is addressed.
