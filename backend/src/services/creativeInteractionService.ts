import type {
  CreativeActionId,
  CreativeDeckRequest,
  CreativeInteractionModel,
  CreativeScoredCandidate,
} from './creativeStreamTypes';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function humanizeTopic(card: CreativeScoredCandidate): string {
  return safeString(card.topic || card.title).trim() || 'this concept';
}

function defaultOverlay(card: CreativeScoredCandidate): { overline: string; text: string } {
  const topic = humanizeTopic(card);
  if (card.creativityType === 'reframe') {
    return {
      overline: 'TRY THIS ANGLE',
      text: `Instead of asking what disappears, ask what gets rearranged in ${topic}.`,
    };
  }
  if (card.creativityType === 'notice') {
    return {
      overline: 'WHAT TO NOTICE',
      text: `Watch for the pattern that stays stable when ${topic} changes surface details.`,
    };
  }
  if (card.creativityType === 'transfer') {
    return {
      overline: 'TRY A NEW CASE',
      text: `Use the same idea from ${topic} in one unfamiliar example before moving on.`,
    };
  }
  if (card.creativityType === 'deepen') {
    return {
      overline: 'GO DEEPER',
      text: `Pause and explain why each step in ${topic} works before continuing.`,
    };
  }
  return {
    overline: 'SPARK',
    text: `Find the one visual cue that makes ${topic} feel intuitive.`,
  };
}

function resolvePrimaryAction(card: CreativeScoredCandidate): { id: CreativeActionId; label: string } {
  if (card.creativityType === 'reframe') return { id: 'what_changed', label: 'What changed?' };
  if (card.creativityType === 'transfer') return { id: 'try_new_angle', label: 'Try a new case' };
  if (card.creativityType === 'deepen') return { id: 'open_longer_lesson', label: 'Open longer lesson' };
  if (card.creativityType === 'notice') return { id: 'quick_check', label: 'Quick check' };
  return { id: 'try_new_angle', label: 'Try this angle' };
}

function pickSecondaryActions(card: CreativeScoredCandidate): Array<{ id: CreativeActionId; label: string }> {
  const map: Record<CreativeActionId, string> = {
    save_to_revision: 'Save idea',
    more_like_this: 'More like this',
    explain_simply: 'Explain simply',
    similar_topic: 'Similar topic',
    open_longer_lesson: 'Longer version',
    quick_check: 'Quick check',
    what_changed: 'What changed?',
    try_new_angle: 'Try a new angle',
  };
  const defaults: CreativeActionId[] = ['more_like_this', 'save_to_revision', 'open_longer_lesson'];
  const candidates = [...card.actionsAvailable, ...defaults];
  const unique = Array.from(new Set(candidates))
    .filter((id) => id !== resolvePrimaryAction(card).id)
    .slice(0, 3);
  return unique.map((id) => ({ id, label: map[id] || id }));
}

function nextCue(card: CreativeScoredCandidate, request: CreativeDeckRequest): { title: string; body: string } {
  const topic = humanizeTopic(card);
  const activeTopic = safeString(request.activeTopic || request.topic).trim();
  if (card.creativityType === 'reframe') {
    return {
      title: 'Next idea',
      body: `See how the same pattern shows up in ${activeTopic || topic} when salts form.`,
    };
  }
  if (card.creativityType === 'transfer') {
    return {
      title: 'Next idea',
      body: `Compare this with a second case where ${topic} appears in daily life.`,
    };
  }
  return {
    title: 'Next idea',
    body: `Carry this insight into one quick check before opening the next card.`,
  };
}

export function buildCreativeInteractionModel(
  card: CreativeScoredCandidate,
  request: CreativeDeckRequest
): CreativeInteractionModel {
  const overlay = defaultOverlay(card);
  const primary = resolvePrimaryAction(card);
  const secondary = pickSecondaryActions(card);
  const next = nextCue(card, request);
  return {
    overline: overlay.overline,
    overlayText: overlay.text,
    primaryAction: primary,
    secondaryActions: secondary,
    nextCueTitle: next.title,
    nextCueBody: next.body,
  };
}
