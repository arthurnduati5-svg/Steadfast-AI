## Steadfast AI

Steadfast AI is a full-stack learning copilot with:

- a Next.js frontend in `frontend/`
- an Express backend in `backend/`
- AI orchestration and tutoring flows in `AI/`

### Project shape

- `frontend/`: dashboard, copilot UI, voice UI, API bridge routes
- `backend/`: auth, chat persistence, voice endpoints, quotas, safety workflows
- `AI/`: tutoring flows, research orchestration, safety rules, formatting and tool handlers
- `docs/`: operational notes, QA runners, production-readiness checklist

### Local commands

```bash
npm run dev
npm run genkit:dev
npm run typecheck
npm run typecheck:backend
npm run test:run
npm run build:all
```

### Production baseline

- Set `ALLOWED_ORIGINS` in production. The backend now fails closed for cross-origin traffic when this is missing.
- Keep `SKIP_STRICT_BUILD` for local emergency bypass only. It no longer disables type/lint enforcement in production builds.
- Use `build:all` before release so frontend and backend artifacts are both validated.
- Do not commit generated output from `frontend/.next/` or `backend/dist/`.
- Store temporary voice uploads outside the repo. The backend now defaults to the OS temp directory and supports `STEADFAST_UPLOAD_DIR`.

### Known architectural gaps

- `AI/ai/flows/emotional-ai-copilot.ts` is a very large orchestration file and should be split by concern.
- `backend/src/routes/ai.ts` is handling too many responsibilities and should be decomposed into route modules plus service layers.
- Logging is still inconsistent across the repo; critical paths should move from raw `console.*` to structured logging.
- Test coverage exists, but the runner needs an explicit repo-level config to avoid generated artifacts and make CI stable.

### Recommended next pass

1. Break the AI and backend monoliths into smaller modules with clear boundaries.
2. Add CI gates for `typecheck`, `typecheck:backend`, `test:run`, and `build:all`.
3. Standardize env validation and startup checks for required secrets and third-party services.
4. Replace remaining debug logging in user-facing paths with structured logs and redaction.
