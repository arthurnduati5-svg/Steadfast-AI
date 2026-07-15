# Package 23: Controlled Recovery Lifecycle Execution Authorization Preview

## Purpose

Package 23 builds the **authorization airlock** — the final safety gate before any recovery lifecycle action transitions from preparation/simulation/closure-readiness toward live execution. It previews the authorization path, verifies required approvers, records risk attestations, captures vetoes, builds pre-live decision packets, and produces mock authorization receipts — **without executing anything live**.

## Position in Pipeline

Package 23 is the eighth specialized layer in the controlled recovery pipeline:

```
Package 17: Recovery Planning
Package 18: Progress Observation
Package 19: Outcome Decision
Package 20: Action Preparation
Package 21: Execution Simulation
Package 22: Lifecycle Closure Readiness
Package 23: Execution Authorization Preview (THIS PACKAGE)
```

## What Package 23 Is NOT

Package 23 is not:
- Live authorization
- Live closure execution
- Live recovery activation
- Live assignment
- Live notification dispatch
- Portal publishing
- Score mutation
- Mastery mutation
- Regrade execution
- AI narrative generation
- OCR processing
- PDF export
- External sync

## How Package 23 Consumes Package 22

Package 23 references Package 22 records by their IDs:
- `recoveryLifecycleClosureReadinessId`
- `recoveryPostSimulationHandoffPacketId`
- `recoveryFinalLifecycleSummaryId`
- `recoveryArchiveManifestId`

It does not duplicate Package 22 data. It only validates authorization readiness against the closure-readiness state.

## Authorization Readiness Lifecycle

```
draft → review_ready → authorization_preview_ready (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Authorization Request Draft Lifecycle

```
draft → review_ready → authorization_preview_ready (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Authorization Eligibility Lifecycle

```
draft → review_ready (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Authority Matrix Snapshot Lifecycle

```
draft → review_ready → approval_chain_ready (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Approval Chain Draft Lifecycle

```
draft → review_ready → approval_chain_ready (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Risk Attestation Lifecycle

```
draft → review_ready → risk_attested (terminal)
draft → vetoed (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Consent Boundary Check Lifecycle

```
draft → review_ready (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Veto Governance Lifecycle

```
draft → review_ready (terminal)
draft → suppressed (terminal)
draft → void (terminal)
```

## Preflight Checklist Lifecycle

```
draft → review_ready → authorization_preview_ready (terminal, refreshable)
draft → blocked (terminal)
draft → void (terminal)
```

## Authorization Dry-Run Lifecycle

```
draft → review_ready → mock_authorized (terminal)
draft → review_ready → mock_denied (terminal)
draft → void (terminal)
```

## Pre-Live Decision Packet Lifecycle

```
draft → review_ready → authorization_preview_ready (terminal)
draft → suppressed (terminal)
draft → blocked (terminal)
draft → void (terminal)
```

## Mock Authorization Receipt

```
draft (terminal, no mutation beyond void)
draft → void (terminal)
```

## Authorization Summary

Read model that aggregates state across all authorization preview records. Supports refresh and stale marking.

## Audit and Idempotency

- All mutating operations record audit events.
- All mutating operations are gated by idempotency keys.

## What Remains Deferred After Package 23

- Live authorization execution
- Live recovery closure
- Live recovery activation
- Live recovery completion
- Live assignment dispatch
- Live notification sending
- Portal publishing
- Score/mastery mutation
- Regrade execution
- AI narrative generation
- OCR processing
- PDF export
- External sync integration
- Student/parent-facing UI
- Teacher dashboard integration
- Admin governance console integration

## Status Values

Allowed: draft, review_ready, authorization_preview_ready, approval_chain_ready, risk_attested, vetoed, blocked, suppressed, void, stale, approved_for_future_use, mock_authorized, mock_denied

Forbidden: authorized_live, live_authorized, closed, closed_live, completed, completed_live, executed, live_executed, activated, live_activated, published, sent, assigned, synced, mutated
