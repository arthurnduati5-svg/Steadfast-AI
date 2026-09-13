export type SubjectModuleGroup =
  | 'kindergarten'
  | 'upper_class'
  | 'deen'
  | 'general_enrichment';

export type SubjectModuleStatus =
  | 'confirmed_school_subject'
  | 'recommended_enrichment'
  | 'future_optional';

export type SubjectLanguageMode =
  | 'default'
  | 'pure_arabic'
  | 'arabic_english_mix'
  | 'bilingual_support';

export type SubjectValidationMode =
  | 'numeric_validation'
  | 'science_logic_validation'
  | 'reasoning_clarity_validation'
  | 'language_expression_validation'
  | 'phonics_sound_validation'
  | 'reflection_validation'
  | 'creativity_effort_validation'
  | 'deen_source_sensitive_validation'
  | 'no_strict_validation';

export interface SubjectModuleProfile {
  moduleId: string;
  subjectName: string;
  aliases: string[];
  group: SubjectModuleGroup;
  status: SubjectModuleStatus;
  curriculumTrack:
    | 'cambridge_academic'
    | 'madrasa_deen'
    | 'mixed_academic_deen'
    | 'general_enrichment'
    | 'unknown';
  gradeBands: string[];
  focusAreas: string[];
  toneRules: string[];
  teachingMethodRules: string[];
  validationModes: SubjectValidationMode[];
  vocabularyRules: string[];
  exampleRules: string[];
  examples: string[];
  endingRule: string;
  adaptiveRules: {
    slowLearner: string[];
    fastLearner: string[];
    balanceRule: string;
  };
  deenSensitivityLevel:
    | 'none'
    | 'basic'
    | 'source_required'
    | 'scholar_referral_later'
    | 'sensitive'
    | 'unknown';
  sourceConfidence:
    | 'founder_provided_school_subject'
    | 'recommended_enrichment'
    | 'draft_seed'
    | 'future_source_required'
    | 'unknown';
  languageModes: SubjectLanguageMode[];
  disallowedBehaviors: string[];
}

export interface ModuleToTutorDirective {
  moduleId: string;
  subjectName: string;
  responseToneRules: string[];
  teachingMethodRules: string[];
  validationModes: SubjectValidationMode[];
  vocabularyRules: string[];
  exampleRules: string[];
  endingRule: string;
  pacingDirective: 'slow_support' | 'balanced' | 'fast_challenge' | 'unknown';
  maxIdeaCount: number;
  maxQuestionCount: number;
  shouldUseEmoji: boolean;
  shouldUseKenyanExamples: boolean;
  shouldUseArabicScript: boolean;
  shouldAvoidRomanization: boolean;
  shouldAvoidLatex: boolean;
  shouldAvoidSyntaxDumping: boolean;
  deenSourceHandling:
    | 'not_deen'
    | 'safe_basic'
    | 'source_required'
    | 'scholar_referral_later';
  disallowedBehaviors: string[];
}
