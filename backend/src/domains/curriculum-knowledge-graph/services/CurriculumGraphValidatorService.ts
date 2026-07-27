// Curriculum Knowledge Graph — Graph Validator Service

import type {
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphEdge,
  GraphValidationResult,
  ValidationIssue,
  CurriculumGraphError,
} from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphErrorCodes } from '../contracts/CurriculumGraphContracts';
import type { CurriculumKnowledgeGraphRepository } from '../repository/CurriculumKnowledgeGraphRepository';
import type { Clock } from './CurriculumGraphDependencies';

function createIssue(
  code: string,
  severity: 'error' | 'warning',
  studentSafeMessage: string,
  internalMessage: string,
  suggestedResolution: string,
  nodeId?: string,
  edgeId?: string,
): ValidationIssue {
  return { code, severity, nodeId, edgeId, studentSafeMessage, internalMessage, suggestedResolution };
}

function computeFingerprint(version: CurriculumGraphVersion, nodes: CurriculumGraphNode[], edges: CurriculumGraphEdge[]): string {
  const parts = [
    version.versionId,
    version.revision.toString(),
    nodes.length.toString(),
    edges.length.toString(),
  ];
  return parts.join('|');
}

const validContainsParents: Record<string, string[]> = {
  curriculum_root: [],
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

const prerequisiteAllowedPairs: Array<[string, string]> = [
  ['concept', 'concept'],
  ['skill', 'skill'],
  ['topic', 'topic'],
  ['learning_objective', 'learning_objective'],
  ['concept', 'learning_objective'],
  ['skill', 'learning_objective'],
];

const buildsOnAllowedPairs: Array<[string, string]> = [
  ['concept', 'concept'],
  ['skill', 'skill'],
  ['topic', 'topic'],
];

export class CurriculumGraphValidatorService {
  constructor(private repo: CurriculumKnowledgeGraphRepository, private clock: Clock) {}

  validateVersion(versionId: string, schoolId: string): GraphValidationResult {
    const version = this.repo.getVersion(schoolId, versionId);
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!version) {
      errors.push(createIssue(
        'MISSING_VERSION', 'error', 'Version not found.', `Version ${versionId} not found in school ${schoolId}.`, 'Verify the version ID and school context.', undefined, undefined,
      ));
      return {
        valid: false, errorCount: 1, warningCount: 0, errors, warnings,
        checkedVersionId: versionId, checkedRevision: 0, graphFingerprint: '', checkedAt: this.clock.now(),
      };
    }

    const nodes = this.repo.listNodes(schoolId, versionId);
    const edges = this.repo.listEdges(schoolId, versionId);

    // Check curriculum root
    const roots = nodes.filter(n => n.nodeType === 'curriculum_root');
    if (roots.length === 0) {
      errors.push(createIssue('MISSING_ROOT', 'error', 'Curriculum root is missing.', 'No curriculum_root node found.', 'Add a curriculum_root node.', undefined, undefined));
    }
    if (roots.length > 1) {
      errors.push(createIssue('MULTIPLE_ROOTS', 'error', 'Multiple curriculum roots found.', `Found ${roots.length} curriculum_root nodes.`, 'Keep exactly one curriculum_root.', roots[1].nodeId, undefined));
    }

    // Build parent map
    const containsEdges = edges.filter(e => e.edgeType === 'contains');
    const childToParent: Map<string, string> = new Map();
    for (const ce of containsEdges) {
      if (childToParent.has(ce.toNodeId)) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.MULTIPLE_PARENTS, 'error',
          'A node has multiple curriculum parents.',
          `Node ${ce.toNodeId} has multiple contains parents.`,
          'Ensure each node has at most one canonical contains parent.',
          ce.toNodeId, ce.edgeId,
        ));
      } else {
        childToParent.set(ce.toNodeId, ce.fromNodeId);
      }
    }

    // Check orphans (nodes without contains parent, excluding root)
    const nodeIds = new Set(nodes.map(n => n.nodeId));
    for (const n of nodes) {
      if (n.nodeType === 'curriculum_root') continue;
      if (!childToParent.has(n.nodeId)) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.ORPHAN_NODE, 'error',
          'A node is not connected to the curriculum hierarchy.',
          `Node ${n.nodeId} (${n.code}) has no contains parent.`,
          'Connect this node with a contains edge from its parent.',
          n.nodeId, undefined,
        ));
      }
    }

    // Check invalid contains parent type
    for (const ce of containsEdges) {
      const fromNode = nodes.find(n => n.nodeId === ce.fromNodeId);
      const toNode = nodes.find(n => n.nodeId === ce.toNodeId);
      if (fromNode && toNode) {
        const allowed = validContainsParents[toNode.nodeType] || [];
        if (allowed.length > 0 && !allowed.includes(fromNode.nodeType)) {
          errors.push(createIssue(
            'INVALID_CONTAINS_PARENT', 'error',
            'Invalid curriculum hierarchy relationship.',
            `Node type ${toNode.nodeType} cannot be contained by ${fromNode.nodeType}.`,
            `Allowed parents for ${toNode.nodeType}: ${allowed.join(', ')}`,
            toNode.nodeId, ce.edgeId,
          ));
        }
      }
    }

    // Check contains cycles
    const cycleError = this.detectContainsCycle(nodes, edges);
    if (cycleError) {
      errors.push(cycleError);
    }

    // Check prerequisite cycles
    const prereqCycleError = this.detectPrerequisiteCycle(nodes, edges);
    if (prereqCycleError) {
      errors.push(prereqCycleError);
    }

    // Check edges
    for (const edge of edges) {
      // Self-edge
      if (edge.fromNodeId === edge.toNodeId) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.SELF_EDGE, 'error',
          'A self-referencing edge is not allowed.',
          `Edge ${edge.edgeId} connects a node to itself.`,
          'Remove the self-edge or change the endpoints.',
          edge.fromNodeId, edge.edgeId,
        ));
        continue;
      }

      // Endpoint existence
      const fromNode = nodes.find(n => n.nodeId === edge.fromNodeId);
      const toNode = nodes.find(n => n.nodeId === edge.toNodeId);
      if (!fromNode) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.INVALID_EDGE_ENDPOINT, 'error',
          'Edge references a node that does not exist.',
          `Edge ${edge.edgeId} fromNode ${edge.fromNodeId} not found.`,
          'Verify the node ID or create the node first.',
          undefined, edge.edgeId,
        ));
      }
      if (!toNode) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.INVALID_EDGE_ENDPOINT, 'error',
          'Edge references a node that does not exist.',
          `Edge ${edge.edgeId} toNode ${edge.toNodeId} not found.`,
          'Verify the node ID or create the node first.',
          undefined, edge.edgeId,
        ));
      }

      // Cross-school check
      if (fromNode && fromNode.schoolId !== schoolId) {
        errors.push(createIssue(CurriculumGraphErrorCodes.CROSS_SCHOOL_REFERENCE, 'error', 'Edge references a node from another school.', `Cross-school edge from ${fromNode.schoolId}.`, 'All nodes must belong to the same school.', fromNode.nodeId, edge.edgeId));
      }
      if (toNode && toNode.schoolId !== schoolId) {
        errors.push(createIssue(CurriculumGraphErrorCodes.CROSS_SCHOOL_REFERENCE, 'error', 'Edge references a node from another school.', `Cross-school edge to ${toNode.schoolId}.`, 'All nodes must belong to the same school.', toNode.nodeId, edge.edgeId));
      }

      // Cross-version check
      if (fromNode && fromNode.versionId !== versionId) {
        errors.push(createIssue(CurriculumGraphErrorCodes.CROSS_VERSION_REFERENCE, 'error', 'Edge references a node from another version.', `Cross-version edge from ${fromNode.versionId}.`, 'All nodes must belong to the same version.', fromNode.nodeId, edge.edgeId));
      }
      if (toNode && toNode.versionId !== versionId) {
        errors.push(createIssue(CurriculumGraphErrorCodes.CROSS_VERSION_REFERENCE, 'error', 'Edge references a node from another version.', `Cross-version edge to ${toNode.versionId}.`, 'All nodes must belong to the same version.', toNode.nodeId, edge.edgeId));
      }

      // Edge type validation
      if (fromNode && toNode && edge.edgeType !== 'contains') {
        if (edge.edgeType === 'prerequisite_of') {
          const allowed = prerequisiteAllowedPairs.some(([a, b]) =>
            fromNode.nodeType === a && toNode.nodeType === b,
          );
          if (!allowed) {
            errors.push(createIssue(
              CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, 'error',
              'Invalid prerequisite relationship between these node types.',
              `prerequisite_of not allowed between ${fromNode.nodeType} and ${toNode.nodeType}.`,
              'Use a compatible node type combination.',
              fromNode.nodeId, edge.edgeId,
            ));
          }
        }
        if (edge.edgeType === 'builds_on') {
          const allowed = buildsOnAllowedPairs.some(([a, b]) =>
            fromNode.nodeType === a && toNode.nodeType === b,
          );
          if (!allowed) {
            errors.push(createIssue(
              CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, 'error',
              'Invalid builds-on relationship between these node types.',
              `builds_on not allowed between ${fromNode.nodeType} and ${toNode.nodeType}.`,
              'Use a compatible node type combination.',
              fromNode.nodeId, edge.edgeId,
            ));
          }
        }
        if (edge.edgeType === 'objective_targets_concept') {
          if (fromNode.nodeType !== 'learning_objective' || toNode.nodeType !== 'concept') {
            errors.push(createIssue(CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, 'error', 'objective_targets_concept must go from learning_objective to concept.', `Invalid types: ${fromNode.nodeType} -> ${toNode.nodeType}.`, 'Ensure the from node is a learning_objective and to node is a concept.', fromNode.nodeId, edge.edgeId));
          }
        }
        if (edge.edgeType === 'objective_develops_skill') {
          if (fromNode.nodeType !== 'learning_objective' || toNode.nodeType !== 'skill') {
            errors.push(createIssue(CurriculumGraphErrorCodes.INVALID_EDGE_TYPE, 'error', 'objective_develops_skill must go from learning_objective to skill.', `Invalid types: ${fromNode.nodeType} -> ${toNode.nodeType}.`, 'Ensure the from node is a learning_objective and to node is a skill.', fromNode.nodeId, edge.edgeId));
          }
        }
      }
    }

    // Check duplicate node codes
    const codeMap = new Map<string, string[]>();
    for (const n of nodes) {
      const key = `${n.nodeType}::${n.code}`;
      if (!codeMap.has(key)) codeMap.set(key, []);
      codeMap.get(key)!.push(n.nodeId);
    }
    for (const [key, ids] of codeMap.entries()) {
      if (ids.length > 1) {
        const [nodeType, code] = key.split('::');
        for (const id of ids.slice(1)) {
          errors.push(createIssue(
            CurriculumGraphErrorCodes.DUPLICATE_NODE_CODE, 'error',
            'A node with this code already exists for this type.',
            `Duplicate code "${code}" for type ${nodeType} (nodes: ${ids.join(', ')}).`,
            'Use a unique code for each node within its type.',
            id, undefined,
          ));
        }
      }
    }

    // Check duplicate semantic edges
    const edgeSignature = new Map<string, string[]>();
    for (const edge of edges) {
      const sig = `${edge.edgeType}::${edge.fromNodeId}::${edge.toNodeId}`;
      if (!edgeSignature.has(sig)) edgeSignature.set(sig, []);
      edgeSignature.get(sig)!.push(edge.edgeId);
    }
    for (const [sig, eids] of edgeSignature.entries()) {
      if (eids.length > 1) {
        for (const eid of eids.slice(1)) {
          errors.push(createIssue(
            CurriculumGraphErrorCodes.DUPLICATE_EDGE, 'error',
            'A duplicate edge already exists between these nodes.',
            `Duplicate semantic edge ${sig} (edges: ${eids.join(', ')}).`,
            'Remove the duplicate edge.',
            undefined, eid,
          ));
        }
      }
    }

    // Learning objective validation
    const objectives = nodes.filter(n => n.nodeType === 'learning_objective');
    for (const obj of objectives) {
      const meta = obj.learningObjectiveMetadata;
      if (!meta) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, 'error',
          'Learning objective is missing metadata.',
          `Objective ${obj.nodeId} has no learningObjectiveMetadata.`,
          'Add learning objective metadata.',
          obj.nodeId, undefined,
        ));
        continue;
      }
      if (!meta.expectedOutcome || meta.expectedOutcome.trim().length === 0) {
        errors.push(createIssue(CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, 'error', 'Expected outcome is required.', `Objective ${obj.nodeId} missing expectedOutcome.`, 'Provide an expected outcome.', obj.nodeId, undefined));
      }
      if (!meta.studentSafeStatement || meta.studentSafeStatement.trim().length === 0) {
        errors.push(createIssue(CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, 'error', 'Student-safe statement is required.', `Objective ${obj.nodeId} missing studentSafeStatement.`, 'Provide a student-safe statement.', obj.nodeId, undefined));
      }
      if (!meta.successCriteria || meta.successCriteria.length === 0 || meta.successCriteria.every(s => s.trim().length === 0)) {
        errors.push(createIssue(CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, 'error', 'At least one success criterion is required.', `Objective ${obj.nodeId} missing success criteria.`, 'Provide at least one success criterion.', obj.nodeId, undefined));
      }
      if (!meta.demonstrationTypes || meta.demonstrationTypes.length === 0) {
        errors.push(createIssue(CurriculumGraphErrorCodes.OBJECTIVE_INCOMPLETE, 'error', 'At least one demonstration type is required.', `Objective ${obj.nodeId} missing demonstrationTypes.`, 'Provide at least one demonstration type.', obj.nodeId, undefined));
      }

      // Check concept/skill mapping
      const hasConceptEdge = edges.some(e =>
        e.fromNodeId === obj.nodeId && e.edgeType === 'objective_targets_concept',
      );
      const hasSkillEdge = edges.some(e =>
        e.fromNodeId === obj.nodeId && e.edgeType === 'objective_develops_skill',
      );
      if (!hasConceptEdge && !hasSkillEdge) {
        errors.push(createIssue(
          CurriculumGraphErrorCodes.OBJECTIVE_UNMAPPED, 'error',
          'Learning objective must target at least one concept or skill.',
          `Objective ${obj.nodeId} has no concept or skill mapping.`,
          'Add an objective_targets_concept or objective_develops_skill edge.',
          obj.nodeId, undefined,
        ));
      }
    }

    // Check version has at least one subject
    const hasSubject = nodes.some(n => n.nodeType === 'subject');
    if (roots.length > 0 && nodes.length > 0 && !hasSubject) {
      errors.push(createIssue('NO_SUBJECT', 'error', 'Curriculum version must have at least one subject.', 'No subject node found.', 'Add at least one subject node.', undefined, undefined));
    }

    // Warnings
    const concepts = nodes.filter(n => n.nodeType === 'concept');
    for (const c of concepts) {
      const hasObjective = edges.some(e =>
        e.toNodeId === c.nodeId && e.edgeType === 'objective_targets_concept',
      );
      if (!hasObjective) {
        warnings.push(createIssue('CONCEPT_NO_OBJECTIVE', 'warning', 'A concept has no targeting learning objective.', `Concept ${c.nodeId} has no objective_targets_concept edge.`, 'Consider linking a learning objective to this concept.', c.nodeId, undefined));
      }
    }
    const skills = nodes.filter(n => n.nodeType === 'skill');
    for (const s of skills) {
      const hasObjective = edges.some(e =>
        e.toNodeId === s.nodeId && e.edgeType === 'objective_develops_skill',
      );
      if (!hasObjective) {
        warnings.push(createIssue('SKILL_NO_OBJECTIVE', 'warning', 'A skill has no developing learning objective.', `Skill ${s.nodeId} has no objective_develops_skill edge.`, 'Consider linking a learning objective to this skill.', s.nodeId, undefined));
      }
    }
    for (const n of nodes) {
      if (!n.description || n.description.trim().length === 0) {
        warnings.push(createIssue('NODE_NO_DESCRIPTION', 'warning', 'A node has no description.', `Node ${n.nodeId} (${n.code}) has no description.`, 'Add a description.', n.nodeId, undefined));
      }
      if (!n.tags || n.tags.length === 0) {
        warnings.push(createIssue('NODE_NO_TAGS', 'warning', 'A node has no tags.', `Node ${n.nodeId} (${n.code}) has no tags.`, 'Consider adding tags.', n.nodeId, undefined));
      }
    }

    const fingerprint = computeFingerprint(version, nodes, edges);
    return {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      checkedVersionId: versionId,
      checkedRevision: version.revision,
      graphFingerprint: fingerprint,
      checkedAt: this.clock.now(),
    };
  }

  detectContainsCycle(nodes: CurriculumGraphNode[], edges: CurriculumGraphEdge[]): ValidationIssue | null {
    const containsEdges = edges.filter(e => e.edgeType === 'contains');
    const adj = new Map<string, string[]>();
    const nodeIds = new Set(nodes.map(n => n.nodeId));
    for (const nid of nodeIds) adj.set(nid, []);
    for (const ce of containsEdges) {
      if (nodeIds.has(ce.fromNodeId) && nodeIds.has(ce.toNodeId)) {
        adj.get(ce.fromNodeId)!.push(ce.toNodeId);
      }
    }
    const cycle = this.findCycle(adj, nodeIds);
    if (cycle) {
      return createIssue(
        CurriculumGraphErrorCodes.HIERARCHY_CYCLE, 'error',
        'The curriculum hierarchy contains a cycle.',
        `Contains cycle detected: ${cycle.join(' -> ')}`,
        'Remove the edge creating the cycle.',
        cycle[0], undefined,
      );
    }
    return null;
  }

  detectPrerequisiteCycle(nodes: CurriculumGraphNode[], edges: CurriculumGraphEdge[]): ValidationIssue | null {
    const prereqEdges = edges.filter(e => e.edgeType === 'prerequisite_of');
    const adj = new Map<string, string[]>();
    const nodeIds = new Set(nodes.map(n => n.nodeId));
    for (const nid of nodeIds) adj.set(nid, []);
    for (const pe of prereqEdges) {
      if (nodeIds.has(pe.fromNodeId) && nodeIds.has(pe.toNodeId)) {
        adj.get(pe.fromNodeId)!.push(pe.toNodeId);
      }
    }
    const cycle = this.findCycle(adj, nodeIds);
    if (cycle) {
      return createIssue(
        CurriculumGraphErrorCodes.PREREQUISITE_CYCLE, 'error',
        'The prerequisite graph contains a cycle.',
        `Prerequisite cycle detected: ${cycle.join(' -> ')}`,
        'Remove the edge creating the cycle.',
        cycle[0], undefined,
      );
    }
    return null;
  }

  private findCycle(adj: Map<string, string[]>, nodeIds: Set<string>): string[] | null {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    const parent = new Map<string, string | null>();
    for (const nid of nodeIds) color.set(nid, WHITE);

    let cyclePath: string[] | null = null;

    function dfs(u: string, path: string[]) {
      if (cyclePath) return;
      color.set(u, GRAY);
      path.push(u);
      for (const v of adj.get(u) || []) {
        if (!color.has(v)) continue;
        if (color.get(v) === GRAY) {
          const cycleStart = path.indexOf(v);
          if (cycleStart >= 0) {
            cyclePath = [...path.slice(cycleStart), v];
          }
          return;
        }
        if (color.get(v) === WHITE) {
          parent.set(v, u);
          dfs(v, path);
        }
      }
      path.pop();
      color.set(u, BLACK);
    }

    for (const nid of nodeIds) {
      if (color.get(nid) === WHITE) {
        dfs(nid, []);
        if (cyclePath) return cyclePath;
      }
    }
    return null;
  }

  hasCycle(nodes: CurriculumGraphNode[], edges: CurriculumGraphEdge[], edgeType: string): boolean {
    const filtered = edges.filter(e => e.edgeType === edgeType);
    return this.findCycleInner(nodes, filtered) !== null;
  }

  private findCycleInner(nodes: CurriculumGraphNode[], edges: CurriculumGraphEdge[]): string[] | null {
    const adj = new Map<string, string[]>();
    const nodeIds = new Set(nodes.map(n => n.nodeId));
    for (const nid of nodeIds) adj.set(nid, []);
    for (const e of edges) {
      if (nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId)) {
        adj.get(e.fromNodeId)!.push(e.toNodeId);
      }
    }
    return this.findCycle(adj, nodeIds);
  }

  checkEdgeForCycle(
    nodes: CurriculumGraphNode[],
    edges: CurriculumGraphEdge[],
    newEdge: CurriculumGraphEdge,
  ): CurriculumGraphError | null {
    const et = newEdge.edgeType;
    const filteredTypes = et === 'contains' ? ['contains'] : ['prerequisite_of'];
    const combined = [...edges.filter(e => filteredTypes.includes(e.edgeType)), newEdge];
    const cyclePath = et === 'contains'
      ? this.findCycleInner(nodes, combined)
      : this.findCycleInner(nodes, combined);

    if (cyclePath) {
      const code = et === 'contains'
        ? CurriculumGraphErrorCodes.HIERARCHY_CYCLE
        : CurriculumGraphErrorCodes.PREREQUISITE_CYCLE;
      const label = et === 'contains' ? 'hierarchy' : 'prerequisite';
      return {
        code,
        studentSafeMessage: `This edge would create a ${label} cycle.`,
        internalMessage: `${label} cycle detected: ${cyclePath.join(' -> ')}`,
        requestId: '',
        correlationId: '',
        retryable: false,
        reasonCodes: [`${label}_cycle`],
      };
    }
    return null;
  }
}
