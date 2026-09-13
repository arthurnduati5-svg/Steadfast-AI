import type { CurriculumTrack } from './schoolAuthBridgeContracts';
import type { CurriculumConfidence, CurriculumResolveInput } from './curriculumRuntimeContracts';
import { cambridgeSubjectSeeds } from './curriculumSeeds/cambridgeSubjectSeeds';
import { madrasaDeenSubjectSeeds } from './curriculumSeeds/madrasaDeenSubjectSeeds';

interface TrackResolution {
  curriculumTrack: CurriculumTrack;
  confidence: CurriculumConfidence;
  reason: string;
}

const ACADEMIC_KEYWORDS: string[] = [
  'math', 'maths', 'mathematics', 'algebra', 'geometry', 'calculus', 'arithmetic',
  'fractions', 'decimals', 'percentages', 'ratio', 'equations',
  'english', 'grammar', 'writing', 'reading', 'literacy', 'vocabulary', 'comprehension', 'essay',
  'science', 'physics', 'chemistry', 'biology', 'forces', 'energy', 'cells', 'atoms',
  'elements', 'mixtures', 'reactions', 'motion', 'electricity', 'waves',
  'photosynthesis', 'ecosystems', 'living things', 'materials', 'scientific method',
  'ict', 'computing', 'computer', 'coding', 'programming', 'internet safety', 'spreadsheets',
  'business', 'commerce', 'entrepreneurship', 'marketing', 'production',
  'statistics', 'stats', 'probability', 'data', 'averages', 'charts',
  'literature', 'poetry', 'prose', 'drama',
  'geography', 'history', 'map skills',
  'global perspectives', 'sustainability',
];

const DEEN_KEYWORDS: string[] = [
  'arabic', 'quran', 'qur\'an', 'qur’an', 'tajweed', 'hifdh', 'surah', 'ayat',
  'hadith', 'sunnah', 'seerah', 'sirah',
  'fiqh', 'wudu', 'salah', 'salat', 'prayer', 'zakat', 'fasting', 'sawm',
  'tawheed', 'aqeedah', 'iman',
  'tafsir', 'tadabbur',
  'adab', 'akhlaq', 'du\'a', 'dua', 'supplication',
  'islam', 'islamic', 'deen', 'muslim',
  'manners', 'character', 'respect', 'kindness', 'honesty',
];

const ENRICHMENT_KEYWORDS: string[] = [
  'critical thinking', 'problem solving', 'life skills', 'emotional intelligence',
  'study skills', 'public speaking', 'communication skills', 'creativity',
  'design thinking', 'digital citizenship', 'financial literacy', 'entrepreneurship',
  'health', 'hygiene', 'environment', 'leadership', 'media literacy',
  'moral intelligence', 'character development', 'practical wisdom',
  'study techniques', 'time management',
];

const MIXED_PATTERNS: { academic: RegExp; deen: RegExp }[] = [
  { academic: /fraction|percent|math/i, deen: /zakat|islamic|muslim/i },
  { academic: /essay|writing|composition/i, deen: /islamic|manners|muslim|adab/i },
  { academic: /science|biology|physics/i, deen: /allah|creation|islam|quran/i },
  { academic: /business|commerce/i, deen: /islam|ethics|muslim|halal/i },
  { academic: /history/i, deen: /islam|muslim|scholar|caliph/i },
];

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/['’]/g, "'").trim();
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const normalized = normalizeForMatch(text);
  return keywords.some(kw => normalized.includes(kw.toLowerCase()));
}

function detectMixedIntent(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return MIXED_PATTERNS.some(pattern =>
    pattern.academic.test(normalized) && pattern.deen.test(normalized)
  );
}

const allAcademicNames = cambridgeSubjectSeeds.map(s => s.name.toLowerCase());
const allAcademicAliases = cambridgeSubjectSeeds.flatMap(s => s.aliases.map(a => a.toLowerCase()));
const allDeenNames = madrasaDeenSubjectSeeds.map(s => s.name.toLowerCase());
const allDeenAliases = madrasaDeenSubjectSeeds.flatMap(s => s.aliases.map(a => a.toLowerCase()));

function hasAcademicSubjectReference(text: string): boolean {
  const normalized = normalizeForMatch(text);
  if (allAcademicNames.some(name => normalized.includes(name) || name.includes(normalized))) return true;
  return allAcademicAliases.some(alias => normalized.includes(alias) || alias.includes(normalized));
}

function hasDeenSubjectReference(text: string): boolean {
  const normalized = normalizeForMatch(text);
  if (allDeenNames.some(name => normalized.includes(name) || name.includes(normalized))) return true;
  return allDeenAliases.some(alias => normalized.includes(alias) || alias.includes(normalized));
}

export function resolveCurriculumTrack(input: CurriculumResolveInput): TrackResolution {
  const { messageText, subjectHint, topicHint, curriculumTrackHint } = input;

  if (curriculumTrackHint) {
    if (['cambridge_academic', 'madrasa_deen', 'mixed_academic_deen', 'general_enrichment', 'unknown'].includes(curriculumTrackHint)) {
      return {
        curriculumTrack: curriculumTrackHint,
        confidence: 'high',
        reason: `Explicit curriculumTrackHint provided: ${curriculumTrackHint}`,
      };
    }
  }

  const combinedText = [messageText || '', subjectHint || '', topicHint || '']
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!combinedText) {
    return {
      curriculumTrack: 'unknown',
      confidence: 'unknown',
      reason: 'No meaningful text to classify',
    };
  }

  if (detectMixedIntent(combinedText)) {
    return {
      curriculumTrack: 'mixed_academic_deen',
      confidence: 'medium',
      reason: 'Detected both academic and Islamic framing in request',
    };
  }

  const hasDeenSubjects = hasDeenSubjectReference(combinedText);
  const hasDeenKeywords = containsKeyword(combinedText, DEEN_KEYWORDS);
  const hasAcademicSubjects = hasAcademicSubjectReference(combinedText);
  const hasAcademicKeywords = containsKeyword(combinedText, ACADEMIC_KEYWORDS);
  const hasEnrichmentKeywords = containsKeyword(combinedText, ENRICHMENT_KEYWORDS);

  if (hasEnrichmentKeywords && !hasAcademicKeywords && !hasDeenKeywords && !hasDeenSubjects && !hasAcademicSubjects) {
    return {
      curriculumTrack: 'general_enrichment',
      confidence: 'medium',
      reason: 'Matched enrichment-related keywords',
    };
  }

  if (hasDeenSubjects || hasDeenKeywords) {
    if (hasAcademicSubjects || hasAcademicKeywords) {
      return {
        curriculumTrack: 'mixed_academic_deen',
        confidence: 'medium',
        reason: 'Contains both Deen and academic references',
      };
    }
    return {
      curriculumTrack: 'madrasa_deen',
      confidence: hasDeenSubjects ? 'high' : 'medium',
      reason: hasDeenSubjects
        ? 'Matched known Deen subject name'
        : 'Matched Deen-related keywords',
    };
  }

  if (hasAcademicSubjects || hasAcademicKeywords) {
    return {
      curriculumTrack: 'cambridge_academic',
      confidence: hasAcademicSubjects ? 'high' : 'medium',
      reason: hasAcademicSubjects
        ? 'Matched known Cambridge academic subject name'
        : 'Matched academic keywords',
    };
  }

  return {
    curriculumTrack: 'unknown',
    confidence: 'low',
    reason: 'Could not confidently classify into any curriculum track',
  };
}
