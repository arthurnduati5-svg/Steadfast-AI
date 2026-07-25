let checks: any[] = []

export class Phase3DailyObjectiveCheckRepository {
  async createCheck(input: any): Promise<any> {
    const check = { id: `check_${checks.length + 1}`, ...input, completedSteps: [], createdAt: new Date().toISOString() }
    checks.push(check)
    return check
  }

  async getCheck(id: string): Promise<any | null> {
    return checks.find(c => c.id === id) || null
  }

  async findChecksByObjective(objectiveId: string): Promise<any[]> {
    return checks.filter(c => c.objectiveId === objectiveId)
  }

  async findAll(): Promise<any[]> {
    return [...checks]
  }

  markRequiredStepCompleted(checkSessionId: string, step: string): void {
    const check = checks.find(c => c.checkSessionId === checkSessionId || c.id === checkSessionId)
    if (check) {
      if (!check.completedSteps) check.completedSteps = []
      if (!check.completedSteps.includes(step)) check.completedSteps.push(step)
    }
  }

  resetPhase3DailyObjectiveCheckRepositoryForTests(): void {
    checks.length = 0
  }
}
