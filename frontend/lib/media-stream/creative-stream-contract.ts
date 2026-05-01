import type { MediaInteractionAction } from '@/lib/types';

export type CreativeContractSourceType = 'youtube' | 'vimeo';
export type CreativeContractRole = 'spark' | 'notice' | 'reframe' | 'transfer' | 'deepen';
export type CreativeContractActionId =
  | 'save_to_revision'
  | 'more_like_this'
  | 'explain_simply'
  | 'similar_topic'
  | 'open_longer_lesson'
  | 'quick_check'
  | 'what_changed'
  | 'try_new_angle';

export type CreativeContractAction = {
  id: CreativeContractActionId;
  label: string;
};

export type CreativeContractInteraction = {
  overline: string;
  overlayText: string;
  primaryAction: CreativeContractAction;
  secondaryActions: CreativeContractAction[];
  nextCueTitle: string;
  nextCueBody: string;
};

const CREATIVE_ACTION_IDS = new Set<CreativeContractActionId>([
  'save_to_revision',
  'more_like_this',
  'explain_simply',
  'similar_topic',
  'open_longer_lesson',
  'quick_check',
  'what_changed',
  'try_new_angle',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function compactText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...` : normalized;
}

function fallbackActionLabel(id: CreativeContractActionId): string {
  switch (id) {
    case 'save_to_revision':
      return 'Save idea';
    case 'more_like_this':
      return 'More like this';
    case 'explain_simply':
      return 'Explain simply';
    case 'similar_topic':
      return 'Similar topic';
    case 'open_longer_lesson':
      return 'Longer version';
    case 'quick_check':
      return 'Quick check';
    case 'what_changed':
      return 'What changed?';
    case 'try_new_angle':
      return 'Try a new angle';
    default:
      return 'Continue';
  }
}

function parseCreativeAction(value: unknown): CreativeContractAction | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = compactText(record.id, 48) as CreativeContractActionId | null;
  if (!id || !CREATIVE_ACTION_IDS.has(id)) return null;
  return {
    id,
    label: compactText(record.label, 48) || fallbackActionLabel(id),
  };
}

export function parseCreativeContractInteraction(
  metadata: Record<string, unknown> | null | undefined
): CreativeContractInteraction | null {
  const interaction = asRecord(metadata?.interaction);
  if (!interaction) return null;
  const primaryAction = parseCreativeAction(interaction.primaryAction);
  if (!primaryAction) return null;
  const secondaryActions = Array.isArray(interaction.secondaryActions)
    ? interaction.secondaryActions
        .map((entry) => parseCreativeAction(entry))
        .filter((entry): entry is CreativeContractAction => Boolean(entry))
        .filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index)
        .slice(0, 3)
    : [];
  return {
    overline: compactText(interaction.overline, 32) || 'SPARK',
    overlayText: compactText(interaction.overlayText, 180) || 'Find the angle that makes this concept easier to picture.',
    primaryAction,
    secondaryActions,
    nextCueTitle: compactText(interaction.nextCueTitle, 36) || 'Next idea',
    nextCueBody: compactText(interaction.nextCueBody, 180) || 'Carry this insight into one short follow-up before moving on.',
  };
}

export function resolveCreativeContractSourceType(args: {
  videoProvider?: string | null;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}): CreativeContractSourceType | null {
  const providerHint = [
    args.videoProvider,
    typeof args.metadata?.externalProvider === 'string' ? args.metadata.externalProvider : null,
    typeof args.metadata?.externalSourceType === 'string' ? args.metadata.externalSourceType : null,
    args.sourceUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (providerHint.includes('youtube') || providerHint.includes('youtu.be')) return 'youtube';
  if (providerHint.includes('vimeo')) return 'vimeo';
  return null;
}

export function resolveCreativeContractRole(metadata: Record<string, unknown> | null | undefined): CreativeContractRole {
  const roleHint = [
    typeof metadata?.externalRole === 'string' ? metadata.externalRole : null,
    typeof metadata?.creativityType === 'string' ? metadata.creativityType : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (roleHint.includes('notice')) return 'notice';
  if (roleHint.includes('reframe')) return 'reframe';
  if (roleHint.includes('transfer')) return 'transfer';
  if (roleHint.includes('deepen') || roleHint.includes('logic')) return 'deepen';
  return 'spark';
}

export function resolveCreativeContractTrustLabel(args: {
  sourceType: CreativeContractSourceType;
  metadata?: Record<string, unknown> | null;
}): string {
  const trustTier = compactText(args.metadata?.trustTier, 24);
  const sourceLabel = args.sourceType === 'youtube' ? 'YouTube' : 'Vimeo';
  if (!trustTier) return `Trusted source: ${sourceLabel}`;
  return `${sourceLabel} ${trustTier} trust`;
}

export function mapCreativeContractActionToMediaInteraction(id: CreativeContractActionId): MediaInteractionAction {
  switch (id) {
    case 'save_to_revision':
      return 'save_to_revision';
    case 'more_like_this':
      return 'show_more_like_this';
    case 'explain_simply':
      return 'explain_simply';
    case 'similar_topic':
      return 'similar_topic';
    case 'open_longer_lesson':
      return 'open_long_lesson';
    case 'what_changed':
      return 'explain_simply';
    case 'try_new_angle':
      return 'similar_topic';
    case 'quick_check':
    default:
      return 'quick_check';
  }
}
