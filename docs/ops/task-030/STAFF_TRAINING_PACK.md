# Steadfast AI — Controlled Expansion Staff Training Pack

## What Is Controlled Expansion?

Controlled expansion is the staged activation of the Steadfast AI Socratic tutor for additional classes, subjects, or year groups within your school. It is not public registration. It is not open access. It is a governed, supervised rollout that only activates approved cohorts.

## Key Principles

- **School-governed**: Only approved staff can initiate or modify expansion.
- **Privacy-safe**: No raw student chat, private learner memory, or sensitive data is exposed in the operations console.
- **Socratic integrity**: The tutor never gives final answers, enables homework shortcuts, or replaces teacher guidance.
- **Deen-safe**: No fatwa-engine behavior. Sensitive religious questions follow a safe referral path.
- **Rollback-ready**: Every expansion can be paused, kill-switched, or rolled back without data loss.

## What Staff Should Check Before Rehearsal

1. Confirm `TASK030_STAGING_REHEARSAL=1` and `TASK030_NO_LIVE_STUDENTS=1` are set.
2. Confirm no production database URL is active.
3. Confirm no live students are used in the rehearsal.
4. Confirm synthetic fixture identifiers use `*_task030_safe` suffix.
5. Verify Task 029 proof is present and valid.

## How Admin/Operator Reads the Console

The operations console displays:
- **Proof status card**: Shows whether Task 028 and Task 029 proofs are loaded.
- **Stage progress**: Shows aggregate counts only. No raw student identities.
- **Health snapshot**: Shows aggregate operational signals. No private data.
- **Monitoring timeline**: Shows safe event summaries.
- **Oversight queue**: Shows safe oversight items with severity.
- **Control panel**: Pause, resume, kill switch, and rollback buttons. All backend-gated.
- **Completion review panel**: Shows honest safeToStartTask030 decision.

## How Teacher Reads Assigned Oversight

Teachers can only view assigned oversight items. They cannot:
- View the operations dashboard
- Trigger pause/resume/kill-switch/rollback
- View student private data
- View raw reports
- View other classes' oversight items

## What Students May See

Students can only view their own expansion status:
- Whether expanded access is available
- A safe unavailable message if not in the cohort
- No other students' data
- No operations console
- No oversight items
- No health internals

## How to Pause Expansion

1. Open the operations console.
2. Navigate to the Control panel.
3. Click **Pause Expansion**.
4. Confirm in the dialog.
5. Verify the execution status shows "paused".

## How to Use Kill Switch

1. Open the operations console.
2. Navigate to the Control panel.
3. Click **Enable Kill Switch**.
4. Confirm.
5. Verify all student access is blocked.
6. To disable, you must pass a recheck gate.

## How Rollback Works

1. Open the operations console.
2. Navigate to the Rollback panel.
3. Provide a rollback reason.
4. Confirm.
5. Expanded access is blocked.
6. Audit evidence is preserved.
7. Learning evidence is not destructively deleted.

## What Not to Do

- Do not use real student names in rehearsal.
- Do not copy private learner memory.
- Do not share answer keys or teacher-only content.
- Do not enable all students at once.
- Do not bypass school authentication.
- Do not run in NODE_ENV=production without explicit staging override.
- Do not set LIVE_ROLLOUT_ENABLED=true during rehearsal.

## Data That Must Never Be Copied

- Raw student chat
- Private learner memory
- Teacher-only notes
- Safeguarding raw details
- Deen-sensitive private text
- AI prompts
- Provider responses
- API tokens/secrets
- Database URLs
- Answer keys
- Protected rubrics

## When to Escalate

Escalate to admin review if:
- A control action fails unexpectedly.
- Data exposure is suspected.
- A student reports seeing another student's data.
- An oversight item requires rollback.

Escalate to privacy review if:
- Raw student data appears in logs.
- Private memory is visible in reports.

Escalate to Deen review if:
- A Deen-sensitive question cannot be safely referred.
- Sectarian claims appear in tutor output.

Escalate to safeguarding review if:
- A safeguarding concern is detected.

## How to Report a Blocker

1. Record the exact error message and reason codes.
2. Note the execution run ID and actor role.
3. Check the verification logs under `logs/task-030/`.
4. Report to the admin team with the safe error envelope details.
5. Do not share raw error objects or stack traces.
