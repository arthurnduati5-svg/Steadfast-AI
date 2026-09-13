import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import type { CurriculumSubjectContext, CurriculumTopicContext } from './curriculumRuntimeContracts';
import { cambridgeSubjectSeeds } from './curriculumSeeds/cambridgeSubjectSeeds';
import { cambridgeTopicSeeds } from './curriculumSeeds/cambridgeTopicSeeds';
import { madrasaDeenSubjectSeeds } from './curriculumSeeds/madrasaDeenSubjectSeeds';
import { madrasaDeenTopicSeeds } from './curriculumSeeds/madrasaDeenTopicSeeds';

const allSubjectSeeds = [...cambridgeSubjectSeeds, ...madrasaDeenSubjectSeeds];
const allTopicSeeds = [...cambridgeTopicSeeds, ...madrasaDeenTopicSeeds];

export function findSubjectById(subjectId: string): CurriculumSubjectContext | null {
  const seed = allSubjectSeeds.find(s => s.subjectId === subjectId);
  if (!seed) return null;
  return seedToSubjectContext(seed);
}

export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "'")
    .replace(/[^a-z0-9' _-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchSubject(input: {
  text?: string;
  subjectHint?: string;
  curriculumTrack?: CurriculumTrack;
}): CurriculumSubjectContext | null {
  const { text, subjectHint, curriculumTrack } = input;
  const rawText = text || '';
  const rawHint = subjectHint || '';
  const combined = `${rawText} ${rawHint}`.trim();

  if (!combined) return null;

  const normalized = normalizeText(combined);

  let candidates = allSubjectSeeds;

  if (curriculumTrack && curriculumTrack !== 'unknown' && curriculumTrack !== 'mixed_academic_deen') {
    candidates = allSubjectSeeds.filter(s => s.curriculumTrack === curriculumTrack);
  }

  for (const seed of candidates) {
    const normalizedName = normalizeText(seed.name);
    if (normalized === normalizedName || normalized.includes(normalizedName)) {
      return seedToSubjectContext(seed);
    }

    for (const alias of seed.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized === normalizedAlias || normalized.includes(normalizedAlias)) {
        return seedToSubjectContext(seed);
      }
    }
  }

  if (!curriculumTrack || curriculumTrack === 'unknown' || curriculumTrack === 'mixed_academic_deen') {
    for (const seed of allSubjectSeeds) {
      const normalizedName = normalizeText(seed.name);
      if (normalized === normalizedName || normalized.includes(normalizedName)) {
        return seedToSubjectContext(seed);
      }
    }
  }

  return null;
}

export function matchTopic(input: {
  text?: string;
  topicHint?: string;
  subjectId?: string;
  curriculumTrack?: CurriculumTrack;
}): CurriculumTopicContext | null {
  const { text, topicHint, subjectId, curriculumTrack } = input;
  const rawText = text || '';
  const rawHint = topicHint || '';
  const combined = `${rawText} ${rawHint}`.trim();

  if (!combined) return null;

  const normalized = normalizeText(combined);

  let candidates = allTopicSeeds;

  if (subjectId) {
    candidates = allTopicSeeds.filter(t => t.subjectId === subjectId);
  }

  if (curriculumTrack && curriculumTrack !== 'unknown' && curriculumTrack !== 'mixed_academic_deen') {
    const trackSubjectIds = allSubjectSeeds
      .filter(s => s.curriculumTrack === curriculumTrack)
      .map(s => s.subjectId);
    candidates = candidates.filter(t => trackSubjectIds.includes(t.subjectId));
  }

  for (const seed of candidates) {
    const normalizedTitle = normalizeText(seed.title);
    if (normalized === normalizedTitle || normalized.includes(normalizedTitle) || normalizedTitle.includes(normalized)) {
      return seedToTopicContext(seed);
    }

    for (const alias of seed.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized === normalizedAlias || normalized.includes(normalizedAlias)) {
        return seedToTopicContext(seed);
      }
    }
  }

  return null;
}

function seedToSubjectContext(seed: typeof allSubjectSeeds[number]): CurriculumSubjectContext {
  return {
    subjectId: seed.subjectId,
    name: seed.name,
    normalizedName: normalizeText(seed.name),
    curriculumTrack: seed.curriculumTrack,
    category: seed.category,
    aliases: [...seed.aliases],
  };
}

function seedToTopicContext(seed: typeof allTopicSeeds[number]): CurriculumTopicContext {
  return {
    topicId: seed.topicId,
    subjectId: seed.subjectId,
    title: seed.title,
    normalizedTitle: normalizeText(seed.title),
    gradeBands: [...seed.gradeBands],
    levels: [...seed.levels],
    aliases: [...seed.aliases],
    learningObjectives: [...seed.learningObjectives],
    prerequisites: [...seed.prerequisites],
    commonMistakes: [...seed.commonMistakes],
    sourceConfidence: seed.sourceConfidence,
    deenSensitivityLevel: seed.deenSensitivityLevel,
  };
}
