// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learner Fit Scorer v1
// Scores how well a video candidate fits a specific learner
// based on grade, age, mastery weaknesses, recent mistakes,
// artifact context, practice context, and learner memory.
// Conservative defaults. No learner data = low confidence.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoScoreDetail } from './videoRecommendationContracts';
import type { TutorTurnContext } from './tutorStateContracts';

export class VideoLearnerFitScorer {
  /**
   * Score learner fit for a video candidate.
   */
  scoreLearnerFit(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    context: {
      learnerGrade?: string | null;
      learnerAge?: number | null;
      languagePreference?: string | null;
      weaknesses?: Array<{ label: string; summary?: string; confidence?: number }>;
      recentMistakes?: Array<{ label: string; summary?: string }>;
      strengths?: Array<{ label: string; summary?: string }>;
      activeTopic?: string | null;
      activeSubject?: string | null;
      skillIds?: string[];
      artifactSignals?: Array<{ label: string }>;
      practiceSignals?: Array<{ label: string; confidence?: number }>;
      tutorContextNotes?: string[];
    } | null,
  ): { score: VideoScoreDetail } {
    const evidence: string[] = [];
    const warnings: string[] = [];

    // No learner context
    if (!context) {
      return {
        score: {
          score: 0.3,
          label: 'weak',
          reason: 'No learner context available — cannot assess personal fit',
          confidence: 'low',
          evidence: ['Learner context is empty'],
          warnings: ['Learner fit scoring requires learner profile data'],
        },
      };
    }

    let totalScore = 0.5; // Neutral baseline
    const signalCount: string[] = [];

    // --- Grade/age alignment ---
    const grade = context.learnerGrade;
    const age = context.learnerAge;
    const title = (candidate.title || '').toLowerCase();
    const description = (candidate.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    if (grade) {
      const gradeNum = parseInt(grade.replace(/[^0-9]/g, ''), 10);
      if (Number.isFinite(gradeNum)) {
        // Check if title/description mentions grade
        const gradePattern = new RegExp(`\\b(grade\\s*${gradeNum}|class\\s*${gradeNum}|year\\s*${gradeNum})\\b`, 'i');
        if (gradePattern.test(combined)) {
          totalScore += 0.2;
          signalCount.push('grade_match');
          evidence.push(`Video references learner's grade level: ${grade}`);
        }
      }
    }

    if (age) {
      const agePatterns = [
        new RegExp(`\\b(for\\s+ages?\\s*${age}\\b|ages?\\s*${age}\\+|${age}\\s*years?\\s+old)`, 'i'),
      ];
      for (const pattern of agePatterns) {
        if (pattern.test(combined)) {
          totalScore += 0.15;
          signalCount.push('age_match');
          evidence.push(`Video references learner's age: ${age}`);
          break;
        }
      }
    }

    // --- Weakness alignment ---
    const weaknesses = context.weaknesses || [];
    if (weaknesses.length > 0) {
      const weakTopics = weaknesses.map(w => (w.label || '').toLowerCase()).filter(Boolean);
      const weakTopicMatches = weakTopics.filter(t => combined.includes(t));

      if (weakTopicMatches.length > 0) {
        totalScore += Math.min(0.3, weakTopicMatches.length * 0.1);
        signalCount.push(`weakness_match:${weakTopicMatches.length}`);
        evidence.push(`Video addresses ${weakTopicMatches.length} learner weakness(es): ${weakTopicMatches.slice(0, 3).join(', ')}`);
      }
    }

    // --- Recent mistakes alignment ---
    const mistakes = context.recentMistakes || [];
    if (mistakes.length > 0) {
      const mistakeTopics = mistakes.map(m => (m.label || '').toLowerCase()).filter(Boolean);
      const mistakeMatches = mistakeTopics.filter(t => combined.includes(t));

      if (mistakeMatches.length > 0) {
        totalScore += Math.min(0.2, mistakeMatches.length * 0.07);
        signalCount.push(`mistake_match:${mistakeMatches.length}`);
        evidence.push(`Video may help with recent mistake areas: ${mistakeMatches.slice(0, 2).join(', ')}`);
      }
    }

    // --- Topic/Subject alignment ---
    const activeTopic = context.activeTopic;
    const activeSubject = context.activeSubject;

    if (activeTopic) {
      const topicLower = activeTopic.toLowerCase();
      const topicTerms = topicLower.split(/\s+/).filter(t => t.length >= 3);
      const topicMatches = topicTerms.filter(t => combined.includes(t));
      if (topicMatches.length > 0) {
        const matchRatio = topicTerms.length > 0 ? topicMatches.length / topicTerms.length : 0;
        totalScore += Math.min(0.25, matchRatio * 0.25);
        signalCount.push('topic_match');
        evidence.push(`Video relates to active topic: "${activeTopic}"`);
      }
    }

    if (activeSubject) {
      const subjectLower = activeSubject.toLowerCase();
      if (combined.includes(subjectLower)) {
        totalScore += 0.1;
        signalCount.push('subject_match');
        evidence.push(`Video relates to active subject: "${activeSubject}"`);
      }
    }

    // --- Skill alignment ---
    const skillIds = context.skillIds || [];
    if (skillIds.length > 0) {
      // Simple signal: we have skill context (actual matching requires skill ontology)
      signalCount.push(`skill_context:${skillIds.length}`);
    }

    // --- Artifact signal ---
    if (context.artifactSignals && context.artifactSignals.length > 0) {
      const artifactLabels = context.artifactSignals.map(a => (a.label || '').toLowerCase()).filter(Boolean);
      const artifactMatches = artifactLabels.filter(l => combined.includes(l));
      if (artifactMatches.length > 0) {
        totalScore += 0.1;
        signalCount.push('artifact_match');
        evidence.push(`Video relates to active artifact context`);
      }
    }

    // Clamp and determine label
    const finalScore = Math.max(0, Math.min(1, totalScore));
    const hasLearnerData = weaknesses.length > 0 || mistakes.length > 0 || !!activeTopic;

    let label: VideoScoreDetail['label'];
    if (finalScore >= 0.7) {
      label = 'excellent';
    } else if (finalScore >= 0.5) {
      label = 'good';
    } else if (finalScore >= 0.35) {
      label = 'acceptable';
    } else if (!hasLearnerData) {
      label = 'unknown';
    } else {
      label = 'weak';
    }

    const confidence: VideoScoreDetail['confidence'] =
      signalCount.length >= 3 ? 'high'
      : signalCount.length >= 1 ? 'medium'
      : hasLearnerData ? 'medium'
      : 'low';

    const reason = signalCount.length > 0
      ? `Learner fit: matched ${signalCount.length} signal(s) (${signalCount.join(', ')})`
      : hasLearnerData
        ? 'Learner context available but no direct fit signals found'
        : 'No learner context available — neutral fit score';

    if (signalCount.length === 0 && hasLearnerData) {
      warnings.push('Learner data exists but video metadata does not clearly reference learner context');
    }

    return {
      score: {
        score: Math.round(finalScore * 100) / 100,
        label,
        reason,
        confidence,
        evidence: evidence.slice(0, 5),
        warnings: warnings.slice(0, 3),
      },
    };
  }

  /**
   * Context-aware convenience: build learner fit input from TutorTurnContext.
   */
  buildContextFromTutorTurn(tutorContext: TutorTurnContext | null): {
    learnerGrade?: string | null;
    learnerAge?: number | null;
    languagePreference?: string | null;
    weaknesses?: Array<{ label: string; summary?: string; confidence?: number }>;
    recentMistakes?: Array<{ label: string; summary?: string }>;
    strengths?: Array<{ label: string; summary?: string }>;
    activeTopic?: string | null;
    activeSubject?: string | null;
    skillIds?: string[];
    artifactSignals?: Array<{ label: string }>;
    practiceSignals?: Array<{ label: string; confidence?: number }>;
  } | null {
    if (!tutorContext) return null;

    return {
      learnerGrade: tutorContext.session?.learningMode || null,
      learnerAge: null, // Age not directly available in TutorTurnContext
      languagePreference: tutorContext.session?.primaryLanguage || null,
      weaknesses: (tutorContext.learnerProfile?.weaknesses || []).map(w => ({
        label: w.label,
        summary: w.summary,
        confidence: w.confidence,
      })),
      recentMistakes: (tutorContext.learnerProfile?.recentMistakes || []).map(m => ({
        label: m.label,
        summary: m.summary,
      })),
      strengths: (tutorContext.learnerProfile?.strengths || []).map(s => ({
        label: s.label,
        summary: s.summary,
      })),
      activeTopic: tutorContext.session?.activeTopic || null,
      activeSubject: tutorContext.session?.activeSubject || null,
      skillIds: tutorContext.session?.activeSkillIds || [],
      artifactSignals: (tutorContext.artifactContext?.summaries || []).map(a => ({
        label: a.label,
      })),
    };
  }

  /**
   * Extract numeric score.
   */
  extractNumericScore(detail: { score: VideoScoreDetail }): number {
    return detail.score.score;
  }
}

export const videoLearnerFitScorer = new VideoLearnerFitScorer();
