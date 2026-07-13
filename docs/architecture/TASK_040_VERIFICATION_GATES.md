# Task 040 Verification Gates

## Gate 1: TypeScript Typecheck
```
npx tsc -p backend/tsconfig.json --noEmit --incremental false
```
Must pass with zero errors.

## Gate 2: Backend Build
```
npm --prefix backend run build
```
Must compile successfully.

## Gate 3: Prisma Validate
```
npx prisma validate --schema=backend/prisma/schema.prisma
```
Must report schema valid.

## Gate 4: Prisma Generate
```
npx prisma generate --schema=backend/prisma/schema.prisma
```
Must generate client successfully.

## Gate 5: Focused Task 040 Tests
All test files matching `*-040*` and `task040*` must pass:
- Minimum 45 test files
- Minimum 400 assertions
- Zero failures

## Gate 6: Full Backend Suite
All backend tests must pass.

## Gate 7: Safety Scans
All 8 safety scans must pass:
- privacy, production_mutation, live_ai_connector, live_notification, frontend_ui, future_task, false_pass

## Gate 8: JSON Report Validation
```
node scripts/task040-json-validate.cjs
```
Must pass with no errors.

## Gate 9: Verbose Check
```
node scripts/task040-privacy-scan.cjs
```
Must find zero violations.

## Gate 10: Freeze Decision
`FreezeDecisionService.evaluate()` must return `ACCEPTED_READY_YES` with zero remaining blockers.
