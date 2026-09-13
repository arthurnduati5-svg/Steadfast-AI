import type { CurriculumFamily, CurriculumRetrievalRequest, CurriculumRetrievalResult, SourceTrustLevel, CurriculumTopic, CurriculumSkill, LearningObjective } from './task022ContentGovernanceContracts';
import { curriculumRegistryService } from './task022CurriculumRegistryService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentItemGovernanceService } from './task022ContentItemGovernanceService';
import { topicSkillPrerequisiteMapService } from './task022TopicSkillPrerequisiteMapService';

export class CurriculumRetrievalService {
  retrieve(request: CurriculumRetrievalRequest): CurriculumRetrievalResult {
    const reasons: string[] = [];
    const topics: CurriculumTopic[] = [];
    const skills: CurriculumSkill[] = [];
    const objectives: LearningObjective[] = [];

    if (request.subject && request.topic) {
      const topic = curriculumRegistryService.resolveTopic(request.curriculumFamily, request.subject, request.topic);
      if (topic) {
        topics.push(topic);
        const topicSkills = curriculumRegistryService.resolveSkill(topic.topicId);
        skills.push(...topicSkills);

        if (request.skill) {
          const matchedSkill = topicSkills.find(s =>
            s.title.toLowerCase().includes(request.skill!.toLowerCase())
          );
          if (matchedSkill) {
            const skillObjs = topicSkillPrerequisiteMapService.getObjectivesForSkill(matchedSkill.skillId);
            objectives.push(...skillObjs);
          }
        } else {
          for (const s of topicSkills) {
            const skillObjs = topicSkillPrerequisiteMapService.getObjectivesForSkill(s.skillId);
            objectives.push(...skillObjs);
          }
        }
      }
    } else if (request.subject) {
      const map = curriculumRegistryService.getCurriculumMap(request.curriculumFamily);
      if (map) {
        const subjectTopics = map.topics.filter(t => t.subject === request.subject);
        topics.push(...subjectTopics);
        for (const t of subjectTopics) {
          const topicSkills = curriculumRegistryService.resolveSkill(t.topicId);
          skills.push(...topicSkills);
        }
      }
    } else {
      const map = curriculumRegistryService.getCurriculumMap(request.curriculumFamily);
      if (map) {
        topics.push(...map.topics);
        skills.push(...map.skills);
        objectives.push(...map.objectives);
      }
    }

    const sources = approvedSourceRegistryService.getApprovedSources(request.curriculumFamily).filter(s => {
      if (request.subject && s.subject !== request.subject) return false;
      if (request.topic && s.topic !== request.topic) return false;
      if (request.sourceTrustLevel && s.trustLevel !== request.sourceTrustLevel) return false;
      return true;
    });

    const topicIds = new Set(topics.map(t => t.topicId));
    const skillIds = new Set(skills.map(s => s.skillId));
    const allItems = contentItemGovernanceService.getAllItems();
    const contentItems = allItems.filter(item => {
      if (item.status !== 'active' && item.status !== 'approved') return false;
      if (item.topicId && !topicIds.has(item.topicId)) return false;
      if (item.skillId && !skillIds.has(item.skillId)) return false;
      return true;
    }).filter(item => {
      const policy = contentItemGovernanceService.getContentUsePolicy(item);
      return policy.policy !== 'block_all';
    });

    const found = topics.length > 0 || skills.length > 0;

    return {
      found,
      topics,
      skills,
      objectives,
      sources,
      contentItems,
      reasonCodes: found ? ['retrieval-successful'] : ['no-content-found'],
    };
  }

  retrieveByLearningObjective(objectiveId: string): CurriculumRetrievalResult {
    const allItems = contentItemGovernanceService.getAllItems();
    const relevantItems = allItems.filter(i => i.learningObjectiveId === objectiveId && (i.status === 'active' || i.status === 'approved'));

    const objective = topicSkillPrerequisiteMapService.getObjective(objectiveId);
    let skill: CurriculumSkill | null = null;
    let topic: CurriculumTopic | null = null;

    if (objective) {
      skill = topicSkillPrerequisiteMapService.getSkill(objective.curriculumSkillId);
      if (skill) {
        topic = topicSkillPrerequisiteMapService.getTopic(skill.curriculumTopicId);
      }
    }

    return {
      found: relevantItems.length > 0,
      topics: topic ? [topic] : [],
      skills: skill ? [skill] : [],
      objectives: objective ? [objective] : [],
      sources: [],
      contentItems: relevantItems,
      reasonCodes: relevantItems.length > 0 ? ['retrieval-by-objective-successful'] : ['no-content-for-objective'],
    };
  }
}

export const curriculumRetrievalService = new CurriculumRetrievalService();
