# Task 034 — No School-Wide / No Backend Freeze Boundary

## Purpose

This document defines the explicit boundary that Task 034 does not cross into school-wide launch or backend freeze territory. These are explicitly deferred to Task 035 and Task 040.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## Boundary: No School-Wide Launch (Deferred to Task 035)

Task 034 explicitly does NOT:
- Implement school-wide launch logic
- Create school-wide activation gates
- Implement full-school access controls
- Create school-wide monitoring dashboards
- Implement school-wide notification systems
- Create school-wide deployment pipelines
- Enable all schools or all learners
- Remove rollout caps or limits

Task 035 will handle school-wide launch readiness when approved.

## Boundary: No 100% Rollout

Task 034 explicitly does NOT:
- Allow 100% rollout configuration
- Remove rollout percentage caps
- Enable full-traffic deployment
- Permit unlimited cohort expansion

## Boundary: No Backend Freeze (Deferred to Task 040)

Task 034 explicitly does NOT:
- Implement backend freeze logic
- Create freeze state machines
- Block new deployments or changes
- Implement freeze-related gates
- Create freeze monitoring or alerts

Task 040 will handle final backend logic freeze when approved.

## Boundary: No Frontend UI

Task 034 explicitly does NOT:
- Create React components
- Modify CSS or styling
- Create frontend routes
- Implement client-side rendering
- Create frontend API hooks

## Forbidden Artifacts

The following patterns are forbidden in Task 034 code and artifacts:
- References to `schoolWideLaunch`, `fullSchoolActivation`, `allSchools`
- References to `rolloutPercent100`, `unlimitedCohort`, `removeCap`
- References to `backendFreeze`, `deploymentLock`, `freezeEnabled`
- References to `frontendRoutes`, `ReactComponent`, `UIPage`
- References to `Task035`, `Task040` implementation details

## Scan Enforcement

The verification pipeline scans for all forbidden patterns:
1. File content scan for school-wide/100% rollout/freeze keywords
2. Frontend UI pattern scan
3. Task035/040 reference scan
4. Cap bypass pattern scan

## Verification

The boundary is verified by:
1. Automated scan scripts in the verification pipeline
2. Privacy scan for forbidden patterns
3. No-false-pass scan ensuring boundary is respected
