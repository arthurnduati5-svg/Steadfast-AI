# Task 040: Change Control Procedure

## Purpose
Prevent uncontrolled modification of frozen backend logic. Any change to a frozen element must go through this procedure.

## When Change Control Is Required

A change control request MUST be filed when modifying:
- Any file in `backend/src/contracts/` that is part of the freeze inventory
- Any file in `backend/src/lib/` that is part of the freeze inventory
- Any file in `backend/src/services/` that is part of the freeze inventory
- Any file in `backend/src/repositories/` that is part of the freeze inventory
- Any file in `backend/src/routes/` that is part of the freeze inventory
- The freeze manifest itself
- The freeze decision logic

## Procedure

### 1. File Change Request
`POST /api/task040/backend-freeze/change-control/register`
```json
{
  "description": "What changed and why",
  "changedFiles": ["backend/src/services/example.ts"],
  "initiatedBy": "operator-name"
}
```

### 2. Approval
`POST /api/task040/backend-freeze/change-control/approve/:id`
```json
{
  "approvedBy": "approver-name",
  "reason": "Approval rationale"
}
```

### 3. Rejection (if applicable)
`POST /api/task040/backend-freeze/change-control/reject/:id`
```json
{
  "rejectedBy": "rejector-name",
  "reason": "Rejection rationale"
}
```

### 4. Update Freeze Manifest
After approval, regenerate the freeze manifest to reflect the change.

## Exempt Changes
- Bug fixes that do not change the contract surface
- Typo fixes in comments/docs
- Test additions (new tests, not modifying existing assertions)
- Script updates
- Report regeneration

## Audit Trail
All change control requests are permanently stored in the in-memory freeze repository. Export the change control ledger before any system restart if persistence is needed.
