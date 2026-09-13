import type {
  Phase3WhatHelpsMeLearnBestProfile,
  Phase3LearningHelpPatternType,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';

let counter = 0;
function generateId(): string {
  return `hlp_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

const patternSupportMap: Record<Phase3LearningHelpPatternType, {
  supportActions: string[];
  confidenceThreshold: number;
  safeSummary: string;
}> = {
  short_recall_helps: {
    supportActions: ['short_recall_quiz', 'quick_revision_card'],
    confidenceThreshold: 0.6,
    safeSummary: 'Short recall checks help keep topics fresh.',
  },
  teach_back_helps: {
    supportActions: ['teach_back_session', 'explain_to_peer'],
    confidenceThreshold: 0.6,
    safeSummary: 'Teaching back helps clarify understanding.',
  },
  worked_step_helps: {
    supportActions: ['worked_example', 'step_by_step_guide'],
    confidenceThreshold: 0.6,
    safeSummary: 'Step-by-step worked examples support learning.',
  },
  visual_example_helps: {
    supportActions: ['visual_diagram', 'concept_map'],
    confidenceThreshold: 0.6,
    safeSummary: 'Visual examples make concepts clearer.',
  },
  slower_pacing_helps: {
    supportActions: ['reduced_pace', 'segmented_learning'],
    confidenceThreshold: 0.5,
    safeSummary: 'Slower pacing with breaks works well.',
  },
  revision_revisit_helps: {
    supportActions: ['spaced_revision', 'review_session'],
    confidenceThreshold: 0.6,
    safeSummary: 'Regular revisits strengthen long-term memory.',
  },
  practice_variation_helps: {
    supportActions: ['varied_practice', 'different_contexts'],
    confidenceThreshold: 0.6,
    safeSummary: 'Practicing in different ways builds flexibility.',
  },
  teacher_support_helps: {
    supportActions: ['teacher_guidance', 'one_on_one_session'],
    confidenceThreshold: 0.5,
    safeSummary: 'Teacher guidance helps clarify difficult areas.',
  },
  source_confirmation_helps: {
    supportActions: ['source_review', 'reference_check'],
    confidenceThreshold: 0.5,
    safeSummary: 'Checking sources confirms understanding.',
  },
};

export class Phase3WhatHelpsMeLearnBestService {
  buildWhatHelpsMeLearnBestProfile(schoolId: string, studentId: string): Phase3WhatHelpsMeLearnBestProfile | null {
    return phase3GrowthPageRepository.getWhatHelpsMeLearnBestProfile(schoolId, studentId);
  }

  deriveLearningHelpPatterns(evidenceSignals: Array<{ pattern: Phase3LearningHelpPatternType; weight: number }>): Phase3LearningHelpPatternType[] {
    const scored = [...evidenceSignals].sort((a, b) => b.weight - a.weight);
    return scored.slice(0, 3).map(s => s.pattern);
  }

  deriveBestSupportActions(topPatterns: Phase3LearningHelpPatternType[]): string[] {
    const actions = new Set<string>();
    for (const p of topPatterns) {
      const info = patternSupportMap[p];
      if (info) {
        for (const a of info.supportActions) actions.add(a);
      }
    }
    return Array.from(actions);
  }

  deriveSupportConfidence(evidenceCount: number): string {
    if (evidenceCount >= 10) return 'high';
    if (evidenceCount >= 5) return 'medium';
    if (evidenceCount >= 2) return 'low';
    return 'insufficient';
  }

  buildLearnerSafeHelpPatternSummary(profile: Phase3WhatHelpsMeLearnBestProfile): string {
    return profile.safeSummary;
  }

  buildTeacherSafeHelpPatternSummary(profile: Phase3WhatHelpsMeLearnBestProfile): string {
    return `Learner primarily benefits from: ${profile.topPatterns.join(', ')}. Confidence: ${profile.confidenceLevel}.`;
  }

  updateHelpPatternFromEvidence(
    schoolId: string,
    studentId: string,
    evidencePatterns: Array<{ pattern: Phase3LearningHelpPatternType; weight: number }>
  ): Phase3WhatHelpsMeLearnBestProfile {
    const topPatterns = this.deriveLearningHelpPatterns(evidencePatterns);
    const supportActions = this.deriveBestSupportActions(topPatterns);
    const confidenceLevel = this.deriveSupportConfidence(evidencePatterns.length);

    const safeParts = topPatterns.map(p => patternSupportMap[p]?.safeSummary).filter(Boolean);
    const safeSummary = safeParts.length > 0
      ? `Recent evidence suggests: ${safeParts.join(' ')}`
      : 'Learning pattern data is still being collected.';

    const profile: Phase3WhatHelpsMeLearnBestProfile = {
      profileId: generateId(),
      schoolId,
      studentId,
      topPatterns,
      supportActions,
      safeSummary,
      confidenceLevel,
      safeEvidenceRefs: [],
      safeReasonCodes: [],
      updatedAt: nowISO(),
    };

    phase3GrowthPageRepository.upsertWhatHelpsMeLearnBestProfile(profile);
    return profile;
  }
}

export const phase3WhatHelpsMeLearnBestService = new Phase3WhatHelpsMeLearnBestService();
