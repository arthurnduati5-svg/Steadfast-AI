import type { MistakeAnalysis, MistakeCategory } from './mistakeTaxonomyContracts';
import type { StepCheckResult } from './stepCheckingContracts';

export interface MistakeTaxonomyInput {
  requestId: string;
  stepCheckResult?: StepCheckResult;
  learnerAttempt?: string;
  subjectContext?: string;
  deenSourceSensitive?: boolean;
}

const MISTAKE_KEYWORDS: Record<MistakeCategory, string[]> = {
  concept_misunderstanding: ['don\'t understand', 'confused', 'not sure', 'what is', 'meaning', 'concept'],
  calculation_error: ['calculated', 'got ', 'answer is', 'equals', 'sum', 'difference', 'product'],
  reading_misinterpretation: ['read', 'question', 'problem says', 'misread', 'thought it meant'],
  vocabulary_gap: ['what does', 'term', 'word', 'define', 'called', 'meaning of'],
  procedure_step_missed: ['step', 'first', 'then', 'next', 'after', 'how to start', 'what to do'],
  reasoning_gap: ['because', 'so', 'therefore', 'if', 'then', 'reason', 'logical'],
  careless_error: ['oops', 'mistake', 'silly', 'accidentally', 'forgot', 'missed'],
  source_confusion: ['source', 'reference', 'book says', 'according to', 'where'],
  overgeneralization: ['always', 'never', 'every', 'all', 'none', 'everything'],
  memorization_without_understanding: ['memorised', 'remembered', 'recite', 'by heart', 'rote'],
  language_expression_issue: ['write', 'paragraph', 'essay', 'sentence', 'express', 'word'],
  deen_source_sensitive_issue: ['ayah', 'surah', 'hadith', 'quran', 'islam', 'deen', 'allah', 'prophet'],
  unknown: [],
};

function classifyByKeywords(attempt: string): { category: MistakeCategory; confidence: 'high' | 'medium' | 'low' | 'unknown'; evidence: string[] } {
  const lowerAttempt = attempt.toLowerCase();
  const matches: Array<{ category: MistakeCategory; count: number; words: string[] }> = [];

  for (const [category, keywords] of Object.entries(MISTAKE_KEYWORDS)) {
    const found = keywords.filter(kw => lowerAttempt.includes(kw));
    if (found.length > 0) {
      matches.push({
        category: category as MistakeCategory,
        count: found.length,
        words: found,
      });
    }
  }

  if (matches.length === 0) {
    return { category: 'unknown',     confidence: 'unknown',
    evidence: ['No clear mistake pattern detected'] };
  }

  matches.sort((a, b) => b.count - a.count);
  const top = matches[0];

  const confidence = top.count >= 3 ? 'high' : top.count >= 2 ? 'medium' : 'low';

  return {
    category: top.category,
    confidence,
    evidence: top.words.map(w => `matched keyword: "${w}"`),
  };
}

function getFeedbackStrategy(category: MistakeCategory): string {
  switch (category) {
    case 'concept_misunderstanding': return 'Re-explain the core concept with a different approach. Use an analogy or concrete example.';
    case 'calculation_error': return 'Guide the learner to re-check their arithmetic step by step.';
    case 'reading_misinterpretation': return 'Ask the learner to re-read the problem and identify key information.';
    case 'vocabulary_gap': return 'Define the key term simply and ask the learner to use it in a sentence.';
    case 'procedure_step_missed': return 'Break the procedure into numbered steps and ask which one was missed.';
    case 'reasoning_gap': return 'Ask the learner to explain each step of their reasoning out loud.';
    case 'careless_error': return 'Encourage the learner to review their work slowly and check each part.';
    case 'source_confusion': return 'Clarify which source or reference is relevant and why.';
    case 'overgeneralization': return 'Help the learner identify exceptions and boundary conditions.';
    case 'memorization_without_understanding': return 'Ask application-level questions to deepen understanding beyond recall.';
    case 'language_expression_issue': return 'Provide a sentence structure or prompt to help organise thoughts.';
    case 'deen_source_sensitive_issue': return 'Refer to Deen policy for appropriate handling of source-sensitive content.';
    default: return 'Ask a clarifying question to understand the difficulty better.';
  }
}

function getRevisionTag(category: MistakeCategory): string {
  return `mistake:${category}`;
}

function getPracticeRecommendation(category: MistakeCategory): string {
  switch (category) {
    case 'concept_misunderstanding': return 'Practice with concept-check questions';
    case 'calculation_error': return 'Practice with calculation drills';
    case 'reading_misinterpretation': return 'Practice reading comprehension';
    case 'vocabulary_gap': return 'Practice with vocabulary exercises';
    case 'procedure_step_missed': return 'Practice step-by-step procedure problems';
    case 'reasoning_gap': return 'Practice explaining reasoning out loud';
    case 'careless_error': return 'Practice with attention-to-detail exercises';
    case 'source_confusion': return 'Practice identifying correct sources';
    case 'overgeneralization': return 'Practice with diverse problem types';
    case 'memorization_without_understanding': return 'Practice with application problems';
    case 'language_expression_issue': return 'Practice with sentence and paragraph writing';
    case 'deen_source_sensitive_issue': return 'Refer to approved Deen sources';
    default: return 'General practice recommended';
  }
}

export function analyzeMistake(input: MistakeTaxonomyInput): MistakeAnalysis {
  if (input.deenSourceSensitive) {
    return {
      requestId: input.requestId,
      category: 'deen_source_sensitive_issue',
      confidence: 'medium',
      evidence: ['Deen-related content requires source verification'],
      feedbackStrategy: getFeedbackStrategy('deen_source_sensitive_issue'),
      revisionTag: getRevisionTag('deen_source_sensitive_issue'),
      practiceRecommendation: getPracticeRecommendation('deen_source_sensitive_issue'),
    };
  }

  if (input.stepCheckResult) {
    if (input.stepCheckResult.status === 'correct') {
      return {
        requestId: input.requestId,
        category: 'unknown',
        confidence: 'low',
        evidence: ['Step check indicates correct answer'],
        feedbackStrategy: 'No mistake detected - provide positive reinforcement.',
        revisionTag: 'no_mistake',
        practiceRecommendation: 'Challenge with harder problems.',
      };
    }

    if (input.stepCheckResult.status === 'needs_source_check') {
      return {
        requestId: input.requestId,
        category: 'source_confusion',
        confidence: 'medium',
        evidence: ['Step check indicates source verification needed'],
        feedbackStrategy: getFeedbackStrategy('source_confusion'),
        revisionTag: getRevisionTag('source_confusion'),
        practiceRecommendation: getPracticeRecommendation('source_confusion'),
      };
    }
  }

  if (input.learnerAttempt) {
    const keywordResult = classifyByKeywords(input.learnerAttempt);
    return {
      requestId: input.requestId,
      ...keywordResult,
      feedbackStrategy: getFeedbackStrategy(keywordResult.category),
      revisionTag: getRevisionTag(keywordResult.category),
      practiceRecommendation: getPracticeRecommendation(keywordResult.category),
    };
  }

  return {
    requestId: input.requestId,
    category: 'unknown',
    confidence: 'unknown',
    evidence: ['Insufficient information to classify mistake'],
    feedbackStrategy: 'Ask the learner to explain their thinking.',
    revisionTag: 'unknown',
    practiceRecommendation: 'General practice recommended',
  };
}
