import type { SubjectModuleGroup, SubjectModuleProfile, SubjectModuleStatus } from './subjectModuleContracts';
import { kindergartenSubjectModules } from './subjectModules/kindergartenSubjectModules';
import { upperClassSubjectModules } from './subjectModules/upperClassSubjectModules';
import { deenSubjectModules } from './subjectModules/deenSubjectModules';
import { generalEnrichmentSubjectModules } from './subjectModules/generalEnrichmentSubjectModules';

const allModules: SubjectModuleProfile[] = [
  ...kindergartenSubjectModules,
  ...upperClassSubjectModules,
  ...deenSubjectModules,
  ...generalEnrichmentSubjectModules,
];

export function listSubjectModules(input?: {
  group?: SubjectModuleGroup;
  status?: SubjectModuleStatus;
}): SubjectModuleProfile[] {
  let result = allModules;

  if (input?.group) {
    result = result.filter(m => m.group === input.group);
  }
  if (input?.status) {
    result = result.filter(m => m.status === input.status);
  }

  return result;
}

export function getSubjectModule(moduleId: string): SubjectModuleProfile | null {
  return allModules.find(m => m.moduleId === moduleId) || null;
}

export function findSubjectModuleBySubjectName(input: {
  subjectName: string;
  group?: SubjectModuleGroup;
}): SubjectModuleProfile | null {
  const normalized = input.subjectName.toLowerCase().trim();

  let candidates = allModules;
  if (input.group) {
    candidates = candidates.filter(m => m.group === input.group);
  }

  for (const module of candidates) {
    if (module.subjectName.toLowerCase().trim() === normalized) {
      return module;
    }
    if (module.aliases.some(a => a.toLowerCase().trim() === normalized)) {
      return module;
    }
  }

  for (const module of candidates) {
    if (module.subjectName.toLowerCase().trim().includes(normalized)) {
      return module;
    }
    if (module.aliases.some(a => a.toLowerCase().trim().includes(normalized))) {
      return module;
    }
  }

  return null;
}

export function getAllModules(): SubjectModuleProfile[] {
  return allModules;
}

export function validateSubjectModuleProfile(module: SubjectModuleProfile): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!module.moduleId) errors.push('moduleId is required');
  if (!module.subjectName) errors.push('subjectName is required');
  if (!module.group) errors.push('group is required');
  if (!module.status) errors.push('status is required');
  if (!module.curriculumTrack) errors.push('curriculumTrack is required');
  if (!module.gradeBands || module.gradeBands.length === 0) errors.push('gradeBands must be non-empty');
  if (!module.focusAreas || module.focusAreas.length === 0) errors.push('focusAreas must be non-empty');
  if (!module.validationModes || module.validationModes.length === 0) errors.push('validationModes must be non-empty');
  if (!module.toneRules || module.toneRules.length === 0) errors.push('toneRules must be non-empty');
  if (!module.teachingMethodRules || module.teachingMethodRules.length === 0) errors.push('teachingMethodRules must be non-empty');
  if (!module.endingRule) errors.push('endingRule is required');
  if (!module.adaptiveRules) errors.push('adaptiveRules is required');
  if (!module.sourceConfidence) errors.push('sourceConfidence is required');
  if (!module.deenSensitivityLevel) errors.push('deenSensitivityLevel is required');
  if (!module.languageModes || module.languageModes.length === 0) errors.push('languageModes must be non-empty');
  if (!module.disallowedBehaviors) errors.push('disallowedBehaviors is required');

  return { valid: errors.length === 0, errors };
}

export function validateAllModules(): Array<{ moduleId: string; valid: boolean; errors: string[] }> {
  return allModules.map(m => ({
    moduleId: m.moduleId,
    ...validateSubjectModuleProfile(m),
  }));
}
