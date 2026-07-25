import { Phase3ObjectiveRepository } from './phase3ObjectiveRepository'

let sessions: any[] = []

export class Phase3DailyObjectiveCheckSessionService {
  startDailyObjectiveCheckSession(input: any): { error?: string; session?: any } {
    const repo = new Phase3ObjectiveRepository()
    const objective = repo.getObjective(input.objectiveId)
    const skillId = objective?.skillId

    const session = {
      checkSessionId: `cs_${sessions.length + 1}`,
      ...input,
      skillId,
      blueprintId: `bp_${Date.now()}`,
      requiredSteps: ['confidence_before', 'attempt', 'confidence_after'],
      startedAt: new Date().toISOString(),
    }
    sessions.push(session)
    return { session }
  }

  getSessionByCheckSessionId(checkSessionId: string): any | null {
    return sessions.find(s => s.checkSessionId === checkSessionId) || null
  }

  resetSessionStoreForTests(): void {
    sessions.length = 0
  }
}
