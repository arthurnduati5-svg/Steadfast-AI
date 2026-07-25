let records: any[] = []

export class Phase3DailyObjectiveConfidenceService {
  recordConfidenceBefore(input: any): any {
    const record = { id: `conf_${records.length + 1}`, ...input, recordedAt: new Date().toISOString() }
    records.push(record)
    return record
  }

  resetConfidenceRecordsForTests(): void {
    records.length = 0
  }
}
