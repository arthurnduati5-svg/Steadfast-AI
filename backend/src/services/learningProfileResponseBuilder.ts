import type {
  StudentLearningProfileResponse,
  SubjectProfileResponse,
  TopicProfileResponse,
  SkillMasterySnapshotResponse,
  MistakePatternResponse,
  SupportPatternSummaryResponse,
  ProfileRecommendedActionWithReason,
  MasteryPathwayResponse,
  WeakTopicResponse,
  AcademicMemoryResponse,
  MasteryLevel,
  MasteryStatus,
  ProfileStatus,
  ProfilePrivacyLevel,
  ProfileRecommendedAction,
  ProfileReasonCode,
  SupportPatternType,
  WeakTopicStatus,
} from '../contracts/studentLearningProfileContracts';

export function serializeStudentLearningProfile(input: {
  status: ProfileStatus;
  profileVersion: number;
  subjects: SubjectProfileResponse[];
  overallStrengthSignals: string[];
  overallWeaknessSignals: string[];
  recentGrowthSignals: string[];
  supportPatternSummary: SupportPatternSummaryResponse[];
  recommendedNextActions: ProfileRecommendedActionWithReason[];
  safeEvidenceRefs: string[];
  confidenceScore: number;
  lastUpdatedAt: Date | string | null;
}): StudentLearningProfileResponse {
  return {
    status: input.status,
    profileVersion: input.profileVersion,
    profileConfidence: confidenceScoreToLabel(input.confidenceScore),
    lastUpdatedAt: input.lastUpdatedAt
      ? (typeof input.lastUpdatedAt === 'string' ? input.lastUpdatedAt : input.lastUpdatedAt.toISOString())
      : null,
    subjects: input.subjects,
    overallStrengthSignals: input.overallStrengthSignals,
    overallWeaknessSignals: input.overallWeaknessSignals,
    recentGrowthSignals: input.recentGrowthSignals,
    supportPatternSummary: input.supportPatternSummary,
    recommendedNextActions: input.recommendedNextActions,
    safeEvidenceRefs: input.safeEvidenceRefs.map(String),
    privacyLevel: 'student_only',
  };
}

export function serializeStudentProfileForStudent(profile: StudentLearningProfileResponse): StudentLearningProfileResponse {
  return {
    ...profile,
    privacyLevel: 'student_only',
  };
}

export function serializeStudentProfileForTeacher(profile: StudentLearningProfileResponse): StudentLearningProfileResponse {
  return {
    ...profile,
    overallStrengthSignals: profile.overallStrengthSignals,
    overallWeaknessSignals: profile.overallWeaknessSignals,
    supportPatternSummary: profile.supportPatternSummary,
    recommendedNextActions: profile.recommendedNextActions,
    subjects: profile.subjects.map(s => ({
      ...s,
      safeEvidenceRefs: s.safeEvidenceRefs.slice(0, 3),
    })),
    privacyLevel: 'teacher_safe',
  };
}

export function serializeStudentProfileForAdmin(profile: StudentLearningProfileResponse): StudentLearningProfileResponse {
  return {
    ...profile,
    privacyLevel: 'admin_diagnostics',
  };
}

export function serializeSkillMasterySnapshot(input: {
  skillId: string;
  skillLabel?: string;
  subjectId?: string;
  topicId?: string;
  masteryLevel: MasteryLevel;
  masteryStatus: MasteryStatus;
  confidenceScore: number;
  evidenceCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  misconceptionCount: number;
  lastObservedAt: Date | string | null;
  lastCorrectAt: Date | string | null;
  lastIncorrectAt: Date | string | null;
  nextReviewAt?: Date | string | null;
  safeEvidenceRefs?: string[];
}): SkillMasterySnapshotResponse {
  return {
    skillId: input.skillId,
    skillLabel: input.skillLabel,
    subjectId: input.subjectId,
    topicId: input.topicId,
    masteryLevel: input.masteryLevel,
    masteryStatus: input.masteryStatus,
    confidenceScore: input.confidenceScore,
    evidenceCount: input.evidenceCount,
    attemptCount: input.attemptCount,
    correctCount: input.correctCount,
    partialCount: input.partialCount,
    incorrectCount: input.incorrectCount,
    hintCount: input.hintCount,
    stuckCount: input.stuckCount,
    recoveryCount: input.recoveryCount,
    misconceptionCount: input.misconceptionCount,
    lastObservedAt: input.lastObservedAt
      ? (typeof input.lastObservedAt === 'string' ? input.lastObservedAt : input.lastObservedAt.toISOString())
      : null,
    lastCorrectAt: input.lastCorrectAt
      ? (typeof input.lastCorrectAt === 'string' ? input.lastCorrectAt : input.lastCorrectAt.toISOString())
      : null,
    lastIncorrectAt: input.lastIncorrectAt
      ? (typeof input.lastIncorrectAt === 'string' ? input.lastIncorrectAt : input.lastIncorrectAt.toISOString())
      : null,
    nextReviewAt: input.nextReviewAt
      ? (typeof input.nextReviewAt === 'string' ? input.nextReviewAt : input.nextReviewAt.toISOString())
      : undefined,
    safeEvidenceRefs: input.safeEvidenceRefs || [],
  };
}

export function serializeWeakTopic(input: {
  topicId: string;
  subjectId: string;
  weaknessScore: number;
  status: WeakTopicStatus;
  safeSummary: string;
  reasonCodes: ProfileReasonCode[];
  recommendedAction: ProfileRecommendedAction;
  safeEvidenceRefs: string[];
}): WeakTopicResponse {
  return {
    topicId: input.topicId,
    subjectId: input.subjectId,
    weaknessScore: input.weaknessScore,
    status: input.status,
    safeSummary: input.safeSummary,
    reasonCodes: input.reasonCodes,
    recommendedAction: input.recommendedAction,
    safeEvidenceRefs: input.safeEvidenceRefs,
  };
}

export function serializeMistakePattern(input: {
  patternKey: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  mistakeCategory: string;
  safeTitle: string;
  safeSummary: string;
  recurrenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  recoverySignals: string[];
  recommendedRepairAction: string;
  safeEvidenceRefs: string[];
}): MistakePatternResponse {
  return {
    patternKey: input.patternKey,
    subjectId: input.subjectId,
    topicId: input.topicId,
    skillId: input.skillId,
    mistakeCategory: input.mistakeCategory,
    safeTitle: input.safeTitle,
    safeSummary: input.safeSummary,
    recurrenceCount: input.recurrenceCount,
    firstObservedAt: input.firstObservedAt,
    lastObservedAt: input.lastObservedAt,
    recoverySignals: input.recoverySignals,
    recommendedRepairAction: input.recommendedRepairAction,
    safeEvidenceRefs: input.safeEvidenceRefs,
  };
}

export function serializeSupportPattern(input: {
  supportType: SupportPatternType;
  effectivenessSignal: string;
  timesUsed: number;
  recoveryAfterUseCount: number;
  hintLevelMostHelpful?: string;
  lastEffectiveAt?: string;
  confidenceScore: number;
  safeEvidenceRefs: string[];
}): SupportPatternSummaryResponse {
  return {
    supportType: input.supportType,
    effectivenessSignal: input.effectivenessSignal,
    timesUsed: input.timesUsed,
    recoveryAfterUseCount: input.recoveryAfterUseCount,
    hintLevelMostHelpful: input.hintLevelMostHelpful,
    lastEffectiveAt: input.lastEffectiveAt,
    confidenceScore: input.confidenceScore,
    safeEvidenceRefs: input.safeEvidenceRefs,
  };
}

export function serializeAcademicMemory(input: {
  strengthPatterns: string[];
  weaknessPatterns: string[];
  supportPatterns: SupportPatternSummaryResponse[];
  revisionNeeds: string[];
  safeEvidenceRefs: string[];
}): AcademicMemoryResponse {
  return {
    strengthPatterns: input.strengthPatterns,
    weaknessPatterns: input.weaknessPatterns,
    supportPatterns: input.supportPatterns,
    revisionNeeds: input.revisionNeeds,
    safeEvidenceRefs: input.safeEvidenceRefs,
  };
}

export function buildEmptySafeProfileResponse(): StudentLearningProfileResponse {
  return {
    status: 'no_data_yet',
    profileVersion: 0,
    profileConfidence: 'low',
    lastUpdatedAt: null,
    subjects: [],
    overallStrengthSignals: [],
    overallWeaknessSignals: [],
    recentGrowthSignals: [],
    supportPatternSummary: [],
    recommendedNextActions: [
      {
        action: 'start_learning_session',
        reasonCodes: ['no_evidence_yet'],
        priority: 1,
      },
    ],
    safeEvidenceRefs: [],
    privacyLevel: 'student_only',
  };
}

export function buildEmptyMasteryPathwayResponse(): MasteryPathwayResponse {
  return {
    strongSkills: [],
    developingSkills: [],
    weakSkills: [],
    recommendedNextSkill: null,
    whyThisNextReasonCodes: [],
    safeEvidenceRefs: [],
  };
}

export function buildEmptyAcademicMemoryResponse(): AcademicMemoryResponse {
  return {
    strengthPatterns: [],
    weaknessPatterns: [],
    supportPatterns: [],
    revisionNeeds: [],
    safeEvidenceRefs: [],
  };
}

function confidenceScoreToLabel(score: number): string {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  if (score > 0) return 'low';
  return 'very_low';
}
