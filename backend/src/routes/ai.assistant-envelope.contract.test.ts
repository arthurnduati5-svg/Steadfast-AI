import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const AI_ROUTE_PATH = path.resolve(process.cwd(), 'backend/src/routes/ai.ts');

describe('ai route assistant envelope wiring contract', () => {
  const source = fs.readFileSync(AI_ROUTE_PATH, 'utf8');

  it('routes /chat through shared turn pipeline with chat envelope route', () => {
    expect(source).toMatch(/buildAssistantTurnPipeline\(\{\s*[\s\S]*route:\s*'chat'/);
  });

  it('routes /voice-chat through shared turn pipeline with voice route tag', () => {
    expect(source).toMatch(/buildAssistantTurnPipeline\(\{\s*[\s\S]*route:\s*'voice_chat'/);
  });

  it('records lightweight assistant envelope analytics for rollout tracking', () => {
    expect(source).toContain("eventType: 'assistant_envelope_emitted'");
    expect(source).toContain('recordAssistantEnvelopeAnalytics({');
  });
});
