import type { WeakSkillSignal, WeakSkillStatus, WeakSkillUpdateResult } from './task011Contracts';
import { revisionQueueService } from '../revisionQueueService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

const weakSkillStore = new Map<string, WeakSkillSignal>();

function skillKey(schoolId: string, studentId: string, skillId: string): string {
  return `${schoolId}:${studentId}:${skillId}`;
}

function computeWeakSkillStatus(
  mistakeCount: number,
  misconceptionCount: number,
  independentSuccessCount: number,
): { status: WeakSkillStatus; priority: 'high' | 'medium' | 'low' | 'none' } {
  if (mistakeCount >= 3 && independentSuccessCount === 0) {
    return { status: 'needs_review', priority: 'high' };
  }
  if (independentSuccessCount >= 3 && independentSuccessCount >= mistakeCount && mistakeCount > 0) {
    return { status: 'improving', priority: 'low' };
  }
  if (mistakeCount >= 2 || misconceptionCount >= 2) {
    return { status: 'recently_struggled', priority: 'high' };
  }
  if (mistakeCount >= 1 && independentSuccessCount <= 1) {
    return { status: 'developing', priority: 'medium' };
  }
  if (independentSuccessCount >= 3 && mistakeCount === 0) {
    return { status: 'secure', priority: 'none' };
  }
  if (independentSuccessCount >= 1 && mistakeCount <= 1) {
    return { status: 'improving', priority: 'low' };
  }
  if (mistakeCount > 0 && independentSuccessCount > 0) {
    return { status: 'watch', priority: 'medium' };
  }
  return { status: 'maintenance', priority: 'low' };
}

export class WeakSkillTrackingService {
  async updateWeakSkill(
    identity: ResolvedTutorIdentity,
    signal: {
      subject: string;
      topic: string;
      skillId: string;
      skillLabel: string;
      isMistake: boolean;
      isMisconception: boolean;
      isIndependentSuccess: boolean;
      safeSummary: string;
    },
  ): Promise<WeakSkillUpdateResult> {
    const key = skillKey(identity.schoolId, identity.studentId, signal.skillId);
    const now = nowISO();
    const existing = weakSkillStore.get(key);

    let mistakeCount = existing?.mistakeCount ?? 0;
    let misconceptionCount = existing?.misconceptionCount ?? 0;
    let independentSuccessCount = existing?.independentSuccessCount ?? 0;
    let lastMistakeAt = existing?.lastMistakeAt ?? null;
    let lastCorrectAt = existing?.lastCorrectAt ?? null;

    if (signal.isMistake) {
      mistakeCount += 1;
      lastMistakeAt = now;
    }
    if (signal.isMisconception) {
      misconceptionCount += 1;
    }
    if (signal.isIndependentSuccess) {
      independentSuccessCount += 1;
      lastCorrectAt = now;
    }

    const { status: currentStatus, priority } = computeWeakSkillStatus(
      mistakeCount,
      misconceptionCount,
      independentSuccessCount,
    );

    const weakSignal: WeakSkillSignal = {
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      subject: signal.subject,
      topic: signal.topic,
      skillId: signal.skillId,
      skillLabel: signal.skillLabel,
      status: currentStatus,
      mistakeCount,
      misconceptionCount,
      independentSuccessCount,
      lastMistakeAt,
      lastCorrectAt,
      safeSummary: signal.safeSummary.slice(0, 300),
      priority,
    };

    weakSkillStore.set(key, weakSignal);

    const result: WeakSkillUpdateResult = {
      skillId: signal.skillId,
      previousStatus: existing?.status ?? 'maintenance',
      currentStatus,
      priority,
      updatedAt: now,
    };

    if (priority === 'high') {
      try {
        revisionQueueService.generateRevisionQueue({
          learnerIdHash: identity.studentId,
          subjectId: signal.subject,
          skillId: signal.skillId,
          topicId: signal.topic,
          evidenceEvents: [
            {
              eventId: `weak_${signal.skillId}_${now}`,
              eventType: mistakeCount >= 3 ? 'mistake_signal_observed' : 'weak_evidence',
              evidenceStrength: 'strong',
              freshness: 'fresh',
              sourceQuality: 'real',
              mistakeType: 'repeated_mistake',
              correctionObserved: false,
              safeSummary: signal.safeSummary.slice(0, 300),
              createdAt: now,
            },
          ],
          maxItems: 3,
        });
      } catch {
        // Non-blocking: revision queue update is best-effort
      }
    }

    return result;
  }

  getWeakSkill(
    identity: ResolvedTutorIdentity,
    skillId: string,
  ): WeakSkillSignal | null {
    const key = skillKey(identity.schoolId, identity.studentId, skillId);
    const signal = weakSkillStore.get(key);
    if (!signal) return null;
    if (signal.schoolId !== identity.schoolId || signal.tutorLearnerId !== identity.studentId) return null;
    return signal;
  }

  listWeakSkills(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; status?: WeakSkillStatus; limit?: number },
  ): WeakSkillSignal[] {
    const limit = options?.limit || 50;
    const results: WeakSkillSignal[] = [];

    for (const signal of weakSkillStore.values()) {
      if (signal.schoolId !== identity.schoolId || signal.tutorLearnerId !== identity.studentId) continue;
      if (options?.subject && signal.subject !== options.subject) continue;
      if (options?.status && signal.status !== options.status) continue;
      results.push(signal);
    }

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
    results.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
    return results.slice(0, limit);
  }

  _clearForTest(): void {
    weakSkillStore.clear();
  }
}

export const weakSkillTrackingService = new WeakSkillTrackingService();
