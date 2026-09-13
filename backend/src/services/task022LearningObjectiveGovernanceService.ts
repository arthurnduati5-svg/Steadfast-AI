import type { CurriculumFamily, LearningObjective, ContentItemStatus } from './task022ContentGovernanceContracts';

export class LearningObjectiveGovernanceService {
  private objectives: Map<string, LearningObjective> = new Map();
  private familyObjectives: Map<string, string[]> = new Map();

  registerObjective(objective: LearningObjective): void {
    this.objectives.set(objective.objectiveId, objective);
    const key = objective.curriculumSkillId;
    if (!this.familyObjectives.has(key)) this.familyObjectives.set(key, []);
    const ids = this.familyObjectives.get(key)!;
    if (!ids.includes(objective.objectiveId)) ids.push(objective.objectiveId);
  }

  getObjective(objectiveId: string): LearningObjective | null {
    return this.objectives.get(objectiveId) || null;
  }

  getObjectivesForSkill(skillId: string): LearningObjective[] {
    const ids = this.familyObjectives.get(skillId) || [];
    return ids.map(id => this.objectives.get(id)).filter((o): o is LearningObjective => !!o);
  }

  getActiveObjectivesForSkill(skillId: string): LearningObjective[] {
    return this.getObjectivesForSkill(skillId).filter(o => o.status === 'active' || o.status === 'approved');
  }

  isObjectiveActive(objectiveId: string): boolean {
    const obj = this.objectives.get(objectiveId);
    return !!obj && (obj.status === 'active' || obj.status === 'approved');
  }

  countObjectives(): number { return this.objectives.size; }

  reset(): void {
    this.objectives.clear();
    this.familyObjectives.clear();
  }
}

export const learningObjectiveGovernanceService = new LearningObjectiveGovernanceService();
