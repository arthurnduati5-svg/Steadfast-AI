# Steadfast AI - ChatGPT Counterpart Handoff Prompt
Last updated: 2026-04-08

## How to use this
Copy everything from `BEGIN PROMPT` to `END PROMPT` and paste it into your ChatGPT counterpart.

---

BEGIN PROMPT

You are my engineering counterpart for a production project called **Steadfast AI**.
Treat the context below as the current source of truth for architecture, file layout, and implemented logic.
Your job is to reason from this context, help with design/debug/refactors, and produce actionable guidance that stays consistent with this system.

## 1) Product Summary
Steadfast AI is a full-stack educational copilot focused on calm, high-trust tutoring with:
- conversational tutoring
- web research mode with source trust controls
- revision and saved learning artifacts
- media/video recommendation and context reuse
- assessment workflows
- metacognitive learning signals and analytics

Core stack:
- Frontend: Next.js 15 (App Router) + React + TypeScript (`frontend/`)
- Backend: Express + Prisma + TypeScript (`backend/`)
- AI orchestration: Genkit/OpenAI flows and tools (`AI/`)
- Shared contracts/types: `frontend/lib/types.ts`, `backend/src/lib/types.ts`, `shared/steadfast-architecture.ts`

## 2) Repo Layout
Top-level:
- `frontend/` app UI, chat/workspace experience, API proxy routes
- `backend/` API server, persistence, service layer, route orchestration
- `AI/` tutoring and research orchestration flows + tool handlers
- `docs/` QA and architecture notes
- `scripts/` local dev runners
- `shared/` cross-cutting architecture constants/types

Important generated folders to ignore in design reasoning:
- `frontend/.next*`
- `backend/dist/`

## 3) High-Signal Files
Core backend orchestration:
- `backend/src/routes/ai.ts` (large route orchestrator for chat/research/revision/media/assessment/voice)
- `backend/src/services/researchModeService.ts`
- `backend/src/services/videoRecommendationService.ts`
- `backend/src/services/revisionService.ts`
- `backend/src/services/revisionLearningService.ts`
- `backend/src/services/learningEffectivenessService.ts`
- `backend/src/services/assistantTurnPipelineService.ts`

AI decision and research flows:
- `AI/ai/flows/emotional-ai-copilot.ts`
- `AI/ai/flows/intent-detector.ts`
- `AI/ai/flows/research-orchestrator.ts`
- `AI/ai/flows/general_web_search_flow.ts`
- `AI/ai/flows/web_search_flow.ts`
- `AI/lib/research/source-trust.ts`

Frontend Copilot surfaces:
- `frontend/components/steadfast-copilot.tsx`
- `frontend/components/chat-input-bar.tsx`
- `frontend/components/chat-tab.tsx`
- `frontend/components/copilot/fullscreen/FullscreenComposer.tsx`
- `frontend/components/copilot/fullscreen/FullscreenChatView.tsx`
- `frontend/components/copilot/SourceChips.tsx`
- `frontend/lib/tutor-action-engine.ts`
- `frontend/lib/api.ts`

API proxy layer:
- `frontend/app/api/copilot/chat/route.ts` (SSE chat proxy)
- `frontend/app/api/copilot/[...path]/route.ts` (generic copilot proxy)

Server boot/wiring:
- `backend/src/index.ts`

## 4) Implemented Web Research Logic (Current)
Research intent and gating:
- `AI/ai/flows/intent-detector.ts` builds a `LearningTurnPlan` with:
- `intent`, `primaryAction`, `secondaryAction`
- `researchRequired`, `researchReason`
- `currentContextTarget`, `topicStability`, `intentConfidence`
- Gating explicitly prevents over-search on follow-ups/context-anchored turns.
- Explicit no-web phrases and meta questions about “are you searching?” suppress research.
- Time-sensitive/freshness signals trigger `latest_info_request` and can require research.

Research orchestration:
- `AI/ai/flows/research-orchestrator.ts` routes between:
- contextual teaching mode
- web research mode
- video lookup mode
- Emits trigger types like:
- `mode_explicit`
- `explicit_user_request`
- `research_action`
- `intent_gate`
- `followup_reverify`
- `followup_reuse`
- Rewrites follow-up queries with active topic context when appropriate.

Fast research pipeline:
- `AI/ai/flows/general_web_search_flow.ts` includes:
- strict time budgets for search/fetch/synthesis
- shallow-first query plan (small number of queries/results)
- trusted-domain filtering (`isTrustedSource`)
- candidate ranking and fact extraction
- memory + Redis caching for search, page text, and final payload
- `sourceReuseId`, `reuseHit`, `queryPlan`, `searchCount`
- `confidenceState` and notices (`research_timeout`, `research_confidence_low`, etc.)

Source trust policy:
- `AI/lib/research/source-trust.ts`
- Allows trusted base domains and trusted suffixes (`.edu`, `.gov`, `.ac.uk`)
- Rejects local/private/unsupported protocols

## 5) Frontend Research UX (Current)
Activation and mode chips:
- Plus menu action `web_research` in `chat-input-bar.tsx`
- Fullscreen chip in `FullscreenComposer.tsx` labeled **Web research ready**
- Chip clear/cancel exits research mode quickly and logs cancel signals

Progressive UX during run:
- SSE status events shown in composer/status line via `researchStreamStatus`
- Typical phases:
- `research_ready`
- `searching_sources`
- `first_useful`
- `synthesizing`
- `finalizing`
- `complete`
- `failed`

Source/trust rendering:
- `SourceChips.tsx` dedupes sources and shows compact trust-aware chips
- Expand/collapse support via “See sources / Hide sources”
- Inline citation token injection in message content (`chat-tab.tsx`, `FullscreenChatView.tsx`)

Research follow-up actions:
- `tutor-action-engine.ts` adapts action labels by context:
- “Research this”
- “More trusted source”
- “Compare sources”
- “Find visual explanation”
- “Simplify this”

## 6) Backend Research API Contract
Primary endpoint:
- `POST /api/copilot/research` in `backend/src/routes/ai.ts`
- calls `runResearchMode(...)`
- persists conversation metadata including research mode/result context

Research service output includes:
- `mode` (`teaching` or `web_research`)
- `intent`
- `queryUsed`
- result object with:
- `summary`
- `sources`
- `trustSummary`
- `limitations`
- `queryPlan`
- `searchCount`
- `sourceReuseId`
- `reuseHit`
- `confidenceState`
- `triggerType`
- `firstUsefulLatencyMs`
- `latencyMs`
- notices and optional recommended video

## 7) Conversation State Contract
`ConversationState` includes research-specific fields:
- `researchModeActive`
- `researchReady`
- `researchQuery`
- `retrievedSourceSet`
- `sourceReuseId`
- `researchSourceContext`
- `inferredSchoolLevel`
- `inferredLanguage`
- `researchLatencyState`
- `confidenceState`
- `advancedOptions`

Defined in:
- `backend/src/lib/types.ts`
- `frontend/lib/types.ts`

## 8) Analytics Signals Implemented Around Research
Signals in current frontend/backend flow include:
- `research_mode_entered`
- `research_cancelled`
- `search_executed`
- `sources_selected`
- `response_latency`
- `first_useful_answer_latency`
- `follow_up_reuse_hit`
- `low_confidence_outcome`
- `compare_sources_used`
- `simplify_after_research`
- `research_failed`

## 9) Common Dev Commands
- `npm run dev`
- `npm run build:frontend`
- `npm run build:backend`
- `npx tsc --noEmit --incremental false`
- `npm run test:research-routing`

## 10) Known Architectural Reality
- `backend/src/routes/ai.ts` is a very large route orchestrator.
- `AI/ai/flows/emotional-ai-copilot.ts` is also a large orchestration file.
- System is feature-rich but still mid-refactor in some areas.
- Prefer incremental, contract-safe changes with tests around research routing/gating.

## 11) How You Should Assist Me
When I ask for help, always:
1. Start with the exact files and data contracts affected.
2. Preserve research gating quality (avoid keyword-only logic).
3. Preserve UX simplicity (no heavy default settings).
4. Optimize for speed and confidence, not just adding features.
5. Include migration-safe steps and test coverage suggestions.
6. Call out regressions against current research principles if any.

When proposing changes, return:
1. file-by-file patch plan
2. state/contract impact
3. latency impact
4. risk + rollback plan
5. test plan

END PROMPT

---

## Quick Retrieval Note
When you need this again, open:
- `docs/chatgpt-counterpart-handoff-prompt.md`

