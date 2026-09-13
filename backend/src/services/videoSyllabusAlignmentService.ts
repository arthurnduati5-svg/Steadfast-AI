// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Syllabus Alignment Service v1
// Scores video candidates against syllabus objectives,
// topic, and skill relevance using structured context.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoRecommendationEvidence } from './videoRecommendationContracts';

export class VideoSyllabusAlignmentService {
  /**
   * Score syllabus alignment for a video candidate.
   * Uses structured context (subject, topic, skillIds) and
   * candidate metadata (title, description, transcriptSummary).
   */
  scoreAlignment(
    candidate: VideoCandidateInput,
    context: {
      subject?: string | null;
      topic?: string | null;
      skillIds?: string[];
      syllabusObjectiveIds?: string[];
    },
  ): { score: number; evidence: VideoRecommendationEvidence[] } {
    const evidence: VideoRecommendationEvidence[] = [];
    const title = (candidate.title || '').toLowerCase();
    const description = (candidate.description || '').toLowerCase();
    const combinedText = `${title} ${description} ${(candidate.transcriptSummary || '').toLowerCase()}`;
    const topic = (context.topic || '').toLowerCase();
    const subject = (context.subject || '').toLowerCase();

    // Exact syllabus objective or skill match
    if (context.syllabusObjectiveIds && context.syllabusObjectiveIds.length > 0) {
      const matchedObjectives = context.syllabusObjectiveIds.filter(id =>
        combinedText.includes(id.toLowerCase()),
      );
      if (matchedObjectives.length > 0) {
        evidence.push({
          dimension: 'syllabus_alignment',
          score: 0.95,
          reason: `Direct syllabus objective match: ${matchedObjectives.join(', ')}`,
          source: 'structured_context',
        });
        return { score: 0.95, evidence };
      }
    }

    // Strong topic match
    if (topic && topic.length >= 3) {
      if (combinedText.includes(topic)) {
        const topicTerms = topic.split(/\s+/);
        const matchRatio = topicTerms.filter(t => combinedText.includes(t)).length / topicTerms.length;
        if (matchRatio >= 0.7) {
          evidence.push({
            dimension: 'syllabus_alignment',
            score: 0.85,
            reason: `Strong topic match: "${topic}" appears in video metadata`,
            source: 'candidate_metadata',
          });
          return { score: 0.85, evidence };
        }
        if (matchRatio >= 0.4) {
          evidence.push({
            dimension: 'syllabus_alignment',
            score: 0.65,
            reason: `Partial topic match for: "${topic}"`,
            source: 'candidate_metadata',
          });
          return { score: 0.65, evidence };
        }
      }

      // Check individual topic keywords
      const topicKeywords = topic.split(/\s+/).filter(t => t.length >= 4);
      const keywordMatches = topicKeywords.filter(t => combinedText.includes(t));
      if (keywordMatches.length > 0) {
        const matchRatio = keywordMatches.length / topicKeywords.length;
        const score = 0.3 + (matchRatio * 0.4);
        evidence.push({
          dimension: 'syllabus_alignment',
          score: Math.min(0.7, score),
          reason: `Keyword matches: ${keywordMatches.join(', ')}`,
          source: 'candidate_metadata',
        });
        return { score: Math.min(0.7, score), evidence };
      }
    }

    // Subject-level relevance
    if (subject && subject.length >= 3) {
      if (combinedText.includes(subject)) {
        evidence.push({
          dimension: 'syllabus_alignment',
          score: 0.45,
          reason: `Related subject: "${subject}"`,
          source: 'candidate_metadata',
        });
        return { score: 0.45, evidence };
      }
    }

    // Weak/no alignment
    evidence.push({
      dimension: 'syllabus_alignment',
      score: 0.15,
      reason: topic
        ? `Weak topic relation — video metadata does not clearly reference "${topic}"`
        : 'No topic provided for syllabus alignment',
      source: topic ? 'candidate_metadata' : 'structured_context',
    });
    return { score: 0.15, evidence };
  }

  /**
   * Score topic relevance independently when syllabus data is missing.
   */
  scoreTopicRelevance(
    candidate: VideoCandidateInput,
    topic?: string | null,
  ): { score: number; evidence: VideoRecommendationEvidence[] } {
    if (!topic) {
      return {
        score: 0,
        evidence: [{
          dimension: 'topic_relevance',
          score: 0,
          reason: 'No topic provided — cannot assess relevance',
          source: 'structured_context',
        }],
      };
    }

    const combinedText = `${(candidate.title || '').toLowerCase()} ${(candidate.description || '').toLowerCase()}`;
    const topicLower = topic.toLowerCase();
    const topicTerms = topicLower.split(/\s+/).filter(t => t.length >= 3);

    const exactMatch = combinedText.includes(topicLower);
    const termMatches = topicTerms.filter(t => combinedText.includes(t)).length;
    const matchRatio = topicTerms.length > 0 ? termMatches / topicTerms.length : 0;

    if (exactMatch) {
      return {
        score: 0.9,
        evidence: [{
          dimension: 'topic_relevance',
          score: 0.9,
          reason: `Exact topic match: "${topic}"`,
          source: 'candidate_metadata',
        }],
      };
    }

    if (matchRatio >= 0.5) {
      return {
        score: 0.6,
        evidence: [{
          dimension: 'topic_relevance',
          score: 0.6,
          reason: `Partial topic match (${Math.round(matchRatio * 100)}% term overlap)`,
          source: 'candidate_metadata',
        }],
      };
    }

    return {
      score: 0.2,
      evidence: [{
        dimension: 'topic_relevance',
        score: 0.2,
        reason: 'Topic relevance low — no clear topic keywords in metadata',
        source: 'candidate_metadata',
      }],
    };
  }
}

export const videoSyllabusAlignmentService = new VideoSyllabusAlignmentService();
