import type {
  Message,
  MetacognitivePrompt,
  MetacognitivePromptType,
  WeakTopicRecoveryState,
} from './types';
import { resolveAssistantEnvelopeMetadata } from './assistant-envelope';

const LEGACY_FULL_REFLECT_TYPES = new Set<MetacognitivePromptType>([
  'weak_topic_recovery',
  'progress_check',
  'revision_recheck',
  'inspect_step',
  'choose_support',
  'locate_error',
  'transfer_learning',
  'explain_success',
  'practice_readiness',
]);

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function buildLegacyPrompt(message: Message): MetacognitivePrompt | null {
  const presentation = resolveAssistantEnvelopeMetadata((message.metadata as any) || null).presentation;
  if (!presentation?.reflectionPrompt) return null;
  return {
    type: presentation.reflectionPromptType || 'check_confidence',
    text: presentation.reflectionPrompt,
    topicMastery: presentation.topicMastery || null,
    weakTopicRecovery: presentation.weakTopicRecovery || null,
  };
}

function isLegacyFullPrompt(prompt: MetacognitivePrompt | null): boolean {
  if (!prompt?.type) return false;
  return LEGACY_FULL_REFLECT_TYPES.has(prompt.type);
}

export function resolveLatestReflectionMessageKey(messages: Message[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'model') continue;
    const presentation = resolveAssistantEnvelopeMetadata((message.metadata as any) || null).presentation;
    const reflectLevel = normalizeText(presentation?.reflectLevel || '');
    const prompt =
      (presentation?.reflectCard as MetacognitivePrompt | null | undefined) ||
      buildLegacyPrompt(message);
    const hasPrompt = Boolean(prompt);
    if (!hasPrompt) continue;
    if (reflectLevel === 'full') {
      return message.id || `idx-${index}`;
    }
    if (!reflectLevel && isLegacyFullPrompt(prompt)) {
      return message.id || `idx-${index}`;
    }
  }
  return null;
}

export function resolveReflectionSurface(args: {
  message: Message;
  showReflectionPrompt?: boolean;
}): {
  reflectionPrompt: MetacognitivePrompt | null;
  weakTopicRecovery: WeakTopicRecoveryState | null;
  reflectLevel: 'silent' | 'inline' | 'full';
} {
  const presentation = resolveAssistantEnvelopeMetadata((args.message.metadata as any) || null).presentation;
  const reflectLevelRaw = normalizeText(presentation?.reflectLevel || '');
  const reflectLevel: 'silent' | 'inline' | 'full' =
    reflectLevelRaw === 'inline' || reflectLevelRaw === 'full'
      ? reflectLevelRaw
      : 'silent';

  const fullPrompt =
    (presentation?.reflectCard as MetacognitivePrompt | null | undefined) ||
    buildLegacyPrompt(args.message);
  const legacyFull = !reflectLevelRaw && isLegacyFullPrompt(fullPrompt || null);
  const shouldShowFull = Boolean(args.showReflectionPrompt) && Boolean(fullPrompt) && (reflectLevel === 'full' || legacyFull);
  const weakTopicRecovery =
    !shouldShowFull
      ? ((presentation?.weakTopicRecovery as WeakTopicRecoveryState | null | undefined) ||
        (fullPrompt?.weakTopicRecovery as WeakTopicRecoveryState | null | undefined) ||
        null)
      : null;

  return {
    reflectionPrompt: shouldShowFull ? (fullPrompt || null) : null,
    weakTopicRecovery,
    reflectLevel,
  };
}
