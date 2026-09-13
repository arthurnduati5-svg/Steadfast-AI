// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Chat Trigger Service v1
// Decides whether artifact-aware practice should be triggered
// during a live chat turn.
// Rules: IntentResolution is primary. TutorTurnContext artifact
// state is secondary. Message signals are fallback only.
// No keyword-only routing as the main decision.
// ─────────────────────────────────────────────────────────────

import type { ArtifactAwarePracticeSession } from './artifactAwarePracticeContracts';
import type { ArtifactAwarePracticeSafeContextSummary } from './artifactAwarePracticeContracts';

// ── Trigger Types ──

export type ArtifactAwarePracticeChatTriggerKind =
  | 'generate_from_artifact'
  | 'answer_artifact_practice'
  | 'review_artifact_practice'
  | 'next_artifact_practice'
  | 'schedule_artifact_review'
  | 'complete_artifact_practice'
  | 'not_triggered';

export interface ArtifactAwarePracticeChatTriggerResult {
  shouldTrigger: boolean;
  triggerKind: ArtifactAwarePracticeChatTriggerKind;
  confidence: number;
  reasons: string[];
  warnings: string[];
}

export interface ArtifactAwarePracticeChatTriggerInput {
  message: string;
  intentResolution?: {
    primaryIntent?: string;
    secondaryIntents?: string[];
    status?: string;
    task?: {
      taskKind?: string;
      topic?: string | null;
      subject?: string | null;
    };
  } | null;
  artifactContext?: {
    activeArtifactIds: string[];
    status?: string;
  } | null;
  artifactAwarePracticeContext?: {
    activePracticeSession?: ArtifactAwarePracticeSession | null;
    safeContextSummary?: ArtifactAwarePracticeSafeContextSummary;
  } | null;
  isUnsafeOrPromptInjection?: boolean;
  hasActiveArtifactPractice?: boolean;
}

// ── Message Pattern Matching ──

const GENERATE_FROM_ARTIFACT_PATTERNS = [
  /\b(quiz|test|examine|question)\s+me\s+(from|on|about|using)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact|page)\b/i,
  /\b(give|create|make|generate|provide)\s+(me\s+)?(practice|questions?|quiz|test|exercise)\s+(from|with|on|about|using)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact)\b/i,
  /\bpractice\s+(me\s+)?(from|on|about)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact)\b/i,
  /\bask\s+me\s+questions?\s+(from|about|on)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact)\b/i,
  /\b(review|check|use)\s+(me\s+)?(from|on|about|using|in)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact|theorem|question)\b/i,
  /\bstudy\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload)\s+(and\s+)?(quiz|test|question)\s+me\b/i,
  /\b(questions?|practice|exercises?)\s+(from|in|of|on)\s+(this|the|my|that|an?)\s+(uploaded|file|pdf|document|worksheet|note|notes|image|diagram|material|artifact)\b/i,
  /\b(review|practice|study|go\s+over)\s+(the|this)\s+(theorem|concept|topic|section|example|formula|diagram|question|worked[\s-]example)\s+(in|from|of)\s+(the|this|my|that)\s+(file|document|worksheet|upload|material|artifact|note|notes|pdf)\b/i,
];

const ANSWER_ARTIFACT_PRACTICE_PATTERNS = [
  /\b(check|evaluate|review|grade|look\s+at|assess)\s+(my\s+)?answer\s+(from|for|to|on|about|using)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact|practice)\b/i,
  /\b(my\s+)?answer\s+(is|should\s+be)\b.*\b(from|for|to|about)\s+(this|the|my|that)\s+(file|pdf|document|worksheet|note|notes|image|diagram|upload|material|artifact|practice)\b/i,
  /\bi\s+(think|believe|feel)\s+(my\s+)?answer\s+(is|should\s+be)\b/i,
  /\b(is\s+this|am\s+i)\s+correct\b.*\b(worksheet|file|practice|question|diagram|artifact)\b/i,
];

const REVIEW_ARTIFACT_PATTERNS = [
  /\b(review|go\s+over|look\s+at|discuss)\s+(the|my|this)\s+(practice|worksheet|file|material|artifact)\s+(results?|answer|feedback|progress|performance)\b/i,
  /\b(show|tell)\s+me\s+(my\s+)?(results?|progress|score|feedback)\s+(from|on|for)\s+(the|this|my)\s+(practice|worksheet|file)\b/i,
];

const NEXT_ARTIFACT_PATTERNS = [
  /\b(give|get|show|have|want)\s+me\s+(another|next|more|a\s+different)\s+(question|practice|one|exercise|problem)\b/i,
  /\b(another\s+one|next\s+one|next\s+question|another\s+question|more\s+practice|similar\s+question)\b/i,
];

const SCHEDULE_ARTIFACT_PATTERNS = [
  /\b(schedule|plan|set\s+up|arrange)\s+(a\s+)?(review|reminder|session|practice)\s+(for|of|on)\s+(this|the|my|that)\s+(file|material|worksheet|practice|artifact)\b/i,
  /\bremind\s+me\s+(to\s+)?(review|practice)\s+(this|the|my|that)\s+(file|material|worksheet|artifact)\b/i,
];

const COMPLETE_ARTIFACT_PATTERNS = [
  /\b(i\s+am|i'm)\s+(done|finished|completed)\s+(with\s+)?(this|the|my|that)\s+(practice|worksheet|file|session|exercise|artifact)\b/i,
  /\b(complete|finish|end|stop|done)\s+(this|the|my|that)\s+(practice|worksheet|file|session|exercise|artifact)\b/i,
  /\b(mark|set)\s+(as|to)\s+(complete|done|finished)\b/i,
];

// ── Keywords that indicate an artifact-reference check is appropriate ──

const ARTIFACT_REFERENCE_WORDS = new Set([
  'file', 'pdf', 'document', 'worksheet', 'note', 'notes',
  'image', 'diagram', 'upload', 'uploaded', 'material', 'artifact',
  'practice', 'exercise', 'workbook', 'textbook', 'sheet',
]);

function hasArtifactReference(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of ARTIFACT_REFERENCE_WORDS) {
    if (lower.includes(word)) return true;
  }
  return false;
}

function matchFirstPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ── Service ──

export class ArtifactAwarePracticeChatTriggerService {
  /**
   * Determine whether artifact-aware practice should be triggered.
   * Primary signal: IntentResolution.
   * Secondary signal: TutorTurnContext artifact state.
   * Fallback signal: learner message pattern.
   *
   * Does not trigger if:
   * - unsafe intent is detected
   * - message is prompt injection
   * - no active artifact exists (except to return clarification guidance)
   */
  shouldTriggerArtifactAwarePracticeFromChat(
    input: ArtifactAwarePracticeChatTriggerInput,
  ): ArtifactAwarePracticeChatTriggerResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;
    let shouldTrigger = false;
    let triggerKind: ArtifactAwarePracticeChatTriggerKind = 'not_triggered';

    const message = String(input.message || '').trim();
    const intent = input.intentResolution;

    // ── Block unsafe / prompt injection ──
    if (input.isUnsafeOrPromptInjection) {
      return {
        shouldTrigger: false,
        triggerKind: 'not_triggered',
        confidence: 0,
        reasons: ['blocked_unsafe'],
        warnings: ['Unsafe or prompt injection detected — artifact practice blocked.'],
      };
    }

    if (intent?.status === 'unsafe' || intent?.status === 'unsupported') {
      return {
        shouldTrigger: false,
        triggerKind: 'not_triggered',
        confidence: 0,
        reasons: ['blocked_unsafe_intent'],
        warnings: ['Unsafe intent detected — artifact practice blocked.'],
      };
    }

    // ── Check for active artifact practice session (context-aware triggers) ──
    const hasActivePractice = input.hasActiveArtifactPractice ?? false;
    const hasActiveArtifact = (input.artifactContext?.activeArtifactIds?.length ?? 0) > 0;

    // ── Rule 1: IntentResolution-based triggers ──
    if (intent) {
      const primaryIntent = intent.primaryIntent || '';
      const taskKind = intent.task?.taskKind || '';

      // artifact_help + artifact reference -> generate
      if (primaryIntent === 'artifact_help' && hasActiveArtifact) {
        reasons.push('intent_artifact_help_with_active_artifact');
        triggerKind = 'generate_from_artifact';
        confidence = Math.max(confidence, 0.85);
      }

      // artifact_question_help with active artifact practice -> answer
      if (primaryIntent === 'artifact_question_help' && hasActivePractice) {
        reasons.push('intent_artifact_question_help_with_active_practice');
        triggerKind = 'answer_artifact_practice';
        confidence = Math.max(confidence, 0.85);
      }

      // practice/quiz with artifact context -> generate
      if ((primaryIntent === 'practice' || primaryIntent === 'quiz') && hasActiveArtifact && !hasActivePractice) {
        reasons.push('intent_practice_with_active_artifact');
        triggerKind = 'generate_from_artifact';
        confidence = Math.max(confidence, 0.75);
      }

      // check_answer with active practice -> answer
      if (primaryIntent === 'check_answer' && hasActivePractice) {
        reasons.push('intent_check_answer_with_active_practice');
        triggerKind = 'answer_artifact_practice';
        confidence = Math.max(confidence, 0.9);
      }

      // next_practice with active practice -> next
      if (primaryIntent === 'next_practice' && hasActivePractice) {
        reasons.push('intent_next_practice_with_active_practice');
        triggerKind = 'next_artifact_practice';
        confidence = Math.max(confidence, 0.8);
      }

      // review with active practice -> review
      if (primaryIntent === 'review' && hasActivePractice) {
        reasons.push('intent_review_with_active_practice');
        triggerKind = 'review_artifact_practice';
        confidence = Math.max(confidence, 0.7);
      }
    }

    // ── Rule 2: Message pattern matching (fallback when intent didn't trigger) ──
    if (!shouldTrigger && reasons.length === 0) {
      // Must have an active artifact to trigger
      if (!hasActiveArtifact && !hasActivePractice) {
        // Don't trigger on artifact-reference words alone without an active artifact
        // Any trigger would just return a "no active artifact" clarification

        // Only check if the message strongly implies artifact practice
        if (matchFirstPattern(message, GENERATE_FROM_ARTIFACT_PATTERNS)) {
          reasons.push('message_generate_request_no_artifact');
          triggerKind = 'generate_from_artifact';
          confidence = Math.max(confidence, 0.4);
          warnings.push('Learner requested artifact practice but no active artifact exists. Will ask for clarification.');
        }

        if (matchFirstPattern(message, ANSWER_ARTIFACT_PRACTICE_PATTERNS)) {
          reasons.push('message_answer_request_no_artifact');
          triggerKind = 'generate_from_artifact'; // Redirect to generation since no practice exists
          confidence = Math.max(confidence, 0.3);
          warnings.push('Learner requested answer check but no active practice exists. Will generate practice first.');
        }

        shouldTrigger = reasons.length > 0 && reasons[0] !== 'not_triggered';
        if (!shouldTrigger) {
          return {
            shouldTrigger: false,
            triggerKind: 'not_triggered',
            confidence: 0,
            reasons: ['no_active_artifact'],
            warnings: ['No active artifact or practice session — not triggering artifact practice.'],
          };
        }
      }

      // Has active artifact but no intent signal -> check message patterns
      if (hasActiveArtifact || hasActivePractice) {
        // Generate from artifact
        if (matchFirstPattern(message, GENERATE_FROM_ARTIFACT_PATTERNS)) {
          reasons.push('message_generate_request');
          triggerKind = 'generate_from_artifact';
          confidence = Math.max(confidence, 0.7);
        }

        // Answer artifact practice
        if (matchFirstPattern(message, ANSWER_ARTIFACT_PRACTICE_PATTERNS)) {
          reasons.push('message_answer_request');
          triggerKind = hasActivePractice ? 'answer_artifact_practice' : 'generate_from_artifact';
          confidence = Math.max(confidence, 0.65);
          if (!hasActivePractice) {
            warnings.push('Learner wants to check answer but no active practice. Will generate first.');
          }
        }

        // Review artifact practice
        if (matchFirstPattern(message, REVIEW_ARTIFACT_PATTERNS)) {
          reasons.push('message_review_request');
          triggerKind = hasActivePractice ? 'review_artifact_practice' : 'generate_from_artifact';
          confidence = Math.max(confidence, 0.6);
        }

        // Next artifact practice
        if (matchFirstPattern(message, NEXT_ARTIFACT_PATTERNS)) {
          reasons.push('message_next_request');
          triggerKind = hasActivePractice ? 'next_artifact_practice' : 'generate_from_artifact';
          confidence = Math.max(confidence, 0.6);
        }

        // Schedule artifact review
        if (matchFirstPattern(message, SCHEDULE_ARTIFACT_PATTERNS)) {
          reasons.push('message_schedule_request');
          triggerKind = hasActivePractice ? 'schedule_artifact_review' : 'generate_from_artifact';
          confidence = Math.max(confidence, 0.5);
        }

        // Complete artifact practice
        if (matchFirstPattern(message, COMPLETE_ARTIFACT_PATTERNS)) {
          reasons.push('message_complete_request');
          triggerKind = hasActivePractice ? 'complete_artifact_practice' : 'generate_from_artifact';
          confidence = Math.max(confidence, 0.5);
        }
      }
    }

    // ── Compute final decision ──
    shouldTrigger = reasons.length > 0 && reasons[0] !== 'not_triggered';

    // If no artifact reference at all and no intent, don't trigger
    if (!shouldTrigger && !hasArtifactReference(message) && !intent) {
      return {
        shouldTrigger: false,
        triggerKind: 'not_triggered',
        confidence: 0,
        reasons: ['no_artifact_keywords_or_intent'],
        warnings: ['Message has no artifact keywords or artifact-related intent.'],
      };
    }

    if (!shouldTrigger) {
      return {
        shouldTrigger: false,
        triggerKind: 'not_triggered',
        confidence: 0,
        reasons: ['not_triggered'],
        warnings: [],
      };
    }

    // Enforce: if no active artifact and no active practice, generate_from_artifact
    // (which will return a clarification asking the learner to upload a file)
    if (!hasActiveArtifact && !hasActivePractice) {
      triggerKind = 'generate_from_artifact';
    }

    return {
      shouldTrigger,
      triggerKind,
      confidence,
      reasons,
      warnings,
    };
  }
}

// ── Singleton ──

export const artifactAwarePracticeChatTriggerService = new ArtifactAwarePracticeChatTriggerService();
