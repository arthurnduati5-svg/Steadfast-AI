import type { DifficultySignalInput, DifficultyLevel, SupportLevel } from './task015Contracts';

export interface AggregatedSignals {
  totalAttempts: number;
  correctIndependentCount: number;
  correctWithHintCount: number;
  partialCount: number;
  incorrectCount: number;
  repeatedMistakeCount: number;
  tooEasyCount: number;
  tooHardCount: number;
  stillConfusedCount: number;
  challengeRequestCount: number;
  hintRequestCount: number;
  recentSuccessRate: number;
  recentStruggleRate: number;
}

export class DifficultySignalAggregator {
  aggregate(signals: DifficultySignalInput[]): AggregatedSignals {
    const total = signals.length;
    let correctIndependent = 0;
    let correctWithHint = 0;
    let partial = 0;
    let incorrect = 0;
    let repeated = 0;
    let tooEasy = 0;
    let tooHard = 0;
    let confused = 0;
    let challengeReq = 0;
    let hintReq = 0;

    for (const s of signals) {
      if (s.correctIndependent) correctIndependent++;
      if (s.correctWithHint) correctWithHint++;
      if (s.partialAnswer) partial++;
      if (s.incorrectAnswer) incorrect++;
      if (s.repeatedMistake) repeated++;
      if (s.tooEasyFeedback) tooEasy++;
      if (s.tooHardFeedback) tooHard++;
      if (s.stillConfusedFeedback) confused++;
      if (s.challengeRequested) challengeReq++;
      if (s.hintRequested) hintReq++;
    }

    const totalAttempts = correctIndependent + correctWithHint + partial + incorrect;
    const successRate = totalAttempts > 0
      ? (correctIndependent + correctWithHint + partial * 0.5) / totalAttempts
      : 0;
    const struggleRate = totalAttempts > 0
      ? (incorrect + repeated) / totalAttempts
      : 0;

    return {
      totalAttempts,
      correctIndependentCount: correctIndependent,
      correctWithHintCount: correctWithHint,
      partialCount: partial,
      incorrectCount: incorrect,
      repeatedMistakeCount: repeated,
      tooEasyCount: tooEasy,
      tooHardCount: tooHard,
      stillConfusedCount: confused,
      challengeRequestCount: challengeReq,
      hintRequestCount: hintReq,
      recentSuccessRate: successRate,
      recentStruggleRate: struggleRate,
    };
  }
}

export const difficultySignalAggregator = new DifficultySignalAggregator();
