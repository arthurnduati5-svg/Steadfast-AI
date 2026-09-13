import type { CurriculumFamily, CurriculumTopic, CurriculumSkill, LearningObjective, PrerequisiteLink } from './task022ContentGovernanceContracts';

export class TopicSkillPrerequisiteMapService {
  private topicToSkills: Map<string, string[]> = new Map();
  private skillToPrerequisites: Map<string, string[]> = new Map();
  private skillToObjectives: Map<string, string[]> = new Map();
  private skillDetails: Map<string, CurriculumSkill> = new Map();
  private topicDetails: Map<string, CurriculumTopic> = new Map();
  private objectiveDetails: Map<string, LearningObjective> = new Map();
  private prerequisiteLinks: Map<string, PrerequisiteLink[]> = new Map();

  registerTopic(topic: CurriculumTopic): void {
    this.topicDetails.set(topic.topicId, topic);
  }

  registerSkill(skill: CurriculumSkill): void {
    this.skillDetails.set(skill.skillId, skill);
    const topicKey = skill.curriculumTopicId;
    if (!this.topicToSkills.has(topicKey)) this.topicToSkills.set(topicKey, []);
    const skills = this.topicToSkills.get(topicKey)!;
    if (!skills.includes(skill.skillId)) skills.push(skill.skillId);
  }

  registerObjective(objective: LearningObjective): void {
    this.objectiveDetails.set(objective.objectiveId, objective);
    const skillKey = objective.curriculumSkillId;
    if (!this.skillToObjectives.has(skillKey)) this.skillToObjectives.set(skillKey, []);
    const objectives = this.skillToObjectives.get(skillKey)!;
    if (!objectives.includes(objective.objectiveId)) objectives.push(objective.objectiveId);
  }

  registerPrerequisite(link: PrerequisiteLink): void {
    const fromKey = link.fromSkillId;
    if (!this.skillToPrerequisites.has(fromKey)) this.skillToPrerequisites.set(fromKey, []);
    const prereqs = this.skillToPrerequisites.get(fromKey)!;
    if (!prereqs.includes(link.toSkillId)) prereqs.push(link.toSkillId);

    if (!this.prerequisiteLinks.has(fromKey)) this.prerequisiteLinks.set(fromKey, []);
    const links = this.prerequisiteLinks.get(fromKey)!;
    links.push(link);
  }

  getSkillsForTopic(topicId: string): CurriculumSkill[] {
    const skillIds = this.topicToSkills.get(topicId) || [];
    return skillIds.map(id => this.skillDetails.get(id)).filter((s): s is CurriculumSkill => !!s);
  }

  getPrerequisitesForSkill(skillId: string): CurriculumSkill[] {
    const prereqIds = this.skillToPrerequisites.get(skillId) || [];
    return prereqIds.map(id => this.skillDetails.get(id)).filter((s): s is CurriculumSkill => !!s);
  }

  getPrerequisiteLinks(skillId: string): PrerequisiteLink[] {
    return this.prerequisiteLinks.get(skillId) || [];
  }

  getObjectivesForSkill(skillId: string): LearningObjective[] {
    const objectiveIds = this.skillToObjectives.get(skillId) || [];
    return objectiveIds.map(id => this.objectiveDetails.get(id)).filter((o): o is LearningObjective => !!o);
  }

  getSkill(skillId: string): CurriculumSkill | null {
    return this.skillDetails.get(skillId) || null;
  }

  getTopic(topicId: string): CurriculumTopic | null {
    return this.topicDetails.get(topicId) || null;
  }

  getObjective(objectiveId: string): LearningObjective | null {
    return this.objectiveDetails.get(objectiveId) || null;
  }

  getTopicCount(): number { return this.topicDetails.size; }
  getSkillCount(): number { return this.skillDetails.size; }
  getObjectiveCount(): number { return this.objectiveDetails.size; }
  getPrerequisiteCount(): number {
    let count = 0;
    for (const [, links] of this.prerequisiteLinks) count += links.length;
    return count;
  }

  reset(): void {
    this.topicToSkills.clear();
    this.skillToPrerequisites.clear();
    this.skillToObjectives.clear();
    this.skillDetails.clear();
    this.topicDetails.clear();
    this.objectiveDetails.clear();
    this.prerequisiteLinks.clear();
  }
}

export const topicSkillPrerequisiteMapService = new TopicSkillPrerequisiteMapService();
