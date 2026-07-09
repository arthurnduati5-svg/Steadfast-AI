# TASK 031 — Role Matrix

**This doc is backend-only and staging-only. Synthetic tokens only.**

The role matrix (`task031StagingRoleMatrixService.ts`) creates synthetic role tokens for:

- `synthetic_admin`
- `synthetic_operator`
- `synthetic_teacher`
- `synthetic_learner`
- `unknown_role`

Tokens are non-authenticating (`task031_synthetic_token_*`). No JWTs or real auth tokens are created.

Allowed real actor roles: `school_admin`, `system_admin`, `internal_operator`, `authorized_staging_operator`, `operations_reviewer`.
Denied real actor roles: `student`, `learner`, `teacher`, `parent`, `peer`, `unknown`, `anonymous`.