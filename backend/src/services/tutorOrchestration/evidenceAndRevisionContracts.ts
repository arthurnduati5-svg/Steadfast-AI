export interface LearningEvidenceWriteResult {
  requestId: string;
  evidenceWritten: boolean;
  evidenceType:
    | 'attempt'
    | 'mistake'
    | 'correction'
    | 'hint_used'
    | 'practice_completed'
    | 'concept_understood'
    | 'revision_needed'
    | 'none';
  skillTag?: string;
  confidence?: 'high' | 'medium' | 'low';
  reason: string;
}

export interface RevisionQueueUpdateResult {
  requestId: string;
  revisionUpdated: boolean;
  revisionAction:
    | 'add_weak_skill'
    | 'increase_priority'
    | 'decrease_priority'
    | 'schedule_review'
    | 'mark_improving'
    | 'no_update';
  skillTag?: string;
  priority?: 'low' | 'medium' | 'high';
  reason: string;
}
