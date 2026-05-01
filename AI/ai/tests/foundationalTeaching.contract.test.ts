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

function baseState(): ConversationState {
  return {
    researchModeActive: false,
    lastSearchTopic: [],
    awaitingPracticeQuestionInvitationResponse: false,
    awaitingPracticeQuestionAnswer: false,
    validationAttemptCount: 0,
    sensitiveContentDetected: false,
    videoSuggested: false,
    usedExamples: [],
  };
}

describe('Foundational teaching pacing contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chunks broad first-turn theory requests into one basic idea and one check question', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content:
              "Sure! Let's start with the basics of JavaScript. Step 1: What is JavaScript? JavaScript is a programming language for interactive websites. Step 2: Variables, data types, functions, loops, arrays, objects, DOM, and events are all important. ```javascript\nlet name = 'John';\n``` Would you like to explore a specific topic in JavaScript further?",
          },
        },
      ],
    } as any);

    const result = await emotionalAICopilot({
      text: 'take me through java script',
      chatHistory: [],
      state: baseState(),
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['coding'] },
      currentTitle: 'JavaScript Session',
      forceWebSearch: false,
    });

    const normalized = String(result.processedText || '').replace(/\s+/g, ' ').trim();
    const questionCount = (normalized.match(/\?/g) || []).length;
    const sentenceCount = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean).length;

    expect(normalized.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
    expect(normalized).not.toContain('```');
    expect(questionCount).toBe(1);
    expect(sentenceCount).toBeLessThanOrEqual(3);
    expect((result.state as any).conceptualLessonModeActive).toBe(true);
  });

  it('keeps one-concept pacing on follow-up continue turns in conceptual mode', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content:
              'Great! Let us move on. Step 7: Advanced functions include arrow functions and higher-order functions. Step 8: Asynchronous JavaScript covers callbacks, promises, and async/await. Step 9: Error handling with try/catch. Step 10: Modules using import/export. Would you like to explore a coding exercise?',
          },
        },
      ],
    } as any);

    const result = await emotionalAICopilot({
      text: 'continue',
      chatHistory: [
        {
          id: 'assistant-1',
          role: 'model',
          content: 'JavaScript controls behavior on web pages. Does that make sense so far?',
          timestamp: new Date(),
        } as any,
      ],
      state: {
        ...baseState(),
        conceptualLessonModeActive: true,
        conceptualTopic: 'java script',
      } as any,
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['coding'] },
      currentTitle: 'JavaScript Session',
      forceWebSearch: false,
    });

    const normalized = String(result.processedText || '').replace(/\s+/g, ' ').trim();
    const questionCount = (normalized.match(/\?/g) || []).length;
    const sentenceCount = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean).length;

    expect(normalized.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|four|five|six|seven|eight|nine|ten|1|2|3|4|5|6|7|8|9|10)\b/);
    expect(questionCount).toBe(1);
    expect(sentenceCount).toBeLessThanOrEqual(3);
    expect((result.state as any).conceptualLessonModeActive).toBe(true);
  });

  it('applies one-concept pacing for broad system-design theory prompts', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content:
              "Step One: Architecture overview for a globally distributed chat system starts with clients, edge routing, stateless chat gateways, ordered logs, and regional data stores. Step Two: Add partitioning, replication, failover, and backpressure controls. Step Three: Add observability, SLOs, and incident response. Would you like me to continue with consistency trade-offs?",
          },
        },
      ],
    } as any);

    const result = await emotionalAICopilot({
      text: 'Designing a globally distributed chat system for 50 million daily active users with low latency and strict message ordering.',
      chatHistory: [],
      state: baseState(),
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 10' },
      preferences: { preferredLanguage: 'english', interests: ['coding'] },
      currentTitle: 'Distributed Systems Session',
      forceWebSearch: false,
    });

    const normalized = String(result.processedText || '').replace(/\s+/g, ' ').trim();
    const questionCount = (normalized.match(/\?/g) || []).length;
    const sentenceCount = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean).length;

    expect(normalized.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
    expect(questionCount).toBe(1);
    expect(sentenceCount).toBeLessThanOrEqual(3);
    expect((result.state as any).conceptualLessonModeActive).toBe(true);
  });

  it('does not force foundational pacing for procedural coding requests', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content:
              'Step one: Create the project structure. Step two: Add JavaScript event handlers. What part should we implement first?',
          },
        },
      ],
    } as any);

    const result = await emotionalAICopilot({
      text: 'show me step by step how to build a javascript todo app',
      chatHistory: [],
      state: baseState(),
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 7' },
      preferences: { preferredLanguage: 'english', interests: ['coding'] },
      currentTitle: 'Todo App Session',
      forceWebSearch: false,
    });

    const normalized = String(result.processedText || '').toLowerCase();
    expect(normalized).toContain('step one');
    expect(normalized).toContain('step two');
  });

  it('removes step labels for point-form conceptual troubleshooting requests', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content:
              'Step one: Timeout settings can trigger intermittent 502 responses. Step two: Upstream capacity can saturate and drop requests. Step three: Network jitter between Nginx and upstream can fail connections. Would you like to inspect logs first?',
          },
        },
      ],
    } as any);

    const result = await emotionalAICopilot({
      text: 'Give me the potential causes of intermittent 502 behind Nginx in point form.',
      chatHistory: [
        {
          id: 'assistant-older',
          role: 'model',
          content: 'Previously we discussed upstream timeouts.',
          timestamp: new Date(),
        } as any,
      ],
      state: baseState(),
      studentProfile: { name: 'Test Student', gradeLevel: 'Grade 10' },
      preferences: { preferredLanguage: 'english', interests: ['coding'] },
      currentTitle: 'Nginx Session',
      forceWebSearch: false,
    });

    const normalized = String(result.processedText || '').toLowerCase();
    expect(normalized).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
    expect(normalized).toContain('timeout');
    expect(normalized).toContain('upstream');
  });
});
