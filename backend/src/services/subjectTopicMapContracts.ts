import type { CurriculumTrack } from './schoolAuthBridgeContracts';

export interface SubjectSeed {
  subjectId: string;
  name: string;
  aliases: string[];
  category: 'academic' | 'deen' | 'language' | 'mixed' | 'enrichment';
  curriculumTrack: CurriculumTrack;
}

export interface TopicSeed {
  topicId: string;
  subjectId: string;
  title: string;
  aliases: string[];
  gradeBands: string[];
  levels: string[];
  learningObjectives: string[];
  prerequisites: string[];
  commonMistakes: string[];
  sourceConfidence:
    | 'founder_provided_school_subject'
    | 'recommended_enrichment'
    | 'approved_seed'
    | 'draft_seed'
    | 'generic'
    | 'future_source_required'
    | 'unknown';
  deenSensitivityLevel:
    | 'none'
    | 'basic'
    | 'source_required'
    | 'scholar_referral_later'
    | 'sensitive'
    | 'unknown';
}
