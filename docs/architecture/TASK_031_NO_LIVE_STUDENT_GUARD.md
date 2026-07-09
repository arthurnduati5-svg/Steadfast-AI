# TASK 031 — No-Live-Student Guard

**This doc is backend-only and staging-only. No real student data is used.**

The no-live-student guard (`task031NoLiveStudentGuardService.ts`) blocks:

- Real learner identifiers
- Real emails
- Real phone numbers
- Parent contact data
- Production roster payloads
- Raw student chat
- Private learner memory

Allowed identifiers use `synthetic_*` or `task031_safe` prefixes.