# Task 036: Launch Window Control

## Identity

- **Task:** 036
- **Gate:** Launch Window Control
- **Type:** Backend-only scheduling and window gate

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Ensure the live school launch occurs within an approved time window with proper scheduling constraints. The launch window prevents uncontrolled activation outside designated hours.

## Window Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `TASK036_LAUNCH_WINDOW_START` | ISO datetime window start | Set per launch |
| `TASK036_LAUNCH_WINDOW_END` | ISO datetime window end | Set per launch |
| `TASK036_LAUNCH_WINDOW_TIMEZONE` | IANA timezone string | `"UTC"` |

## Window Validation

The window control validates:
1. Current time is within `[TASK036_LAUNCH_WINDOW_START, TASK036_LAUNCH_WINDOW_END]`
2. Window has not expired
3. Window is not in the past
4. Window duration does not exceed maximum (default 8 hours)
5. Launch can proceed only during active window

## Out-of-Window Behavior

If the launch is attempted outside the approved window:
- Launch is blocked
- A log entry is recorded
- The verification/report records `launchWindowPassed: false`

## Verification

The launch window control is validated in:
1. `scripts/run-task036-live-school-launch.cjs` — checks window boundaries
2. `scripts/verify-task036.ps1` — includes window verification step
