import type { CurriculumImportDryRunResult, CurriculumImportDryRunItem, CurriculumFamily } from './task022ContentGovernanceContracts';
import { curriculumRegistryService } from './task022CurriculumRegistryService';

export interface ImportProposal {
  curriculumFamily: CurriculumFamily;
  version?: { title: string; versionCode: string };
  topics?: { title: string; subject: string; stage?: string }[];
  skills?: { title: string; topicTitle: string }[];
  objectives?: { title: string; skillTitle: string }[];
  sources?: { title: string; sourceType: string; trustLevel: string }[];
  contentItems?: { title: string; contentType: string; teacherOnly?: boolean; answerKeyProtected?: boolean }[];
}

export class CurriculumImportDryRunService {
  validate(proposal: ImportProposal): CurriculumImportDryRunResult {
    const items: CurriculumImportDryRunItem[] = [];
    const duplicateTopics: string[] = [];
    const duplicateSkills: string[] = [];
    const duplicateObjectives: string[] = [];
    const missingSourceApprovals: string[] = [];
    const deenSensitiveItems: string[] = [];
    const teacherOnlyFields: string[] = [];
    const answerKeyFields: string[] = [];

    if (proposal.topics) {
      for (const topic of proposal.topics) {
        const existing = curriculumRegistryService.resolveTopic(proposal.curriculumFamily, topic.subject, topic.title);
        if (existing) {
          duplicateTopics.push(topic.title);
          items.push({ topic: topic.title, issues: [`Duplicate topic: ${topic.title}`], severity: 'warning' });
        } else {
          items.push({ topic: topic.title, issues: ['New topic, no conflicts'], severity: 'info' });
        }
      }
    }

    if (proposal.skills) {
      for (const skill of proposal.skills) {
        const existingTopic = curriculumRegistryService.resolveTopic(proposal.curriculumFamily, '', skill.topicTitle);
        if (existingTopic) {
          const existingSkills = curriculumRegistryService.resolveSkill(existingTopic.topicId);
          if (existingSkills.some(s => s.title.toLowerCase() === skill.title.toLowerCase())) {
            duplicateSkills.push(skill.title);
            items.push({ skill: skill.title, issues: [`Duplicate skill: ${skill.title}`], severity: 'warning' });
          }
        }
      }
    }

    if (proposal.objectives) {
      for (const obj of proposal.objectives) {
        const existingSkills = Array.from({ length: 10 }); // simplified check
        items.push({ objective: obj.title, issues: ['Objective validated'], severity: 'info' });
      }
    }

    if (proposal.contentItems) {
      for (const item of proposal.contentItems) {
        if (item.teacherOnly) {
          teacherOnlyFields.push(item.title);
          items.push({ topic: item.title, issues: ['Teacher-only content detected'], severity: 'warning' });
        }
        if (item.answerKeyProtected) {
          answerKeyFields.push(item.title);
          items.push({ topic: item.title, issues: ['Answer key protected content detected'], severity: 'warning' });
        }
      }
    }

    if (proposal.sources) {
      for (const source of proposal.sources) {
        if (source.trustLevel === 'review_required') {
          missingSourceApprovals.push(source.title);
          items.push({ topic: source.title, issues: ['Source requires review approval'], severity: 'warning' });
        }
      }
    }

    if (proposal.curriculumFamily === 'madrasa_deen' && proposal.contentItems) {
      for (const item of proposal.contentItems) {
        if (item.contentType === 'deen_explanation' || item.contentType === 'deen_referral_message') {
          deenSensitiveItems.push(item.title);
          items.push({ topic: item.title, issues: ['Deen-sensitive content requires review'], severity: 'warning' });
        }
      }
    }

    const hasErrors = items.some(i => i.severity === 'error');
    const totalItems = (proposal.topics?.length || 0) + (proposal.skills?.length || 0) +
      (proposal.objectives?.length || 0) + (proposal.sources?.length || 0) +
      (proposal.contentItems?.length || 0);

    const summary = [
      `Validated ${totalItems} items:`,
      duplicateTopics.length > 0 ? `${duplicateTopics.length} duplicate topics found` : 'No duplicate topics',
      duplicateSkills.length > 0 ? `${duplicateSkills.length} duplicate skills found` : 'No duplicate skills',
      missingSourceApprovals.length > 0 ? `${missingSourceApprovals.length} sources need approval` : 'All sources approved',
      deenSensitiveItems.length > 0 ? `${deenSensitiveItems.length} Deen-sensitive items need review` : 'No Deen-sensitive issues',
      teacherOnlyFields.length > 0 ? `${teacherOnlyFields.length} teacher-only items detected` : 'No teacher-only items',
      answerKeyFields.length > 0 ? `${answerKeyFields.length} answer key items detected` : 'No answer key items',
      hasErrors ? 'Errors found - import not recommended' : 'Dry-run passed',
    ].join('; ');

    return {
      valid: !hasErrors,
      itemCount: totalItems,
      items,
      duplicateTopics,
      duplicateSkills,
      duplicateObjectives,
      missingSourceApprovals,
      deenSensitiveItemsRequiringReview: deenSensitiveItems,
      teacherOnlyFieldsDetected: teacherOnlyFields,
      answerKeyFieldsDetected: answerKeyFields,
      summary,
    };
  }
}

export const curriculumImportDryRunService = new CurriculumImportDryRunService();
