import type { CurriculumFamily, CurriculumVersion, CurriculumSubject, CurriculumStage, CurriculumTopic, CurriculumSkill, LearningObjective, PrerequisiteLink, CurriculumMap, CurriculumVersionStatus } from './task022ContentGovernanceContracts';
import { topicSkillPrerequisiteMapService } from './task022TopicSkillPrerequisiteMapService';

export interface CurriculumRegistryAdapter {
  registerFamily(family: CurriculumFamily, versions: CurriculumVersion[]): void;
  activateVersion(schoolId: string, family: CurriculumFamily, versionId: string): boolean;
  resolveSubject(family: CurriculumFamily, subjectName: string): CurriculumSubject | null;
  resolveTopic(family: CurriculumFamily, subject: string, topicName: string): CurriculumTopic | null;
  resolveSkill(topicId: string, skillName: string): CurriculumSkill | null;
  resolveObjective(skillId: string, objectiveCode?: string): LearningObjective | null;
  resolvePrerequisites(skillId: string): PrerequisiteLink[];
  getCurriculumMap(family: CurriculumFamily, versionId?: string): CurriculumMap | null;
  getActiveVersion(schoolId: string, family: CurriculumFamily): CurriculumVersion | null;
  isDeprecated(versionId: string): boolean;
  isBlocked(versionId: string): boolean;
}

export class CurriculumRegistryService {
  private families: Map<string, CurriculumVersion[]> = new Map();
  private schoolActivations: Map<string, Map<string, string>> = new Map();
  private subjects: Map<string, CurriculumSubject[]> = new Map();
  private stages: Map<string, CurriculumStage[]> = new Map();
  private topics: Map<string, CurriculumTopic[]> = new Map();
  private skills: Map<string, CurriculumSkill[]> = new Map();
  private objectives: Map<string, LearningObjective[]> = new Map();
  private prerequisites: Map<string, PrerequisiteLink[]> = new Map();

  registerFamily(family: CurriculumFamily, versions: CurriculumVersion[]): void {
    this.families.set(family, versions);
  }

  activateVersion(schoolId: string, family: CurriculumFamily, versionId: string): boolean {
    if (!this.schoolActivations.has(schoolId)) {
      this.schoolActivations.set(schoolId, new Map());
    }
    const familyMap = this.schoolActivations.get(schoolId)!;

    const versions = this.families.get(family);
    if (!versions) return false;
    const version = versions.find(v => v.id === versionId);
    if (!version) return false;
    if (version.status === 'blocked' || version.status === 'archived') return false;

    familyMap.set(family, versionId);
    return true;
  }

  registerSubject(family: CurriculumFamily, subject: CurriculumSubject): void {
    const key = family;
    if (!this.subjects.has(key)) this.subjects.set(key, []);
    this.subjects.get(key)!.push(subject);
  }

  registerStage(family: CurriculumFamily, stage: CurriculumStage): void {
    const key = family;
    if (!this.stages.has(key)) this.stages.set(key, []);
    this.stages.get(key)!.push(stage);
  }

  registerTopic(family: CurriculumFamily, topic: CurriculumTopic): void {
    const key = `${family}:${topic.subject}`;
    if (!this.topics.has(key)) this.topics.set(key, []);
    this.topics.get(key)!.push(topic);
    topicSkillPrerequisiteMapService.registerTopic(topic);
  }

  registerSkill(family: CurriculumFamily, skill: CurriculumSkill): void {
    const key = `${family}:${skill.curriculumTopicId}`;
    if (!this.skills.has(key)) this.skills.set(key, []);
    this.skills.get(key)!.push(skill);
    topicSkillPrerequisiteMapService.registerSkill(skill);
  }

  registerObjective(family: CurriculumFamily, objective: LearningObjective): void {
    const key = `${family}:${objective.curriculumSkillId}`;
    if (!this.objectives.has(key)) this.objectives.set(key, []);
    this.objectives.get(key)!.push(objective);
    topicSkillPrerequisiteMapService.registerObjective(objective);
  }

  registerPrerequisite(family: CurriculumFamily, link: PrerequisiteLink): void {
    const key = `${family}:${link.fromSkillId}`;
    if (!this.prerequisites.has(key)) this.prerequisites.set(key, []);
    this.prerequisites.get(key)!.push(link);
    topicSkillPrerequisiteMapService.registerPrerequisite(link);
  }

  resolveSubject(family: CurriculumFamily, subjectName: string): CurriculumSubject | null {
    const subjects = this.subjects.get(family) || [];
    const normalized = subjectName.toLowerCase().trim();
    const found = subjects.find(s => s.normalizedName === normalized || s.name.toLowerCase() === normalized);
    if (found) return found;
    const prefix = `${family}:${subjectName}`;
    for (const key of this.topics.keys()) {
      if (key.toLowerCase() === prefix.toLowerCase()) {
        return { subjectId: `${family}:${subjectName}`, name: subjectName, normalizedName: normalized, curriculumFamily: family };
      }
    }
    return null;
  }

  resolveTopic(family: CurriculumFamily, subject: string, topicName: string): CurriculumTopic | null {
    const key = `${family}:${subject}`;
    const topics = this.topics.get(key) || [];
    const normalized = topicName.toLowerCase().trim();
    return topics.find(t => t.title.toLowerCase() === normalized || t.title.toLowerCase().includes(normalized)) || null;
  }

  resolveSkill(topicId: string): CurriculumSkill[] {
    const result: CurriculumSkill[] = [];
    for (const [key, skills] of this.skills) {
      if (key.endsWith(`:${topicId}`)) {
        result.push(...skills);
      }
    }
    return result;
  }

  resolveObjective(skillId: string): LearningObjective[] {
    const result: LearningObjective[] = [];
    for (const [key, objectives] of this.objectives) {
      if (key.endsWith(`:${skillId}`)) {
        result.push(...objectives);
      }
    }
    return result;
  }

  resolvePrerequisites(skillId: string): PrerequisiteLink[] {
    const result: PrerequisiteLink[] = [];
    for (const [key, links] of this.prerequisites) {
      if (key.endsWith(`:${skillId}`)) {
        result.push(...links);
      }
    }
    return result;
  }

  getCurriculumMap(family: CurriculumFamily, versionId?: string): CurriculumMap | null {
    const versions = this.families.get(family);
    if (!versions || versions.length === 0) return null;

    const version = versionId ? versions.find(v => v.id === versionId) : versions.find(v => v.status === 'active');
    if (!version) return null;

    const allTopics: CurriculumTopic[] = [];
    const allSkills: CurriculumSkill[] = [];
    const allObjectives: LearningObjective[] = [];
    const allPrerequisites: PrerequisiteLink[] = [];

    const subjects = this.subjects.get(family) || [];
    if (subjects.length > 0) {
      for (const subject of subjects) {
        const topicKey = `${family}:${subject.name}`;
        const subjectTopics = this.topics.get(topicKey) || [];
        allTopics.push(...subjectTopics);

        for (const topic of subjectTopics) {
          const skillKey = `${family}:${topic.topicId}`;
          const topicSkills = this.skills.get(skillKey) || [];
          allSkills.push(...topicSkills);

          for (const skill of topicSkills) {
            const objKey = `${family}:${skill.skillId}`;
            const skillObjectives = this.objectives.get(objKey) || [];
            allObjectives.push(...skillObjectives);

            const prereqKey = `${family}:${skill.skillId}`;
            const skillPrereqs = this.prerequisites.get(prereqKey) || [];
            allPrerequisites.push(...skillPrereqs);
          }
        }
      }
    } else {
      for (const [key, topics] of this.topics) {
        if (key.startsWith(`${family}:`)) {
          allTopics.push(...topics);
          for (const topic of topics) {
            const skillKey = `${family}:${topic.topicId}`;
            const topicSkills = this.skills.get(skillKey) || [];
            allSkills.push(...topicSkills);

            for (const skill of topicSkills) {
              const objKey = `${family}:${skill.skillId}`;
              const skillObjectives = this.objectives.get(objKey) || [];
              allObjectives.push(...skillObjectives);

              const prereqKey = `${family}:${skill.skillId}`;
              const skillPrereqs = this.prerequisites.get(prereqKey) || [];
              allPrerequisites.push(...skillPrereqs);
            }
          }
        }
      }
    }

    return {
      curriculumFamily: family,
      curriculumVersion: version,
      topics: allTopics,
      skills: allSkills,
      objectives: allObjectives,
      prerequisites: allPrerequisites,
    };
  }

  getActiveVersion(schoolId: string, family: CurriculumFamily): CurriculumVersion | null {
    const familyMap = this.schoolActivations.get(schoolId);
    if (!familyMap) return null;
    const versionId = familyMap.get(family);
    if (!versionId) return null;
    const versions = this.families.get(family);
    if (!versions) return null;
    return versions.find(v => v.id === versionId) || null;
  }

  isDeprecated(versionId: string): boolean {
    for (const [, versions] of this.families) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version.status === 'deprecated';
    }
    return false;
  }

  isBlocked(versionId: string): boolean {
    for (const [, versions] of this.families) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version.status === 'blocked';
    }
    return false;
  }

  reset(): void {
    this.families.clear();
    this.schoolActivations.clear();
    this.subjects.clear();
    this.stages.clear();
    this.topics.clear();
    this.skills.clear();
    this.objectives.clear();
    this.prerequisites.clear();
    topicSkillPrerequisiteMapService.reset();
  }
}

export const curriculumRegistryService = new CurriculumRegistryService();
