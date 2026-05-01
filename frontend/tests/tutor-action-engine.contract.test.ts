import { describe, expect, it } from 'vitest';
import type { Message } from '@/lib/types';
import { resolveTutorSurfaceDecision } from '@/lib/tutor-action-engine';

function buildModelMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    role: 'model',
    content: 'Here is a guided answer.',
    metadata: {},
    ...overrides,
  };
}

describe('tutor action engine contract', () => {
  it('ignores any legacy Explain metadata and keeps the action strip compact', () => {
    const message = buildModelMessage({
      metadata: {
        presentation: {
          suggestedActions: ['hint', 'breakdown', 'explain', 'practice', 'save'] as any,
        },
      },
    });

    const decision = resolveTutorSurfaceDecision({
      message,
      allowTutorActions: true,
    });

    expect(decision.visibleActions.map((action) => action.id)).toEqual(['hint', 'breakdown', 'practice', 'save']);
    expect(decision.visibleActions.map((action) => action.label)).not.toContain('Explain');
    expect(decision.bestNextAction).toBe('hint');
  });

  it('promotes Use video first when the assistant already attached a contextual video', () => {
    const message = buildModelMessage({
      videoData: {
        id: 'abc123',
        videoId: 'abc123',
        title: 'Linear equations walkthrough',
      },
    });

    const decision = resolveTutorSurfaceDecision({
      message,
      allowTutorActions: true,
      allowContinueVideo: true,
      allowVideo: true,
    });

    expect(decision.visibleActions[0]?.id).toBe('continue_video');
    expect(decision.nextMoveText).toContain('Use the video');
  });

  it('keeps research hidden unless the context genuinely signals that it is needed', () => {
    const plainMessage = buildModelMessage();
    const plainDecision = resolveTutorSurfaceDecision({
      message: plainMessage,
      allowTutorActions: true,
      allowResearch: true,
    });

    expect(plainDecision.visibleActions.some((action) => action.id === 'research')).toBe(false);

    const currentInfoMessage = buildModelMessage({
      metadata: {
        systemNotices: [{ code: 'current_info_risk', message: 'This may change quickly.', severity: 'warning' }],
      },
    });

    const researchDecision = resolveTutorSurfaceDecision({
      message: currentInfoMessage,
      allowTutorActions: true,
      allowResearch: true,
    });

    expect(researchDecision.visibleActions.some((action) => action.id === 'research')).toBe(true);
  });

  it('rewrites Next move copy when metadata tries to prescribe tutor action buttons', () => {
    const message = buildModelMessage({
      metadata: {
        tutorUi: {
          nextStep: 'Start with the first step, then use Hint if you get stuck.',
        },
        presentation: {
          suggestedActions: ['hint', 'practice'],
        },
      },
    });

    const decision = resolveTutorSurfaceDecision({
      message,
      allowTutorActions: true,
    });

    expect(decision.nextMoveText).toContain('Check your level');
    expect(String(decision.nextMoveText || '').toLowerCase()).not.toContain('use hint');
  });

  it('does not add a follow-up question when the assistant message already contains one', () => {
    const message = buildModelMessage({
      content: 'Try this checkpoint first: what changes when the force is unbalanced?',
      metadata: {
        presentation: {
          turnType: 'checkpoint',
        },
      },
    });

    const decision = resolveTutorSurfaceDecision({
      message,
      allowTutorActions: true,
    });

    expect(decision.followupQuestion).toBeNull();
  });
});
