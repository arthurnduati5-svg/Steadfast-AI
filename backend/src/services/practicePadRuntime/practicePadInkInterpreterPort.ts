// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-08: provider-neutral work
// interpretation port.
//
// ONE port for handwriting, drawing and image work. PP-08 ships the
// seam DISABLED: provider/model unavailable → explicit unavailable
// result with zero live model calls. No OpenAI. No OCR API. No
// external vision service. Later model activation plugs in here.
// Deterministic recognizers may be reused behind this seam only when
// they already exist and need no live model — none is bundled here.
// ─────────────────────────────────────────────────────────────

import type { PracticeWorkBlock } from './practicePadDocumentContracts';

export interface InterpretPracticeWorkRequest {
  block: PracticeWorkBlock;
}

export interface InterpretPracticeWorkResult {
  available: false;
  reason: 'interpretation_model_not_activated_PP08';
  liveModelCalls: 0;
}

const RESULT: InterpretPracticeWorkResult = {
  available: false,
  reason: 'interpretation_model_not_activated_PP08',
  liveModelCalls: 0,
};

export const practicePadInkInterpreterPort = {
  isAvailable(): false {
    return false;
  },
  async interpretPracticeWork(_request: InterpretPracticeWorkRequest): Promise<InterpretPracticeWorkResult> {
    // PP-08: no provider activation. Never call a model from here.
    return { ...RESULT };
  },
  liveCallCount(): 0 {
    return 0;
  },
};
