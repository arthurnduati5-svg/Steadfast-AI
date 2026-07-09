import { describe, it, expect } from 'vitest';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';
import { validateTask031EmbedHandoffSmokeSync } from '../services/task031EmbedHandoffSmokeService';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { validateTask031TeacherOversightSmokeSync } from '../services/task031TeacherOversightSmokeService';
import { validateTask031AdminOperatorMonitoringSmokeSync } from '../services/task031AdminOperatorMonitoringSmokeService';

describe('Task 031 - POST smoke checks contract', () => {
  it('should pass copilot bootstrap smoke', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.schoolAuthRequired).toBe(true);
    expect(result.rawPrivateMemoryExposed).toBe(false);
    expect(result.answerKeysExposed).toBe(false);
  });

  it('should pass embed handoff smoke', () => {
    const result = validateTask031EmbedHandoffSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.requiresSchoolContext).toBe(true);
    expect(result.requiresAuthenticatedActor).toBe(true);
    expect(result.rawTokenExposed).toBe(false);
  });

  it('should pass student preflight smoke', () => {
    const result = validateTask031StudentPreflightSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.schoolIdentityVerified).toBe(true);
    expect(result.stagingScopeChecked).toBe(true);
    expect(result.curriculumScopeChecked).toBe(true);
  });

  it('should pass teacher oversight smoke', () => {
    const result = validateTask031TeacherOversightSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.teacherStagingContextValid).toBe(true);
    expect(result.adminControlsDenied).toBe(true);
    expect(result.fullCanaryReportDenied).toBe(true);
  });

  it('should pass admin operator monitoring smoke', () => {
    const result = validateTask031AdminOperatorMonitoringSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.stagingSmokeSummaryVisible).toBe(true);
    expect(result.observabilityBaselineVisible).toBe(true);
    expect(result.canaryReadinessVisible).toBe(true);
  });
});
