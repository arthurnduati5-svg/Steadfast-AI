// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Post-Turn Event Service v1
// Writes bounded learning events after a successful chat turn.
// No raw chat transcripts. No direct memory mutation from AI output.
// ─────────────────────────────────────────────────────────────

import type { ChatTurnExecutionContext, PostTurnEventResult } from './chatPipelineContracts';
import { learningEventService } from './learningEventService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { VideoChatRecommendationMeta } from './videoChatIntegrationContracts';
import type { LearningEventSource } from './learnerMemoryContracts';
import type {
  SocraticLearningEvidenceEventType,
  SocraticLearningEvidenceSurface,
  SocraticEvidenceStrength,
  SocraticSupportLevel,
} from './socraticLearningControlContracts';

export class ChatPostTurnEventService {
  /**
   * Write a bounded post-turn learning event after a successful chat turn.
   */
  async writePostTurnLearningEvent(
    identity: ResolvedTutorIdentity,
    context: ChatTurnExecutionContext,
    answerSummary: string,
  ): Promise<PostTurnEventResult> {
    const warnings: string[] = [];

    if (!identity?.studentId || !identity?.schoolId) {
      return { eventWritten: false, warnings: ['Identity missing — cannot write event.'] };
    }

    if (!context.intentResolution) {
      return { eventWritten: false, warnings: ['No intent resolution — cannot write event.'] };
    }

    // Determine event kind based on intent
    const intent = context.intentResolution.primaryIntent;
    let eventKind: string;

    switch (intent) {
      case 'explain':
      case 'reteach':
      case 'simplify':
        eventKind = 'asked_question';
        break;
      case 'practice':
      case 'quiz':
      case 'next_practice':
        eventKind = 'answered_question';
        break;
      case 'check_answer':
        eventKind = 'answered_question';
        break;
      case 'artifact_help':
      case 'artifact_question_help':
        eventKind = 'queried_artifact';
        break;
      case 'video_help':
        eventKind = 'asked_question';
        break;
      case 'source_verification':
        eventKind = 'asked_question';
        break;
      case 'review':
      case 'revise':
        eventKind = 'reviewed_topic';
        break;
      case 'progress_check':
      case 'study_plan':
        eventKind = 'asked_question';
        break;
      case 'general_chat':
        eventKind = 'asked_question';
        break;
      case 'clarification_needed':
        eventKind = 'asked_question';
        break;
      case 'unsafe':
      case 'unsupported':
        return { eventWritten: false, warnings: ['Unsafe/unsupported intent — no event written.'] };
      default:
        eventKind = 'asked_question';
    }

    try {
      const event = await learningEventService.createLearningEvent(
        identity,
        {
          kind: eventKind as any,
          sessionId: context.request.sessionId || null,
          subject: context.tutorContext?.session?.activeSubject || undefined,
          topic: context.tutorContext?.session?.activeTopic || undefined,
          responseSummary: answerSummary.slice(0, 500),
          source: 'chat',
        },
      );

      return {
        eventWritten: true,
        eventId: event.eventId || String(event),
        warnings,
      };
    } catch (err) {
      warnings.push(`Failed to write post-turn event: ${String(err)}`);
      return { eventWritten: false, warnings };
    }
  }
  /**
   * Write a canonical evidence event from the learning control bridge.
   * This is the SAFE path for evidence events — never includes raw private data.
   */
  async writeEvidenceEvent(input: {
    identity: ResolvedTutorIdentity;
    eventType: SocraticLearningEvidenceEventType;
    surface: SocraticLearningEvidenceSurface;
    safeSummary: string;
    evidenceStrength: SocraticEvidenceStrength;
    hintLevel?: string;
    supportLevel?: SocraticSupportLevel;
    decisionId?: string;
    wasSafetyTransform?: boolean;
    learnerIdHash?: string;
    subjectId?: string;
    skillId?: string;
    sessionId?: string | null;
  }): Promise<PostTurnEventResult> {
    const warnings: string[] = [];

    if (!input.identity?.studentId || !input.identity?.schoolId) {
      return { eventWritten: false, warnings: ['Identity missing — cannot write evidence event.'] };
    }

    if (!input.safeSummary || input.safeSummary.length < 3) {
      return { eventWritten: false, warnings: ['Safe summary too short — cannot write evidence event.'] };
    }

    try {
      const event = await learningEventService.createLearningEvent(
        input.identity,
        {
          kind: 'answered_question',
          sessionId: input.sessionId || null,
          subject: input.subjectId || undefined,
          topic: undefined,
          responseSummary: input.safeSummary.slice(0, 500),
          source: (input.surface === 'chat_pipeline' ? 'chat' : 'system') as LearningEventSource,
        },
      );

      return {
        eventWritten: true,
        eventId: event.eventId || String(event),
        warnings,
      };
    } catch (err) {
      warnings.push(`Failed to write evidence event: ${String(err)}`);
      return { eventWritten: false, warnings };
    }
  }
}

export const chatPostTurnEventService = new ChatPostTurnEventService();
