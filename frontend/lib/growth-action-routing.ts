import type {
  FullscreenCopilotDestination,
  FullscreenGrowthSection,
  GrowthActionPlan,
  MediaWorkspaceMode,
  RevisionItem,
} from '@/lib/types';
import { readLearningSignalsFromRevisionItem } from '@/lib/learning-signals';

type GrowthPlanExecutionHandlers = {
  onOpenRevisionItem: (item: RevisionItem) => void;
  onOpenMediaItem: (item: RevisionItem, mode?: MediaWorkspaceMode | null) => void;
  onOpenPrompt: (prompt: string, intent?: string) => void;
  onDestinationChange: (destination: FullscreenCopilotDestination) => void;
  onMediaModeChange?: (mode: MediaWorkspaceMode) => void;
  onGrowthSectionChange?: (section: FullscreenGrowthSection) => void;
};

export type GrowthPlanExecutionResult = {
  executed: boolean;
  destination: FullscreenCopilotDestination;
  targetItemId: string | null;
  prompt: string | null;
  reason: string;
};

function normalizeText(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

export function buildGrowthPlanPromptFallback(plan: GrowthActionPlan): string {
  const topicOrTitle = String(plan.topic || plan.title || 'my current weak topic').trim();
  if (plan.intent === 'quiz_me') {
    return `Quiz me on ${topicOrTitle} with one question at a time and short feedback.`;
  }
  if (plan.intent === 'simpler_example') {
    return `Give me one simpler worked example for ${topicOrTitle}, then ask one transfer check.`;
  }
  if (plan.intent === 'continue_plan') {
    return `Continue my study plan for ${topicOrTitle} with one milestone and one checkpoint.`;
  }
  if (plan.intent === 'start_guided_session') {
    return `Start a focused guided session on ${topicOrTitle} with one clear next move.`;
  }
  if (plan.intent === 'similar_question' || plan.intent === 'practice_again') {
    return `Give me one similar question for ${topicOrTitle} and then check my answer.`;
  }
  return `Help me progress on ${topicOrTitle} with one practical next step.`;
}

export function findGrowthPlanRevisionTarget(plan: GrowthActionPlan, revisionItems: RevisionItem[]): RevisionItem | null {
  if (!revisionItems.length) return null;
  const normalizedTopic = normalizeText(plan.topic);
  const normalizedTitle = normalizeText(plan.title);

  const byId = plan.revisionItemId
    ? revisionItems.find((item) => item.id === plan.revisionItemId) || null
    : null;
  if (byId) return byId;

  if (normalizedTopic) {
    const byTopic = revisionItems.find((item) => {
      const topic = normalizeText(item.topic);
      const subtopic = normalizeText(item.subtopic);
      const title = normalizeText(item.title);
      return topic.includes(normalizedTopic) || subtopic.includes(normalizedTopic) || title.includes(normalizedTopic);
    }) || null;
    if (byTopic) return byTopic;
  }

  if (normalizedTitle) {
    const byTitle = revisionItems.find((item) => normalizeText(item.title).includes(normalizedTitle)) || null;
    if (byTitle) return byTitle;
  }

  return revisionItems[0] || null;
}

function mapGrowthPlanToSection(plan: GrowthActionPlan): FullscreenGrowthSection {
  if (plan.intent === 'continue_plan') return 'study_plans';
  if (plan.intent === 'quiz_me' || plan.intent === 'practice_again' || plan.intent === 'similar_question') return 'daily_feed';
  if (plan.intent === 'view_worked_step' || plan.intent === 'review_recap') return 'weak_topics';
  return 'overview';
}

export function executeGrowthActionPlan(
  plan: GrowthActionPlan,
  revisionItems: RevisionItem[],
  handlers: GrowthPlanExecutionHandlers
): GrowthPlanExecutionResult {
  const targetItem = findGrowthPlanRevisionTarget(plan, revisionItems);
  const destination = plan.destination;
  const targetSignals = targetItem ? readLearningSignalsFromRevisionItem(targetItem) : null;

  if (destination === 'revision') {
    if (targetItem) {
      handlers.onOpenRevisionItem(targetItem);
      return {
        executed: true,
        destination,
        targetItemId: targetItem.id,
        prompt: null,
        reason: 'Opened revision target item from growth plan.',
      };
    }
    handlers.onDestinationChange('revision');
    return {
      executed: true,
      destination,
      targetItemId: null,
      prompt: null,
      reason: 'Opened revision workspace without a specific target item.',
    };
  }

  if (destination === 'media') {
    const mediaMode = plan.mediaMode || null;
    if (targetItem) {
      handlers.onOpenMediaItem(targetItem, mediaMode);
      return {
        executed: true,
        destination,
        targetItemId: targetItem.id,
        prompt: null,
        reason: 'Opened media workspace with a linked revision target.',
      };
    }
    if (mediaMode) {
      handlers.onMediaModeChange?.(mediaMode);
    }
    handlers.onDestinationChange('media');
    return {
      executed: true,
      destination,
      targetItemId: null,
      prompt: null,
      reason: 'Opened media workspace without a linked revision target.',
    };
  }

  if (destination === 'new_session') {
    const prompt =
      String(plan.prompt || '').trim() ||
      (targetSignals
        ? `Coach me on ${targetItem?.topic || targetItem?.title || plan.topic || plan.title || 'this topic'}. Next best support: ${targetSignals.nextBestSupport.label}. ${targetSignals.coachNote}`
        : buildGrowthPlanPromptFallback(plan));
    handlers.onOpenPrompt(prompt, plan.composerIntent || `growth_${plan.intent}`);
    return {
      executed: true,
      destination,
      targetItemId: targetItem?.id || null,
      prompt,
      reason: 'Opened a new tutor session with a growth prompt.',
    };
  }

  if (destination === 'growth') {
    handlers.onDestinationChange('growth');
    handlers.onGrowthSectionChange?.(mapGrowthPlanToSection(plan));
    return {
      executed: true,
      destination: 'growth',
      targetItemId: targetItem?.id || null,
      prompt: null,
      reason: 'Stayed in Growth and focused the most relevant section.',
    };
  }

  if (destination === 'exam' || destination === 'focus') {
    handlers.onDestinationChange(destination);
    return {
      executed: true,
      destination,
      targetItemId: targetItem?.id || null,
      prompt: null,
      reason: `Opened ${destination} workspace from growth plan.`,
    };
  }

  handlers.onDestinationChange('growth');
  return {
    executed: true,
    destination: 'growth',
    targetItemId: targetItem?.id || null,
    prompt: null,
    reason: 'Fallback routed to Growth workspace.',
  };
}
