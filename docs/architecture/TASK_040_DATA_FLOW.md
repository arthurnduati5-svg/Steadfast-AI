# Task 040 Data Flow

## Overview
All Task 040 data flows are read-only metadata operations. No production database is read or written.

## Flow Diagram (text)

```
Client Request
  → Route handler (task040BackendFreezeRoutes)
    → School auth middleware
    → requireVerifiedSchoolContext
      → Service method
        → Repository (in-memory store)
        ← Response DTO
      ← Service result
    ← HTTP response
```

## Key Flows

### 1. Freeze Manifest Flow
`POST /freeze-manifest` → `FreezeManifestService.collect()` → aggregates all inventories → stores in repository → returns compiled manifest

### 2. Freeze Decision Flow
`POST /freeze-decision` → `FreezeDecisionService.evaluate()` → checks all gates → returns pass/fail with detailed reasons

### 3. Safety Scan Flow
`GET /safety-scans/:scanName` → `SafetyScanService.runScan()` → scans source files for forbidden patterns → returns results

### 4. Inventory Flows
Each inventory service (task inventory, surface inventory, contract inventory, etc.) collects metadata from source files and returns structured inventories.

### 5. Change Control Flow
`POST /change-control/register` → `ChangeControlPolicyService.registerChange()` → logs change request → `POST /change-control/approve/:id` → approves with reason

## Data Ownership
- All data is ephemeral (in-memory store)
- No data written to Prisma/PostgreSQL
- Reports generated to disk (reports/ and docs/ops/task-040/)
