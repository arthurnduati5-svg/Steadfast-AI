export interface MasteryMetadataInput {
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  misconceptionSignal?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  explanationStrengthBucket?: string;
}

export interface MasteryMetadataResult {
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  misconceptionSignal?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  explanationStrengthBucket?: string;
}

export function computeMasteryMetadata(input: MasteryMetadataInput): MasteryMetadataResult {
  return {
    explanationQuality: input.explanationQuality || undefined,
    conceptCoverageBucket: input.conceptCoverageBucket || undefined,
    clarityBucket: input.clarityBucket || undefined,
    misconceptionSignal: input.misconceptionSignal || undefined,
    supportNeed: input.supportNeed || undefined,
    masterySignal: input.masterySignal || undefined,
    readinessSignal: input.readinessSignal || undefined,
    explanationStrengthBucket: input.explanationStrengthBucket || undefined,
  };
}
