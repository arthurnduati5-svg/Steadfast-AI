import type { SubjectModuleProfile, ModuleToTutorDirective, SubjectValidationMode } from './subjectModuleContracts';
import type { AdaptiveDirectiveResult } from './adaptiveLearningDirectiveService';

export function buildModuleDirective(input: {
  module: SubjectModuleProfile;
  adaptiveDirective: AdaptiveDirectiveResult;
}): ModuleToTutorDirective {
  const { module, adaptiveDirective } = input;

  const moduleId = module.moduleId;
  const subjectName = module.subjectName;
  const isKindergarten = module.group === 'kindergarten';
  const isDeen = module.group === 'deen' || module.curriculumTrack === 'madrasa_deen';
  const isMathOrNumeracy = moduleId === 'upper_mathematics' || moduleId === 'kindergarten_numeracy';
  const isIct = moduleId === 'upper_ict';
  const usesKenyanExamples = [
    'upper_mathematics', 'upper_geography', 'upper_business_studies',
    'upper_statistics', 'enrichment_financial_literacy',
    'enrichment_entrepreneurship_innovation',
  ].includes(moduleId);
  const usesArabicScript = isDeen || [
    'deen_arabic', 'deen_quran', 'deen_tafsir', 'deen_tadabbur',
    'deen_hadith', 'kindergarten_arabic', 'kindergarten_dua_quran_hadith',
  ].includes(moduleId);
  const avoidsRomanization = ['deen_arabic', 'kindergarten_arabic'].includes(moduleId);

  const pacingDirective = adaptiveDirective.pacingDirective;

  let maxIdeaCount = 3;
  if (isKindergarten || pacingDirective === 'slow_support') {
    maxIdeaCount = 1;
  }

  let maxQuestionCount = 3;
  if (isKindergarten || pacingDirective === 'slow_support') {
    maxQuestionCount = 1;
  }

  const shouldUseEmoji = isKindergarten || module.group === 'general_enrichment';

  let deenSourceHandling: ModuleToTutorDirective['deenSourceHandling'] = 'not_deen';
  if (isDeen || module.deenSensitivityLevel !== 'none') {
    if (module.deenSensitivityLevel === 'basic') {
      deenSourceHandling = 'safe_basic';
    } else if (module.deenSensitivityLevel === 'source_required') {
      deenSourceHandling = 'source_required';
    } else if (module.deenSensitivityLevel === 'scholar_referral_later') {
      deenSourceHandling = 'scholar_referral_later';
    } else {
      deenSourceHandling = 'source_required';
    }
  }

  return {
    moduleId,
    subjectName,
    responseToneRules: [...module.toneRules],
    teachingMethodRules: [...module.teachingMethodRules],
    validationModes: [...module.validationModes] as SubjectValidationMode[],
    vocabularyRules: [...module.vocabularyRules],
    exampleRules: [...module.exampleRules],
    endingRule: module.endingRule,
    pacingDirective,
    maxIdeaCount,
    maxQuestionCount,
    shouldUseEmoji,
    shouldUseKenyanExamples: usesKenyanExamples,
    shouldUseArabicScript: usesArabicScript,
    shouldAvoidRomanization: avoidsRomanization,
    shouldAvoidLatex: isMathOrNumeracy,
    shouldAvoidSyntaxDumping: isIct,
    deenSourceHandling,
    disallowedBehaviors: [...module.disallowedBehaviors],
  };
}
