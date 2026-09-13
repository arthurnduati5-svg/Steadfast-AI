import type { GrowthProofSummary, RevisionPriority } from './task011Contracts';
import { masteryService } from '../masteryService';
import { weakSkillTrackingService } from './weakSkillTrackingService';
import { stepEvidencePersistenceService } from './stepEvidencePersistenceService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export class GrowthProofSummaryService {
  async generateGrowthProofSummary(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      limit?: number;
    },
  ): Promise<{
    summary: GrowthProofSummary | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const now = nowISO();

    try {
      const snapshots = await masteryService.listMasterySnapshots(identity, {
        subject: options?.subject,
        limit: options?.limit ?? 50,
      });

      const weakSkills = weakSkillTrackingService.listWeakSkills(identity, {
        subject: options?.subject,
        limit: options?.limit ?? 20,
      });

      const evidenceResult = await stepEvidencePersistenceService.listStepEvidence(identity, {
        subject: options?.subject,
        limit: options?.limit ?? 50,
      });
      if (evidenceResult.warnings.length > 0) warnings.push(...evidenceResult.warnings);

      const whatImproved: string[] = [];
      const whatNeedsReview: string[] = [];
      const supportingEvidence: string[] = [];
      const revisionScheduled: GrowthProofSummary['revisionScheduled'] = [];

      for (const snap of snapshots) {
        const level = this._mapLevel(snap.level);
        const confScore = snap.confidenceScore ?? 0;

        if (level === 'strong' || level === 'secure') {
          whatImproved.push(
            `${snap.skillLabel} (${level}, confidence: ${Math.round(confScore * 100)}%)`,
          );
          supportingEvidence.push(
            `Mastery evidence: ${snap.evidenceCount ?? 0} data points, ${snap.correctCount ?? 0} correct`,
          );
        }
        if (level === 'developing' || level === 'emerging' || level === 'not_started') {
          whatNeedsReview.push(
            `${snap.skillLabel} (${level}, ${snap.incorrectCount ?? 0} incorrect)`,
          );
        }
      }

      for (const ws of weakSkills) {
        if (ws.status === 'needs_review' || ws.status === 'recently_struggled') {
          const existing = whatNeedsReview.find((w) => w.includes(ws.skillLabel));
          if (!existing) {
            whatNeedsReview.push(
              `${ws.skillLabel} (${ws.status}, ${ws.mistakeCount} mistakes)`,
            );
          }
        }
        if (ws.priority !== 'none') {
          revisionScheduled.push({
            skillId: ws.skillId,
            skillLabel: ws.skillLabel,
            dueAt: now,
            priority: ws.priority as RevisionPriority,
          });
        }
      }

      const totalMastered = whatImproved.length;
      const totalNeedsWork = whatNeedsReview.length;
      const confidenceLevel: 'high' | 'medium' | 'low' =
        totalMastered >= 3 ? 'high' :
        totalMastered >= 1 ? 'medium' : 'low';

      let nextLearningAction = 'Continue practicing current topics.';
      if (totalNeedsWork > 0) {
        nextLearningAction = `Focus on ${totalNeedsWork} skill${totalNeedsWork > 1 ? 's' : ''} that need review: ${whatNeedsReview.slice(0, 3).join(', ')}.`;
      } else if (totalMastered > 0) {
        nextLearningAction = `Progressing well with ${totalMastered} mastered skill${totalMastered > 1 ? 's' : ''}. Ready for new challenges.`;
      }

      const summary: GrowthProofSummary = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        whatImproved: whatImproved.slice(0, 10),
        whatNeedsReview: whatNeedsReview.slice(0, 10),
        supportingEvidence: supportingEvidence.slice(0, 10),
        revisionScheduled: revisionScheduled.slice(0, 10),
        nextLearningAction,
        confidenceLevel,
        generatedAt: now,
      };

      return { summary, warnings };
    } catch (err) {
      warnings.push(`Failed to generate growth proof summary: ${String(err)}`);
      return { summary: null, warnings };
    }
  }

  private _mapLevel(level: string): string {
    const mapping: Record<string, string> = {
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

export const growthProofSummaryService = new GrowthProofSummaryService();
