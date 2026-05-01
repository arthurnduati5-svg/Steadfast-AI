import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class OpenAI {
    chat = { completions: { create: createMock } };
  },
}));

import { emotionalAICopilot } from '../flows/emotional-ai-copilot';
import type { ConversationState } from '../../lib/types';

function buildMathState(overrides: Partial<ConversationState> & Record<string, unknown> = {}) {
  return {
    researchModeActive: false,
    lastSearchTopic: ['fractions'],
    awaitingPracticeQuestionInvitationResponse: false,
    activePracticeQuestion: '(1/2)/(3/4)',
    awaitingPracticeQuestionAnswer: true,
    validationAttemptCount: 0,
    lastAssistantMessage: '',
    sensitiveContentDetected: false,
    videoSuggested: false,
    usedExamples: [],
    lastTopic: 'fractions',
    correctAnswers: ['2/3', '0.666667'],
    mathModeActive: true,
    mathWorkedExampleStep: 0,
    ...overrides,
  } as ConversationState & Record<string, unknown>;
}

function buildGenericMathState(overrides: Partial<ConversationState> & Record<string, unknown> = {}) {
  return {
    researchModeActive: false,
    lastSearchTopic: ['algebra'],
    awaitingPracticeQuestionInvitationResponse: false,
    activePracticeQuestion: '10 - 3',
    awaitingPracticeQuestionAnswer: true,
    validationAttemptCount: 0,
    lastAssistantMessage: '',
    sensitiveContentDetected: false,
    videoSuggested: false,
    usedExamples: [],
    lastTopic: 'algebra',
    correctAnswers: ['7'],
    mathModeActive: true,
    mathWorkedExampleStep: 0,
    mathLessonKind: undefined,
    mathLessonStep: undefined,
    mathTargetExpression: undefined,
    ...overrides,
  } as ConversationState & Record<string, unknown>;
}

async function runTurn(text: string, state: ConversationState & Record<string, unknown>) {
  return emotionalAICopilot({
    text,
    chatHistory: [],
    state,
    studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
    preferences: { preferredLanguage: 'english', interests: ['math'] },
    currentTitle: 'Fractions Session',
    forceWebSearch: false,
  });
}

describe('Math coaching contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts fraction problems with fundamentals and a specific follow-up question', async () => {
    const result = await emotionalAICopilot({
      text: 'Solve (1/2)/(3/4)',
      chatHistory: [],
      state: {
        researchModeActive: false,
        lastSearchTopic: [],
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
        usedExamples: [],
      },
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Fractions Session',
      forceWebSearch: false,
    });

    expect(result.processedText.toLowerCase()).toContain('numerator');
    expect(result.processedText.toLowerCase()).toContain('denominator');
    expect(result.processedText.toLowerCase()).toContain('which number is the denominator');
    expect(result.processedText.toLowerCase()).toContain('3 or 4');
    expect(result.processedText.toLowerCase()).not.toContain('in 3/4, numerator is 3 and denominator is 4');
    expect(result.processedText).not.toContain('Step one: Let us start by rewriting the problem clearly.');
  });

  it('accepts fraction kickoff answers for the asked micro-step and advances instead of repeating wrong-state retries', async () => {
    const start = await emotionalAICopilot({
      text: 'Solve (7/9)/(14/27)',
      chatHistory: [],
      state: {
        researchModeActive: false,
        lastSearchTopic: [],
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
        usedExamples: [],
      },
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Fractions Session',
      forceWebSearch: false,
    });

    expect(start.processedText.toLowerCase()).toContain('which number is the denominator');

    const clarified = await emotionalAICopilot({
      text: 'for which fraction are you asking',
      chatHistory: [],
      state: start.state,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Fractions Session',
      forceWebSearch: false,
    });

    expect(clarified.processedText.toLowerCase()).toContain('second fraction');
    expect((clarified.state as any).validationAttemptCount).toBe(0);

    const step2 = await emotionalAICopilot({
      text: '27',
      chatHistory: [],
      state: clarified.state,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Fractions Session',
      forceWebSearch: false,
    });

    expect(step2.processedText.toLowerCase()).toContain('reciprocal');
    expect(step2.processedText.toLowerCase()).not.toContain('good try');
    expect((step2.state as any).validationAttemptCount).toBe(0);
  });

  it('self-heals stale math state and clarifies the exact fraction instead of repeating generic retries', async () => {
    const staleState = buildMathState({
      activePracticeQuestion: 'Which part here is the numerator and which is the denominator?',
      correctAnswers: [],
      validationAttemptCount: 2,
      mathLessonKind: undefined,
      mathLessonStep: undefined,
      mathTargetExpression: undefined,
      lastAssistantMessage:
        'Good try. Let us slow down. Step one: Read (7/9)/(14/27) and name each part before calculating.',
    });

    const res = await runTurn('for which fraction are you asking', staleState);
    expect(res.processedText.toLowerCase()).toContain('second fraction');
    expect(res.processedText.toLowerCase()).toContain('14/27');
    expect(res.processedText.toLowerCase()).not.toContain('you are improving');
  });

  it('uses topic-specific kickoff follow-up questions for percentages, equations, and algebra', async () => {
    const baseState = {
      researchModeActive: false,
      lastSearchTopic: [],
      awaitingPracticeQuestionInvitationResponse: false,
      awaitingPracticeQuestionAnswer: false,
      validationAttemptCount: 0,
      sensitiveContentDetected: false,
      videoSuggested: false,
      usedExamples: [],
    } as ConversationState;

    const pct = await emotionalAICopilot({
      text: 'In percentages, solve 20/100*50',
      chatHistory: [],
      state: baseState,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Percentages Session',
      forceWebSearch: false,
    });
    expect(pct.processedText.toLowerCase()).toContain('out of 100');
    expect(pct.processedText.toLowerCase()).toContain('25 out of 100 or 25 out of 10');

    const eq = await emotionalAICopilot({
      text: 'Solve equation 5+3=8',
      chatHistory: [],
      state: baseState,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Equations Session',
      forceWebSearch: false,
    });
    expect(eq.processedText.toLowerCase()).toContain('equation has two sides');
    expect(eq.processedText.toLowerCase()).toContain('= or +');

    const alg = await emotionalAICopilot({
      text: 'In algebra, simplify 3+2',
      chatHistory: [],
      state: baseState,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Algebra Session',
      forceWebSearch: false,
    });
    expect(alg.processedText.toLowerCase()).toContain('in algebra, a variable is a symbol');
    expect(alg.processedText.toLowerCase()).toContain('unknown number or the fixed number 3');
  });

  it('uses choice-style generic kickoff checks for mixed-operation expressions', async () => {
    const generic = await emotionalAICopilot({
      text: 'Solve 8 + 4*2',
      chatHistory: [],
      state: {
        researchModeActive: false,
        lastSearchTopic: [],
        awaitingPracticeQuestionInvitationResponse: false,
        awaitingPracticeQuestionAnswer: false,
        validationAttemptCount: 0,
        sensitiveContentDetected: false,
        videoSuggested: false,
        usedExamples: [],
      },
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['math'] },
      currentTitle: 'Generic Math Session',
      forceWebSearch: false,
    });

    expect(generic.processedText.toLowerCase()).toContain('which comes first: multiply/divide or add/subtract');
  });

  it('uses retry scaffolds for attempts 1-4, then switches to worked-example at attempt 5', async () => {
    let state = buildMathState();

    const t1 = await runTurn('no', state);
    expect(t1.processedText.toLowerCase()).toContain('step one recap');
    expect(t1.processedText.toLowerCase()).toContain('denominator');
    expect((t1.state as any).validationAttemptCount).toBe(1);
    state = t1.state as any;

    const t2 = await runTurn('still wrong', state);
    expect(t2.processedText.toLowerCase()).toContain('step one recap');
    expect((t2.state as any).validationAttemptCount).toBe(2);
    state = t2.state as any;

    const t3 = await runTurn('wrong again', state);
    expect(t3.processedText.toLowerCase()).toContain('step one recap');
    expect((t3.state as any).validationAttemptCount).toBe(3);
    state = t3.state as any;

    const t4 = await runTurn('not sure', state);
    expect(t4.processedText.toLowerCase()).toContain('step one recap');
    expect((t4.state as any).validationAttemptCount).toBe(4);
    state = t4.state as any;

    const t5 = await runTurn('still no', state);
    expect(t5.processedText).toContain('Worked example (guided)');
    expect(t5.processedText).toContain('Step one:');
    expect((t5.state as any).validationAttemptCount).toBe(5);
    expect((t5.state as any).mathWorkedExampleStep).toBe(1);
    expect((t5.state as any).awaitingPracticeQuestionAnswer).toBe(true);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('increments worked-example steps after the 5th fail and resets all math mode flags on correct answer', async () => {
    let state = buildGenericMathState({
      validationAttemptCount: 5,
      mathWorkedExampleStep: 1,
    });

    const t6 = await runTurn('wrong', state);
    expect(t6.processedText).toContain('Worked example (guided)');
    expect(t6.processedText.toLowerCase()).toContain('apply one basic rule');
    expect((t6.state as any).validationAttemptCount).toBe(6);
    expect((t6.state as any).mathWorkedExampleStep).toBe(2);
    expect((t6.state as any).awaitingPracticeQuestionAnswer).toBe(true);

    const correct = await runTurn('7', t6.state as any);
    expect(correct.processedText.toLowerCase()).toContain('correct');
    expect((correct.state as any).awaitingPracticeQuestionAnswer).toBe(false);
    expect((correct.state as any).validationAttemptCount).toBe(0);
    expect((correct.state as any).activePracticeQuestion).toBeUndefined();
    expect((correct.state as any).mathModeActive).toBe(false);
    expect((correct.state as any).mathWorkedExampleStep).toBe(0);
    expect(createMock).not.toHaveBeenCalled();
  });
});
