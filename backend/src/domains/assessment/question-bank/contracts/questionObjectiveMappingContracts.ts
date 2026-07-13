export type MappingStrength =
  | 'primary'
  | 'secondary'
  | 'supporting'
  | 'prerequisite';

export interface QuestionObjectiveMapping {
  mappingId: string;
  questionVersionId: string;
  objectiveId: string;
  objectiveVersionId: string;
  mappingStrength: MappingStrength;
  mappingReason: string;
  createdAt: string;
}
