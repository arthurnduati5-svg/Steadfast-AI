import { describe, it, expect } from 'vitest';
import {
  CurriculumGraphErrorCodes,
  CurriculumGraphNodeType,
  CurriculumGraphEdgeType,
  CurriculumGraphVersionStatus,
  CognitiveDemand,
  DemonstrationType,
} from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Knowledge Graph Contracts', () => {
  it('should export all supported node types', () => {
    const types: CurriculumGraphNodeType[] = [
      'curriculum_root', 'subject', 'grade_level', 'strand', 'unit',
      'topic', 'subtopic', 'concept', 'skill', 'learning_objective',
    ];
    expect(types).toContain('curriculum_root');
    expect(types).toContain('subject');
    expect(types).toContain('grade_level');
    expect(types).toContain('strand');
    expect(types).toContain('unit');
    expect(types).toContain('topic');
    expect(types).toContain('subtopic');
    expect(types).toContain('concept');
    expect(types).toContain('skill');
    expect(types).toContain('learning_objective');
    expect(types.length).toBe(10);
  });

  it('should export all supported edge types', () => {
    const types: CurriculumGraphEdgeType[] = [
      'contains', 'prerequisite_of', 'builds_on',
      'objective_targets_concept', 'objective_develops_skill', 'related_to',
    ];
    expect(types).toContain('contains');
    expect(types).toContain('prerequisite_of');
    expect(types).toContain('builds_on');
    expect(types).toContain('objective_targets_concept');
    expect(types).toContain('objective_develops_skill');
    expect(types).toContain('related_to');
    expect(types.length).toBe(6);
  });

  it('should export all lifecycle states', () => {
    const statuses: CurriculumGraphVersionStatus[] = [
      'draft', 'under_review', 'approved', 'active', 'superseded', 'archived',
    ];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('under_review');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('active');
    expect(statuses).toContain('superseded');
    expect(statuses).toContain('archived');
    expect(statuses.length).toBe(6);
  });

  it('should export all error codes', () => {
    const codes = Object.values(CurriculumGraphErrorCodes);
    expect(codes).toContain('CURRICULUM_GRAPH_SCHOOL_CONTEXT_REQUIRED');
    expect(codes).toContain('CURRICULUM_GRAPH_ROLE_FORBIDDEN');
    expect(codes).toContain('CURRICULUM_GRAPH_NOT_FOUND');
    expect(codes).toContain('CURRICULUM_GRAPH_VERSION_NOT_EDITABLE');
    expect(codes).toContain('CURRICULUM_GRAPH_INVALID_LIFECYCLE_TRANSITION');
    expect(codes).toContain('CURRICULUM_GRAPH_STALE_REVISION');
    expect(codes).toContain('CURRICULUM_GRAPH_IDEMPOTENCY_CONFLICT');
    expect(codes).toContain('CURRICULUM_GRAPH_DUPLICATE_NODE_CODE');
    expect(codes).toContain('CURRICULUM_GRAPH_DUPLICATE_EDGE');
    expect(codes).toContain('CURRICULUM_GRAPH_INVALID_EDGE_ENDPOINT');
    expect(codes).toContain('CURRICULUM_GRAPH_INVALID_EDGE_TYPE');
    expect(codes).toContain('CURRICULUM_GRAPH_CROSS_SCHOOL_REFERENCE');
    expect(codes).toContain('CURRICULUM_GRAPH_CROSS_VERSION_REFERENCE');
    expect(codes).toContain('CURRICULUM_GRAPH_SELF_EDGE');
    expect(codes).toContain('CURRICULUM_GRAPH_HIERARCHY_CYCLE');
    expect(codes).toContain('CURRICULUM_GRAPH_PREREQUISITE_CYCLE');
    expect(codes).toContain('CURRICULUM_GRAPH_ORPHAN_NODE');
    expect(codes).toContain('CURRICULUM_GRAPH_MULTIPLE_PARENTS');
    expect(codes).toContain('CURRICULUM_GRAPH_NODE_HAS_RELATIONSHIPS');
    expect(codes).toContain('CURRICULUM_GRAPH_OBJECTIVE_INCOMPLETE');
    expect(codes).toContain('CURRICULUM_GRAPH_OBJECTIVE_UNMAPPED');
    expect(codes).toContain('CURRICULUM_GRAPH_VALIDATION_FAILED');
    expect(codes).toContain('CURRICULUM_GRAPH_ACTIVE_VERSION_CONFLICT');
    expect(codes).toContain('CURRICULUM_GRAPH_DEPTH_LIMIT_INVALID');
    expect(codes.length).toBe(25);
  });

  it('should export cognitive demand values', () => {
    const demands: CognitiveDemand[] = [
      'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', 'mixed',
    ];
    expect(demands).toContain('remember');
    expect(demands).toContain('understand');
    expect(demands).toContain('apply');
    expect(demands).toContain('analyze');
    expect(demands).toContain('evaluate');
    expect(demands).toContain('create');
    expect(demands).toContain('mixed');
    expect(demands.length).toBe(7);
  });

  it('should export demonstration types', () => {
    const types: DemonstrationType[] = [
      'recall', 'explanation', 'worked_procedure', 'application',
      'problem_solving', 'teach_back', 'observation', 'reflection', 'transfer',
    ];
    expect(types.length).toBe(9);
    expect(types).toContain('recall');
    expect(types).toContain('explanation');
    expect(types).toContain('transfer');
  });

  it('should have all command discriminators defined', () => {
    const discriminators = [
      'CreateCurriculumGraphVersion',
      'CreateSuccessorCurriculumGraphVersion',
      'AddCurriculumNode',
      'UpdateCurriculumNode',
      'RemoveCurriculumNode',
      'AddCurriculumEdge',
      'RemoveCurriculumEdge',
      'SubmitCurriculumGraphForReview',
      'ReturnCurriculumGraphToDraft',
      'ApproveCurriculumGraphVersion',
      'ActivateCurriculumGraphVersion',
      'SupersedeCurriculumGraphVersion',
      'ArchiveCurriculumGraphVersion',
      'ValidateCurriculumGraphVersion',
    ];
    expect(discriminators.length).toBe(14);
  });

  it('should have all query discriminators defined', () => {
    const queries = [
      'GetActiveVersion',
      'GetVersion',
      'ListVersions',
      'GetNode',
      'GetChildren',
      'GetAncestors',
      'GetDescendants',
      'GetDirectPrerequisites',
      'GetTransitivePrerequisites',
      'GetDirectDependents',
      'GetTransitiveDependents',
      'GetConceptMap',
      'GetObjectiveMap',
      'ResolveStructuralLearningPath',
      'AnalyzeCurriculumChangeImpact',
      'GetStudentSafeCurriculumGraph',
      'GetStaffSafeCurriculumGraph',
    ];
    expect(queries.length).toBe(17);
  });
});
