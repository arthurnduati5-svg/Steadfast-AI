// Curriculum Knowledge Graph — Command Service

import type {
  CurriculumGraphCommand,
  CurriculumGraphCommandResult,
  CurriculumGraphFailureResult,
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
  CreateCurriculumGraphVersionCommand,
  CreateSuccessorCurriculumGraphVersionCommand,
  AddCurriculumNodeCommand,
  UpdateCurriculumNodeCommand,
  RemoveCurriculumNodeCommand,
  AddCurriculumEdgeCommand,
  RemoveCurriculumEdgeCommand,
  SubmitCurriculumGraphForReviewCommand,
  ReturnCurriculumGraphToDraftCommand,
  ApproveCurriculumGraphVersionCommand,
  ActivateCurriculumGraphVersionCommand,
  SupersedeCurriculumGraphVersionCommand,
  ArchiveCurriculumGraphVersionCommand,
  ValidateCurriculumGraphVersionCommand,
  VersionCreatedResult,
  SuccessorVersionCreatedResult,
  NodeMutationResult,
  NodeRemovalResult,
  EdgeMutationResult,
  EdgeRemovalResult,
  LifecycleTransitionResult,
  ActivationResult,
  ValidationResult,
  CurriculumGraphError,
  CurriculumGraphErrorCode,
  CurriculumGraphVersionStatus,
  LearningObjectiveMetadata,
} from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphErrorCodes } from '../contracts/CurriculumGraphContracts';
import type { CurriculumKnowledgeGraphRepository } from '../repository/CurriculumKnowledgeGraphRepository';
import type { Clock, IdGenerator } from './CurriculumGraphDependencies';
import { CurriculumGraphRolePolicyService, type RoleAction } from './CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from './CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from './CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from './CurriculumGraphTraversalService';

function fail(code: CurriculumGraphErrorCode, studentSafeMessage: string, internalMessage: string, requestId: string, correlationId: string, retryable: boolean = false, reasonCodes: string[] = [], currentRevision?: number): CurriculumGraphFailureResult {
  return {
    success: false,
    commandId: '',
    correlationId,
    error: { code, studentSafeMessage, internalMessage, requestId, correlationId, retryable, reasonCodes, currentRevision },
  };
}

function computeRequestHash(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

export class CurriculumGraphCommandService {
  constructor(
    private repo: CurriculumKnowledgeGraphRepository,
    private rolePolicy: CurriculumGraphRolePolicyService,
    private lifecycle: CurriculumGraphVersionLifecycleService,
    private validator: CurriculumGraphValidatorService,
    private traversal: CurriculumGraphTraversalService,
    private clock: Clock,
    private idGen: IdGenerator,
  ) {}

  execute(command: CurriculumGraphCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    return this.repo.runAtomicMutation(() => this.executeInternal(command));
  }

  private executeInternal(command: CurriculumGraphCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const { actor, commandId, idempotencyKey, correlationId, requestHash } = command;

    // 1. School context
    if (!actor.schoolId) {
      return fail(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'School context is required.', 'Empty schoolId.', actor.requestId, correlationId, false, ['empty_school_id']);
    }
    if (!actor.actorId) {
      return fail(CurriculumGraphErrorCodes.SCHOOL_CONTEXT_REQUIRED, 'Actor identity is required.', 'Empty actorId.', actor.requestId, correlationId, false, ['empty_actor_id']);
    }

    // 2. Idempotency check
    const existingResult = this.repo.getCommandResult(actor.schoolId, command.commandType, idempotencyKey);
    if (existingResult) {
      const existingHash = this.repo.getCommandResult(actor.schoolId, 'hash:' + command.commandType, idempotencyKey);
      if (existingHash) {
        return existingResult;
      }
      // Store hash once for future lookups
      this.repo.saveCommandResult(actor.schoolId, 'hash:' + command.commandType, idempotencyKey, existingResult);
      return existingResult;
    }

    // 3. Execute by type
    let result: CurriculumGraphCommandResult | CurriculumGraphFailureResult;

    switch (command.commandType) {
      case 'CreateCurriculumGraphVersion':
        result = this.handleCreateVersion(command);
        break;
      case 'CreateSuccessorCurriculumGraphVersion':
        result = this.handleCreateSuccessor(command);
        break;
      case 'AddCurriculumNode':
        result = this.handleAddNode(command);
        break;
      case 'UpdateCurriculumNode':
        result = this.handleUpdateNode(command);
        break;
      case 'RemoveCurriculumNode':
        result = this.handleRemoveNode(command);
        break;
      case 'AddCurriculumEdge':
        result = this.handleAddEdge(command);
        break;
      case 'RemoveCurriculumEdge':
        result = this.handleRemoveEdge(command);
        break;
      case 'SubmitCurriculumGraphForReview':
        result = this.handleSubmitForReview(command);
        break;
      case 'ReturnCurriculumGraphToDraft':
        result = this.handleReturnToDraft(command);
        break;
      case 'ApproveCurriculumGraphVersion':
        result = this.handleApprove(command);
        break;
      case 'ActivateCurriculumGraphVersion':
        result = this.handleActivate(command);
        break;
      case 'SupersedeCurriculumGraphVersion':
        result = this.handleSupersede(command);
        break;
      case 'ArchiveCurriculumGraphVersion':
        result = this.handleArchive(command);
        break;
      case 'ValidateCurriculumGraphVersion':
        result = this.handleValidate(command);
        break;
      default:
        result = fail(CurriculumGraphErrorCodes.VALIDATION_FAILED, 'Unknown command type.', `Unknown command type: ${(command as any).commandType}`, actor.requestId, correlationId, false, ['unknown_command']);
    }

    // 4. Cache idempotency result
    if (result.success) {
      this.repo.saveCommandResult(actor.schoolId, command.commandType, idempotencyKey, result);
      this.repo.saveCommandResult(actor.schoolId, 'hash:' + command.commandType, idempotencyKey, result);
    }

    return result;
  }

  private handleCreateVersion(cmd: CreateCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'create_version', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const versionId = this.idGen.generate();
    const now = this.clock.now();
    const versionNumber = this.computeNextVersionNumber(cmd.actor.schoolId, cmd.curriculumKey);

    const version: CurriculumGraphVersion = {
      versionId,
      schoolId: cmd.actor.schoolId,
      curriculumKey: cmd.curriculumKey,
      versionNumber,
      title: cmd.title,
      description: cmd.description,
      status: 'draft',
      revision: 1,
      predecessorVersionId: cmd.predecessorVersionId,
      createdBy: cmd.actor.actorId,
      createdAt: now,
      updatedAt: now,
      policyVersion: '1.0',
      metadata: cmd.metadata,
    };

    this.repo.saveVersion(version);
    return { success: true, version, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleCreateSuccessor(cmd: CreateSuccessorCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'create_successor', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const source = this.repo.getVersion(cmd.actor.schoolId, cmd.sourceVersionId);
    if (!source) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.NOT_FOUND, studentSafeMessage: 'Source version not found.', internalMessage: `Version ${cmd.sourceVersionId} not found.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['source_not_found'] } };
    }
    if (!['approved', 'active', 'superseded'].includes(source.status)) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_LIFECYCLE_TRANSITION, studentSafeMessage: 'Cannot create successor from this version status.', internalMessage: `Source version status is ${source.status}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['invalid_source_status', source.status] } };
    }

    const versionId = this.idGen.generate();
    const now = this.clock.now();
    const versionNumber = this.computeNextVersionNumber(cmd.actor.schoolId, source.curriculumKey);

    const successor: CurriculumGraphVersion = {
      versionId,
      schoolId: source.schoolId,
      curriculumKey: source.curriculumKey,
      versionNumber,
      title: cmd.title,
      description: cmd.description,
      status: 'draft',
      revision: 1,
      predecessorVersionId: source.versionId,
      createdBy: cmd.actor.actorId,
      createdAt: now,
      updatedAt: now,
      policyVersion: source.policyVersion,
      metadata: cmd.metadata,
    };

    // Clone nodes
    const sourceNodes = this.repo.listNodes(cmd.actor.schoolId, cmd.sourceVersionId);
    const nodeIdMap = new Map<string, string>();
    for (const sn of sourceNodes) {
      const newNodeId = this.idGen.generate();
      nodeIdMap.set(sn.nodeId, newNodeId);
      const clonedNode: CurriculumGraphNode = {
        ...sn,
        nodeId: newNodeId,
        versionId,
        originNodeId: sn.nodeId,
        createdBy: cmd.actor.actorId,
        createdAt: now,
        updatedAt: now,
        revision: 1,
      };
      this.repo.saveNode(clonedNode);
    }

    // Clone edges
    const sourceEdges = this.repo.listEdges(cmd.actor.schoolId, cmd.sourceVersionId);
    for (const se of sourceEdges) {
      const newFromId = nodeIdMap.get(se.fromNodeId);
      const newToId = nodeIdMap.get(se.toNodeId);
      if (!newFromId || !newToId) continue;
      const newEdgeId = this.idGen.generate();
      const clonedEdge: CurriculumGraphEdge = {
        ...se,
        edgeId: newEdgeId,
        versionId,
        fromNodeId: newFromId,
        toNodeId: newToId,
        originEdgeId: se.edgeId,
        createdBy: cmd.actor.actorId,
        createdAt: now,
        revision: 1,
      };
      this.repo.saveEdge(clonedEdge);
    }

    this.repo.saveVersion(successor);
    return {
      success: true,
      sourceVersion: source,
      successorVersion: successor,
      nodesCopied: sourceNodes.length,
      edgesCopied: sourceEdges.length,
      commandId: cmd.commandId,
      idempotencyKey: cmd.idempotencyKey,
      correlationId: cmd.correlationId,
    };
  }

  private handleAddNode(cmd: AddCurriculumNodeCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'edit_draft', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.NOT_FOUND, studentSafeMessage: 'Version not found.', internalMessage: `Version ${cmd.versionId} not found.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['version_not_found'] } };
    }
    if (cmd.expectedRevision !== version.revision) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.STALE_REVISION, studentSafeMessage: 'The version was modified by another operation. Refresh and retry.', internalMessage: `Expected revision ${cmd.expectedRevision}, actual ${version.revision}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: true, reasonCodes: ['stale_revision'], currentRevision: version.revision } };
    }
    if (!this.lifecycle.isEditable(version.status)) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.VERSION_NOT_EDITABLE, studentSafeMessage: 'This version is not editable.', internalMessage: `Version status is ${version.status}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['version_not_editable', version.status] } };
    }
    if (!cmd.code || cmd.code.trim().length === 0) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.DUPLICATE_NODE_CODE, studentSafeMessage: 'Node code cannot be empty.', internalMessage: 'Empty node code.', requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['empty_code'] } };
    }
    if (!cmd.title || cmd.title.trim().length === 0) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.VALIDATION_FAILED, studentSafeMessage: 'Node title cannot be empty.', internalMessage: 'Empty node title.', requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['empty_title'] } };
    }

    // Check duplicate code
    const existingNodes = this.repo.listNodes(cmd.actor.schoolId, cmd.versionId);
    const codeMatch = existingNodes.find(n => n.nodeType === cmd.nodeType && n.code === cmd.code);
    if (codeMatch) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.DUPLICATE_NODE_CODE, studentSafeMessage: 'A node with this code already exists for this type.', internalMessage: `Duplicate code ${cmd.code} for type ${cmd.nodeType}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['duplicate_code'], currentRevision: version.revision } };
    }

    const nodeId = this.idGen.generate();
    const now = this.clock.now();

    const node: CurriculumGraphNode = {
      nodeId,
      schoolId: cmd.actor.schoolId,
      versionId: cmd.versionId,
      nodeType: cmd.nodeType,
      code: cmd.code,
      title: cmd.title,
      description: cmd.description,
      sequence: cmd.sequence,
      tags: [...new Set(cmd.tags.map(t => t.trim()).filter(t => t.length > 0))],
      studentVisible: cmd.studentVisible,
      createdBy: cmd.actor.actorId,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      metadata: cmd.metadata,
      learningObjectiveMetadata: cmd.learningObjectiveMetadata,
    };

    // Validate learning objective metadata if applicable
    if (cmd.nodeType === 'learning_objective') {
      const meta = cmd.learningObjectiveMetadata;
      if (!meta || !meta.expectedOutcome || !meta.studentSafeStatement || !meta.successCriteria || meta.successCriteria.length === 0) {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, studentSafeMessage: 'Learning objective is missing required metadata.', internalMessage: 'Learning objective missing expectedOutcome, studentSafeStatement, or successCriteria.', requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['objective_incomplete'] } };
      }
    }

    this.repo.saveNode(node);

    // Update version revision
    version.revision += 1;
    version.updatedAt = now;
    this.repo.saveVersion(version);

    return { success: true, node, versionRevision: version.revision, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleUpdateNode(cmd: UpdateCurriculumNodeCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'edit_draft', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    if (cmd.expectedRevision !== version.revision) {
      return this.staleRevision(cmd, version.revision);
    }
    if (!this.lifecycle.isEditable(version.status)) {
      return this.notEditable(cmd, version.status);
    }

    const existing = this.repo.getNode(cmd.actor.schoolId, cmd.versionId, cmd.nodeId);
    if (!existing) return this.notFound('Node', cmd.nodeId, cmd);

    if (cmd.expectedNodeRevision !== undefined && cmd.expectedNodeRevision !== existing.revision) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.STALE_REVISION, studentSafeMessage: 'The node was modified by another operation.', internalMessage: `Expected node revision ${cmd.expectedNodeRevision}, actual ${existing.revision}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: true, reasonCodes: ['stale_node_revision'], currentRevision: version.revision } };
    }

    const now = this.clock.now();
    const updated: CurriculumGraphNode = {
      ...existing,
      title: cmd.title ?? existing.title,
      description: cmd.description ?? existing.description,
      sequence: cmd.sequence ?? existing.sequence,
      tags: cmd.tags ? [...new Set(cmd.tags.map(t => t.trim()).filter(t => t.length > 0))] : existing.tags,
      studentVisible: cmd.studentVisible ?? existing.studentVisible,
      metadata: cmd.metadata ?? existing.metadata,
      learningObjectiveMetadata: cmd.learningObjectiveMetadata ?? existing.learningObjectiveMetadata,
      updatedAt: now,
      revision: existing.revision + 1,
    };

    this.repo.saveNode(updated);
    version.revision += 1;
    version.updatedAt = now;
    this.repo.saveVersion(version);

    return { success: true, node: updated, versionRevision: version.revision, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleRemoveNode(cmd: RemoveCurriculumNodeCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'remove_draft_node', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);
    if (!this.lifecycle.isEditable(version.status)) return this.notEditable(cmd, version.status);

    const node = this.repo.getNode(cmd.actor.schoolId, cmd.versionId, cmd.nodeId);
    if (!node) return this.notFound('Node', cmd.nodeId, cmd);

    // Check relationships
    const edges = this.repo.listEdges(cmd.actor.schoolId, cmd.versionId);
    const containsChildren = edges.filter(e => e.edgeType === 'contains' && e.fromNodeId === cmd.nodeId);
    const prereqDependents = edges.filter(e => e.edgeType === 'prerequisite_of' && e.fromNodeId === cmd.nodeId);
    const prereqRequirements = edges.filter(e => e.edgeType === 'prerequisite_of' && e.toNodeId === cmd.nodeId);
    const objectiveMappings = edges.filter(e => e.fromNodeId === cmd.nodeId || e.toNodeId === cmd.nodeId);

    if (objectiveMappings.length > 0) {
      const counts = {
        containsChildren: containsChildren.length,
        prereqDependents: prereqDependents.length,
        prereqRequirements: prereqRequirements.length,
        totalEdges: objectiveMappings.length,
      };
      return {
        success: false,
        commandId: cmd.commandId,
        correlationId: cmd.correlationId,
        error: {
          code: CurriculumGraphErrorCodes.NODE_HAS_RELATIONSHIPS,
          studentSafeMessage: 'This node has existing relationships that must be removed first.',
          internalMessage: `Node ${cmd.nodeId} has ${containsChildren.length} children, ${prereqDependents.length} prerequisite dependents, ${prereqRequirements.length} prerequisite requirements, ${objectiveMappings.length} total edges.`,
          requestId: cmd.actor.requestId,
          correlationId: cmd.correlationId,
          retryable: false,
          reasonCodes: ['node_has_relationships', `children_${containsChildren.length}`, `dependents_${prereqDependents.length}`],
        },
      };
    }

    const now = this.clock.now();
    this.repo.removeNode(cmd.actor.schoolId, cmd.versionId, cmd.nodeId);
    version.revision += 1;
    version.updatedAt = now;
    this.repo.saveVersion(version);

    return { success: true, removedNodeId: cmd.nodeId, versionRevision: version.revision, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleAddEdge(cmd: AddCurriculumEdgeCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'edit_draft', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);
    if (cmd.expectedRevision !== version.revision) return this.staleRevision(cmd, version.revision);
    if (!this.lifecycle.isEditable(version.status)) return this.notEditable(cmd, version.status);

    // Self-edge check
    if (cmd.fromNodeId === cmd.toNodeId) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.SELF_EDGE, studentSafeMessage: 'Self-referencing edge is not allowed.', internalMessage: 'fromNodeId equals toNodeId.', requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['self_edge'] } };
    }

    // Endpoint existence
    const fromNode = this.repo.getNode(cmd.actor.schoolId, cmd.versionId, cmd.fromNodeId);
    const toNode = this.repo.getNode(cmd.actor.schoolId, cmd.versionId, cmd.toNodeId);
    if (!fromNode || !toNode) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_EDGE_ENDPOINT, studentSafeMessage: 'One or both edge endpoints do not exist.', internalMessage: `fromNode exists: ${!!fromNode}, toNode exists: ${!!toNode}`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['missing_endpoint'] } };
    }

    // Check for duplicate semantic edge
    const existingEdges = this.repo.listEdges(cmd.actor.schoolId, cmd.versionId);
    const duplicate = existingEdges.find(e => e.edgeType === cmd.edgeType && e.fromNodeId === cmd.fromNodeId && e.toNodeId === cmd.toNodeId);
    if (duplicate) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.DUPLICATE_EDGE, studentSafeMessage: 'A duplicate edge already exists between these nodes.', internalMessage: `Duplicate edge ${cmd.edgeType} ${cmd.fromNodeId} -> ${cmd.toNodeId}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['duplicate_edge'] } };
    }

    // Cycle check for contains and prerequisite_of
    const allEdges = this.repo.listEdges(cmd.actor.schoolId, cmd.versionId);
    const nodes = this.repo.listNodes(cmd.actor.schoolId, cmd.versionId);
    const newEdgePartial: CurriculumGraphEdge = {
      edgeId: '',
      schoolId: cmd.actor.schoolId,
      versionId: cmd.versionId,
      edgeType: cmd.edgeType,
      fromNodeId: cmd.fromNodeId,
      toNodeId: cmd.toNodeId,
      sequence: cmd.sequence,
      required: cmd.required,
      rationale: cmd.rationale,
      originEdgeId: undefined,
      createdBy: cmd.actor.actorId,
      createdAt: this.clock.now(),
      revision: 1,
      metadata: cmd.metadata,
    };

    if (cmd.edgeType === 'contains' || cmd.edgeType === 'prerequisite_of') {
      const cycleError = this.validator.checkEdgeForCycle(nodes, allEdges, newEdgePartial);
      if (cycleError) {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: cycleError };
      }
    }

    // Edge type validation
    if (cmd.edgeType === 'objective_targets_concept') {
      if (fromNode.nodeType !== 'learning_objective' || toNode.nodeType !== 'concept') {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, studentSafeMessage: 'objective_targets_concept must go from learning_objective to concept.', internalMessage: `Got ${fromNode.nodeType} -> ${toNode.nodeType}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['invalid_edge_type'] } };
      }
    }
    if (cmd.edgeType === 'objective_develops_skill') {
      if (fromNode.nodeType !== 'learning_objective' || toNode.nodeType !== 'skill') {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, studentSafeMessage: 'objective_develops_skill must go from learning_objective to skill.', internalMessage: `Got ${fromNode.nodeType} -> ${toNode.nodeType}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['invalid_edge_type'] } };
      }
    }

    // Validate contains parent type
    if (cmd.edgeType === 'contains') {
      const validContainsParents: Record<string, string[]> = {
        subject: ['curriculum_root'],
        grade_level: ['subject'],
        strand: ['subject', 'grade_level'],
        unit: ['subject', 'grade_level', 'strand'],
        topic: ['subject', 'grade_level', 'strand', 'unit'],
        subtopic: ['unit', 'topic'],
        concept: ['unit', 'topic', 'subtopic'],
        skill: ['unit', 'topic', 'subtopic'],
        learning_objective: ['unit', 'topic', 'subtopic'],
      };
      const allowedParents = validContainsParents[toNode.nodeType] || [];
      if (allowedParents.length > 0 && !allowedParents.includes(fromNode.nodeType)) {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, studentSafeMessage: 'Invalid curriculum hierarchy relationship.', internalMessage: `${toNode.nodeType} cannot be contained by ${fromNode.nodeType}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['invalid_contains_parent'] } };
      }
    }

    const edgeId = this.idGen.generate();
    const now = this.clock.now();
    const edge: CurriculumGraphEdge = {
      edgeId,
      schoolId: cmd.actor.schoolId,
      versionId: cmd.versionId,
      edgeType: cmd.edgeType,
      fromNodeId: cmd.fromNodeId,
      toNodeId: cmd.toNodeId,
      sequence: cmd.sequence,
      required: cmd.required,
      rationale: cmd.rationale,
      createdBy: cmd.actor.actorId,
      createdAt: now,
      revision: 1,
      metadata: cmd.metadata,
    };

    this.repo.saveEdge(edge);
    version.revision += 1;
    version.updatedAt = now;
    this.repo.saveVersion(version);

    return { success: true, edge, versionRevision: version.revision, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleRemoveEdge(cmd: RemoveCurriculumEdgeCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'remove_draft_edge', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);
    if (!this.lifecycle.isEditable(version.status)) return this.notEditable(cmd, version.status);

    const edge = this.repo.getEdge(cmd.actor.schoolId, cmd.versionId, cmd.edgeId);
    if (!edge) return this.notFound('Edge', cmd.edgeId, cmd);

    const now = this.clock.now();
    this.repo.removeEdge(cmd.actor.schoolId, cmd.versionId, cmd.edgeId);
    version.revision += 1;
    version.updatedAt = now;
    this.repo.saveVersion(version);

    return { success: true, removedEdgeId: cmd.edgeId, versionRevision: version.revision, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleSubmitForReview(cmd: SubmitCurriculumGraphForReviewCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    return this.transitionStatus(cmd, 'draft', 'under_review', 'submit_for_review', (v) => {
      v.submittedAt = this.clock.now();
      v.submittedBy = cmd.actor.actorId;
    });
  }

  private handleReturnToDraft(cmd: ReturnCurriculumGraphToDraftCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    return this.transitionStatus(cmd, 'under_review', 'draft', 'return_to_draft', (v) => {
      v.submittedAt = undefined;
      v.submittedBy = undefined;
    });
  }

  private handleApprove(cmd: ApproveCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'approve', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const transitionError = this.lifecycle.enforceTransition(version.status, 'approved', cmd.actor.requestId, cmd.correlationId);
    if (transitionError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: transitionError };

    // Must validate first
    const validation = this.validator.validateVersion(cmd.versionId, cmd.actor.schoolId);
    if (!validation.valid) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.VALIDATION_FAILED, studentSafeMessage: 'Graph validation failed. Fix errors before approving.', internalMessage: `${validation.errorCount} error(s) found.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['validation_failed'], currentRevision: version.revision } };
    }

    const now = this.clock.now();
    version.status = 'approved';
    version.revision += 1;
    version.updatedAt = now;
    version.approvedAt = now;
    version.approvedBy = cmd.actor.actorId;
    version.validationFingerprint = validation.graphFingerprint;
    this.repo.saveVersion(version);

    return { success: true, version, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleActivate(cmd: ActivateCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'activate', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const transitionError = this.lifecycle.enforceTransition(version.status, 'active', cmd.actor.requestId, cmd.correlationId);
    if (transitionError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: transitionError };

    // Check for existing active version
    const activeVersion = this.repo.getActiveVersion(cmd.actor.schoolId, version.curriculumKey);
    if (activeVersion && activeVersion.versionId !== cmd.versionId) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.ACTIVE_VERSION_CONFLICT, studentSafeMessage: 'An active version already exists for this curriculum.', internalMessage: `Active version ${activeVersion.versionId} exists.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['active_version_conflict'], currentRevision: version.revision } };
    }

    const now = this.clock.now();
    version.status = 'active';
    version.revision += 1;
    version.updatedAt = now;
    version.activatedAt = now;
    version.activatedBy = cmd.actor.actorId;
    this.repo.saveVersion(version);

    return { success: true, activatedVersion: version, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleSupersede(cmd: SupersedeCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'supersede', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const transitionError = this.lifecycle.enforceTransition(version.status, 'superseded', cmd.actor.requestId, cmd.correlationId);
    if (transitionError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: transitionError };

    const now = this.clock.now();
    const previousActive = this.repo.getActiveVersion(cmd.actor.schoolId, version.curriculumKey);

    version.status = 'superseded';
    version.revision += 1;
    version.updatedAt = now;
    version.supersededAt = now;
    version.supersededByVersionId = cmd.supersedingVersionId;
    this.repo.saveVersion(version);

    // Activate the superseding version
    const superseding = this.repo.getVersion(cmd.actor.schoolId, cmd.supersedingVersionId);
    if (superseding && superseding.status === 'approved') {
      superseding.status = 'active';
      superseding.revision += 1;
      superseding.updatedAt = now;
      superseding.activatedAt = now;
      superseding.activatedBy = cmd.actor.actorId;
      this.repo.saveVersion(superseding);
    }

    return { success: true, activatedVersion: version, supersededVersion: previousActive || undefined, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleArchive(cmd: ArchiveCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'archive', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const transitionError = this.lifecycle.enforceTransition(version.status, 'archived', cmd.actor.requestId, cmd.correlationId);
    if (transitionError) {
      // approved -> archived is allowed for never-activated
      if (version.status === 'approved') {
        // Allowed: approved -> archived when never activated
      } else {
        return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: transitionError };
      }
    }

    const now = this.clock.now();
    version.status = 'archived';
    version.revision += 1;
    version.updatedAt = now;
    version.archivedAt = now;
    version.archivedBy = cmd.actor.actorId;
    this.repo.saveVersion(version);

    return { success: true, version, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private handleValidate(cmd: ValidateCurriculumGraphVersionCommand): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, 'validate', cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const validation = this.validator.validateVersion(cmd.versionId, cmd.actor.schoolId);

    // Update validation fingerprint
    version.validationFingerprint = validation.graphFingerprint;
    version.revision += 1;
    version.updatedAt = this.clock.now();
    this.repo.saveVersion(version);

    return { success: true, validation, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private transitionStatus(
    cmd: any,
    from: CurriculumGraphVersionStatus,
    to: CurriculumGraphVersionStatus,
    action: RoleAction,
    extra?: (v: CurriculumGraphVersion) => void,
  ): CurriculumGraphCommandResult | CurriculumGraphFailureResult {
    const roleError = this.rolePolicy.enforceAction(cmd.actor.actorRole, action, cmd.actor.requestId, cmd.correlationId);
    if (roleError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: roleError };

    const version = this.repo.getVersion(cmd.actor.schoolId, cmd.versionId);
    if (!version) return this.notFound('Version', cmd.versionId, cmd);

    const transitionError = this.lifecycle.enforceTransition(version.status, to as CurriculumGraphVersionStatus, cmd.actor.requestId, cmd.correlationId);
    if (transitionError) return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: transitionError };

    if (version.status !== from) {
      return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.INVALID_LIFECYCLE_TRANSITION, studentSafeMessage: `Version must be ${from} to perform this action.`, internalMessage: `Current status is ${version.status}, expected ${from}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: [`expected_${from}`, `actual_${version.status}`] } };
    }

    const now = this.clock.now();
    version.status = to;
    version.revision += 1;
    version.updatedAt = now;
    if (extra) extra(version);
    this.repo.saveVersion(version);

    return { success: true, version, commandId: cmd.commandId, idempotencyKey: cmd.idempotencyKey, correlationId: cmd.correlationId };
  }

  private notFound(label: string, id: string, cmd: any): CurriculumGraphFailureResult {
    return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.NOT_FOUND, studentSafeMessage: `${label} not found.`, internalMessage: `${label} ${id} not found.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: [`${label.toLowerCase()}_not_found`] } };
  }

  private staleRevision(cmd: any, currentRevision: number): CurriculumGraphFailureResult {
    return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.STALE_REVISION, studentSafeMessage: 'Version was modified. Refresh and retry.', internalMessage: `Stale revision.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: true, reasonCodes: ['stale_revision'], currentRevision } };
  }

  private notEditable(cmd: any, status: string): CurriculumGraphFailureResult {
    return { success: false, commandId: cmd.commandId, correlationId: cmd.correlationId, error: { code: CurriculumGraphErrorCodes.VERSION_NOT_EDITABLE, studentSafeMessage: 'Version is not editable.', internalMessage: `Status: ${status}.`, requestId: cmd.actor.requestId, correlationId: cmd.correlationId, retryable: false, reasonCodes: ['not_editable', status] } };
  }

  private computeNextVersionNumber(schoolId: string, curriculumKey: string): number {
    const versions = this.repo.listVersions(schoolId, curriculumKey);
    if (versions.length === 0) return 1;
    return Math.max(...versions.map(v => v.versionNumber)) + 1;
  }
}
