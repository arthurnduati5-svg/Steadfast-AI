import type { LearnerProgressState, MasterySignalLevel, WeakSkillStatus, RevisionPriority } from './task011Contracts';
import { masteryService } from '../masteryService';
import { weakSkillTrackingService } from './weakSkillTrackingService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

const progressStateStore = new Map<string, LearnerProgressState>();

function studentKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

export class LearnerProgressStateService {
  async refreshProgressState(
    identity: ResolvedTutorIdentity,
  ): Promise<{ state: LearnerProgressState | null; warnings: string[] }> {
    const warnings: string[] = [];
    const now = nowISO();
    const key = studentKey(identity.schoolId, identity.studentId);

    try {
      const snapshots = await masteryService.listMasterySnapshots(identity, {});
      const weakSkills = weakSkillTrackingService.listWeakSkills(identity);

      const strengths: LearnerProgressState['strengths'] = [];
      const needsReview: LearnerProgressState['needsReview'] = [];
      const improving: LearnerProgressState['improving'] = [];
      const readyForChallenge: LearnerProgressState['readyForChallenge'] = [];
      const subjectsSet = new Set<string>();

      for (const snap of snapshots) {
        const level: MasterySignalLevel = this._mapLevel(snap.level);
        const confScore = snap.confidenceScore ?? 0;

        if (snap.subject) subjectsSet.add(snap.subject);

        if (level === 'strong' || (level === 'secure' && confScore >= 0.7)) {
          strengths.push({
            skillId: snap.skillId,
            skillLabel: snap.skillLabel,
            level,
            confidenceScore: confScore,
          });
        }
        if (level === 'secure' && confScore >= 0.75) {
          readyForChallenge.push({
            skillId: snap.skillId,
            skillLabel: snap.skillLabel,
            level,
          });
        }
        if (level === 'developing' || level === 'emerging') {
          improving.push({
            skillId: snap.skillId,
            skillLabel: snap.skillLabel,
            level,
          });
        }
      }

      for (const ws of weakSkills) {
        if (ws.status === 'needs_review' || ws.status === 'recently_struggled') {
          needsReview.push({
            skillId: ws.skillId,
            skillLabel: ws.skillLabel,
            status: ws.status,
            priority: ws.priority as RevisionPriority,
          });
        }
      }

      const state: LearnerProgressState = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        strengths,
        needsReview,
        improving,
        readyForChallenge,
        subjects: Array.from(subjectsSet),
        totalMastered: strengths.length,
        totalDeveloping: improving.length,
        totalNeedsReview: needsReview.length,
        lastUpdated: now,
      };

      progressStateStore.set(key, state);

      return { state, warnings };
    } catch (err) {
      warnings.push(`Failed to refresh progress state: ${String(err)}`);
      return { state: null, warnings };
    }
  }

  getProgressState(
    identity: ResolvedTutorIdentity,
  ): LearnerProgressState | null {
    const key = studentKey(identity.schoolId, identity.studentId);
    const state = progressStateStore.get(key);
    if (!state) return null;
    if (state.schoolId !== identity.schoolId || state.studentId !== identity.studentId) return null;
    return state;
  }

  _clearForTest(): void {
    progressStateStore.clear();
  }

  private _mapLevel(level: string): MasterySignalLevel {
    const mapping: Record<string, MasterySignalLevel> = {
      not_started: 'not_started',
      emerging: 'emerging',
      developing: 'developing',
      proficient: 'secure',
      strong: 'strong',
      needs_review: 'emerging',
      mastered: 'strong',
      unknown: 'not_started',
      introduced: 'emerging',
      regressing: 'emerging',
      needs_remediation: 'emerging',
    };
    return mapping[level] ?? 'not_started';
  }
}

export const learnerProgressStateService = new LearnerProgressStateService();
