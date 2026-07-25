let store: any[] = []
let masterySnapshots: any[] = []

export class Phase3ObjectiveRepository {
  createObjective(input: any): any {
    const id = `obj_${store.length + 1}`
    const obj = { id, objectiveId: id, ...input, createdAt: new Date().toISOString() }
    store.push(obj)
    return obj
  }

  getObjective(id: string): any | null {
    return store.find(o => o.id === id || o.objectiveId === id) || null
  }

  async findObjectiveByLearningTarget(learningTargetId: string): Promise<any | null> {
    return store.find(o => o.learningTargetId === learningTargetId) || null
  }

  async findObjectivesBySchool(schoolId: string): Promise<any[]> {
    return store.filter(o => o.schoolId === schoolId)
  }

  async findAll(): Promise<any[]> {
    return [...store]
  }

  async updateObjective(id: string, updates: any): Promise<any | null> {
    const idx = store.findIndex(o => o.id === id || o.objectiveId === id)
    if (idx === -1) return null
    store[idx] = { ...store[idx], ...updates }
    return store[idx]
  }

  async updateObjectiveMastery(id: string, mastery: any): Promise<any | null> {
    const idx = store.findIndex(o => o.id === id || o.objectiveId === id)
    if (idx === -1) return null
    store[idx] = { ...store[idx], mastery, lastUpdated: new Date().toISOString() }
    return store[idx]
  }

  async findObjectivesByStudent(studentId: string): Promise<any[]> {
    return store.filter(o => o.studentId === studentId)
  }

  getObjectiveMasterySnapshot(objectiveId: string, studentId: string): any | null {
    return masterySnapshots.find(s => s.objectiveId === objectiveId && s.studentId === studentId) || null
  }

  recordObjectiveMasterySnapshot(objectiveId: string, studentId: string, data: any): any {
    const snapshot = { snapshotId: `ms_${masterySnapshots.length + 1}`, objectiveId, studentId, ...data, capturedAt: new Date().toISOString() }
    masterySnapshots.push(snapshot)
    return snapshot
  }

  resetPhase3ObjectiveRepositoryForTests(): void {
    store.length = 0
    masterySnapshots.length = 0
  }
}
