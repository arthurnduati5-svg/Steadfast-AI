# Task 036: Launch Environment Gate

## Identity

- **Task:** 036
- **Gate:** Launch Environment Gate
- **Type:** Backend-only environment validation gate

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Validate that the runtime environment is correctly configured for a controlled single-school live launch and that all safety flags are properly set.

## Required Environment Flags

| Flag | Required Value | Purpose |
|------|---------------|---------|
| `TASK036_LIVE_SCHOOL_LAUNCH` | `"1"` | Master enable for Task 036 launch runtime |
| `TASK036_REQUIRE_TASK035_PROOF` | `"1"` | Require Task 035 proof before launch |
| `TASK036_SINGLE_SCHOOL_ONLY` | `"1"` | Restrict to single approved school |
| `TASK036_NO_PUBLIC_LAUNCH` | `"1"` | Block public launch |
| `TASK036_NO_MULTI_SCHOOL` | `"1"` | Block multi-school rollout |
| `TASK036_NO_BACKEND_FREEZE` | `"1"` | Ensure backend is not frozen |
| `TASK036_PRIVACY_SAFE_EVIDENCE` | `"1"` | Ensure privacy-safe evidence mode |
| `TASK036_REQUIRE_APPROVAL` | `"1"` | Require launch approval gate |
| `TASK036_REQUIRE_LAUNCH_WINDOW` | `"1"` | Require launch window control |
| `TASK036_MONITORING_ENABLED` | `"1"` | Enable runtime monitoring |
| `TASK036_HEALTH_CHECKS_ENABLED` | `"1"` | Enable health checks |
| `TASK036_KILL_SWITCH_ENABLED` | `"1"` | Enable kill switch |
| `TASK036_ROLLBACK_ENABLED` | `"1"` | Enable rollback readiness |

## Blocking Checks

The gate also blocks if:
- `OPEN_REGISTRATION_ENABLED` is `"true"`
- `PUBLIC_SIGNUP_ENABLED` is `"true"`
- `ENABLE_ALL_SCHOOLS` or `ALL_SCHOOLS_ENABLED` is `"true"`

## Verification

The environment gate is verified in:
1. `scripts/run-task036-live-school-launch.cjs` — validates all env flags
2. `scripts/verify-task036.ps1` — includes dedicated environment gate step
