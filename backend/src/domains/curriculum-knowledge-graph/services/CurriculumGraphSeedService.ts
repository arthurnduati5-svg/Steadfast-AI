import type {
  CurriculumGraphActorContext,
  CreateCurriculumGraphVersionCommand,
  AddCurriculumNodeCommand,
  AddCurriculumEdgeCommand,
  CurriculumGraphCommandResult,
  CurriculumGraphFailureResult,
  CurriculumGraphVersion,
  CurriculumGraphNode,
  CurriculumGraphSeedSummary,
  LearningObjectiveMetadata,
  CurriculumGraphNodeType,
  CurriculumGraphEdgeType,
} from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphCommandService } from './CurriculumGraphCommandService';
import type { CurriculumKnowledgeGraphRepository } from '../repository/CurriculumKnowledgeGraphRepository';
import type { Clock, IdGenerator } from './CurriculumGraphDependencies';

export class CurriculumGraphSeedService {
  constructor(
    private commandService: CurriculumGraphCommandService,
    private repository: CurriculumKnowledgeGraphRepository,
    private clock: Clock,
    private idGen: IdGenerator,
  ) {}

  seedSchoolA(actor: CurriculumGraphActorContext): CurriculumGraphSeedSummary {
    return this.seedSchool(actor, 'seed-general-curriculum', false);
  }

  seedSchoolB(actor: CurriculumGraphActorContext): CurriculumGraphSeedSummary {
    return this.seedSchool(actor, 'seed-general-curriculum', true);
  }

  private seedSchool(actor: CurriculumGraphActorContext, curriculumKey: string, isSchoolB: boolean): CurriculumGraphSeedSummary {
    const schoolId = actor.schoolId;
    const prefix = isSchoolB ? 'b' : 'a';
    const seedKey = `seed-${schoolId}-${curriculumKey}-${prefix}`;
    const now = this.clock.now();

    const v1IdempotencyKey = `${seedKey}-v1`;
    const existingV1Result = this.repository.getCommandResult(schoolId, 'CreateCurriculumGraphVersion', v1IdempotencyKey);
    const isReplay = !!existingV1Result;

    const makeBase = (key: string) => ({
      commandId: `${seedKey}-${key}`,
      idempotencyKey: `${seedKey}-${key}`,
      requestHash: `${seedKey}-${key}`,
      expectedRevision: 1,
      actor,
      occurredAt: now,
      correlationId: `seed-${schoolId}`,
    });

    const createV1Cmd: CreateCurriculumGraphVersionCommand = {
      ...makeBase('v1'),
      commandType: 'CreateCurriculumGraphVersion',
      curriculumKey,
      title: isSchoolB ? 'School B General Curriculum' : 'General Curriculum v1',
      description: 'Standard curriculum foundation',
      metadata: {},
    };

    const v1Result = this.commandService.execute(createV1Cmd);
    if (!v1Result.success) {
      return {
        schoolId, curriculumKey,
        activeVersionId: '', draftSuccessorVersionId: undefined,
        versionsCreated: 0, nodesCreated: 0, edgesCreated: 0,
        replayed: isReplay, idempotent: isReplay,
      };
    }

    const versionCreatedResult = v1Result as Extract<CurriculumGraphCommandResult, { version: CurriculumGraphVersion }>;
    const v1 = versionCreatedResult.version;
    let nodeCount = 0;
    let edgeCount = 0;

    const onSuccess = isReplay ? () => {} : () => {};

    const addNode = (
      nt: CurriculumGraphNodeType, code: string, title: string,
      seq: number, visible: boolean = true, loMeta?: LearningObjectiveMetadata,
    ) => {
      const cmd: AddCurriculumNodeCommand = {
        ...makeBase(`n${code}`),
        expectedRevision: v1.revision,
        commandType: 'AddCurriculumNode',
        versionId: v1.versionId,
        nodeType: nt,
        code,
        title,
        description: `${title} description`,
        sequence: seq,
        tags: [nt],
        studentVisible: visible,
        metadata: {},
        learningObjectiveMetadata: loMeta,
      };
      const r = this.commandService.execute(cmd);
      if (r.success && !isReplay) {
        nodeCount++;
        const nodeResult = r as Extract<CurriculumGraphCommandResult, { versionRevision: number }>;
        v1.revision = nodeResult.versionRevision;
      }
      return r;
    };

    const addEdge = (
      et: CurriculumGraphEdgeType, fromCode: string, toCode: string,
      seq: number, required: boolean = true, rationale: string = '',
    ) => {
      const nodes = this.repository.listNodes(schoolId, v1.versionId);
      const from = nodes.find((n: CurriculumGraphNode) => n.code === fromCode);
      const to = nodes.find((n: CurriculumGraphNode) => n.code === toCode);
      if (!from || !to) return null;
      const cmd: AddCurriculumEdgeCommand = {
        ...makeBase(`e${fromCode}to${toCode}`),
        expectedRevision: v1.revision,
        commandType: 'AddCurriculumEdge',
        versionId: v1.versionId,
        edgeType: et,
        fromNodeId: from.nodeId,
        toNodeId: to.nodeId,
        sequence: seq,
        required,
        rationale: rationale || `${fromCode} -> ${toCode}`,
        metadata: {},
      };
      const r = this.commandService.execute(cmd);
      if (r.success && !isReplay) {
        edgeCount++;
        const edgeResult = r as Extract<CurriculumGraphCommandResult, { versionRevision: number }>;
        v1.revision = edgeResult.versionRevision;
      }
      return r;
    };

    addNode('curriculum_root', 'ROOT', 'Curriculum Root', 0, false);

    if (isSchoolB) {
      addNode('subject', 'SUBJ-MATH', 'Mathematics', 1);
      addNode('subject', 'SUBJ-SCI', 'Science', 2);
      addNode('grade_level', 'G9', 'Grade 9', 1);
      addNode('topic', 'ALG', 'Algebra', 1);
      addNode('topic', 'GEO', 'Geometry', 2);
      addNode('concept', 'VAR', 'Variables', 1);
      addNode('concept', 'EQ', 'Equations', 2);
      addNode('skill', 'SOLVE-EQ', 'Solve Equations', 1);
      addNode('learning_objective', 'LO-SOLVE', 'Solve linear equations', 1, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Solve linear equations',
        successCriteria: ['Correctly isolate variable', 'Verify solution'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['worked_procedure', 'application'],
        mandatory: true,
        estimatedComplexity: 2,
        teacherGuidance: 'Guide through inverse operations',
        studentSafeStatement: 'I can solve linear equations step by step.',
      });
      addNode('concept', 'FORCES', 'Forces', 3);
      addNode('concept', 'MOTION', 'Motion', 4);
      addNode('learning_objective', 'LO-FORCE', 'Understand forces and motion', 2, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Describe forces and motion',
        successCriteria: ['Define force', 'Explain Newton\'s laws'],
        cognitiveDemand: 'understand',
        demonstrationTypes: ['recall', 'explanation'],
        mandatory: true,
        estimatedComplexity: 2,
        teacherGuidance: 'Use real-world examples',
        studentSafeStatement: 'I can explain how forces affect motion.',
      });

      addEdge('contains', 'ROOT', 'SUBJ-MATH', 1);
      addEdge('contains', 'ROOT', 'SUBJ-SCI', 2);
      addEdge('contains', 'SUBJ-MATH', 'G9', 1);
      addEdge('contains', 'G9', 'ALG', 1);
      addEdge('contains', 'G9', 'GEO', 2);
      addEdge('contains', 'ALG', 'VAR', 1);
      addEdge('contains', 'ALG', 'EQ', 2);
      addEdge('contains', 'EQ', 'SOLVE-EQ', 1);
      addEdge('contains', 'SOLVE-EQ', 'LO-SOLVE', 1);
      addEdge('contains', 'SUBJ-SCI', 'G9', 3);
      addEdge('contains', 'G9', 'FORCES', 3);
      addEdge('contains', 'G9', 'MOTION', 4);
      addEdge('contains', 'FORCES', 'LO-FORCE', 1);

      addEdge('prerequisite_of', 'VAR', 'EQ', 1);
      addEdge('prerequisite_of', 'EQ', 'SOLVE-EQ', 2);
      addEdge('prerequisite_of', 'SOLVE-EQ', 'LO-SOLVE', 3);

      addEdge('objective_targets_concept', 'LO-SOLVE', 'VAR', 1);
      addEdge('objective_targets_concept', 'LO-SOLVE', 'EQ', 2);
      addEdge('objective_develops_skill', 'LO-SOLVE', 'SOLVE-EQ', 1);
      addEdge('objective_targets_concept', 'LO-FORCE', 'FORCES', 1);
      addEdge('objective_targets_concept', 'LO-FORCE', 'MOTION', 2);
    } else {
      addNode('subject', 'MATH', 'Mathematics', 1);
      addNode('subject', 'SCIENCE', 'Science', 2);
      addNode('grade_level', 'GR9', 'Grade 9', 1);
      addNode('grade_level', 'GR10', 'Grade 10', 2);

      addNode('strand', 'NUM', 'Number', 1);
      addNode('strand', 'ALG', 'Algebra', 2);
      addNode('unit', 'NUM-UNIT', 'Number Operations', 1);
      addNode('unit', 'ALG-UNIT', 'Algebraic Foundations', 2);
      addNode('topic', 'FRAC', 'Fractions', 1);
      addNode('topic', 'DEC', 'Decimals', 2);
      addNode('topic', 'VAR', 'Variables', 3);
      addNode('topic', 'EQ', 'Equations', 4);
      addNode('subtopic', 'FRAC-ADD', 'Adding Fractions', 1);
      addNode('subtopic', 'DEC-ADD', 'Adding Decimals', 2);

      addNode('concept', 'NUM-CON', 'Number Concepts', 1);
      addNode('concept', 'FRAC-CON', 'Fraction Concepts', 2);
      addNode('concept', 'DEC-CON', 'Decimal Concepts', 3);
      addNode('concept', 'VAR-CON', 'Variable Concepts', 4);
      addNode('concept', 'EQ-CON', 'Equation Concepts', 5);
      addNode('concept', 'FUNC-CON', 'Function Concepts', 6);

      addNode('skill', 'ADD-FRAC', 'Add Fractions', 1);
      addNode('skill', 'ADD-DEC', 'Add Decimals', 2);
      addNode('skill', 'SOLVE-EQ', 'Solve Equations', 3);
      addNode('skill', 'GRAPH-FUNC', 'Graph Functions', 4);

      addNode('learning_objective', 'LO-FRAC', 'Understand fraction addition', 1, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Add fractions with unlike denominators',
        successCriteria: ['Find common denominator', 'Add numerators', 'Simplify result'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['worked_procedure', 'application'],
        mandatory: true,
        estimatedComplexity: 2,
        teacherGuidance: 'Use visual fraction models',
        studentSafeStatement: 'I can add fractions with different denominators.',
      });
      addNode('learning_objective', 'LO-DEC', 'Understand decimal addition', 2, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Add decimal numbers accurately',
        successCriteria: ['Align decimal points', 'Add correctly', 'Place decimal point'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['worked_procedure', 'application'],
        mandatory: true,
        estimatedComplexity: 2,
        teacherGuidance: 'Emphasize place value alignment',
        studentSafeStatement: 'I can add decimal numbers correctly.',
      });
      addNode('learning_objective', 'LO-VAR', 'Understand variable expressions', 3, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Evaluate algebraic expressions',
        successCriteria: ['Identify variables', 'Substitute values', 'Compute result'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['worked_procedure', 'problem_solving'],
        mandatory: true,
        estimatedComplexity: 3,
        teacherGuidance: 'Start with concrete examples',
        studentSafeStatement: 'I can evaluate expressions with variables.',
      });
      addNode('learning_objective', 'LO-EQ', 'Solve linear equations', 4, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Solve one-variable linear equations',
        successCriteria: ['Isolate variable', 'Apply inverse operations', 'Verify solution'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['worked_procedure', 'problem_solving', 'teach_back'],
        mandatory: true,
        estimatedComplexity: 3,
        teacherGuidance: 'Balance method and inverse operations',
        studentSafeStatement: 'I can solve linear equations step by step.',
      });
      addNode('learning_objective', 'LO-FUNC', 'Understand functions', 5, true, {
        objectiveType: 'topic',
        expectedOutcome: 'Describe and graph basic functions',
        successCriteria: ['Define function', 'Create input-output table', 'Plot points'],
        cognitiveDemand: 'understand',
        demonstrationTypes: ['explanation', 'application'],
        mandatory: false,
        estimatedComplexity: 3,
        teacherGuidance: 'Use real-world function examples',
        studentSafeStatement: 'I can explain what a function is and graph simple ones.',
      });
      addNode('learning_objective', 'LO-NUM', 'Apply number operations', 6, true, {
        objectiveType: 'subject',
        expectedOutcome: 'Apply arithmetic operations correctly',
        successCriteria: ['Add, subtract, multiply, divide', 'Order of operations', 'Work with negatives'],
        cognitiveDemand: 'apply',
        demonstrationTypes: ['recall', 'worked_procedure', 'problem_solving'],
        mandatory: true,
        estimatedComplexity: 2,
        teacherGuidance: 'Reinforce order of operations',
        studentSafeStatement: 'I can use the four operations correctly with integers.',
      });

      addEdge('contains', 'ROOT', 'MATH', 1);
      addEdge('contains', 'ROOT', 'SCIENCE', 2);
      addEdge('contains', 'MATH', 'GR9', 1);
      addEdge('contains', 'MATH', 'GR10', 2);
      addEdge('contains', 'GR9', 'NUM', 1);
      addEdge('contains', 'GR9', 'ALG', 2);
      addEdge('contains', 'NUM', 'NUM-UNIT', 1);
      addEdge('contains', 'ALG', 'ALG-UNIT', 2);
      addEdge('contains', 'NUM-UNIT', 'FRAC', 1);
      addEdge('contains', 'NUM-UNIT', 'DEC', 2);
      addEdge('contains', 'ALG-UNIT', 'VAR', 3);
      addEdge('contains', 'ALG-UNIT', 'EQ', 4);
      addEdge('contains', 'FRAC', 'FRAC-ADD', 1);
      addEdge('contains', 'FRAC', 'FRAC-CON', 1);
      addEdge('contains', 'DEC', 'DEC-ADD', 2);
      addEdge('contains', 'DEC', 'DEC-CON', 2);
      addEdge('contains', 'NUM-UNIT', 'NUM-CON', 3);
      addEdge('contains', 'VAR', 'VAR-CON', 1);
      addEdge('contains', 'EQ', 'EQ-CON', 1);
      addEdge('contains', 'VAR', 'FUNC-CON', 2);
      addEdge('contains', 'EQ', 'SOLVE-EQ', 1);
      addEdge('contains', 'EQ', 'LO-EQ', 1);
      addEdge('contains', 'FRAC-ADD', 'LO-FRAC', 1);
      addEdge('contains', 'DEC-ADD', 'LO-DEC', 1);
      addEdge('contains', 'FRAC', 'ADD-FRAC', 2);
      addEdge('contains', 'DEC', 'ADD-DEC', 3);
      addEdge('contains', 'VAR', 'LO-VAR', 1);
      addEdge('contains', 'VAR', 'LO-FUNC', 1);
      addEdge('contains', 'NUM-UNIT', 'LO-NUM', 1);
      addEdge('contains', 'VAR', 'GRAPH-FUNC', 1);

      addEdge('prerequisite_of', 'NUM-CON', 'FRAC-CON', 1);
      addEdge('prerequisite_of', 'FRAC-CON', 'DEC-CON', 2);
      addEdge('prerequisite_of', 'DEC-CON', 'VAR-CON', 3);
      addEdge('prerequisite_of', 'VAR-CON', 'EQ-CON', 4);
      addEdge('prerequisite_of', 'EQ-CON', 'FUNC-CON', 5);
      addEdge('prerequisite_of', 'LO-NUM', 'LO-FRAC', 1);
      addEdge('prerequisite_of', 'LO-FRAC', 'LO-DEC', 2);
      addEdge('prerequisite_of', 'LO-DEC', 'LO-VAR', 3);
      addEdge('prerequisite_of', 'LO-VAR', 'LO-EQ', 4);
      addEdge('prerequisite_of', 'LO-EQ', 'LO-FUNC', 5);
      addEdge('prerequisite_of', 'ADD-FRAC', 'ADD-DEC', 1);
      addEdge('prerequisite_of', 'ADD-DEC', 'SOLVE-EQ', 2);

      addEdge('objective_targets_concept', 'LO-FRAC', 'FRAC-CON', 1);
      addEdge('objective_targets_concept', 'LO-DEC', 'DEC-CON', 1);
      addEdge('objective_targets_concept', 'LO-VAR', 'VAR-CON', 1);
      addEdge('objective_targets_concept', 'LO-EQ', 'EQ-CON', 1);
      addEdge('objective_targets_concept', 'LO-FUNC', 'FUNC-CON', 1);
      addEdge('objective_targets_concept', 'LO-NUM', 'NUM-CON', 1);
      addEdge('objective_develops_skill', 'LO-FRAC', 'ADD-FRAC', 1);
      addEdge('objective_develops_skill', 'LO-DEC', 'ADD-DEC', 1);
      addEdge('objective_develops_skill', 'LO-EQ', 'SOLVE-EQ', 1);
      addEdge('objective_develops_skill', 'LO-FUNC', 'GRAPH-FUNC', 1);

      addEdge('related_to', 'FRAC-CON', 'DEC-CON', 1, false, 'Related numeric concepts');
      addEdge('related_to', 'VAR-CON', 'FUNC-CON', 2, false, 'Variables relate to functions');
    }

    const v1Submit = this.commandService.execute({
      ...makeBase('v1-submit'),
      expectedRevision: v1.revision,
      commandType: 'SubmitCurriculumGraphForReview',
      versionId: v1.versionId,
    });
    if (v1Submit.success && !isReplay) {
      const submitResult = v1Submit as Extract<CurriculumGraphCommandResult, { version: CurriculumGraphVersion }>;
      v1.revision = submitResult.version.revision;
    }

    const v1Approve = this.commandService.execute({
      ...makeBase('v1-approve'),
      expectedRevision: v1.revision,
      commandType: 'ApproveCurriculumGraphVersion',
      versionId: v1.versionId,
    });
    if (v1Approve.success && !isReplay) {
      const approveResult = v1Approve as Extract<CurriculumGraphCommandResult, { version: CurriculumGraphVersion }>;
      v1.revision = approveResult.version.revision;
    }

    this.commandService.execute({
      ...makeBase('v1-activate'),
      expectedRevision: v1.revision,
      commandType: 'ActivateCurriculumGraphVersion',
      versionId: v1.versionId,
    });

    let versionsCreated = isReplay ? 0 : 1;
    let draftSuccessorVersionId: string | undefined;

    if (!isSchoolB) {
      const v2Cmd = {
        ...makeBase('v2'),
        commandType: 'CreateSuccessorCurriculumGraphVersion' as const,
        sourceVersionId: v1.versionId,
        title: 'General Curriculum v2 (Draft)',
        description: 'Updated curriculum with changes',
        metadata: {},
      };
      const v2Result = this.commandService.execute(v2Cmd);
      if (v2Result.success) {
        if (!isReplay) {
          versionsCreated++;
        }
        const successorResult = v2Result as Extract<CurriculumGraphCommandResult, { successorVersion: CurriculumGraphVersion }>;
        draftSuccessorVersionId = successorResult.successorVersion.versionId;
      }
    }

    return {
      schoolId,
      curriculumKey,
      activeVersionId: v1.versionId,
      draftSuccessorVersionId,
      versionsCreated,
      nodesCreated: nodeCount,
      edgesCreated: edgeCount,
      replayed: isReplay,
      idempotent: isReplay,
    };
  }
}
