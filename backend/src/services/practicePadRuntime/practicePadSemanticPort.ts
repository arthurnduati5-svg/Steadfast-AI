// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0: provider-neutral semantic port
//
// Seam for future semantic interpretation of learner reasoning,
// misconception, first meaningful divergence, and diagram/prose work.
// In P0 the port is present but DISABLED: it returns "unavailable" and
// makes ZERO live model calls (no OpenAI, no other provider).
// Deterministic/model-independent intelligence should be reused behind
// this seam only when it does not require a live model.
// ─────────────────────────────────────────────────────────────

export interface SemanticAnalysisRequest {
  workText: string;
  selectedStep?: string | null;
  subject?: string | null;
  topic?: string | null;
  heuristicHint?: string | null;
}

export interface SemanticAnalysisResult {
  available: false;
  reason: 'semantic_model_not_activated_P0';
  liveModelCalls: 0;
}

const RESULT: SemanticAnalysisResult = {
  available: false,
  reason: 'semantic_model_not_activated_P0',
  liveModelCalls: 0,
};

export const practicePadSemanticPort = {
  isAvailable(): false {
    return false;
  },
  async analyzeSemantics(_request: SemanticAnalysisRequest): Promise<SemanticAnalysisResult> {
    // P0: no provider activation. Never call a model from here.
    return { ...RESULT };
  },
  liveCallCount(): 0 {
    return 0;
  },
};
