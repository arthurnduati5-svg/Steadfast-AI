import type { CurriculumResolveInput } from './curriculumRuntimeContracts';
import type { SubjectModuleProfile } from './subjectModuleContracts';
import type {
  SubjectModuleResolutionCandidate,
  SubjectModuleResolutionResult,
} from './subjectModuleResolverContracts';
import { listSubjectModules } from './subjectModuleRegistry';
import { resolveGradeBand, isKindergartenAge } from './gradeBandResolver';
import { normalizeText } from './subjectTopicMapper';

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/['’]/g, "'");
}

function scoreModule(
  module: SubjectModuleProfile,
  input: CurriculumResolveInput,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const messageText = input.messageText || '';
  const subjectHint = input.subjectHint || '';
  const topicHint = input.topicHint || '';
  const preferredLanguage = input.preferredLanguage || '';
  const combinedText = `${messageText} ${subjectHint} ${topicHint}`.toLowerCase().trim();

  if (input.requestedModuleId && input.requestedModuleId === module.moduleId) {
    score += 100;
    reasons.push('Exact module match by requestedModuleId (+100)');
  }

  const normalizedHint = normalize(subjectHint);
  const normalizedName = normalize(module.subjectName);
  if (normalizedHint && (normalizedHint === normalizedName || combinedText.includes(normalizedName))) {
    score += 80;
    reasons.push('Exact subjectHint match (+80)');
  }

  for (const alias of module.aliases) {
    const normalizedAlias = normalize(alias);
    if (normalizedHint && (normalizedHint === normalizedAlias || combinedText.includes(normalizedAlias))) {
      score += 60;
      reasons.push(`Alias match: "${alias}" (+60)`);
      break;
    }
  }

  if (!normalizedHint) {
    const normalizedName = normalize(module.subjectName);
    if (combinedText.includes(normalizedName)) {
      score += 40;
      reasons.push(`Message text contains subject name "${module.subjectName}" (+40)`);
    } else {
      for (const alias of module.aliases) {
        const normalizedAlias = normalize(alias);
        if (combinedText.includes(normalizedAlias)) {
          score += 30;
          reasons.push(`Message text matches alias "${alias}" (+30)`);
          break;
        }
      }
    }
  }

  const normalizedTopic = normalize(topicHint);
  for (const area of module.focusAreas) {
    const normalizedArea = normalize(area);
    if (normalizedTopic && (combinedText.includes(normalizedArea) || normalizedTopic.includes(normalizedArea))) {
      score += 45;
      reasons.push(`Topic hint matches focus area "${area}" (+45)`);
      break;
    }
  }

  for (const area of module.focusAreas) {
    const normalizedArea = normalize(area);
    if (combinedText.includes(normalizedArea)) {
      score += 35;
      reasons.push(`Message text matches focus area "${area}" (+35)`);
      break;
    }
  }

  const gradeBand = resolveGradeBand(input.learnerGrade);
  if (module.gradeBands.includes(gradeBand) || module.gradeBands.includes('general_all') || module.gradeBands.includes('deen_all')) {
    score += 30;
    reasons.push(`Grade band match (${gradeBand}) (+30)`);
  }

  if (input.curriculumTrackHint && module.curriculumTrack === input.curriculumTrackHint) {
    score += 25;
    reasons.push(`Curriculum track match (+25)`);
  }

  if (preferredLanguage) {
    const normalizedLang = normalize(preferredLanguage);
    const hasLangMode = module.languageModes.some(lm => {
      const modeStr = normalize(lm);
      if (normalizedLang === modeStr) return true;
      if (normalizedLang === 'en' || normalizedLang === 'english') {
        return modeStr === 'default';
      }
      if (normalizedLang.includes('swahili') || normalizedLang.includes('kiswahili')) {
        return modeStr.includes('bilingual') || modeStr.includes('swahili');
      }
      if (normalizedLang.includes('arab') || normalizedLang.includes('arabic')) {
        return modeStr.includes('arabic') || modeStr.includes('arab');
      }
      return false;
    });
    if (hasLangMode) {
      score += 15;
      reasons.push('Preferred language matches language mode (+15)');
    }
  }

  if (module.deenSensitivityLevel !== 'none' && module.deenSensitivityLevel !== 'unknown') {
    const deenHints = ['islam', 'muslim', 'allah', 'quran', 'qur\'an', 'deen', 'hadith', 'salah', 'wudhu', 'dua', 'sunnah', 'arabic'];
    if (deenHints.some(h => combinedText.includes(h))) {
      score += 10;
      reasons.push('Deen sensitivity hint match (+10)');
    }
  }

  if (gradeBand === 'kindergarten' && module.group !== 'kindergarten') {
    score -= 40;
    reasons.push('Grade band is kindergarten but module is not kindergarten (-40)');
  }

  if (gradeBand !== 'unknown' && gradeBand !== 'kindergarten' && module.group === 'kindergarten') {
    const age = input.learnerAge;
    const isYoung = age !== undefined && age >= 3 && age <= 6;
    if (!isYoung) {
      score -= 40;
      reasons.push('Learner is not kindergarten age but module is kindergarten (-40)');
    }
  }

  const hasEnrichmentContext = combinedText.includes('enrichment') || combinedText.includes('life skill') || combinedText.includes('life skills');
  if (module.status === 'recommended_enrichment' && !hasEnrichmentContext && !input.requestedModuleId) {
    score -= 60;
    reasons.push('Enrichment module not explicitly requested (-60)');
  }

  if (module.deenSensitivityLevel === 'source_required' || module.deenSensitivityLevel === 'scholar_referral_later') {
    const isDeenQuery = ['islam', 'muslim', 'allah', 'quran', 'hadith', 'fatwa', 'ruling'].some(h => combinedText.includes(h));
    if (isDeenQuery && module.group !== 'deen' && module.moduleId !== 'upper_islamic_religious_education') {
      score -= 80;
      reasons.push('Deen-sensitive query but non-Deen module (-80)');
    }
  }

  if (module.status === 'future_optional') {
    score -= 100;
    reasons.push('Module status is future_optional (-100)');
  }

  return { score, reasons };
}

function applyTieBreakers(
  candidates: SubjectModuleResolutionCandidate[],
  input: CurriculumResolveInput,
): SubjectModuleResolutionCandidate[] {
  const combinedText = `${input.messageText || ''} ${input.subjectHint || ''} ${input.topicHint || ''}`.toLowerCase();

  const hasResponsePhonics = ['phonics', 'letter sound', 'letter', 'alphabet'].some(h => combinedText.includes(h));
  const hasResponseMath = ['math', 'fraction', 'algebra', 'count', 'number'].some(h => combinedText.includes(h));
  const hasResponseBiology = ['cell', 'photosynthesis', 'human body', 'plant', 'ecosystem', 'biology'].some(h => combinedText.includes(h));
  const hasResponseChemistry = ['atom', 'element', 'reaction', 'chemistry', 'molecule'].some(h => combinedText.includes(h));
  const hasResponsePhysics = ['force', 'motion', 'energy', 'electricity', 'wave', 'physics'].some(h => combinedText.includes(h));
  const hasVerseExplanation = ['meaning', 'explain', 'what does quran say', 'tafsir', 'tell me about the verse'].some(h => combinedText.includes(h));
  const hasVerseReflection = ['reflect', 'lesson', 'life lesson', 'what can we learn', 'tadabbur'].some(h => combinedText.includes(h));
  const hasRecitationMemorization = ['recite', 'memorize', 'memorisation', 'pronunciation', 'surah'].some(h => combinedText.includes(h));
  const hasArabicIslamic = ['arabic meaning', 'islamic vocabulary', 'arabic phrase', 'what does'].some(h => combinedText.includes(h));

  const gradeBand = resolveGradeBand(input.learnerGrade);
  const isKindergarten = gradeBand === 'kindergarten' || isKindergartenAge(input.learnerAge);

  return candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;

    const aConfirmed = a.module.status === 'confirmed_school_subject' ? 1 : 0;
    const bConfirmed = b.module.status === 'confirmed_school_subject' ? 1 : 0;
    if (aConfirmed !== bConfirmed) return bConfirmed - aConfirmed;

    const aGradeMatch = a.module.gradeBands.includes(gradeBand) ? 1 : 0;
    const bGradeMatch = b.module.gradeBands.includes(gradeBand) ? 1 : 0;
    if (aGradeMatch !== bGradeMatch) return bGradeMatch - aGradeMatch;

    const aDirectMatch = a.module.subjectName.toLowerCase() === (input.subjectHint || '').toLowerCase() ? 1 : 0;
    const bDirectMatch = b.module.subjectName.toLowerCase() === (input.subjectHint || '').toLowerCase() ? 1 : 0;
    if (aDirectMatch !== bDirectMatch) return bDirectMatch - aDirectMatch;

    if (hasResponseBiology) {
      const aBio = a.module.moduleId === 'upper_biology' ? 1 : 0;
      const bBio = b.module.moduleId === 'upper_biology' ? 1 : 0;
      if (aBio !== bBio) return bBio - aBio;
    }
    if (hasResponseChemistry) {
      const aChem = a.module.moduleId === 'upper_chemistry' ? 1 : 0;
      const bChem = b.module.moduleId === 'upper_chemistry' ? 1 : 0;
      if (aChem !== bChem) return bChem - aChem;
    }
    if (hasResponsePhysics) {
      const aPhys = a.module.moduleId === 'upper_physics' ? 1 : 0;
      const bPhys = b.module.moduleId === 'upper_physics' ? 1 : 0;
      if (aPhys !== bPhys) return bPhys - aPhys;
    }
    if (hasVerseExplanation) {
      const aTafsir = a.module.moduleId === 'deen_tafsir' ? 1 : 0;
      const bTafsir = b.module.moduleId === 'deen_tafsir' ? 1 : 0;
      if (aTafsir !== bTafsir) return bTafsir - aTafsir;
    }
    if (hasVerseReflection) {
      const aTadabbur = a.module.moduleId === 'deen_tadabbur' ? 1 : 0;
      const bTadabbur = b.module.moduleId === 'deen_tadabbur' ? 1 : 0;
      if (aTadabbur !== bTadabbur) return bTadabbur - aTadabbur;
    }
    if (hasRecitationMemorization) {
      const aQuran = a.module.moduleId === 'deen_quran' ? 1 : 0;
      const bQuran = b.module.moduleId === 'deen_quran' ? 1 : 0;
      if (aQuran !== bQuran) return bQuran - aQuran;
    }
    if (isKindergarten) {
      const aKG = a.module.group === 'kindergarten' ? 1 : 0;
      const bKG = b.module.group === 'kindergarten' ? 1 : 0;
      if (aKG !== bKG) return bKG - aKG;
    }
    if (hasArabicIslamic && !isKindergarten) {
      const aDeenArabic = a.module.moduleId === 'deen_arabic' ? 1 : 0;
      const bDeenArabic = b.module.moduleId === 'deen_arabic' ? 1 : 0;
      if (aDeenArabic !== bDeenArabic) return bDeenArabic - aDeenArabic;
    }

    return 0;
  });
}

export function resolveSubjectModule(input: CurriculumResolveInput): SubjectModuleResolutionResult {
  const allModules = listSubjectModules();
  const scored: SubjectModuleResolutionCandidate[] = allModules.map(module => {
    const { score, reasons } = scoreModule(module, input);
    return { module, score, reasons };
  });

  const filtered = scored.filter(c => c.score > -50);

  if (filtered.length === 0) {
    return {
      status: 'not_found',
      candidates: scored.slice(0, 5).map(c => ({ module: c.module, score: c.score, reasons: c.reasons })),
      unresolvedReason: 'No module met minimum score threshold',
    };
  }

  const sorted = applyTieBreakers(filtered, input);
  const top = sorted[0];
  const second = sorted[1];

  const difference = top.score - (second?.score || 0);

  if (top.score >= 90) {
    return {
      status: 'resolved',
      selectedModule: top.module,
      candidates: sorted.slice(0, 5),
    };
  }

  if (top.score >= 65 && difference >= 15) {
    return {
      status: 'resolved',
      selectedModule: top.module,
      candidates: sorted.slice(0, 5),
    };
  }

  if (top.score >= 45 && top.score < 65 && input.subjectHint) {
    return {
      status: 'resolved',
      selectedModule: top.module,
      candidates: sorted.slice(0, 5),
    };
  }

  if (top.score >= 45 && difference >= 15) {
    return {
      status: 'resolved',
      selectedModule: top.module,
      candidates: sorted.slice(0, 5),
    };
  }

  if (top.score >= 45 && difference < 15) {
    return {
      status: 'ambiguous',
      candidates: sorted.slice(0, 5),
      safeClarifyingQuestion: 'Do you want help with a school subject, a Deen subject, or an enrichment skill?',
      unresolvedReason: `Top candidates too close: ${top.module.subjectName} (${top.score}) vs ${second?.module.subjectName} (${second?.score})`,
    };
  }

  if (top.score >= 25) {
    return {
      status: 'clarify_first',
      candidates: sorted.slice(0, 5),
      safeClarifyingQuestion: 'Do you want help with a school subject, a Deen subject, or an enrichment skill?',
      unresolvedReason: `Low score top candidate: ${top.module.subjectName} (${top.score})`,
    };
  }

  return {
    status: 'not_found',
    candidates: sorted.slice(0, 5),
    unresolvedReason: 'No module scored high enough to resolve',
    safeClarifyingQuestion: 'Do you want help with a school subject, a Deen subject, or an enrichment skill?',
  };
}
