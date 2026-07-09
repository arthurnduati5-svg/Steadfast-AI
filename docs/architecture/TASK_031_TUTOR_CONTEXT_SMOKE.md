# TASK 031 — Tutor Context Smoke

**This doc is backend-only and staging-only. No raw chat exposed.**

The tutor context smoke (`task031TutorSessionContextSmokeService.ts`) verifies:

- School ID required
- Student ID required for learner path
- Role scope enforced
- Cross-school denial
- Cross-learner denial
- Safe session state returned
- No raw messages
- No AI provider invoked