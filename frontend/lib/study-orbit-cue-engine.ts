import type { StudyOrbitStage } from '@/lib/study-orbit-tracking';

export type StudyOrbitCueKind = 'notice' | 'check' | 'reflect' | 'memory_anchor' | 'unlock_next' | 'why_now';

export interface StudyOrbitPrimaryCue {
  kind: StudyOrbitCueKind;
  label: string;
  value: string;
  secondaryLabel: string | null;
  secondaryValue: string | null;
}

export interface StudyOrbitCueContext {
  stage: StudyOrbitStage;
  focusLine: string;
  checkLine: string;
  anchorLine: string;
  whyNowLine: string;
  reflectionLine: string;
  unlockLine: string;
}

export interface StudyOrbitLineupSignalInput {
  isNext: boolean;
  position: number;
  stage: StudyOrbitStage;
  weakAssist: boolean;
  checkLine: string;
  unlockLine: string;
  reason?: string | null;
  nextMove?: string | null;
}

export interface StudyOrbitLineupSignal {
  kicker: string;
  purpose: string;
}

const STAGE_STEPS = [
  { id: 'orienting', label: 'Orient' },
  { id: 'attempting', label: 'Try' },
  { id: 'reflecting', label: 'Explain' },
  { id: 'solidifying', label: 'Keep' },
  { id: 'ready_to_unlock', label: 'Unlock' },
] as const;

type StageStep = (typeof STAGE_STEPS)[number];

const CUE_LABELS: Record<StudyOrbitCueKind, string> = {
  notice: 'Notice',
  check: 'Check',
  reflect: 'What changed?',
  memory_anchor: 'Memory anchor',
  unlock_next: 'Next unlock',
  why_now: 'Why now',
};

function normalizeCueValue(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeCueValue(value)
      .split(' ')
      .filter((token) => token.length >= 3)
  );
}

function isNearDuplicateCueText(a: string, b: string): boolean {
  const left = normalizeCueValue(a);
  const right = normalizeCueValue(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const aTokens = tokenSet(left);
  const bTokens = tokenSet(right);
  if (!aTokens.size || !bTokens.size) return false;
  let overlap = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) overlap += 1;
  });
  const denominator = Math.max(aTokens.size, bTokens.size);
  return denominator > 0 ? overlap / denominator >= 0.76 : false;
}

function asCueCandidate(kind: StudyOrbitCueKind, value: string): { kind: StudyOrbitCueKind; value: string } {
  return {
    kind,
    value: String(value || '').trim(),
  };
}

function resolvePrimaryCueOrder(stage: StudyOrbitStage): StudyOrbitCueKind[] {
  if (stage === 'ready_to_unlock') return ['unlock_next', 'memory_anchor', 'check', 'reflect', 'notice', 'why_now'];
  if (stage === 'solidifying') return ['memory_anchor', 'check', 'reflect', 'notice', 'why_now', 'unlock_next'];
  if (stage === 'reflecting') return ['reflect', 'check', 'notice', 'memory_anchor', 'why_now', 'unlock_next'];
  if (stage === 'attempting') return ['check', 'notice', 'reflect', 'memory_anchor', 'why_now', 'unlock_next'];
  return ['notice', 'why_now', 'check', 'memory_anchor', 'reflect', 'unlock_next'];
}

function buildCueCandidates(context: StudyOrbitCueContext): Array<{ kind: StudyOrbitCueKind; value: string }> {
  return [
    asCueCandidate('notice', context.focusLine),
    asCueCandidate('check', context.checkLine),
    asCueCandidate('reflect', context.reflectionLine),
    asCueCandidate('memory_anchor', context.anchorLine),
    asCueCandidate('unlock_next', context.unlockLine),
    asCueCandidate('why_now', context.whyNowLine),
  ].filter((candidate) => candidate.value.length > 0);
}

export function selectStudyOrbitPrimaryCue(context: StudyOrbitCueContext): StudyOrbitPrimaryCue {
  const cueMap = new Map(buildCueCandidates(context).map((cue) => [cue.kind, cue.value]));
  const orderedKinds = resolvePrimaryCueOrder(context.stage);
  const primaryKind = orderedKinds.find((kind) => cueMap.has(kind)) || 'notice';
  const primaryValue = cueMap.get(primaryKind) || context.focusLine || context.anchorLine || context.checkLine;

  const secondaryKind = orderedKinds.find((kind) => {
    if (kind === primaryKind) return false;
    const candidate = cueMap.get(kind);
    if (!candidate) return false;
    return !isNearDuplicateCueText(primaryValue, candidate);
  });

  const secondaryValue = secondaryKind ? cueMap.get(secondaryKind) || null : null;
  return {
    kind: primaryKind,
    label: CUE_LABELS[primaryKind],
    value: primaryValue,
    secondaryLabel: secondaryKind ? CUE_LABELS[secondaryKind] : null,
    secondaryValue,
  };
}

export function buildStudyOrbitStageSentence(stage: StudyOrbitStage): string {
  if (stage === 'ready_to_unlock') return 'You are ready to unlock the next layer.';
  if (stage === 'solidifying') return 'Keep one clean explanation to lock this in.';
  if (stage === 'reflecting') return 'Name what changed in your thinking.';
  if (stage === 'attempting') return 'One quick check will move this forward.';
  return 'You are just getting started with this idea.';
}

function buildPurposeFromText(input?: string | null): string | null {
  const normalized = normalizeCueValue(input || '');
  if (!normalized) return null;
  if (/(test|check|quiz|question)/.test(normalized)) return 'test the idea';
  if (/(apply|different|another|similar|transfer|case)/.test(normalized)) return 'apply it differently';
  if (/(keep|remember|anchor|lock|revision|retain)/.test(normalized)) return 'lock it in';
  if (/(why|because|reason|explain)/.test(normalized)) return 'explain why it works';
  return null;
}

function buildDefaultPurpose(stage: StudyOrbitStage, weakAssist: boolean): string {
  if (weakAssist) return 'repair the weak spot';
  if (stage === 'ready_to_unlock' || stage === 'solidifying') return 'lock it in';
  if (stage === 'reflecting') return 'explain what changed';
  return 'test the idea';
}

export function buildStudyOrbitLineupSignal(input: StudyOrbitLineupSignalInput): StudyOrbitLineupSignal {
  const sequenceKicker = input.isNext ? 'Next' : input.position === 1 ? 'Then' : 'Later';
  const purpose =
    buildPurposeFromText(input.nextMove) ||
    buildPurposeFromText(input.checkLine) ||
    buildPurposeFromText(input.unlockLine) ||
    buildPurposeFromText(input.reason) ||
    buildDefaultPurpose(input.stage, input.weakAssist);

  return {
    kicker: sequenceKicker,
    purpose,
  };
}

export function getStudyOrbitStageSteps(): StageStep[] {
  return [...STAGE_STEPS];
}

export function getStudyOrbitStageStepIndex(stage: StudyOrbitStage): number {
  return STAGE_STEPS.findIndex((step) => step.id === stage);
}
