let signals: any[] = []

export class Phase3DailyObjectiveCheckAttemptService {
  recordSafeAttemptSignal(input: any): any {
    const signal = { id: `sig_${signals.length + 1}`, ...input, recordedAt: new Date().toISOString() }
    signals.push(signal)
    return signal
  }

  resetAttemptSignalsForTests(): void {
    signals.length = 0
  }
}
