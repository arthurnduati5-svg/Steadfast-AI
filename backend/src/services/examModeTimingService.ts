export interface ExamTimerState {
  timerMode: string;
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  elapsedSeconds?: number;
  timeSpentBucket?: string;
  timePressureSignal?: string;
}

export function initializeTimerMetadata(timerMode: string): ExamTimerState {
  return {
    timerMode,
    timeSpentBucket: 'unknown',
    timePressureSignal: 'none',
  };
}

export function pauseTimer(state: ExamTimerState, now: Date): ExamTimerState {
  const elapsed = state.startedAt
    ? Math.floor((now.getTime() - new Date(state.startedAt).getTime()) / 1000)
    : 0;
  return {
    ...state,
    pausedAt: now.toISOString(),
    elapsedSeconds: elapsed,
  };
}

export function resumeTimer(state: ExamTimerState, now: Date): ExamTimerState {
  return {
    ...state,
    resumedAt: now.toISOString(),
    startedAt: state.startedAt || now.toISOString(),
  };
}

export function deriveTimeSpentBucket(elapsedSeconds?: number): string {
  if (elapsedSeconds === undefined) return 'unknown';
  if (elapsedSeconds < 60) return 'under_1_min';
  if (elapsedSeconds < 300) return '1_5_min';
  if (elapsedSeconds < 600) return '5_10_min';
  if (elapsedSeconds < 1200) return '10_20_min';
  if (elapsedSeconds < 2400) return '20_40_min';
  if (elapsedSeconds < 3600) return '40_60_min';
  return 'over_60_min';
}

export function deriveTimePressureSignal(
  timeSpentBucket: string,
  questionCount: number,
  currentIndex: number,
): string {
  if (questionCount <= 1) return 'none';
  const progress = currentIndex / questionCount;
  if (progress < 0.2 && timeSpentBucket === 'over_60_min') return 'rushed';
  if (progress < 0.3 && (timeSpentBucket === '20_40_min' || timeSpentBucket === '40_60_min')) return 'slow_start';
  if (progress > 0.8 && timeSpentBucket !== 'over_60_min') return 'paced_well';
  return 'none';
}

export function buildTimerState(examSession: any): ExamTimerState {
  const timerMode = examSession.timerMode || 'untimed';
  return {
    timerMode,
    timeSpentBucket: 'unknown',
    timePressureSignal: 'none',
  };
}
