import type {
  Phase3MistakeJournalEntry,
  Phase3MistakeJournalReadModel,
  Phase3MistakePatternType,
  Phase3GrowthPageAction,
  Phase3GrowthPagePriority,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';

let counter = 0;
function generateId(): string {
  return `mje_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

interface MistakePatternSource {
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  patternType: Phase3MistakePatternType;
  safeTitle: string;
  learnerSafeSummary: string;
  teacherSafeSummary?: string;
  recommendedAction: Phase3GrowthPageAction;
  priority: Phase3GrowthPagePriority;
  occurrenceCount: number;
}

const patternMessages: Record<Phase3MistakePatternType, { learner: string; action: Phase3GrowthPageAction }> = {
  recall_gap: {
    learner: 'This pattern looks like recall fading. A quick revisit can strengthen it.',
    action: 'open_revision_mode',
  },
  concept_confusion: {
    learner: 'This pattern suggests a concept might need clearer explanation.',
    action: 'open_teach_back_mode',
  },
  procedure_step_error: {
    learner: 'This pattern looks like a step-order issue. A short worked-step check may help.',
    action: 'open_focus_mode',
  },
  careless_slip: {
    learner: 'This pattern appears to be a small slip. Reviewing carefully may help.',
    action: 'no_action_needed',
  },
  explanation_gap: {
    learner: 'This pattern suggests the explanation could be clearer. Teaching back may help.',
    action: 'open_teach_back_mode',
  },
  transfer_gap: {
    learner: 'This pattern shows applying knowledge in new contexts is still forming.',
    action: 'open_quiz_mode',
  },
  delayed_recall_gap: {
    learner: 'This pattern shows recall fades over time. Spaced revisits may help.',
    action: 'open_revision_mode',
  },
  confidence_mismatch: {
    learner: 'This pattern looks like confidence and evidence are not aligned yet.',
    action: 'start_daily_objective_check',
  },
  high_hint_dependency: {
    learner: 'This pattern suggests trying the next step more independently.',
    action: 'open_focus_mode',
  },
  source_context_gap: {
    learner: 'This pattern may need a source or context review before continuing.',
    action: 'ask_teacher_for_source',
  },
};

export class Phase3MistakeJournalReadModelService {
  buildMistakeJournalReadModel(schoolId: string, studentId: string): Phase3MistakeJournalReadModel {
    const entries = phase3GrowthPageRepository.listMistakeJournalEntriesForLearner(schoolId, studentId);
    const sorted = [...entries].sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    return {
      schoolId,
      studentId,
      entries: sorted,
      summary: this.buildJournalSummary(sorted),
      totalPatterns: sorted.length,
    };
  }

  private buildJournalSummary(entries: Phase3MistakeJournalEntry[]): string {
    if (entries.length === 0) return 'No mistake patterns detected yet.';
    const top = entries[0];
    const total = entries.reduce((sum, e) => sum + e.occurrenceCount, 0);
    return `${entries.length} pattern type${entries.length > 1 ? 's' : ''} identified. Most common: ${top.safeTitle}. Total occurrences: ${total}.`;
  }

  deriveMistakePatternsFromDailyObjectiveChecks(
    schoolId: string,
    studentId: string,
    sources: MistakePatternSource[]
  ): Phase3MistakeJournalEntry[] {
    return this.createEntries(schoolId, studentId, sources);
  }

  deriveMistakePatternsFromSafeEvidence(
    schoolId: string,
    studentId: string,
    sources: MistakePatternSource[]
  ): Phase3MistakeJournalEntry[] {
    return this.createEntries(schoolId, studentId, sources);
  }

  private createEntries(schoolId: string, studentId: string, sources: MistakePatternSource[]): Phase3MistakeJournalEntry[] {
    return sources.map(s => {
      const msg = patternMessages[s.patternType];
      const entry: Phase3MistakeJournalEntry = {
        mistakeEntryId: generateId(),
        schoolId,
        studentId,
        subjectId: s.subjectId,
        topicId: s.topicId,
        skillId: s.skillId,
        objectiveId: s.objectiveId,
        patternType: s.patternType,
        safeTitle: s.safeTitle,
        learnerSafeSummary: msg?.learner ?? s.learnerSafeSummary,
        teacherSafeSummary: s.teacherSafeSummary,
        recommendedAction: msg?.action ?? s.recommendedAction,
        priority: s.priority,
        occurrenceCount: s.occurrenceCount,
        lastSeenAt: nowISO(),
        safeEvidenceRefs: [],
        safeReasonCodes: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      phase3GrowthPageRepository.upsertMistakeJournalEntry(entry);
      return entry;
    });
  }

  deriveMistakePatternType(signalType: string): Phase3MistakePatternType | null {
    const map: Record<string, Phase3MistakePatternType> = {
      recall_gap: 'recall_gap',
      concept_confusion: 'concept_confusion',
      procedure_step_error: 'procedure_step_error',
      careless_slip: 'careless_slip',
      explanation_gap: 'explanation_gap',
      transfer_gap: 'transfer_gap',
      delayed_recall_gap: 'delayed_recall_gap',
      confidence_mismatch: 'confidence_mismatch',
      high_hint_dependency: 'high_hint_dependency',
      source_context_gap: 'source_context_gap',
    };
    return map[signalType] ?? null;
  }

  mergeDuplicateMistakePatterns(entries: Phase3MistakeJournalEntry[]): Phase3MistakeJournalEntry[] {
    const merged = new Map<string, Phase3MistakeJournalEntry>();
    for (const e of entries) {
      const key = `${e.studentId}:${e.patternType}:${e.topicId ?? ''}:${e.skillId ?? ''}`;
      const existing = merged.get(key);
      if (existing) {
        existing.occurrenceCount += e.occurrenceCount;
        existing.lastSeenAt = e.lastSeenAt > existing.lastSeenAt ? e.lastSeenAt : existing.lastSeenAt;
        existing.safeEvidenceRefs = [...new Set([...existing.safeEvidenceRefs, ...e.safeEvidenceRefs])];
      } else {
        merged.set(key, { ...e });
      }
    }
    return Array.from(merged.values());
  }

  rankMistakePatterns(entries: Phase3MistakeJournalEntry[]): Phase3MistakeJournalEntry[] {
    return [...entries].sort((a, b) => {
      if (b.occurrenceCount !== a.occurrenceCount) return b.occurrenceCount - a.occurrenceCount;
      return b.lastSeenAt.localeCompare(a.lastSeenAt);
    });
  }

  buildLearnerSafeMistakeMessage(entry: Phase3MistakeJournalEntry): string {
    return entry.learnerSafeSummary;
  }

  buildTeacherSafeMistakeSummary(entry: Phase3MistakeJournalEntry): string {
    return entry.teacherSafeSummary ?? `Pattern type: ${entry.patternType}. Occurrences: ${entry.occurrenceCount}.`;
  }
}

export const phase3MistakeJournalReadModelService = new Phase3MistakeJournalReadModelService();
