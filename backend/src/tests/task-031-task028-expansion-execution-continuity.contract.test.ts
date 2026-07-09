import { describe, it, expect } from 'vitest';
import { validateTask031EmbedHandoffSmokeSync } from '../services/task031EmbedHandoffSmokeService';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';

describe('Task 031 - Task 028 Expansion Execution Continuity Contract', () => {
  it('should require school context for embed handoff during expansion', () => {
    const result = validateTask031EmbedHandoffSmokeSync();
    expect(result.requiresSchoolContext).toBe(true);
  });

  it('should require authenticated actor for embed handoff during expansion', () => {
    const result = validateTask031EmbedHandoffSmokeSync();
    expect(result.requiresAuthenticatedActor).toBe(true);
  });

  it('should require school auth for copilot bootstrap during expansion', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.schoolAuthRequired).toBe(true);
  });

  it('should deny unknown actors during copilot bootstrap for expansion', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.unknownDenied).toBe(true);
  });
});
