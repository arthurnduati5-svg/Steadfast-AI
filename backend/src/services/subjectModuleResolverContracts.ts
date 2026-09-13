import type { SubjectModuleProfile } from './subjectModuleContracts';

export type ModuleResolutionStatus =
  | 'resolved'
  | 'clarify_first'
  | 'ambiguous'
  | 'not_found';

export interface SubjectModuleResolutionCandidate {
  module: SubjectModuleProfile;
  score: number;
  reasons: string[];
}

export interface SubjectModuleResolutionResult {
  status: ModuleResolutionStatus;
  selectedModule?: SubjectModuleProfile;
  candidates: SubjectModuleResolutionCandidate[];
  safeClarifyingQuestion?: string;
  unresolvedReason?: string;
}
