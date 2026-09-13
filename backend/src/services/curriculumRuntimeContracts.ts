import type { CurriculumTrack } from './schoolAuthBridgeContracts';

export type { CurriculumTrack };

export type CurriculumCategory =
  | 'academic'
  | 'deen'
  | 'enrichment'
  | 'language'
  | 'mixed'
  | 'unknown';

export type CurriculumConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type DeenSensitivityLevel =
  | 'none'
  | 'basic'
  | 'source_required'
  | 'scholar_referral_later'
  | 'sensitive'
  | 'unknown';

export type CurriculumSourceConfidence =
  | 'founder_provided_school_subject'
  | 'recommended_enrichment'
  | 'approved_seed'
  | 'draft_seed'
  | 'generic'
  | 'future_source_required'
  | 'unknown';

export type RecommendedTutorModeHint =
  | 'normal_tutor'
  | 'deep_explanation'
  | 'practice'
  | 'revision'
  | 'deen_learning'
  | 'arabic_learning'
  | 'kindergarten_playful'
  | 'enrichment_coaching'
  | 'clarify_first';

import type { SubjectModuleProfile, SubjectModuleGroup, SubjectModuleStatus, SubjectValidationMode, ModuleToTutorDirective } from './subjectModuleContracts';

export interface LearnerAdaptiveSnapshot {
  source: 'safe_memory' | 'recent_attempts' | 'request_hint' | 'none';
  learningSpeedHint: 'slow' | 'balanced' | 'fast' | 'unknown';
  recentSuccessRate?: number;
  recentMistakeCount?: number;
  observationCount?: number;
  confidence: 'low' | 'medium' | 'high' | 'none';
}

export interface CurriculumResolveInput {
  requestId: string;
  schoolId?: string;
  tutorLearnerId?: string;
  learnerGrade?: string;
  learnerAge?: number;
  preferredLanguage?: string;
  messageText?: string;
  subjectHint?: string;
  topicHint?: string;
  curriculumTrackHint?: CurriculumTrack;
  requestedModuleId?: string;
  learnerAdaptiveSnapshot?: LearnerAdaptiveSnapshot;
}

export interface CurriculumSubjectContext {
  subjectId: string;
  name: string;
  normalizedName: string;
  curriculumTrack: CurriculumTrack;
  category: CurriculumCategory;
  aliases: string[];
}

export interface CurriculumTopicContext {
  topicId: string;
  subjectId: string;
  title: string;
  normalizedTitle: string;
  gradeBands: string[];
  levels: string[];
  aliases: string[];
  learningObjectives: string[];
  prerequisites: string[];
  commonMistakes: string[];
  sourceConfidence: CurriculumSourceConfidence;
  deenSensitivityLevel: DeenSensitivityLevel;
}

export interface CurriculumContextPacket {
  requestId: string;
  curriculumTrack: CurriculumTrack;
  primaryCategory: CurriculumCategory;
  subject?: CurriculumSubjectContext;
  topic?: CurriculumTopicContext;
  subjectModule?: SubjectModuleProfile;
  moduleGroup?: SubjectModuleGroup;
  moduleStatus?: SubjectModuleStatus;
  learnerGrade?: string;
  learnerAge?: number;
  curriculumConfidence: CurriculumConfidence;
  sourceConfidence: CurriculumSourceConfidence;
  deenSensitivityLevel: DeenSensitivityLevel;
  prerequisiteHints: string[];
  commonMistakeHints: string[];
  validationModes?: SubjectValidationMode[];
  teachingMethodRules?: string[];
  moduleDirective?: ModuleToTutorDirective;
  recommendedTutorModeHint: RecommendedTutorModeHint;
  safeClarifyingQuestion?: string;
  unresolvedReason?: string;
}
