export interface ScoringMetadataInput {
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  usedHint?: boolean;
  retrievalSignal?: string;
  recallStrengthBucket?: string;
}

export interface ScoringMetadataResult {
  scoreBucket: string;
  answerQuality: string;
  isCorrect: boolean;
  mistakeCategory: string;
  retrievalSignal: string;
  recallStrengthBucket: string;
}

export function computeScoringMetadata(input: ScoringMetadataInput): ScoringMetadataResult {
  let scoreBucket = 'not_scored';
  let isCorrect = input.isCorrect ?? false;

  if (input.answerQuality === 'correct') {
    scoreBucket = 'full';
    isCorrect = true;
  } else if (input.answerQuality === 'mostly_correct') {
    scoreBucket = 'near_full';
    isCorrect = true;
  } else if (input.answerQuality === 'partially_correct') {
    scoreBucket = 'partial';
    isCorrect = false;
  } else if (input.answerQuality === 'incorrect') {
    scoreBucket = 'low';
    isCorrect = false;
  } else if (input.answerQuality === 'blank' || input.answerQuality === 'unanswered') {
    scoreBucket = 'zero';
    isCorrect = false;
  } else {
    scoreBucket = 'not_scored';
  }

  return {
    scoreBucket,
    answerQuality: input.answerQuality || 'not_evaluated',
    isCorrect,
    mistakeCategory: input.mistakeCategory || 'unknown',
    retrievalSignal: input.retrievalSignal || 'unknown',
    recallStrengthBucket: input.recallStrengthBucket || 'unknown',
  };
}
