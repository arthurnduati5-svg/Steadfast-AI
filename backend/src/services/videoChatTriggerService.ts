// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Chat Trigger Service v1
// Decides whether video recommendation should be triggered
// during a live chat turn.
// Rules: IntentResolution is primary. TutorTurnContext is supporting.
// Message signals are fallback only. No keyword-only routing.
// ─────────────────────────────────────────────────────────────

import type { VideoChatTriggerResult, VideoChatTriggerReason } from './videoChatIntegrationContracts';
import type { TutorIntentResolution } from './intentResolverContracts';
import type { TutorTurnContext } from './tutorStateContracts';

const VIDEO_KEYWORD_PATTERNS = [
  /\bvideo\b/i,
  /\blesson video\b/i,
  /\byoutube\s+lesson\b/i,
  /\banimation\b/i,
  /\bvisual\s+explanation\b/i,
  /\bwatch\b/i,
  /\bshow\s+me\s+a\s+video\b/i,
  /\brecommend\s+a\s+video\b/i,
  /\bfind\s+me\s+a\s+video\b/i,
];

const VIDEO_AVOID_INTENTS = new Set([
  'unsafe',
  'unsupported',
  'clarification_needed',
]);

export class VideoChatTriggerService {
  /**
   * Determine whether video recommendation should be triggered.
   */
  shouldTriggerVideoRecommendation(input: {
    message: string;
    intentResolution: TutorIntentResolution | null;
    tutorContext: TutorTurnContext | null;
    activeArtifactIds?: string[];
    hasPracticeWeakness?: boolean;
  }): VideoChatTriggerResult {
    const reasons: VideoChatTriggerReason[] = [];
    const warnings: string[] = [];
    let confidence = 0;
    let shouldTrigger = false;

    const intent = input.intentResolution;
    const message = String(input.message || '').trim();

    // ── Rule 1: IntentResolution is primary ──
    if (intent) {
      const primaryIntent = intent.primaryIntent;
      const taskKind = intent.task?.taskKind;

      // Skip if unsafe/unsupported/clarification needed
      if (VIDEO_AVOID_INTENTS.has(primaryIntent) || intent.status === 'unsafe' || intent.status === 'unsupported') {
        return {
          shouldTrigger: false,
          reasons: ['not_triggered'],
          confidence: 0,
          warnings: ['Intent is unsafe or unsupported — video recommendation skipped.'],
        };
      }

      // Primary intent triggers
      if (primaryIntent === 'video_help') {
        reasons.push('intent_video_help');
        confidence = Math.max(confidence, 0.9);
      }

      if (taskKind === 'explain_video_context') {
        reasons.push('task_video_context');
        confidence = Math.max(confidence, 0.85);
      }

      // Artifact-linked video support
      if (primaryIntent === 'artifact_help' || primaryIntent === 'artifact_question_help') {
        const hasArtifact = (input.activeArtifactIds?.length ?? 0) > 0;
        if (hasArtifact && VIDEO_KEYWORD_PATTERNS.some((p) => p.test(message))) {
          reasons.push('artifact_video_support');
          confidence = Math.max(confidence, 0.75);
        }
      }

      // Practice/mastery-linked video support
      if (primaryIntent === 'next_practice' || primaryIntent === 'practice') {
        if (input.hasPracticeWeakness) {
          reasons.push('practice_mastery_video_support');
          confidence = Math.max(confidence, 0.7);
        }
      }
    }

    // ── Rule 2: Message signals as fallback ──
    if (reasons.length === 0) {
      const keywordMatchCount = VIDEO_KEYWORD_PATTERNS.filter((p) => p.test(message)).length;

      if (keywordMatchCount >= 2) {
        // Strong keyword signal — treat as message_video_request
        reasons.push('message_video_request');
        confidence = Math.max(confidence, 0.5);
        warnings.push('Video recommendation triggered by message keywords — consider verifying intent.');
      } else if (keywordMatchCount === 1 && /\b(video|youtube)\b/i.test(message)) {
        // Single keyword — only trigger if context supports it
        if (intent?.primaryIntent === 'general_chat' || !intent) {
          // Weak signal — don't trigger on single keyword alone without intent
          // Return not_triggered to avoid keyword-only routing
        } else {
          reasons.push('message_video_request');
          confidence = Math.max(confidence, 0.4);
          warnings.push('Video recommendation triggered by keyword with supporting intent context.');
        }
      }
    }

    // ── Compute final decision ──
    shouldTrigger = reasons.length > 0 && reasons[0] !== 'not_triggered';

    // If topic is missing and not artifact-linked, recommend clarification
    const topicMissing = !input.tutorContext?.session?.activeTopic &&
      !input.tutorContext?.tutorState?.activeTopic &&
      !input.activeArtifactIds?.length;

    if (shouldTrigger && topicMissing && !reasons.includes('artifact_video_support') && !reasons.includes('practice_mastery_video_support')) {
      warnings.push('Topic is missing — video recommendation may lack focus.');
      // Still trigger but add warning; the request builder will handle missing topic
    }

    return {
      shouldTrigger,
      reasons: shouldTrigger ? reasons : ['not_triggered'],
      confidence,
      warnings,
    };
  }
}

export const videoChatTriggerService = new VideoChatTriggerService();
