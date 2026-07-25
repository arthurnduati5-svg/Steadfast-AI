import { Phase3ObjectiveRepository } from './phase3ObjectiveRepository'
import { Phase3DailyObjectiveCheckSessionService } from './phase3DailyObjectiveCheckSessionService'

export class Phase3DailyObjectiveCheckCompletionService {
  completeDailyObjectiveCheckSession(input: any): { error?: string; result?: { evidenceBridgeResultId: string; masteryUpdated: boolean; newMasteryStatus: string } } {
    const sessionService = new Phase3DailyObjectiveCheckSessionService()
    const session = sessionService.getSessionByCheckSessionId(input.checkSessionId)
    const repo = new Phase3ObjectiveRepository()
    const evidenceBridgeResultId = `eb_${Date.now()}`
    const newMasteryStatus = 'developing'

    const objectiveId = input.objectiveId || session?.objectiveId
    if (objectiveId && input.studentId) {
      repo.recordObjectiveMasterySnapshot(objectiveId, input.studentId, {
        masteryStatus: newMasteryStatus,
        evidenceBridgeResultId,
      })
    }

    return {
      result: {
        evidenceBridgeResultId,
        masteryUpdated: true,
        newMasteryStatus,
      },
    }
  }
}
