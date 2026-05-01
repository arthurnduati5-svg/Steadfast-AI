import { describe, expect, it } from 'vitest';
import type { SessionLanguageState } from '../lib/types';
import { buildAssistantTurnPipeline } from './assistantTurnPipelineService';

const sessionLanguageState: SessionLanguageState = {
  preferredResponseLanguage: 'english',
  learningSupportMode: null,
  simplicityLevel: null,
  voiceOutputLanguage: null,
  bilingualSupportLanguage: null,
  lastDetectedInputLanguage: 'english',
  preferredLanguageMode: 'english',
};

describe('assistant envelope pipeline contract', () => {
  it('builds canonical metadata envelope for /chat with inline reflection by default', async () => {
    const result = await buildAssistantTurnPipeline({
      route: 'chat',
      userId: 'student-1',
      userText: 'Help me with this step.',
      assistantText: 'Let us check your confidence first.',
      topic: 'Linear equations',
      subject: 'math',
      tutorActionId: 'ask',
      priorTutorState: {},
      currentMetacognitiveState: {
        confidence: 'partly_sure',
      },
      awaitingStudentAttempt: false,
      afterMistake: true,
      afterSuccess: false,
      sessionLanguageState,
      detectedInputLanguage: 'english',
      generatedLanguage: 'english',
      systemNotices: [
        {
          code: 'limited_source_support',
          message: 'This answer has limited source support.',
          severity: 'warning',
        },
      ],
      buildMessageLanguageMetadata: ({ sessionLanguageState: languageState }) => ({
        preferredResponseLanguageAtTurn: languageState.preferredResponseLanguage,
        generatedLanguage: languageState.preferredResponseLanguage,
      }),
      learnerLoopStateOverride: {
        topicMastery: null,
        weakTopicRecovery: null,
        reflectionPrompt: {
          type: 'check_confidence',
          text: 'How sure are you about this step?',
        },
      },
    });

    expect(result.assistantMetadata.assistantEnvelope).toBeDefined();
    expect(result.assistantMetadata.assistantEnvelope?.version).toBe('v1');
    expect(result.assistantMetadata.assistantEnvelope?.route).toBe('chat');
    expect(result.assistantMetadata.assistantEnvelope?.presentation?.reflectLevel).toBe('inline');
    expect(result.assistantMetadata.assistantEnvelope?.presentation?.inlineReflectionPrompt).toBeTruthy();
    expect(result.assistantMetadata.assistantEnvelope?.presentation?.reflectionPrompt).toBeUndefined();
    expect(result.assistantMetadata.assistantEnvelope?.presentation?.reflectCard).toBeUndefined();
    expect(result.assistantMetadata.assistantEnvelope?.language?.generatedLanguage).toBe(
      'english'
    );
    expect(Array.isArray(result.assistantMetadata.systemNotices)).toBe(true);
    expect(result.assistantMetadata.presentation?.inlineReflectionType).toBe('check_confidence');
    expect(result.assistantMetadata.metacognition?.confidence).toBe('partly_sure');
  });

  it('allows full reflection cards for high-signal recovery moments', async () => {
    const result = await buildAssistantTurnPipeline({
      route: 'chat',
      userId: 'student-3',
      userText: 'I am still stuck here.',
      assistantText: 'Let us recover this step carefully.',
      topic: 'Linear equations',
      subject: 'math',
      tutorActionId: 'save',
      priorTutorState: {},
      currentMetacognitiveState: null,
      awaitingStudentAttempt: false,
      afterMistake: true,
      afterSuccess: false,
      sessionLanguageState,
      detectedInputLanguage: 'english',
      generatedLanguage: 'english',
      systemNotices: [],
      buildMessageLanguageMetadata: ({ sessionLanguageState: languageState }) => ({
        preferredResponseLanguageAtTurn: languageState.preferredResponseLanguage,
        generatedLanguage: languageState.preferredResponseLanguage,
      }),
      learnerLoopStateOverride: {
        topicMastery: null,
        weakTopicRecovery: {
          topic: 'Linear equations',
          subject: 'math',
          active: true,
        },
        reflectionPrompt: {
          type: 'weak_topic_recovery',
          text: 'Before we continue, where are you right now?',
        },
      },
    });

    expect(result.assistantMetadata.presentation?.reflectLevel).toBe('full');
    expect(result.assistantMetadata.presentation?.reflectionPrompt).toBe(
      'Before we continue, where are you right now?'
    );
    expect(result.assistantMetadata.presentation?.reflectCard?.type).toBe('weak_topic_recovery');
    expect(result.reflectionStatePatch.lastReflectAt).toBeTruthy();
    expect(result.reflectionStatePatch.lastReflectType).toBe('weak_topic_recovery');
  });

  it('builds canonical metadata envelope for /voice-chat with stable route tagging and awaiting-attempt carryover', async () => {
    const result = await buildAssistantTurnPipeline({
      route: 'voice_chat',
      userId: 'student-2',
      userText: 'I think I understand.',
      assistantText: 'Try one step now.',
      topic: 'Cell transport',
      subject: 'biology',
      priorTutorState: {
        awaitingStudentAttempt: true,
      },
      currentMetacognitiveState: null,
      awaitingStudentAttempt: true,
      afterMistake: false,
      afterSuccess: true,
      forceAwaitingStudentAttempt: true,
      sessionLanguageState,
      detectedInputLanguage: 'english',
      generatedLanguage: 'english',
      systemNotices: [],
      buildMessageLanguageMetadata: ({ sessionLanguageState: languageState }) => ({
        preferredResponseLanguageAtTurn: languageState.preferredResponseLanguage,
        generatedLanguage: languageState.preferredResponseLanguage,
      }),
      learnerLoopStateOverride: {
        topicMastery: null,
        weakTopicRecovery: null,
        reflectionPrompt: null,
      },
    });

    expect(result.assistantMetadata.assistantEnvelope).toBeDefined();
    expect(result.assistantMetadata.assistantEnvelope?.version).toBe('v1');
    expect(result.assistantMetadata.assistantEnvelope?.route).toBe('voice_chat');
    expect(result.assistantMetadata.assistantEnvelope?.presentation?.awaitingStudentAttempt).toBe(
      true
    );
    expect(result.assistantMetadata.presentation?.awaitingStudentAttempt).toBe(true);
    expect(result.assistantMetadata.assistantEnvelope?.language?.generatedLanguage).toBe(
      'english'
    );
  });
});
