# TASK 031 — Copilot Bootstrap Smoke

**This doc is backend-only and staging-only. No AI providers called.**

The copilot bootstrap smoke (`task031CopilotBootstrapSmokeService.ts`) verifies:

- Verified school context required before tutor bootstrap
- Learner identity required before learner session bootstrap
- Approved source/curriculum placeholder required before educational claim
- No AI provider called
- No provider prompt created
- No hidden reasoning emitted
- Safe fallback when context missing
- Safe blocked state when school identity missing