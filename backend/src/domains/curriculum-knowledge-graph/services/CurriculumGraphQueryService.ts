// Curriculum Knowledge Graph — Query Service

import type {
  CurriculumGraphQueryContext,
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
  TraversalResponse,
  StructuralLearningPathResult,
  ObjectiveMapResult,
  ConceptMapResult,
  ChangeImpactResult,
  StudentSafeGraph,
  StaffSafeGraph,
  CurriculumGraphFailureResult,
  CurriculumGraphError,
  CurriculumGraphErrorCode,
} from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphErrorCodes } from '../contracts/CurriculumGraphContracts';
import type { CurriculumKnowledgeGraphRepository } from '../repository/CurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService, type RoleAction } from './CurriculumGraphRolePolicyService';
import { CurriculumGraphTraversalService } from './CurriculumGraphTraversalService';

function deny(code: CurriculumGraphErrorCode, msg: string, ctx: CurriculumGraphQueryContext): CurriculumGraphFailureResult {
  return {
    success: false,
    commandId: '',
    correlationId: ctx.correlationId,
    error: {
      code,
      studentSafeMessage: msg,
      internalMessage: msg,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      retryable: false,
      reasonCodes: ['denied'],
    },
  };
}

export class CurriculumGraphQueryService {
  constructor(
    private repo: CurriculumKnowledgeGraphRepository,
    private rolePolicy: CurriculumGraphRolePolicyService,
    private traversal: CurriculumGraphTraversalService,
  ) {}

  getVersion(versionId: string, ctx: CurriculumGraphQueryContext): CurriculumGraphVersion | null {
    if (!ctx.schoolId) return null;
    return this.repo.getVersion(ctx.schoolId, versionId) || null;
  }

  listVersions(ctx: CurriculumGraphQueryContext, curriculumKey?: string, status?: string): CurriculumGraphVersion[] {
    if (!ctx.schoolId) return [];
    return this.repo.listVersions(ctx.schoolId, curriculumKey, status);
  }

  getActiveVersion(curriculumKey: string, ctx: CurriculumGraphQueryContext): CurriculumGraphVersion | null {
    if (!ctx.schoolId) return null;
    return this.repo.getActiveVersion(ctx.schoolId, curriculumKey) || null;
  }

  getNode(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext): CurriculumGraphNode | null {
    if (!ctx.schoolId) return null;
    return this.repo.getNode(ctx.schoolId, versionId, nodeId) || null;
  }

  getChildren(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext, maxDepth?: number): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getChildren(ctx.schoolId, versionId, nodeId);
  }

  getAncestors(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getAncestors(ctx.schoolId, versionId, nodeId);
  }

  getDescendants(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext, maxDepth: number = 10): TraversalResponse | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    if (maxDepth < 1 || maxDepth > 100) return deny(CurriculumGraphErrorCodes.DEPTH_LIMIT_INVALID, 'Depth must be between 1 and 100.', ctx);
    return this.traversal.getDescendants(ctx.schoolId, versionId, nodeId, maxDepth);
  }

  getDirectPrerequisites(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getDirectPrerequisites(ctx.schoolId, versionId, nodeId);
  }

  getTransitivePrerequisites(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext, maxDepth?: number): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getTransitivePrerequisites(ctx.schoolId, versionId, nodeId, maxDepth);
  }

  getDirectDependents(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getDirectDependents(ctx.schoolId, versionId, nodeId);
  }

  getTransitiveDependents(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext, maxDepth?: number): CurriculumGraphNode[] | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getTransitiveDependents(ctx.schoolId, versionId, nodeId, maxDepth);
  }

  getObjectiveMap(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext): ObjectiveMapResult | null | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getObjectiveMap(ctx.schoolId, versionId, nodeId);
  }

  getConceptMap(versionId: string, nodeId: string, ctx: CurriculumGraphQueryContext, maxDepth: number = 3): ConceptMapResult | null | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.getConceptMap(ctx.schoolId, versionId, nodeId, maxDepth);
  }

  resolveStructuralLearningPath(versionId: string, targetNodeId: string, ctx: CurriculumGraphQueryContext, startingNodeIds?: string[], maxDepth?: number): StructuralLearningPathResult | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.resolveStructuralLearningPath(ctx.schoolId, versionId, targetNodeId, startingNodeIds || [], maxDepth);
  }

  analyzeChangeImpact(versionId: string, ctx: CurriculumGraphQueryContext, nodeId?: string, edgeId?: string, operationType: 'update' | 'remove' | 'replace' | 'deprecate_in_successor' = 'update'): ChangeImpactResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(ctx.actorRole, 'run_impact_analysis', ctx.requestId, ctx.correlationId);
    if (roleError) return deny(CurriculumGraphErrorCodes.ROLE_FORBIDDEN, 'Not authorized to run impact analysis.', ctx);
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.analyzeChangeImpact(ctx.schoolId, versionId, nodeId, edgeId, operationType);
  }

  getStudentSafeGraph(versionId: string, ctx: CurriculumGraphQueryContext): StudentSafeGraph | null | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(ctx.actorRole, 'read_active_student_safe', ctx.requestId, ctx.correlationId);
    if (roleError) return deny(CurriculumGraphErrorCodes.ROLE_FORBIDDEN, 'Not authorized.', ctx);
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.buildStudentSafeGraph(ctx.schoolId, versionId);
  }

  getStaffSafeGraph(versionId: string, ctx: CurriculumGraphQueryContext): StaffSafeGraph | null | CurriculumGraphFailureResult {
    if (!ctx.schoolId) return deny(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context required.', ctx);
    return this.traversal.buildStaffSafeGraph(ctx.schoolId, versionId);
  }
}
