// Curriculum Knowledge Graph — Domain Contracts

// ───────────────────────────── Enums ─────────────────────────────

export type CurriculumGraphNodeType =
  | 'curriculum_root'
  | 'subject'
  | 'grade_level'
  | 'strand'
  | 'unit'
  | 'topic'
  | 'subtopic'
  | 'concept'
  | 'skill'
  | 'learning_objective';

export type CurriculumGraphEdgeType =
  | 'contains'
  | 'prerequisite_of'
  | 'builds_on'
  | 'objective_targets_concept'
  | 'objective_develops_skill'
  | 'related_to';

export type CurriculumGraphVersionStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'superseded'
  | 'archived';

export type CognitiveDemand =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create'
  | 'mixed';

export type DemonstrationType =
  | 'recall'
  | 'explanation'
  | 'worked_procedure'
  | 'application'
  | 'problem_solving'
  | 'teach_back'
  | 'observation'
  | 'reflection'
  | 'transfer';

export type ObjectiveType =
  | 'lesson'
  | 'topic'
  | 'unit'
  | 'subject';

export type ActorRole =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'internal_operator'
  | 'parent'
  | 'unknown';

export type PathStatus =
  | 'ready'
  | 'prerequisites_required'
  | 'blocked';

// ───────────────────────── Actor Context ─────────────────────────

export interface CurriculumGraphActorContext {
  schoolId: string;
  actorId: string;
  actorRole: ActorRole;
  learnerId?: string;
  requestId: string;
  correlationId: string;
}

// ──────────────────────── Version Contract ────────────────────────

export interface CurriculumGraphVersion {
  versionId: string;
  schoolId: string;
  curriculumKey: string;
  versionNumber: number;
  title: string;
  description: string;
  status: CurriculumGraphVersionStatus;
  revision: number;
  predecessorVersionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  activatedAt?: string;
  activatedBy?: string;
  supersededAt?: string;
  supersededByVersionId?: string;
  archivedAt?: string;
  archivedBy?: string;
  policyVersion: string;
  validationFingerprint?: string;
  metadata: Record<string, unknown>;
}

// ──────────────────────── Learning Objective Metadata ────────────

export interface LearningObjectiveMetadata {
  objectiveType: ObjectiveType;
  expectedOutcome: string;
  successCriteria: string[];
  cognitiveDemand: CognitiveDemand;
  demonstrationTypes: DemonstrationType[];
  mandatory: boolean;
  estimatedComplexity: number;
  teacherGuidance: string;
  studentSafeStatement: string;
}

// ────────────────────────── Node Contract ─────────────────────────

export interface CurriculumGraphNode {
  nodeId: string;
  schoolId: string;
  versionId: string;
  nodeType: CurriculumGraphNodeType;
  code: string;
  title: string;
  description: string;
  sequence: number;
  tags: string[];
  studentVisible: boolean;
  originNodeId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  metadata: Record<string, unknown>;
  learningObjectiveMetadata?: LearningObjectiveMetadata;
}

// ────────────────────────── Edge Contract ─────────────────────────

export interface CurriculumGraphEdge {
  edgeId: string;
  schoolId: string;
  versionId: string;
  edgeType: CurriculumGraphEdgeType;
  fromNodeId: string;
  toNodeId: string;
  sequence: number;
  required: boolean;
  rationale: string;
  originEdgeId?: string;
  createdBy: string;
  createdAt: string;
  revision: number;
  metadata: Record<string, unknown>;
}

// ─────────────────────── Validation Types ────────────────────────

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  nodeId?: string;
  edgeId?: string;
  studentSafeMessage: string;
  internalMessage: string;
  suggestedResolution: string;
}

export interface GraphValidationResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  checkedVersionId: string;
  checkedRevision: number;
  graphFingerprint: string;
  checkedAt: string;
}

// ──────────────────────── Traversal Types ─────────────────────────

export interface TraversalResponse {
  rootNodeId: string;
  nodes: CurriculumGraphNode[];
  edges: CurriculumGraphEdge[];
  depth: number;
  truncated: boolean;
  graphVersionId: string;
  graphRevision: number;
}

export interface StructuralLearningPathResult {
  targetNode: CurriculumGraphNode;
  orderedNodes: CurriculumGraphNode[];
  requiredEdges: CurriculumGraphEdge[];
  prerequisiteCount: number;
  startingFoundations: string[];
  unresolvedPrerequisites: string[];
  pathStatus: PathStatus;
  reasonCodes: string[];
}

export interface ObjectiveMapResult {
  objectiveNode: CurriculumGraphNode;
  hierarchyLocation: CurriculumGraphNode[];
  targetedConcepts: CurriculumGraphNode[];
  developedSkills: CurriculumGraphNode[];
  directPrerequisites: CurriculumGraphNode[];
  transitivePrerequisites: CurriculumGraphNode[];
  dependentObjectives: CurriculumGraphNode[];
  successCriteria: string[];
  cognitiveDemand: CognitiveDemand;
  demonstrationTypes: DemonstrationType[];
}

export interface ConceptMapResult {
  conceptNode: CurriculumGraphNode;
  hierarchyLocation: CurriculumGraphNode[];
  prerequisiteConcepts: CurriculumGraphNode[];
  dependentConcepts: CurriculumGraphNode[];
  targetingObjectives: CurriculumGraphNode[];
  relatedConcepts: CurriculumGraphNode[];
  buildOnRelationships: CurriculumGraphEdge[];
  depth: number;
}

export interface ChangeImpactResult {
  operationType: 'update' | 'remove' | 'replace' | 'deprecate_in_successor';
  directChildren: CurriculumGraphNode[];
  descendants: CurriculumGraphNode[];
  directPrerequisites: CurriculumGraphNode[];
  directDependents: CurriculumGraphNode[];
  transitiveDependents: CurriculumGraphNode[];
  affectedObjectives: CurriculumGraphNode[];
  affectedConcepts: CurriculumGraphNode[];
  affectedSkills: CurriculumGraphNode[];
  affectedHierarchyPaths: string[][];
  blockedOperationReasons: string[];
  suggestedSequence: string[];
}

// ────────────────────────── Error Codes ───────────────────────────

export const CurriculumGraphErrorCodes = {
  SCHOOL_CONTEXT_REQUIRED: 'CURRICULUM_GRAPH_SCHOOL_CONTEXT_REQUIRED',
  ROLE_FORBIDDEN: 'CURRICULUM_GRAPH_ROLE_FORBIDDEN',
  NOT_FOUND: 'CURRICULUM_GRAPH_NOT_FOUND',
  VERSION_NOT_EDITABLE: 'CURRICULUM_GRAPH_VERSION_NOT_EDITABLE',
  INVALID_LIFECYCLE_TRANSITION: 'CURRICULUM_GRAPH_INVALID_LIFECYCLE_TRANSITION',
  STALE_REVISION: 'CURRICULUM_GRAPH_STALE_REVISION',
  IDEMPOTENCY_CONFLICT: 'CURRICULUM_GRAPH_IDEMPOTENCY_CONFLICT',
  DUPLICATE_NODE_CODE: 'CURRICULUM_GRAPH_DUPLICATE_NODE_CODE',
  DUPLICATE_EDGE: 'CURRICULUM_GRAPH_DUPLICATE_EDGE',
  INVALID_EDGE_ENDPOINT: 'CURRICULUM_GRAPH_INVALID_EDGE_ENDPOINT',
  INVALID_EDGE_TYPE: 'CURRICULUM_GRAPH_INVALID_EDGE_TYPE',
  CROSS_SCHOOL_REFERENCE: 'CURRICULUM_GRAPH_CROSS_SCHOOL_REFERENCE',
  CROSS_VERSION_REFERENCE: 'CURRICULUM_GRAPH_CROSS_VERSION_REFERENCE',
  SELF_EDGE: 'CURRICULUM_GRAPH_SELF_EDGE',
  HIERARCHY_CYCLE: 'CURRICULUM_GRAPH_HIERARCHY_CYCLE',
  PREREQUISITE_CYCLE: 'CURRICULUM_GRAPH_PREREQUISITE_CYCLE',
  ORPHAN_NODE: 'CURRICULUM_GRAPH_ORPHAN_NODE',
  MULTIPLE_PARENTS: 'CURRICULUM_GRAPH_MULTIPLE_PARENTS',
  NODE_HAS_RELATIONSHIPS: 'CURRICULUM_GRAPH_NODE_HAS_RELATIONSHIPS',
  OBJECTIVE_INCOMPLETE: 'CURRICULUM_GRAPH_OBJECTIVE_INCOMPLETE',
  OBJECTIVE_UNMAPPED: 'CURRICULUM_GRAPH_OBJECTIVE_UNMAPPED',
  VALIDATION_FAILED: 'CURRICULUM_GRAPH_VALIDATION_FAILED',
  ACTIVE_VERSION_CONFLICT: 'CURRICULUM_GRAPH_ACTIVE_VERSION_CONFLICT',
  DEPTH_LIMIT_INVALID: 'CURRICULUM_GRAPH_DEPTH_LIMIT_INVALID',
  PERSISTENCE_FAILED: 'CURRICULUM_GRAPH_PERSISTENCE_FAILED',
} as const;

export type CurriculumGraphErrorCode = typeof CurriculumGraphErrorCodes[keyof typeof CurriculumGraphErrorCodes];

export interface CurriculumGraphError {
  code: CurriculumGraphErrorCode;
  studentSafeMessage: string;
  internalMessage: string;
  requestId: string;
  correlationId: string;
  retryable: boolean;
  currentRevision?: number;
  reasonCodes: string[];
}

// ────────────────────────── Command Base ──────────────────────────

export interface CurriculumGraphCommandBase {
  commandId: string;
  idempotencyKey: string;
  requestHash: string;
  expectedRevision: number;
  actor: CurriculumGraphActorContext;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
}

// ──────────────────── Create Version Command ─────────────────────

export interface CreateCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'CreateCurriculumGraphVersion';
  curriculumKey: string;
  title: string;
  description: string;
  predecessorVersionId?: string;
  metadata: Record<string, unknown>;
}

export interface VersionCreatedResult {
  success: true;
  version: CurriculumGraphVersion;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

// ─────────────────── Successor Version Command ───────────────────

export interface CreateSuccessorCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'CreateSuccessorCurriculumGraphVersion';
  sourceVersionId: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface SuccessorVersionCreatedResult {
  success: true;
  sourceVersion: CurriculumGraphVersion;
  successorVersion: CurriculumGraphVersion;
  nodesCopied: number;
  edgesCopied: number;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

// ───────────────────── Node Mutation Commands ────────────────────

export interface AddCurriculumNodeCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'AddCurriculumNode';
  versionId: string;
  nodeType: CurriculumGraphNodeType;
  code: string;
  title: string;
  description: string;
  sequence: number;
  tags: string[];
  studentVisible: boolean;
  metadata: Record<string, unknown>;
  learningObjectiveMetadata?: LearningObjectiveMetadata;
}

export interface UpdateCurriculumNodeCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'UpdateCurriculumNode';
  versionId: string;
  nodeId: string;
  expectedNodeRevision: number;
  title?: string;
  description?: string;
  sequence?: number;
  tags?: string[];
  studentVisible?: boolean;
  metadata?: Record<string, unknown>;
  learningObjectiveMetadata?: LearningObjectiveMetadata;
}

export interface RemoveCurriculumNodeCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'RemoveCurriculumNode';
  versionId: string;
  nodeId: string;
}

export interface NodeMutationResult {
  success: true;
  node: CurriculumGraphNode;
  versionRevision: number;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface NodeRemovalResult {
  success: true;
  removedNodeId: string;
  versionRevision: number;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

// ───────────────────── Edge Mutation Commands ────────────────────

export interface AddCurriculumEdgeCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'AddCurriculumEdge';
  versionId: string;
  edgeType: CurriculumGraphEdgeType;
  fromNodeId: string;
  toNodeId: string;
  sequence: number;
  required: boolean;
  rationale: string;
  metadata: Record<string, unknown>;
}

export interface RemoveCurriculumEdgeCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'RemoveCurriculumEdge';
  versionId: string;
  edgeId: string;
}

export interface EdgeMutationResult {
  success: true;
  edge: CurriculumGraphEdge;
  versionRevision: number;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface EdgeRemovalResult {
  success: true;
  removedEdgeId: string;
  versionRevision: number;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

// ─────────────────── Lifecycle Commands ────────────────────────

export interface SubmitCurriculumGraphForReviewCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'SubmitCurriculumGraphForReview';
  versionId: string;
}

export interface ReturnCurriculumGraphToDraftCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'ReturnCurriculumGraphToDraft';
  versionId: string;
  reason: string;
}

export interface ApproveCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'ApproveCurriculumGraphVersion';
  versionId: string;
}

export interface ActivateCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'ActivateCurriculumGraphVersion';
  versionId: string;
}

export interface SupersedeCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'SupersedeCurriculumGraphVersion';
  versionId: string;
  supersedingVersionId: string;
}

export interface ArchiveCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'ArchiveCurriculumGraphVersion';
  versionId: string;
  reason: string;
}

export interface ValidateCurriculumGraphVersionCommand extends CurriculumGraphCommandBase {
  readonly commandType: 'ValidateCurriculumGraphVersion';
  versionId: string;
}

export interface LifecycleTransitionResult {
  success: true;
  version: CurriculumGraphVersion;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface ActivationResult {
  success: true;
  activatedVersion: CurriculumGraphVersion;
  supersededVersion?: CurriculumGraphVersion;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface ValidationResult {
  success: true;
  validation: GraphValidationResult;
  commandId: string;
  idempotencyKey: string;
  correlationId: string;
}

// ────────────────────── Discriminated Command Union ────────────────

export type CurriculumGraphCommand =
  | CreateCurriculumGraphVersionCommand
  | CreateSuccessorCurriculumGraphVersionCommand
  | AddCurriculumNodeCommand
  | UpdateCurriculumNodeCommand
  | RemoveCurriculumNodeCommand
  | AddCurriculumEdgeCommand
  | RemoveCurriculumEdgeCommand
  | SubmitCurriculumGraphForReviewCommand
  | ReturnCurriculumGraphToDraftCommand
  | ApproveCurriculumGraphVersionCommand
  | ActivateCurriculumGraphVersionCommand
  | SupersedeCurriculumGraphVersionCommand
  | ArchiveCurriculumGraphVersionCommand
  | ValidateCurriculumGraphVersionCommand;

export type CurriculumGraphCommandResult =
  | VersionCreatedResult
  | SuccessorVersionCreatedResult
  | NodeMutationResult
  | NodeRemovalResult
  | EdgeMutationResult
  | EdgeRemovalResult
  | LifecycleTransitionResult
  | ActivationResult
  | ValidationResult;

// ────────────────────── Failure Result ────────────────────────────

export interface CurriculumGraphFailureResult {
  success: false;
  error: CurriculumGraphError;
  commandId: string;
  correlationId: string;
}

// ────────────────────── Query Types ──────────────────────────

export interface CurriculumGraphQueryContext {
  schoolId: string;
  actorId: string;
  actorRole: ActorRole;
  learnerId?: string;
  requestId: string;
  correlationId: string;
}

export interface GetActiveVersionQuery {
  queryType: 'GetActiveVersion';
  curriculumKey: string;
  context: CurriculumGraphQueryContext;
}

export interface GetVersionQuery {
  queryType: 'GetVersion';
  versionId: string;
  context: CurriculumGraphQueryContext;
}

export interface ListVersionsQuery {
  queryType: 'ListVersions';
  context: CurriculumGraphQueryContext;
  curriculumKey?: string;
  status?: CurriculumGraphVersionStatus;
}

export interface GetNodeQuery {
  queryType: 'GetNode';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
}

export interface GetChildrenQuery {
  queryType: 'GetChildren';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
  maxDepth?: number;
}

export interface GetAncestorsQuery {
  queryType: 'GetAncestors';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
}

export interface GetDescendantsQuery {
  queryType: 'GetDescendants';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
  maxDepth?: number;
}

export interface GetDirectPrerequisitesQuery {
  queryType: 'GetDirectPrerequisites';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
}

export interface GetTransitivePrerequisitesQuery {
  queryType: 'GetTransitivePrerequisites';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
  maxDepth?: number;
}

export interface GetDirectDependentsQuery {
  queryType: 'GetDirectDependents';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
}

export interface GetTransitiveDependentsQuery {
  queryType: 'GetTransitiveDependents';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
  maxDepth?: number;
}

export interface GetConceptMapQuery {
  queryType: 'GetConceptMap';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
  maxDepth?: number;
}

export interface GetObjectiveMapQuery {
  queryType: 'GetObjectiveMap';
  versionId: string;
  nodeId: string;
  context: CurriculumGraphQueryContext;
}

export interface ResolveStructuralLearningPathQuery {
  queryType: 'ResolveStructuralLearningPath';
  versionId: string;
  targetNodeId: string;
  context: CurriculumGraphQueryContext;
  startingNodeIds?: string[];
  maxDepth?: number;
}

export interface AnalyzeCurriculumChangeImpactQuery {
  queryType: 'AnalyzeCurriculumChangeImpact';
  versionId: string;
  nodeId?: string;
  edgeId?: string;
  operationType: 'update' | 'remove' | 'replace' | 'deprecate_in_successor';
  context: CurriculumGraphQueryContext;
}

export interface GetStudentSafeCurriculumGraphQuery {
  queryType: 'GetStudentSafeCurriculumGraph';
  versionId: string;
  context: CurriculumGraphQueryContext;
}

export interface GetStaffSafeCurriculumGraphQuery {
  queryType: 'GetStaffSafeCurriculumGraph';
  versionId: string;
  context: CurriculumGraphQueryContext;
}

export type CurriculumGraphQuery =
  | GetActiveVersionQuery
  | GetVersionQuery
  | ListVersionsQuery
  | GetNodeQuery
  | GetChildrenQuery
  | GetAncestorsQuery
  | GetDescendantsQuery
  | GetDirectPrerequisitesQuery
  | GetTransitivePrerequisitesQuery
  | GetDirectDependentsQuery
  | GetTransitiveDependentsQuery
  | GetConceptMapQuery
  | GetObjectiveMapQuery
  | ResolveStructuralLearningPathQuery
  | AnalyzeCurriculumChangeImpactQuery
  | GetStudentSafeCurriculumGraphQuery
  | GetStaffSafeCurriculumGraphQuery;

// ────────────────────── Seed Contracts ────────────────────────────

export interface CurriculumSeedConfig {
  schoolId: string;
  curriculumKey: string;
  clock: { now(): string };
  idGen: { generate(): string };
}

export interface CurriculumGraphSeedSummary {
  schoolId: string;
  curriculumKey: string;
  activeVersionId: string;
  draftSuccessorVersionId?: string;
  versionsCreated: number;
  nodesCreated: number;
  edgesCreated: number;
  replayed: boolean;
  idempotent: boolean;
}

// ────────────────── Student / Staff Safe Contracts ──────────────

export interface StudentSafeGraph {
  versionId: string;
  curriculumKey: string;
  versionNumber: number;
  title: string;
  description: string;
  nodes: StudentSafeNode[];
  edges: StudentSafeEdge[];
  graphRevision: number;
}

export interface StudentSafeNode {
  nodeId: string;
  nodeType: CurriculumGraphNodeType;
  code: string;
  title: string;
  description: string;
  sequence: number;
  tags: string[];
  studentSafeStatement?: string;
  successCriteria?: string[];
  learningObjectiveMetadata?: {
    objectiveType: ObjectiveType;
    expectedOutcome: string;
    successCriteria: string[];
    cognitiveDemand: CognitiveDemand;
    demonstrationTypes: DemonstrationType[];
    studentSafeStatement: string;
  };
}

export interface StudentSafeEdge {
  edgeId: string;
  edgeType: CurriculumGraphEdgeType;
  fromNodeId: string;
  toNodeId: string;
  sequence: number;
  required: boolean;
  rationale: string;
}

export interface StaffSafeGraph {
  version: CurriculumGraphVersion;
  nodes: CurriculumGraphNode[];
  edges: CurriculumGraphEdge[];
  validation?: GraphValidationResult;
}
